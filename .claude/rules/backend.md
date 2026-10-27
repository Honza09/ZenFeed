---
paths:
  - "backend/**/*.py"
  - "backend/requirements.txt"
  - "backend/pyproject.toml"
---

# ZenFeed Backend Rules

## Technology
- Use Python and FastAPI.
- Use Pydantic models for request and response validation.
- Use type hints for functions, parameters, and return values.
- Prefer small, focused modules over a single large file.
- Keep dependencies minimal and add a package only when there is a clear need.

## API Design
- Define explicit request and response schemas.
- Use appropriate HTTP status codes.
- Validate incoming data before processing it.
- Return consistent, understandable error responses.
- Do not expose stack traces, filesystem paths, secrets, or internal implementation details to clients.
- Keep API routes separate from business logic when the project grows.
- Add or maintain API documentation through FastAPI's built-in OpenAPI support.

## Error Handling and Logging
- Handle expected failures explicitly.
- Do not use broad exception handling unless there is a clear reason.
- Never silently ignore errors.
- Use Python's logging facilities instead of `print()` for application logging.
- Never log API keys, credentials, or unnecessarily sensitive page content.

## Security and Privacy
- Treat all client input and extracted website content as untrusted.
- Never hardcode secrets or commit `.env` files.
- Load sensitive configuration from environment variables.
- Configure CORS for the actual required origins; do not allow every origin by default in production.
- Apply sensible request-size limits and input validation.
- Do not fetch arbitrary URLs supplied by users without appropriate SSRF protections.
- Do not send page content to external AI services unless the feature explicitly requires it and the data flow is documented.

## AI and Machine Learning
- Keep AI provider integrations separate from API routes.
- Validate AI outputs before returning them to the extension.
- Handle timeouts, rate limits, malformed responses, and provider errors.
- Do not assume AI-generated output is correct or safe.
- Make it possible to test core business logic without calling an external AI service.
- Never claim that AI classification, summarization, toxicity detection, or text-to-speech is implemented if it is only planned.

## Code Quality
- Prefer clear, maintainable code over unnecessary abstractions.
- Avoid duplicated business logic.
- Keep configuration separate from application logic.
- Update dependencies deliberately and document significant additions.

## Testing
- Use pytest for backend tests.
- Use FastAPI's test client or HTTPX where appropriate.
- Test successful requests, invalid inputs, missing fields, and error cases.
- Mock external AI services in unit tests.
- Do not claim tests passed unless they were actually run.
