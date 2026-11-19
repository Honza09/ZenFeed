# Slovník lexicon-2: víc vodítek pro citlivá témata

`lexicon-1` (ZF-06, baseline v [`baseline-lexicon.md`](baseline-lexicon.md)) skrýval málo: u citlivých témat trefil na rozšířené sadě 24 z 88 bloků a násilí nepoznal ani jednou (0 z 13). Průběžné shrnutí to uvádí jako hlavní riziko pro cíl 80 % respektování preferencí. `lexicon-2` přidává vodítka pro všech pět témat a hlídá, aby nová slova nevedla k falešnému skrytí. Úkol patří k ZF-06/ZF-14 (navržený vlastník Daniel); udělal ho Claude na Jakubovu žádost.

## Jak se ladilo, aby se nezkreslilo finální měření

Metodika ZF-27 (§f) říká, že pilot je ladicí část a finální sada (ZF-19) se k ladění používat nesmí. Rozšířená sada R01–R12 „může jít do ZF-19“ (`rozsireni-zdroje.md`), proto se na ní neladilo:

1. Nová vodítka jsem napsal z obecné znalosti jazyka (běžné tvary, české pády, ustálené výrazy), **bez čtení řádků rozšířené sady**, a ověřil je unit testy na vlastních větách (`backend/tests/test_lexicon2.py`), včetně vět, které skrýt nesmí.
2. Pak jsem slovník změřil skriptem `backend/scripts/measure_lexicon.py` na pilotu i rozšířené sadě.
3. Na **pilotu** (ladicí část) jsem se podíval na neskryté bloky a přidal tři vodítka, která plynou z definic kategorií, ne z konkrétních vět: *mortality / úmrtnost* (rozhodnutí D: statistiky úmrtnosti jsou zprávy o úmrtí), *belligerents* a slabé *conflict*.
4. End-to-end běh na skutečných stránkách (ne anotovaná sada) ukázal dvě chyby a ty jsem opravil:
   - Slabá válečná slova (*conflict, military, soldiers*) přebírala přednost války a blok o obětech konfliktu tak spadl na „válka, nejisté“, takže se neskryl ani při zapnuté válce (P01: 30 skrytých místo 48). Nově je silné vodítko úmrtí spolu se slabým válečným vodítkem **válka** s jistotou úmrtí. Skryje se tedy při zapnuté válce, ale ne při samotných „zprávách o úmrtí“, protože podle kategorií jsou oběti války válka. Násilí a katastrofy mají v prioritě přednost před úmrtím a zůstávají svým tématem.
   - *Sucho / drought* skrylo článek o klimatu v testovací stránce; podle kategorií je pomalý trend bez varování `jiné`, proto je teď slabé (jen `review`).
5. Rozšířenou sadu jsem tedy změřil víckrát: po kroku 2, po kroku 3 (beze změny), po každé opravě z kroku 4. Žádná změna nevznikla z pohledu na její řádky; čísla níže jsou poslední běh. **Rozšířená sada je tím pro hodnocení „viděná“** a doporučuji ji do finální sady ZF-19 nezařazovat, nebo to při hodnocení uvést.

## Co se přidalo

Silná vodítka (jedno stačí ke skrytí, když je téma zapnuté) a slabá (jen `review`, samo nikdy neskryje):

| Téma | Nová silná vodítka | Nová slabá vodítka |
|---|---|---|
| válka | drone strike(s), war crime(s), bombard…, occupied territor…, counteroffensive, belligerent(s), okupace/okupant…, bombardování, vojsk… | military, offensive, soldier(s), front line(s), conflict(s), drone(s), vojensk…, armád…, ofenziv… |
| násilí | shot dead, shot and killed, gunman/gunmen, mass shooting, stabbing, hostage(s), kidnapp…, abduct…, massacre, homicide, manslaughter, lynching, bombing, terror attack, zastřel…, střelb…, útočník…, rukojm…, unesl, únos, masakr…, zbil, ubodal, ubit…, zabil… | attack(ed/er), shooting, útok…, brutál… |
| katastrofy | landslide, avalanche, typhoon, cyclone, tornado, famine, eruption, natural disaster, chemical spill/leak, katastrofa (jen podstatné jméno), sesuv, lavin…, tajfun, tornád…, hladomor, erupce, lesní požár | disaster, outbreak, evacuat…, evakua…, epidemic/pandemic, epidemi…/pandemi…, drought, sucho |
| zprávy o úmrtí | dies, dead, death toll, passed away, lost their lives, funeral, mortality, zemře…, zesnul…, pohřeb, mrtv…, přišel o život, počet obětí, úmrtnost, smrt | victim(s), oběť/oběti, fatal |
| politické konflikty | no-confidence (vote), political crisis, expelled ambassador/diplomats, government collapse, coup, nedůvěra (i „o nedůvěře“), politická krize, vyhoštěn…, puč, vládní krize | opposition, opozice, resign…, demis… |

Obrazné „války“ se nepočítají: *trade/price/culture/tariff … war*, *war on drugs/poverty/terror*, *obchodní / cenová / kulturní válka*.

Záměrně slabé nebo vynechané kvůli falešnému skrytí: *bodies* („regulatory bodies“), *front line* („front line workers“), *fronta* („fronta na úřadě“), *ofenzivní hra*, *katastrofální výkon*, *Armáda spásy*, *David Lynch*, *heart attack*, *since the pandemic*, *film shooting*.

Unit testy zachytily dvě chyby v českých kmenech a ty jsou opravené: *nedůvěr* nesedí na „o nedůvěře“ (ř), *okupace* nesedí na „okupaci“.

## Výsledek (19. 11. 2026)

`PYTHONPATH=backend python backend/scripts/measure_lexicon.py`; vstup je identifikační úryvek z CSV, ne celý text bloku (stejně jako u `lexicon-1`).

**Pilot (89 bloků, ladicí část)**

| | lexicon-1 | lexicon-2 |
|---|---:|---:|
| Téma správně | 82 / 89 | **85 / 89** |
| Téma u citlivých bloků (bez `jiné`) | 4 / 11 | **7 / 11** |
| `jiné` správně | 78 / 78 | 78 / 78 |
| S1 válka a pol. konflikty: správně skryto / má se skrýt | 2 / 8 | **3 / 8** |
| S2 úmrtí a katastrofy: správně skryto / má se skrýt | 1 / 3 | **2 / 3** |
| Falešná skrytí | 2 | 2 (stejné bloky) |

**Rozšířená sada (143 bloků; viz bod 5 výše)**

| | lexicon-1 | lexicon-2 |
|---|---:|---:|
| Téma správně | 79 / 143 | **93 / 143** |
| Téma u citlivých bloků | 24 / 88 | **39 / 88** |
| válka | 4 / 16 | 8 / 16 |
| násilí | **0 / 13** | **6 / 13** |
| katastrofy | 6 / 21 | 10 / 21 |
| politické konflikty | 5 / 17 | 6 / 17 |
| zprávy o úmrtí | 9 / 21 | 9 / 21 |
| `jiné` správně | 55 / 55 | 54 / 55 |
| Správně skryto ze všech, které se mají skrýt (S1–S4) | 32 / 102 | **39 / 102** |
| Falešná skrytí | 5 | 6 |

Falešná skrytí `lexicon-2` na rozšířené sadě: R01-B001 (S2), R01-B006 (S4), R02-B006 (S2), R04-B012 (S2), R04-B019 (S4), R10-B009 (S2). Přesnost skrývání zůstala zhruba stejná (32 z 37 → 39 z 45 skrytých bylo správně, 86 % → 87 %), úplnost vzrostla z 31 % na 38 %.

Čas: 0,3 ms na úryvek (všechna nastavení).

End-to-end na skutečných stránkách (`bash tests/extension/run-e2e.sh`, všechna témata zapnutá): **18 z 18 stránek PASS**. P01 skryje 41 ze 74 bloků (37 jako válka), P05 8, cs.wikipedia Globální oteplování 25; článek o klimatu v testovací stránce už se neskryje.

`backend/tests/test_lexicon_baseline.py` teď hlídá čísla `lexicon-2`; čísla `lexicon-1` jsou v tabulkách výše a v `baseline-lexicon.md`.

## Co to znamená

Klasifikace je lepší, hlavně u násilí, ale **cíl 80 % respektování preferencí slovník sám nesplní**: z bloků, které se mají skrýt, skryje 38 %. Většina zbylých bloků se slovy vůbec nepozná (popis události bez klíčového slova) nebo skončí jako `review` (slabé vodítko). Dalším krokem je napojení modelu na `/v1/analyze` (ZF-25 uvádí Gemini se slovníkem jako zálohou), které je nad rámec tohoto úkolu, protože spotřebuje bezplatnou kvótu a znamená posílat text bloků Googlu i při analýze, ne jen při shrnutí.

## Omezení

- Úryvky v CSV nejsou celý text bloku; na stránce slovník vidí víc textu a čísla se mohou lišit.
- Pilot má málo citlivých bloků (11), proto je na něm každé číslo nejisté.
- Nová silná vodítka zvyšují riziko falešného skrytí na stránkách, které v sadě nejsou; nejasná slova jsou proto slabá.
- Slovník nepozná ironii, zápor („nikdo nezemřel“) ani kontext.
