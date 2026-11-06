# Edge states (ZF-28)

The proposal (§4.1 #5) and `docs/mvp.md` F5 require a clear message when the page has little text, when its content is not accessible, when nothing relevant is left after hiding, and when the service fails. ZenFeed never invents replacement content. ZF-28 also asks for a warning and a mode in which nothing is hidden on a page that ZenFeed cannot divide well.

All texts are in the popup ([`popup.md`](popup.md)); the decision logic is in `extension/popup/page-quality.js`.

## States and what the user sees

| State | When | Sent to the backend | Hidden | Popup message |
|---|---|---|---|---|
| No readable content | The segmenter found no block | no | no | Na stránce jsem nenašel žádný čitelný obsah. Nic se neodeslalo ani neskrylo. |
| Little text | All blocks together have fewer than 200 characters | no | no | Na stránce je jen velmi málo čitelného textu (znaky: N). ZenFeed ho neposlal k analýze a nic neskryl. |
| Page is one block (review mode) | The whole page text is a single block | yes | **no**, unless the user clicks **Přesto skrýt** | ZenFeed stránku nerozdělil na samostatné části: celý text je jeden blok. Odpovídá vašemu nastavení, ale jeho skrytím by zmizela celá stránka, proto zůstal viditelný. Můžete ho přesto skrýt. (If the block does not match: … Neodpovídá zvoleným tématům ani tónu; nic se neskrylo.) |
| Nothing relevant left | After hiding, less than 15 % of the page text, or less than 200 characters, is still visible | – | as chosen | … Po skrytí na stránce nezůstal téměř žádný obsah (viditelný text: X %). ZenFeed nic nedoplňuje; celou stránku zobrazíte tlačítkem Zobrazit vše. |
| Long page (note) | The segmenter stopped at 400 blocks | yes | yes | Stránka je dlouhá: zpracovalo se prvních 400 bloků, zbytek stránky zůstal beze změny. |
| Very long block (note) | A block was cut to 3,000 characters | yes | yes | Velmi dlouhé bloky se posuzovaly jen podle začátku textu (bloky: N). |
| Inaccessible page | `chrome://`, `about:`, Chrome Web Store, `file://`, or the access was lost (ZF-08) | no | no | Na této stránce ZenFeed nefunguje … / ZenFeed k této stránce nemá přístup … |
| Service error | Backend not running, timeout, error status, invalid response (ZF-11) | – | no | Server ZenFeed neběží … / neodpověděl včas … / vrátil chybu … / vrátil neplatnou odpověď … — each ends "Nic se neskrylo." |
| Uncertain or unsafe blocks | `review` results, wrapper blocks, table cells (ZF-10) | yes | those blocks no | Nejisté, ponechané viditelné: N. / Nešlo bezpečně skrýt, ponechané viditelné: N. |
| Nothing matches | No block matches the chosen topics or tone | yes | no | Nic na stránce neodpovídá zvoleným tématům ani tónu. |

In every state the page itself is unchanged except for hidden blocks and their boxes; no text is added to the page.

## Why these thresholds

They are working thresholds, to be checked on the 24-page set (ZF-19, ZF-20). All are constants at the top of `page-quality.js`.

- **One block → review mode.** With one block, hiding it hides the whole page, so ZenFeed cannot hide "a part". Measured on 6 Nov 2026 with `segment-pages.mjs`: all pilot pages P01–P06 have 23–77 blocks; example.com and the `single-block.html` fixture have one.
- **No threshold on the largest block's share.** On P01–P06 the largest block holds at most 13 % of the text, but short, correctly divided pages have much higher shares (`segmentation.html` 68 %, nasa.gov homepage 50 %). A share threshold would have put correctly divided pages into review mode, so none is used.
- **200 characters.** Two or three sentences. Below that a classification says little and hiding would leave an empty page. `no-title.html` (115) and `editable.html` (196) fall under it; every pilot page is far above it.
- **Nothing left: 15 % or 200 characters.** If more than 85 % of the text is hidden, the user should know the page is effectively empty and that ZenFeed does not fill it.

"Neznámá nebo nekvalitně extrahovaná stránka" from the backlog is covered by the one-block review mode, the wrapper rule of ZF-10 and the notes above. A wider definition of a badly divided page waits for the ZF-07 decision (supported page types).

## Files

| File | Change |
|---|---|
| `extension/popup/page-quality.js` | New: `assessExtraction`, `assessOutcome`, `countMatching` |
| `extension/popup/popup.html`, `popup.js`, `popup.css` | Notes list, "Přesto skrýt" button, messages; a new analysis hides the old "Znovu skrýt" |
| `extension/content/hider.js` | `applyHiding` also returns `hiddenIds` |
| `extension/popup/bootstrap.js` | Validates `hiddenIds` |
| `tests/extension/page-quality.test.mjs` | Unit tests |
| `tests/extension/fixtures/single-block.html`, `mostly-war.html`, `long-block.html` | Fixtures for review mode, nothing left, truncated block |
| `tests/extension/popup-e2e.mjs` | Clicks "Přesto skrýt" when offered; prints notes |

## Test results (6 Nov 2026)

Automated: `ruff check backend` passed, `pytest backend` 42 passed, manifest OK, `node --check` OK, `node --test tests/extension/*.test.mjs` 63 of 63 passed on Node 25.9 and on Node 22.23 (the CI version), `hider-browser.mjs` all checks passed on Node 22.

`popup-e2e.mjs` in headless Brave 156 with the extension loaded and `lexicon-1` on 127.0.0.1:8000, every switch on:

| Page | Result |
|---|---|
| `empty.html` | no readable content; nothing sent |
| `no-title.html` (115 characters), `editable.html` (196) | little text; nothing sent |
| `single-block.html` (war, 311 characters) | review mode, block kept visible; **Přesto skrýt** hid it and showed "nezůstal téměř žádný obsah (0 %)"; Zobrazit vše / Znovu skrýt worked; a second analysis gave the same state |
| `html-title.html` (one block, no match) | review mode, "Neodpovídá zvoleným tématům ani tónu; nic se neskrylo." |
| `mostly-war.html` | 4 of 4 hidden, "nezůstal téměř žádný obsah (0 %)" |
| `long-block.html` | note "Velmi dlouhé bloky … (bloky: 1)", nothing matched |
| cs.wikipedia Globální oteplování | note "Stránka je dlouhá: zpracovalo se prvních 400 bloků …", 21 of 400 hidden |
| P01 OWID war-and-peace | 48 of 74 hidden, 2 not safe to hide; no edge message (visible text above 15 %) |
| P02, P03, P04, P05, P06, Rosetta Stone, `segmentation.html`, `hider-csp.html` | unchanged from ZF-11; ZF-10 round trip found no traces after "Zobrazit vše" |
| `chrome://version/`, Chrome Web Store | inaccessible-page messages |
| Backend stopped | every page that reached the analysis: "Server ZenFeed neběží … Nic se neskrylo."; pages with little or no text sent nothing |

Bug found and fixed: after "Zobrazit vše", a new analysis kept the old "Znovu skrýt" button, so in review mode both "Znovu skrýt" (for the previous extraction) and "Přesto skrýt" were offered. A new analysis now hides "Znovu skrýt" first.

## Manual check for Libuše (backlog: "ověřeno ručně")

In Chrome with the extension loaded unpacked and the backend running, open each page, click the ZenFeed icon, turn on "Válka" and click Analyzovat:

1. `tests/extension/fixtures/empty.html` and `no-title.html` (served with `python3 -m http.server 8765 --directory tests/extension/fixtures`): message about no or little text; nothing changes on the page.
2. `single-block.html`: the block stays visible with the review message; "Přesto skrýt" hides it and says nothing is left; "Zobrazit vše" brings it back.
3. `mostly-war.html`: all four articles hidden, message that nothing is left.
4. A `chrome://` page: inaccessible-page message.
5. Stop the backend and analyze any page: "Server ZenFeed neběží …", nothing hidden.
6. Check that every message is understandable and that no page gets any added text.

## Known limitations

- Paywalled or login-only content, content in iframes and shadow DOM, and content not loaded yet cannot be detected as "inaccessible"; the user sees "no readable content" or a normal result for the visible part.
- The thresholds are working values from the pilot pages and fixtures, not from the 24-page set.
- Review mode covers only the one-block case. Pages that are divided but badly (merged sections, ZF-07) still go through the normal mode, protected only by the wrapper rule of ZF-10.
