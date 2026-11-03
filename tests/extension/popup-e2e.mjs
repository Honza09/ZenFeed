// Loads extension/ unpacked in a headless Chromium browser, clicks the toolbar
// action on each page (this is what grants activeTab), clicks the popup button
// twice and prints what the popup shows. Development tool, no dependencies.
//
// Usage (from the repository root, Node.js 22+):
//   node tests/extension/popup-e2e.mjs <url> [<url> ...]
//   node tests/extension/popup-e2e.mjs --same-tab <url> <url> ...   # navigate one tab
//   node tests/extension/popup-e2e.mjs --backend=http://127.0.0.1:8000 <url> ...
//   BROWSER_PATH=/path/to/chromium node tests/extension/popup-e2e.mjs <url>
//
// --same-tab opens the first URL and navigates the same tab to the next ones,
// clicking the action again after each navigation (Chrome drops the activeTab
// grant on navigation). Without it, each URL gets a new tab.
//
// --backend runs the ZF-09 round trip after the popup checks: extract blocks
// through the popup, send them to <backend>/v1/analyze in batches, hand the
// results back with ZenFeedBootstrap.applyResults and then read the content
// script's registry in its isolated world to check that every result sits on
// the block with the same ID and that the block's element is still on the page.
// Results of an older extraction must be rejected (stale_extraction). Finally
// it removes the zf-0 element from the page (the page changes the tab, so this
// runs last) and checks that zf-0 then gets no result.
//
// Chrome 137+ ignores --load-extension, so the default is Brave. The browser
// needs CDP Extensions.triggerAction (--enable-unsafe-extension-debugging).

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BROWSER = {
  darwin: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  linux: "brave-browser",
  win32: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
};
const PORT = 9334;
const LOAD_MS = 3000;
const POPUP_MS = 800;
const CLICK_MS = 1500;
const ANALYZE_BATCH = 100; // backend limit, docs/API.md
const MAX_TITLE_CHARS = 300; // backend limit, docs/API.md

const args = process.argv.slice(2);
const sameTab = args.includes("--same-tab");
const backend = args.find((arg) => arg.startsWith("--backend="))?.slice("--backend=".length);
const urls = args.filter((arg) => !arg.startsWith("--"));
if (!urls.length) {
  console.error("Usage: node tests/extension/popup-e2e.mjs [--same-tab] [--backend=<url>] <url> [<url> ...]");
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const extensionDir = resolve(here, "../../extension");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// Chromium derives the ID of an unpacked extension from its absolute path.
const extensionId = [...createHash("sha256").update(extensionDir).digest("hex").slice(0, 32)]
  .map((char) => String.fromCharCode(97 + parseInt(char, 16)))
  .join("");

// elementsInSummary > 0 would mean page text was parsed as HTML.
const popupStateExpression = `(() => {
  const status = document.getElementById("status");
  return {
    status: status.textContent,
    error: status.classList.contains("error"),
    title: document.getElementById("page-title").textContent,
    blocks: document.getElementById("block-count").textContent,
    elementsInSummary: document.querySelectorAll("#summary dd *").length,
  };
})()`;

async function waitForBrowser() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await response.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Browser did not start; set BROWSER_PATH");
}

async function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const listeners = new Set();
  let lastId = 0;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else {
      listeners.forEach((listener) => listener(message));
    }
  };
  await new Promise((done, fail) => {
    socket.onopen = done;
    socket.onerror = fail;
  });
  return {
    async send(method, params = {}, sessionId) {
      const id = ++lastId;
      socket.send(JSON.stringify({ id, method, params, sessionId }));
      const message = await new Promise((done) => pending.set(id, done));
      if (message.error) {
        throw new Error(`${method}: ${message.error.message}`);
      }
      return message.result;
    },
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => socket.close(),
  };
}

async function tabTargetIds(cdp) {
  const { targetInfos } = await cdp.send("Target.getTargets", { filter: [{ type: "tab" }] });
  return targetInfos.filter((target) => target.type === "tab").map((target) => target.targetId);
}

// Returns the tab target (for triggerAction) and the page target (for navigation).
async function openTab(cdp, url) {
  const before = new Set(await tabTargetIds(cdp));
  const { targetId: pageId } = await cdp.send("Target.createTarget", { url });
  await sleep(LOAD_MS);
  const tabId = (await tabTargetIds(cdp)).find((id) => !before.has(id));
  if (!tabId) {
    throw new Error("tab target not found");
  }
  return { tabId, pageId };
}

async function navigate(cdp, tab, url) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: tab.pageId, flatten: true });
  await cdp.send("Page.navigate", { url }, sessionId);
  await sleep(LOAD_MS);
  await cdp.send("Target.detachFromTarget", { sessionId });
}

async function clickAndRead(cdp, sessionId) {
  await cdp.send("Runtime.evaluate", {
    expression: "document.getElementById('analyze').click()",
    userGesture: true,
  }, sessionId);
  await sleep(CLICK_MS);
  const { result } = await cdp.send("Runtime.evaluate", { expression: popupStateExpression, returnByValue: true }, sessionId);
  return result.value;
}

async function openPopupAndCheck(cdp, tab) {
  const popupUrl = `chrome-extension://${extensionId}/popup/`;
  const isPopup = (target) => target.url.startsWith(popupUrl);
  const before = new Set((await cdp.send("Target.getTargets")).targetInfos.filter(isPopup).map((t) => t.targetId));
  await cdp.send("Extensions.triggerAction", { id: extensionId, targetId: tab.tabId });
  await sleep(POPUP_MS);
  const popup = (await cdp.send("Target.getTargets")).targetInfos
    .find((target) => isPopup(target) && !before.has(target.targetId));
  if (!popup) {
    throw new Error("popup did not open");
  }
  try {
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: popup.targetId, flatten: true });
    const first = await clickAndRead(cdp, sessionId);
    // The second click injects the content scripts again; their guards must keep them working.
    const second = await clickAndRead(cdp, sessionId);
    const roundTrip = backend && !first.error ? await checkRoundTrip(cdp, sessionId, tab) : null;
    return { first, secondMatches: JSON.stringify(first) === JSON.stringify(second), roundTrip };
  } finally {
    await cdp.send("Target.closeTarget", { targetId: popup.targetId });
  }
}

async function evaluateInPopup(cdp, sessionId, expression) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description || "evaluation failed");
  }
  return result.value;
}

async function analyze(blocks) {
  const results = [];
  for (let start = 0; start < blocks.length; start += ANALYZE_BATCH) {
    const batch = blocks.slice(start, start + ANALYZE_BATCH).map(({ id, kind, title, text }) => ({
      id, kind, text, title: title ? title.slice(0, MAX_TITLE_CHARS) : null,
    }));
    const response = await fetch(`${backend}/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: batch, preferences: {} }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error(`/v1/analyze returned ${response.status}: ${await response.text()}`);
    }
    results.push(...(await response.json()).results);
  }
  return results;
}

// Runs in the content script's isolated world: is each result on its block?
const registryCheckExpression = (ids) => `(() => {
  const normalize = (text) => text.replace(/\\s+/g, "").toLowerCase();
  const report = { withResult: 0, missing: [], detached: [], textMismatch: [], wrappers: [] };
  for (const id of ${JSON.stringify(ids)}) {
    const entry = globalThis.zenFeedGetBlock(id);
    if (!entry || !entry.result || entry.block.id !== id) {
      report.missing.push(id);
      continue;
    }
    report.withResult += 1;
    if (entry.containsBlocks > 0) {
      report.wrappers.push(id + " (" + entry.containsBlocks + ")");
    }
    if (!entry.block.elements.every((element) => element.isConnected)) {
      report.detached.push(id);
    }
    // The first leaf of the block must be in its elements. Only the first line,
    // because dropped leaves (menus, short bylines) leave gaps in the block text;
    // case-insensitive, because innerText applies CSS text-transform; without
    // whitespace, because the segmenter joins inline runs with spaces.
    const pageText = normalize(entry.block.elements.map((element) => element.innerText || element.textContent).join(""));
    const firstLeaf = normalize(entry.block.text.split("\\n")[0]).slice(0, 30);
    if (!pageText.includes(firstLeaf)) {
      report.textMismatch.push(id);
    }
  }
  // Cost of building the registry, i.e. the containsBlocks check, on this page.
  const blocks = ZenFeedSegmenter.segmentPage().blocks;
  const started = performance.now();
  ZenFeedBlockRegistry.createRegistry(() => "timing").replace(blocks);
  report.registryMs = Math.round(performance.now() - started);
  return report;
})()`;

async function evaluateInContentScript(cdp, tab, expression) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: tab.pageId, flatten: true });
  const contexts = [];
  const stop = cdp.onEvent((message) => {
    if (message.sessionId === sessionId && message.method === "Runtime.executionContextCreated") {
      contexts.push(message.params.context);
    }
  });
  try {
    await cdp.send("Runtime.enable", {}, sessionId);
    await sleep(300);
    const context = contexts.find((item) => item.name === "ZenFeed");
    if (!context) {
      throw new Error("content script world not found");
    }
    const { result } = await cdp.send("Runtime.evaluate", {
      expression,
      contextId: context.id,
      returnByValue: true,
    }, sessionId);
    return result.value;
  } finally {
    stop();
    await cdp.send("Target.detachFromTarget", { sessionId });
  }
}

async function checkRoundTrip(cdp, sessionId, tab) {
  const extraction = await evaluateInPopup(cdp, sessionId, "ZenFeedBootstrap.extractActiveTab(chrome)");
  if (!extraction.ok) {
    throw new Error(`extraction failed: ${extraction.error}`);
  }
  const results = await analyze(extraction.blocks);
  const sentIds = new Set(extraction.blocks.map((block) => block.id));
  const resultsWithUnknownId = [...results, { ...(results[0] || {}), id: "zf-unknown" }];
  const applyExpression = (extractionId) => `ZenFeedBootstrap.applyResults(chrome, ${extraction.tabId}, `
    + `${JSON.stringify(extractionId)}, ${JSON.stringify(resultsWithUnknownId)})`;

  const applied = await evaluateInPopup(cdp, sessionId, applyExpression(extraction.extractionId));
  const registry = await evaluateInContentScript(cdp, tab, registryCheckExpression([...sentIds]));
  // A new extraction makes the previous results stale.
  const next = await evaluateInPopup(cdp, sessionId, "ZenFeedBootstrap.extractActiveTab(chrome)");
  const stale = await evaluateInPopup(cdp, sessionId, applyExpression(extraction.extractionId));
  // The page re-renders a block between extraction and results: it must get no result.
  let removed = null;
  if (next.ok && next.blocks.length) {
    await evaluateInContentScript(cdp, tab, `globalThis.zenFeedGetBlock("zf-0").block.elements.forEach((element) => element.remove())`);
    const reply = await evaluateInPopup(cdp, sessionId, applyExpression(next.extractionId));
    const entry = await evaluateInContentScript(cdp, tab, `globalThis.zenFeedGetBlock("zf-0").result`);
    removed = reply.ok ? `detached ${reply.detached}, zf-0 result ${entry === null ? "null" : "SET (WRONG)"}` : reply.error;
  }
  return {
    blocks: extraction.blocks.length,
    batches: Math.ceil(extraction.blocks.length / ANALYZE_BATCH),
    results: results.length,
    resultsForSentIds: results.every((result) => sentIds.has(result.id)),
    applied,
    registry,
    stale: stale.ok ? "accepted (WRONG)" : stale.error,
    removed,
  };
}

function printRoundTrip(roundTrip) {
  const { applied, registry } = roundTrip;
  const appliedText = applied.ok
    ? `matched ${applied.matched}, unknown ${applied.unknown}, invalid ${applied.invalid}, `
      + `duplicate ${applied.duplicate}, detached ${applied.detached}`
    : applied.error;
  console.log(`round trip: ${roundTrip.blocks} blocks in ${roundTrip.batches} batch(es), `
    + `${roundTrip.results} results, all for sent IDs: ${roundTrip.resultsForSentIds}`);
  console.log(`  apply: ${appliedText}`);
  console.log(`  registry: ${registry.withResult} with result, missing ${registry.missing.length}, `
    + `detached ${registry.detached.length}, text mismatch ${registry.textMismatch.length}`
    + (registry.textMismatch.length ? ` ${JSON.stringify(registry.textMismatch.slice(0, 10))}` : ""));
  console.log(`  wrapper blocks (contain other blocks): ${registry.wrappers.length}`
    + (registry.wrappers.length ? ` ${registry.wrappers.slice(0, 5).join(", ")}` : "")
    + `  registry build: ${registry.registryMs} ms`);
  console.log(`  old extraction ID after a new extraction: ${roundTrip.stale}`);
  if (roundTrip.removed) {
    console.log(`  zf-0 removed from the page before results: ${roundTrip.removed}`);
  }
}

function printResult(url, { first, secondMatches, roundTrip }) {
  console.log(`\n=== ${url}`);
  console.log(`status: ${first.status}${first.error ? " (error)" : ""}`);
  console.log(`title: ${first.title || "-"}  blocks: ${first.blocks || "-"}  `
    + `second click same: ${secondMatches}  elements from page text: ${first.elementsInSummary}`);
  if (roundTrip) {
    printRoundTrip(roundTrip);
  }
}

async function run(cdp) {
  let tab = null;
  for (const url of urls) {
    try {
      if (sameTab && tab) {
        await navigate(cdp, tab, url);
      } else {
        tab = await openTab(cdp, url);
      }
      printResult(url, await openPopupAndCheck(cdp, tab));
    } catch (error) {
      console.log(`\n=== ${url}\nFAILED: ${error.message}`);
    } finally {
      if (!sameTab && tab) {
        await cdp.send("Target.closeTarget", { targetId: tab.tabId });
        tab = null;
      }
    }
  }
}

const profile = mkdtempSync(join(tmpdir(), "zenfeed-popup-"));
const browser = spawn(process.env.BROWSER_PATH || DEFAULT_BROWSER[process.platform], [
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${PORT}`,
  "--headless=new",
  "--no-first-run",
  "--enable-unsafe-extension-debugging",
  `--load-extension=${extensionDir}`,
  `--disable-extensions-except=${extensionDir}`,
  "about:blank",
], { stdio: "ignore" });

let cdp;
try {
  cdp = await connect(await waitForBrowser());
  await run(cdp);
} finally {
  cdp?.close();
  browser.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
