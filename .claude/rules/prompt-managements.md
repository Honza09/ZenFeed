## Explicit Save Trigger

Save a prompt only when the user's message begins with `/save-prompt`, allowing leading whitespace.

Examples:
- `/save-prompt Implement the Chrome Extension MVP` — save the prompt.
- `Fix the popup bug` — do not save.
- `Add API tests` — do not save.

Never infer that a prompt should be saved without the explicit trigger.

## Prompt File Naming

Do not use sequential numeric numbering such as `01`, `02`, or `03`. Sequential numbering is unsafe when multiple contributors create prompts on separate Git branches.

Use this filename format:

`YYYYMMDD-HHMMSS-short-description.md`

Example:

`20261027-143052-extension-mvp.md`

Requirements:
- Use a timestamp based on the current local date and time.
- Use a short, descriptive, lowercase kebab-case suffix.
- Before creating a file, inspect the existing prompt filenames.
- If the exact filename already exists, append a short unique suffix, such as `a7f3`, before `.md`.
- Never overwrite an existing prompt.
- Do not rename existing prompt files merely to impose a different ordering.
- Do not rely on timestamps as a guarantee of global uniqueness.

## Saving Workflow

When a user message begins with `/save-prompt`:

1. Remove the trigger from the prompt content.
2. Preserve the user's intended task.
3. Inspect the existing files in `prompts/`.
4. Generate a timestamp-based, descriptive filename.
5. Verify that the filename does not already exist.
6. Save the prompt as a Markdown file.
7. Update `prompts/README.md` with a link to the new file and a short description.
8. Report the filename to the user.
9. Do not execute the saved task unless explicitly requested.

If the trigger is absent, do not create or modify prompt files as part of prompt management.

## Prompt Index

Maintain `prompts/README.md` as a catalog of saved prompts.

- Link each prompt using its relative filename.
- Include a short purpose description.
- Do not assign sequential IDs.
- Do not assume the index order determines prompt priority.
- Keep entries reasonably organized by topic or creation date.
- When merging branches, preserve all distinct prompt entries and remove only genuine duplicate links.

## Prompt Content

Write saved prompts in English unless the user explicitly requests another language.

Where relevant, include:
- Objective
- Context
- Requirements
- Restrictions
- Verification
- Completion Criteria

Do not store secrets, API keys, credentials, or private user data in prompts.

## Git Collaboration

- Prompt files are shared project assets.
- Do not commit or push automatically.
- Avoid unnecessary edits to the shared index.
- Do not overwrite, delete, or rename existing prompts without explicit approval.
