# ZenFeed API Reference

## Document Status

This document describes a proposed API design. Endpoints remain proposals until they are implemented and verified in the backend code.

## Principles

- REST API implemented with FastAPI.
- JSON request and response bodies.
- Pydantic request validation.
- Appropriate HTTP status codes.
- Consistent error responses.
- No secret keys in extension source code.

## Proposed Endpoints

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/health` | Check backend availability | Planned |
| POST | `/api/v1/summarize` | Summarize text | Planned |
| POST | `/api/v1/classify` | Classify content | Planned |

Confirm endpoint names and data contracts with the team before implementation.

## Example Summarization Request

```json
{
  "text": "The text to summarize.",
  "max_length": 150
}
```

## Example Response

```json
{
  "summary": "The generated summary."
}
```

These examples are illustrative and do not represent a confirmed, existing API contract.

## Validation and Errors

The API should:
- Reject missing or invalid required fields.
- Enforce reasonable input text length limits.
- Return appropriate HTTP status codes on failure.
- Avoid exposing internal stack traces or secret values.

## Keeping This Document Updated

After each API change, update:
- Endpoint paths and HTTP methods.
- Request and response schemas.
- Possible errors.
- Endpoint tests.
- Implementation status.
