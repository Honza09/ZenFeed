# Development Setup

## Prerequisites

- Git.
- Google Chrome or a compatible Chromium-based browser.
- A Python version supported by the project.
- An editor with JavaScript and Python support.
- Claude Code, optionally, as a development assistant.

## Clone the Repository

If you do not have a local copy yet:

```bash
git clone https://github.com/Honza09/ZenFeed.git
cd ZenFeed
```

## Chrome Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the `extension/` directory.
5. Reload the extension after changes and test it again.

If the directory or manifest does not exist yet, implement it first.

## Backend

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Linux or macOS:

```bash
source .venv/bin/activate
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies, including the lint and test tools (`requirements-dev.txt` includes `requirements.txt`):

```bash
pip install -r backend/requirements-dev.txt
```

Start the API from the repository root:

```bash
uvicorn app.main:app --app-dir backend --reload
```

`GET http://127.0.0.1:8000/health` returns `{"status":"ok"}`. The extension popup calls this address (port 8000), so keep the default port when using the extension ([`popup.md`](popup.md)). Generated docs are at `http://127.0.0.1:8000/docs`. The server starts without a key; then `/v1/summarize` answers `503 summary_unavailable` and everything else works. For summaries, put a Gemini free-tier key (no billing account, ZF-25) into `.env` as `ZENFEED_AI_API_KEY` (copy `.env.example`, never commit `.env`) and start with `uvicorn app.main:app --app-dir backend --env-file .env`; the variables are described in [`summarize.md`](summarize.md).

## Running the checks locally

CI (`.github/workflows/ci.yml`) runs the same commands. Run them from the repository root before opening a pull request:

```bash
ruff check backend
pytest backend
python .github/scripts/check_extension.py extension/manifest.json
find extension tests/extension \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -r -n1 node --check
node --test tests/extension/*.test.mjs
node tests/extension/hider-browser.mjs
```

The last three commands need Node.js 22+ (the browser test also needs Google Chrome; set `CHROME_PATH` if it is not in the default place), used only for checks and tests; the extension itself has no build step. The GitHub Actions workflow itself cannot be run locally; it runs when a pull request is opened.

## Configuration

- Store sensitive values in a local `.env` file if the application uses one.
- Provide an `.env.example` file containing placeholders, never real secrets.
- Never commit `.env` files, access tokens, or credentials.
- Add dependencies deliberately and document significant changes.

## Recommended Workflow

1. Update your branch from the repository.
2. Create a branch for a specific task.
3. Implement a small, clearly scoped change.
4. Run the relevant tests.
5. Review `git diff`.
6. Prepare a commit and pull request as described in [`CONTRIBUTING.md`](../CONTRIBUTING.md).
