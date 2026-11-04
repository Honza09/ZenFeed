# Kategorie témat a tónu v MVP (ZF-24)

> **ZMRAZENO rozhodnutím Libuše, 4. 11. 2026.** Seznam kategorií a body A až E potvrdila Libuše jako jediná zodpovědná za související úkoly; ostatní členové týmu se k nim zatím nevyjadřovali. Hodnotiteli jsou Libuše a Claude (další osoba nebude). Pilotní anotace (89 bloků) navrhl Claude a Libuše je 4. 11. 2026 potvrdila beze změn, nejsou tedy nezávislé; pro finální sadu mají obě anotovat zvlášť. Žádný rozpor v části 5 nezůstal otevřený (P05-B004 přepsáno na neutrální). Rozhodnutí D Libuše upřesnila 4. 11. 2026 (viz tabulka rozhodnutí). Dokument vychází z proposalu §4.1 #1, §4.2, §4.4 a z `docs/mvp.md` F2. Co v proposalu není (nová témata, škály), je označeno **návrh**.

## 1. Témata (právě jedno na blok, viz rozhodnutí C)

Anotátor určuje téma podle toho, **o čem blok primárně je**, ne podle jednotlivých slov. Co nepatří do žádného tématu, je `jiné`.

| ID | Název (CS / EN pro UI) | Definice | Patří sem | Nepatří sem | Příklad v pilotu |
|---|---|---|---|---|---|
| `valka` | válka / War | Ozbrojený konflikt mezi státy nebo organizovanými ozbrojenými skupinami a jeho důsledky | boje, útoky, oběti bojů, uprchlíci, dodávky zbraní, příměří | politický spor bez bojů; teror mimo válku | P01-B001, P05-B003 |
| `politicke_konflikty` | politické konflikty / Political conflicts | Spor politických aktérů bez ozbrojených bojů | volební spory, koaliční krize, sankce, diplomatické roztržky | boje (→ válka); spor o text na Wikipedii; pokojné shromáždění bez sporu aktérů (R04-B016 → jiné) | v pilotu žádný, hraniční P05-B005 |
| `umrti` | zprávy o úmrtí / Death news | Zpráva o úmrtí osoby či osob **nebo statistika či trend úmrtnosti** | oznámení úmrtí, nekrolog, nehoda s oběťmi (dopravní nehoda, požár, letecká nehoda), úmrtí osobnosti, statistiky a trendy úmrtí | úmrtí způsobená válkou (→ válka); úmrtí při velké přírodní či technologické katastrofě (→ katastrofy) | P04-B006, P04-B012, R05, R01-B003, R04-B007, R04-B008 |
| `katastrofy` | katastrofické scénáře / Catastrophic scenarios | Rozsáhlá katastrofa (přírodní, technologická) **nebo** varování před katastrofickým scénářem | zemětřesení, záplavy, havárie, předpovědi kolapsu | plánované a řízené události (např. P03-B004 zánik družice); pomalé trendy bez varování | v pilotu žádný, hraniční P04-B011 |
| `nasili` | násilí / Violence (**návrh**, není v proposalu) | Úmyslné fyzické násilí **mimo** ozbrojený konflikt | vražda, útok, teroristický čin mimo válku, nepokoje a rabování, sexuální zneužívání (i zpráva o odškodnění obětí, R04-B011) | boje (→ válka); odborný popis fyzikálního děje, např. P03-B025 | v pilotu žádný |
| `jine` | jiné / Other | Nic z předchozího, včetně pomocných bloků (citace, administrativní upozornění) | P03-B001, P01-B006 | – | – |

**Priorita, když sedí víc témat** (příčina před následkem): `valka` > `nasili` > `katastrofy` > `umrti` > `politicke_konflikty`. Příklad: statistika obětí válek je `valka` (P01-B001). Do `jine` se nejde, dokud sedí některé téma.

## 2. Tón „toxický/vyhrocený“ (EN: Toxic or heated tone) (samostatné pole: `neutrální` / `toxický/vyhrocený`)

Tón se posuzuje **podle vlastní formulace bloku**, nezávisle na tématu. Zpráva o válce nebo úmrtí v neutrálních slovech tón **není** (proposal §4.2). Tón = `toxický/vyhrocený`, pokud je splněno aspoň jedno:

| Kód | Kritérium (ověřitelné v textu) |
|---|---|
| T1 | urážky, dehumanizace skupin nebo osob, výzvy k násilí (toxický tón) |
| T2 | senzační nebo alarmistické podání: VELKÁ PÍSMENA, řetězce vykřičníků, clickbaitové superlativy, emocionálně nabité přívlastky, které věcně nic neříkají (vyhrocený tón) |
| T3 | osobní útok v diskuzi místo věcného argumentu |

**Není tón:** negativní událost popsaná věcně; odborné slovo se silným významem (P03-B025 „Violent“ u magnetického děje, P03-B014 „eerie“); podrážděnost bez urážek (P02-B022); věcná kritika; citát vyhrocených slov v neutrálním zpravodajství. „Vyhrocený“ a „toxický“ **neoddělujeme** do dvou polí (návrh): jde o jedno uživatelské nastavení a dvouhodnotové pole je pro dva hodnotitele nejlépe testovatelné; podtyp lze volitelně napsat do poznámky.

## 3. Pravidla schématu

- **Jistota** (`J` / `H`) je hodnocení anotátora, ne jistota klasifikátoru. Klasifikátor vrací kategorii, jistotu a `show` / `hide` / `review`; **nejistota nikdy neskrývá** (ZF-06, `mvp.md` F2). Hraničním případům (`H`) rozhodne druhý hodnotitel.
- **Skrytí se odvozuje mechanicky:** blok se skryje, pokud jeho téma patří do uživatelem zvolených, nebo pokud je zvolen tón a blok má `toxický/vyhrocený`.
- **Popup (návrh):** každé téma má vlastní přepínač a tón jeden; **bez svazků**. Příklady S1–S4 v pilotu (např. válka + politické konflikty společně) jsou jen testovací nastavení, ne produktové rozhodnutí.

## 4. Rozhodovací body

Doporučení jsou **jen doporučení**. „Dopad“ = anotace / klasifikátor (ZF-06, ZF-14) / popup (ZF-11) / měření (ZF-19, ZF-20).

| Bod | Varianty | Dopad | Doporučení | Rozhodnutí týmu |
|---|---|---|---|---|
| **A** `nasili` | 1) samostatné téma; 2) součást `valka` a `politicke_konflikty`; 3) vynechat | 1: pátý přepínač, v pilotu 0 příkladů; 2: zločin zůstane v `jine` a nejde skrýt; 3: totéž | 1) **s podmínkou**: před zmrazením doanotovat příklady (bez nich nelze definici otestovat) | **1) samostatné téma `nasili`**; podmínka: před zmrazením doanotovat příklady (Libuše, 4. 11. 2026, potvrzeno) |
| **B** `katastrofy` | 1) jen skutečné; 2) jen hypotetické scénáře; 3) obojí | 1/2: jasná hranice, ale oba typy zatěžují čtenáře; 3: širší, hranice vůči `jine` je nejasnější | 3) obojí, s pravidlem „dlouhodobý trend bez varování = jiné“ | **3) obojí** (skutečné katastrofy i hypotetické scénáře) (Libuše, 4. 11. 2026, potvrzeno) |
| **C** témat na blok | 1) jedno hlavní; 2) víc (množina) | 1: jednoduchá shoda, ale sekundární téma se neskryje; 2: lepší recall, složitější shoda a metriky | 1) jedno hlavní + priorita; proposal §4.4 uvádí výstup `{block_id, topic, hide}` (jedno téma) | **1) jedno hlavní téma na blok** s prioritou (Libuše, 4. 11. 2026, potvrzeno) |
| **D** statistiky o úmrtích | A) `umrti` jen konkrétní úmrtí, statistiky → jiné téma; B) každý text o úmrtích; C) podle emočního zatížení | A: nejlépe testovatelné; B: P04-B006, B012 zůstávají; C: nedá se dobře anotovat | A) (viz zdůvodnění „zprávy“ v názvu) | **Upraveno 4. 11. 2026:** `umrti` zahrnuje veškeré zprávy o smrti i statistiky a trendy úmrtnosti (dříve varianta A; blíží se variantě B). Přednost má `valka` (statistika obětí válek zůstává válka, P01-B001). Nehody s oběťmi (R01-B003, R04-B007, R04-B008) jsou `umrti` (Libuše, 4. 11. 2026) |
| **E** velikost seznamu | 4 témata (proposal) / 5 s `nasili` / víc | víc témat = víc příkladů ke každému a nižší shoda | 4–5 témat; výrazně víc by se v 24 stránkách nedalo otestovat | **5 témat včetně `nasili`** (Libuše, 4. 11. 2026, potvrzeno) |

**Celkově: seznam zmrazila Libuše dne 4. 11. 2026** (ostatní členové týmu nebyli o rozhodnutí zatím informováni, protože související úkoly zpracovávala sama).

## 5. Kontrola proti pilotu (89 bloků)

Počty podle `anotace.csv` (skript níže): `valka` 8, `zprávy o úmrtí` 3, `politické konflikty` 0, `katastrofické scénáře` 0, `násilí` 0, `jiné` 78; tón `toxický/vyhrocený` 0, `neutrální` 89 (P05-B004 Libuše 4. 11. 2026 přepsala na neutrální); jistota `H` 13. **Pilot má příliš málo příkladů** pro `politické konflikty`, `katastrofické scénáře`, `násilí` (nula) a `zprávy o úmrtí` (tři hraniční); tón je téměř netestovaný (jeden blok).

**Rozšíření příkladů (návrh):** `docs/testing/pilot/anotace-rozsireni.csv` obsahuje 143 bloků mimo 6 pilotních stránek (R01 až R07 a R09 až R11: stránky Wikipedie a Global Voices, R08: vzorek komentářů z talk stránek Wikipedie, R12: výběr položek z denních stránek o katastrofách). Počty (po úpravách 4. 11. 2026): válka 16, politické konflikty 17, katastrofické scénáře 21, zprávy o úmrtí 21, násilí 13, jiné 55 (jistota `J` 93, `H` 50). Čisté příklady `zprávy o úmrtí` (R05 a nehody) a `násilí` už existují; `katastrofické scénáře` měly po úpravě jen 3 bloky, R09 až R12 jich přidaly 17 (z toho 5 hraničních, viz sloupec `jistota`). Tón `toxický/vyhrocený` má 14 bloků, z toho 10 jistých (R08, komentáře s urážkami); R06 a R07 jsou hraniční.

Aplikace návrhu na řádky: **0 nesouhlasí, 3 jsou nejasné** (P05-B005 a P05-B006 rozhodla Libuše po porovnání s nezávislým agentem 4. 11. 2026) (P04-B006, P04-B012 a P05-B004 se vyřešily rozhodnutím Libuše 4. 11. 2026); ostatní řádky souhlasí. Posouzeno jen podle sloupců téma, tón, úryvek a poznámka, stránky nebyly otevřeny.

| Blok | Stav | Nyní | Podle návrhu | Důvod |
|---|---|---|---|---|
| P04-B006 | souhlas | zprávy o úmrtí | zprávy o úmrtí | statistika úmrtí patří do `umrti` po úpravě rozhodnutí D (4. 11. 2026) |
| P04-B012 | souhlas | zprávy o úmrtí | zprávy o úmrtí | trend úmrtnosti patří do `umrti` po úpravě rozhodnutí D (4. 11. 2026) |
| P05-B004 | vyřešeno (řádek změněn) | tón = toxický/vyhrocený | tón = neutrální | podle poznámky jde o odmítavý, ne urážlivý nebo senzační tón; kritéria T1–T3 nesplněna (neověřeno v textu) |
| P05-B005 | vyřešeno (ponecháno) | válka | válka / politické konflikty / jiné | redakční spor o formulaci o Krymu, ne zpráva o válce samotné |
| P05-B002 | nejasné | jiné | jiné / válka | popisky fotografií k článku o válce; téma jen nepřímo |
| P05-B006 | vyřešeno (změněno na jiné) | válka, tón neutrální | válka, tón neutrální / toxický/vyhrocený | nadpis obviňuje z propagandy; hranice mezi obviněním a vyhrocením (T2) |
| P01-B003 | nejasné | válka | válka / jiné | seznam odkazů na články o konfliktech, bez vlastního obsahu |
| P04-B011 | nejasné | jiné | jiné / katastrofické scénáře | dlouhodobý pokles populací zvířat, závisí na rozhodnutí ii |

Rozpor D Libuše vyřešila 4. 11. 2026 úpravou rozhodnutí D (statistiky úmrtí patří do `zprávy o úmrtí`), takže P04-B006 a P04-B012 zůstávají beze změny. Tón u P05-B004 Libuše 4. 11. 2026 přepsala na `neutrální`; žádné rozpory nezbývají. Návrhy změny anotace jsou jen pro lidské rozhodnutí; soubory pilotu jsem neupravoval.

## 6. Co ještě zbývá

- [x] rozhodnutí A až E potvrdila Libuše 4. 11. 2026
- [x] anotace pilotu potvrdila Libuše 4. 11. 2026 (bez změn)
- [x] příklady pro vzácná témata a čisté `nasili` a `umrti` (R01 až R05); další příklady `katastrofické scénáře` v R09 až R12
- [x] jasné příklady tónu `toxický/vyhrocený` (R08)
- [x] české a anglické názvy kategorií pro popup: české jsou překládány 1:1, tón se jmenuje „toxický/vyhrocený tón / Toxic or heated tone“ a „neutrální / Neutral“ (potvrdí ZF-11)
- [x] **rozpor D:** vyřešen 4. 11. 2026 úpravou rozhodnutí D, `zprávy o úmrtí` zahrnují i statistiky; P04-B006 a P04-B012 zůstávají
- [x] P05-B004: Libuše 4. 11. 2026 přepsala tón na `neutrální`, kritéria T1–T3 zůstávají
- [x] hraniční anotace R01 až R08 prošla Libuše 4. 11. 2026 a šest bloků změnila (R01-B003, R04-B007, R04-B008, R04-B011, R04-B016, R04-B017); ostatní potvrdila
- [x] anotace Libuše (`docs/testing/pilot/anotace-libuse.csv`, 232 bloků) vznikla 4. 11. 2026 nad podkladem se štítky Clauda a agenta, **není tedy nezávislá**. Jediné nezávislé číslo je Claude × agent: shoda tématu 98,3 % (κ 0,97), tónu 98,3 % (κ 0,83). Podrobně v [`testing/pilot/shoda-hodnotitelu.md`](testing/pilot/shoda-hodnotitelu.md).
- [ ] skutečně nezávislá shoda hodnotitelů pro finální sadu (ZF-19, ZF-27): každý anotuje zvlášť, bez pohledu na štítky ostatních
- [ ] informovat ostatní členy týmu o rozhodnutí a v `docs/backlog/08-zf-24.md` odškrtnout hotové body

## Co jsem nemohl ověřit

Shodu hodnotitelů (jeden anotátor), běh klasifikátoru, definice na stránkách mimo 6 pilotních a text bloků (jen úryvky). Externí zdroje (definice toxicity apod.) jsem nepoužil.
