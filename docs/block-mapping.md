# Block ID mapping (ZF-09)

The content script keeps the blocks of the last extraction with their DOM elements. Analysis results from `/v1/analyze` are assigned back to these blocks by block ID. Nothing on the page changes here; hiding is ZF-10, calling the backend from the extension is ZF-12.

This covers the parts of ZF-09 that do not depend on the ZF-07 go/no-go decision. The segmenter changes proposed in ZF-07 option B (drop wrapper elements, cookie bars, footers, re-run after more content loads) are not done here; they wait for the team decision.

## Why an extraction ID

Block IDs are `zf-0`, `zf-1`, … in document order, and every extraction assigns them again. If the user clicks again (or the page changes) while a request to the backend is running, the old results would otherwise land on the new `zf-5`, which can be a different element. So:

- every extraction gets a random `extractionId` (`crypto.randomUUID()`);
- results are accepted only with the `extractionId` of the current extraction;
- a new extraction drops the previous results.

The `extractionId` stays in the extension. It is not sent to the backend and the backend API is unchanged (`docs/API.md`).

## Flow (for ZF-12)

```js
const extraction = await ZenFeedBootstrap.extractActiveTab(chrome);
// extraction: { ok, tabId, extractionId, title, blocks, stats }
// POST extraction.blocks to /v1/analyze (at most 100 per request), collect results
const reply = await ZenFeedBootstrap.applyResults(chrome, extraction.tabId, extraction.extractionId, results);
```

`applyResults` may be called several times for one extraction (one call per batch). A block that already has a result from an earlier call gets the newer one.

## Messages

`zenfeed/extract-blocks` (see [`segmentation.md`](segmentation.md)) now also returns `"extractionId": "<uuid>"`.

`zenfeed/apply-results`:

```js
await chrome.tabs.sendMessage(tabId, {
  type: "zenfeed/apply-results",
  extractionId: "<uuid from extract-blocks>",
  results: [
    { "id": "zf-0", "category": "war", "toxicity_score": 0.1, "confidence": 0.9, "recommended_action": "hide" }
  ],
});
```

Reply:

```json
{ "ok": true, "matched": 1, "unknown": 0, "invalid": 0, "duplicate": 0, "detached": 0 }
```

| Count | Meaning |
|---|---|
| `matched` | Result assigned to the block with the same ID |
| `unknown` | No block with this ID in the current extraction; ignored |
| `invalid` | Not a valid `/v1/analyze` result (missing field, score outside 0–1, unknown action, ID or category too long); ignored |
| `duplicate` | Same ID twice in one call; the first one wins |
| `detached` | The block's element is no longer in the page (re-rendered); no result is assigned |

Errors: `{ "ok": false, "error": … }` with `no_extraction` (no extraction yet in this tab), `stale_extraction` (another extraction happened since; analyze again), `invalid_results` (`results` is not a list) or `apply_failed` (unexpected exception). `ZenFeedBootstrap.applyResults` adds `tab_unavailable` when the tab was closed, navigated or reloaded, or the reply has an unexpected shape.

Only `category`, `toxicity_score`, `confidence` and `recommended_action` are stored. Other fields from the backend are dropped.

## Reading the registry (for ZF-10)

In the content script:

```js
const entry = globalThis.zenFeedGetBlock("zf-3");
// null, or { block, containsBlocks, result }
//   block.elements      DOM elements of the block (never leave the content script)
//   containsBlocks      how many other blocks are inside this block's elements
//   result              null until a result was applied, then the four fields above
```

**`containsBlocks > 0` means the block's element wraps other blocks.** The segmenter sometimes returns a short block (25–460 characters of text) whose element is a page-wide wrapper. Hiding it would hide every block inside it. ZF-10 must not hide such a block. Measured on 3 Nov 2026:

| Page | Blocks | Wrapper blocks (contained blocks) |
|---|---:|---|
| P01 ourworldindata.org/war-and-peace | 75 | `zf-4` (71), `zf-6` (54), `zf-61` (71) |
| P02 forum.effectivealtruism.org | 51 | `zf-0` (49) |
| P03 nasa.gov/news/recently-published | 26 | `zf-0` (25) |
| P04 ourworldindata.org/latest | 23 | none |
| P05 en.wikipedia.org Talk:Russo-Ukrainian_war | 49 | `zf-0` (48) and 4 blocks with 2 each |
| P06 horydoly.cz | 52 | `zf-8`, `zf-17`, `zf-37` (43 each) |
| en.wikipedia.org/wiki/Rosetta_Stone | 180 | 5, e.g. `zf-0` (179) |
| cs.wikipedia.org/wiki/Globální_oteplování | 400 | 9, e.g. `zf-0` (399) |

P01 `zf-4` and `zf-61` are the same wrappers that the ZF-07 evaluation found. The count is computed when the blocks are stored; it took at most 10 ms on 400 blocks.

## Excluded content

The segmenter already skipped `input`, `textarea`, `select`, forms and hidden elements (`hidden`, `aria-hidden`, `display:none`, `visibility:hidden`, `opacity:0`). ZF-09 adds `contenteditable` (rich-text editors, comment boxes): text the user is writing is not segmented and not sent anywhere. Fixture: `tests/extension/fixtures/editable.html` (before the change: the two editable drafts were returned as blocks; after: only the article).

## Files

| File | Responsibility |
|---|---|
| `extension/content/block-registry.js` | Registry: extraction ID, result validation, assignment by ID, `containsBlocks` |
| `extension/content/content.js` | Messages `zenfeed/extract-blocks` and `zenfeed/apply-results`, `zenFeedGetBlock` |
| `extension/content/segmenter.js` | Excludes `contenteditable` |
| `extension/popup/bootstrap.js` | Injects the registry, returns `tabId` and `extractionId`, `applyResults` |
| `tests/extension/block-registry.test.mjs` | Unit tests of the registry with fake elements |
| `tests/extension/bootstrap.test.mjs` | Unit tests of `extractActiveTab` and `applyResults` with a fake `chrome` API |
| `tests/extension/popup-e2e.mjs --backend=<url>` | Round trip in a real browser with the real backend |

## How to test

```bash
node --test tests/extension/*.test.mjs
uvicorn app.main:app --app-dir backend --port 8001
python3 -m http.server 8765 --directory tests/extension/fixtures
node tests/extension/popup-e2e.mjs --backend=http://127.0.0.1:8001 http://127.0.0.1:8765/segmentation.html https://www.nasa.gov/news/recently-published/
```

Run the last three commands in separate terminals. `--backend` sends the page blocks to the local backend (the ZF-05 placeholder, which returns `review` for every block). For each page it prints how many results were matched, whether every block in the registry has its result, whether the first line of each block's text is in its elements, how many wrapper blocks there are, that an old `extractionId` is rejected, and that removing `zf-0` from the page before the results arrive leaves `zf-0` without a result.

## Test results (3 Nov 2026)

Automated: `ruff check backend` passed, `pytest backend` 26 passed, manifest OK, `node --check` on extension and test scripts OK, `node --test tests/extension/*.test.mjs` 27 of 27 passed (Node 25.9).

Round trip in headless Brave 156 with the ZF-05 backend running locally:

| Page | Blocks | Batches | Matched | Unknown ID ignored | Registry check | Old `extractionId` | `zf-0` removed first |
|---|---:|---:|---:|---|---|---|---|
| P01 OWID war-and-peace | 75 | 1 | 75 | yes | 75/75, text ok | rejected | no result, detached 1 |
| P02 EA Forum | 51 | 1 | 51 | yes | 51/51, text ok | rejected | no result, detached 50 |
| P03 NASA news | 26 | 1 | 26 | yes | 26/26, text ok | rejected | no result, detached 26 |
| P04 OWID latest | 23 | 1 | 23 | yes | 23/23, text ok | rejected | no result, detached 1 |
| P05 Wikipedia Talk | 49 | 1 | 49 | yes | 49/49, text ok | rejected | no result, detached 49 |
| P06 horydoly.cz | 52 | 1 | 52 | yes | 52/52, text ok | rejected | no result, detached 1 |
| en.wikipedia Rosetta Stone | 180 | 2 | 180 | yes | 180/180, text ok | rejected | no result, detached 180 |
| cs.wikipedia Globální oteplování | 400 | 4 | 400 | yes | 400/400, text ok | rejected | no result, detached 400 |
| Fixtures: segmentation, editable, no-title, html-title | 8, 1, 1, 1 | 1 | all | yes | all, text ok | rejected | no result |
| Fixture: empty | 0 | 0 | 0 | – | – | rejected | – |
| `file://`, `chrome://version/`, Chrome Web Store | – | – | – | – | – | – | restricted message, no round trip |

`--same-tab` (fixture → no-title → `chrome://version/` → nasa.gov in one tab) gave the same results as new tabs.

"detached 50" and similar: `zf-0` on those pages is a wrapper, so removing it removes the blocks inside it as well; none of them got a result. On the empty fixture the test's extra "unknown ID" result is counted as `invalid`, because it is copied from a first result that does not exist.

While writing the text check, two causes of false alarms were found and the check was adjusted, not the extension: `innerText` applies CSS `text-transform` (OWID shows "TODAY" for "Today"), and the block text leaves out dropped leaves (a short byline on EA Forum). The check now compares the first line of the block text with the element text, ignoring case and whitespace.

Not tested: desktop Google Chrome with a real click; a real slow backend racing a second click (covered by the `stale_extraction` unit and e2e checks, which simulate it with a second extraction).

## Known limitations

- Wrapper blocks are only reported (`containsBlocks`); the segmenter still returns them. Dropping them is ZF-07 option B, waiting for the team decision.
- The segmenter joins inline runs with a space, so the text sent to the backend can contain "Dacier , secretary" where the page has "Dacier, secretary" (seen on Rosetta Stone `zf-36`). It does not affect mapping; it slightly changes the text the classifier sees.
- A result is checked against the elements only when it is applied. If the page removes an element later, ZF-10 has to check `isConnected` again before hiding.
- After navigation or reload the content script and its registry are gone; results for that tab end with `tab_unavailable`.
- `document.designMode = "on"` makes the whole page editable, so it yields no blocks.
