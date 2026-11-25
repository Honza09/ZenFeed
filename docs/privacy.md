# Privacy (ZF-29)

What ZenFeed sends, keeps and logs, and the audit of 11 Nov 2026. Proposal §4.4 and `docs/mvp.md` §5 require that nothing is sent without a user action, that the user knows which data leave the browser, and that keys stay on the server.

Not legal advice. The audit below is of 11 Nov 2026, before the Gemini summary (ZF-15) existed. The tables and the Gemini notice were updated on 17 Nov 2026 for it; the re-audit of 17 Nov 2026 is in [`testing/audit-soukromi.md`](testing/audit-soukromi.md).

## What leaves the browser

| When | Data | Where to | Not sent |
|---|---|---|---|
| Click **Analyzovat** | `id`, `kind`, `title` (max. 300 characters), `text` of each block, the hide switches | `POST http://127.0.0.1:8000/v1/analyze` | page URL, page title, cookies (`credentials: "omit"`), other headers |
| Click **Shrnout viditelný obsah** | the same fields of the visible blocks only, the switches, the hidden topics, the language | `POST http://127.0.0.1:8000/v1/summarize` | hidden blocks, and visible blocks that wrap a hidden one |
| Backend, after **Analyzovat**, **only with `ZENFEED_ANALYZE_PROVIDER=gemini`** (off by default) | `id`, `kind`, `title` and the first 1000 characters of `text` of each block, as a JSON array in the user message, plus the classification rules | **Google Gemini** (free tier); key only in the `x-goog-api-key` header | page URL, page title, cookies, the hide switches |
| Popup, when it opens | nothing from the page | `GET http://127.0.0.1:8000/health` (to learn which classifier is used) | everything from the page |
| Backend, after **Shrnout** | `kind`, `title` and `text` of the visible blocks (at most 30 000 characters), as a JSON array in the user message, plus the summary rules | **Google Gemini** (free tier, `generativelanguage.googleapis.com`); the key goes only in the `x-goog-api-key` header | block IDs, page URL, page title, cookies; hidden blocks never reach the backend for the summary |
| Voice | nothing | – | the summary is read by a local Chrome voice (`localService`) |

The extension talks only to `127.0.0.1:8000` (`host_permissions` in `manifest.json`). No other address, analytics or telemetry is in the code. Content scripts run only after a click (`activeTab`), and only in the top frame of the active tab.

Classification (`/v1/analyze`) is by default the local `lexicon-2`, so after **Analyzovat** no page text leaves the computer. If the team switches the model on (`ZENFEED_ANALYZE_PROVIDER=gemini`, [`klasifikace-modelem.md`](klasifikace-modelem.md)), the block text goes on to Google after **Analyzovat** as well, and the note above the button says so. **After Shrnout the text of the visible blocks leaves the computer for Google** (see `docs/rozhodnuti-zf-25.md`: the free tier may use it to improve Google products). The summary panel says so before the click.

## What is not read from the page

The segmenter (`extension/content/segmenter.js`, `isExcluded`) never makes a block from:

- forms and their fields: `form`, `input` (including passwords), `textarea`, `select`, `label`, `button`, and `role="form"`;
- text the user is writing: `contenteditable` (ZF-09);
- the page header, footer and navigation (`header`, `footer` outside an article, `nav`, `role` banner, contentinfo, navigation, search, menu, toolbar), where account names and login state usually sit;
- dialogs (`dialog`, `role="dialog"`, `alertdialog`), for example verification codes;
- hidden content (`hidden`, `aria-hidden="true"`, `display:none`, `visibility:hidden`, `opacity:0`);
- iframes, scripts, media and canvas;
- **new in ZF-29:** parts the site itself marks as private for session-recording tools: `[data-private]` (LogRocket), `[data-hj-suppress]` (Hotjar), `[data-clarity-mask="true"]` (Microsoft Clarity), `.fs-exclude` and `.fs-mask` (FullStory), `.ph-no-capture` (PostHog).

ZenFeed cannot recognise personal data inside ordinary page text (a name in a comment, an e-mail in an article). The popup therefore says not to use ZenFeed on pages with personal data such as e-mail or a bank, and it never runs on a page by itself.

## What the user is told before sending

- Above **Analyzovat**: which data are sent, where, why (to find the topic and tone), what is not sent, and not to use it on pages with personal data. Until `/health` answers, the note is general and true in both cases (the server on this computer, and on to Google Gemini if the server classifies with the model). After the answer it names exactly one: with the lexicon, that the text stays on this computer and nothing is stored; with the model, that it goes on to Google Gemini, which may use it to improve its products.
- In the summary panel (B-003, 17 Nov 2026): the text of the visible blocks goes to the ZenFeed server and on to Google Gemini (free tier, Google may use the text to improve its products); hidden content is not sent.
- At the player: only the summary is read, not the page text.

## What is stored

| Where | Key | Content |
|---|---|---|
| `chrome.storage.local` | `zenfeed.preferences` | the six hide switches |
| `chrome.storage.local` | `zenfeed.lastAnalysis` | `tabId`, `extractionId`, switches (for "Znovu skrýt") |
| popup memory | – | blocks, results and summary, only while the popup is open |
| content script memory | – | blocks of the last extraction, until the page is reloaded |

No page text, page title or URL is stored. There is no `localStorage`, `sessionStorage`, IndexedDB or cookie access. The backend keeps no state between requests and stores nothing.

## Logs

- Backend (`backend/app/main.py`, `services/analyze.py`, `services/model_classify.py`, `services/summarize.py`, `services/gemini.py`): event names, block counts, `model_version` and the error type. Never page text, titles or keys. A `422` answer lists only the field and message, not the input. `Settings` prints the key only as `set` or `unset`.
- Extension: `console.error` with a fixed message and the error object (network or Chrome API errors), never block text.

## Keys

- `ZENFEED_AI_API_KEY` is read from the environment on the backend only (`backend/app/config.py`). It is used only by `backend/app/services/gemini.py` (for the summary, and for classification only when the model is switched on) (header `x-goog-api-key`, never in the URL) and is hidden from `repr` of both `Settings` and `GeminiClient`.
- `.env` and `.env.*` are in `.gitignore`; only `.env.example` with an empty value is tracked.
- No key, token or password in `extension/`.

## Audit 11 Nov 2026

| ZF-29 requirement | Result | Evidence |
|---|---|---|
| Only block text, only after a user action; no cookies, tokens, headers, sensitive URL parameters | **met** | request bodies checked by `analyze-client.test.mjs` and `summary-client.test.mjs` (keys `id`, `kind`, `text`, `title` only, `credentials: "omit"`); the URL is never in a request; `bootstrap.test.mjs` checks there are no automatic content scripts |
| Forms and sensitive or logged-in areas excluded | **met, with the limit above** | `tests/extension/fixtures/privacy.html` in `hider-browser.mjs` (runs in CI): no text from a form, password field, textarea, editable area, header, nav, dialog, hidden element, iframe or private-marked part becomes a block. Without the ZF-29 change the check fails on the five private-marked sections |
| User informed before sending; no persistent content storage | **met** | note above **Analyzovat** and in the summary panel; storage table above |
| No keys in code or git | **met** | search of `extension/` and of the whole git history (`git log --all -p`) for Google (`AIza…`), OpenAI (`sk-…`), GitHub (`ghp_`, `github_pat_`), Slack tokens, private keys and a filled `ZENFEED_AI_API_KEY=`: no match |

Checked by Jan with Claude Code. Not checked: desktop Chrome with a real click, and the behaviour of the planned Gemini integration.

## Re-audit

Repeat the audit, and update the popup texts, when any of these changes:

- **Gemini is connected** for the summary (ZF-15, done; popup notice added 17 Nov 2026) or for the classification (not yet). Page text then goes to Google. The note above **Analyzovat** and the summary hint must say so, including that the free tier is used and that its terms have special rules for the EEA (`docs/rozhodnuti-zf-25.md`). The summary prompt must treat page text as data (ZF-15).
- A new address in `host_permissions` or in the clients, for example a hosted backend.
- New data in `chrome.storage` or in the requests.
- New logging in the backend.
