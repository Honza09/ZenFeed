// Loads extension/ unpacked in a headless Chromium browser, clicks the toolbar
// action on each page (this is what grants activeTab), drives the popup and
// prints what it shows. Development tool, no dependencies.
//
// Popup flow (ZF-11) on each page: turn every preference on (they are stored,
// so from the second page on they are already on when the popup opens), click
// "Analyzovat", "Zobrazit vše", "Znovu skrýt", "Zobrazit vše", "Analyzovat"
// again (must give the same result as the first time) and "Zobrazit vše".
// The popup calls the backend at http://127.0.0.1:8000, so start it there
// (uvicorn app.main:app --app-dir backend); without it the popup shows the
// "server not running" message.
//
// Usage (from the repository root, Node.js 22+):
//   node tests/extension/popup-e2e.mjs <url> [<url> ...]
//   node tests/extension/popup-e2e.mjs --same-tab <url> <url> ...   # navigate one tab
//   node tests/extension/popup-e2e.mjs --backend=http://127.0.0.1:8000 <url> ...
//   BROWSER_PATH=/path/to/chromium node tests/extension/popup-e2e.mjs <url>
//   ZENFEED_PROFILE=/tmp/zf-profile node tests/extension/popup-e2e.mjs <url>   # keep the browser profile
//   node tests/extension/popup-e2e.mjs --summary <url> ...   # summary panel, needs the stub
//
// --summary (ZF-30) needs tests/extension/summary_stub.py on port 8000 instead
// of the plain backend. Right after the first analysis it clicks "Shrnout" once
// per stub mode, reads the panel, and checks the request the stub received:
// it must contain no text of a block that is hidden on the page.
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
const ANALYZE_BATCH = 100; // backend limit, docs/API.md
const MAX_TITLE_CHARS = 300; // backend limit, docs/API.md
// Every hide switch on, so the hiding check has something to hide (docs/API.md).
const ALL_PREFERENCES = {
  valka: true, politicke_konflikty: true, umrti: true, katastrofy: true, nasili: true, toxicky: true,
};

const args = process.argv.slice(2);
const sameTab = args.includes("--same-tab");
const withSummary = args.includes("--summary");
const STUB_URL = "http://127.0.0.1:8000";
const STUB_MODES = ["ok", "insufficient", "no_relevant", "not_served", "unavailable", "rate_limited", "timeout"];
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
    hidden: document.getElementById("hidden-count").textContent,
    showAll: !document.getElementById("show-all").hidden,
    rehide: !document.getElementById("rehide").hidden,
    hideAnyway: !document.getElementById("hide-anyway").hidden,
    notes: [...document.querySelectorAll("#notes li")].map((item) => item.textContent),
    elementsInSummary: document.querySelectorAll("#summary dd *").length,
  };
})()`;

const checkedPreferencesExpression = `[...document.querySelectorAll("#preferences input[type=checkbox]")]
  .filter((input) => input.checked).length`;

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

async function evaluate(cdp, sessionId, expression) {
  const { result } = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return result.value;
}

// Clicks a popup button and waits until the popup is idle again (buttons enabled).
async function clickAndRead(cdp, sessionId, buttonId = "analyze") {
  await cdp.send("Runtime.evaluate", {
    expression: `document.getElementById(${JSON.stringify(buttonId)}).click()`,
    userGesture: true,
  }, sessionId);
  await sleep(300);
  for (let waited = 0; waited < 30000; waited += 200) {
    if (!(await evaluate(cdp, sessionId, "document.getElementById('analyze').disabled"))) {
      break;
    }
    await sleep(200);
  }
  await sleep(200);
  return evaluate(cdp, sessionId, popupStateExpression);
}

// Turns on every preference switch that is off. Returns how many were on when the popup opened.
async function turnPreferencesOn(cdp, sessionId) {
  const onAtOpen = await evaluate(cdp, sessionId, checkedPreferencesExpression);
  await evaluate(cdp, sessionId, `[...document.querySelectorAll("#preferences input[type=checkbox]")]
    .filter((input) => !input.checked).forEach((input) => input.click())`);
  await sleep(300);
  return onAtOpen;
}

const summaryStateExpression = `(() => ({
  panel: !document.getElementById("summary-panel").hidden,
  button: document.getElementById("summarize").textContent,
  status: document.getElementById("summary-status").textContent,
  error: document.getElementById("summary-status").classList.contains("error"),
  result: !document.getElementById("summary-result").hidden,
  label: document.getElementById("summary-label").textContent,
  text: document.getElementById("summary-text").textContent,
  link: document.getElementById("summary-link").href,
  model: document.getElementById("summary-model").textContent,
}))()`;

async function stub(path, body) {
  const response = await fetch(`${STUB_URL}${path}`, body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return response.json();
}

// Text of every element ZenFeed hid, read in the page itself.
async function hiddenTexts(cdp, tab) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: tab.pageId, flatten: true });
  try {
    return await evaluate(cdp, sessionId, `[...document.querySelectorAll("[data-zenfeed-hidden]")]
      .map((element) => element.textContent.replace(/\\s+/g, "")).filter((text) => text.length >= 20)`);
  } finally {
    await cdp.send("Target.detachFromTarget", { sessionId });
  }
}

async function checkSummary(cdp, sessionId, tab) {
  const panel = await evaluate(cdp, sessionId, summaryStateExpression);
  if (!panel.panel) {
    return { panel: false };
  }
  const hidden = await hiddenTexts(cdp, tab);
  const modes = {};
  let privacy = null;
  for (const mode of STUB_MODES) {
    await stub("/__stub/mode", { mode });
    modes[mode] = await clickAndRead(cdp, sessionId, "summarize").then(() => evaluate(cdp, sessionId, summaryStateExpression));
    if (mode === "ok") {
      const { last } = await stub("/__stub/last");
      const sent = last ? last.blocks.map((block) => block.text.replace(/\s+/g, "")) : [];
      privacy = {
        hiddenElements: hidden.length,
        sentBlocks: sent.length,
        leaked: hidden.filter((text) => sent.some((block) => block.includes(text.slice(0, 40)))).length,
        omitted: last ? last.omitted_categories : null,
        language: last ? last.language : null,
      };
    }
  }
  // After the last error, "Zkusit znovu" must show a summary again.
  await stub("/__stub/mode", { mode: "ok" });
  modes.retry = await clickAndRead(cdp, sessionId, "summarize").then(() => evaluate(cdp, sessionId, summaryStateExpression));
  return { panel: true, privacy, modes };
}

async function runPopupFlow(cdp, sessionId, tab) {
  const preferencesAtOpen = await turnPreferencesOn(cdp, sessionId);
  const first = await clickAndRead(cdp, sessionId);
  const steps = { preferencesAtOpen, first };
  if (withSummary && !first.error) {
    steps.summary = await checkSummary(cdp, sessionId, tab);
  }
  // Review mode (ZF-28): the page is one block; hide it only on explicit request.
  let canShowAll = first.showAll;
  if (first.hideAnyway) {
    steps.hiddenAnyway = await clickAndRead(cdp, sessionId, "hide-anyway");
    canShowAll = steps.hiddenAnyway.showAll;
  }
  if (canShowAll) {
    steps.shown = await clickAndRead(cdp, sessionId, "show-all");
    if (steps.shown.rehide) {
      steps.rehidden = await clickAndRead(cdp, sessionId, "rehide");
      steps.shownAgain = await clickAndRead(cdp, sessionId, "show-all");
    }
  }
  // Analyzing again injects the content scripts again; their guards must keep them working.
  steps.second = await clickAndRead(cdp, sessionId);
  if (steps.second.showAll) {
    steps.final = await clickAndRead(cdp, sessionId, "show-all");
  }
  return steps;
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
    const steps = await runPopupFlow(cdp, sessionId, tab);
    const { first, second } = steps;
    const roundTrip = backend && !first.error ? await checkRoundTrip(cdp, sessionId, tab) : null;
    return { first, steps, secondMatches: JSON.stringify(first) === JSON.stringify(second), roundTrip };
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
      body: JSON.stringify({ blocks: batch, preferences: ALL_PREFERENCES }),
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

// Runs in the content script's isolated world after apply-hiding: is every
// block that should be hidden really hidden, with a box in front of it?
const hidingCheckExpression = `(() => {
  const report = { shouldHide: 0, hiddenOk: 0, notHiddenButShould: [], boxes: 0, boxLabels: {} };
  const boxes = [...document.querySelectorAll("[data-zenfeed-box]")];
  report.boxes = boxes.length;
  for (const box of boxes) {
    const host = box.shadowRoot ? box : box.querySelector("div");
    const label = host.shadowRoot.querySelector(".label").textContent;
    report.boxLabels[label] = (report.boxLabels[label] || 0) + 1;
  }
  return report;
})()`;

// ZenFeed traces: hidden markers, boxes and its hide rule among the adopted
// stylesheets. After "Zobrazit vše" there must be none. The original elements
// are tagged so the check can tell whether any of them was removed.
const snapshotExpression = `(() => {
  const traces = document.querySelectorAll("[data-zenfeed-hidden], [data-zenfeed-box]").length
    + document.adoptedStyleSheets.filter((sheet) => [...sheet.cssRules]
      .some((rule) => rule.cssText.includes("data-zenfeed-hidden"))).length;
  globalThis.__zenfeedOriginal = globalThis.__zenfeedOriginal || [...document.body.querySelectorAll("*")];
  return {
    html: document.body.innerHTML,
    traces,
    originalMissing: globalThis.__zenfeedOriginal.filter((element) => !element.isConnected).length,
  };
})()`;

async function checkHiding(cdp, sessionId, tab, extraction) {
  const ids = JSON.stringify(extraction.blocks.map((block) => block.id));
  // Display of every block element, to compare after "Zobrazit vše".
  const blockDisplays = `${ids}.flatMap((id) => globalThis.zenFeedGetBlock(id).block.elements
    .map((element) => (element.isConnected ? getComputedStyle(element).display : "GONE")))`;
  const before = await evaluateInContentScript(cdp, tab, snapshotExpression);
  const displaysBefore = await evaluateInContentScript(cdp, tab, blockDisplays);
  const hiding = await evaluateInPopup(cdp, sessionId,
    `ZenFeedBootstrap.applyHiding(chrome, ${extraction.tabId}, ${JSON.stringify(extraction.extractionId)})`);
  if (!hiding.ok) {
    return { error: hiding.error };
  }
  const visibleCheck = await evaluateInContentScript(cdp, tab, `(() => {
    let hiddenOk = 0;
    for (const id of ${JSON.stringify(extraction.blocks.map((block) => block.id))}) {
      const entry = globalThis.zenFeedGetBlock(id);
      if (entry && entry.result && entry.result.recommended_action === "hide"
        && entry.block.elements.every((element) => getComputedStyle(element).display === "none")) {
        hiddenOk += 1;
      }
    }
    return hiddenOk;
  })()`);
  const boxes = await evaluateInContentScript(cdp, tab, hidingCheckExpression);
  const status = await evaluateInPopup(cdp, sessionId, `ZenFeedBootstrap.getStatus(chrome, ${extraction.tabId})`);
  const shown = await evaluateInPopup(cdp, sessionId, `ZenFeedBootstrap.showAll(chrome, ${extraction.tabId})`);
  const after = await evaluateInContentScript(cdp, tab, snapshotExpression);
  const displaysAfter = await evaluateInContentScript(cdp, tab, blockDisplays);
  return {
    blockElementsChanged: displaysAfter.filter((display, index) => display !== displaysBefore[index]).length,
    counts: hiding,
    reallyHidden: visibleCheck,
    boxes: boxes.boxes,
    boxLabels: boxes.boxLabels,
    statusHidden: status.ok ? status.hidden : status.error,
    restored: shown.ok ? shown.restored : shown.error,
    traces: after.traces,
    originalMissing: after.originalMissing - before.originalMissing,
    identical: before.html === after.html,
  };
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
  const hiding = await checkHiding(cdp, sessionId, tab, extraction);
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
    hiding,
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
  const { hiding } = roundTrip;
  if (hiding.error) {
    console.log(`  hiding: ${hiding.error}`);
  } else {
    const c = hiding.counts;
    console.log(`  hiding (all preferences on): hidden ${c.hidden}, kept visible: review/show ${c.notHide}, `
      + `wrapper ${c.wrapper}, table cell ${c.unsupported}, failed ${c.failed}; `
      + `really hidden ${hiding.reallyHidden}, boxes ${hiding.boxes}, status ${hiding.statusHidden}`);
    if (Object.keys(hiding.boxLabels).length) {
      console.log(`  box labels: ${JSON.stringify(hiding.boxLabels)}`);
    }
    console.log(`  Zobrazit vše: restored ${hiding.restored}, ZenFeed traces left ${hiding.traces}, `
      + `block elements gone or with another display ${hiding.blockElementsChanged}, `
      + `original elements gone ${hiding.originalMissing}, page HTML identical: ${hiding.identical}`
      + (hiding.identical ? "" : " (the page changed itself, e.g. lazy loading after the layout moved)"));
  }
  console.log(`  old extraction ID after a new extraction: ${roundTrip.stale}`);
  if (roundTrip.removed) {
    console.log(`  zf-0 removed from the page before results: ${roundTrip.removed}`);
  }
}

function printSummary(summary) {
  if (!summary.panel) {
    console.log("  summary panel: not shown");
    return;
  }
  const { privacy, modes } = summary;
  console.log(`  summary request: blocks sent ${privacy.sentBlocks}, hidden elements on page ${privacy.hiddenElements}, `
    + `hidden text found in request ${privacy.leaked}, omitted ${JSON.stringify(privacy.omitted)}, language ${privacy.language}`);
  const ok = modes.ok;
  console.log(`  summary ok: label "${ok.label}" | text "${ok.text.slice(0, 80)}" | link ${ok.link} | ${ok.model}`);
  for (const mode of STUB_MODES.slice(1)) {
    const state = modes[mode];
    console.log(`  summary ${mode}: ${state.status}${state.error ? " (error)" : ""}  result shown: ${state.result}  button: ${state.button}`);
  }
  console.log(`  summary retry after error: result shown: ${modes.retry.result}  text: "${modes.retry.text.slice(0, 40)}"  button: ${modes.retry.button}`);
}

function printResult(url, { first, steps, secondMatches, roundTrip }) {
  console.log(`\n=== ${url}`);
  console.log(`status: ${first.status}${first.error ? " (error)" : ""}`);
  console.log(`title: ${first.title || "-"}  blocks: ${first.blocks || "-"}  hidden: ${first.hidden || "-"}  `
    + `preferences on at open: ${steps.preferencesAtOpen}/6  second analysis same: ${secondMatches}  `
    + `elements from page text: ${first.elementsInSummary}`);
  if (first.notes.length) {
    console.log(`  notes: ${first.notes.join(" | ")}`);
  }
  if (steps.summary) {
    printSummary(steps.summary);
  }
  for (const [name, label] of [["hiddenAnyway", "Přesto skrýt"], ["shown", "Zobrazit vše"], ["rehidden", "Znovu skrýt"], ["shownAgain", "Zobrazit vše"], ["final", "Zobrazit vše (end)"]]) {
    const step = steps[name];
    if (step) {
      console.log(`  ${label}: ${step.status}${step.error ? " (error)" : ""}  hidden: ${step.hidden}`);
    }
  }
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

const keepProfile = Boolean(process.env.ZENFEED_PROFILE);
const profile = process.env.ZENFEED_PROFILE || mkdtempSync(join(tmpdir(), "zenfeed-popup-"));
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
  if (!keepProfile) {
    rmSync(profile, { recursive: true, force: true });
  }
}
