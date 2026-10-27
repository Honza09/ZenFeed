---
paths:
  - "**/*"
---

# ZenFeed Git Workflow Rules

## General
- Follow the existing Git repository structure and conventions.
- Inspect `git status` and relevant files before making changes.
- Never overwrite or discard user changes.
- Keep changes focused on the task being implemented.
- Do not commit generated files, caches, virtual environments, or secrets.

## Branches
- Use descriptive branch names, for example:
  - `feature/page-extraction`
  - `feature/backend-summary`
  - `fix/popup-error-handling`
  - `docs/setup-guide`
- Do not work directly on `main` unless explicitly requested.
- Create a branch only when appropriate for the task and repository state.
- Do not switch branches if doing so could risk losing uncommitted work.

## Commits
- Use short, descriptive commit messages.
- Prefer conventional prefixes when practical:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for tests
  - `refactor:` for code restructuring
  - `chore:` for maintenance
- Do not create a commit unless the user requests it or has clearly authorized it.

## Safety
- Never run destructive Git commands without explicit user approval.
- This includes `git reset --hard`, `git clean -fd`, forced checkout, and rewriting shared history.
- Never force-push without explicit approval.
- Never amend or rewrite existing commits without explicit approval.
- Do not stage unrelated files.
- Before committing, inspect the staged diff and confirm it contains only intended changes.
- Never commit API keys, passwords, access tokens, `.env` files, or private credentials.

## Collaboration
- Do not push to a remote repository unless explicitly requested.
- Do not open, merge, or close pull requests unless requested.
- When multiple people work on the project, avoid changing shared files unnecessarily.
- Explain important file changes and any commands that require manual execution.

## Before Finishing
- Summarize what changed.
- List tests that were actually run and their results.
- Mention any tests that could not be run and why.
- Highlight unresolved issues or required manual steps.
