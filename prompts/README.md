# Saved Prompts

Repository of reusable prompts for the ZenFeed project.

## How to save a prompt

To save a prompt, start your message with `/save-prompt`.

Prompts are saved as Markdown files using collision-resistant filenames:

`YYYYMMDD-HHMMSS-short-description.md`

## Prompt Catalog

| Prompt | Description |
|---|---|
| [20261029-190400-docs-backlog-audit.md](20261029-190400-docs-backlog-audit.md) | Audit of the project proposal vs. docs/mvp.md v0.2 and docs/backlog; fixes inconsistencies (read-only on GitHub). |
| [20261029-201700-zf-01-repo-ci-conventions.md](20261029-201700-zf-01-repo-ci-conventions.md) | Implementation of ZF-01: GitHub Actions CI, CONTRIBUTING, PR template, README/DEVELOPMENT fixes (local branch, no commit). |
| [20261029-192821-zf-04-pilot-pages-annotation.md](20261029-192821-zf-04-pilot-pages-annotation.md) | Implementation of backlog issue ZF-04: 6 pilot pages, manual block annotations and a reusable measurement template (docs/testing/pilot/). |
| [20261102-213706-zf-07-segmentation-evaluation.md](20261102-213706-zf-07-segmentation-evaluation.md) | Implementation of backlog issue ZF-07: measure DOM extractor segmentation on the pilot pages and prepare a go/no-go proposal and scope-freeze draft (docs/testing/pilot/). |
| [20261104-132900-zf-24-categories-decision.md](20261104-132900-zf-24-categories-decision.md) | Preparation of backlog issue ZF-24: draft of topic and tone categories with annotator-usable definitions and decision points (docs/kategorie-mvp.md; the team decides). |
| [20261104-161800-zf-26-voice-decision.md](20261104-161800-zf-26-voice-decision.md) | Preparation of backlog issue ZF-26: draft decision on the historical personality or voice preset, voice licence verification and the "synthetic voice" label wording (docs/hlas-a-oznaceni.md; the team decides). |
| [20261104-165700-zf-27-evaluation-methodology.md](20261104-165700-zf-27-evaluation-methodology.md) | Preparation of backlog issue ZF-27: draft evaluation methodology (evaluable case, preference respect, raters, CS/EN ratio, tuning/final split; docs/testing/metodika-hodnoceni.md; the team decides). |
| [20261113-094800-zf-13-ui-test-checklist.md](20261113-094800-zf-13-ui-test-checklist.md) | Preparation of backlog issue ZF-13: UI and integration regression checklist for milestone M2 and a bug log (docs/testing/checklist-m2.md, docs/testing/evidence-chyb.md; no test results are filled in by the agent). |
| [20261113-160600-zf-10-b001-box-count.md](20261113-160600-zf-10-b001-box-count.md) | Investigation and fix of bug B-001 from the ZF-13 manual run: box count vs. number of `data-zenfeed-hidden` elements on W1; decides whether it is by design (fix the docs and checklist) or a code bug (fix with a test); no commit. |