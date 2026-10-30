# Contributing to ZenFeed

Short working agreement for the 4-person team. The product scope is defined by [`docs/mvp.md`](docs/mvp.md); tasks are in [`docs/backlog/`](docs/backlog/README.md). Technical rules for code live in `.claude/rules/`.

## Workflow

1. Pick an issue (`ZF-xx`) from the board and move it to **In Progress**.
2. Branch from an up-to-date `main`. Name the branch after the issue (`issue-ZF-01`) or descriptively with a prefix: `feature/`, `fix/`, `docs/`, `chore/` (for example `feature/page-extraction`).
3. Keep the change small and limited to the issue.
4. Run the checks from [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) locally.
5. Open a pull request using the template, link the issue, move it to **Review**.
6. Another team member reviews it. Nobody approves or merges their own pull request.
7. After the merge, the issue goes through **Testing** to **Done**.

Never work directly on `main`. Never force-push shared branches.

## Commits

Short, descriptive messages with a conventional prefix:

| Prefix | Use |
|---|---|
| `feat:` | new feature |
| `fix:` | bug fix |
| `docs:` | documentation |
| `test:` | tests |
| `refactor:` | restructuring without behavior change |
| `chore:` | maintenance, CI, tooling |

Never commit API keys, tokens, passwords or `.env` files.

## Board columns

Backlog → Ready → In Progress → Review → Testing → Done

## Labels and milestones

Labels used by the backlog: `mvp`, `extension`, `backend`, `ai`, `tts`, `testing`, `docs`, `ux`, `privacy`, `infra`, `decision`, `bug`, `integration`, `api`.

Milestones: `MVP – Týden 1`, `MVP – Týden 2`, `MVP – Týden 3`, `MVP – Týden 4`.

## Definition of Done

An issue is done when:

- [ ] the acceptance criteria in the issue are met,
- [ ] relevant tests were added or updated and actually run (results are in the pull request),
- [ ] the pull request was reviewed and approved by someone other than the author,
- [ ] CI is green,
- [ ] documentation is updated where behavior or setup changed,
- [ ] no secrets or `.env` files are committed.

## Repository owner setup

These settings need admin rights and are not done by the repository files. The repository owner configures them in GitHub:

- [ ] Protect `main`: require a pull request, at least 1 approval, dismiss stale approvals, block force-pushes.
- [ ] Require the CI checks `Backend (ruff + pytest)` and `Extension (manifest + JS syntax)` before merging (they appear in the list after the first CI run).
- [ ] Create the project board with the columns above and connect it to the issues.
- [ ] Create the labels and milestones above (`docs/backlog/create-issues.sh --apply` creates the ones it needs).
