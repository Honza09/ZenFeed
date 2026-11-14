# ZenFeed API Reference

Contract between the extension and the backend (ZF-02). `/health`, `/v1/analyze` (ZF-05, ZF-06) and `/v1/summarize` (ZF-15, [`summarize.md`](summarize.md)) are served. There is no `/v1/tts`: the voice is read by Chrome in the extension (`docs/rozhodnuti-zf-25.md`, ZF-16, ZF-17). The overall design is in [`architecture.md`](architecture.md).

Changes to this contract need the agreement of Jan and Daniel.

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
| POST | `/v1/summarize` | Summarize the kept blocks | Implemented (Gemini free tier; 503 without a key) |

The backend listens on `http://127.0.0.1:8000` on the demo machine. The extension reaches it through `host_permissions` for that address only. The backend sets no CORS headers, so ordinary web pages cannot read its responses.

## Block IDs

Block IDs (`zf-0`, `zf-1`, …) are valid for one extraction only. The backend never returns an action without the `id` of the block it belongs to, and it keeps no state between requests. The extension checks that results belong to its current extraction with an `extractionId` that is never sent to the backend ([`block-mapping.md`](block-mapping.md)).

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

- `blocks`: 1 to 100 items, classified in batches of 20. The extension sends a longer page as several requests of at most 100 blocks; splitting into smaller batches for a hosted model is the backend's job. `id` matches `[A-Za-z0-9_-]+` and is unique in the request. `text` is 1 to 8000 characters after trimming; blank text is rejected. `kind` is `article`, `section`, `comment`, `post`, or `other`.
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

`model_version` names the classifier that produced the whole response. When a hosted model is connected (Gemini, `docs/rozhodnuti-zf-25.md`) and it fails or hits its limit, the request falls back to `lexicon-1` as a whole and `model_version` says so. `/v1/analyze` therefore has no `429` or `503`.

## Errors

| Status | Body | When |
|---|---|---|
| 422 | `{"error":"validation_error","details":[{"loc":[],"msg":""}]}` | Missing or invalid fields. `details` contains only `loc` and `msg`, not the submitted text. |
| 413 | `{"error":"request_too_large"}` | Body larger than 1 MiB. |
| 504 | `{"error":"timeout"}` | Analysis exceeds `ZENFEED_ANALYZE_TIMEOUT_SECONDS` (default 10, maximum 120). |
| 500 | `{"error":"internal_error"}` | Unexpected failure or a response that does not match the output schema. No stack trace. |

## POST /v1/summarize

`SummaryRequest` and `SummaryResponse` in `backend/app/schemas.py`. Served since ZF-15 with the Gemini free tier; how the model is called, the prompt rules and the limits are in [`summarize.md`](summarize.md). Below 200 characters of kept text the answer is `insufficient_input: true` without calling the model; at most 30 000 characters of block text reach the model.

Request:

```json
{
  "blocks": [
    {"id": "zf-3", "text": "The harvest festival opened on Saturday.", "kind": "article"}
  ],
  "preferences": {"valka": true, "toxicky": true},
  "omitted_categories": ["valka"],
  "language": "cs"
}
```

- `blocks`: only the blocks that are visible after hiding, with the same rules as `/v1/analyze`. Hidden text is not sent. The extension also leaves out a visible block that wraps or shares an element with a hidden one, because its text includes the hidden text ([`summary-panel.md`](summary-panel.md)). At least one block is required; an empty list is a 422.
- `preferences`: the switches that were applied, same object as in `/v1/analyze`.
- `omitted_categories`: the topics that were actually hidden on the page, taken by the extension from the `/v1/analyze` results. Unique values from `valka`, `politicke_konflikty`, `umrti`, `katastrofy`, `nasili`; default `[]`. Each one must be switched on in `preferences`, otherwise 422. Blocks hidden only for their tone are covered by `preferences.toxicky`.
- `language`: `cs` or `en`, default `cs`.

When hiding left no block visible, the extension does not call `/v1/summarize` and shows its "nothing relevant left" message ([`edge-states.md`](edge-states.md)).

Response fields:

| Field | Meaning |
|---|---|
| `summary` | At most 4000 characters. Required when both flags below are false. |
| `preferences` | The switches that were applied. |
| `omitted_categories` | The request's `omitted_categories`, returned unchanged so the panel can show what was left out. |
| `insufficient_input` | The kept text was not enough to summarize. |
| `no_relevant_content` | The kept blocks contain nothing worth summarizing (for example only navigation or captions). |
| `model_version` | Identifier of the summary implementation. |

A blank `summary` is valid only when `insufficient_input` or `no_relevant_content` is true. The summary never replaces an omitted topic with invented content.

Errors are the same as for `/v1/analyze` (`422`, `413`, `504`, `500`), plus two for the hosted model. A summary has no local fallback, so these are errors, not a lower-quality answer:

| Status | Body | When |
|---|---|---|
| 503 | `{"error":"summary_unavailable"}` | The model is not configured (no key) or the provider failed. |
| 429 | `{"error":"rate_limited"}` | The provider's free-tier limit was reached. Try again later. |

In every summary error the filtering on the page keeps working, and the extension shows a message instead of a summary.

## Keeping this document updated

After each API change, update the paths, schemas, errors, and tests.
