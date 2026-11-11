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
  const context = { AbortSignal, setTimeout, console: { error() {} } };
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

const NO_DELAY = { retryDelayMs: 0 };

function counting(calls, fetchFn) {
  return async (url, options) => {
    calls.push(JSON.parse(options.body));
    return fetchFn(url, options);
  };
}

const serverError = async () => ({ ok: false, status: 500, json: async () => ({}) });

test("backend not running: tried twice, then backend_unavailable for every block", async () => {
  const client = loadClient();
  const calls = [];
  const down = counting(calls, async () => { throw new TypeError("Failed to fetch"); });
  const reply = await client.analyzeBlocks(down, makeBlocks(250), PREFS, NO_DELAY);
  assert.equal(reply.ok, false);
  assert.equal(reply.error, "backend_unavailable");
  assert.equal(reply.failedIds.length, 250);
  // The first request is tried twice; the other two are not sent at all.
  assert.equal(calls.length, client.MAX_ATTEMPTS);
});

test("timeouts: client abort and backend 504", async () => {
  const client = loadClient();
  // A real pending request keeps Node's event loop alive; AbortSignal.timeout's
  // timer does not (it is unref'd), so the fake holds a timer until the abort.
  const hanging = (url, options) => new Promise((resolve, reject) => {
    const keepAlive = setTimeout(() => {}, 10000);
    options.signal.addEventListener("abort", () => {
      clearTimeout(keepAlive);
      reject(options.signal.reason);
    });
  });
  const failed = { ok: false, error: "timeout", failedIds: ["zf-0"] };
  const calls = [];
  assert.deepEqual(plain(await client.analyzeBlocks(counting(calls, hanging), makeBlocks(1), PREFS, { timeoutMs: 20, ...NO_DELAY })), failed);
  assert.equal(calls.length, 2, "a timeout is tried once more");
  const gateway = async () => ({ ok: false, status: 504, json: async () => ({ error: "timeout" }) });
  assert.deepEqual(plain(await client.analyzeBlocks(gateway, makeBlocks(1), PREFS, NO_DELAY)), failed);
});

test("error status and invalid bodies; only 5xx, timeouts and network errors are retried", async () => {
  const client = loadClient();
  const cases = [
    [async () => ({ ok: false, status: 422, json: async () => ({ error: "validation_error" }) }), "backend_error", 1],
    [async () => ({ ok: false, status: 413, json: async () => ({ error: "request_too_large" }) }), "backend_error", 1],
    [serverError, "backend_error", 2],
    [async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad json"); } }), "invalid_response", 1],
    [async () => okResponse({ result: [] }), "invalid_response", 1],
    [async () => okResponse(null), "invalid_response", 1],
  ];
  for (const [fetchFn, error, attempts] of cases) {
    const calls = [];
    const reply = await client.analyzeBlocks(counting(calls, fetchFn), makeBlocks(1), PREFS, NO_DELAY);
    assert.deepEqual(plain(reply), { ok: false, error, failedIds: ["zf-0"] });
    assert.equal(calls.length, attempts, `${error}: attempts`);
  }
});

test("a request that fails once and then succeeds gives full results", async () => {
  const client = loadClient();
  const calls = [];
  const ok = backendFetch(calls);
  let count = 0;
  const flaky = async (url, options) => (++count === 1 ? serverError() : ok(url, options));
  const reply = await client.analyzeBlocks(flaky, makeBlocks(3), PREFS, NO_DELAY);
  assert.equal(reply.ok, true);
  assert.equal(reply.partial, undefined);
  assert.equal(reply.results.length, 3);
  assert.deepEqual(plain(reply.failedIds), []);
});

test("a failing second request keeps the results of the others", async () => {
  const client = loadClient();
  const calls = [];
  const ok = backendFetch(calls);
  // 250 blocks: requests 1 (zf-0…99), 2 (zf-100…199) and 3 (zf-200…249).
  const flaky = async (url, options) => (JSON.parse(options.body).blocks[0].id === "zf-100" ? serverError() : ok(url, options));
  const reply = await client.analyzeBlocks(flaky, makeBlocks(250), PREFS, NO_DELAY);
  assert.equal(reply.ok, true);
  assert.equal(reply.partial, true);
  assert.equal(reply.error, "backend_error");
  assert.equal(reply.results.length, 150);
  assert.deepEqual(plain(reply.failedIds), makeBlocks(250).slice(100, 200).map((block) => block.id));
  assert.equal(reply.results.some((result) => result.id === "zf-150"), false);
});

test("a block missing from a 200 response counts as failed", async () => {
  const client = loadClient();
  const calls = [];
  const ok = backendFetch(calls);
  const dropsOne = async (url, options) => {
    const response = await ok(url, options);
    const body = await response.json();
    return okResponse({ ...body, results: body.results.filter((result) => result.id !== "zf-1") });
  };
  const reply = await client.analyzeBlocks(dropsOne, makeBlocks(3), PREFS, NO_DELAY);
  assert.equal(reply.ok, true);
  assert.equal(reply.partial, true);
  assert.equal(reply.error, "invalid_response");
  assert.deepEqual(plain(reply.failedIds), ["zf-1"]);
  assert.equal(calls.length, 1, "an incomplete answer is not retried");
});
