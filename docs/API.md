# ZenFeed API Reference

Endpoints implemented for ZF-05 and ZF-06. ZF-14 types the preference switches and the summary contract. `/v1/summarize` and `/v1/tts` are later issues (ZF-15, ZF-16) and are not part of this server.

The extension sends blocks produced by the content script (`id`, `kind`, `title`, `text`). `title` is included in classification. `/v1/analyze` assigns one topic and a separate tone. It is a local lexicon over the categories in `docs/kategorie-mvp.md`, not a hosted model.

## Principles

- REST API implemented with FastAPI.
- JSON request and response bodies.
- Pydantic request and response validation.
- Page text and API keys are not written to logs.
- No secret keys in extension source code. `ZENFEED_AI_API_KEY` is read from the environment and is not used by the local classifier.

## Endpoints

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/health` | Check backend availability | Implemented |
| POST | `/v1/analyze` | Classify topic and tone, then recommend show, hide, or review | Implemented (`lexicon-1`) |

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
      "text": "The report described an airstrike.",
      "kind": "article",
      "title": "Optional heading"
    }
  ],
  "preferences": {"valka": true, "toxicky": false}
}
```

- `blocks`: 1 to 100 items, classified in batches of 20. `id` matches `[A-Za-z0-9_-]+` and is unique in the request. `text` is 1 to 8000 characters after trimming; blank text is rejected. `kind` is `article`, `section`, `comment`, `post`, or `other`.
- `preferences`: a fixed object. Keys are `valka`, `politicke_konflikty`, `umrti`, `katastrofy`, `nasili`, and `toxicky`. A missing key means `false`. Values are JSON booleans (`true` / `false` only). Any other key, including `jine`, is a 422. `jine` is the leftover topic, not a hide switch.
- The whole body must be at most 1 MiB.

Response `200`:

```json
{
  "results": [
    {
      "id": "zf-0",
      "category": "valka",
      "topic": "valka",
      "tone": "neutralni",
      "toxicity_score": 0.0,
      "confidence": 0.8,
      "recommended_action": "hide"
    }
  ],
  "model_version": "lexicon-1"
}
```

`category` and `topic` are the same value, one of `valka`, `politicke_konflikty`, `umrti`, `katastrofy`, `nasili`, `jine`, so the extension can keep storing `category`. `tone` is `neutralni` or `toxicky`. When several topics match, the order is `valka`, then `nasili`, then `katastrofy`, then `umrti`, then `politicke_konflikty`.

If the classifier builds a result that does not match this schema, it is replaced once with `topic` `jine`, `confidence` 0 and `recommended_action` `review`. That replacement never hides the block. A response that still fails validation is `500` with `internal_error` and no stack trace.

`toxicity_score` is 0 for a neutral tone and the tone score otherwise. `confidence` is the topic score. Both are 0 to 1. `recommended_action` is `hide` only when a selected preference matches and the score is at least 0.7. A weaker match is `review`. Otherwise the action is `show`. A factual report about war can be hidden for the topic while its tone stays `neutralni`.

## Errors

| Status | Body | When |
|---|---|---|
| 422 | `{"error":"validation_error","details":[{"loc":[],"msg":""}]}` | Missing or invalid fields. `details` contains only `loc` and `msg`, not the submitted text. |
| 413 | `{"error":"request_too_large"}` | Body larger than 1 MiB. |
| 504 | `{"error":"timeout"}` | Analysis exceeds `ZENFEED_ANALYZE_TIMEOUT_SECONDS` (default 10, maximum 120). |
| 500 | `{"error":"internal_error"}` | Unexpected failure or a response that does not match the output schema. No stack trace. |

## Summary contract (not served)

`SummaryRequest` and `SummaryResponse` in `backend/app/schemas.py` are the shape for ZF-15. There is no `POST /v1/summarize` yet.

Request fields: the same `blocks` and `preferences` as `/v1/analyze`, plus `language` `cs` or `en` (default `cs`). At least one block is required. An empty page is a 422, not a summary flag.

Response fields:

| Field | Meaning |
|---|---|
| `summary` | At most 4000 characters. Required when both flags below are false. |
| `preferences` | The switches that were applied. |
| `omitted_categories` | Unique values from `valka`, `politicke_konflikty`, `umrti`, `katastrofy`, `nasili`. |
| `insufficient_input` | The kept text was not enough to summarize. |
| `no_relevant_content` | Nothing relevant remained after the preferences. |
| `model_version` | Identifier of the summary implementation. |

A blank `summary` is valid only when `insufficient_input` or `no_relevant_content` is true.

## Keeping this document updated

After each API change, update the paths, schemas, errors, and tests.
