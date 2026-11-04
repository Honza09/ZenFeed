// ZenFeed block registry (ZF-09).
// Keeps the blocks of the last extraction with their DOM elements and assigns
// analysis results to them by block ID. Block IDs (zf-0, zf-1, ...) are reused
// by every extraction, so each extraction also gets an extraction ID and
// results for an older extraction are rejected instead of landing on the
// wrong element. It never changes the page; hiding is ZF-10.

(() => {
  if (globalThis.ZenFeedBlockRegistry) {
    return;
  }

  // Fields of one /v1/analyze result (docs/API.md).
  const ACTIONS = new Set(["show", "hide", "review"]);
  const TONES = new Set(["neutralni", "toxicky"]);
  const MAX_ID_CHARS = 64;
  const MAX_CATEGORY_CHARS = 64;

  // topic and tone are optional (older backends send only category).
  function isOptionalLabel(value, allowed) {
    if (value === undefined) {
      return true;
    }
    if (allowed) {
      return allowed.has(value);
    }
    return typeof value === "string" && value.length > 0 && value.length <= MAX_CATEGORY_CHARS;
  }

  function isScore(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  }

  function isValidResult(result) {
    return Boolean(
      result
      && typeof result === "object"
      && typeof result.id === "string" && result.id.length > 0 && result.id.length <= MAX_ID_CHARS
      && typeof result.category === "string" && result.category.length > 0
      && result.category.length <= MAX_CATEGORY_CHARS
      && isScore(result.toxicity_score)
      && isScore(result.confidence)
      && ACTIONS.has(result.recommended_action)
      && isOptionalLabel(result.topic)
      && isOptionalLabel(result.tone, TONES),
    );
  }

  // Copies only the known fields, so nothing else from the backend is kept.
  function pickResult(result) {
    return {
      category: result.category,
      topic: result.topic ?? result.category,
      tone: result.tone ?? "neutralni",
      toxicity_score: result.toxicity_score,
      confidence: result.confidence,
      recommended_action: result.recommended_action,
    };
  }

  // A block whose element left the DOM (page re-rendered) must not get a result:
  // ZF-10 would act on an element the user no longer sees.
  function isAttached(block) {
    return block.elements.length > 0 && block.elements.every((element) => element.isConnected);
  }

  // How many other blocks lie inside this block's elements. The segmenter can
  // return a wrapper (e.g. a page-wide <div>) as a short block; hiding it would
  // hide the blocks inside too, so ZF-10 must not hide a block with a count > 0.
  function countContainedBlocks(block, blocks) {
    let count = 0;
    for (const other of blocks) {
      if (other === block) {
        continue;
      }
      const inside = other.elements.some((otherElement) => block.elements.some(
        (element) => element !== otherElement && element.contains(otherElement),
      ));
      if (inside) {
        count += 1;
      }
    }
    return count;
  }

  function defaultExtractionId() {
    return globalThis.crypto.randomUUID();
  }

  function createRegistry(newExtractionId = defaultExtractionId) {
    let extractionId = null;
    let entries = new Map();

    // Replaces the previous extraction; its results are dropped with it.
    function replace(blocks) {
      extractionId = newExtractionId();
      entries = new Map(blocks.map((block) => [
        block.id,
        { block, containsBlocks: countContainedBlocks(block, blocks), result: null },
      ]));
      return extractionId;
    }

    // Returns { ok: true, matched, unknown, invalid, duplicate, detached } or
    // { ok: false, error } with error no_extraction, stale_extraction or invalid_results.
    // Unknown IDs are ignored. A result never overwrites another one from the same call.
    function applyResults(forExtractionId, results) {
      if (extractionId === null) {
        return { ok: false, error: "no_extraction" };
      }
      if (forExtractionId !== extractionId) {
        return { ok: false, error: "stale_extraction" };
      }
      if (!Array.isArray(results)) {
        return { ok: false, error: "invalid_results" };
      }

      const counts = { matched: 0, unknown: 0, invalid: 0, duplicate: 0, detached: 0 };
      const seen = new Set();
      for (const result of results) {
        if (!isValidResult(result)) {
          counts.invalid += 1;
          continue;
        }
        const entry = entries.get(result.id);
        if (!entry) {
          counts.unknown += 1;
          continue;
        }
        if (seen.has(result.id)) {
          counts.duplicate += 1;
          continue;
        }
        seen.add(result.id);
        if (!isAttached(entry.block)) {
          counts.detached += 1;
          continue;
        }
        entry.result = pickResult(result);
        counts.matched += 1;
      }
      return { ok: true, ...counts };
    }

    function get(id) {
      return entries.get(id) || null;
    }

    function currentExtractionId() {
      return extractionId;
    }

    function all() {
      return [...entries.values()];
    }

    return { replace, applyResults, get, all, currentExtractionId };
  }

  globalThis.ZenFeedBlockRegistry = { createRegistry, isValidResult };
})();
