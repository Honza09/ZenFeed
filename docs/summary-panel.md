# Summary panel (ZF-30)

After an analysis the popup shows a **Shrnutí** section. It asks the backend for a summary of what is still visible on the page and shows it outside the page, labelled with the preferences that were applied and the topics that were left out (proposal §4.1 #3, §4.2 transparency).

The backend side, `POST /v1/summarize`, is served since ZF-15 ([`summarize.md`](summarize.md)); without a key on the server it answers 503 and the panel says the summary is not available. The voice player and its "synthetic voice" label are in [`voice-player.md`](voice-player.md) (ZF-16, ZF-17).

## What is sent

`extension/popup/summary-client.js` builds the request from the current state of the page:

- `blocks`: the blocks that are **visible now**, at most 100 (contract limit) and at most 30 000 characters of text (what the backend passes to the model, ZF-15) in page order, with `id`, `kind`, `title` (cut to 300 characters) and `text`.
  - Hidden blocks are not sent.
  - A visible block that **wraps or shares an element with a hidden block** is not sent either, because its text was read before hiding and includes the hidden text. The panel says how many such blocks were left out.
- `preferences`: the switches that were applied.
- `omitted_categories`: the topics of the hidden blocks, only those switched on. A block hidden only for its tone adds no topic (it is covered by `preferences.toxicky`).
- `language`: `cs` or `en`; the default follows the page language (`<html lang="en…">` → English, otherwise Czech), and the user can change it.

No page URL, title, cookies or credentials are sent (`credentials: "omit"`). If nothing is visible after hiding, nothing is sent and the panel says there is nothing to summarize; ZenFeed adds nothing in its place.

The state is kept only while the popup is open. "Zobrazit vše", "Znovu skrýt" and "Přesto skrýt" update what counts as visible. Changing a preference or analyzing again clears the panel, so a summary of an older state never stays on screen. After reopening the popup the user analyzes again before summarizing.

## What the panel shows

- **Label** with every summary: "Použité nastavení: Válka, …". "Vynechaná témata: válka, zprávy o úmrtí." "Shrnutí je záměrně neúplné: skrytý obsah v něm není." Plus, when it applies: "Vynechané jsou i části stránky, které skrytý obsah obalují (bloky: N)." and "Vychází z prvních 100 viditelných bloků (z N)." The applied preferences and omitted topics are taken from the response, which must repeat the omitted topics that were sent.
- **Summary text** via `textContent` (line breaks kept with CSS).
- **Link to the original page** (`target="_blank"`, `rel="noopener noreferrer"`); the URL is the tab URL, already checked to be `http`/`https`.
- **Model** (`model_version`).
- **Flags**: `insufficient_input` → "Ve viditelné části stránky nezůstalo dost textu ke shrnutí."; `no_relevant_content` → "Ve viditelné části stránky není nic, co by stálo za shrnutí." The label is still shown; no text is invented.
- **Errors** (filtering keeps working in all of them), with the button changing to "Zkusit znovu":

| Error | When | Message |
|---|---|---|
| `summary_not_served` | 404/405: an older backend without `/v1/summarize` | Shrnutí server ZenFeed zatím neumí (připravuje se). Filtrování funguje dál. |
| `summary_unavailable` | 503 | Shrnutí teď není k dispozici (model není nastavený nebo neodpovídá). Filtrování funguje dál. |
| `rate_limited` | 429 | Bezplatný limit pro shrnutí je vyčerpaný. Zkuste to později. Filtrování funguje dál. |
| `timeout` | 504 or no answer within 30 s | Shrnutí nedorazilo včas. Zkuste to znovu. |
| `backend_unavailable` | server not running | Server ZenFeed neběží. Spusťte ho a zkuste to znovu. |
| `backend_error` | other status (e.g. 422, 500) | Server ZenFeed vrátil při shrnutí chybu. Zkuste to znovu. |
| `invalid_response` | the body breaks the contract (summary over 4000 characters, blank summary without a flag, omitted topics other than those sent, …) | Server ZenFeed vrátil neplatné shrnutí, proto se nezobrazuje. Zkuste to znovu. |

## Change in hiding (ZF-10)

While testing the summary, two overlap cases showed up. Both are now handled in the block registry (`containedIds`, `containsBlocks`):

1. **A wrapper whose text includes a hidden block** (P05 `zf-18`, a section that contains a quoted block): already never hidden since ZF-10; now also left out of the summary when the block inside is hidden.
2. **Two blocks sharing one element** (Rosetta Stone `zf-35` and `zf-36`: one long paragraph split into two blocks). Hiding one hid part of the other, and the other's text went to the summary. Shared elements now count as overlap, so neither block is hidden ("Nešlo bezpečně skrýt"). On the test pages this changed one block: Rosetta Stone now hides 12 instead of 13.

The extraction reply now carries `contains` (IDs of the overlapping blocks) for each block; it is used only in the popup and never sent to the backend.

## Test stub

`tests/extension/summary_stub.py` is **not a summarizer**. It is the real ZenFeed app (real `/health` and `/v1/analyze`) plus a `/v1/summarize` route built on the real `SummaryRequest` and `SummaryResponse` models, so the contract is validated in both directions. Its "summary" is the first sentence of the first visible blocks, prefixed `[stub, cs|en]`, with `model_version: "stub-not-a-summary"`. It records the last request and can switch to every flag and error. Nothing leaves the machine.

## Files

| File | Responsibility |
|---|---|
| `extension/popup/summary-client.js` | Request building, contract check, errors |
| `extension/popup/popup.html`, `popup.js`, `popup.css` | Panel, state of what is visible, messages |
| `extension/content/block-registry.js` | `containedIds`: blocks inside or sharing an element |
| `extension/content/content.js` | Extraction reply: `contains` per block, `lang` |
| `extension/popup/bootstrap.js` | Returns `url` and `lang`; validates `contains` |
| `tests/extension/summary-client.test.mjs` | Unit tests |
| `tests/extension/summary_stub.py` | Contract stub for `/v1/summarize` |
| `tests/extension/popup-e2e.mjs --summary` | Clicks "Shrnout" in the real popup for every stub mode and checks the request the stub received |

## How to test

```bash
node --test tests/extension/*.test.mjs
PYTHONPATH=backend uvicorn summary_stub:app --app-dir tests/extension --port 8000
python3 -m http.server 8765 --directory tests/extension/fixtures
node tests/extension/popup-e2e.mjs --summary http://127.0.0.1:8765/hider.html https://ourworldindata.org/war-and-peace
```

Run the two servers in separate terminals (the stub replaces the plain backend on port 8000). For each page `--summary` reads the text of every element hidden on the page and reports whether any of it appears in the request the stub received ("hidden text found in request" must be 0).

## Test results (11 Nov 2026)

Automated: `ruff check backend tests/extension/summary_stub.py` passed, `pytest backend` 44 passed, manifest OK, `node --check` OK on Node 22, `node --test tests/extension/*.test.mjs` 76 of 76 passed on Node 25.9 and Node 22.23, `hider-browser.mjs` all checks passed.

`popup-e2e.mjs --summary --backend=…` in headless Brave 156, extension loaded, every switch on, final run:

| Page | Hidden | Blocks sent | Hidden text in request | Omitted topics | Language |
|---|---:|---:|---:|---|---|
| P01 OWID war-and-peace | 48 | 23 | 0 | válka, úmrtí | en |
| P02 EA Forum | 0 | 51 | 0 | – | en |
| P03 NASA news | 0 | 26 | 0 | – | en |
| P05 Wikipedia Talk | 11 | 35 (3 wrappers left out) | 0 | válka, politické konflikty | en |
| P06 horydoly.cz | 0 | 50 | 0 | – | en (page declares `en`) |
| en.wikipedia Rosetta Stone | 12 | 100 of 161 | 0 | válka, úmrtí, násilí | en |
| cs.wikipedia Globální oteplování | 21 | 100 of 372 | 0 | válka, politické konflikty, úmrtí, katastrofy | cs |
| `hider.html`, `hider-csp.html` | 4 | 7 | 0 | válka | en |
| `single-block.html` (review mode, nothing hidden) | 0 | 1 | 0 | – | en |
| `mostly-war.html` (everything hidden) | 4 | none sent | – | – | – |
| `no-title.html` (little text) | – | panel not shown | – | – | – |

On every page with a summary: the label, text, link and model were shown; `insufficient`, `no_relevant`, `not_served`, `unavailable`, `rate_limited` and `timeout` each showed their message ("Zkusit znovu" for the errors), and "Zkusit znovu" after the last error showed the summary again. After "Zobrazit vše", the ZF-10 round trip found no ZenFeed traces.

Before the overlap fix the same run found hidden text in the request on P05 (1 element) and Rosetta Stone (1 element); after it, 0 everywhere.

OWID "latest" (P04) currently renders only its footer (125 characters, checked with `segment-pages.mjs`), so the popup correctly reports little text there; it was not used.

Not tested here: the real `/v1/summarize` (added later in ZF-15 and tested end to end with a fake Gemini, see [`summarize.md`](summarize.md)); desktop Google Chrome with a real click.

## Known limitations

- Only the first 100 visible blocks are sent (contract limit); long pages get a summary of their beginning, and the label says so.
- Blocks that overlap a hidden block are left out of the summary as a whole, including their own text that was not hidden.
- P06 horydoly.cz declares `lang="en"` although it is Czech, so the default summary language there is English; the user can switch it.
- The summary state is not kept after the popup closes.
