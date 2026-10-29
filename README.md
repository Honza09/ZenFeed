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

## Backend setup

Create a virtual environment:

    python -m venv .venv

Activate it, then install dependencies:

    pip install -r backend/requirements.txt

## Development

The project is currently in its initial setup phase.
See the project issues for assigned tasks.