# ZenFeed Documentation

ZenFeed is a project focused on personalized web content filtering and processing through a Google Chrome extension.

## Project Goals

The goal is to help users work with online content through features such as:
- Extracting the main text of a web page.
- Filtering and organizing content.
- Summarizing long texts.
- Content classification and potential toxicity detection.
- Potential text-to-speech functionality.

Features will be implemented incrementally. Planned features are not necessarily available in the current version.

## Technology Stack

- **Frontend:** Chrome Extension, Manifest V3, HTML, CSS, JavaScript.
- **Backend:** Python, FastAPI, Pydantic.
- **AI/ML:** Planned integrations based on project requirements.
- **Version Control:** Git and GitHub.

## Repository Structure

```text
zenfeed/
├── extension/       # Chrome Extension
├── backend/         # FastAPI backend
├── docs/            # Project documentation
├── tests/           # Tests, if maintained at this level
├── .claude/         # Claude Code rules and skills
├── CLAUDE.md        # Instructions for Claude Code
└── README.md        # Main repository README
```

Adapt this structure to match the actual repository as development progresses.

## Getting Started

1. Review the documentation in `docs/`.
2. Inspect the current repository structure.
3. Implement a minimal working extension.
4. Verify that it can extract a page title and main text.
5. Add backend and AI functionality incrementally.

## Documentation Index

- [Architecture](ARCHITECTURE.md)
- [Development Setup](DEVELOPMENT.md)
- [API Reference](API.md)
- [Testing](TESTING.md)
- [Roadmap](ROADMAP.md)
