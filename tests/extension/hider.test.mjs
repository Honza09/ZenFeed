// Unit tests for the decision and label logic of extension/content/hider.js.
// DOM behaviour (hiding, boxes, restoring) is tested in a real browser by
// tests/extension/hider-browser.mjs.
// Run from the repository root: node --test tests/extension/hider.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/content/hider.js"), "utf8");

function loadHider() {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedHider;
}

function makeEntry({ result = {}, containsBlocks = 0, tags = ["P"], connected = true } = {}) {
  return {
    block: { id: "zf-0", elements: tags.map((tagName) => ({ tagName, isConnected: connected })) },
    containsBlocks,
    result: result === null ? null : {
      category: "valka", topic: "valka", tone: "neutralni",
      toxicity_score: 0, confidence: 0.8, recommended_action: "hide", ...result,
    },
  };
}

test("only an explicit hide on a plain block is hidden", () => {
  const { hideDecision } = loadHider();
  assert.equal(hideDecision(makeEntry()), "hide");
  assert.equal(hideDecision(makeEntry({ tags: ["H2", "P", "LI", "TR", "ARTICLE", "SECTION"] })), "hide");
});

test("review, show and missing results never hide", () => {
  const { hideDecision } = loadHider();
  assert.equal(hideDecision(makeEntry({ result: { recommended_action: "review" } })), "not_hide");
  assert.equal(hideDecision(makeEntry({ result: { recommended_action: "show" } })), "not_hide");
  assert.equal(hideDecision(makeEntry({ result: null })), "no_result");
});

test("hide without a nameable reason (topic jine, neutral tone) is not hidden", () => {
  const { hideDecision } = loadHider();
  assert.equal(hideDecision(makeEntry({ result: { category: "jine", topic: "jine" } })), "not_hide");
  assert.equal(hideDecision(makeEntry({ result: { category: "jine", topic: "jine", tone: "toxicky" } })), "hide");
});

test("wrappers, detached blocks and table cells are not hidden", () => {
  const { hideDecision } = loadHider();
  assert.equal(hideDecision(makeEntry({ containsBlocks: 3 })), "wrapper");
  assert.equal(hideDecision(makeEntry({ connected: false })), "detached");
  assert.equal(hideDecision(makeEntry({ tags: [] })), "detached");
  assert.equal(hideDecision(makeEntry({ tags: ["TD"] })), "unsupported");
  assert.equal(hideDecision(makeEntry({ tags: ["P", "TH"] })), "unsupported");
});

test("box label names the topic and the toxic tone in Czech", () => {
  const { describeReason } = loadHider();
  assert.equal(describeReason({ topic: "valka", tone: "neutralni" }), "válka");
  assert.equal(describeReason({ topic: "umrti" }), "zprávy o úmrtí");
  assert.equal(describeReason({ category: "katastrofy" }), "katastrofické scénáře");
  assert.equal(describeReason({ topic: "nasili", tone: "toxicky" }), "násilí · toxický/vyhrocený tón");
  assert.equal(describeReason({ topic: "jine", tone: "toxicky" }), "toxický/vyhrocený tón");
  assert.equal(describeReason({ topic: "jine", tone: "neutralni" }), null);
  assert.equal(describeReason({ topic: "unknown-topic" }), null);
});

test("every frozen hide topic has a label (docs/kategorie-mvp.md)", () => {
  const { TOPIC_LABELS } = loadHider();
  assert.deepEqual(Object.keys(TOPIC_LABELS).sort(), ["katastrofy", "nasili", "politicke_konflikty", "umrti", "valka"]);
});

test("the explanation names only what caused the hiding", () => {
  const { explainReason } = loadHider();
  const both = explainReason({ topic: "valka", tone: "toxicky", confidence: 0.834, toxicity_score: 0.9 });
  assert.match(both, /^Téma: válka \(jistota 83 %\)\. Tón: toxický\/vyhrocený \(skóre 90 %\)\./);
  assert.match(both, /může se mýlit/);

  const topicOnly = explainReason({ topic: "umrti", tone: "neutralni", confidence: 0.7, toxicity_score: 0 });
  assert.match(topicOnly, /^Téma: zprávy o úmrtí \(jistota 70 %\)\. Blok/);
  assert.doesNotMatch(topicOnly, /Tón/);

  const toneOnly = explainReason({ topic: "jine", tone: "toxicky", confidence: 0.2, toxicity_score: 0.75 });
  assert.match(toneOnly, /^Tón: toxický\/vyhrocený \(skóre 75 %\)\./);
  assert.doesNotMatch(toneOnly, /Téma/);
});

test("background colors are parsed for the box theme", () => {
  const { parseRgb } = loadHider();
  assert.deepEqual({ ...parseRgb("rgb(255, 255, 255)") }, { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual({ ...parseRgb("rgba(0, 0, 0, 0)") }, { r: 0, g: 0, b: 0, a: 0 });
  assert.equal(parseRgb("transparent"), null);
  assert.equal(parseRgb("color(srgb 1 1 1)"), null);
});

test("loading the script twice keeps the first copy", () => {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const first = context.ZenFeedHider;
  vm.runInNewContext(source, context);
  assert.equal(context.ZenFeedHider, first);
});
