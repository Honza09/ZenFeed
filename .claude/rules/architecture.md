---
description: Architecture and technology constraints for ZenFeed
---

# Architecture Rules

- ZenFeed is primarily a Chrome Extension.
- Use Manifest V3.
- The initial frontend uses HTML, CSS, and vanilla JavaScript.
- The backend uses Python, FastAPI, and Pydantic.
- Do not introduce Next.js into the initial scope.
- Do not migrate to React or another framework without approval.
- Keep extension and backend responsibilities separate.
- Document API contracts before integrating new endpoints.
- Do not add a database or external service without a concrete requirement.
- Prefer the smallest working implementation.