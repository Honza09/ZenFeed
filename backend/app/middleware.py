"""Reject request bodies above a fixed byte limit."""

from __future__ import annotations

_TOO_LARGE = b'{"error":"request_too_large"}'
_PASS_THROUGH_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


class LimitBodySize:
    def __init__(self, app, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http" or scope["method"] in _PASS_THROUGH_METHODS:
            await self.app(scope, receive, send)
            return

        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            if message["type"] != "http.request":
                continue
            body.extend(message.get("body", b""))
            if len(body) > self.max_bytes:
                await _send_too_large(send)
                return
            if not message.get("more_body", False):
                break

        payload = bytes(body)
        sent = False

        async def replay():
            nonlocal sent
            if sent:
                return {"type": "http.disconnect"}
            sent = True
            return {"type": "http.request", "body": payload, "more_body": False}

        await self.app(scope, replay, send)


async def _send_too_large(send) -> None:
    await send(
        {
            "type": "http.response.start",
            "status": 413,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(_TOO_LARGE)).encode()),
            ],
        }
    )
    await send({"type": "http.response.body", "body": _TOO_LARGE})
