# Voice and player (ZF-16, ZF-17)

The summary in the popup can be read aloud. Chrome reads it with `speechSynthesis`; there is no TTS endpoint and no TTS service (`docs/rozhodnuti-zf-25.md`, `docs/architecture.md`). Only the summary is read, never the page text, and the player always says that the voice is synthetic.

ZF-16 (the voice) was proposed for Daniel; it is done here together with ZF-17 (the player) at Jakub's request, because the player cannot be tested without it.

## Voice (ZF-16)

`extension/popup/voice.js`:

- **Local voices only.** A voice is used only if `localService` is true, so the summary text does not go to a cloud voice. Remote voices (for example "Google čeština") are never used, even when they are the only ones; then the player reports that no local voice is installed.
- **Choice by summary language.** Czech: `cs-CZ`, then any `cs`. English: `en-GB`, then `en-US`, then any `en`. Within a region the browser's default voice wins. macOS effect voices (Bells, Bubbles, Bad News, Zarvox and others) are skipped.
- **Historically styled, without a character name.** Rate 0.9 and pitch 0.9: a little slower and lower than the default voice. This is fallback C of [`hlas-a-oznaceni.md`](hlas-a-oznaceni.md). Option E (Švejk for Czech, Sherlock Holmes for English) is Libuše's proposal; the team has not confirmed it and the trademark check is open, so no character name is used anywhere. Switching to E later means changing `LABELS` (and possibly `PROFILES`) in `voice.js`.
- **Reliable reading.** The text is split at sentence ends into chunks of at most 220 characters, read one after another. Voices that load late are waited for up to 2 s.

## Player (ZF-17)

In the summary panel, shown only when there is summary text:

- **Label**, always visible without interaction (variant 1 of `hlas-a-oznaceni.md` part 5), in the summary's language: "Syntetický hlas · shrnutí napsal stroj" / "Synthetic voice · summary written by AI".
- **Before the first playback** (variant 3): "Uslyšíte syntetický hlas. Čte strojově vytvořené shrnutí, ne původní text stránky." / "You will hear a synthetic voice reading an AI-written summary, not the original page text."
- **Buttons**: Přehrát → Pozastavit and Zastavit while reading; Pokračovat when paused; Přehrát znovu when finished; Zkusit znovu after an error.
- **Status**: "Připravuji hlas…", "Přehrávám syntetickým hlasem (Zuzana).", "Pozastaveno.", "Zastaveno.", "Dočteno."
- **Note**: "Čte se jen shrnutí, ne text stránky. Přehrávání skončí, když tento panel zavřete."
- A new summary, a new analysis or a changed preference stops the reading.

| Error | When | Message (the summary stays readable in all of them) |
|---|---|---|
| `no_voice` | No local voice for the language (or voices did not load within 2 s) | V počítači není nainstalovaný český / anglický hlas, který běží bez internetu. Shrnutí si můžete přečíst. |
| `not_supported` | No `speechSynthesis` | Tento prohlížeč neumí číst text nahlas. Shrnutí si můžete přečíst. |
| `not_allowed` | Chrome refused speech without a user click | Prohlížeč přehrávání nedovolil. Klikněte na Zkusit znovu. |
| `speech_failed` | Any other speech error | Přehrávání se nepovedlo. Shrnutí si můžete přečíst, nebo to zkuste znovu. |

## Files

| File | Responsibility |
|---|---|
| `extension/popup/voice.js` | Voice choice, text chunks, player states, labels |
| `extension/popup/popup.html`, `popup.js`, `popup.css` | Player in the summary panel |
| `tests/extension/voice.test.mjs` | Unit tests with a fake `speechSynthesis` |
| `tests/extension/popup-e2e.mjs --summary` | Drives the player in the real popup (volume set to 0 by the test) |

No permission was added: `speechSynthesis` needs none.

## How to test

```bash
node --test tests/extension/*.test.mjs
PYTHONPATH=backend uvicorn summary_stub:app --app-dir tests/extension --port 8000
python3 -m http.server 8765 --directory tests/extension/fixtures
node tests/extension/popup-e2e.mjs --summary http://127.0.0.1:8765/hider.html "https://cs.wikipedia.org/wiki/Glob%C3%A1ln%C3%AD_oteplov%C3%A1n%C3%AD"
```

Manually in Chrome (Load unpacked, stub or backend with `/v1/summarize` running): analyze a page, click "Shrnout viditelný obsah", check that the label is visible before clicking anything, then Přehrát, Pozastavit, Pokračovat, Zastavit.

## Test results (11 Nov 2026)

Automated: `node --test tests/extension/*.test.mjs` 90 of 90 passed on Node 25.9 and Node 22.23; `ruff`, `pytest backend` (44 passed), manifest check, `node --check` and `hider-browser.mjs` passed.

Voices seen on this Mac: Brave 156 has 180 local voices (Czech "Zuzana" cs-CZ, English "Daniel" en-GB, plus macOS effect voices); headless Chrome has 19 voices, all remote (Google), none local.

`popup-e2e.mjs --summary --backend=…` in headless Brave with the extension loaded and the summary stub, final run:

| Page | Summary language | Voice | Přehrát → Pozastavit → Pokračovat → Zastavit → Přehrát | No local voice (simulated) |
|---|---|---|---|---|
| `hider.html` | en | Daniel | all states as expected, "Dočteno." at the end | message shown, summary still shown, Zobrazit vše / Znovu skrýt still work |
| cs.wikipedia Globální oteplování | cs | Zuzana | as above | – |
| P01 OWID, P02 EA Forum, P05 Wikipedia Talk | en | Daniel | played to the end | message shown, summary still shown |
| P06 horydoly.cz | en (the page declares `lang="en"`) | Daniel | played to the end | message shown, summary still shown |
| `single-block.html` | en | Daniel | played to the end | message shown, summary still shown |

The labels in both languages were visible before any click.

`voice.js` directly in a page:

- headless Chrome (only remote voices): `loading` → `no_voice`; nothing was spoken, so no text reached a cloud voice.
- headless Brave on a normal page without a user click: `not-allowed` from Chrome (now reported as `not_allowed`); with a user click (`userGesture`): `speaking` → `ended`. In the popup playback always starts from a click.

Not tested: desktop Google Chrome with a real click and audible output (the tests ran muted); Windows and Linux voice lists; how the styled rate and pitch sound to listeners (ZF-34).

## Known limitations

- Reading stops when the popup closes, because the popup page owns `speechSynthesis`. Reading on after closing would need an offscreen document or `chrome.tts`, which means a new permission and a change of the ZF-25 decision.
- Whether a local voice exists depends on the computer: macOS has Czech and English voices, other systems may not; then the player reports it and the summary stays readable.
- The voice follows the summary language, which follows the page's `lang` unless the user changes it; a page that declares the wrong language (horydoly.cz) gets the wrong default voice.
- The character voices of option E are not used until the team confirms ZF-26.
