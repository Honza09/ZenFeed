# Popup and preferences (ZF-11)

The popup lets the user choose what to hide and runs the whole flow on the current page with one click: extract blocks → classify them on the local backend → hide the matching ones. It also shows everything again and hides it again.

ZF-11 added the call to the backend so that the M2 demo works ("zapnout kategorii → skrýt → obnovit"). ZF-12 added one retry per request and keeps partial results when a request fails. See [Backend call](#backend-call).

## What the user sees

- **Skrýt témata**: one switch per topic from `docs/kategorie-mvp.md` (Válka, Politické konflikty, Zprávy o úmrtí, Katastrofické scénáře, Násilí). `jiné` is not a switch.
- **Skrýt tón**: a separate switch "Toxický/vyhrocený tón", with the hint that topic and tone are two different choices.
- **What leaves the browser**: before analyzing, the popup says that the text of the page blocks goes to the ZenFeed server on this computer (127.0.0.1), that the page address, cookies and login data are not sent, and that nothing is stored (proposal §4.2, groundwork for ZF-29).
- **Analyzovat**: runs the flow. Nothing is read from the page or sent anywhere before this click. With no switch on, it only asks the user to choose something; nothing is injected or sent.
- **Zobrazit vše**: shows every hidden block; the page returns to its original state ([`hiding.md`](hiding.md)).
- **Zkusit znovu nevyhodnocené** (ZF-12): shown only when some blocks got no result. Sends just those blocks again for the same extraction and preferences and hides the matching ones; blocks that were already decided are not touched. "Zobrazit vše", a new analysis or a changed switch drops the offer.
- **Znovu skrýt**: hides the same blocks again without a new analysis. It is offered only for the extraction that was last hidden with the current preferences; after changing a switch the user has to analyze again.
- **Status**: e.g. "Skryté bloky: 48 z 75. Nešlo bezpečně skrýt, ponechané viditelné: 2." The numbers are phrased as "label: number", so no Czech plural forms are needed. Uncertain (`review`) blocks and blocks that cannot be hidden safely are reported, never hidden.
- **New content**: when the popup is opened again on a page that added content since the analysis, it says so and asks the user to click Analyzovat; nothing is analyzed by itself.
- **Summary**: page title (via `textContent`), number of blocks, number of hidden blocks.

ZF-11 in the backlog names the modes "Analyzovat", "Pozastavit", "Obnovit vše". Here "Zobrazit vše" (the wording of `docs/mvp.md` F2) pauses filtering on the page and "Znovu skrýt" resumes it. A separate pause switch would do the same with an extra button, because nothing is ever hidden without a click.

## Preferences

Stored in `chrome.storage.local` under `zenfeed.preferences` as `{ valka, politicke_konflikty, umrti, katastrofy, nasili, toxicky }`, the same keys as `/v1/analyze` (`docs/API.md`). Saved on every change. Unknown keys and non-boolean values are ignored when loading; anything missing is off. Default: everything off.

`zenfeed.lastAnalysis` keeps `{ tabId, extractionId, preferences }` of the last analysis, only to decide whether "Znovu skrýt" may reuse its results. No page text, title or URL is stored.

## Backend call

`extension/popup/analyze-client.js` posts the blocks to `http://127.0.0.1:8000/v1/analyze`:

- only `id`, `kind`, `title` (cut to 300 characters) and `text` of each block, plus the preferences; no URL, page title, cookies (`credentials: "omit"`) or other headers;
- at most 100 blocks per request (backend limit, `docs/API.md`), requests one after another; smaller batches for a hosted model are the backend's job;
- 15 s timeout per request;
- **one retry** after 0.5 s for a network error, a timeout (also backend `504`) or another `5xx`. A `4xx` or an invalid body is not retried, because it would fail the same way. When the server is not running, the remaining requests are not sent;
- **partial results** (ZF-12): the results of the requests that succeeded are used, and the blocks of the requests that failed stay visible. A block missing from a `200` answer counts as failed too. The status then adds "Nevyhodnocené bloky: N (server vrátil chybu); zůstaly viditelné. Můžete je zkusit poslat znovu." and the popup offers **Zkusit znovu nevyhodnocené**;
- if no request succeeds, nothing is hidden. Errors: `backend_unavailable` (server not running), `timeout`, `backend_error` (other status), `invalid_response`. Each has a Czech message ending "Nic se neskrylo."

A failure never hides a block and never changes one that is already decided (acceptance of ZF-12).

Each result is checked again by the content script before it is used ([`block-mapping.md`](block-mapping.md)).

The backend runs only locally on the demo machine (`docs/rozhodnuti-zf-25.md`), so the address is a constant. Start it with `uvicorn app.main:app --app-dir backend` (port 8000).

## Permissions

ZF-11 adds two entries to `manifest.json`:

| Entry | Why |
|---|---|
| `"storage"` | Preferences survive closing the popup and restarting the browser. Already allowed in `check_extension.py` since ZF-01. |
| `"host_permissions": ["http://127.0.0.1:8000/*"]` | The popup calls the local backend. Without it the request is cross-origin and the backend has no CORS. It gives no access to any web page. |

Pages are still reached only through `activeTab` after a click (ZF-08). `check_extension.py` now fails on any other host permission (for example `<all_urls>`) and on declared `content_scripts`; `tests/extension/bootstrap.test.mjs` checks the exact lists.

## Files

| File | Responsibility |
|---|---|
| `extension/popup/popup.html`, `popup.css`, `popup.js` | UI and flow |
| `extension/popup/preferences.js` | Switches, defaults, sanitizing, `chrome.storage.local` |
| `extension/popup/analyze-client.js` | `/v1/analyze` call with retry and partial results (ZF-12) |
| `extension/popup/bootstrap.js` | `activeTabId`; `getStatus` now also returns `extractionId` and `withResults` |
| `extension/content/content.js` | `zenfeed/status` returns `extractionId` and `withResults` |
| `tests/extension/preferences.test.mjs`, `analyze-client.test.mjs` | Unit tests |
| `tests/extension/popup-e2e.mjs` | Drives the real popup in the loaded extension |

## How to test

```bash
node --test tests/extension/*.test.mjs
uvicorn app.main:app --app-dir backend
python3 -m http.server 8765 --directory tests/extension/fixtures
node tests/extension/popup-e2e.mjs http://127.0.0.1:8765/hider.html https://ourworldindata.org/war-and-peace
```

Run the server commands in separate terminals. `popup-e2e.mjs` turns every switch on, then clicks Analyzovat, Zobrazit vše, Znovu skrýt, Zobrazit vše, Analyzovat again and Zobrazit vše. `ZENFEED_PROFILE=<dir>` keeps the browser profile, so two runs show whether the preferences survive a browser restart.

Manually in Chrome: Load unpacked `extension/`, start the backend, open a page, click the ZenFeed icon, turn on "Válka", click Analyzovat.

## Test results (5 Nov 2026)

Automated: `ruff check backend` passed, `pytest backend` 42 passed, `check_extension.py` manifest OK (and it rejects a manifest with `<all_urls>` and `content_scripts`), `node --check` OK, `node --test tests/extension/*.test.mjs` 54 of 54 passed, `hider-browser.mjs` all checks passed.

`popup-e2e.mjs` in headless Brave 156, extension loaded unpacked, backend `lexicon-1` on 127.0.0.1:8000, every switch on:

| Page | Status after Analyzovat | Znovu skrýt | Second Analyzovat |
|---|---|---|---|
| P01 OWID war-and-peace | Skryté bloky: 48 z 75. Nešlo bezpečně skrýt: 2 | 48 hidden again | same result |
| P02 EA Forum | 0 z 51, nothing matches | – | same |
| P03 NASA news | 0 z 26, nothing matches | – | same |
| P04 OWID latest | 4 z 23 | 4 hidden again | same |
| P05 Wikipedia Talk | 11 z 49. Nešlo bezpečně skrýt: 3 | 11 hidden again | same |
| P06 horydoly.cz | 0 z 50, nothing matches | – | same |
| cs.wikipedia Globální oteplování | 21 z 400. Nejisté, ponechané viditelné: 2 | 21 hidden again | same |
| `hider.html`, `hider-csp.html` | 4 z 11 | 4 hidden again | same |
| `empty.html` | no readable content, nothing hidden | – | same |
| `no-title.html`, `html-title.html` | 0 z 1; the HTML-like title is shown as text, 0 elements created | – | same |
| `file://`, `chrome://version/`, Chrome Web Store | restricted-page messages | – | same |

After every "Zobrazit vše" the hidden count was 0, and the ZF-10 round trip afterwards found no ZenFeed traces and no changed block elements.

Other checks:

- Backend not running: "Server ZenFeed neběží … Nic se neskrylo." after extraction, nothing hidden.
- No switch on: "Vyberte aspoň jedno téma nebo tón …"; afterwards no content script was in the page, so nothing was injected or sent.
- Preferences: on with the first page, already 6/6 on when the popup opened on every later page (survive closing the popup). With `ZENFEED_PROFILE`, a second browser process on the same profile opened the popup with 6/6 on (survive a restart).
- P05 once gave `no_access` because the test clicked the icon before the page had loaded (known since ZF-08); rerun passed.
- Screenshot of the popup checked: switches, privacy note, buttons, status and summary laid out within 320 px; content height 563 px (Chrome popups grow up to 600 px).

Not tested: desktop Google Chrome with a real click; a slow backend close to the 15 s timeout (covered by the unit test with a fake fetch).

## Test results ZF-12 (11 Nov 2026)

Automated: `node --test tests/extension/*.test.mjs` 92 of 92 passed (Node 23.7), `node --check` OK on all extension and test scripts, `check_extension.py` manifest OK. `analyze-client.test.mjs` covers: retry after a `5xx`, timeout and network error, no retry for `4xx` and invalid bodies, no further requests when the server is down, partial results when the second of three requests fails, and a block missing from a `200` answer.

`popup-e2e.mjs` was not run (no Brave on the machine, and the backend needs Python 3.11+). Instead the real popup (`popup.html` with its scripts unchanged) was loaded in a browser with a fake `chrome` API and a fake `/v1/analyze` (250 blocks, every fifth one `hide`, the request with blocks `zf-100`…`zf-199` answering `500`):

| Step | Result |
|---|---|
| Analyzovat | requests `zf-0`(100), `zf-100`(100) twice, `zf-200`(50); "Skryté bloky: 30 z 250. Nevyhodnocené bloky: 100 (server vrátil chybu); zůstaly viditelné. …"; button shown |
| Zkusit znovu nevyhodnocené, server still failing | only `zf-100`(100), twice; error message, still 30 hidden, button stays |
| Zkusit znovu nevyhodnocené, server fixed | only `zf-100`(100); "Dovyhodnocené bloky: 100, nově skryté: 20."; 50 hidden; button gone |
| Zobrazit vše after a partial analysis | 0 hidden, button gone |
| Server down | two attempts, "Server ZenFeed neběží … Nic se neskrylo.", 0 hidden, no button |

The button fits the 320 px popup. Not tested: the real content script and desktop Chrome with a real click.

## Known limitations

- The backend address is fixed to `http://127.0.0.1:8000`. Another port or a hosted backend needs a change in `analyze-client.js` and in `host_permissions`.
- One retry per request only. A server that keeps failing leaves its blocks visible until the user clicks "Zkusit znovu nevyhodnocené".
- The retry offer lives only while the popup is open; after reopening it, the user analyzes again.
- "Znovu skrýt" after reopening the popup works only for the last analyzed tab and extraction; after navigation the user analyzes again.
- The new-content notice is shown only when the popup is opened; the popup does not update while it stays open.
- Edge states (little text, a page that is one block, nothing relevant left, long pages) are handled since ZF-28; see [`edge-states.md`](edge-states.md).
