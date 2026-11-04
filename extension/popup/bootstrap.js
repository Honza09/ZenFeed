// ZenFeed bootstrap (ZF-08, ZF-09, ZF-10).
// Injects the content scripts into the active tab only after the user opens the
// popup and clicks, then asks them for the page blocks, hands analysis results
// back to them and asks them to hide or show blocks. Nothing runs on pages the user has not acted on, and
// nothing is sent to the backend here.
// Exposed as ZenFeedBootstrap so the popup and the Node tests share one copy.

(() => {
  if (globalThis.ZenFeedBootstrap) {
    return;
  }

  // Order matters: content.js uses ZenFeedSegmenter, ZenFeedBlockRegistry and ZenFeedHider.
  const CONTENT_SCRIPTS = [
    "content/segmenter.js", "content/block-registry.js", "content/hider.js", "content/content.js",
  ];
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
      && typeof response.extractionId === "string" && response.extractionId.length > 0
      && Array.isArray(response.blocks)
      && response.blocks.every((block) => block && typeof block.id === "string" && typeof block.text === "string"),
    );
  }

  // Returns { ok: true, tabId, extractionId, title, blocks, stats } or { ok: false, error }.
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
    return {
      ok: true,
      tabId: tab.id,
      extractionId: response.extractionId,
      title: response.title || null,
      blocks: response.blocks,
      stats: response.stats || null,
    };
  }

  const APPLY_COUNTS = ["matched", "unknown", "invalid", "duplicate", "detached"];
  const APPLY_ERRORS = new Set(["no_extraction", "stale_extraction", "invalid_results", "apply_failed"]);

  function isValidApplyReply(reply) {
    if (!reply || typeof reply !== "object") {
      return false;
    }
    if (reply.ok === false) {
      return APPLY_ERRORS.has(reply.error);
    }
    return reply.ok === true && APPLY_COUNTS.every((key) => Number.isInteger(reply[key]) && reply[key] >= 0);
  }

  // Hands /v1/analyze results to the content script of the extraction they
  // belong to. Returns the content script's counts, or { ok: false, error }
  // with stale_extraction (the page was extracted again in the meantime;
  // analyze again), no_extraction, invalid_results, apply_failed or
  // tab_unavailable (tab closed, navigated or reloaded).
  async function applyResults(chromeApi, tabId, extractionId, results) {
    let reply;
    try {
      reply = await chromeApi.tabs.sendMessage(tabId, { type: "zenfeed/apply-results", extractionId, results });
    } catch (error) {
      // Tab closed or navigated: its content script is gone with its blocks.
      console.error("ZenFeed: content script did not answer", error);
      return { ok: false, error: "tab_unavailable" };
    }
    // No reply or an unexpected shape: do not guess what was applied.
    return isValidApplyReply(reply) ? reply : { ok: false, error: "tab_unavailable" };
  }

  const isCount = (value) => Number.isInteger(value) && value >= 0;
  const HIDING_COUNTS = [
    "hidden", "alreadyHidden", "revealed", "noResult", "notHide", "wrapper", "detached", "unsupported", "failed",
    "hiddenTotal",
  ];

  // Sends one message to the tab's content script and checks the reply with
  // isValid. Closed tab, navigation or an odd reply: tab_unavailable.
  async function askTab(chromeApi, tabId, message, isValid, errors) {
    let reply;
    try {
      reply = await chromeApi.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error("ZenFeed: content script did not answer", error);
      return { ok: false, error: "tab_unavailable" };
    }
    if (reply && reply.ok === false && errors.has(reply.error)) {
      return reply;
    }
    return reply && reply.ok === true && isValid(reply) ? reply : { ok: false, error: "tab_unavailable" };
  }

  // Hides the blocks of this extraction whose result is "hide" (ZF-10).
  // Errors: no_extraction, stale_extraction, hiding_failed, tab_unavailable.
  function applyHiding(chromeApi, tabId, extractionId) {
    return askTab(
      chromeApi, tabId, { type: "zenfeed/apply-hiding", extractionId },
      (reply) => HIDING_COUNTS.every((key) => isCount(reply[key])),
      new Set(["no_extraction", "stale_extraction", "hiding_failed"]),
    );
  }

  // "Zobrazit vše": { ok: true, restored } or { ok: false, error }.
  function showAll(chromeApi, tabId) {
    return askTab(
      chromeApi, tabId, { type: "zenfeed/show-all" },
      (reply) => isCount(reply.restored),
      new Set(["show_all_failed"]),
    );
  }

  // { ok: true, hidden, newContent }: hidden blocks and content added since the
  // last extraction (to offer "analyze again"; nothing is analyzed by itself).
  function getStatus(chromeApi, tabId) {
    return askTab(
      chromeApi, tabId, { type: "zenfeed/status" },
      (reply) => isCount(reply.hidden) && isCount(reply.newContent),
      new Set(["status_failed"]),
    );
  }

  globalThis.ZenFeedBootstrap = {
    CONTENT_SCRIPTS, isSupportedUrl, isValidExtraction, extractActiveTab, applyResults,
    applyHiding, showAll, getStatus,
  };
})();
