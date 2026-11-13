# ZF-11 / B-002: popup says "Skryté bloky: 0 z N" after a repeated analysis although a block is hidden

You work in the ZenFeed repository (Chrome MV3 extension, vanilla JS, FastAPI backend). Read `CLAUDE.md` and follow it: do not commit (the human commits), never work on `main`, no secrets, smallest possible change, categories only from `docs/kategorie-mvp.md`. Reply in Czech.

## Context
The manual test run of ZF-13 (scenario UI-35) found bug B-002, recorded in `docs/testing/evidence-chyb.md`. Steps (real backend, Chrome, device emulation off):
1. Open https://ourworldindata.org/latest?type=data-insight and reload it.
2. Turn on only "Válka" and click Analyzovat. Popup: "Skryté bloky: 1 z 23".
3. Click "Show more" (the popup then reports new elements: 20).
4. Click Analyzovat again.

Expected (`docs/popup.md`, UI-03): the status "Skryté bloky: N z M" matches the blocks that are hidden on the page.
Actual: the popup says "Skryté bloky: 0 z 43. Nic na stránce neodpovídá zvoleným tématům ani tónu.", while the table in the popup shows "Skryto: 1" and the block from the first analysis is still hidden on the page. It repeats on every repeated analysis of the same page (also on W1: "Skryté bloky: 0 z 13" while the table shows "Skryto: 2").

Hypothesis (UNCONFIRMED, verify it, do not adopt it): `applyHiding` in `extension/content/hider.js` counts a block that is already hidden as `alreadyHidden`, not as `hidden` (the existing browser check "second hiding hides nothing new" relies on that). `describeOutcome` in `extension/popup/popup.js` builds the message only from `hiding.hidden`, ignores `hiding.alreadyHidden`, and so on a repeated analysis it prints 0 and the sentence "Nic na stránce neodpovídá...", which is false. If true, the content script is correct and the fix belongs in the popup text only.

## Task
1. **Diagnosis first.**
   - Read `docs/popup.md`, `docs/hiding.md`, `extension/popup/popup.js` (`describeOutcome`, the callers that use it, `refreshStatus`), `extension/popup/bootstrap.js` and `extension/content/hider.js` (`applyHiding`).
   - Confirm or reject the hypothesis from the code and from the existing tests (`tests/extension/hider.test.mjs`, `hider-browser.mjs`, `popup-e2e.mjs`, popup tests). Check where the table value "Skryto" comes from and that it is the same data as the page state.
   - State which number the popup should show after a repeated analysis. Use what `docs/popup.md` says; if it is unspecified, propose the smallest consistent wording and say it is a proposal. Keep the existing style "label: number" (no Czech plural forms).
2. **Fix with the smallest change** (most likely only the message in `popup.js`, for example `Skryté bloky: <hidden + alreadyHidden> z <blockCount>.`), so that:
   - the first analysis shows exactly what it shows today;
   - a repeated analysis of the same page never claims that nothing matches when blocks are hidden;
   - the sentence "Nic na stránce neodpovídá zvoleným tématům ani tónu." appears only if really no block is hidden, uncertain or unsafe.
3. Add a test that fails before the fix (a repeated analysis: first call hides 1, second returns `hidden: 0, alreadyHidden: 1`). Use the existing test style and fixtures.
4. If the diagnosis shows a different cause (for example the popup state differs from the page state, or the new elements change the count of blocks), do NOT guess: describe what you found and ask one concrete question.

## Restrictions
- Change only what B-002 needs. Do not change `hider.js` counting semantics, the content-script message contract in `docs/hiding.md`, the look of the popup, or other messages.
- The fixed design rules always apply (`docs/mvp.md`): no change of page text, no irreversible hiding, "Zobrazit vše" leaves no trace, nothing is analysed or sent without a click on Analyzovat, uncertain blocks (`review`) are never hidden.
- Do not weaken or delete existing tests to make them pass.
- Do not add dependencies. Never touch `main`; create a new branch from the current one (for example `issue-ZF-11-b002`) if it does not exist yet.
- Do not run anything that would send data off the local machine.

## Verification
Run these and report the real results:
- `node --test tests/extension/*.test.mjs`
- `node tests/extension/hider-browser.mjs`
- `node tests/extension/popup-e2e.mjs`, if it can be run in the environment
State which commands you did not run and why.

## Completion Criteria
1. A short answer: hypothesis confirmed or rejected, with evidence (file, line, test output).
2. A list of changed files with what and why for each.
3. The results of the commands from "Verification".
4. A proposed comment for the ZF-11 issue (in Czech, up to 10 lines).
5. What the human must check by hand in Chrome (concrete steps on W1 and on the Our World in Data page, at most five lines): the status after the first and after a repeated analysis, and "Zobrazit vše".
Do not commit, push or open a PR. Do not change B-002 in `docs/testing/evidence-chyb.md`; the human sets the status after verifying.
