// Unit tests for extension/popup/analyze-client.js with a fake fetch.
// Run from the repository root: node --test tests/extension/analyze-client.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/analyze-client.js"), "utf8");

function loadClient() {
  const context = { AbortSignal, console: { error() {} } };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedAnalyzeClient;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const PREFS = { valka: true, politicke_konflikty: false, umrti: false, katastrofy: false, nasili: false, toxicky: false };

function makeBlocks(count) {
  return Array.from({ length: count }, (_, index) => ({ id: `zf-${index}`, kind: "article", title: `Title ${index}`, text: `Text ${index}` }));
}

function okResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

// Answers like the backend: one "show" result per block.
function backendFetch(calls) {
  return async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, options, body });
    return okResponse({
      results: body.blocks.map((block) => ({
        id: block.id, category: "jine", topic: "jine", tone: "neutralni",
        toxicity_score: 0, confidence: 0, recommended_action: "show",
      })),
      model_version: "lexicon-1",
    });
  };
}

test("sends the blocks and preferences to the local backend", async () => {
  const client = loadClient();
  const calls = [];
  const reply = await client.analyzeBlocks(backendFetch(calls), makeBlocks(3), PREFS);
  assert.equal(reply.ok, true);
  assert.equal(reply.results.length, 3);
  assert.equal(reply.modelVersion, "lexicon-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://127.0.0.1:8000/v1/analyze");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.credentials, "omit");
  assert.deepEqual(calls[0].body.preferences, PREFS);
});

test("only id, kind, title and text leave the browser; long titles are cut to 300", async () => {
  const client = loadClient();
  const calls = [];
  const blocks = [{ id: "zf-0", kind: "post", title: "x".repeat(400), text: "Body", url: "https://secret", elements: [{}] }];
  await client.analyzeBlocks(backendFetch(calls), blocks, PREFS);
  assert.deepEqual(Object.keys(calls[0].body.blocks[0]).sort(), ["id", "kind", "text", "title"]);
  assert.equal(calls[0].body.blocks[0].title.length, 300);
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["blocks", "preferences"]);
});

test("more than 100 blocks are sent in requests of at most 100", async () => {
  const client = loadClient();
  const calls = [];
  const reply = await client.analyzeBlocks(backendFetch(calls), makeBlocks(250), PREFS);
  assert.deepEqual(calls.map((call) => call.body.blocks.length), [100, 100, 50]);
  assert.equal(reply.results.length, 250);
  assert.deepEqual(plain(client.buildRequests(makeBlocks(100), PREFS).map((request) => request.blocks.length)), [100]);
});

test("backend not running: backend_unavailable", async () => {
  const client = loadClient();
  const reply = await client.analyzeBlocks(async () => { throw new TypeError("Failed to fetch"); }, makeBlocks(1), PREFS);
  assert.deepEqual(plain(reply), { ok: false, error: "backend_unavailable" });
});

test("timeouts: client abort and backend 504", async () => {
  const client = loadClient();
  const hanging = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(options.signal.reason));
  });
  assert.deepEqual(plain(await client.analyzeBlocks(hanging, makeBlocks(1), PREFS, { timeoutMs: 20 })), { ok: false, error: "timeout" });
  const gateway = async () => ({ ok: false, status: 504, json: async () => ({ error: "timeout" }) });
  assert.deepEqual(plain(await client.analyzeBlocks(gateway, makeBlocks(1), PREFS)), { ok: false, error: "timeout" });
});

test("error status and invalid bodies", async () => {
  const client = loadClient();
  const cases = [
    [async () => ({ ok: false, status: 422, json: async () => ({ error: "validation_error" }) }), "backend_error"],
    [async () => ({ ok: false, status: 500, json: async () => ({}) }), "backend_error"],
    [async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad json"); } }), "invalid_response"],
    [async () => okResponse({ result: [] }), "invalid_response"],
    [async () => okResponse(null), "invalid_response"],
  ];
  for (const [fetchFn, error] of cases) {
    assert.deepEqual(plain(await client.analyzeBlocks(fetchFn, makeBlocks(1), PREFS)), { ok: false, error });
  }
});

test("a failing second request returns no results at all", async () => {
  const client = loadClient();
  const calls = [];
  const ok = backendFetch(calls);
  let count = 0;
  const flaky = async (url, options) => (++count === 2 ? { ok: false, status: 500, json: async () => ({}) } : ok(url, options));
  assert.deepEqual(plain(await client.analyzeBlocks(flaky, makeBlocks(150), PREFS)), { ok: false, error: "backend_error" });
});
