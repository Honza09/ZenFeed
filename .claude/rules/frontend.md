---
paths:
  - "extension/**/*.js"
  - "extension/**/*.html"
  - "extension/**/*.css"
  - "extension/manifest.json"
---

# ZenFeed Frontend Rules

## Technology
- Build the Chrome Extension using Manifest V3.
- Prefer vanilla JavaScript, HTML, and CSS.
- Do not introduce React, Vue, TypeScript, or a build system unless explicitly requested or the project architecture requires it.
- Keep the extension lightweight and minimize dependencies.

## Chrome Extension Architecture
- Follow Manifest V3 conventions.
- Use a service worker for background tasks that require it.
- Use content scripts only for functionality that needs access to the current web page.
- Keep popup UI logic separate from content extraction logic.
- Declare only the Chrome permissions that are strictly necessary.
- Never use Manifest V2 APIs.

## JavaScript
- Prefer small, focused functions with clear names.
- Use `const` by default and `let` when reassignment is required.
- Handle asynchronous operations with `async`/`await`.
- Handle errors explicitly; do not silently swallow exceptions.
- Avoid unnecessary global variables.
- Validate data received from content scripts, storage, or the backend.

## DOM and Security
- Use `textContent` instead of `innerHTML` for untrusted text.
- Do not execute page content as JavaScript.
- Do not use `eval()` or dynamically execute downloaded code.
- Treat all extracted website content as untrusted input.
- Do not expose API keys, secrets, or internal configuration in frontend code.
- Avoid collecting or transmitting page content unless required by an explicitly implemented feature and explained to the user.

## UI and Accessibility
- Keep the popup simple, responsive, and easy to understand.
- Provide visible loading, empty, success, and error states.
- Use semantic HTML and accessible labels.
- Make sure buttons and other controls have clear purposes.
- Do not claim a feature works unless it has been implemented and tested.

## Testing
- Test the extension in Chrome with Manifest V3.
- Verify behavior on multiple types of pages.
- Account for restricted pages where content scripts cannot run, such as `chrome://` pages.
- Test missing page content, empty content, and extraction errors.
- Document manual testing steps when automated browser testing is unavailable.
