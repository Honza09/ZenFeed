"""Fake Gemini API for end-to-end tests of /v1/summarize (ZF-15). NOT a model.

Answers ``POST /v1beta/models/<model>:generateContent`` in Gemini's response
shape. Its "summary" is the first sentence of the first page block, marked as
fake. It records the last request so a test can check what would have been
sent to Google: the page blocks, the system instruction and that the key
arrived in the header. Nothing leaves the machine and no real key is needed.

Run (standard library only), then start the real backend against it:

    python3 tests/extension/fake_gemini.py 8090
    ZENFEED_AI_API_KEY=fake-key ZENFEED_SUMMARY_API_BASE=http://127.0.0.1:8090/v1beta \\
        uvicorn app.main:app --app-dir backend --port 8000

``POST /__fake/mode`` with ``{"mode": ...}`` switches the answer: ``ok``
(default), ``insufficient``, ``no_relevant``, ``rate_limited`` (429),
``unavailable`` (500), ``timeout`` (504), ``blocked`` (safety block, no
content). ``GET /__fake/last`` returns the last request; a mode change clears it.
"""

from __future__ import annotations

import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

STATE: dict = {"mode": "ok", "last": None}
MODES = {"ok", "insufficient", "no_relevant", "rate_limited", "unavailable", "timeout", "blocked"}
ERRORS = {"rate_limited": 429, "unavailable": 500, "timeout": 504}


def _answer(summary: str, insufficient: bool = False, irrelevant: bool = False) -> dict:
    text = json.dumps(
        {"summary": summary, "insufficient_input": insufficient, "no_relevant_content": irrelevant},
        ensure_ascii=False,
    )
    return {"candidates": [{"content": {"parts": [{"text": text}]}, "finishReason": "STOP"}]}


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self) -> None:
        if self.path == "/__fake/last":
            self._send(200, {"last": STATE["last"]})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path == "/__fake/mode":
            mode = self._body().get("mode")
            if mode not in MODES:
                self._send(400, {"error": "unknown mode"})
                return
            STATE["mode"] = mode
            STATE["last"] = None
            self._send(200, {"mode": mode})
            return
        if not re.fullmatch(r"/v1beta/models/[A-Za-z0-9._-]+:generateContent", self.path):
            self._send(404, {"error": {"status": "NOT_FOUND"}})
            return
        body = self._body()
        blocks = json.loads(body["contents"][0]["parts"][0]["text"])
        STATE["last"] = {
            "path": self.path,
            "key_in_header": bool(self.headers.get("x-goog-api-key")),
            "system": body["systemInstruction"]["parts"][0]["text"],
            "blocks": blocks,
        }
        mode = STATE["mode"]
        if mode in ERRORS:
            self._send(ERRORS[mode], {"error": {"status": mode.upper()}})
        elif mode == "blocked":
            self._send(200, {"promptFeedback": {"blockReason": "SAFETY"}})
        elif mode == "insufficient":
            self._send(200, _answer("", insufficient=True))
        elif mode == "no_relevant":
            self._send(200, _answer("", irrelevant=True))
        else:
            first = blocks[0]["text"] if blocks else ""
            sentence = re.match(r"(.+?[.!?])(\s|$)", first)
            self._send(200, _answer("[fake gemini] " + (sentence.group(1) if sentence else first)[:200]))

    def log_message(self, *args: object) -> None:
        # Quiet: requests contain page text.
        return


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
