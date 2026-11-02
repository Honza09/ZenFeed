# ZenFeed

Chrome extension that hides content blocks the user does not want to read,
and produces a standalone summary that can be played in a synthetic voice.
It never modifies the page text. See [`docs/mvp.md`](docs/mvp.md).

## Project structure

- `extension/` — Chrome Extension (Manifest V3)
- `backend/` — Python FastAPI backend
- `docs/` — architecture and technical documentation

## Requirements

- Google Chrome
- Python 3.11+
- Git

## Local setup

Clone the repository:

    git clone https://github.com/Honza09/ZenFeed.git
    cd ZenFeed

Create a virtual environment, activate it and install the backend dependencies
(including the lint and test tools):

    python -m venv .venv
    source .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
    pip install -r backend/requirements-dev.txt

Run the checks that CI runs (from the repository root):

    ruff check backend
    pytest backend

Load the extension in Chrome via `chrome://extensions` (Developer mode,
**Load unpacked**, select `extension/`). Details are in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

Start the backend (virtual environment active, from the repository root):

    uvicorn app.main:app --app-dir backend --reload

`GET http://127.0.0.1:8000/health` returns `{"status":"ok"}`.
`POST /v1/analyze` checks the blocks and returns one result per block.
Classification is not implemented yet, so every block comes back as
`recommended_action: "review"` and nothing is hidden. Optional settings are
listed in `.env.example`.

## Contributing

The MVP scope is in [`docs/mvp.md`](docs/mvp.md) and the task list in
[`docs/backlog/`](docs/backlog/README.md). Workflow, commit conventions and the
Definition of Done are in [`CONTRIBUTING.md`](CONTRIBUTING.md).
