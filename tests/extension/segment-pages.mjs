// Runs the ZenFeed segmenter (extension/content/segmenter.js) on web pages in
// headless Chrome and prints the blocks it finds. Development tool, no dependencies.
//
// Usage (from the repository root, Node.js 22+):
//   node tests/extension/segment-pages.mjs <url> [<url> ...]
//   node tests/extension/segment-pages.mjs --full <url>      # whole block text
//   CHROME_PATH=/path/to/chrome node tests/extension/segment-pages.mjs <url>
//
// Local files work too: file:///absolute/path/tests/extension/fixtures/segmentation.html

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CHROME = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "google-chrome",
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
};
const PORT = 9333;
const PAGE_TIMEOUT_MS = 20000;
const SETTLE_MS = 2500; // time for late scripts to render content
const PREVIEW_CHARS = 100;

const args = process.argv.slice(2);
const full = args.includes("--full");
const urls = args.filter((arg) => arg !== "--full");
if (!urls.length) {
  console.error("Usage: node tests/extension/segment-pages.mjs [--full] <url> [<url> ...]");
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const segmenterSource = readFileSync(join(here, "../../extension/content/segmenter.js"), "utf8");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const reportExpression = `(() => {
  const { blocks, stats } = ZenFeedSegmenter.segmentPage();
  return {
    title: document.title || null,
    stats,
    blocks: blocks.map((block) => ({
      id: block.id,
      kind: block.kind,
      title: block.title,
      text: block.text,
      element: block.elements[0].tagName.toLowerCase(),
      elementCount: block.elements.length,
    })),
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
  throw new Error("Chrome did not start; set CHROME_PATH");
}

function connect(webSocketUrl) {
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
  return new Promise((resolve, reject) => {
    socket.onerror = reject;
    socket.onopen = () => resolve({
      send(method, params = {}, sessionId) {
        const id = ++lastId;
        socket.send(JSON.stringify({ id, method, params, sessionId }));
        return new Promise((done) => pending.set(id, done));
      },
      onEvent(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      close: () => socket.close(),
    });
  });
}

async function segmentUrl(cdp, url) {
  const { result: { targetId } } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  try {
    await cdp.send("Page.enable", {}, sessionId);
    let stopListening;
    const loaded = new Promise((resolve) => {
      stopListening = cdp.onEvent((message) => {
        if (message.sessionId === sessionId && message.method === "Page.loadEventFired") {
          resolve();
        }
      });
    });
    await cdp.send("Page.navigate", { url }, sessionId);
    await Promise.race([loaded, sleep(PAGE_TIMEOUT_MS)]);
    stopListening();
    await sleep(SETTLE_MS);

    const injected = await cdp.send("Runtime.evaluate", { expression: segmenterSource }, sessionId);
    if (injected.result?.exceptionDetails) {
      throw new Error(injected.result.exceptionDetails.exception?.description || "injection failed");
    }
    const evaluated = await cdp.send("Runtime.evaluate", { expression: reportExpression, returnByValue: true }, sessionId);
    if (evaluated.result?.exceptionDetails) {
      throw new Error(evaluated.result.exceptionDetails.exception?.description || "segmentation failed");
    }
    return evaluated.result.result.value;
  } finally {
    await cdp.send("Target.closeTarget", { targetId });
  }
}

function printReport(url, report) {
  const kinds = {};
  for (const block of report.blocks) {
    kinds[block.kind] = (kinds[block.kind] || 0) + 1;
  }
  console.log(`\n=== ${url}`);
  console.log(`title: ${report.title}`);
  console.log(`blocks: ${report.blocks.length}  kinds: ${JSON.stringify(kinds)}  stats: ${JSON.stringify(report.stats)}`);
  for (const block of report.blocks) {
    const text = block.text.replace(/\n/g, " | ");
    const shown = full ? text : text.slice(0, PREVIEW_CHARS);
    console.log(`  ${block.id} [${block.kind}] <${block.element}>x${block.elementCount} ${shown}`);
  }
}

const profile = mkdtempSync(join(tmpdir(), "zenfeed-chrome-"));
const chrome = spawn(process.env.CHROME_PATH || DEFAULT_CHROME[process.platform], [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--window-size=1366,900", "about:blank",
], { stdio: "ignore" });

let exitCode = 0;
try {
  const cdp = await connect(await waitForBrowser());
  for (const url of urls) {
    try {
      printReport(url, await segmentUrl(cdp, url));
    } catch (error) {
      exitCode = 1;
      console.log(`\n=== ${url}\nERROR: ${error.message}`);
    }
  }
  cdp.close();
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
process.exit(exitCode);
