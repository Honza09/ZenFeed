// Test of the status message after "Analyzovat" (ZF-11, B-002).
// describeOutcome lives inside the popup's closure, so its source is cut out of
// popup.js and run on its own: the test checks the real code, not a copy.
// Run from the repository root: node --test tests/extension/popup-status.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/popup.js"), "utf8");
const start = source.indexOf("function describeOutcome(");
const end = source.indexOf("\n  }\n", start) + 4;
assert.ok(start >= 0 && end > start, "describeOutcome not found in popup.js");
const context = {};
vm.runInNewContext(`${source.slice(start, end)}\nglobalThis.describeOutcome = describeOutcome;`, context);
const describeOutcome = context.describeOutcome;

const none = { hidden: 0, alreadyHidden: 0, wrapper: 0, unsupported: 0, failed: 0, hiddenTotal: 0 };
const results = (...actions) => actions.map((recommended_action) => ({ recommended_action }));

test("first analysis: shows what was hidden", () => {
  const text = describeOutcome(23, results("hide", "show"), { ...none, hidden: 1, hiddenTotal: 1 });
  assert.equal(text, "Skryté bloky: 1 z 23.");
});

test("repeated analysis: a block hidden earlier still counts (B-002)", () => {
  // The hidden block is not extracted again: 22 blocks, hidden 0 now, 1 on the page.
  const text = describeOutcome(22, results("show"), { ...none, hiddenTotal: 1 });
  assert.equal(text, "Skryté bloky: 1 z 23.");
  assert.ok(!text.includes("Nic na stránce neodpovídá"));
});

test("repeated analysis with new hits adds earlier and new ones", () => {
  const text = describeOutcome(42, results("hide"), { ...none, hidden: 1, hiddenTotal: 2 });
  assert.equal(text, "Skryté bloky: 2 z 43.");
});

test("nothing matches and nothing is hidden: says so", () => {
  const text = describeOutcome(10, results("show"), none);
  assert.equal(text, "Skryté bloky: 0 z 10. Nic na stránce neodpovídá zvoleným tématům ani tónu.");
});

test("uncertain and unsafe blocks are still reported, no 'nothing matches'", () => {
  const text = describeOutcome(10, results("review"), { ...none, wrapper: 1 });
  assert.equal(text, "Skryté bloky: 0 z 10. Nejisté, ponechané viditelné: 1. Nešlo bezpečně skrýt, ponechané viditelné: 1.");
});
