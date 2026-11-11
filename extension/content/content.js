// ZenFeed content script entry point.
// Does nothing on its own; it answers requests from the extension (popup).

(() => {
  if (globalThis.zenFeedContentLoaded) {
    return;
  }
  globalThis.zenFeedContentLoaded = true;

  // Blocks of the last extraction and their analysis results (ZF-09).
  const registry = globalThis.ZenFeedBlockRegistry.createRegistry();
  // Hidden blocks and their boxes (ZF-10). Independent of the extraction, so
  // "Zobrazit vše" also restores blocks hidden before a later extraction.
  const hider = globalThis.ZenFeedHider.createHider(document);

  // Counts content the page adds after an extraction (infinite feeds, "Show
  // more"). It only counts: nothing is analyzed or sent until the user asks
  // again (proposal §4.2). Mutations are handled in batches, and the boxes
  // ZenFeed inserts itself are ignored.
  const NEW_CONTENT_MIN_CHARS = 25;
  const NEW_CONTENT_BATCH_MS = 500;
  let newContent = 0;
  let pendingMutations = [];
  let batchTimer = null;

  function countNewContent() {
    batchTimer = null;
    const mutations = pendingMutations;
    pendingMutations = [];
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE || hider.isOwnNode(node)) {
          continue;
        }
        if ((node.textContent || "").trim().length >= NEW_CONTENT_MIN_CHARS) {
          newContent += 1;
        }
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    pendingMutations.push(...mutations);
    if (batchTimer === null) {
      batchTimer = setTimeout(countNewContent, NEW_CONTENT_BATCH_MS);
    }
  });

  function handleExtract() {
    const { blocks, stats } = globalThis.ZenFeedSegmenter.segmentPage();
    const extractionId = registry.replace(blocks);
    hider.forgetRevealed();
    newContent = 0;
    pendingMutations = [];
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return {
      ok: true,
      extractionId,
      title: document.title || null,
      url: location.href,
      // Page language, used as the default summary language (ZF-30).
      lang: document.documentElement.lang || null,
      // contains: IDs of blocks inside this one; the summary needs them (ZF-30).
      blocks: globalThis.ZenFeedSegmenter.serializeBlocks(blocks)
        .map((block) => ({ ...block, contains: registry.get(block.id).containedIds })),
      stats,
    };
  }

  function handleApplyResults(message) {
    return registry.applyResults(message.extractionId, message.results);
  }

  // Hides the blocks of the current extraction whose result says "hide".
  function handleApplyHiding(message) {
    if (registry.currentExtractionId() === null) {
      return { ok: false, error: "no_extraction" };
    }
    if (message.extractionId !== registry.currentExtractionId()) {
      return { ok: false, error: "stale_extraction" };
    }
    return { ok: true, ...hider.applyHiding(registry.all()), hiddenTotal: hider.hiddenCount() };
  }

  function handleShowAll() {
    return { ok: true, restored: hider.showAll() };
  }

  // extractionId and withResults let a reopened popup hide again without a new analysis.
  function handleStatus() {
    return {
      ok: true,
      hidden: hider.hiddenCount(),
      newContent,
      extractionId: registry.currentExtractionId(),
      withResults: registry.all().filter((entry) => entry.result !== null).length,
    };
  }

  const HANDLERS = {
    "zenfeed/extract-blocks": [handleExtract, "extraction_failed"],
    "zenfeed/apply-results": [handleApplyResults, "apply_failed"],
    "zenfeed/apply-hiding": [handleApplyHiding, "hiding_failed"],
    "zenfeed/show-all": [handleShowAll, "show_all_failed"],
    "zenfeed/status": [handleStatus, "status_failed"],
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const entry = message && HANDLERS[message.type];
    if (!entry) {
      return false;
    }
    const [handler, errorCode] = entry;
    try {
      sendResponse(handler(message));
    } catch (error) {
      console.error(`ZenFeed: ${message.type} failed`, error);
      sendResponse({ ok: false, error: errorCode });
    }
    return false;
  });

  // { block, containsBlocks, result } or null; result is null until a result
  // was applied. containsBlocks > 0 means hiding the block would hide others too.
  globalThis.zenFeedGetBlock = (id) => registry.get(id);
})();
