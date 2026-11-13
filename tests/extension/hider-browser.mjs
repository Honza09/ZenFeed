// Browser test for hiding (ZF-10). Loads a fixture in headless Chrome, injects
// the real content scripts (segmenter, registry, hider, content.js) with a
// stub of chrome.runtime, and drives them through their messages:
// extract → apply-results → apply-hiding → "Zobrazit" / "Proč?" → show-all.
// privacy.html (ZF-29) only extracts and checks that no form, editable, hidden
// or site-marked private text becomes a block.
// Exits with code 1 if a check fails. No dependencies, no extension loading.
//
// Usage (from the repository root, Node.js 22+):
//   node tests/extension/hider-browser.mjs
//   CHROME_PATH=/path/to/chrome node tests/extension/hider-browser.mjs

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_CHROME = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "google-chrome",
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
};
const PORT = 9335;

const here = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFileSync(join(here, "../../extension", path), "utf8");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// The content scripts call chrome.runtime.onMessage.addListener; the stub
// keeps the listener so the test can send messages like the popup does.
const chromeStub = `globalThis.chrome = { runtime: { onMessage: { addListener(listener) {
  globalThis.__zenfeedListener = listener;
} } } };`;
const contentScripts = [
  chromeStub,
  read("content/segmenter.js"),
  read("content/block-registry.js"),
  read("content/hider.js"),
  read("content/content.js"),
].join("\n;\n");

// Runs in the page. Returns a list of { name, ok, detail }.
const scenario = `(async () => {
  const checks = [];
  const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail: String(detail) });
  const send = (message) => new Promise((resolve) => globalThis.__zenfeedListener(message, {}, resolve));
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const boxes = () => [...document.querySelectorAll("[data-zenfeed-box]")];
  const boxRoot = (box) => (box.shadowRoot || box.querySelector("div").shadowRoot);
  const boxText = (box) => boxRoot(box).textContent;

  // a2 has inline display:flex !important, the one case where the hider must
  // use the inline style; CSSOM re-serializes it ("…!important;"). Normalize
  // it once before the snapshot so the identity check below stays exact. With
  // a strict CSP the page's inline style is not applied at all, so there is
  // nothing to normalize and the hider uses the attribute rule instead.
  const a2Style = document.getElementById("a2").style;
  if (a2Style.length) {
    a2Style.cssText = a2Style.cssText;
  }
  const a2AttributeBefore = document.getElementById("a2").getAttribute("style");
  const a2DisplayBefore = a2Style.getPropertyValue("display") + " " + a2Style.getPropertyPriority("display");
  const sheetsBefore = document.adoptedStyleSheets.length;
  const htmlBefore = document.body.innerHTML;
  const placeOf = (element) => {
    const rect = element.getBoundingClientRect();
    return Math.round(rect.left) + "+" + Math.round(rect.width);
  };
  const a1PlaceBefore = placeOf(document.getElementById("a1"));
  const a2PlaceBefore = placeOf(document.getElementById("a2"));
  const elementsBefore = [...document.body.querySelectorAll("*")];

  // 1. Extract and fake classifier results by the marker words in the text.
  const extraction = await send({ type: "zenfeed/extract-blocks" });
  check("extraction ok", extraction.ok, JSON.stringify(extraction.error || ""));
  const resultFor = (block) => {
    const base = { id: block.id, category: "jine", topic: "jine", tone: "neutralni", toxicity_score: 0, confidence: 0.9, recommended_action: "show" };
    if (block.text.includes("HIDE-WAR")) return { ...base, category: "valka", topic: "valka", recommended_action: "hide" };
    if (block.text.includes("HIDE-TOXIC")) return { ...base, tone: "toxicky", toxicity_score: 0.9, recommended_action: "hide" };
    if (block.text.includes("REVIEW")) return { ...base, category: "valka", topic: "valka", confidence: 0.5, recommended_action: "review" };
    return base;
  };
  const toHide = extraction.blocks.filter((block) => resultFor(block).recommended_action === "hide");
  const applied = await send({ type: "zenfeed/apply-results", extractionId: extraction.extractionId, results: extraction.blocks.map(resultFor) });
  check("results applied", applied.ok && applied.matched === extraction.blocks.length, JSON.stringify(applied));

  // 2. Stale extraction ID is refused.
  const stale = await send({ type: "zenfeed/apply-hiding", extractionId: "not-this-one" });
  check("stale extraction refused", stale.ok === false && stale.error === "stale_extraction", JSON.stringify(stale));

  // 3. Hide.
  const hiding = await send({ type: "zenfeed/apply-hiding", extractionId: extraction.extractionId });
  check("hiding ok", hiding.ok, JSON.stringify(hiding));
  check("blocks to hide = hidden + unsupported", hiding.hidden + hiding.unsupported === toHide.length,
    "toHide " + toHide.length + " " + JSON.stringify(hiding));
  check("no block failed to hide", hiding.failed === 0, JSON.stringify(hiding));
  check("hiddenIds lists exactly the hidden blocks", hiding.hiddenIds.length === hiding.hidden
    && hiding.hiddenIds.every((id) => toHide.some((block) => block.id === id)), JSON.stringify(hiding.hiddenIds));
  check("one box per hidden block", boxes().length === hiding.hidden, boxes().length);

  const a1 = document.getElementById("a1");
  const a2 = document.getElementById("a2");
  const hiddenNow = (element) => getComputedStyle(element).display === "none";
  check("war article hidden", hiddenNow(a1));
  check("toxic article hidden despite its own display:flex !important", hiddenNow(a2));
  check("review article stays visible", !hiddenNow(document.getElementById("a3")));
  check("show article stays visible", !hiddenNow(document.getElementById("a4")));
  check("text inside hidden block unchanged", a1.textContent.includes("This paragraph reports on fighting"));

  const a1Box = a1.previousElementSibling;
  check("box sits right before the hidden block", a1Box && a1Box.hasAttribute("data-zenfeed-box"));
  check("box has the same left edge and width as its block",
    placeOf(a1Box) === a1PlaceBefore && placeOf(a2.previousElementSibling) === a2PlaceBefore,
    placeOf(a1Box) + " / " + a1PlaceBefore + ", " + placeOf(a2.previousElementSibling) + " / " + a2PlaceBefore);
  check("box label names the topic", a1Box && boxText(a1Box).includes("Skryto: válka"), a1Box && boxText(a1Box));
  check("toxic box names the tone", boxText(a2.previousElementSibling).includes("Skryto: toxický/vyhrocený tón"));
  const boxStyle = getComputedStyle(boxRoot(a1Box).querySelector(".box"));
  check("page CSS does not reach the box", boxStyle.fontSize === "13px" && boxStyle.color !== "rgb(255, 0, 0)",
    boxStyle.fontSize + " " + boxStyle.color);

  check("box on a light page uses the light theme", !(a1Box.getAttribute("data-zenfeed-theme")), a1Box.getAttribute("data-zenfeed-theme"));
  // Under the strict CSP fixture the page's inline background is not applied,
  // so the expected theme follows the background the browser actually shows.
  const darkWrapper = document.getElementById("dark");
  const darkBox = darkWrapper.querySelector("[data-zenfeed-box]");
  const wrapperIsDark = getComputedStyle(darkWrapper).backgroundColor === "rgb(17, 17, 17)";
  check("box theme follows the background behind it", darkBox
    && (darkBox.getAttribute("data-zenfeed-theme") === "dark") === wrapperIsDark,
    (darkBox && darkBox.getAttribute("data-zenfeed-theme")) + " / background dark: " + wrapperIsDark);

  const listBox = boxes().find((box) => box.parentElement && box.parentElement.id === "list");
  check("list item gets an li box", listBox && listBox.tagName === "LI", listBox && listBox.tagName);
  const rowBox = boxes().find((box) => box.tagName === "TR");
  if (rowBox) {
    check("table row gets a tr box spanning the row", rowBox.firstElementChild.colSpan === 2, rowBox.firstElementChild.colSpan);
  }

  // 4. Hiding twice does not hide or box anything twice.
  const again = await send({ type: "zenfeed/apply-hiding", extractionId: extraction.extractionId });
  check("second hiding hides nothing new", again.hidden === 0 && again.alreadyHidden === hiding.hidden, JSON.stringify(again));
  check("no extra boxes", boxes().length === hiding.hidden, boxes().length);

  // 5. Own boxes are not new content, and the segmenter does not read them.
  await wait(700);
  const status1 = await send({ type: "zenfeed/status" });
  check("status counts hidden blocks", status1.hidden === hiding.hidden, JSON.stringify(status1));
  check("own boxes are not counted as new content", status1.newContent === 0, JSON.stringify(status1));
  const segmentedWhileHidden = ZenFeedSegmenter.segmentPage().blocks.map((block) => block.text).join("\\n");
  check("segmenter does not read box text", !segmentedWhileHidden.includes("Skryto"));
  check("segmenter skips hidden blocks", !segmentedWhileHidden.includes("This paragraph reports on fighting"));

  // 6. "Proč byl tento obsah skryt?" toggles the explanation.
  const [, whyButton] = boxRoot(a1Box).querySelectorAll("button");
  const why = boxRoot(a1Box).querySelector(".why");
  check("explanation hidden at first", why.hidden && whyButton.getAttribute("aria-expanded") === "false");
  whyButton.click();
  check("explanation shown after click", !why.hidden && whyButton.getAttribute("aria-expanded") === "true");
  check("explanation names topic and confidence", why.textContent.includes("Téma: válka (jistota 90 %)"), why.textContent);

  // 7. "Zobrazit" restores one block and removes its box; it is not hidden again.
  boxRoot(a1Box).querySelector("button").click();
  check("Zobrazit restores the block", !hiddenNow(a1));
  check("Zobrazit removes the box", !a1Box.isConnected);
  const afterReveal = await send({ type: "zenfeed/apply-hiding", extractionId: extraction.extractionId });
  check("revealed block is not hidden again", afterReveal.revealed === 1 && afterReveal.hidden === 0, JSON.stringify(afterReveal));

  // 8. New content is counted, in batches, without analysis.
  const added = document.createElement("article");
  added.textContent = "NEW Content loaded later by the page, for example after a Show more button.";
  document.querySelector("main").append(added);
  await wait(700);
  const status2 = await send({ type: "zenfeed/status" });
  check("new page content is counted", status2.newContent === 1, JSON.stringify(status2));
  added.remove();

  // 9. "Zobrazit vše" returns the page to its original state.
  const shown = await send({ type: "zenfeed/show-all" });
  check("show-all restores the remaining hidden blocks", shown.ok && shown.restored === hiding.hidden - 1, JSON.stringify(shown));
  check("no boxes left", boxes().length === 0, boxes().length);
  check("inline style restored exactly", a2.getAttribute("style") === a2AttributeBefore
    && a2.style.getPropertyValue("display") + " " + a2.style.getPropertyPriority("display") === a2DisplayBefore,
    a2.getAttribute("style") + " / " + a2DisplayBefore);
  check("hide stylesheet removed again", document.adoptedStyleSheets.length === sheetsBefore, document.adoptedStyleSheets.length);
  check("element without style attribute has none again", !a1.hasAttribute("style"), a1.getAttribute("style"));
  check("page HTML identical to the original", document.body.innerHTML === htmlBefore);
  const elementsAfter = [...document.body.querySelectorAll("*")];
  check("same element objects, none removed or replaced",
    elementsAfter.length === elementsBefore.length && elementsAfter.every((element, index) => element === elementsBefore[index]),
    elementsBefore.length + " → " + elementsAfter.length);

  // 10. A new extraction after show-all can hide again.
  const second = await send({ type: "zenfeed/extract-blocks" });
  await send({ type: "zenfeed/apply-results", extractionId: second.extractionId, results: second.blocks.map(resultFor) });
  const rehide = await send({ type: "zenfeed/apply-hiding", extractionId: second.extractionId });
  check("new extraction hides again, including the block revealed before", rehide.hidden === hiding.hidden, JSON.stringify(rehide));
  await send({ type: "zenfeed/show-all" });
  check("page HTML identical after the second round", document.body.innerHTML === htmlBefore);

  return { checks, counts: hiding };
})()`;

// ZF-29: what the content script hands to the popup, which sends it unchanged.
const privacyScenario = `(async () => {
  const checks = [];
  const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail: String(detail) });
  const send = (message) => new Promise((resolve) => globalThis.__zenfeedListener(message, {}, resolve));
  const extraction = await send({ type: "zenfeed/extract-blocks" });
  check("extraction ok", extraction.ok, JSON.stringify(extraction.error || ""));
  const texts = extraction.blocks.map((block) => (block.title || "") + " " + block.text).join("\\n");
  const leaked = texts.match(/SECRET-[A-Z]+/g) || [];
  check("no form, editable, hidden, header, dialog or private-marked text in any block", leaked.length === 0, leaked.join(", "));
  check("ordinary article is a block", texts.includes("VISIBLE-ARTICLE"));
  check("data-clarity-mask=false is not treated as private", texts.includes("VISIBLE-UNMASKED"));
  const keys = [...new Set(extraction.blocks.flatMap((block) => Object.keys(block)))].sort();
  check("blocks carry only id, kind, title, text (and contains)",
    keys.every((key) => ["contains", "id", "kind", "text", "title"].includes(key)), keys.join(","));
  return { checks, counts: { blocks: extraction.blocks.length } };
})()`;

const FIXTURES = [
  ["hider.html", scenario], ["hider-csp.html", scenario], ["privacy.html", privacyScenario],
];

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
  };
}

async function runFixture(cdp, fixture, fixtureScenario) {
  const url = pathToFileURL(join(here, "fixtures", fixture)).href;
  const { result: { targetId } } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const consoleErrors = [];
  const stop = cdp.onEvent((message) => {
    if (message.sessionId === sessionId && message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
  });
  try {
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.navigate", { url }, sessionId);
    await sleep(1000);
    const injected = await cdp.send("Runtime.evaluate", { expression: contentScripts }, sessionId);
    if (injected.result?.exceptionDetails) {
      throw new Error(injected.result.exceptionDetails.exception?.description || "injection failed");
    }
    const evaluated = await cdp.send("Runtime.evaluate", {
      expression: fixtureScenario, awaitPromise: true, returnByValue: true,
    }, sessionId);
    if (evaluated.result?.exceptionDetails) {
      throw new Error(evaluated.result.exceptionDetails.exception?.description || "scenario failed");
    }
    const { checks, counts } = evaluated.result.result.value;
    checks.push({ name: "no console errors", ok: consoleErrors.length === 0, detail: consoleErrors.join(" | ") });
    return { checks, counts };
  } finally {
    stop();
    await cdp.send("Target.closeTarget", { targetId });
  }
}

const profile = mkdtempSync(join(tmpdir(), "zenfeed-hider-"));
const chrome = spawn(process.env.CHROME_PATH || DEFAULT_CHROME[process.platform], [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--allow-file-access-from-files", "about:blank",
], { stdio: "ignore" });

let failed = 0;
let cdp;
try {
  cdp = await connect(await waitForBrowser());
  for (const [fixture, fixtureScenario] of FIXTURES) {
    const { checks, counts } = await runFixture(cdp, fixture, fixtureScenario);
    console.log(`\n=== ${fixture}  counts: ${JSON.stringify(counts)}`);
    for (const { name, ok, detail } of checks) {
      console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  (${detail})` : ""}`);
      if (!ok) {
        failed += 1;
      }
    }
  }
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  failed += 1;
} finally {
  cdp?.close();
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
