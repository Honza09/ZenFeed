// Unit tests for extension/popup/page-quality.js (ZF-28 edge states).
// Run from the repository root: node --test tests/extension/page-quality.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/page-quality.js"), "utf8");

function loadQuality() {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedPageQuality;
}

const plain = (value) => JSON.parse(JSON.stringify(value));

function blocksOf(...lengths) {
  return lengths.map((length, index) => ({ id: `zf-${index}`, kind: "article", title: null, text: "x".repeat(length) }));
}

test("no blocks: skip, nothing is sent", () => {
  const { assessExtraction } = loadQuality();
  assert.deepEqual(plain(assessExtraction([], {})), { mode: "skip", reasons: ["no_content"], notes: [], totalChars: 0 });
});

test("less than 200 characters in total: skip (too_little_text)", () => {
  const { assessExtraction } = loadQuality();
  assert.deepEqual(plain(assessExtraction(blocksOf(115), {})).reasons, ["too_little_text"]);
  assert.deepEqual(plain(assessExtraction(blocksOf(100, 99), {})).mode, "skip");
  assert.equal(assessExtraction(blocksOf(100, 100), {}).mode, "normal");
});

test("a page that is one block: review, nothing hidden automatically", () => {
  const { assessExtraction } = loadQuality();
  assert.deepEqual(plain(assessExtraction(blocksOf(311), {})), { mode: "review", reasons: ["single_block"], notes: [], totalChars: 311 });
});

test("several blocks: normal, also when one block holds most of the text", () => {
  const { assessExtraction } = loadQuality();
  // segmentation.html: the long article holds 68 % of the text; it is still a divided page.
  assert.equal(assessExtraction(blocksOf(1232, 300, 289), {}).mode, "normal");
  assert.equal(assessExtraction(blocksOf(3000, 114), {}).mode, "normal");
});

test("block limit and truncated blocks become notes, not stops", () => {
  const { assessExtraction } = loadQuality();
  const result = assessExtraction(blocksOf(500, 500), { limitReached: true, truncatedBlocks: 2 });
  assert.equal(result.mode, "normal");
  assert.deepEqual(plain(result.notes), ["partial", "truncated"]);
  assert.deepEqual(plain(assessExtraction(blocksOf(500, 500), { limitReached: false, truncatedBlocks: 0 }).notes), []);
  assert.deepEqual(plain(assessExtraction(blocksOf(500, 500), undefined).notes), []);
});

test("nothing left: all or almost all text hidden", () => {
  const { assessOutcome } = loadQuality();
  const blocks = blocksOf(200, 200, 200, 200);
  assert.equal(assessOutcome(blocks, ["zf-0", "zf-1", "zf-2", "zf-3"]).nothingLeft, true);
  // 10 % of the text left
  const mostly = blocksOf(450, 450, 100);
  const outcome = assessOutcome(mostly, ["zf-0", "zf-1"]);
  assert.equal(outcome.nothingLeft, true);
  assert.equal(Math.round(outcome.visibleShare * 100), 10);
});

test("something relevant left: no message", () => {
  const { assessOutcome } = loadQuality();
  const blocks = blocksOf(400, 400, 400, 400);
  assert.equal(assessOutcome(blocks, ["zf-0", "zf-1"]).nothingLeft, false);
  assert.equal(assessOutcome(blocks, []).nothingLeft, false);
  // Under 200 visible characters counts as nothing left even at a higher share.
  assert.equal(assessOutcome(blocksOf(300, 150), ["zf-0"]).nothingLeft, true);
});

test("hide results are counted for review mode", () => {
  const { countMatching } = loadQuality();
  assert.equal(countMatching([
    { recommended_action: "hide" }, { recommended_action: "review" }, { recommended_action: "show" }, null, { recommended_action: "hide" },
  ]), 2);
});

test("loading the script twice keeps the first copy", () => {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const first = context.ZenFeedPageQuality;
  vm.runInNewContext(source, context);
  assert.equal(context.ZenFeedPageQuality, first);
});
