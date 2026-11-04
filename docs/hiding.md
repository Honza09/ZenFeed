# Hiding blocks, the "Zobrazit" box and restoring (ZF-10)

The content script hides the blocks whose analysis result is `hide` and puts a small box in front of each: "Skryto: válka — Zobrazit · Proč byl tento obsah skryt?". The page text is never changed, and no page element is removed, moved or replaced. "Zobrazit" shows one block, "Zobrazit vše" returns the page to its original state.

This builds on the block registry ([`block-mapping.md`](block-mapping.md), ZF-09) and on the classifier results (`docs/API.md`, ZF-06). The popup buttons ("Analyzovat", "Pozastavit", "Obnovit vše", count of hidden blocks) are ZF-11. Calling the backend from the extension is ZF-12. Both can use the helpers below.

## When a block is hidden

A block is hidden only if all of these hold. Otherwise it stays visible and is counted under the reason in brackets.

1. It has a result in the current extraction (`noResult`).
2. The result is `recommended_action: "hide"`. `review` and `show` never hide; uncertainty never hides (`notHide`).
3. The result names a reason: a topic from `docs/kategorie-mvp.md` other than `jine`, or the tone `toxicky` (`notHide`).
4. The block's element does not contain other blocks, `containsBlocks === 0` (`wrapper`). The segmenter sometimes returns a page-wide wrapper as a short block. On P01 and P05 the backend recommended hiding such wrappers (2 and 3 of them); hiding one would have hidden most of the page.
5. All its elements are still in the page (`detached`).
6. None of its elements is a table cell (`td`, `th`) or another table part (`unsupported`). A cell cannot be hidden without breaking the table. Table rows (`tr`) can be hidden.
7. The user has not clicked "Zobrazit" on it since the last extraction (`revealed`).

If hiding one block fails (an exception), everything done for that block is undone, it stays visible, and the others continue (`failed`).

## How it hides

- A hidden element gets the attribute `data-zenfeed-hidden`. A stylesheet that ZenFeed adds to the document (`document.adoptedStyleSheets`) turns it into `display: none !important`. Restoring removes the attribute, so the element is exactly as before. The stylesheet is removed again when nothing is hidden.
- If the page forces `display` with inline `!important`, the attribute rule loses. Only then is `display: none !important` set in the element's inline style, and the original value and priority are put back on restore. In that case the browser may re-serialize the style attribute (a trailing `;`); the declarations are the same.
- Every hide is checked with `getComputedStyle(element).display === "none"`. A block that cannot be hidden is not hidden at all.
- Styles are set through CSSOM (constructed stylesheets, `style.setProperty`), which a page Content-Security-Policy does not block. Tested with `style-src 'none'`.

## The box

- Inserted right before the block's first element: a `<div>`, an `<li>` inside lists, a `<tr>` with one cell spanning the row inside tables.
- Its content is in a shadow root, so page CSS does not reach it (the test page forces red 40 px text with `!important`; the box stays 13 px) and the segmenter does not read its text. All text is set with `textContent`.
- Label: "Skryto: válka", "Skryto: toxický/vyhrocený tón" or both ("Skryto: násilí · toxický/vyhrocený tón"). Names from `docs/kategorie-mvp.md`.
- "Proč byl tento obsah skryt?" toggles an explanation (`aria-expanded`), naming only what caused the hiding: "Téma: válka (jistota 83 %). Tón: toxický/vyhrocený (skóre 90 %). Blok odpovídá tématu nebo tónu, které jste zvolili ke skrytí. Klasifikace je automatická a může se mýlit; text bloku nebyl změněn."
- Light by default. If the first opaque background behind the block is dark, the box uses dark colors. It follows the page, not the browser theme.

## New content (MutationObserver)

After an extraction, the content script counts elements the page adds later (at least 25 characters of text, for example after "Show more"). Mutations are processed in batches every 500 ms, and ZenFeed's own boxes are ignored. It only counts: nothing is analyzed or sent until the user asks again (proposal §4.2). The count is in `zenfeed/status` as `newContent`, so ZF-11 can offer "Na stránce přibyl obsah, analyzovat znovu". A new extraction resets it.

## Messages and helpers

| Message | Reply |
|---|---|
| `{ type: "zenfeed/apply-hiding", extractionId }` | `{ ok: true, hidden, alreadyHidden, revealed, noResult, notHide, wrapper, detached, unsupported, failed, hiddenTotal }`, or `{ ok: false, error }` with `no_extraction`, `stale_extraction`, `hiding_failed` |
| `{ type: "zenfeed/show-all" }` | `{ ok: true, restored }` |
| `{ type: "zenfeed/status" }` | `{ ok: true, hidden, newContent }` |

In the popup, after `extractActiveTab` and `applyResults` ([`block-mapping.md`](block-mapping.md)):

```js
await ZenFeedBootstrap.applyHiding(chrome, extraction.tabId, extraction.extractionId);
await ZenFeedBootstrap.getStatus(chrome, extraction.tabId);  // { ok, hidden, newContent }
await ZenFeedBootstrap.showAll(chrome, extraction.tabId);    // "Zobrazit vše"
```

Each returns `{ ok: false, error: "tab_unavailable" }` if the tab was closed, navigated or reloaded, or if the reply has an unexpected shape.

Hiding twice is safe: a block that is already hidden is counted as `alreadyHidden` and gets no second box. Hidden blocks are tracked by element, not by block ID, so "Zobrazit vše" also restores blocks hidden before a later extraction. A new extraction does not see hidden blocks (they are `display: none`), and it resets the "Zobrazit" clicks.

## Files

| File | Responsibility |
|---|---|
| `extension/content/hider.js` | Decision, hiding, boxes, restoring |
| `extension/content/content.js` | Messages `apply-hiding`, `show-all`, `status`; new-content observer |
| `extension/content/block-registry.js` | Now also keeps `topic` and `tone` from the result |
| `extension/popup/bootstrap.js` | Injects `hider.js`; `applyHiding`, `showAll`, `getStatus` |
| `tests/extension/hider.test.mjs` | Unit tests: decision, labels, explanation |
| `tests/extension/hider-browser.mjs` | Browser test with exit code (in CI): real content scripts in headless Chrome on `hider.html` and `hider-csp.html` |
| `tests/extension/popup-e2e.mjs --backend=<url>` | Real extension and backend: hides with all preferences on, then "Zobrazit vše" |

## How to test

```bash
node --test tests/extension/*.test.mjs
node tests/extension/hider-browser.mjs
```

End to end with the real extension and backend (three terminals; see [`block-mapping.md`](block-mapping.md)):

```bash
uvicorn app.main:app --app-dir backend --port 8001
python3 -m http.server 8765 --directory tests/extension/fixtures
node tests/extension/popup-e2e.mjs --backend=http://127.0.0.1:8001 http://127.0.0.1:8765/hider.html https://ourworldindata.org/war-and-peace
```

## Test results (4 Nov 2026)

Automated: `ruff check backend` passed, `pytest backend` 42 passed, manifest OK, `node --check` OK, `node --test tests/extension/*.test.mjs` 41 of 41 passed, `hider-browser.mjs` all checks passed on both fixtures (Chrome, Node 25.9). The CI step for `hider-browser.mjs` was added but has not run on GitHub yet.

`hider-browser.mjs` checks, on `hider.html` and on the same page with `style-src 'none'`:

- the war and toxic blocks are hidden, also one with its own inline `display: flex !important`; `review` and `show` blocks stay visible; the text inside hidden blocks is unchanged;
- one box per hidden block, right before it, with the right label; `li` box in a list, `tr` box spanning the row in a table;
- page CSS does not reach the box; the box theme follows the background behind it;
- a stale `extractionId` is refused; hiding twice adds nothing; the segmenter neither reads box text nor returns hidden blocks;
- "Proč?" toggles the explanation; "Zobrazit" restores one block, removes its box, and the block is not hidden again until the next extraction;
- own boxes do not count as new content; an article the page adds later counts as 1;
- after "Zobrazit vše": no boxes, no attributes, the stylesheet is removed, the inline style is restored, `document.body.innerHTML` is identical to the original and every element is the same object as before; a second round gives the same result; no console errors.

`popup-e2e.mjs` in headless Brave 156, extension loaded unpacked, ZF-06 backend (`lexicon-1`) with all six preferences on:

| Page | Blocks | Hidden | Not hidden: wrapper | Box labels | After "Zobrazit vše" |
|---|---:|---:|---:|---|---|
| P01 ourworldindata.org/war-and-peace | 75 | 48 | 2 | válka 30, zprávy o úmrtí 18 | no traces, block elements unchanged; page HTML differs (see below) |
| P02 forum.effectivealtruism.org | 51 | 0 | 0 | – | identical |
| P03 nasa.gov/news/recently-published | 26 | 0 | 0 | – | identical |
| P04 ourworldindata.org/latest | 23 | 3 | 0 | zprávy o úmrtí 3 | identical |
| P05 en.wikipedia.org Talk:Russo-Ukrainian_war | 49 | 11 | 3 | válka 10, politické konflikty 1 | identical |
| P06 horydoly.cz | 50 | 0 | 0 | – | identical |
| en.wikipedia.org Rosetta Stone | 179 | 13 | 0 | válka 8, zprávy o úmrtí 4, násilí 1 | identical |
| cs.wikipedia.org Globální oteplování | 400 | 21 | 0 | katastrofické scénáře 14, zprávy o úmrtí 4, válka 2, politické konflikty 1 | identical |
| `hider.html`, `hider-csp.html` | 11 | 4 | 0 | válka 4 | identical |

On every page the number of hidden blocks equals the number of boxes, the number of elements really computed as `display: none`, and the hidden count in `zenfeed/status`. Restoring worked in 100 % of the tested cases: no ZenFeed attribute, box or stylesheet was left, and no block element was missing or had another `display` than before.

P01: after hiding, the layout moved and the page itself lazy-loaded its embedded "Data Explorer", replacing its own placeholder element. That is why the page HTML is not identical after restoring. A control run without hiding gave identical HTML 3 seconds apart, and the only extra adopted stylesheet belonged to the page.

The hidden counts show what the current `lexicon-1` classifier does with every preference on; they are not a quality measurement (that is ZF-19 and ZF-20). P01 hides 48 of 75 blocks because the page is about war and deaths.

Not tested: desktop Google Chrome with a real click; pages whose background is an image (the box theme only looks at background colors).

## Known limitations

- Table cells are never hidden, so a block that the segmenter made from a cell stays visible.
- Wrapper blocks are not hidden even when the result says `hide`; their content stays visible until the segmenter handles wrappers (ZF-07 option B, waiting for the team decision).
- Hiding changes the layout, and pages may react to it (lazy loading, sticky elements). ZenFeed restores its own changes, not what the page does in response.
- The observer counts only added elements; text changed inside existing elements is not counted.
- After navigation or reload the hidden state is gone together with the content script, and the page shows everything again.
