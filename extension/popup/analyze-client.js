// ZenFeed analyze client (ZF-11, ZF-12).
// Sends the blocks of one extraction to the local backend (/v1/analyze) and
// returns the results. Requests of at most 100 blocks go one after another,
// each with a timeout. A request that fails for a passing reason (network,
// timeout, 5xx) is tried once more. Results of the requests that succeeded are
// kept; the blocks of the requests that failed are returned as failedIds, so
// the popup can leave them visible and offer to send them again. Splitting
// into smaller batches for a hosted model is the backend's job (docs/API.md).

(() => {
  if (globalThis.ZenFeedAnalyzeClient) {
    return;
  }

  // The backend runs locally on the demo machine (docs/rozhodnuti-zf-25.md).
  // manifest.json grants host access to exactly this origin.
  const BACKEND_URL = "http://127.0.0.1:8000";
  // Backend limits (docs/API.md).
  const MAX_BLOCKS_PER_REQUEST = 100;
  const MAX_TITLE_CHARS = 300;
  const REQUEST_TIMEOUT_MS = 15000;
  // One retry per request, after a short pause.
  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 500;
  // A retry can help only with these; 4xx and an invalid body would fail again.
  const RETRYABLE = new Set(["backend_unavailable", "timeout", "backend_error_5xx"]);

  // Only what the backend needs: no URL, page title, cookies or headers.
  function toRequestBlock({ id, kind, title, text }) {
    return { id, kind, text, title: typeof title === "string" ? title.slice(0, MAX_TITLE_CHARS) : null };
  }

  function buildRequests(blocks, preferences) {
    const requests = [];
    for (let start = 0; start < blocks.length; start += MAX_BLOCKS_PER_REQUEST) {
      requests.push({
        blocks: blocks.slice(start, start + MAX_BLOCKS_PER_REQUEST).map(toRequestBlock),
        preferences,
      });
    }
    return requests;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // One attempt. Returns { ok: true, results, modelVersion } or { ok: false, error }.
  // backend_error_5xx is reported to the caller as backend_error.
  async function sendOnce(fetchFn, url, body, timeoutMs) {
    let response;
    try {
      response = await fetchFn(`${url}/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "omit",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("ZenFeed: /v1/analyze request failed", error);
      return { ok: false, error: timedOut ? "timeout" : "backend_unavailable" };
    }
    if (response.status === 504) {
      return { ok: false, error: "timeout" };
    }
    if (!response.ok) {
      return { ok: false, error: response.status >= 500 ? "backend_error_5xx" : "backend_error" };
    }
    let data;
    try {
      data = await response.json();
    } catch {
      return { ok: false, error: "invalid_response" };
    }
    if (!data || !Array.isArray(data.results)) {
      return { ok: false, error: "invalid_response" };
    }
    return { ok: true, results: data.results, modelVersion: typeof data.model_version === "string" ? data.model_version : null };
  }

  async function sendWithRetry(fetchFn, url, body, timeoutMs, retryDelayMs) {
    let reply;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      reply = await sendOnce(fetchFn, url, body, timeoutMs);
      if (reply.ok || !RETRYABLE.has(reply.error) || attempt === MAX_ATTEMPTS) {
        break;
      }
      await wait(retryDelayMs);
    }
    if (!reply.ok && reply.error === "backend_error_5xx") {
      return { ok: false, error: "backend_error" };
    }
    return reply;
  }

  // Returns { ok: true, results, modelVersion, failedIds: [], error: null } when
  // every block got a result, { ok: true, partial: true, results, modelVersion,
  // failedIds, error } when some requests failed, or { ok: false, error,
  // failedIds } when nothing came back. Errors: backend_unavailable (not
  // running, network error), timeout, backend_error (status other than 200) or
  // invalid_response. A block missing from a 200 response counts as failed.
  async function analyzeBlocks(fetchFn, blocks, preferences, {
    url = BACKEND_URL, timeoutMs = REQUEST_TIMEOUT_MS, retryDelayMs = RETRY_DELAY_MS,
  } = {}) {
    const results = [];
    const failedIds = [];
    let modelVersion = null;
    let error = null;
    let serverDown = false;
    for (const body of buildRequests(blocks, preferences)) {
      const sentIds = body.blocks.map((block) => block.id);
      // The server is not running: the remaining requests would fail the same way.
      if (serverDown) {
        failedIds.push(...sentIds);
        continue;
      }
      const reply = await sendWithRetry(fetchFn, url, body, timeoutMs, retryDelayMs);
      if (!reply.ok) {
        error = error || reply.error;
        serverDown = reply.error === "backend_unavailable";
        failedIds.push(...sentIds);
        continue;
      }
      // Each result is validated again by the content script before use.
      results.push(...reply.results);
      modelVersion = reply.modelVersion || modelVersion;
      const answered = new Set(reply.results.map((result) => result && result.id));
      const missing = sentIds.filter((id) => !answered.has(id));
      if (missing.length) {
        error = error || "invalid_response";
        failedIds.push(...missing);
      }
    }
    if (!results.length && failedIds.length) {
      return { ok: false, error, failedIds };
    }
    if (failedIds.length) {
      return { ok: true, partial: true, results, modelVersion, failedIds, error };
    }
    return { ok: true, results, modelVersion, failedIds, error: null };
  }

  globalThis.ZenFeedAnalyzeClient = {
    BACKEND_URL, MAX_BLOCKS_PER_REQUEST, MAX_ATTEMPTS, buildRequests, analyzeBlocks,
  };
})();
