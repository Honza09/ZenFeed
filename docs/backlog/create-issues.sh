#!/usr/bin/env bash
# Vytvoří GitHub Issues ze souborů NN-*.md v této složce.
# Výchozí režim je DRY-RUN. Ostré vytvoření: bash create-issues.sh --apply
# Přeskočí issue, jejíž název už v repozitáři existuje (otevřené i zavřené).
set -euo pipefail
REPO="Honza09/ZenFeed"
APPLY=0; [[ "${1:-}" == "--apply" ]] && APPLY=1
cd "$(dirname "$0")"

gh auth status >/dev/null
titles=$(gh issue list --repo "$REPO" --state all --limit 1000 --json title --jq '.[].title')
if [[ $APPLY -eq 1 ]]; then
  milestones=$(gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title')
fi

for f in [0-9][0-9]-*.md; do
  title=$(sed -n 's/^title: //p' "$f" | head -1)
  labels=$(sed -n 's/^labels: //p' "$f" | head -1)
  milestone=$(sed -n 's/^milestone: //p' "$f" | head -1)
  body=$(awk 'c>=2{print} /^---$/{c++}' "$f")
  if grep -qxF "$title" <<<"$titles"; then echo "[SKIP existuje] $title"; continue; fi
  if [[ $APPLY -eq 0 ]]; then
    echo "[DRY-RUN] $title  |  $labels  |  $milestone"; continue
  fi
  if ! grep -qxF "$milestone" <<<"$milestones"; then
    gh api "repos/$REPO/milestones" -f title="$milestone" >/dev/null
    milestones+=$'\n'"$milestone"
  fi
  args=()
  IFS=',' read -ra L <<<"$labels"
  for l in "${L[@]}"; do
    gh label create "$l" --repo "$REPO" >/dev/null 2>&1 || true
    args+=(--label "$l")
  done
  gh issue create --repo "$REPO" --title "$title" --body "$body" --milestone "$milestone" "${args[@]}"
done
