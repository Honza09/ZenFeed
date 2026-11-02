# ZenFeed API Reference

Endpoints implemented for ZF-05. `/v1/summarize` and `/v1/tts` are later issues (ZF-15, ZF-16) and are not part of this server.

The extension sends blocks produced by the content script (`id`, `kind`, `title`, `text`). `title` is accepted and ignored. Classification is not implemented: `/v1/analyze` validates the body and returns `recommended_action: "review"` for every block, so nothing is hidden.

## Principles

- REST API implemented with FastAPI.
- JSON request and response bodies.
- Pydantic request and response validation.
- Page text and API keys are not written to logs.
- No secret keys in extension source code. The optional `ZENFEED_AI_API_KEY` is read from the environment and is unused until classification exists.

## Endpoints

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/health` | Check backend availability | Implemented |
| POST | `/v1/analyze` | Validate blocks and return one unclassified result per block | Implemented, no classifier yet |

## GET /health

Response `200`:

```json
{"status": "ok"}
```

## POST /v1/analyze

Request:

```json
{
  "blocks": [
    {
      "id": "zf-0",
      "text": "Normalized visible text.",
      "kind": "article",
      "title": "Optional heading"
    }
  ],
  "preferences": {"war": true}
}
```

- `blocks`: 1 to 100 items. `id` matches `[A-Za-z0-9_-]+` and is unique in the request. `text` is 1 to 8000 characters after trimming; blank text is rejected. `kind` is `article`, `section`, `comment`, `post`, or `other`.
- `preferences`: up to 32 keys, each 1 to 64 characters. Values are JSON booleans (`true` / `false` only). Categories are not frozen yet (ZF-24), so the keys are not a fixed list.
- The whole body must be at most 1 MiB.

Response `200`:

```json
{
  "results": [
    {
      "id": "zf-0",
      "category": "unclassified",
      "toxicity_score": 0.0,
      "confidence": 0.0,
      "recommended_action": "review"
    }
  ],
  "model_version": "none"
}
```

`model_version: "none"` means no model ran. `toxicity_score` and `confidence` are 0 to 1. `recommended_action` is `show`, `hide`, or `review`. This placeholder never returns `hide`.

## Errors

| Status | Body | When |
|---|---|---|
| 422 | `{"error":"validation_error","details":[{"loc":[],"msg":""}]}` | Missing or invalid fields. `details` contains only `loc` and `msg`, not the submitted text. |
| 413 | `{"error":"request_too_large"}` | Body larger than 1 MiB. |
| 504 | `{"error":"timeout"}` | Analysis exceeds `ZENFEED_ANALYZE_TIMEOUT_SECONDS` (default 10, maximum 120). |
| 500 | `{"error":"internal_error"}` | Unexpected failure or a response that does not match the output schema. No stack trace. |

## Keeping this document updated

After each API change, update the paths, schemas, errors, and tests.
