// ZenFeed content script entry point.
// Does nothing on its own; it answers requests from the extension (popup).

(() => {
  if (globalThis.zenFeedContentLoaded) {
    return;
  }
  globalThis.zenFeedContentLoaded = true;

  // Blocks of the last extraction, kept so later steps (ZF-09, ZF-10) can find
  // the DOM elements by block ID. Replaced on every extraction.
  let lastBlocks = new Map();

  function handleExtract() {
    const { blocks, stats } = globalThis.ZenFeedSegmenter.segmentPage();
    lastBlocks = new Map(blocks.map((block) => [block.id, block]));
    return {
      ok: true,
      title: document.title || null,
      url: location.href,
      blocks: globalThis.ZenFeedSegmenter.serializeBlocks(blocks),
      stats,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "zenfeed/extract-blocks") {
      return false;
    }
    try {
      sendResponse(handleExtract());
    } catch (error) {
      console.error("ZenFeed: block extraction failed", error);
      sendResponse({ ok: false, error: "extraction_failed" });
    }
    return false;
  });

  globalThis.zenFeedGetBlock = (id) => lastBlocks.get(id) || null;
})();
