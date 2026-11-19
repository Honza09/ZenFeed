import assert from "node:assert/strict";
import { test } from "node:test";

import { compressionRatio, describeRuns, median, percentile } from "./measure-stats.mjs";

test("median of odd and even counts, unsorted input", () => {
  assert.equal(median([300, 100, 200]), 200);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([7]), 7);
});

test("median and percentile ignore missing values and give null for none", () => {
  assert.equal(median([null, 10, undefined, Number.NaN, 30]), 20);
  assert.equal(median([]), null);
  assert.equal(median([null]), null);
  assert.equal(percentile([], 95), null);
});

test("nearest-rank percentile", () => {
  // Three measurements per page (ZF-20): the 95th percentile is the largest.
  assert.equal(percentile([120, 90, 400], 95), 400);
  const hundred = Array.from({ length: 100 }, (_, index) => index + 1);
  assert.equal(percentile(hundred, 95), 95);
  assert.equal(percentile(hundred, 50), 50);
  assert.equal(percentile(hundred, 100), 100);
  assert.equal(percentile([5, 1], 1), 1);
});

test("percentile rejects p outside (0, 100]", () => {
  assert.throws(() => percentile([1, 2], 0), RangeError);
  assert.throws(() => percentile([1, 2], 101), RangeError);
});

test("compression ratio", () => {
  assert.equal(compressionRatio(250, 1000), 0.25);
  assert.equal(compressionRatio(0, 1000), 0);
  assert.equal(compressionRatio(100, 0), null);
  assert.equal(compressionRatio(null, 1000), null);
  assert.equal(compressionRatio(100, undefined), null);
});

test("describeRuns counts only runs that gave a value", () => {
  const rows = describeRuns([
    { hideMs: 100, summaryMs: 900, audioMs: 50, compression: 0.2 },
    { hideMs: 300, summaryMs: null, audioMs: null, compression: null },
    { hideMs: 200, summaryMs: 1100, audioMs: 70, compression: 0.3 },
  ]);
  assert.deepEqual(rows.hideMs, { n: 3, median: 200, p95: 300 });
  assert.deepEqual(rows.summaryMs, { n: 2, median: 1000, p95: 1100 });
  assert.equal(rows.compression.n, 2);
  assert.equal(rows.audioMs.p95, 70);
});
