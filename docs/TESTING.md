# Testing Strategy

> **Note (Nov 2026):** This is the generic testing strategy. The MVP evaluation methodology (ZF-27) is frozen; see [MVP evaluation methodology (ZF-27)](#mvp-evaluation-methodology-zf-27) at the end of this file and [`testing/metodika-hodnoceni.md`](testing/metodika-hodnoceni.md).

## Goals

Testing should verify that ZenFeed:
- Extracts relevant page content.
- Displays extracted text safely.
- Communicates with the backend correctly.
- Handles error conditions.
- Does not transmit data that a feature does not need.

## Extension Testing

Perform manual tests in Chrome:
- Load the extension from `extension/`.
- Open and close the popup.
- Extract the page title and main text.
- Test a page with long content.
- Test a page without a clear main text section.
- Test empty or unusual content.
- Test restricted pages, such as `chrome://` pages.
- Navigate to another page and run the feature again.

Test at least three different regular web pages.

Regression checklist for milestone M2 (ZF-13): [`testing/checklist-m2.md`](testing/checklist-m2.md); bug log: [`testing/evidence-chyb.md`](testing/evidence-chyb.md).

## Backend Testing

Use pytest and, where appropriate, HTTPX or FastAPI's test client.

Cover:
- Successful requests.
- Invalid input and missing fields.
- Empty input.
- Excessively long text.
- Unexpected failures.
- External service outages and timeouts.

Mock external AI services in unit tests whenever practical.

## Security Testing

- Verify that HTML-like text is rendered safely.
- Verify input validation.
- Check that logs do not contain secrets.
- Verify that the extension requests only necessary permissions.

## Testing Rules

- Run tests before marking a task complete.
- Never claim a test passed unless it was actually run.
- Document tests that could not be executed.
- Add regression tests for bug fixes when practical.

## MVP evaluation methodology (ZF-27)

Status: frozen on 7 Nov 2026 by the team (per Libuše; chat record not seen). Full text (Czech): [`testing/metodika-hodnoceni.md`](testing/metodika-hodnoceni.md).

- Product thresholds from the proposal (§5): preference respect ≥ 80 %, median time reduction ≥ 20 %, restore 100 %. Other numbers (90 % precision, 3 s / 10 s) are plan assumptions.
- Evaluable case = page × setting; all cases are counted, reported in two groups ("with a hide target" / "without target"). Pilot: 3 of 24 cases have a target.
- Preference respect: share of cases with no wrongly hidden and no missed block; block-level accuracy is secondary. "Preferred area" = topic + tone per block, the area derived per setting.
- Raters (ZF-19): Libuše and Jakub annotate the final set blind and separately (team decision, 7 Nov); agreement as % and Cohen's κ per field (topic, tone, hide decision per setting), target κ ≥ 0.70 (team's proposal, not a proposal requirement). The classifier author does not annotate.
- Language: 12 CS : 12 EN pages; per-language results with 95 % Wilson intervals (informational only).
- Split: by page, stratified by type and language, fixed before results; same domain not in both parts; final part evaluated once; pilot is tuning only.
- Time and latency: procedure in the Czech document (≥ 3 latency measurements per page).
- Open items: see the checklist of the Czech document.
