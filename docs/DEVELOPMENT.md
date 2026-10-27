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
git clone <REPOSITORY_URL>
cd zenfeed
```

Replace `<REPOSITORY_URL>` with the actual GitHub repository URL.

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

If `backend/requirements.txt` exists, install dependencies:

```bash
pip install -r backend/requirements.txt
```

The exact server startup command depends on the actual FastAPI application module. Add a verified command here once the entry point has been implemented.

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
6. Prepare a commit and pull request according to the team's workflow.
