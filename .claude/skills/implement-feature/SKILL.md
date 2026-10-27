---
name: implement-feature
description: Plan and implement a focused ZenFeed feature from requirements to verified code. Use when implementing a new feature or changing existing behavior.
---

# Implement Feature

## Goal
Implement the smallest complete feature that satisfies the user's requirements.

## Workflow

1. Inspect the repository and relevant files.
2. Read applicable project rules.
3. Check git status and preserve uncommitted changes.
4. Identify requirements, constraints, and acceptance criteria.
5. Describe the planned changes before implementation.
6. Identify affected frontend, backend, API contracts, and tests.
7. Implement the smallest coherent change.
8. Add or update relevant tests.
9. Run available checks.
10. Inspect the final diff for unrelated changes and accidental secrets.

## Constraints

- Do not introduce frameworks or dependencies without justification.
- Do not expand scope without approval.
- Do not overwrite unrelated user work.
- Do not invent test results.
- Ask before destructive actions or major architectural changes.

## Completion report

Summarize:
- What changed and why.
- Files modified.
- Commands and tests actually run.
- Test results.
- Known limitations.
- Recommended next step.