# Pilotní sada ZF-04: 6 stránek a referenční anotace

> **Stav: anotace potvrdila Libuše 4. 11. 2026 (jeden hodnotitel, bez změn oproti mému návrhu).** Hodnotiteli jsou Libuše a Claude (rozhodnutí 4. 11. 2026, další osoba nebude). Pilotní anotace vznikly tak, že je navrhl Claude a Libuše je potvrdila, takže nejsou dvěma nezávislými anotacemi; pro finální sadu (ZF-27, ZF-19) je potřeba, aby je Claude a Libuše vytvořili každý zvlášť, bez znalosti anotace toho druhého. Strukturu stránek jsem (Claude) přečetla v prohlížeči (P05 29. 10. 2026, ostatní 2. 11. 2026 po přepracování sady, viz níže). Téma, tón a rozhodnutí skrýt/ponechat jsou **můj návrh, ne ruční anotace hodnotitele**. Proposal (§5) vyžaduje ruční označení člověkem, proto je potřeba kontrola podle [`rucni-overeni.md`](rucni-overeni.md). Anotace jsou referenční data pro ZF-07, ne naměřený výsledek segmentace. Jediný naměřený výsledek ve složce je baseline slovníku v [`baseline-lexicon.md`](baseline-lexicon.md).

Issue: ZF-04 (milník M1, týden 1). Spotřebitelé: ZF-03 (extraktor), ZF-07 (vyhodnocení segmentace, go/no-go), později ZF-20 (metriky) a ZF-19 (24stránková sada).

## Obsah složky

| Soubor | K čemu |
|---|---|
| [`stranky.md`](stranky.md) | Karta každé pilotní stránky: URL, snapshot, selektory, prvky, které **nemají** být bloky, poznámky k reprodukci |
| [`anotace.csv`](anotace.csv) | Referenční anotace: 89 bloků, jeden řádek = jeden očekávaný blok (zdroj pravdy pro ZF-07) |
| [`baseline-lexicon.md`](baseline-lexicon.md) | Naměřená shoda `lexicon-1` s úryvky v `anotace.csv` a `anotace-rozsireni.csv` (4. 11. 2026) |
| [`sablona-mereni.csv`](sablona-mereni.csv), [`sablona-mereni.md`](sablona-mereni.md) | Šablona záznamu měření (předvyplněno 6 stránek × 4 nastavení, výsledky prázdné); stejná šablona pro 24 stránek v ZF-19 |
| [`anotace-nahrazene.csv`](anotace-nahrazene.csv) | Global Voices (8 bloků): ověřené podmínky, anotace hotová, ale mimo pilot (limit 6 stránek); kandidát pro ZF-19 |
| [`anotace-rozsireni.csv`](anotace-rozsireni.csv), [`rozsireni-zdroje.md`](rozsireni-zdroje.md) | Doplňkové příklady mimo 6 pilotních stránek (R01–R12, 143 bloků) pro vzácná témata a prověřené podmínky zdrojů; nejsou součástí pilotní měřené sady |
| [`anotace-vyrazene.csv`](anotace-vyrazene.csv) | Historie: 93 bloků z vyřazených zdrojů (root.cz, Hacker News, iROZHLAS, ČT24, lupa.cz, BBC), vyřazených, protože u nich nebylo možné ověřit podmínky použití; neslouží jako referenční data |
| [`kandidati-pro-zf-19.md`](kandidati-pro-zf-19.md) | Kandidátní stránky a domény pro větší sadu (neanotováno) |
| [`nastroje/profil-stranky.js`](nastroje/profil-stranky.js) | Skript pro konzoli prohlížeče, který jen čte strukturu stránky a vypíše JSON profil |
| [`rucni-overeni.md`](rucni-overeni.md) | Úkoly, které musí udělat člověk |

## Pilotní stránky

| ID | URL | Doména | Jazyk | Typ rozložení | Licence | Anotovaných bloků |
|---|---|---|---|---|---|---:|
| P01 | https://ourworldindata.org/war-and-peace | ourworldindata.org | EN | statický článek (tematická stránka o válce a míru, grafy v `svg`, skrytá sekce `display: none`) | CC BY | 6 |
| P02 | https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons | forum.effectivealtruism.org | EN | komentáře (24, vnoření do 3 úrovní) a tělo příspěvku | CC BY 4.0 (obsah uživatelů; výhrada v `stranky.md`) | 25 |
| P03 | https://www.nasa.gov/news/recently-published/ | nasa.gov | EN | feed s opakovanými kartami (25 karet; stránkování nahrazuje karty bez změny URL) | většinou bez autorských práv (USA) | 25 |
| P04 | https://ourworldindata.org/latest?type=data-insight | ourworldindata.org | EN | dynamicky načítaný obsah (tlačítko „Show more“ přidá dalších 20 položek bez změny URL) | CC BY | 20 |
| P05 | https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905 | en.wikipedia.org | EN | hluboce vnořené elementy (DOM hloubka až 43, `<dl>` až 17 úrovní) | CC BY-SA | 6 |
| P06 | https://www.horydoly.cz/jidlo-a-piti/vejce-losos-i-mleko-kultivovane-potraviny-si-razi-cestu-na-pulty-obchodu.html | horydoly.cz | CS | stránka s reklamními kontejnery (`banner_top`, `ins.adsbygoogle`, `sklikReklama`; část prázdná) | CC BY 3.0 CZ | 7 |

Pokrytí: 5 různých domén (Our World in Data je dvakrát), všech 6 případů z plánu (§2.2), ale jen **1× čeština a 5× angličtina**. Jazykový poměr je slabina této sady; viz otevřené body a [`kandidati-pro-zf-19.md`](kandidati-pro-zf-19.md).

## Přepracování sady (2. 11. 2026)

Původní pilot (root.cz, Hacker News, iROZHLAS, ČT24, lupa.cz) byl **vyřazen**, protože u těchto webů nebylo možné ověřit, že je lze pro projekt použít (podmínky se k ručnímu čtení ani strojové analýze nevyjadřují, zakazují sběr, nebo se nepodařilo najít). Nahradily je zdroje s otevřenou licencí. Wikipedie (P05) zůstala. Global Voices bylo ověřeno a anotováno, ale pro limit 6 stránek nahrazeno War and Peace (anotace v [`anotace-nahrazene.csv`](anotace-nahrazene.csv)). Důvody po jednotlivých zdrojích jsou ve [`stranky.md`](stranky.md) (sekce „Vyřazené stránky“), anotace vyřazených stránek v [`anotace-vyrazene.csv`](anotace-vyrazene.csv).

Vyřazená BBC (původně P06): https://www.bbc.com/news/articles/cmqxnl312v34o, vyřazena 29. 10. 2026, protože BBC Global Terms of Use (v1.0, 15. 4. 2026) zakazují skripty a automatizovaný sběr (§7) a vyžadují povolení pro strojovou analýzu (§8). Řádky jsou v `anotace-vyrazene.csv` s ID `P06-BBC-B001` atd.

Projekt je školní a nekomerční. Všechny nové zdroje se agentovi podařilo v prohlížeči otevřít a přečíst.

## Provizorní kategorie (ZF-24 zatím nezmrazeno)

V `docs/` žádný zmrazený seznam kategorií není (`mvp.md` §9, bod 4 ho vede jako otevřené rozhodnutí). Použil jsem příklady z proposalu (§4.1 #1) a **seznam je provizorní**:

- **Téma** (právě jedna hodnota na blok): `politické konflikty`, `válka`, `zprávy o úmrtí`, `katastrofické scénáře`, `násilí`, `jiné`. Téma `násilí` přidala Libuše 2. 11. 2026 (není v proposalu §4.1, rozhodnutí ZF-24).
- **Tón** (samostatné pole, nezávislé na tématu): hodnoty `neutrální` nebo `toxický/vyhrocený`. Negativní událost není automaticky vyhrocený tón (proposal §4.2).
- **Jistota** anotace: `J` jistá, `H` hraniční (hraniční případy je potřeba zkontrolovat ručně).

Kategorie `katastrofické scénáře` může znamenat skutečné katastrofy, nebo hypotetické katastrofické scénáře. Proposal to nerozlišuje, rozhodnutí patří do ZF-24. V pilotu je pro živý přenos ČT24 tahle nejasnost bez dopadu, protože nastavení S2 skrývá obě kategorie dohromady (`zprávy o úmrtí` i `katastrofické scénáře`).

## Příkladová nastavení preferencí

Skrytí se **odvozuje mechanicky** z tématu a tónu, takže anotátor rozhoduje jen o tématu a tónu:

| Nastavení | Skrýt téma | Skrýt tón |
|---|---|---|
| S1 | `válka`, `politické konflikty` | – |
| S2 | `zprávy o úmrtí`, `katastrofické scénáře` | – |
| S3 | – | `vyhrocený / toxický` |
| S4 | `násilí` | – |

Blok se skryje v S1, S2 a S4, pokud jeho téma patří do vybraných; v S3, pokud má `tón = toxický/vyhrocený`. V `anotace.csv` je výsledek ve sloupcích `S1_…`, `S2_…`, `S3_…`, `S4_…` (`H` = má být skryto, `K` = má zůstat viditelné).

Očekávaný počet skrytých bloků (z celkového počtu bloků stránky):

| Stránka | bloků | S1 | S2 | S3 | S4 |
|---|---:|---:|---:|---:|---:|
| P01 | 6 | 5 | 0 | 0 | 0 |
| P02 | 25 | 0 | 0 | 0 | 0 |
| P03 | 25 | 0 | 0 | 0 | 0 |
| P04 | 20 | 0 | 3 | 0 | 0 |
| P05 | 6 | 3 | 0 | 0 | 0 |
| P06 | 7 | 0 | 0 | 0 | 0 |

**Slabina sady:** jen P01 (5 bloků v S1), P04 (3 bloky v S2) a P05 (3 bloky v S1) mají co skrývat v příkladových nastaveních (11 bloků z 89). Nastavení S3 (tón) a S4 (`násilí`) nemají v pilotu žádný pozitivní blok (po přepsání P05-B004 na neutrální; tón je otestován v R06–R08), zůstává připravené pro ZF-19. P02, P03 a P06 jsou „negativní kontroly“: měří falešná skrytí a správné oddělení bloků (včetně reklam u P06 a opakovaných karet u P03), ale ne recall. U případů s nulou skrytých bloků nejsou precision a recall definované (dělení nulou); vyhodnocuje se jen počet neoprávněných skrytí. Chceme-li měřit i recall, je potřeba vyměnit některý článek za zdroj s válečným nebo konfliktním obsahem (stejné licence, například Global Voices, jehož anotovaný článek je v `anotace-nahrazene.csv`) nebo přidat jiná nastavení.

## Pravidla anotace (pracovní, k potvrzení v ZF-27)

1. **Blok** = typ `section` (sekce nebo tělo článku), `listing article` (karta nebo položka výpisu), `comment` (komentář). Tři typy z proposalu §4.1 #2.
2. **Granularita**: anotuje se nejvyšší smysluplná úroveň (u Wikipedie `<section>` úrovně h2, ne vnořené h3). Jemnější úroveň zůstává otevřená (viz níže).
3. **Locator** je selektor nebo stabilní ID (id položky, číslo článku v URL, `oldid` revize). Pořadí na stránce se jako locator nepoužívá, protože u feedů se mění.
4. **Úryvek** má sloužit jen k identifikaci bloku (do ~75 znaků), plné texty se neukládají.
5. **Prvky, které nemají být bloky** (navigace, reklamy, formuláře, cookie lišta) jsou v [`stranky.md`](stranky.md) u každé stránky. Odpovídají ZF-03 („vyloučit navigaci, formuláře, skripty, interaktivní prvky“).
6. **Snapshot**: výpisy a živé přenosy (P03, P04) se mění. Reprodukovatelnost zajišťují stabilní ID a čas snapshotu, ne celý obsah stránky.

## Otevřené body

Jsou na konci [`rucni-overeni.md`](rucni-overeni.md), aby byly spolu s úkoly pro člověka.

## Co tento adresář neobsahuje

Žádné naměřené hodnoty, žádné prahy navíc (platí jen ≥ 80 % / −20 % / 100 % z proposalu §5), žádné uložené celé stránky, přihlašovací údaje ani osobní údaje. U EA Forum a Wikipedie nejsou uložena uživatelská jména.
