"""lexicon-2 cues on sentences written for these tests (not from the annotated sets)."""

import pytest

from app.schemas import ContentBlockInput
from app.services.classify import MODEL_VERSION, classify_block

ALL_ON = {
    "valka": True,
    "politicke_konflikty": True,
    "umrti": True,
    "katastrofy": True,
    "nasili": True,
    "toxicky": True,
}


def _classify(text: str) -> tuple[str, str]:
    result = classify_block(ContentBlockInput(id="zf-0", text=text, kind="article"), ALL_ON)
    return result.topic, result.recommended_action


def test_model_version() -> None:
    assert MODEL_VERSION == "lexicon-2"


@pytest.mark.parametrize(
    "text, topic",
    [
        # násilí
        ("A gunman opened fire in a shopping centre on Friday evening.", "nasili"),
        ("Two people were shot dead outside the station, police said.", "nasili"),
        ("The kidnappers released three hostages after a week.", "nasili"),
        ("He was charged with homicide after the fight.", "nasili"),
        ("Policie zadržela útočníka, který v noci ubodal muže.", "nasili"),
        ("Při střelbě v obchodním centru zemřeli dva lidé.", "nasili"),
        # zprávy o úmrtí
        ("The actor passed away at home at the age of 81.", "umrti"),
        ("The death toll from the bus crash rose to twelve.", "umrti"),
        ("Známý herec zemřel ve věku 81 let, pohřeb bude v pátek.", "umrti"),
        ("Při nehodě přišli o život tři lidé.", "umrti"),
        ("Child mortality fell in every region over the decade.", "umrti"),
        ("Kojenecká úmrtnost v zemi dál klesá.", "umrti"),
        # katastrofické scénáře
        ("A landslide buried several houses after heavy rain.", "katastrofy"),
        ("The typhoon forced thousands to leave the coast.", "katastrofy"),
        ("Region zasáhlo dlouhé sucho a hrozí hladomor.", "katastrofy"),
        ("Famine is spreading in the north after the harvest failed.", "katastrofy"),
        ("Lavina zasypala skupinu turistů.", "katastrofy"),
        # politické konflikty
        ("The government lost a no-confidence vote on Tuesday.", "politicke_konflikty"),
        ("The country expelled the ambassador after the row.", "politicke_konflikty"),
        ("Opozice vyvolala hlasování o nedůvěře vládě.", "politicke_konflikty"),
        # válka
        ("Investigators documented war crimes in the occupied territories.", "valka"),
        ("A drone strike hit the depot overnight.", "valka"),
        ("The belligerents agreed to exchange prisoners.", "valka"),
        ("Ruská vojska pokračují v okupaci a bombardování měst.", "valka"),
    ],
)
def test_new_cues_hide_when_selected(text: str, topic: str) -> None:
    assert _classify(text) == (topic, "hide")


@pytest.mark.parametrize(
    "text",
    [
        # figurative or ambiguous words must not hide
        "The trade war between the two economies lowered exports.",
        "Retailers are in a price war over winter jackets.",
        "Front line workers received a bonus this year.",
        "David Lynch's films are shown at the festival.",
        "He was rushed to hospital after a heart attack.",
        "Since the pandemic, more people work from home.",
        "Tým předvedl katastrofální výkon a prohrál.",
        "Na úřadě byla dlouhá fronta.",
        "Hráči zvolili ofenzivní styl hry.",
        "The film shooting starts in Prague next month.",
        "The opposition criticised the budget.",
        "Regulatory bodies published new rules.",
        "The two departments had a scheduling conflict.",
        "Farmers adapt to warmer summers and more frequent periods of drought.",
        "Článek popisuje, jak se mění teploty a co znamená sucho pro zemědělství.",
    ],
)
def test_ambiguous_words_do_not_hide(text: str) -> None:
    assert _classify(text)[1] != "hide", text


def test_one_weak_cue_is_review_not_hide() -> None:
    assert _classify("Soldiers marched in the parade on Sunday.") == ("valka", "review")
    assert _classify("Thousands joined the protest in the capital.") == ("politicke_konflikty", "review")


def test_figurative_war_does_not_count_towards_war() -> None:
    # Without the figurative phrase this would be two bare "war"s (hide).
    _topic, action = _classify("The trade war hurt farmers; the war of words went on.")
    assert action != "hide"


def test_weak_war_cue_does_not_take_over_a_strong_topic() -> None:
    # Deaths in a conflict are war deaths: war, as sure as the death cue.
    assert _classify("The death toll from the conflict rose to twelve.") == ("valka", "hide")
    only_deaths = classify_block(
        ContentBlockInput(id="zf-0", text="The death toll from the conflict rose to twelve.", kind="article"),
        {"umrti": True},
    )
    assert only_deaths.recommended_action == "show"
    # Other strong topics are not taken over by a weak war cue.
    assert _classify("Military police said a gunman shot dead two people.") == ("nasili", "hide")
    # A real war word keeps the war priority (docs/kategorie-mvp.md).
    assert _classify("The death toll from the airstrike rose to twelve.") == ("valka", "hide")
