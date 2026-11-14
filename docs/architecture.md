# ZenFeed Architecture

ZenFeed is a Chrome extension (Manifest V3, vanilla JavaScript, no build step) and a small FastAPI backend that runs on the demo machine. The extension divides the open page into blocks, the backend classifies each block by topic and tone, and the extension hides the blocks the user chose not to read. The page text is never changed. A summary of the kept blocks can be read in the popup and played with a voice from Chrome.

Scope is in [`mvp.md`](mvp.md), the endpoint contract in [`API.md`](API.md), and the model, voice and hosting choice in [`rozhodnuti-zf-25.md`](rozhodnuti-zf-25.md). This document was rewritten for ZF-02.

## Components

### Extension (`extension/`)

Nothing runs on a page until the user clicks the ZenFeed icon. The manifest asks for `activeTab`, `scripting` and `storage`, and `host_permissions` only for `http://127.0.0.1:8000/*` (the local backend). There are no automatic content scripts ([`extension-bootstrap.md`](extension-bootstrap.md)).

| File | Responsibility |
|---|---|
| `popup/popup.html`, `popup.css`, `popup.js` | Popup: preference switches, the privacy note, Analyze / Show all / Hide again, status messages |
| `popup/preferences.js` | Hide switches in `chrome.storage.local` ([`popup.md`](popup.md)) |
| `popup/bootstrap.js` | Injects the content scripts into the active tab after the click, runs extraction, passes results back |
| `popup/analyze-client.js` | Calls `/v1/analyze` with at most 100 blocks per request |
| `popup/page-quality.js` | Edge states: little text, a single block, nothing relevant left ([`edge-states.md`](edge-states.md)) |
| `content/segmenter.js` | Divides the page into blocks with IDs `zf-0`, `zf-1`, … ([`segmentation.md`](segmentation.md)) |
| `content/block-registry.js` | Keeps the blocks of the current extraction and matches results to them by ID ([`block-mapping.md`](block-mapping.md)) |
| `content/hider.js` | Hides blocks behind a reversible "Skryto: … — Zobrazit" box ([`hiding.md`](hiding.md)) |
| `content/content.js` | Message handlers between the popup and the page |

The popup also holds the summary panel ([`summary-panel.md`](summary-panel.md), ZF-30) and the voice player with its label (`popup/voice.js`, [`voice-player.md`](voice-player.md), ZF-16, ZF-17).

### Backend (`backend/app/`)

| File | Responsibility |
|---|---|
| `main.py` | Routes, error handlers, timeout |
| `schemas.py` | Pydantic models for every request and response |
| `middleware.py` | Rejects bodies larger than 1 MiB |
| `config.py` | Settings from the environment, including the optional AI key |
| `services/analyze.py`, `services/classify.py` | Classification; today the local lexicon `lexicon-1` |

`/v1/summarize` (ZF-15) calls Gemini through `services/gemini.py`, behind `services/summarize.py`, so the route does not depend on the provider ([`summarize.md`](summarize.md)). Gemini is not used for `/v1/analyze`; classification stays on `lexicon-1`. The backend keeps no state between requests and stores no page content.

## Data flow

### Hiding

1. The user sets the switches (topics and tone) in the popup and clicks Analyze.
2. The popup injects the content scripts. The segmenter returns blocks (`id`, `kind`, `title`, `text`) and a new `extractionId`.
3. `page-quality.js` decides whether the page can be filtered. If not, nothing is sent and the popup explains why.
4. The popup posts the blocks and switches to `POST /v1/analyze` (at most 100 blocks per request).
5. The backend returns `topic`, `tone`, scores and `recommended_action` per block ID.
6. The registry accepts the results only for the current `extractionId`. The hider hides blocks marked `hide`, except wrapper blocks and other blocks that cannot be hidden safely. `review` is never hidden.
7. Every hidden block has a "Zobrazit" button, and "Show all" restores the page.

### Summary (ZF-15, ZF-30)

1. The popup sends only the visible blocks, the switches and the list of hidden topics (`omitted_categories`) to `POST /v1/summarize`. Hidden text does not leave the browser for the summary.
2. The backend summarizes with Gemini and returns the summary, the switches that were applied and the omitted topics, or a flag (`insufficient_input`, `no_relevant_content`), or an error (`503`, `429`).
3. The panel shows the summary with the applied preferences, the omitted topics and a link to the original page.

If nothing is visible after hiding, the popup does not ask for a summary.

### Voice (ZF-16, ZF-17)

The extension reads the summary with `speechSynthesis` in Chrome. There is no TTS endpoint. Only voices with `localService` set are used, so the summary text is not sent to a cloud voice. The voice is chosen by the summary language. The label names the character from ZF-26 (Švejk for Czech, Sherlock Holmes for English) and says it is a synthetic voice ([`hlas-a-oznaceni.md`](hlas-a-oznaceni.md)). Fallback C, without a character name, applies until the trademark check is done; that is what the extension uses now ([`voice-player.md`](voice-player.md)). If no voice is available, the summary stays readable.

## What leaves the browser

| Data | Where to | When |
|---|---|---|
| Text, kind and heading of the page blocks, the switches | Local backend (127.0.0.1) | After the user clicks Analyze |
| Text of the visible blocks, switches, omitted topics, language | Local backend, then Gemini | After the user asks for a summary (planned) |
| Block text for classification | Gemini | When the Gemini integration exists (planned); otherwise classification stays local |

Never sent: the page URL, cookies, login data, form fields, editable text, hidden blocks for the summary. The popup tells the user before analyzing which data is sent. ZF-29 audits this.

Gemini's free tier is used without billing. Its terms have special rules for the EEA ([`rozhodnuti-zf-25.md`](rozhodnuti-zf-25.md)).

## Trust boundaries

- Page content is untrusted. It is never executed, it is shown only with `textContent`, and the hider box lives in a shadow root.
- The backend validates every request and every response with Pydantic. Invalid classifier output becomes `review` and never hides a block.
- Text sent to a model is data, not instructions. The summary prompt says so and the blocks go as a JSON value; the answer is checked for shape and length (ZF-15, [`summarize.md`](summarize.md)).
- The AI key is read from the environment on the backend only. It is never in the extension or in git.
- Logs contain counts and error types, never page text or keys.

## Failure behaviour

A failure never hides content and never breaks the page.

- Backend not running, timeout or error during analysis: each request is tried once more. Blocks without a result stay visible, the results that arrived are used, and the popup offers to send the rest again (ZF-12).
- Hosted classifier fails or hits its limit: the backend falls back to `lexicon-1`.
- Summary fails: an error message instead of the summary; filtering keeps working.
- No voice: the summary stays readable.

## Known limits

- The backend runs only on the demo machine at a fixed address.
- The segmenter still returns wrapper blocks, which are only skipped when hiding (ZF-07 option B is waiting for a team decision).
