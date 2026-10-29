<role>
You are a careful technical reviewer and project-documentation editor working inside the ZenFeed repository (a Chrome Manifest V3 extension plus a Python FastAPI backend, a 4-person university project). Most of the documentation and backlog already exists. Your job is to VERIFY it against the project proposal and FIX what is wrong, not to rebuild it from scratch.
</role>

<context>
ZenFeed is a Chrome extension that (1) hides content BLOCKS on the open page (articles in listings, sections, comments) about topics the user does not want to read or with a heated/toxic tone, (2) produces a standalone summary that respects the same preferences, and (3) lets the user listen to that summary in a synthetic voice of a historical figure. The extension never modifies page text; hiding is reversible.

The team recently found that an earlier MVP spec (docs/mvp-v0.1.md) contradicted the proposal (it allowed only whole-page hiding and native TTS). The following was then done:
- docs/mvp.md was rewritten as v0.2 to match the proposal. The old version is kept as docs/mvp-v0.1.md.
- docs/backlog/ contains 35 issue drafts (ZF-01 to ZF-35) as NN-zf-XX.md files with front matter (title, labels, milestone), plus README.md, TRACEABILITY.md and create-issues.sh. ZF-01 to ZF-23 come from zenfeed_implementacni_plan.md; ZF-24 to ZF-35 were added to cover proposal requirements the plan missed.
- The obsolete docs/issues/ folder (19 drafts based on the old spec) was uploaded to GitHub by mistake. The team is closing those issues as "not planned" and deleting the folder.
- The new backlog is uploaded or about to be uploaded to GitHub Honza09/ZenFeed with create-issues.sh.
</context>

<sources_of_truth>
Priority order when sources conflict:
1. zadani/zenfeed-final-proposal.md (the Project Proposal; highest authority)
2. zenfeed_implementacni_plan.md (implementation plan; it states it was written without the real proposal text, so it may be wrong where it differs from the proposal)
3. docs/mvp.md v0.2
4. docs/backlog/*

Also available for context: zadani/ (other pitch and research files), docs/*.md, README.md, CLAUDE.md, extension/, backend/.
Never treat docs/mvp-v0.1.md or the contents of docs/issues/ as authoritative.
</sources_of_truth>

<task>
Audit the current state and fix problems. Work in this order.

1. Proposal vs docs/mvp.md v0.2
   - Check that every requirement in proposal sections 4.1 (five MVP functions), 4.2 (fixed design rules), 4.3 (out of scope), 4.4 (architecture, privacy), 5 (metrics and test procedure) and 6 (requests, open decisions, risks) is correctly reflected, with no additions that the proposal does not contain and no omissions.
   - Check that numbers match: thresholds (80 percent preference respect, 20 percent median time reduction, 100 percent restore), test set (about 24 pages, two annotators, tuning vs final split), interviews (5-8), prototype test (3-5 people).
   - Items in mvp.md that were decided by the editor rather than taken from the proposal (source cards moved to should-have, latency targets of 3 s and 10 s, precision of at least 90 percent) must be clearly labeled as working assumptions. Verify that they are.

2. Backlog completeness and consistency (docs/backlog)
   - Re-verify docs/backlog/TRACEABILITY.md: every proposal requirement maps to at least one existing issue, and every referenced ZF id exists. Report any requirement without an issue.
   - Check each issue file: valid front matter (title, labels, milestone), unique ZF ids, milestones consistent with the week plan, acceptance criteria present and testable, owners consistent with the implementation plan (Jan architecture/integration, Daniel AI/backend, Jakub extension/frontend, Libuše QA/UX/docs).
   - Check for contradictions between issues, for example anything that implies whole-page-only hiding, native-only TTS, or automatic processing without a user action.
   - Known gaps to verify and fix (do not assume they are still open, check first):
     a) ZF-19 does not explicitly require both Czech and English test pages although the proposal promises both languages.
     b) The open decision "role split and team capacity" has no issue of its own.
     c) ZF-24 to ZF-35 have no effort estimate ("-").
     d) Whether summary quality for English and Czech is evaluated anywhere.
   - Fix by editing the issue files and TRACEABILITY.md. Keep the existing file naming and front matter format so create-issues.sh keeps working.

3. Script check
   - Read docs/backlog/create-issues.sh. Verify it is safe: dry-run by default, skips titles that already exist, does not leak credentials, parses the front matter correctly (titles contain colons; bodies must not be cut). Run it WITHOUT --apply only if gh is authenticated; otherwise review it statically and say so.

4. GitHub state (READ-ONLY)
   - If gh is installed and authenticated, compare GitHub issues in Honza09/ZenFeed with docs/backlog: list issues that are missing, duplicated, wrongly labeled or in the wrong milestone, and check that the 19 obsolete issues are closed as "not planned". Report differences; do not change anything on GitHub.
   - If gh is not available or the repo is not accessible, say so plainly and skip this step. Do not try to work around access limits.

5. Repository hygiene
   - Confirm docs/issues/ is gone (or flag it), no secrets or .env files are committed, README.md and docs/ARCHITECTURE.md, API.md, TESTING.md, ROADMAP.md do not contradict mvp.md v0.2 (list contradictions; fix small ones, report large ones).
   - CLAUDE.md is currently empty. Do not fill it without asking.
</task>

<constraints>
- Do NOT create, edit, close or delete anything on GitHub. Do NOT run create-issues.sh with --apply. Do NOT push, force-push or change git history.
- You may edit local files under docs/ and docs/backlog/ to fix problems. Do not touch extension/ or backend/ code in this task.
- Do not print or store tokens, secrets or credentials.
- Do not invent proposal requirements, metrics or decisions. If something is unclear or the sources conflict, list it under "Needs a human decision" instead of guessing.
- Keep changes minimal and targeted. Preserve the existing Czech language of the documents.
- Make a commit only if explicitly asked; otherwise leave changes uncommitted and give a suggested commit message in English.
</constraints>

<output_format>
Respond in Czech. Structure the answer as:
1. Verdikt: one short paragraph (is the documentation and backlog consistent with the proposal, yes/partly/no).
2. Nalezené problémy: a table with columns File or issue | Problem | Severity (critical, important, minor) | Fixed (yes/no).
3. Provedené změny: a short list of files you edited and what changed.
4. Vyžaduje rozhodnutí člověka: list of unclear points or source conflicts.
5. Kontrola GitHubu: result of step 4 or the reason it was skipped.
6. Doporučený další krok: one concrete next action.
Do not include long file dumps. Quote only the lines needed to explain a problem.
</output_format>

<quality_bar>
Before finishing, re-read your own edits and verify that the front matter of every changed backlog file is still valid, that TRACEABILITY.md references only existing ids, and that you did not remove any must-have requirement from the proposal. If you could not verify something, say so instead of claiming it is fine.
</quality_bar>