<objective>
Implement backlog issue ZF-01 "Repozitář, CI a konvence" (repository, CI and conventions) for the ZenFeed repository, locally and on a feature branch. Deliver a working GitHub Actions CI pipeline, written team conventions, and a README/DEVELOPMENT guide that a new team member can follow to run everything locally. Keep it small: the issue is estimated at 0.5 person-days.
</objective>

<specification>
The issue text is in docs/backlog/01-zf-01.md. Its acceptance line is: "CI runs on pull requests and the README describes the local setup." Its tasks are:
- Repository structure (extension/, backend/, docs/) and a rule that every change is code-reviewed by a different team member.
- CI (lint + tests of the backend and the extension); .gitignore without keys and .env.
- Board columns Backlog -> Ready -> In Progress -> Review -> Testing -> Done, and a Definition of Done.
Also read: zenfeed_implementacni_plan.md section 3.3 (workflow rules), .claude/rules/*.md (git-workflow, architecture, frontend, backend, security, testing, prompt-managements), docs/DEVELOPMENT.md, docs/TESTING.md and README.md. The project rules in .claude/rules are binding.
</specification>

<context>
ZenFeed is a Chrome Manifest V3 extension (vanilla HTML/CSS/JS) plus a Python FastAPI backend, built by a 4-person university team (Jan, Daniel, Jakub, Libuše) in a 4-week sprint. Remote: https://github.com/Honza09/ZenFeed (branch main). Verify the following state yourself before relying on it; it was observed at the time of writing:
- Present: extension/manifest.json (MV3, permissions ["activeTab"], content script on http/https), empty placeholder files extension/content/content.js and extension/popup/popup.{html,css,js}, backend/app/__init__.py, backend/tests/__init__.py, backend/requirements.txt (fastapi, uvicorn[standard], pydantic, pytest, httpx; unpinned), .gitignore (Python, secrets, editors, build), README.md, docs/*.md, .claude/ rules and skills, prompts/.
- Missing: .github/ (no CI workflow, no PR template), CONTRIBUTING / Definition of Done, any backend test (pytest would exit with "no tests collected"), a documented verified backend run command (no FastAPI entry point exists yet), a filled CLAUDE.md (empty).
- Known doc defects: README says "See the project issues for assigned tasks" and "initial setup phase"; docs/DEVELOPMENT.md has the placeholder <REPOSITORY_URL> and says `cd zenfeed` although the cloned folder is named ZenFeed.
- Known conflict: the implementation plan suggests TypeScript for the extension, but .claude/rules/frontend.md and architecture.md forbid TypeScript, React and a build system unless approved. Follow the rules: vanilla JS, no build step. Do not introduce TypeScript or Node tooling dependencies into the project. Report this conflict under "needs a human decision".
- The default Python version is 3.11+ (README).
</context>

<requirements>
1. Git state first. Run `git status` and `git branch --show-current`. Rules forbid working directly on main and forbid switching branches when it could lose uncommitted work. If the tree is clean, create `chore/repo-ci-conventions` and work there. If there are unrelated uncommitted changes, do NOT switch branches; stop and tell me what you found.
2. CI: create .github/workflows/ci.yml triggered on pull_request and on push to main, with least-privilege `permissions: contents: read`.
   - Backend job: Python 3.11, install backend/requirements.txt, run pytest. Because no tests exist yet, add one minimal smoke test (backend/tests/test_smoke.py, e.g. that the `app` package imports) so CI is green for a real reason. Do not add fake assertions.
   - Lint: use ruff for the backend, installed only in CI or in a separate backend/requirements-dev.txt, not in runtime requirements. Add a minimal ruff config only if needed.
   - Extension job (no build system): validate extension/manifest.json is valid JSON with manifest_version 3 and that `permissions` contains only expected entries; run `node --check` on every extension/**/*.js file.
   - Pin third-party actions to a major version tag at minimum. Use no secrets in CI.
3. .gitignore: review it and add only what is missing and clearly needed (for example node_modules/, *.log, .ruff_cache/, .mypy_cache/). Never ignore files that must be committed. Confirm via `git ls-files` that no .env, key, token or other secret is tracked.
4. Conventions, written in English like the existing README/docs: create CONTRIBUTING.md at the repository root covering branch names, commit prefixes (feat/fix/docs/test/refactor/chore, as in .claude/rules/git-workflow.md), the rule that every PR is reviewed by a different team member, the board columns above, the label and milestone names used by docs/backlog (mvp, extension, backend, ai, tts, testing, docs, ux, privacy, infra, decision, bug, integration; milestones "MVP – Týden 1" to "MVP – Týden 4"), and a Definition of Done (acceptance criteria met, relevant tests actually run, reviewed, CI green, docs updated, no secrets). Add .github/pull_request_template.md with a checklist that mirrors the Definition of Done and a field for the ZF issue id. Do not invent GitHub usernames or a CODEOWNERS file.
5. Docs: update README.md (project status, link to CONTRIBUTING.md and docs/backlog, local setup that actually works) and docs/DEVELOPMENT.md (real clone URL, correct folder name, test and lint commands you have verified, a note on how to run CI checks locally). Do not document a backend server start command that does not exist yet. Keep claims limited to what you verified.
6. Do not touch extension or backend application code, docs/mvp.md, docs/backlog/*, .claude/*, CLAUDE.md or prompts/.
</requirements>

<restrictions>
- Do NOT create, change or close anything on GitHub: no issues, no project board, no branch protection, no repository settings, no pushes, no pull requests. I only have the push role, so settings that need admin rights (branch protection, required reviews, required status checks, board creation) cannot be done by me. Document them in CONTRIBUTING.md as "repository owner setup" steps and list them in your report instead.
- Do not commit or push unless I explicitly ask. Leave changes uncommitted on the branch and give me a suggested commit message in English with a conventional prefix.
- Do not add runtime dependencies, frameworks, a database or external services. Do not fill CLAUDE.md.
- Do not print or store tokens or secrets. Never claim a test or CI run passed unless you actually ran it. GitHub Actions cannot be executed locally; say so, and validate the workflow YAML syntax with whatever tool is available (for example actionlint or a YAML parser) and state which one you used.
</restrictions>

<verification>
Run and report the actual output summaries of:
- `python -m venv .venv`, `pip install -r backend/requirements.txt`, `pytest backend` (state the exact working directory/command that works; fix the docs if `pytest` must be run from backend/).
- the ruff check you configured.
- `python -m json.tool extension/manifest.json`, and `node --check` on each extension JS file (if node is not installed, say so and skip).
- a workflow syntax check as described above.
- `git status` and `git diff --stat`, confirming that only intended files changed and that no secret or .env file is staged or tracked.
List every check that could not be run and why.
</verification>

<completion_criteria>
- A pull request would trigger CI that runs backend tests, backend lint and the extension checks, and the checks pass locally where they can be run.
- CONTRIBUTING.md, the PR template, README.md and docs/DEVELOPMENT.md exist and agree with each other and with .claude/rules.
- No secrets are tracked, no file outside the allowed list changed, and nothing was committed, pushed or changed on GitHub.
</completion_criteria>

<output_format>
Respond in Czech with these sections: Souhrn změn (files created or edited), Provedené kontroly (commands and real results), Neprovedené kontroly (and why), Vyžaduje rozhodnutí člověka (including the TypeScript conflict and whether to pin dependency versions), Kroky pro vlastníka repozitáře (branch protection, required reviews, required status checks, project board), Navržená commit message (English).
</output_format>