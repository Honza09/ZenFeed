# ZenFeed Roadmap

> **Note (Oct 2026):** This roadmap is outdated. It treats summarization, toxicity detection and text-to-speech as optional later phases and does not mention block hiding. In the MVP these are required features; the valid plan is the 4-week plan in [`mvp.md`](mvp.md) §6 and `zenfeed_implementacni_plan.md`.

This roadmap describes the proposed development sequence. Update task statuses to reflect actual progress.

## Phase 1 — Project Foundation

- [ ] Establish the repository structure.
- [ ] Create a basic Manifest V3 extension.
- [ ] Build a simple popup.
- [ ] Display the current page title.
- [ ] Extract and display the main page text.
- [ ] Test at least three regular web pages.

**Deliverable:** A working extension foundation without AI dependencies.

## Phase 2 — Backend

- [ ] Set up the FastAPI application.
- [ ] Define Pydantic schemas.
- [ ] Add a health endpoint.
- [ ] Implement input validation and consistent errors.
- [ ] Add automated tests.
- [ ] Verify communication between the extension and backend.

**Deliverable:** A basic backend with verified communication.

## Phase 3 — Content Processing

- [ ] Select and implement the first text-processing feature.
- [ ] Define its input and output contract.
- [ ] Handle failures and input length limits.
- [ ] Add loading, success, and error states to the UI.
- [ ] Test normal and edge cases.

**Deliverable:** The first complete feature, from the UI to backend processing.

## Phase 4 — Advanced Features

- [ ] Evaluate the value of text summarization.
- [ ] Evaluate content classification.
- [ ] Consider toxicity detection.
- [ ] Consider text-to-speech.
- [ ] Measure feature quality and latency.
- [ ] Document AI integration costs, privacy implications, and limitations.

**Deliverable:** Additional features selected based on testing and team priorities.

## Planning Principles

- Assign an owner and clear acceptance criteria to every task.
- Prefer small, testable vertical slices of functionality.
- Verify foundational work before adding complexity.
- Update task statuses based on actual progress, not assumptions.
