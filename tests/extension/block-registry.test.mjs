// Unit tests for extension/content/block-registry.js with fake DOM elements.
// Run from the repository root: node --test tests/extension/block-registry.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/content/block-registry.js"), "utf8");

function loadRegistryModule() {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedBlockRegistry;
}

// Objects from the vm context have another Object prototype; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

// Minimal stand-in for a DOM element: connected, contains only its children.
function fakeElement(children = []) {
  return {
    isConnected: true,
    children,
    contains(other) {
      return other === this || this.children.some((child) => child.contains(other));
    },
  };
}

function makeBlocks(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `zf-${index}`,
    kind: "article",
    title: null,
    text: `Block ${index}`,
    elements: [fakeElement()],
  }));
}

function makeResult(id, overrides = {}) {
  return {
    id,
    category: "war",
    toxicity_score: 0.2,
    confidence: 0.9,
    recommended_action: "hide",
    ...overrides,
  };
}

function newRegistry() {
  let counter = 0;
  const registry = loadRegistryModule().createRegistry(() => `x${++counter}`);
  return registry;
}

test("every result is assigned to the block with the same ID", () => {
  const registry = newRegistry();
  const blocks = makeBlocks(3);
  const extractionId = registry.replace(blocks);
  const reply = registry.applyResults(extractionId, [makeResult("zf-2"), makeResult("zf-0", { recommended_action: "show" })]);

  assert.deepEqual(plain(reply), { ok: true, matched: 2, unknown: 0, invalid: 0, duplicate: 0, detached: 0 });
  assert.equal(registry.get("zf-0").block, blocks[0]);
  assert.equal(registry.get("zf-0").result.recommended_action, "show");
  assert.equal(registry.get("zf-2").block, blocks[2]);
  assert.equal(registry.get("zf-2").result.recommended_action, "hide");
  assert.equal(registry.get("zf-1").result, null);
});

test("unknown IDs are ignored and counted", () => {
  const registry = newRegistry();
  const extractionId = registry.replace(makeBlocks(2));
  const reply = registry.applyResults(extractionId, [makeResult("zf-0"), makeResult("zf-9"), makeResult("zf-1x")]);
  assert.deepEqual(plain(reply), { ok: true, matched: 1, unknown: 2, invalid: 0, duplicate: 0, detached: 0 });
  assert.equal(registry.get("zf-9"), null);
});

test("results of an older extraction are rejected", () => {
  const registry = newRegistry();
  const first = registry.replace(makeBlocks(2));
  const second = registry.replace(makeBlocks(2));
  assert.notEqual(first, second);

  assert.deepEqual(plain(registry.applyResults(first, [makeResult("zf-0")])), { ok: false, error: "stale_extraction" });
  assert.equal(registry.get("zf-0").result, null);
  assert.deepEqual(plain(registry.applyResults(undefined, [makeResult("zf-0")])), { ok: false, error: "stale_extraction" });
});

test("a new extraction drops the previous results", () => {
  const registry = newRegistry();
  const first = registry.replace(makeBlocks(1));
  registry.applyResults(first, [makeResult("zf-0")]);
  registry.replace(makeBlocks(1));
  assert.equal(registry.get("zf-0").result, null);
});

test("results before any extraction: no_extraction", () => {
  const registry = newRegistry();
  assert.deepEqual(plain(registry.applyResults("x1", [makeResult("zf-0")])), { ok: false, error: "no_extraction" });
});

test("results that are not a list: invalid_results", () => {
  const registry = newRegistry();
  const extractionId = registry.replace(makeBlocks(1));
  for (const results of [undefined, null, {}, "zf-0", { results: [] }]) {
    assert.deepEqual(plain(registry.applyResults(extractionId, results)), { ok: false, error: "invalid_results" });
  }
});

test("invalid results are skipped, valid ones still apply", () => {
  const registry = newRegistry();
  const extractionId = registry.replace(makeBlocks(2));
  const invalid = [
    null,
    "zf-0",
    makeResult(""),
    makeResult(5),
    makeResult("zf-0", { recommended_action: "delete" }),
    makeResult("zf-0", { recommended_action: undefined }),
    makeResult("zf-0", { toxicity_score: 1.5 }),
    makeResult("zf-0", { toxicity_score: -0.1 }),
    makeResult("zf-0", { confidence: "0.9" }),
    makeResult("zf-0", { confidence: Number.NaN }),
    makeResult("zf-0", { category: "" }),
    makeResult("zf-0", { category: "x".repeat(65) }),
    makeResult("x".repeat(65)),
  ];
  const reply = registry.applyResults(extractionId, [...invalid, makeResult("zf-1")]);
  assert.deepEqual(plain(reply), { ok: true, matched: 1, unknown: 0, invalid: invalid.length, duplicate: 0, detached: 0 });
  assert.equal(registry.get("zf-0").result, null);
});

test("a duplicate ID does not overwrite the first result", () => {
  const registry = newRegistry();
  const extractionId = registry.replace(makeBlocks(1));
  const reply = registry.applyResults(extractionId, [
    makeResult("zf-0", { recommended_action: "review" }),
    makeResult("zf-0", { recommended_action: "hide" }),
  ]);
  assert.deepEqual(plain(reply), { ok: true, matched: 1, unknown: 0, invalid: 0, duplicate: 1, detached: 0 });
  assert.equal(registry.get("zf-0").result.recommended_action, "review");
});

test("a block whose element left the page gets no result", () => {
  const registry = newRegistry();
  const blocks = makeBlocks(2);
  blocks[1].elements.push({ ...fakeElement(), isConnected: false });
  const extractionId = registry.replace(blocks);
  const reply = registry.applyResults(extractionId, [makeResult("zf-0"), makeResult("zf-1")]);
  assert.deepEqual(plain(reply), { ok: true, matched: 1, unknown: 0, invalid: 0, duplicate: 0, detached: 1 });
  assert.equal(registry.get("zf-1").result, null);
});

test("a block whose element wraps other blocks is counted", () => {
  const registry = newRegistry();
  const inner = makeBlocks(3);
  // zf-w: a short block whose element is the parent of the other blocks' elements.
  const wrapper = { id: "zf-w", kind: "other", title: null, text: "Menu", elements: [fakeElement(inner.map((block) => block.elements[0]))] };
  registry.replace([wrapper, ...inner]);
  assert.equal(registry.get("zf-w").containsBlocks, 3);
  assert.equal(registry.get("zf-0").containsBlocks, 0);
});

test("only the known result fields are kept", () => {
  const registry = newRegistry();
  const extractionId = registry.replace(makeBlocks(1));
  registry.applyResults(extractionId, [makeResult("zf-0", { id: "zf-0", html: "<b>x</b>", extra: 1 })]);
  assert.deepEqual(plain(registry.get("zf-0").result), {
    category: "war",
    toxicity_score: 0.2,
    confidence: 0.9,
    recommended_action: "hide",
  });
});

test("empty results and an empty page are fine", () => {
  const registry = newRegistry();
  const extractionId = registry.replace([]);
  assert.deepEqual(plain(registry.applyResults(extractionId, [])), { ok: true, matched: 0, unknown: 0, invalid: 0, duplicate: 0, detached: 0 });
  assert.deepEqual(plain(registry.applyResults(extractionId, [makeResult("zf-0")])), { ok: true, matched: 0, unknown: 1, invalid: 0, duplicate: 0, detached: 0 });
});

test("the default extraction ID is random and differs per extraction", () => {
  const context = { crypto: globalThis.crypto };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const registry = context.ZenFeedBlockRegistry.createRegistry();
  const first = registry.replace([]);
  const second = registry.replace([]);
  assert.match(first, /^[0-9a-f-]{36}$/);
  assert.notEqual(first, second);
  assert.equal(registry.currentExtractionId(), second);
});

test("loading the script twice keeps the first copy", () => {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const first = context.ZenFeedBlockRegistry;
  vm.runInNewContext(source, context);
  assert.equal(context.ZenFeedBlockRegistry, first);
});
