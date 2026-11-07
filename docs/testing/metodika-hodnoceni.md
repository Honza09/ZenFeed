# Metodika hodnocení MVP (ZF-27)

> **ZMRAZENO 7. 11. 2026** na základě sdělení Libuše (zápis chatu jsem neviděl): body 1–4 a 6–9 rozhodla Libuše 4. 11., body 3 (κ), 4 (oblast), 5 a 10 tým 7. 11. Hodnotitelé finální sady (ZF-19): Libuše a Jakub.

Závazné prahy proposalu jsou jen tři: **respektování preferencí ≥ 80 %**, **pokles mediánu času ≥ 20 %**, **vratnost 100 %**. „90 % precision“, „3 s“ a „10 s“ jsou pracovní předpoklady plánu, ne požadavky.

## 0. Souhrnná tabulka rozhodnutí

| # | Rozhodnutí | Možnosti | Doporučení (není rozhodnutí) | Rozhodnutí týmu |
|---|---|---|---|---|
| 1 (§a) | Kdy je případ vyhodnotitelný | A: každá stránka × nastavení; B: jen s ≥ 1 blokem ke skrytí; C: všechny, hlášené ve dvou skupinách | C | Libuše, 4. 11. 2026: všechny vyhodnotitelné případy, hlášené ve dvou skupinách („s cílem“ / „bez cíle“) |
| 2 (§b) | Jak se počítá respektování preferencí | A: podíl správných rozhodnutí o blocích; B: podíl případů, kde jsou všechna rozhodnutí správná | B jako hlavní číslo (odpovídá textu proposalu), A jako doplňkové | Libuše, 4. 11. 2026: případová definice B jako hlavní číslo vůči prahu 80 %, bloková A a precision/recall jako doplňkové |
| 3 (§b) | Co je „preferovaná oblast“ | A: bloky k ponechání; B: bloky ke skrytí; C: téma + tón na blok, oblast se odvodí z nastavení | C | Libuše, 4. 11. 2026: téma + tón na blok, oblast se odvodí z nastavení |
| 4 (§c) | Definice správně odděleného bloku | potvrdit pracovní definici / tolerantnější (pokrytí ≥ 80 %, cizí obsah ≤ 5 %) | potvrdit pracovní definici, tolerantní hlásit vedle | Libuše, 4. 11. 2026: potvrdit pracovní definici, tolerantní hlásit vedle |
| 5 (§d) | Druhý hodnotitel | A: Claude (stávající stav); B: A + lidský hodnotitel na vzorku; C: Claude + čerstvý agent naslepo; D: druhý člověk na celé sadě | B (nebo C, pokud se člověk nenajde) | Tým, 7. 11. 2026: finální sadu v ZF-19 hodnotí **Libuše a Jakub**, každý zvlášť naslepo (lidský druhý hodnotitel, bez Clauda) |
| 6 (§d) | Statistika shody a cíl | % shody + Cohenovo κ za pole téma, tón, oblast; cíl κ | hlásit obojí; cíl κ ≥ 0,70 jako **návrh** | Libuše, 4. 11. 2026, potvrzeno týmem 7. 11.: % shody + Cohenovo κ (dva hodnotitelé) za pole téma, tón a skrývání podle nastavení; cíl κ ≥ 0,70 jako návrh týmu |
| 7 (§e) | Poměr CS : EN (24 stránek) | 12:12, 16:8, 8:16 (+ 20:4) | 12:12 | Libuše, 4. 11. 2026: 12:12 |
| 8 (§f) | Rozdělení ladění × finále | A: pilot = ladění; B: pilot mimo; C: pilot jen ladění, nové stránky stratifikovaně | A + C | Libuše, 4. 11. 2026: pilot jako ladění + nové stránky stratifikovaně (A + C) |
| 9 (§g) | Měření času a latence | návrh postupu v §g | schválit po úpravách | Libuše, 4. 11. 2026: schválit postup v §g po úpravách |
| 10 (§d) | Odchylka od proposalu („dva nezávislí hodnotitelé“) | schválit u vedoucího / nahradit možností D | předložit vedoucímu | Tým, 7. 11. 2026: odchylka od proposalu není (dva nezávislí lidé); schvalování vedoucím není potřeba |

## Pokrytí kritérií ZF-27

| Kritérium issue | Kde |
|---|---|
| Definice vyhodnotitelného případu a výpočet respektování preferencí | §a, §b |
| Dva nezávislí hodnotitelé označují preferovanou oblast | §d (+ výklad pojmu v §b.1) |
| Poměr CS/EN, výsledky i po jazycích | §e |
| Rozdělení na ladění a finální hodnocení | §f |

## a) Vyhodnotitelný případ

**Návrh definice.** Případ = dvojice (stránka, nastavení). Nastavení je výběr témat a tónu ke skrytí (v pilotu příklady S1 válka + politické konflikty, S2 úmrtí + katastrofy, S3 vyhrocený tón, S4 násilí). Případ je **vyhodnotitelný**, pokud (1) stránka má hotovou anotaci obou hodnotitelů po vyřešení rozporů, (2) extraktor na stránce vrátil aspoň jeden blok, (3) stránka je ve stavu, ve kterém byla anotována (viz §f, volatilní stránky).

Otázka, zda zahrnout případy bez bloku ke skrytí (v proposalu o tom nic není):

| Možnost | Důsledek |
|---|---|
| A: všechny případy | většina případů je „nic neskrývat“, 80 % se dosáhne skoro automaticky |
| B: jen případy s ≥ 1 blokem ke skrytí | měří skrývání, ale nevidí nesprávné skrytí na stránkách bez cíle |
| **C (doporučení): všechny vyhodnotitelné, výsledky ve dvou skupinách** („s cílem“ / „bez cíle“), obě skupiny hlásit zvlášť i dohromady | transparentní; práh 80 % se posoudí na obou způsobech |

**Počet případů (skript `cases.py` nad `anotace.csv`, příklad, ne měření):** pilot má 6 stránek × 4 nastavení = **24 případů**, z toho jen **3 s ≥ 1 blokem ke skrytí** (P01 S1: 5, P04 S2: 3, P05 S1: 3; ostatních 21 případů má 0). Sada 24 stránek × 4 nastavení by měla **96 případů** hrubě. Kolik z nich bude „s cílem“, závisí na výběru stránek: v rozšířené sadě R01–R12 (143 bloků, nejde o stránky) je ke skrytí 102 z 572 dvojic blok × nastavení (17,8 %), v pilotu 11 z 356 (3,1 %). Pokud nebudou do finální sady vybrány stránky s válkou, úmrtím, násilím a toxickými komentáři, bude „s cílem“ jen zlomek ze 96 (neověřeno, závisí na výběru).

**Mapování S1–S4.** S1–S4 jsou příkladová nastavení z šablony; konečná nastavení pro ZF-19 určí tým (otevřené, viz `rucni-overeni.md`). Pro každou stránku platí stejná čtveřice, pokud tým nerozhodne jinak.

**Upozornění:** `sablona-mereni.csv` má neaktuální `ocekavane_skryte` (P04 S2: 2, anotace 3; P05 S1: 4, anotace 3; P05 S3: 1, anotace 0). Neopravoval jsem to. Příklady níže používají hodnoty z `anotace.csv`.

## b) Respektování preferencí

### b.1 Co je „preferovaná oblast“ (nejednoznačné)

Proposal §5: „Preferovaná oblast se u každé stránky předem ručně označí dvěma hodnotiteli.“ Nevyplývá z toho, zda jde o bloky, které uživatel chce **ponechat**, **skrýt**, nebo o **téma a tón** bloku.

| Výklad | Plus | Minus |
|---|---|---|
| A: bloky k ponechání | blízko „získat požadovaný přehled“ | závisí na konkrétním nastavení; pro 4 nastavení čtyři označení |
| B: bloky ke skrytí | přímo odpovídá TP/FP/FN | totéž |
| **C (doporučení): téma + tón na blok; oblast se odvodí z nastavení podle `kategorie-mvp.md`** | jedna anotace slouží všem nastavením; stejná jako dosavadní pilot | „oblast“ je odvozená, ne označená přímo |

### b.2 Dvě definice z `sablona-mereni.md`

Za rozhodnutí na úrovni bloku (TP = nežádoucí a skrytý, FP = chybně skrytý, FN = nežádoucí a neskrytý, TN = ponechaný správně):

* **A (bloková):** `(TP+TN)/(TP+TN+FP+FN)` v případu; celkově buď pooled přes všechny případy, nebo průměr případů.
* **B (případová):** případ je správný, pokud FP = 0 a FN = 0; výsledek = správné případy / vyhodnotitelné případy.

Proposal definuje ukazatel jako „podíl vyhodnotitelných případů (stránka × nastavení), kdy je správně skryto to, co uživatel zvolil, a zůstane vidět to, co zvolil nechat“. To odpovídá **B**. **Doporučení:** B jako hlavní číslo vůči prahu 80 %, A a precision/recall jako doplňkové.

**Příklad, ne měření** (skript `examples.py`; očekávané počty z `anotace.csv`, TP/FP/FN/TN vymyšlené):

| Případ | TP | FP | FN | TN | A (bloková) | precision | recall | B (případ OK?) |
|---|---|---|---|---|---|---|---|---|
| P01 S1 (6 bl., 5 skrýt) | 4 | 0 | 1 | 1 | 83,3 % | 100 % | 80 % | ne |
| P04 S2 (20 bl., 3 skrýt) | 2 | 1 | 1 | 16 | 90,0 % | 66,7 % | 66,7 % | ne |
| P02 S1 (25 bl., 0 skrýt) | 0 | 2 | 0 | 23 | 92,0 % | 0 % | nedef. | ne |
| P03 S3 (25 bl., 0 skrýt) | 0 | 0 | 0 | 25 | 100 % | nedef. | nedef. | ano |

Kdyby v 24 případech pilotu dopadly první tři řádky tabulky jako výše a zbylých 21 bylo bez chyby (vymyšlený scénář): bloková pooled shoda 98,8 %, případová 87,5 % (21 z 24). Dva ze tří skutečných případů „s cílem“ (P01 S1, P04 S2) jsou v příkladu chybné, přesto bloková shoda přesahuje 98 %. **Důsledek:** bloková definice dává vysoké číslo i s chybnými případy a práh 80 % pak nic neříká; případová je přísnější a citlivá na podíl případů bez cíle (proto skupiny v §a).

### b.3 Případy bez očekávaného skrytí

Precision a recall jsou nedefinované (0/0). Hlásí se: **počet chybně skrytých bloků** a počet případů, kde nebylo skryto nic. Do případové definice B se tyto případy počítají (správné, pokud FP = 0).

### b.4 Definice chyb

* **Chybně skrytý blok (FP):** blok, který podle anotace nespadá do vybraného nastavení, ale byl skryt. Hlásí se zvlášť i podle typu bloku (cookie lišta, navigace jsou rizikové).
* **Neskrytý nežádoucí blok (FN):** blok v nastavení, který zůstal vidět.
* **Nejistý výstup (`review`):** klasifikátor se nerozhodl. Návrh: `review` se pro skrytí počítá jako **neskrytý** (blok zůstává vidět); v hlášení se uvede jejich počet zvlášť a tým rozhodne, zda je to FN, nebo samostatná kategorie.
* **Vratnost (100 %):** případ je v pořádku, pokud po „Zobrazit vše“ je DOM stránky shodný s výchozím (návrh způsobu kontroly: stejný seznam skrytelných prvků a žádný zůstalý atribut/styl rozšíření). Práh 100 % se vyhodnocuje na všech spuštěných případech; jediné selhání prahem neprojde.

### b.5 Shrnutí

Proposal: shrnutí „vynechá vybraná témata a zachová relevantní informace“. **Návrh:** hodnotitel (ne autor klasifikátoru) pro každé shrnutí odpoví ano/ne na (1) zmiňuje vybrané téma? (2) chybí něco, co anotace označila jako relevantní a ponechané? Případ shrnutí je správný, pokud (1) = ne a (2) = ne. Faktickou věrnost (vymyšlený nebo obrácený fakt) hodnotí ručně, viz proposal §5. Kdo hodnotí: viz §d, hodnotitel nesmí vidět štítky klasifikátoru před posouzením (návrh).

## c) Segmentace a bloky

Pracovní definice v `sablona-mereni.md` (správně oddělený blok = právě jeden očekávaný blok bez cizího obsahu a bez rozdělení; bloky navíc jen v `nalezene_bloky`; neanotované bloky se do `ocekavane_bloky` nezahrnují). Z ZF-07 (`vyhodnoceni-zf-07.md`, nic jsem neměřil znovu):

* Přísná definice dala 77 z 89 (86,5 %); tolerantnější (pokrytí ≥ 80 %, cizí obsah ≤ 5 % znaků, volba autora ZF-07, ne z plánu) 75 z 89 (84,3 %); nižší číslo je podle ZF-07 způsobeno tím, že tolerantní definice mění P02, P05 a P06 (podrobnosti v dokumentu, neověřoval jsem). Odkaz jen na uvedená čísla; dokument má 90 vs. 89 bloků a P06 8 vs. 7 očekávaných – neslučuji.
* Největší riziko není nesprávné dělení, ale **obalový prvek přes celý článek** (P01) a **bloky navíc** (cookie lišta, doporučené články: 98 ze 276 nalezených).

**Doporučení:** (1) potvrdit pracovní definici bodu 1; (2) bloky navíc hlásit zvlášť jako „bloky navíc“ a hodnotit jejich skrytí v FP jen u případů, kde jsou součástí stránky (cookie lišta = FP, pokud ji klasifikátor skryje z jiného důvodu než z tématu); (3) neanotované bloky ponechat mimo, ale počet hlásit; (4) dynamické načítání (P04 „Show more“) měřit jen anotovaný stav. Rozhodnutí: ____.

## d) Hodnotitelé

**Protokol pro finální sadu (návrh):**
1. Každý hodnotitel dostane jen seznam bloků (`block_id`, locator, krátký úryvek) a `kategorie-mvp.md`. Nevidí štítky druhého ani štítky klasifikátoru, ani cizí zdůvodnění.
2. Anotuje zvlášť pole `téma`, `tón`, `jistota` (J/H) → oblast se odvodí (§b.1).
3. Zámek: před porovnáním se uloží obě surové anotace s datem; po zámku se nic nepřepisuje.
4. Porovnání: spočte se shoda (viz níže) **před** řešením rozporů.
5. Rozpory vyřeší společný rozhovor podle pravidel v `kategorie-mvp.md`; výsledek se uloží zvlášť jako „vyřešená“ anotace, rozpory zůstávají v souboru. Případné nové pravidlo se zapíše do `kategorie-mvp.md`, ne do jednotlivých štítků.
6. Tvůrce klasifikátoru (ZF-06/14) neanotuje finální sadu.

**Statistika (návrh):** procentuální shoda a Cohenovo κ **za každé pole zvlášť** (téma, tón, oblast), s uvedením počtu bloků a rozdělení tříd. κ není definované, když jeden hodnotitel použil jedinou hodnotu (v pilotu tón: všech 89 neutrální). Inspirace: McHugh (2012), *Interrater reliability: the kappa statistic*, Biochem Med, https://pmc.ncbi.nlm.nih.gov/articles/PMC3900052/ (přeformulováno, tým jej nepřijal). **Cíl:** κ ≥ 0,70 je **návrh**, v proposalu ani plánu cíl není. Při pomalém výskytu tříd (tón) doplnit % shody.

**Přepočet shody z `shoda-hodnotitelu.md`** (příkaz: `python3 agreement.py docs/testing/pilot`; skript čte `anotace.csv`, `anotace-rozsireni.csv`, `anotace-nezavisla-agent.csv`, `anotace-libuse.csv`; 232 společných bloků):

| Dvojice / sada | téma shoda, κ | tón shoda, κ | Shoduje se s dokumentem |
|---|---|---|---|
| Pilot, Claude × agent | 98,9 %, 0,95 | 100 %, nedef. | ano |
| Rozšíření, Claude × agent | 97,9 %, 0,97 | 97,2 %, 0,82 | ano |
| Všech 232, Claude × agent | 98,3 %, 0,97 | 98,3 %, **0,82** (přesně 0,8245) | téma ano, **tón: dokument 0,83** |
| Všech 232, Libuše × agent | 98,3 %, 0,97 | 98,3 %, **0,82** | téma ano, **tón: dokument 0,83** |
| Libuše × Claude (kruhové) | 100 %, 1,00 | 100 %, 1,00 | ano |
| Všichni tři (Fleiss κ) | 98,3 % shodných trojic (228/232), 0,98 | 98,3 % (228/232), 0,89 | ano |

Jediný rozdíl: κ tónu pro Claude × agent a Libuše × agent na 232 blocích je 0,8245, po zaokrouhlení **0,82**, v dokumentu je **0,83**. (Průměrná párová shoda ve Fleissově vzorci je 98,9 %; dokument uvádí podíl úplně shodných trojic 98,3 %, ten jsem také ověřil.) Dokument jsem needitoval.

**Rozhodnutí týmu (7. 11. 2026):** finální sadu v ZF-19 hodnotí **Libuše a Jakub**, každý zvlášť naslepo, oba lidé; Claude finální sadu nehodnotí. Dva nezávislí hodnotitelé podle proposalu jsou tím splněni a odchylka od proposalu odpadá. Shoda se hlásí jako % shody a Cohenovo κ (dvojice). Pravidlo 6 výše (tvůrce klasifikátoru neanotuje) platí; hodnotitelé ho neporušují. **Pole „oblast“:** anotace ho nemají, proto se κ pro oblast nahrazuje κ na výsledném skrývání (rozhodnutí skrýt/ponechat blok) odvozeném z tématu a tónu pro každé nastavení. Tvůrce klasifikátoru je v týmu Daniel (neověřeno z repozitáře), nehodnotí.

**Limity Claude jako druhého hodnotitele (platí jen pro pilot a rozšíření, kde Claude anotoval):**
* Proposal chce dva **nezávislé** hodnotitele; Claude navrhl koncept anotací i pravidla kategorií. Čtenář pravidel a jejich autor sdílí stejné chápání, proto vysoká shoda měří spíše jednotné použití pravidel než nezávislý úsudek. Claude × agent je jen poloviční nezávislost (agent četl stejná pravidla).
* Libuše × Claude je v pilotu kruhová (100 %), nelze interpretovat.
* Neověřeno: velikost zkreslení; žádný lidský druhý hodnotitel neexistuje.

| Možnost | Plus | Minus |
|---|---|---|
| A: Libuše + Claude naslepo (stav) | bez nákladů | nejnižší nezávislost; odchylka od proposalu |
| **B (doporučení): A + lidský hodnotitel na vzorku (např. 20–30 % bloků, návrh)** | dává aspoň kus nezávislého κ | potřebuje člověka (kamarád, spolužák, vedoucí) |
| C: Libuše + čerstvý agent naslepo, Claude jen píše pravidla | levné, lepší než A | agent není člověk, sdílí pravidla |
| D: dva lidé na celé sadě | nejvěrnější proposalu | v týmu není |

**Odchylka od proposalu:** po rozhodnutí týmu (Libuše a Jakub) žádná; limity Clauda platí jen pro pilot a rozšíření.

## e) Jazyk

Ze stránek EN/CS se výsledky hlásí **zvlášť podle jazyka** i celkem. Pilot je 5× EN, 1× CS (čeština prakticky chybí).

| Poměr CS : EN | Případů ×4 nastavení (CS / EN) | Důsledek |
|---|---|---|
| **12 : 12 (doporučení)** | 48 / 48 | oba jazyky stejně široké, žádný není hlavní |
| 16 : 8 | 64 / 32 | silnější čeština (cílová skupina), slabší angličtina |
| 8 : 16 | 32 / 64 | blíže pilotu, čeština hlášena jen informativně |
| 20 : 4 | 80 / 16 | angličtina jen ukázka, nelze hlásit zvlášť |

**Šířka 95% Wilsonova intervalu pro podíl kolem 80 %** (skript `cases.py`, k = zaokrouhleno 0,8·n; informativní, proposal žádný test významnosti nežádá):

| Vyhodnotitelných případů n | Pozorováno | 95% interval | Šířka |
|---|---|---|---|
| 6 | 83,3 % | 43,6–97,0 % | 53,3 b. |
| 12 | 83,3 % | 55,2–95,3 % | 40,1 b. |
| 16 | 81,2 % | 57,0–93,4 % | 36,4 b. |
| 24 | 79,2 % | 59,5–90,8 % | 31,2 b. |
| 48 | 79,2 % | 65,7–88,3 % | 22,5 b. |
| 96 | 80,2 % | 71,1–86,9 % | 15,8 b. |

Interpretace: i při 48 případech na jazyk je interval široký (± 11 b.); při malém n lze o jazyku říct jen „nelze vyloučit velký rozdíl“. Kdyby se počítaly jen případy „s cílem“ (§a), bude n výrazně menší (pilot: 3 z 24), takže intervaly budou ještě širší.

## f) Ladění × finále

Pravidla (návrh, platí pro všechny možnosti): rozdělení po **stránkách**, stratifikovaně podle typu rozložení a jazyka, **zafixované před prvním pohledem na výsledky**; stejná doména není v obou částech; finální část se vyhodnotí **jednou** a nepoužívá se k ladění (po finálním měření se nic neladí, jinak se výsledek označí jako ladění). Volatilní stránky (výpisy zpráv, živé přenosy): ukládat **permalink nebo ID verze (např. oldid, archivní snímek) a datum**, ne celý obsah; pokud se stránka změní, případ se označí jako nevyhodnotitelný.

| Možnost | Popis | Plus | Minus |
|---|---|---|---|
| A: pilot = ladění | 6 pilotních stránek je ladicí část, finále jen nové | pilot už je anotovaný a „viděný“; žádné zkreslení finále | ladění z 6 stránek (5 EN) je úzké |
| B: pilot mimo | pilot jen technický test, 24 nových stránek se dělí | čisté rozdělení | pilot se zahodí |
| C: pilot jako ladění + 24 nových stránek stratifikovaně (např. 8 ladění / 16 finále, poměr **návrh**) | kombinace | více ladicích dat | finále jen 16 stránek |

**Doporučení:** C (zahrnuje A); konkrétní velikosti rozhodne tým. Pilot byl viděn při tvorbě pravidel, proto **nesmí** jít do finále.

## g) Čas a latence (návrh; vše nad rámec proposalu je „návrh“)

Proposal: pokles mediánu času k přehledu ≥ 20 % oproti obvyklému postupu (čtení bez nástroje / ruční AI chat); nedokončené úlohy = neúspěch; latence = čas od spuštění do skrytí, shrnutí a začátku audia (plán: ≥ 3 měření na stránku).

* **Úloha (návrh):** „Zjistěte, co se na stránce stalo (hlavní fakta), a přitom se vyhněte vybraným tématům“; po úloze 3–5 kontrolních otázek na ponechaný obsah, odpovědi hodnotí hodnotitel podle anotace. „Bez horších odpovědí“ = podíl správných odpovědí není nižší než základní.
* **Stopky (návrh):** start = zobrazení pokynu s odkazem na stránku; konec = účastník řekne „mám přehled“ a odpoví na otázky. Měří moderátor, stejné stopky pro obě varianty.
* **Základ „obvyklý postup“ (návrh):** čtení bez nástroje (výchozí), ruční AI chat jako druhá varianta, pokud tým rozhodne. Pořadí variant střídat.
* **Opakování (návrh):** každý účastník dělá obě varianty na různých stránkách (nikdy stejnou stránku dvakrát); medián se počítá přes úlohy. Počet stránek na účastníka: tým.
* **Latence (návrh):** ≥ 3 měření na stránku (plán), hlásit medián a 95. percentil (plán §5.3); 3 s / 10 s jsou pracovní předpoklad plánu. Podmínky měření (stroj, rozlišení, cookie) zapsat.
* Neověřeno: počet účastníků (proposal: 3–5) stačí pro jakýkoli závěr; **medián z 3–5 lidí je nejistý**, hlásit rozdělení, ne jen medián.

## Checklist (stav po zmrazení 7. 11. 2026)

- [x] Body 1–4 a 6–9 rozhodla Libuše (4. 11.), body 5 a 10 tým (7. 11., podle Libuše).
- [x] Hodnotitelé ZF-19: Libuše a Jakub, oba všechny stránky (7. 11.); Cohenovo κ.
- [ ] Libuše i Jakub anotují naslepo, bez pohledu na štítky druhého ani Clauda.
- [x] Cíl κ ≥ 0,70 (všichni souhlasí). [x] „Oblast“ = κ na výsledném skrývání podle nastavení. [ ] Přidat do anotačního postupu ZF-19 sloupce pro skrývání (odvozené).
- [x] Poměr 12:12.
- [ ] Vybrat 24 stránek (více domén, nejvýše 1–2 z jedné domény) a ověřit licence/podmínky.
- [ ] Rozdělit stránky na ladění a finále před výsledky (§f); zapsat permalinky a data.
- [ ] Potvrdit konečná nastavení místo příkladových S1–S4 a opravit `sablona-mereni.csv` (stará `ocekavane_skryte`).
- [ ] Potvrdit definice bloku (§c) a zacházení s `review` (§b.4).
- [ ] Schválit postup měření času (§g).
- [x] Přeneseno do `docs/TESTING.md` (7. 11.). [ ] Zaškrtnout ZF-27 v `docs/backlog/11-zf-27.md`.

## Co jsem neověřil

Zápis rozhodnutí ze skupinového chatu (vycházím z tvého sdělení); skutečné chování klasifikátoru (žádný není v repozitáři); poměr případů „s cílem“ ve 24stránkové sadě; hodnoty κ pro oblast (pole oblast v anotacích nemám); přesné znění „preferované oblasti“ mimo proposal §5.

*Skripty: `agreement.py`, `cases.py`, `examples.py` (v pracovním adresáři relace, nejsou součástí repozitáře).*
