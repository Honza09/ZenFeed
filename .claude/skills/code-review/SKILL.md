---
name: code-review
description: Review ZenFeed code changes for correctness, security, regressions, maintainability, and missing tests. Use before merging a branch or reviewing a pull request.
---

# Code Review

## Workflow

1. Inspect the diff and understand the intended behavior.
2. Read relevant architecture and security rules.
3. Identify correctness bugs and regression risks.
4. Check input validation and error handling.
5. Inspect browser permissions and data handling when relevant.
6. Check for exposed credentials, unsafe DOM operations, and unnecessary data collection.
7. Check whether tests cover the changed behavior.
8. Run relevant tests if possible.
9. Report findings in severity order.

## Review priorities

- Critical: exposed secrets, serious security issues, data loss.
- High: incorrect behavior, broken functionality, major regressions.
- Medium: missing error handling, meaningful edge cases, incomplete tests.
- Low: readability, naming, or minor maintainability improvements.

## Output format

For each finding, include:
- Severity.
- File and line when available.
- Problem.
- Impact.
- Recommended fix.

Do not report speculative issues as confirmed bugs.
If no issues are found, state what was reviewed and which checks were performed.