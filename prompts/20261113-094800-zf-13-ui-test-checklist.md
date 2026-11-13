Task: ZF-13 – UI test checklist and integration checklist for ZenFeed (milestone M2).

Context
- Repo: ZenFeed (Chrome MV3 extension + FastAPI backend). Read CLAUDE.md first and follow it.
- Backlog item: docs/backlog/17-zf-13.md. Done when: the checklist is usable for milestone M2.
- Scope source of truth: docs/mvp.md. Categories: docs/kategorie-mvp.md (do not invent, rename or merge categories).
- Read the existing behaviour docs before writing scenarios: docs/hiding.md, docs/block-mapping.md, docs/popup.md, docs/edge-states.md, docs/summary-panel.md, docs/voice-player.md, docs/API.md, docs/TESTING.md, docs/extension-bootstrap.md.
- Read the code only to confirm what the docs say (extension/content/*.js, extension/popup/*.js, backend/app/main.py, backend/app/schemas.py). If docs and code disagree, write the disagreement into the "Open questions" section; do not silently pick one.

Branch
- Work on branch issue-ZF-13 (create it from main if it does not exist). Never work on main.
- Do NOT commit, push, or open a PR. Leave the changes uncommitted.

Deliverables (only these files)
1. docs/testing/checklist-m2.md (Czech) – the regression checklist.
2. docs/testing/evidence-chyb.md (Czech) – the bug log: a table template plus a rules section for how to write a bug. Start with no bugs.
3. A one-line link to both files in docs/README.md (documentation index) and in docs/TESTING.md. Do not edit anything else in those files.

Checklist requirements
- Scenario groups (at minimum): page load; empty or too-little content; block IDs and mapping to the DOM; hiding according to preferences (topic × tone, each of the 5 topics and the tone switch); restoring hidden blocks ("Zobrazit" box, 100 % reversibility); backend error (offline, timeout, 4xx/5xx, partial failure with retry); restricted pages (chrome://, Web Store); SPA / dynamic content; summary panel and voice only as "if available on this build".
- Every scenario has: ID (e.g. UI-01), preconditions, numbered steps, expected result, the related requirement (mvp.md §4.1 #… / §4.2), the related issue (ZF-xx), and result columns: Pass / Fail / Blocked / Not applicable, date, tester, bug ID.
- Expected results must come from the docs. If a behaviour is not specified anywhere, mark the expected result "UNSPECIFIED" and list it in "Open questions"; do not invent behaviour.
- Include a short "how to run the backend and load the extension" section copied from docs/DEVELOPMENT.md (do not rewrite it).
- Include a section with the page set to use for manual checks. Use only pages allowed by docs/testing/pilot/stranky.md and rozsireni-zdroje.md (BBC excluded; sources with unclear terms are not allowed).
- Include a test with a mocked or stopped backend so the "error does not remove or damage the content" acceptance criterion from ZF-12 is covered.
- Mark which scenarios could be automated later (node --test tests/extension/*.test.mjs or pytest) but do not write automated tests in this task.
- Keep it usable: at most ~40 scenarios, one table per group.

Bug log requirements
- Columns: Bug ID (B-001…), date, tester, build/commit, page URL, scenario ID, steps to reproduce, expected, actual, severity (blocker/major/minor), status, linked issue.
- Rules: one bug per row, reproducible steps, no secrets or personal data, screenshot file names only (no images in the repo).

Hard rules
- You cannot run Chrome UI tests yourself. Do not fill in any Pass/Fail result, do not claim anything was tested, and do not invent bugs.
- Do not change tests, code, backlog files, or the category definitions.
- Do not run the backend with real keys; do not add secrets or .env files.
- Text in Czech; file names, scenario IDs and code identifiers as specified above.

Before finishing
- Run `node --test tests/extension/*.test.mjs` and `pytest backend` only if they are quick, and report only the results you actually saw. These runs are optional because no code is changed.
- Report: files created/changed, the number of scenarios per group, the list of "Open questions", and anything you could not verify. Do not commit.