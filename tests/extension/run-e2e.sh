#!/usr/bin/env bash
# End-to-end regression run (ZF-18): the whole scenario preference → hiding →
# summary → playback in the real extension, with the real backend and a fake
# Gemini (no key, nothing leaves the machine). Prints PASS/FAIL per page and
# exits with 1 if any page failed.
#
# Usage from the repository root, with the backend dependencies installed
# (pip install -r backend/requirements-dev.txt), Node.js 22+ and Brave:
#   bash tests/extension/run-e2e.sh                 # default page set
#   bash tests/extension/run-e2e.sh <url> [<url>…]   # own pages
#   PYTHON=.venv/bin/python bash tests/extension/run-e2e.sh
#
# Ports: 8000 backend (the extension calls it), 8090 fake Gemini, 8765 fixtures.

set -euo pipefail

PYTHON="${PYTHON:-python3}"
FIXTURES="http://127.0.0.1:8765"
LOG_DIR="$(mktemp -d)"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

wait_for() {
  for _ in $(seq 1 50); do
    if curl -fsS "$1" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done
  echo "Server did not start: $1 (logs in $LOG_DIR)" >&2
  exit 2
}

for port in 8000 8090 8765; do
  if curl -s "http://127.0.0.1:$port" >/dev/null 2>&1; then
    echo "Port $port is in use; stop what runs there first." >&2
    exit 2
  fi
done

"$PYTHON" tests/extension/fake_gemini.py 8090 >"$LOG_DIR/fake-gemini.log" 2>&1 &
PIDS+=($!)
ZENFEED_AI_API_KEY=fake-key-for-e2e \
ZENFEED_SUMMARY_API_BASE=http://127.0.0.1:8090/v1beta \
  "$PYTHON" -m uvicorn app.main:app --app-dir backend --port 8000 >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=($!)
"$PYTHON" -m http.server 8765 --directory tests/extension/fixtures >"$LOG_DIR/fixtures.log" 2>&1 &
PIDS+=($!)

wait_for http://127.0.0.1:8000/health
wait_for http://127.0.0.1:8090/__fake/last
wait_for "$FIXTURES/hider.html"

if [ "$#" -gt 0 ]; then
  PAGES=("$@")
else
  # Fixtures for every edge state, the pilot pages whose terms allow automated
  # access (docs/testing/pilot/stranky.md; P04 currently renders no listing),
  # one long page and restricted pages.
  PAGES=(
    "$FIXTURES/hider.html"
    "$FIXTURES/hider-csp.html"
    "$FIXTURES/segmentation.html"
    "$FIXTURES/single-block.html"
    "$FIXTURES/mostly-war.html"
    "$FIXTURES/long-block.html"
    "$FIXTURES/html-title.html"
    "$FIXTURES/no-title.html"
    "$FIXTURES/empty.html"
    "$FIXTURES/editable.html"
    "https://ourworldindata.org/war-and-peace"
    "https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons"
    "https://www.nasa.gov/news/recently-published/"
    "https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905"
    "https://www.horydoly.cz/jidlo-a-piti/vejce-losos-i-mleko-kultivovane-potraviny-si-razi-cestu-na-pulty-obchodu.html"
    "https://cs.wikipedia.org/wiki/Glob%C3%A1ln%C3%AD_oteplov%C3%A1n%C3%AD"
    "chrome://version/"
    "https://chromewebstore.google.com/"
  )
fi

status=0
node tests/extension/popup-e2e.mjs --check \
  --backend=http://127.0.0.1:8000 --fake-gemini=http://127.0.0.1:8090 "${PAGES[@]}" || status=$?

# The backend log must not contain page text or the key (ZF-29).
if grep -q -E "fake-key-for-e2e|HIDE-WAR|harvest" "$LOG_DIR/backend.log"; then
  echo "FAIL backend log contains page text or the key ($LOG_DIR/backend.log)"
  status=1
else
  echo "PASS backend log contains neither page text nor the key"
fi
exit "$status"
