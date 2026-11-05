// ZenFeed analyze client (ZF-11, basic).
// Sends the blocks of one extraction to the local backend (/v1/analyze) and
// returns the results. This is the minimal call the popup needs: requests of
// at most 100 blocks one after another, a timeout per request, no retry. If
// any request fails, no result is returned, so nothing is hidden. Batches of
// 10–20 blocks, retries and keeping partial results are ZF-12.

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

  // Returns { ok: true, results, modelVersion } or { ok: false, error } with
  // backend_unavailable (not running, network error), timeout,
  // backend_error (status other than 200) or invalid_response.
  async function analyzeBlocks(fetchFn, blocks, preferences, { url = BACKEND_URL, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    const results = [];
    let modelVersion = null;
    for (const body of buildRequests(blocks, preferences)) {
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
        return { ok: false, error: "backend_error" };
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
      // Each result is validated again by the content script before use.
      results.push(...data.results);
      modelVersion = typeof data.model_version === "string" ? data.model_version : modelVersion;
    }
    return { ok: true, results, modelVersion };
  }

  globalThis.ZenFeedAnalyzeClient = {
    BACKEND_URL, MAX_BLOCKS_PER_REQUEST, buildRequests, analyzeBlocks,
  };
})();
