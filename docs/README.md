# ZenFeed Documentation

> The scope of the MVP is defined by [`mvp.md`](mvp.md) (v0.2), which follows `zadani/zenfeed-final-proposal.md`. Summarization, hiding of content blocks and synthetic-voice playback of the summary are required MVP features, not optional ones.

ZenFeed is a Chrome extension (Manifest V3) with a FastAPI backend. It divides a page into blocks, hides the blocks whose topic or tone the user chose not to read (the page text is never changed, and everything can be shown again), and writes a summary of the visible blocks that can be played in a synthetic voice. Install and use: the repository [`README.md`](../README.md).

## Current state (19 Nov 2026)

- **Implemented:** segmentation, the popup with preferences, classification by the local lexicon `lexicon-2` on `/v1/analyze`, reversible hiding, edge states, the summary over `/v1/summarize` (Gemini free tier, needs a key), the voice player with the synthetic-voice label, the end-to-end regression and the latency measurement.
- **Not done yet:** the 24-page final test set (ZF-19), the metrics on it (ZF-20), user tests (ZF-33), the voice evaluation (ZF-34) and the final evaluation (ZF-35). Classification does not reach the 80 % target. See [`zname-omezeni.md`](zname-omezeni.md).

## Technology Stack

- **Frontend:** Chrome Extension, Manifest V3, HTML, CSS, vanilla JavaScript, no build step.
- **Backend:** Python 3.11+, FastAPI, Pydantic.
- **AI:** local lexicon for classification; Google Gemini (free tier) only for the summary; the browser's `speechSynthesis` for the voice ([`rozhodnuti-zf-25.md`](rozhodnuti-zf-25.md)).
- **Version Control:** Git and GitHub, CI in GitHub Actions.

## Repository Structure

```text
ZenFeed/
├── extension/       # Chrome extension (popup/, content/)
├── backend/         # FastAPI app (app/), tests, scripts
├── tests/extension/ # extension unit tests, browser and end-to-end tests, fixtures
├── docs/            # documentation (this folder), backlog, testing material
├── prompts/         # saved prompts
├── zadani/          # course assignment and proposal
├── .claude/         # Claude Code rules and skills
├── CLAUDE.md        # instructions for Claude Code
└── README.md        # install, use, checks, known limitations
```

## Documentation Index

- [Architecture](architecture.md)
- [Known limitations and remaining risks (ZF-22)](zname-omezeni.md)
- [Klasifikace modelem, volitelná (Gemini)](klasifikace-modelem.md)
- [Development Setup](DEVELOPMENT.md)
- [API Reference](API.md)
- [Testing](TESTING.md)
- [Regression checklist M2 (ZF-13)](testing/checklist-m2.md) and [bug log](testing/evidence-chyb.md)
- [End-to-end regrese M3 (ZF-18)](testing/regrese-m3.md)
- [Ruční průchod a věrnost shrnutí (ZF-31)](testing/zf-31-vernost.md)
- [Měření latence a kompresního poměru (ZF-20)](testing/mereni-latence.md)
- [Výpočet metrik ZF-20 z anotací](testing/metriky-zf-20.md)
- [Test s uživateli a evaluace dabingu (ZF-33, ZF-34)](testing/test-uzivatelu/README.md)
- [Závěrečné demo a záložní scénář (ZF-23)](demo/scenar.md)
- [Metodika hodnocení (ZF-27)](testing/metodika-hodnoceni.md)
- [Slovník lexicon-2 a jeho měření](testing/pilot/lexicon-2.md)
- [Block segmentation (ZF-03 PoC)](segmentation.md)
- [Extension bootstrap and permissions (ZF-08)](extension-bootstrap.md)
- [Block ID mapping (ZF-09)](block-mapping.md)
- [Hiding blocks and restoring (ZF-10)](hiding.md)
- [Popup and preferences (ZF-11)](popup.md)
- [Edge states (ZF-28)](edge-states.md)
- [Summary panel (ZF-30)](summary-panel.md)
- [Voice and player (ZF-16, ZF-17)](voice-player.md)
- [Summary on the backend (ZF-15)](summarize.md)
- [Privacy and audit (ZF-29)](privacy.md)
- [Roadmap](ROADMAP.md)
- [Product definition and MVP scope (v0.2)](mvp.md) — authoritative scope
- [Backlog](backlog/README.md)
- [Pilotní sada ZF-04: anotace a šablona měření](testing/pilot/README.md)
- [Uživatelský dotazník: text a otázky formuláře (ZF-32)](testing/rozhovory/scenar.md)
- [Výsledky dotazníku s uživateli (ZF-32)](testing/rozhovory/zprava.md)
- [Návrh modelu, TTS, hostingu a stropu nákladů (ZF-25)](rozhodnuti-zf-25.md)
