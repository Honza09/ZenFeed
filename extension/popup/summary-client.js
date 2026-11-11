// ZenFeed summary client (ZF-30).
// Builds the /v1/summarize request from what is visible after hiding and
// checks the response against the contract in docs/API.md. Hidden text never
// leaves the browser for the summary: only blocks that are not hidden are sent,
// together with the list of topics that were hidden (omitted_categories).

(() => {
  if (globalThis.ZenFeedSummaryClient) {
    return;
  }

  // docs/rozhodnuti-zf-25.md: the backend runs only locally.
  const BACKEND_URL = "http://127.0.0.1:8000";
  // Contract limits (docs/API.md, backend/app/schemas.py).
  const MAX_BLOCKS = 100;
  const MAX_TITLE_CHARS = 300;
  const MAX_SUMMARY_CHARS = 4000;
  const HIDEABLE_TOPICS = ["valka", "politicke_konflikty", "umrti", "katastrofy", "nasili"];
  const LANGUAGES = ["cs", "en"];
  // A summary is slower than classification; the backend itself stops at its own limit.
  const REQUEST_TIMEOUT_MS = 30000;

  // "en" for English pages, "cs" otherwise (the default of the contract).
  function defaultLanguage(pageLang) {
    return typeof pageLang === "string" && /^en\b/i.test(pageLang) ? "en" : "cs";
  }

  // Returns { request, visibleCount, sentCount, wrappersLeftOut } or null when
  // nothing is visible. A visible block that wraps a hidden one (block.contains)
  // is left out too: its text was read before hiding and includes the hidden
  // text. omitted_categories: topics of the hidden blocks; a block hidden only
  // for its tone is covered by preferences.toxicky and adds no topic.
  function buildRequest({ blocks, hiddenIds, results, preferences, language }) {
    const hidden = new Set(hiddenIds);
    const wrapsHidden = (block) => Array.isArray(block.contains) && block.contains.some((id) => hidden.has(id));
    const notHidden = blocks.filter((block) => !hidden.has(block.id));
    const visible = notHidden.filter((block) => !wrapsHidden(block));
    if (!visible.length) {
      return null;
    }
    const topicById = new Map(results.filter(Boolean).map((result) => [result.id, result.topic || result.category]));
    const omitted = HIDEABLE_TOPICS.filter((topic) => preferences[topic] === true
      && [...hidden].some((id) => topicById.get(id) === topic));
    const sent = visible.slice(0, MAX_BLOCKS).map(({ id, kind, title, text }) => ({
      id, kind, text, title: typeof title === "string" ? title.slice(0, MAX_TITLE_CHARS) : null,
    }));
    return {
      request: {
        blocks: sent,
        preferences,
        omitted_categories: omitted,
        language: LANGUAGES.includes(language) ? language : "cs",
      },
      visibleCount: visible.length,
      sentCount: sent.length,
      wrappersLeftOut: notHidden.length - visible.length,
    };
  }

  // The response must match SummaryResponse; anything else is not shown.
  function isValidSummary(data, request) {
    if (!data || typeof data !== "object") {
      return false;
    }
    const flags = data.insufficient_input === true || data.no_relevant_content === true;
    return Boolean(typeof data.summary === "string"
      && data.summary.length <= MAX_SUMMARY_CHARS
      && (flags || data.summary.trim().length > 0)
      && typeof data.insufficient_input === "boolean"
      && typeof data.no_relevant_content === "boolean"
      && typeof data.model_version === "string" && data.model_version.length > 0
      && data.preferences && typeof data.preferences === "object"
      && Array.isArray(data.omitted_categories)
      && data.omitted_categories.every((topic) => HIDEABLE_TOPICS.includes(topic))
      // The panel shows these as what was left out; they must be what we sent.
      && data.omitted_categories.length === request.omitted_categories.length
      && data.omitted_categories.every((topic) => request.omitted_categories.includes(topic)));
  }

  const STATUS_ERRORS = {
    404: "summary_not_served",
    405: "summary_not_served",
    429: "rate_limited",
    503: "summary_unavailable",
    504: "timeout",
  };

  // Returns { ok: true, summary } or { ok: false, error } with
  // summary_not_served (the backend has no /v1/summarize yet, ZF-15),
  // summary_unavailable, rate_limited, timeout, backend_unavailable,
  // backend_error or invalid_response.
  async function summarize(fetchFn, request, { url = BACKEND_URL, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    let response;
    try {
      response = await fetchFn(`${url}/v1/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        credentials: "omit",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("ZenFeed: /v1/summarize request failed", error);
      return { ok: false, error: timedOut ? "timeout" : "backend_unavailable" };
    }
    if (!response.ok) {
      return { ok: false, error: STATUS_ERRORS[response.status] || "backend_error" };
    }
    let data;
    try {
      data = await response.json();
    } catch {
      return { ok: false, error: "invalid_response" };
    }
    return isValidSummary(data, request) ? { ok: true, summary: data } : { ok: false, error: "invalid_response" };
  }

  globalThis.ZenFeedSummaryClient = {
    BACKEND_URL, MAX_BLOCKS, HIDEABLE_TOPICS, defaultLanguage, buildRequest, isValidSummary, summarize,
  };
})();
