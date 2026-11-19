// Statistics for the ZF-20 measurement mode of popup-e2e.mjs (--measure).
// Pure functions, no browser, so they are unit-tested on their own.

// Median of the finite numbers; null when there are none.
export function median(values) {
  const sorted = finiteSorted(values);
  if (!sorted.length) {
    return null;
  }
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Nearest-rank percentile: the smallest value with at least p % of the values
// at or below it. With 3 measurements the 95th percentile is the largest one.
export function percentile(values, p) {
  const sorted = finiteSorted(values);
  if (!sorted.length) {
    return null;
  }
  if (!(p > 0 && p <= 100)) {
    throw new RangeError("p must be in (0, 100]");
  }
  return sorted[Math.ceil((p / 100) * sorted.length) - 1];
}

// Summary characters per character of text sent for the summary. Lower means
// a shorter summary; null when nothing was sent or nothing came back.
export function compressionRatio(summaryChars, sentChars) {
  // typeof first: in JavaScript null >= 0 is true.
  if (typeof summaryChars !== "number" || typeof sentChars !== "number" || !(sentChars > 0) || !(summaryChars >= 0)) {
    return null;
  }
  return summaryChars / sentChars;
}

// One row per metric: how many runs gave a value, median, 95th percentile.
export function describeRuns(runs) {
  const metrics = ["hideMs", "summaryMs", "audioMs", "compression"];
  return Object.fromEntries(metrics.map((metric) => {
    const values = runs.map((run) => run[metric]);
    return [metric, { n: finiteSorted(values).length, median: median(values), p95: percentile(values, 95) }];
  }));
}

function finiteSorted(values) {
  return values.filter((value) => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
}
