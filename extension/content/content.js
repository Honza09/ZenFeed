// ZenFeed content script entry point.
// Does nothing on its own; it answers requests from the extension (popup).

(() => {
  if (globalThis.zenFeedContentLoaded) {
    return;
  }
  globalThis.zenFeedContentLoaded = true;

  // Blocks of the last extraction and their analysis results (ZF-09).
  // ZF-10 finds the DOM elements and results here by block ID.
  const registry = globalThis.ZenFeedBlockRegistry.createRegistry();

  function handleExtract() {
    const { blocks, stats } = globalThis.ZenFeedSegmenter.segmentPage();
    const extractionId = registry.replace(blocks);
    return {
      ok: true,
      extractionId,
      title: document.title || null,
      url: location.href,
      blocks: globalThis.ZenFeedSegmenter.serializeBlocks(blocks),
      stats,
    };
  }

  function handleApplyResults(message) {
    return registry.applyResults(message.extractionId, message.results);
  }

  const HANDLERS = {
    "zenfeed/extract-blocks": [handleExtract, "extraction_failed"],
    "zenfeed/apply-results": [handleApplyResults, "apply_failed"],
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
