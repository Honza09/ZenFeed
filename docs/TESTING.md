# Testing Strategy

> **Note (Oct 2026):** This is the generic testing strategy. The MVP evaluation (about 24 pages in Czech and English, two annotators, tuning vs. final split, thresholds 80 % / 20 % / 100 %, 5–8 interviews, 3–5 prototype testers) is defined in [`mvp.md`](mvp.md) §7 and will be added here under backlog issue ZF-27.

## Goals

Testing should verify that ZenFeed:
- Extracts relevant page content.
- Displays extracted text safely.
- Communicates with the backend correctly.
- Handles error conditions.
- Does not transmit data that a feature does not need.

## Extension Testing

Perform manual tests in Chrome:
- Load the extension from `extension/`.
- Open and close the popup.
- Extract the page title and main text.
- Test a page with long content.
- Test a page without a clear main text section.
- Test empty or unusual content.
- Test restricted pages, such as `chrome://` pages.
- Navigate to another page and run the feature again.

Test at least three different regular web pages.

## Backend Testing

Use pytest and, where appropriate, HTTPX or FastAPI's test client.

Cover:
- Successful requests.
- Invalid input and missing fields.
- Empty input.
- Excessively long text.
- Unexpected failures.
- External service outages and timeouts.

Mock external AI services in unit tests whenever practical.

## Security Testing

- Verify that HTML-like text is rendered safely.
- Verify input validation.
- Check that logs do not contain secrets.
- Verify that the extension requests only necessary permissions.

## Testing Rules

- Run tests before marking a task complete.
- Never claim a test passed unless it was actually run.
- Document tests that could not be executed.
- Add regression tests for bug fixes when practical.
