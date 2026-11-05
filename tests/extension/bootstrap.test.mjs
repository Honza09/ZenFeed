// Unit tests for extension/popup/bootstrap.js with a fake chrome API.
// Run from the repository root: node --test tests/extension/bootstrap.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../../extension/popup/bootstrap.js"), "utf8");
const manifest = JSON.parse(readFileSync(join(here, "../../extension/manifest.json"), "utf8"));

function loadBootstrap() {
  const context = { URL, console: { error() {} } };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.ZenFeedBootstrap;
}

// Objects from the vm context have another Object prototype; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

function fakeChrome({ tab, inject, reply }) {
  const calls = { injected: [], messages: [] };
  const api = {
    tabs: {
      query: async () => (tab ? [tab] : []),
      sendMessage: async (tabId, message) => {
        calls.messages.push({ tabId, message });
        return reply();
      },
    },
    scripting: {
      executeScript: async (details) => {
        calls.injected.push(details);
        return inject ? inject() : [];
      },
    },
  };
  return { api, calls };
}

const PAGE = { id: 7, url: "https://example.com/article" };
const OK_REPLY = () => ({
  ok: true,
  extractionId: "x1",
  title: "Example",
  url: PAGE.url,
  blocks: [{ id: "zf-0", kind: "article", title: null, text: "Some readable text." }],
  stats: { durationMs: 3 },
});

test("supported URLs: only http and https outside the Web Store", () => {
  const { isSupportedUrl } = loadBootstrap();
  assert.equal(isSupportedUrl("https://www.novinky.cz/"), true);
  assert.equal(isSupportedUrl("http://localhost:8000/page"), true);
  assert.equal(isSupportedUrl("https://chrome.google.com/search"), true);
  for (const url of [
    "chrome://extensions",
    "chrome-extension://abc/popup/popup.html",
    "file:///tmp/page.html",
    "about:blank",
    "view-source:https://example.com/",
    "https://chromewebstore.google.com/detail/x",
    "https://chrome.google.com/webstore/category/extensions",
    "",
    undefined,
    "not a url",
  ]) {
    assert.equal(isSupportedUrl(url), false, url);
  }
});

test("injects the content scripts in order, then asks for blocks", async () => {
  const { extractActiveTab } = loadBootstrap();
  const { api, calls } = fakeChrome({ tab: PAGE, reply: OK_REPLY });
  const result = await extractActiveTab(api);

  assert.equal(result.ok, true);
  assert.equal(result.tabId, 7);
  assert.equal(result.extractionId, "x1");
  assert.equal(result.title, "Example");
  assert.equal(result.blocks.length, 1);
  assert.deepEqual(plain(calls.injected), [
    { target: { tabId: 7 }, files: ["content/segmenter.js", "content/block-registry.js", "content/hider.js", "content/content.js"] },
  ]);
  assert.deepEqual(plain(calls.messages), [{ tabId: 7, message: { type: "zenfeed/extract-blocks" } }]);
});

test("missing title becomes null and an empty page is still ok", async () => {
  const { extractActiveTab } = loadBootstrap();
  const { api } = fakeChrome({ tab: PAGE, reply: () => ({ ok: true, extractionId: "x1", title: "", blocks: [] }) });
  const result = await extractActiveTab(api);
  assert.equal(result.ok, true);
  assert.equal(result.title, null);
  assert.equal(result.blocks.length, 0);
});

test("restricted page: no injection, unsupported_page", async () => {
  const { extractActiveTab } = loadBootstrap();
  for (const url of ["chrome://newtab/", "file:///tmp/page.html", "https://chromewebstore.google.com/"]) {
    const { api, calls } = fakeChrome({ tab: { id: 1, url }, reply: OK_REPLY });
    assert.deepEqual(plain(await extractActiveTab(api)), { ok: false, error: "unsupported_page" }, url);
    assert.equal(calls.injected.length, 0);
    assert.equal(calls.messages.length, 0);
  }
});

// Seen in Brave when the icon was clicked before the page navigation committed.
test("tab without URL (no activeTab grant): no_access, no injection", async () => {
  const { extractActiveTab } = loadBootstrap();
  for (const tab of [{ id: 2 }, { id: 3, url: "" }]) {
    const { api, calls } = fakeChrome({ tab, reply: OK_REPLY });
    assert.deepEqual(plain(await extractActiveTab(api)), { ok: false, error: "no_access" });
    assert.equal(calls.injected.length, 0);
    assert.equal(calls.messages.length, 0);
  }
});

test("no active tab: no_tab", async () => {
  const { extractActiveTab } = loadBootstrap();
  const { api } = fakeChrome({ tab: null, reply: OK_REPLY });
  assert.deepEqual(plain(await extractActiveTab(api)), { ok: false, error: "no_tab" });
});

test("injection error: injection_failed, no message sent", async () => {
  const { extractActiveTab } = loadBootstrap();
  const { api, calls } = fakeChrome({
    tab: PAGE,
    inject: () => { throw new Error("Cannot access contents of the page"); },
    reply: OK_REPLY,
  });
  assert.deepEqual(plain(await extractActiveTab(api)), { ok: false, error: "injection_failed" });
  assert.equal(calls.messages.length, 0);
});

test("content script errors or invalid replies: extraction_failed", async () => {
  const { extractActiveTab } = loadBootstrap();
  const replies = [
    () => { throw new Error("Receiving end does not exist"); },
    () => undefined,
    () => ({ ok: false, error: "extraction_failed" }),
    () => ({ ok: true, blocks: "nope" }),
    () => ({ ok: true, extractionId: "x1", blocks: [{ id: 1, text: "x" }] }),
    () => ({ ok: true, title: "No extraction ID", blocks: [] }),
  ];
  for (const reply of replies) {
    const { api } = fakeChrome({ tab: PAGE, reply });
    assert.deepEqual(plain(await extractActiveTab(api)), { ok: false, error: "extraction_failed" });
  }
});

test("loading the script twice keeps the first copy", () => {
  const context = { URL };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const first = context.ZenFeedBootstrap;
  vm.runInNewContext(source, context);
  assert.equal(context.ZenFeedBootstrap, first);
});

test("manifest: no automatic content scripts, host access only to the local backend", () => {
  assert.equal(manifest.content_scripts, undefined);
  // ZF-11: the popup calls the backend that runs locally (docs/rozhodnuti-zf-25.md).
  assert.deepEqual(manifest.host_permissions, ["http://127.0.0.1:8000/*"]);
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab", "scripting", "storage"]);
});

const APPLY_OK = { ok: true, matched: 1, unknown: 0, invalid: 0, duplicate: 0, detached: 0 };

test("applyResults sends the results with the extraction ID to the tab", async () => {
  const { applyResults } = loadBootstrap();
  const { api, calls } = fakeChrome({ tab: PAGE, reply: () => APPLY_OK });
  const results = [{ id: "zf-0", category: "war", toxicity_score: 0, confidence: 1, recommended_action: "hide" }];
  assert.deepEqual(plain(await applyResults(api, 7, "x1", results)), APPLY_OK);
  assert.deepEqual(plain(calls.messages), [
    { tabId: 7, message: { type: "zenfeed/apply-results", extractionId: "x1", results } },
  ]);
});

test("applyResults passes on the content script errors", async () => {
  const { applyResults } = loadBootstrap();
  for (const error of ["stale_extraction", "no_extraction", "invalid_results", "apply_failed"]) {
    const { api } = fakeChrome({ tab: PAGE, reply: () => ({ ok: false, error }) });
    assert.deepEqual(plain(await applyResults(api, 7, "x1", [])), { ok: false, error });
  }
});

test("applyResults: closed tab or odd reply is tab_unavailable", async () => {
  const { applyResults } = loadBootstrap();
  const replies = [
    () => { throw new Error("No tab with id: 7"); },
    () => undefined,
    () => ({ ok: true }),
    () => ({ ...APPLY_OK, matched: -1 }),
    () => ({ ...APPLY_OK, unknown: "0" }),
    () => ({ ok: false, error: "something_else" }),
  ];
  for (const reply of replies) {
    const { api } = fakeChrome({ tab: PAGE, reply });
    assert.deepEqual(plain(await applyResults(api, 7, "x1", [])), { ok: false, error: "tab_unavailable" });
  }
});

const HIDING_OK = {
  ok: true, hidden: 2, alreadyHidden: 0, revealed: 0, noResult: 0, notHide: 5,
  wrapper: 1, detached: 0, unsupported: 0, failed: 0, hiddenTotal: 2,
};

test("applyHiding, showAll and getStatus send their messages", async () => {
  const { applyHiding, showAll, getStatus } = loadBootstrap();
  const replies = [HIDING_OK, { ok: true, restored: 2 }, { ok: true, hidden: 0, newContent: 3, extractionId: "x1", withResults: 4 }];
  const { api, calls } = fakeChrome({ tab: PAGE, reply: () => replies.shift() });
  assert.deepEqual(plain(await applyHiding(api, 7, "x1")), HIDING_OK);
  assert.deepEqual(plain(await showAll(api, 7)), { ok: true, restored: 2 });
  assert.deepEqual(plain(await getStatus(api, 7)), { ok: true, hidden: 0, newContent: 3, extractionId: "x1", withResults: 4 });
  assert.deepEqual(plain(calls.messages.map((call) => call.message)), [
    { type: "zenfeed/apply-hiding", extractionId: "x1" },
    { type: "zenfeed/show-all" },
    { type: "zenfeed/status" },
  ]);
});

test("applyHiding passes on known errors only", async () => {
  const { applyHiding } = loadBootstrap();
  for (const error of ["no_extraction", "stale_extraction", "hiding_failed"]) {
    const { api } = fakeChrome({ tab: PAGE, reply: () => ({ ok: false, error }) });
    assert.deepEqual(plain(await applyHiding(api, 7, "x1")), { ok: false, error });
  }
  const odd = [
    () => { throw new Error("No tab with id: 7"); },
    () => undefined,
    () => ({ ok: false, error: "apply_failed" }),
    () => ({ ...HIDING_OK, hidden: -1 }),
    () => ({ ...HIDING_OK, wrapper: undefined }),
  ];
  for (const reply of odd) {
    const { api } = fakeChrome({ tab: PAGE, reply });
    assert.deepEqual(plain(await applyHiding(api, 7, "x1")), { ok: false, error: "tab_unavailable" });
  }
});

test("showAll and getStatus reject odd replies", async () => {
  const { showAll, getStatus } = loadBootstrap();
  for (const reply of [() => ({ ok: true }), () => ({ ok: true, restored: "2" })]) {
    const { api } = fakeChrome({ tab: PAGE, reply });
    assert.deepEqual(plain(await showAll(api, 7)), { ok: false, error: "tab_unavailable" });
  }
  for (const reply of [
    () => ({ ok: true, hidden: 1 }),
    () => ({ ok: true, hidden: 1.5, newContent: 0, extractionId: null, withResults: 0 }),
    () => ({ ok: true, hidden: 0, newContent: 0, extractionId: 5, withResults: 0 }),
    () => ({ ok: true, hidden: 0, newContent: 0, extractionId: "x1" }),
  ]) {
    const { api } = fakeChrome({ tab: PAGE, reply });
    assert.deepEqual(plain(await getStatus(api, 7)), { ok: false, error: "tab_unavailable" });
  }
});
