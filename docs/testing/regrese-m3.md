# End-to-end integrace a regrese pro M3 (ZF-18)

Celý scénář MVP **preference → skrytí → shrnutí → přehrání** běží automaticky ve skutečném rozšíření, se skutečným backendem a s falešným Gemini (bez klíče, nic neopouští počítač). U každé stránky se kontrolují pevná pravidla návrhu a skript skončí s kódem 1, když některé neplatí.

Úkol měl navržené vlastníky Jana a Libuši, udělal ho Claude na Jakubovu žádost. Ruční checklist M2 (`checklist-m2.md`, ZF-13) zůstává; tento záznam ho doplňuje o shrnutí, hlas a soukromí (M3).

## Spuštění

Z kořene repozitáře, s nainstalovanými závislostmi backendu, Node.js 22+ a prohlížečem Brave:

```bash
bash tests/extension/run-e2e.sh
```

Skript spustí falešný Gemini (port 8090), backend s testovacím klíčem nasměrovaný na falešný Gemini (8000) a server s fixtures (8765). Pak pustí `popup-e2e.mjs --check` na výchozí sadě stránek a nakonec zkontroluje log backendu. Vlastní stránky: `bash tests/extension/run-e2e.sh <url> …`; jiný Python: `PYTHON=.venv/bin/python bash …`. Porty 8000, 8090 a 8765 musí být volné.

V CI to neběží: potřebuje Brave s načteným rozšířením a přístup na internet k pilotním stránkám.

## Co se na každé stránce děje

1. Otevře se popup a ověří se, že v kartě ještě **není content script** (nic se nepřečetlo před kliknutím).
2. Zapnou se všechny přepínače (od druhé stránky už jsou zapnuté z úložiště).
3. **Analyzovat**: extrakce, `/v1/analyze`, skrytí.
4. **Shrnutí** pro každou odpověď falešného Gemini: ok, `insufficient_input`, `no_relevant_content`, blokováno bezpečnostním filtrem, 500, 429, 504 a nakonec „Zkusit znovu“.
5. **Přehrávač** (hlasitost 0): Přehrát, Pozastavit, Pokračovat, Zastavit, Přehrát až do konce a pak simulovaný počítač bez lokálního hlasu.
6. U stránky z jednoho bloku **Přesto skrýt**, potom **Zobrazit vše**, **Znovu skrýt**, **Zobrazit vše**, druhá **Analyzovat** a **Zobrazit vše**.
7. Round trip ZF-09/ZF-10: každý výsledek na svém bloku, staré `extractionId` odmítnuto, skrytí a obnovení bez stop, odstraněný blok bez výsledku.

## Kontrolovaná pravidla

| Pravidlo | Kontrola (`--check`) | Zdroj |
|---|---|---|
| Dobrovolnost: nic se nečte ani neposílá bez kliknutí | Při otevření popupu není v kartě content script | proposal §4.2, ZF-29 |
| Vratnost | Po každém Zobrazit vše 0 skrytých; žádný atribut, box ani stylesheet ZenFeedu; žádný prvek bloku nezmizel ani nezměnil `display` | mvp F2, §7 (100 %) |
| Žádná změna textu | Text stránky se v popupu nevykreslí jako HTML; DOM po obnovení beze změny (ZF-10) | proposal §4.2 |
| Skrytí odpovídá stavu | Počet skrytých = skryté prvky = boxy = stav; žádný blok neselhal | ZF-10, B-001 |
| Opakovatelnost | Druhá analýza téže stránky dá stejný výsledek (pokud se stránka mezitím nezměnila, jinak poznámka); Znovu skrýt skryje totéž | ZF-11, B-002 |
| Správné přiřazení výsledků | Každý výsledek na bloku se stejným ID; výsledky staré extrakce odmítnuty | ZF-09 |
| Skrytý text neodchází do shrnutí | Text žádného skrytého prvku není v požadavku, který dostal Gemini | ZF-30, ZF-29 |
| Klíč a prompt | Klíč přišel jen v hlavičce; prompt obsahuje pravidlo o nedůvěryhodném textu | ZF-15, ZF-25 |
| Transparentnost shrnutí | Shrnutí má štítek „Použité nastavení …“; při ničem viditelném se shrnutí nežádá | proposal §4.2, ZF-30 |
| Chyby shrnutí | Každá chyba se ukáže jako chyba, příznaky jako výsledek; Zkusit znovu funguje | API.md, ZF-30 |
| Označení syntetického hlasu | Štítek „Syntetický hlas …“ / „Synthetic voice …“ a upozornění před prvním přehráním | mvp F4, ZF-17 |
| Fallback hlasu | Přehrávání doběhne; bez lokálního hlasu chyba a shrnutí zůstane | ZF-16 |
| Nepřístupné stránky | `chrome://` a Chrome Web Store: chybová zpráva, nic dalšího | ZF-08 |
| Logy | Log backendu neobsahuje text stránky ani klíč | ZF-29, ZF-15 |

Že kontroly opravdu chyby najdou, ověřila **negativní kontrola**: do rozšíření se dočasně vnesly dvě chyby (Zobrazit vše nechá na prvcích značku; shrnutí pošle i skryté bloky). Běh na `hider.html` skončil FAIL s oběma nálezy („4 ZenFeed traces left after Zobrazit vše“, „4 hidden elements' text was sent for the summary“) a kódem 1. Soubory se pak vrátily přes `git checkout`.

## Výsledky (14. 11. 2026)

`bash tests/extension/run-e2e.sh`, headless Brave 156 na macOS, rozšíření načtené rozbalené, backend z větve s ZF-15, falešný Gemini. **18 z 18 stránek PASS**, log backendu bez textu stránky a klíče, kód 0.

| Stránka | Výsledek analýzy | Shrnutí: bloků poslaných / skrytý text | Hlas | Verdikt |
|---|---|---|---|---|
| `hider.html` | skryto 4 z 11 | 7 / 0 | Daniel, dočteno | PASS |
| `hider-csp.html` (přísné CSP) | skryto 4 z 11 | 7 / 0 | Daniel, dočteno | PASS |
| `segmentation.html` | 0 z 8 | 8 / 0 | Zuzana, dočteno | PASS |
| `single-block.html` | jeden blok, nic neskryto, Přesto skrýt skryl 1 | 1 / 0 | Daniel, dočteno | PASS |
| `mostly-war.html` | skryto 4 z 4, „nezůstal téměř žádný obsah“ | nic se neposlalo (nic viditelného) | – | PASS |
| `long-block.html` | 0 z 2, poznámka o zkráceném bloku | 2 / 0 | Daniel, dočteno | PASS |
| `html-title.html` | jeden blok, neodpovídá | 1 / 0 | Daniel, dočteno | PASS |
| `no-title.html`, `editable.html` | málo textu, nic neposláno | – | – | PASS |
| `empty.html` | žádný čitelný obsah | – | – | PASS |
| P01 OWID war-and-peace | skryto 48 z 74, 2 nešlo bezpečně | 23 / 0 | Daniel, dočteno | PASS (poznámka: stránka se mezi analýzami změnila, 74 → 75 bloků) |
| P02 EA Forum | 0 z 51 | 51 / 0 | Daniel, dočteno | PASS |
| P03 NASA news | 0 z 26 | 26 / 0 | Daniel, dočteno | PASS |
| P05 Wikipedia Talk | skryto 11 z 49, 3 nešlo bezpečně | 35 / 0 | Daniel, dočteno | PASS |
| P06 horydoly.cz | 0 z 50 | 50 / 0 | Daniel (stránka deklaruje `lang="en"`) | PASS |
| cs.wikipedia Globální oteplování | skryto 21 z 400, poznámka o limitu 400 bloků | 38 / 0 (limit 30 000 znaků) | Zuzana, dočteno | PASS |
| `chrome://version/` | „nemá přístup“ | – | – | PASS |
| Chrome Web Store | „nefunguje“ | – | – | PASS |

U všech stránek se shrnutím: všech sedm odpovědí falešného Gemini se v panelu ukázalo správně a Zkusit znovu shrnutí vrátilo; bez lokálního hlasu se ukázala chyba a shrnutí zůstalo.

P04 (OWID „latest“) v sadě není: web teď vykresluje jen patičku (125 znaků, ověřeno `segment-pages.mjs`), popup tam správně hlásí málo textu.

Celý scénář preference → skrytí → shrnutí → přehrání tedy proběhl na pilotních stránkách P01, P02, P03, P05 a P06, což je podmínka „Hotovo, když“ v ZF-18.

Ostatní automatické kontroly ve stejný den: `ruff` OK, `pytest backend` 88 prošlo, `node --test tests/extension/*.test.mjs` 98 z 98 na Node 25.9 i 22.23, `hider-browser.mjs` OK.

## Co tento běh nepokrývá (ručně, nebo později)

- Skutečný Google Chrome se skutečným kliknutím; běh je v headless Brave přes CDP.
- Skutečné Gemini API (není klíč): kvalita, věrnost (ZF-31) a latence shrnutí.
- Slyšitelnost a kvalita hlasu (hlasitost 0; posouzení je ZF-34).
- Přesnost klasifikace: test hodnotí chování rozšíření, ne to, zda `lexicon-1` zařadil blok správně (ZF-19, ZF-20; poznámky ke klasifikaci v `evidence-chyb.md`).
- Windows a Linux (jiné lokální hlasy).

## Známá omezení testu

- Pilotní stránky jsou živé weby; když se změní (P04), výsledky se liší a stránku je potřeba vyměnit podle `pilot/stranky.md`.
- Kliknutí na ikonu dřív, než se stránka načte, ztratí přístup (ZF-08). Skript v tom případě klikne jednou znovu a vypíše to.
- Kontrola „skrytý text v požadavku“ porovnává prvních 40 znaků textu každého skrytého prvku (bez mezer) s odeslanými bloky; kratší prvky (pod 20 znaků) se nekontrolují.
