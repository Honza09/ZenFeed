// Loads extension/ unpacked in a headless Chromium browser, clicks the toolbar
// action on each page (this is what grants activeTab), clicks the popup button
// twice and prints what the popup shows. Development tool, no dependencies.
//
// Usage (from the repository root, Node.js 22+):
//   node tests/extension/popup-e2e.mjs <url> [<url> ...]
//   node tests/extension/popup-e2e.mjs --same-tab <url> <url> ...   # navigate one tab
//   BROWSER_PATH=/path/to/chromium node tests/extension/popup-e2e.mjs <url>
//
// --same-tab opens the first URL and navigates the same tab to the next ones,
// clicking the action again after each navigation (Chrome drops the activeTab
// grant on navigation). Without it, each URL gets a new tab.
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

const args = process.argv.slice(2);
const sameTab = args.includes("--same-tab");
const urls = args.filter((arg) => arg !== "--same-tab");
if (!urls.length) {
  console.error("Usage: node tests/extension/popup-e2e.mjs [--same-tab] <url> [<url> ...]");
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
  let lastId = 0;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
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
    return { first, secondMatches: JSON.stringify(first) === JSON.stringify(second) };
  } finally {
    await cdp.send("Target.closeTarget", { targetId: popup.targetId });
  }
}

function printResult(url, { first, secondMatches }) {
  console.log(`\n=== ${url}`);
  console.log(`status: ${first.status}${first.error ? " (error)" : ""}`);
  console.log(`title: ${first.title || "-"}  blocks: ${first.blocks || "-"}  `
    + `second click same: ${secondMatches}  elements from page text: ${first.elementsInSummary}`);
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
