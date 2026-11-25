#!/usr/bin/env bash
# Starts everything the final demo needs (ZF-23, docs/demo/scenar.md): the
# backend on 127.0.0.1:8000 (with .env, so with the Gemini key, when the file
# exists) and the demo page on http://127.0.0.1:8765/demo.html, which works
# without internet. Ctrl+C stops both. Does not start a fake Gemini: the demo
# never shows an invented summary as a real one.
#
# Usage from the repository root, virtual environment active:
#   bash tests/extension/run-demo.sh

set -euo pipefail

PYTHON="${PYTHON:-python3}"
PIDS=()

# ${array[@]+…} keeps empty arrays working under set -u in macOS's bash 3.2.
cleanup() {
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

for port in 8000 8765; do
  if curl -s "http://127.0.0.1:$port" >/dev/null 2>&1; then
    echo "Port $port is in use; stop what runs there first." >&2
    exit 2
  fi
done

ENV_ARGS=()
if [ -f .env ]; then
  ENV_ARGS=(--env-file .env)
fi
"$PYTHON" -m uvicorn app.main:app --app-dir backend --port 8000 ${ENV_ARGS[@]+"${ENV_ARGS[@]}"} &
PIDS+=($!)
"$PYTHON" -m http.server 8765 --bind 127.0.0.1 --directory tests/extension/fixtures >/dev/null 2>&1 &
PIDS+=($!)

for _ in $(seq 1 50); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8765/demo.html >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done
if ! curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "The backend did not start." >&2
  exit 1
fi

echo
echo "Backend:     http://127.0.0.1:8000/health  OK"
if [ -f .env ] && grep -q '^ZENFEED_AI_API_KEY=.\+' .env; then
  echo "Summary:     key found in .env (Gemini free tier)"
else
  echo "Summary:     NO KEY - the popup will say the summary is not available (fallback B in docs/demo/scenar.md)"
fi
echo "Demo page:   http://127.0.0.1:8765/demo.html  (works offline)"
echo "Stop:        Ctrl+C"
wait
