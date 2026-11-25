"""The demo page (ZF-23) must keep doing what the demo script promises.

tests/extension/fixtures/demo.html marks each block with data-demo-expect. If a
classifier change hides a neutral block or stops hiding a marked one, the
demo would fail in front of the audience; this test fails first.
"""

from html.parser import HTMLParser
from pathlib import Path

import pytest

from app.schemas import ContentBlockInput
from app.services.classify import classify_block

DEMO = Path(__file__).resolve().parents[2] / "tests" / "extension" / "fixtures" / "demo.html"
ALL_ON = {
    "valka": True, "politicke_konflikty": True, "umrti": True, "katastrofy": True, "nasili": True, "toxicky": True,
}


class _Blocks(HTMLParser):
    """Collects the text of every element with data-demo-expect (they do not nest)."""

    def __init__(self) -> None:
        super().__init__()
        self.blocks: list[tuple[str, str]] = []
        self._expect: str | None = None
        self._depth = 0
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self._expect is not None:
            self._depth += 1
            return
        expect = dict(attrs).get("data-demo-expect")
        if expect:
            self._expect, self._depth, self._text = expect, 1, []

    def handle_endtag(self, tag: str) -> None:
        if self._expect is None:
            return
        self._depth -= 1
        if self._depth == 0:
            self.blocks.append((self._expect, " ".join(" ".join(self._text).split())))
            self._expect = None

    def handle_data(self, data: str) -> None:
        if self._expect is not None:
            self._text.append(data)


def _blocks() -> list[tuple[str, str]]:
    parser = _Blocks()
    parser.feed(DEMO.read_text(encoding="utf-8"))
    return parser.blocks


def test_demo_has_every_topic_the_tone_and_neutral_blocks() -> None:
    expected = [expect for expect, _ in _blocks()]
    assert len(expected) == 12
    assert set(expected) == {"valka", "politicke_konflikty", "umrti", "katastrofy", "nasili", "toxicky", "show"}
    assert expected.count("show") == 6


@pytest.mark.parametrize("expect, text", _blocks())
def test_demo_block_with_every_preference_on(expect: str, text: str) -> None:
    result = classify_block(ContentBlockInput(id="zf-0", text=text, kind="article"), ALL_ON)
    if expect == "show":
        assert result.recommended_action == "show", text
    elif expect == "toxicky":
        assert (result.tone, result.recommended_action) == ("toxicky", "hide"), text
    else:
        assert (result.topic, result.recommended_action) == (expect, "hide"), text


@pytest.mark.parametrize("expect, text", [block for block in _blocks() if block[0] != "show"])
def test_demo_block_hides_only_with_its_own_preference(expect: str, text: str) -> None:
    # The demo turns preferences on one by one; each block must react only to its own.
    own = classify_block(ContentBlockInput(id="zf-0", text=text, kind="article"), {expect: True})
    assert own.recommended_action == "hide", text
    for other in ALL_ON:
        if other != expect:
            result = classify_block(ContentBlockInput(id="zf-0", text=text, kind="article"), {other: True})
            assert result.recommended_action != "hide", f"{other}: {text}"
