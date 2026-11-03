// ZenFeed bootstrap (ZF-08).
// Injects the content scripts into the active tab only after the user opens the
// popup and clicks, then asks them for the page blocks. Nothing runs on pages
// the user has not acted on, and nothing is sent to the backend here.
// Exposed as ZenFeedBootstrap so the popup and the Node tests share one copy.

(() => {
  if (globalThis.ZenFeedBootstrap) {
    return;
  }

  // Order matters: content.js uses ZenFeedSegmenter.
  const CONTENT_SCRIPTS = ["content/segmenter.js", "content/content.js"];
  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

  function isSupportedUrl(url) {
    if (typeof url !== "string" || !url) {
      return false;
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      return false;
    }
    return !isWebStore(parsed);
  }

  // Chrome blocks scripting in the Web Store even with activeTab.
  function isWebStore(parsed) {
    return parsed.hostname === "chromewebstore.google.com"
      || (parsed.hostname === "chrome.google.com" && parsed.pathname.startsWith("/webstore"));
  }

  // Checks the content script response before the popup uses it.
  function isValidExtraction(response) {
    return Boolean(
      response
      && response.ok === true
      && Array.isArray(response.blocks)
      && response.blocks.every((block) => block && typeof block.id === "string" && typeof block.text === "string"),
    );
  }

  // Returns { ok: true, title, blocks, stats } or { ok: false, error }.
  // Errors: no_tab, no_access, unsupported_page, injection_failed, extraction_failed.
  async function extractActiveTab(chromeApi) {
    const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
    if (!tab || typeof tab.id !== "number") {
      return { ok: false, error: "no_tab" };
    }
    // Chrome hides the URL without the activeTab grant. That is either a page
    // extensions cannot touch (chrome://, about:blank) or a grant dropped
    // because the tab navigated after the icon was clicked; the popup cannot
    // tell which, so the user is asked to click the icon again.
    if (!tab.url) {
      return { ok: false, error: "no_access" };
    }
    if (!isSupportedUrl(tab.url)) {
      return { ok: false, error: "unsupported_page" };
    }

    try {
      await chromeApi.scripting.executeScript({
        target: { tabId: tab.id },
        files: CONTENT_SCRIPTS,
      });
    } catch (error) {
      console.error("ZenFeed: content script injection failed", error);
      return { ok: false, error: "injection_failed" };
    }

    let response;
    try {
      response = await chromeApi.tabs.sendMessage(tab.id, { type: "zenfeed/extract-blocks" });
    } catch (error) {
      console.error("ZenFeed: content script did not answer", error);
      return { ok: false, error: "extraction_failed" };
    }
    if (!isValidExtraction(response)) {
      return { ok: false, error: "extraction_failed" };
    }
    return { ok: true, title: response.title || null, blocks: response.blocks, stats: response.stats || null };
  }

  globalThis.ZenFeedBootstrap = { CONTENT_SCRIPTS, isSupportedUrl, isValidExtraction, extractActiveTab };
})();
