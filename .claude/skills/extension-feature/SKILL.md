---
name: extension-feature
description: Implement or debug a Chrome Extension Manifest V3 feature in ZenFeed, including popup UI, content scripts, permissions, and browser integration.
---

# Chrome Extension Feature

## Workflow

1. Inspect `manifest.json` and the affected extension files.
2. Identify whether the work belongs in the popup, content script, or another extension component.
3. Check the required Chrome APIs and permissions.
4. Explain any new permission before adding it.
5. Implement the feature using the existing vanilla JavaScript approach.
6. Handle missing content, unsupported pages, and runtime errors.
7. Use safe DOM APIs for untrusted page content.
8. Test in Chrome when the environment permits.
9. Document manual steps and known browser limitations.

## Constraints

- Keep Manifest V3.
- Do not add React, Vite, or Next.js without approval.
- Do not assume every webpage is accessible to content scripts.
- Do not silently send page content to a backend.
- Do not add broad host permissions for convenience.
- Do not claim a feature works in Chrome without appropriate verification.

## Completion report

List files changed, permissions affected, testing performed, and known limitations.