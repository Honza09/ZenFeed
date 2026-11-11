# Privacy (ZF-29)

What ZenFeed sends, keeps and logs, and the audit of 11 Nov 2026. Proposal §4.4 and `docs/mvp.md` §5 require that nothing is sent without a user action, that the user knows which data leave the browser, and that keys stay on the server.

Not legal advice. This describes the code in `main` on 11 Nov 2026. The Gemini integration does not exist yet; see [Re-audit](#re-audit).

## What leaves the browser

| When | Data | Where to | Not sent |
|---|---|---|---|
| Click **Analyzovat** | `id`, `kind`, `title` (max. 300 characters), `text` of each block, the hide switches | `POST http://127.0.0.1:8000/v1/analyze` | page URL, page title, cookies (`credentials: "omit"`), other headers |
| Click **Shrnout viditelný obsah** | the same fields of the visible blocks only, the switches, the hidden topics, the language | `POST http://127.0.0.1:8000/v1/summarize` | hidden blocks, and visible blocks that wrap a hidden one |
| Voice | nothing | – | the summary is read by a local Chrome voice (`localService`) |

The extension talks only to `127.0.0.1:8000` (`host_permissions` in `manifest.json`). No other address, analytics or telemetry is in the code. Content scripts run only after a click (`activeTab`), and only in the top frame of the active tab.

Today both endpoints run on the same computer and classification is the local `lexicon-1`, so no page text leaves the computer.

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

- Above **Analyzovat**: which data are sent, where (the ZenFeed server on this computer), why (to find the topic and tone), what is not sent, that nothing is stored, and not to use it on pages with personal data.
- In the summary panel: only the visible blocks are sent, hidden content is not.
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

- Backend (`backend/app/main.py`, `services/analyze.py`): event names, block counts, `model_version` and the error type. Never page text, titles or keys. A `422` answer lists only the field and message, not the input. `Settings` prints the key only as `set` or `unset`.
- Extension: `console.error` with a fixed message and the error object (network or Chrome API errors), never block text.

## Keys

- `ZENFEED_AI_API_KEY` is read from the environment on the backend only (`backend/app/config.py`). It is not used yet.
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

- **Gemini is connected** for the summary (ZF-15) or the classification. Page text then goes to Google. The note above **Analyzovat** and the summary hint must say so, including that the free tier is used and that its terms have special rules for the EEA (`docs/rozhodnuti-zf-25.md`). The summary prompt must treat page text as data (ZF-15).
- A new address in `host_permissions` or in the clients, for example a hosted backend.
- New data in `chrome.storage` or in the requests.
- New logging in the backend.
