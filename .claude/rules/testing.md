---
description: Testing standards for the ZenFeed project
---

# Testing Rules

- Add or update tests when behavior changes.
- Never claim tests passed unless they were actually run.
- Use pytest for Python backend tests.
- Use HTTPX for API tests where appropriate.
- Test valid input, invalid input, empty content, and error cases.
- Test extension extraction on at least three different supported pages.
- Check long content, missing titles, and pages with little readable text.
- Record test commands and actual results.
- Document known limitations.
- Do not change tests merely to hide implementation bugs.