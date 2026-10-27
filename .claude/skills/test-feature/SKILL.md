---
name: test-feature
description: Design and run tests for a ZenFeed feature, including success cases, edge cases, and failure handling. Use when adding behavior or verifying a change.
---

# Test Feature

## Workflow

1. Identify the expected behavior and acceptance criteria.
2. Inspect the existing test framework and test conventions.
3. List normal cases, edge cases, and failure cases.
4. Add focused automated tests where practical.
5. Run the relevant test suite.
6. Report exact results and any tests that could not be run.

## Backend cases

- Valid request.
- Missing required fields.
- Empty content.
- Invalid data types.
- Oversized input, if size limits are implemented.
- Expected service or network failure.
- Response schema validation.

## Extension cases

- Supported article page.
- Page with no useful text.
- Missing title.
- Long content.
- Text containing HTML-like characters.
- Content script unavailable or blocked.
- Backend timeout, once backend integration exists.

## Rules

- Do not change production code just to make a test pass without understanding the failure.
- Do not claim browser testing was performed if only static inspection was possible.
- Separate automated test results from manual browser checks.

## Completion report

Include test cases added, commands run, actual results, and remaining gaps.