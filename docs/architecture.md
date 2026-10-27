# ZenFeed Architecture

## Overview

ZenFeed consists of two primary components:

1. **Chrome Extension** — provides the user interface and interacts with the current web page.
2. **Backend** — exposes an API for processing requests and potentially integrating AI services.

## Chrome Extension

The extension uses Manifest V3 and JavaScript.

Responsibilities:
- Display the popup user interface.
- Extract relevant page content when browser permissions allow it.
- Display processing results.
- Communicate with the backend when a feature requires it.

Suggested components:
- `manifest.json` — extension configuration and permissions.
- `popup.html`, `popup.css`, `popup.js` — popup interface.
- Content script — page content extraction, when needed.
- Service worker — background tasks, when needed.

Actual file names may differ depending on the implementation.

## Backend

The backend uses Python and FastAPI.

Responsibilities:
- Expose HTTP endpoints.
- Validate requests using Pydantic.
- Execute application logic.
- Potentially provide summarization, classification, or other AI features.

Suggested separation:
- API routes.
- Pydantic schemas.
- Application services.
- External service integrations.
- Tests.

## Data Flow

1. The user opens a web page.
2. The extension attempts to extract relevant text.
3. The user triggers a feature.
4. If a backend is required, the extension sends the necessary data to the API.
5. The backend validates and processes the request.
6. The extension displays the result or a meaningful error.

Not every feature needs every step. Basic text extraction may run entirely within the extension.

## Security and Privacy

- Request only the Chrome permissions that are necessary.
- Treat web page content as untrusted input.
- Render untrusted text safely, for example, using `textContent`.
- Never include secret keys in extension source code.
- Send only necessary content to the backend.
- Document whether content is transmitted and where it goes.
