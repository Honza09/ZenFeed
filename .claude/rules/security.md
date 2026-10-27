---
description: Security and privacy rules for all ZenFeed code
---

# Security Rules

- Never put API keys or secrets in browser extension code.
- Never commit credentials, tokens, or .env files.
- Treat webpage content as untrusted input.
- Never execute extracted webpage content.
- Use textContent instead of unsafe HTML insertion for untrusted text.
- Request only necessary Chrome permissions.
- Validate all backend input with Pydantic.
- Add timeouts and error handling to external requests.
- Avoid storing webpage content unless explicitly required.
- Do not log unnecessary personal data or complete page contents.
- Never claim a security property has been verified without testing it.