---
name: backend-api
description: Design or implement a ZenFeed FastAPI endpoint, Pydantic schemas, validation, and API tests. Use when working on backend HTTP APIs.
---

# Backend API Development

## Workflow

1. Inspect the existing FastAPI app and conventions.
2. Confirm the endpoint's purpose and request/response contract.
3. Define or update Pydantic schemas.
4. Implement the endpoint with clear error handling.
5. Keep business logic separate from route handling when appropriate.
6. Add tests for valid requests and expected failures.
7. Update API documentation and examples.
8. Run the relevant tests.

## Constraints

- Do not expose secrets or internal stack traces.
- Validate untrusted input.
- Add appropriate limits and timeouts when processing external data.
- Do not call an AI provider directly from the extension.
- Do not add a database unless persistence is required.
- Do not invent endpoint behavior that was not specified.

## Completion report

Document the endpoint, request and response schemas, tests, and known limitations.