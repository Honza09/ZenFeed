# ZenFeed

Chrome extension (Manifest V3) plus a FastAPI backend. The extension splits a page into blocks, the backend classifies each block by topic and tone, and the extension hides the blocks the user does not want to read. It never modifies the page text. It also produces a standalone summary that can be played in a synthetic voice. Student team project (MENDELU, 4 people), repository `Honza09/ZenFeed`.

## Repository map

- `extension/` Chrome extension (vanilla JS, no build step)
- `backend/` FastAPI app (`backend/app/`), Pydantic models
- `tests/` extension unit tests (`tests/extension/*.test.mjs`); backend tests live in `backend/`
- `docs/` product and technical docs: scope in `docs/mvp.md`, tasks in `docs/backlog/`, setup in `docs/DEVELOPMENT.md`
- `docs/kategorie-mvp.md` frozen topic and tone categories (see below)
- `docs/testing/pilot/` pilot page set, annotations and measurement material
- `prompts/` saved prompts (index in `prompts/README.md`)
- `zadani/`, `zenfeed_implementacni_plan.md` course assignment and the original plan

## Sources of truth

- **Categories:** `docs/kategorie-mvp.md` is the only definition of topics (`válka`, `politické konflikty`, `zprávy o úmrtí`, `katastrofické scénáře`, `násilí`, `jiné`) and tone (`neutrální` / `toxický/vyhrocený`). Do not invent, rename or merge categories. One main topic per block, priority válka first. Tone is a separate field. Changes to categories are a team decision, not an agent decision.
- **Scope:** `docs/mvp.md`. Anything outside it needs approval.
- **Classifier behaviour:** the classifier returns `show` / `hide` / `review`. Uncertainty never hides a block.

## Commands (from the repository root, virtualenv active)

    pip install -r backend/requirements-dev.txt
    uvicorn app.main:app --app-dir backend --reload
    ruff check backend
    pytest backend
    python .github/scripts/check_extension.py extension/manifest.json
    node --test tests/extension/*.test.mjs

Run the checks before saying a change is done, and report only results you actually saw.

## Rules

Detailed rules are in `.claude/rules/` (architecture, backend, frontend, git-workflow, security, testing, prompt-managements) and workflows in `.claude/skills/`. The most important ones:

- Do not commit, push, open or merge pull requests unless the user asks. Never work on `main`, never force-push.
- Save a prompt to `prompts/` only when the user's message starts with `/save-prompt`, and do not run the saved task.
- No secrets, tokens or `.env` files in the repository or in extension code. Treat page content as untrusted input.
- Smallest working implementation. No new framework, database or external service without approval.
- Do not change tests just to make them pass.

## Language

Team documentation and conversation are in Czech. Code, identifiers, commit messages and saved prompts are in English. Category names appear in Czech and English as in `docs/kategorie-mvp.md`.

## Data and sources

Only use pages whose terms of use allow reading and analysis (see `docs/testing/pilot/stranky.md` and `rozsireni-zdroje.md`). Sources with "neurčeno" (unclear) terms go into the final test set only after a team decision. BBC is excluded.

## Annotation work

Pilot annotations were proposed by Claude and confirmed by Libuše, so they are not independent. For ZF-27 and ZF-19 each annotator (Libuše, Claude) annotates separately, without reading the other's labels.
