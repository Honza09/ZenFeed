// Unit tests for extension/popup/summary-client.js (ZF-30) with a fake fetch.
// Run from the repository root: node --test tests/extension/summary-client.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/summary-client.js"), "utf8");

function loadClient() {
  const context = { AbortSignal, console: { error() {} } };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedSummaryClient;
}

const plain = (value) => JSON.parse(JSON.stringify(value));

const PREFS = { valka: true, politicke_konflikty: false, umrti: true, katastrofy: false, nasili: false, toxicky: true };
const BLOCKS = [
  { id: "zf-0", kind: "article", title: "War", text: "SECRET-WAR text about the war." },
  { id: "zf-1", kind: "article", title: "Garden", text: "Visible text about gardens." },
  { id: "zf-2", kind: "comment", title: null, text: "SECRET-TOXIC rude comment." },
  { id: "zf-3", kind: "post", title: "x".repeat(400), text: "Visible text about the weather." },
];
const RESULTS = [
  { id: "zf-0", category: "valka", topic: "valka", tone: "neutralni", recommended_action: "hide" },
  { id: "zf-1", category: "jine", topic: "jine", tone: "neutralni", recommended_action: "show" },
  { id: "zf-2", category: "jine", topic: "jine", tone: "toxicky", recommended_action: "hide" },
  { id: "zf-3", category: "jine", topic: "jine", tone: "neutralni", recommended_action: "show" },
];

function build(overrides = {}) {
  return loadClient().buildRequest({
    blocks: BLOCKS, hiddenIds: ["zf-0", "zf-2"], results: RESULTS, preferences: PREFS, language: "cs", ...overrides,
  });
}

function okSummary(request, overrides = {}) {
  return {
    summary: "Shrnutí viditelného obsahu.",
    preferences: request.preferences,
    omitted_categories: request.omitted_categories,
    insufficient_input: false,
    no_relevant_content: false,
    model_version: "stub",
    ...overrides,
  };
}

const respond = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("only visible blocks are sent; hidden text never leaves the browser", () => {
  const built = build();
  const body = JSON.stringify(built.request);
  assert.deepEqual(plain(built.request.blocks.map((block) => block.id)), ["zf-1", "zf-3"]);
  assert.doesNotMatch(body, /SECRET/);
  assert.equal(built.visibleCount, 2);
  assert.equal(built.sentCount, 2);
});

test("request has exactly the contract fields; titles are cut to 300", () => {
  const { request } = build();
  assert.deepEqual(Object.keys(request).sort(), ["blocks", "language", "omitted_categories", "preferences"]);
  assert.deepEqual(Object.keys(request.blocks[0]).sort(), ["id", "kind", "text", "title"]);
  assert.equal(request.blocks[1].title.length, 300);
  assert.deepEqual(plain(request.preferences), PREFS);
});

test("omitted_categories: topics of hidden blocks only, not the tone-only hide", () => {
  assert.deepEqual(plain(build().request.omitted_categories), ["valka"]);
  // A topic that is hidden but not switched on is never listed (contract: 422).
  const prefsOff = { ...PREFS, valka: false };
  assert.deepEqual(plain(build({ preferences: prefsOff }).request.omitted_categories), []);
  // Nothing hidden: nothing omitted.
  assert.deepEqual(plain(build({ hiddenIds: [] }).request.omitted_categories), []);
});

test("a visible wrapper of a hidden block is left out (its text includes the hidden text)", () => {
  const blocks = [
    { id: "zf-0", kind: "section", title: null, text: "Section intro. SECRET-QUOTE war quote.", contains: ["zf-1"] },
    { id: "zf-1", kind: "other", title: null, text: "SECRET-QUOTE war quote." },
    { id: "zf-2", kind: "section", title: null, text: "Other section. Visible quote.", contains: ["zf-3"] },
    { id: "zf-3", kind: "other", title: null, text: "Visible quote." },
  ];
  const results = [{ id: "zf-1", topic: "valka", recommended_action: "hide" }];
  const built = build({ blocks, hiddenIds: ["zf-1"], results });
  assert.deepEqual(plain(built.request.blocks.map((block) => block.id)), ["zf-2", "zf-3"]);
  assert.doesNotMatch(JSON.stringify(built.request), /SECRET/);
  assert.equal(built.wrappersLeftOut, 1);
  assert.deepEqual(plain(built.request.blocks[0]).contains, undefined);
});

test("nothing visible: no request at all", () => {
  assert.equal(build({ hiddenIds: ["zf-0", "zf-1", "zf-2", "zf-3"] }), null);
});

test("at most 100 visible blocks are sent", () => {
  const many = Array.from({ length: 130 }, (_, index) => ({ id: `zf-${index}`, kind: "post", title: null, text: `Text ${index}` }));
  const built = build({ blocks: many, hiddenIds: [], results: [] });
  assert.equal(built.sentCount, 100);
  assert.equal(built.visibleCount, 130);
});

test("language: cs or en, defaulting from the page language", () => {
  const client = loadClient();
  assert.equal(client.defaultLanguage("en-GB"), "en");
  assert.equal(client.defaultLanguage("EN"), "en");
  assert.equal(client.defaultLanguage("cs"), "cs");
  assert.equal(client.defaultLanguage(null), "cs");
  assert.equal(client.defaultLanguage("de"), "cs");
  assert.equal(build({ language: "en" }).request.language, "en");
  assert.equal(build({ language: "fr" }).request.language, "cs");
});

test("a valid summary is returned; request goes to the local backend without credentials", async () => {
  const client = loadClient();
  const { request } = build();
  const calls = [];
  const reply = await client.summarize(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => okSummary(request) };
  }, request);
  assert.equal(reply.ok, true);
  assert.equal(reply.summary.summary, "Shrnutí viditelného obsahu.");
  assert.equal(calls[0].url, "http://127.0.0.1:8000/v1/summarize");
  assert.equal(calls[0].options.credentials, "omit");
});

test("flags with a blank summary are valid; a blank summary without a flag is not", () => {
  const client = loadClient();
  const { request } = build();
  assert.equal(client.isValidSummary(okSummary(request, { summary: "", insufficient_input: true }), request), true);
  assert.equal(client.isValidSummary(okSummary(request, { summary: " ", no_relevant_content: true }), request), true);
  assert.equal(client.isValidSummary(okSummary(request, { summary: "  " }), request), false);
});

test("summaries that break the contract are rejected", () => {
  const client = loadClient();
  const { request } = build();
  const bad = [
    null,
    okSummary(request, { summary: "x".repeat(4001) }),
    okSummary(request, { summary: 5 }),
    okSummary(request, { model_version: "" }),
    okSummary(request, { insufficient_input: "no" }),
    okSummary(request, { omitted_categories: ["valka", "sport"] }),
    // Must report what was sent as omitted, not something else.
    okSummary(request, { omitted_categories: [] }),
    okSummary(request, { omitted_categories: ["umrti"] }),
    okSummary(request, { preferences: null }),
  ];
  for (const data of bad) {
    assert.equal(client.isValidSummary(data, request), false, JSON.stringify(data));
  }
});

test("errors: not served yet, unavailable, rate limit, timeout, others", async () => {
  const client = loadClient();
  const { request } = build();
  const cases = [
    [respond(404, { detail: "Not Found" }), "summary_not_served"],
    [respond(405, {}), "summary_not_served"],
    [respond(503, { error: "summary_unavailable" }), "summary_unavailable"],
    [respond(429, { error: "rate_limited" }), "rate_limited"],
    [respond(504, { error: "timeout" }), "timeout"],
    [respond(422, { error: "validation_error" }), "backend_error"],
    [respond(500, { error: "internal_error" }), "backend_error"],
    [respond(200, { summary: "no other fields" }), "invalid_response"],
    [async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad"); } }), "invalid_response"],
    [async () => { throw new TypeError("Failed to fetch"); }, "backend_unavailable"],
  ];
  for (const [fetchFn, error] of cases) {
    assert.deepEqual(plain(await client.summarize(fetchFn, request)), { ok: false, error });
  }
});

test("client timeout", async () => {
  const client = loadClient();
  const { request } = build();
  // A real pending request keeps the event loop alive; the fake holds a timer until the abort.
  const hanging = (url, options) => new Promise((resolve, reject) => {
    const keepAlive = setTimeout(() => {}, 10000);
    options.signal.addEventListener("abort", () => {
      clearTimeout(keepAlive);
      reject(options.signal.reason);
    });
  });
  assert.deepEqual(plain(await client.summarize(hanging, request, { timeoutMs: 20 })), { ok: false, error: "timeout" });
});
