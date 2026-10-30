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

The exact server startup command depends on the actual FastAPI application module. Add a verified command here once the entry point has been implemented.

## Running the checks locally

CI (`.github/workflows/ci.yml`) runs the same commands. Run them from the repository root before opening a pull request:

```bash
ruff check backend
pytest backend
python .github/scripts/check_extension.py extension/manifest.json
find extension -name '*.js' -print0 | xargs -0 -r -n1 node --check
```

The last command needs Node.js, used only for the syntax check; the extension itself has no build step. The GitHub Actions workflow itself cannot be run locally; it runs when a pull request is opened.

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
