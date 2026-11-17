# Regresní checklist M3 (ZF-18)

> **Stav:** návrh k použití pro milník M3. Vznikl 17. 11. 2026 z dokumentace a kódu větve `issue-ZF-18`. **Žádný výsledek zde není vyplněný**: scénáře nikdo neprovedl, sloupce Výsledek, Datum, Tester, Build a Bug jsou prázdné. Chyby se zapisují do [`evidence-chyb.md`](evidence-chyb.md) podle jeho pravidel.
>
> Automatické běhy (`run-e2e.sh`, `popup-e2e.mjs --check`, `voice.test.mjs`) tento checklist **nenahrazují**: běžely v headless prohlížeči, s atrapou Gemini a s ztlumeným hlasem ([`regrese-m3.md`](regrese-m3.md)). Checklist je pro ruční běh v desktopovém Chrome nebo Brave se skutečným klikem a skutečným hlasem.

Zdroje pravdy pro očekávané výsledky: [`../mvp.md`](../mvp.md), [`../hiding.md`](../hiding.md), [`../popup.md`](../popup.md), [`../edge-states.md`](../edge-states.md), [`../summary-panel.md`](../summary-panel.md), [`../summarize.md`](../summarize.md), [`../voice-player.md`](../voice-player.md), [`../API.md`](../API.md). Kde dokumentace chování neurčuje, stojí ve sloupci očekávaného výsledku **UNSPECIFIED**; tam zapiš, co jsi viděl, a odkaz na [otevřenou otázku](#otevřené-otázky). Nic jsem nedomýšlel.

## Jak checklist používat

- Výsledek zapiš jedním slovem: **Pass**, **Fail** (založ chybu v `evidence-chyb.md` a napiš její ID), **Blocked** (scénář nejde provést, napiš důvod) nebo **N/A** (nevztahuje se na tento build nebo stránku, napiš důvod).
- Do sloupce **Build** napiš výstup `git rev-parse --short HEAD` v den testu a prohlížeč s verzí (např. `a1b2c3d, Chrome 14x`).
- Hodnotí se **chování rozšíření**, ne kvalita klasifikace ani kvalita textu shrnutí. Že klasifikátor zařadil blok jinak než anotace, není chyba UI (pravidlo 6 v `evidence-chyb.md`).
- Sloupec **Aut.** říká, co už to hlídá automaticky: `node` = `node --test tests/extension/*.test.mjs`; `pytest` = `pytest backend`; `e2e` = `tests/extension/popup-e2e.mjs --check` (přes `run-e2e.sh`, s atrapou Gemini a ztlumeným hlasem); `ne` = z povahy věci ručně. Pozor: i u řádku s `e2e` nebyl skutečný klik v desktopovém Chrome ani skutečný hlas nikdy ověřen.
- Čas odezvy není kritérium.

### Společné předpoklady

| Kód | Předpoklad |
|---|---|
| SP1 | Backend běží na `http://127.0.0.1:8000` (`GET /health` vrací `{"status":"ok"}`). |
| SP2 | Rozšíření je načtené z `extension/` (Developer mode, Load unpacked) a po poslední změně znovu načtené. |
| SP3 | Všechny přepínače v popupu jsou vypnuté (výchozí stav). |
| SP4 | Lokální stránky běží: `python3 -m http.server 8765 --directory tests/extension/fixtures`; otevírají se jako `http://127.0.0.1:8765/<soubor>.html`. |
| SP5 | V DevTools stránky se před prvním krokem uloží `window.__zf = document.body.innerHTML`; „beze změny“ znamená `document.body.innerHTML === window.__zf`. Počet skrytých prvků: `document.querySelectorAll('[data-zenfeed-hidden]').length`. |
| SP6 | **Atrapa Gemini (stand-in, ne model):** `python3 tests/extension/fake_gemini.py 8090`, backend spuštěný jako `ZENFEED_AI_API_KEY=fake-key-for-e2e ZENFEED_SUMMARY_API_BASE=http://127.0.0.1:8090/v1beta uvicorn app.main:app --app-dir backend --port 8000`. Režim atrapy: `curl -X POST http://127.0.0.1:8090/__fake/mode -H 'Content-Type: application/json' -d '{"mode":"rate_limited"}'` (režimy `ok`, `insufficient`, `no_relevant`, `rate_limited`, `unavailable`, `timeout`, `blocked`). Poslední požadavek, který atrapa dostala: `curl http://127.0.0.1:8090/__fake/last`. Text „shrnutí“ z atrapy není shrnutí, jen kontrola cesty. |
| SP7 | **Skutečný model** (jen M3-02): klíč je v lokálním prostředí backendu (`ZENFEED_AI_API_KEY`, bez fakturace, `docs/rozhodnuti-zf-25.md`), `ZENFEED_SUMMARY_API_BASE` nenastavena. Klíč nikdy nevkládej do chatu, souboru v repozitáři ani do evidence chyb. Text stránky pak odchází do Googlu: použij jen stránku, jejíž text smí být ukázán třetí straně (P01, P05, lokální stránky). |
| SP8 | V počítači je nainstalovaný lokální hlas pro jazyk shrnutí (macOS: např. Zuzana pro češtinu). Bez něj se testuje jen M3-30 a M3-31. |

Sada stránek (kódy F, P01–P06, W1, R04–R10) je v [`checklist-m2.md`](checklist-m2.md#sada-stránek-pro-ruční-kontroly); použij jen stránky, u kterých je automatizovaný přístup povolen.

## Scénáře

### A. Celý řetězec: preference → skrytí → shrnutí → přehrání

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M3-01 | SP1–SP6, SP8; P05 nebo P01 (pilotní stránka), pak F `hider.html` | 1. Otevři stránku a ulož `window.__zf` (SP5).<br>2. Otevři popup, zapni „Válka“ a „Toxický/vyhrocený tón“; zavři a znovu otevři popup.<br>3. Klikni na Analyzovat.<br>4. V panelu Shrnutí klikni na „Shrnout viditelný obsah“.<br>5. Klikni na Přehrát, pak Pozastavit, Pokračovat, Zastavit.<br>6. Klikni na Zobrazit vše a porovnej stránku se SP5. | Krok 2: přepínače zůstaly zapnuté. Krok 3: stav „Skryté bloky: N z M.“, boxy „Skryto: …“ jen u zapnutých témat a tónu, text ostatních bloků beze změny. Krok 4: štítek „Použité nastavení: …“, „Vynechaná témata: …“, „Shrnutí je záměrně neúplné: skrytý obsah v něm není.“, text, odkaz na původní stránku, model (`stub`/atrapa: `gemini/<model>`). Krok 5: označení „Syntetický hlas · shrnutí napsal stroj“ je vidět před prvním kliknutím; čte se jen shrnutí; po Zastavit status „Zastaveno.“. Krok 6: `[data-zenfeed-hidden]` = 0, žádný box, `document.body.innerHTML === window.__zf`; panel Shrnutí se vrátil na „Shrnout viditelný obsah“ a čtení se zastavilo. | proposal §4.1 #1–#4, §4.2; mvp F1–F4 | ZF-18, ZF-10, ZF-30, ZF-17 | e2e (atrapa, ztlumený hlas) | | | | | |
| M3-02 | SP1–SP5, SP7, SP8; P05 nebo P01; **jen když člověk dal klíč do lokálního prostředí a výslovně o běh stojí**, jinak N/A | Jako M3-01 kroky 1–5, backend se skutečným klíčem. | Jako v M3-01; navíc `model_version` je `gemini/<model>` (ne atrapa), shrnutí je v jazyce zvoleném v panelu, nezmiňuje skrytá témata a nepřidává informace, které na stránce nejsou. Posuzuje se jen to, jestli shrnutí nemluví o skrytém tématu a nepřidává uklidňující obsah (`summarize.md`); kvalita stylu se nehodnotí. | proposal §4.1 #3, §4.2 | ZF-15, ZF-18 | ne | | | | | |
| M3-03 | SP1–SP6; stránka P06 (deklaruje `lang="en"`) | 1. Zapni „Válka“, klikni na Analyzovat, otevři panel Shrnutí.<br>2. Zkontroluj výchozí jazyk, změň jej na češtinu a klikni na Shrnout.<br>3. `curl http://127.0.0.1:8090/__fake/last`. | Výchozí jazyk je angličtina (podle `<html lang>`), po změně čeština; v poslední žádosti je `language` podle volby a v systémové instrukci „Write the summary in Czech“. (`summary-panel.md`) | proposal §4.1 #3 | ZF-30 | e2e (jazyk v požadavku) | | | | | |

### B. Opakování scénářů z M2, které se mohou pokazit

Kroky a očekávaný výsledek jsou v [`checklist-m2.md`](checklist-m2.md) pod uvedeným ID; tady se zapisuje jen výsledek tohoto buildu. Výběr: scénáře, kterých se dotkly změny po 13. 11. 2026 (box skrytého bloku a jeho šířka, počet skrytých po opakované analýze, shrnutí a hlas).

| ID | Opakuje | Co hlídá | Očekávaný výsledek (zkráceně, přesně v M2) | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-R01 | UI-02 | nic se nečte ani neposílá před kliknutím | Po otevření popupu nepřibude řádek `POST` v logu backendu; bez zvoleného přepínače Analyzovat nic neposílá. | e2e (`injectedBeforeClick`) | | | | | |
| M3-R02 | UI-04 | uložení přepínačů | Přepínače zůstanou po zavření popupu i po restartu prohlížeče. | node | | | | | |
| M3-R03 | UI-11 | počet boxů × `data-zenfeed-hidden` × „Skryté bloky“ | Jeden box na blok; blok s více prvky má víc `data-zenfeed-hidden` než boxů (B-001: zamýšlené chování, viz `evidence-chyb.md`); „Skryté bloky: N“ odpovídá boxům. | e2e (`hidden count … disagree`) | | | | | |
| M3-R04 | UI-12 | obalové bloky, tabulky, seznamy | Obalový blok se neskryje; text celého článku zůstává. | e2e, node | | | | | |
| M3-R05 | UI-22 | změna přepínače po analýze | Nic se neskryje ani neodkryje samo; Znovu skrýt není nabídnuto. | ne | | | | | |
| M3-R06 | UI-23 | Zobrazit u jednoho boxu | Box zmizí, blok je zpět beze změny, ostatní boxy zůstanou. | e2e | | | | | |
| M3-R07 | UI-24 | Zobrazit vše bez stopy | `document.body.innerHTML === window.__zf`, `[data-zenfeed-hidden]` = 0 (podrobně M3-40 až M3-42). | e2e | | | | | |
| M3-R08 | UI-25 | Znovu skrýt | Stejné bloky bez nového požadavku na backend. | e2e | | | | | |
| M3-R09 | UI-26 | stránka s CSP a `!important` | Skryje se i blok s `display … !important`; box má správnou velikost písma. | e2e | | | | | |
| M3-R10 | UI-35 (druhá analýza) a B-002 | opakovaná analýza nad už skrytými bloky | Po druhé analýze popup hlásí „Skryté bloky: N z M“ se stejným N jako po první, ne 0 (oprava B-002). | node (`popup-status.test.mjs`) | | | | | |
| M3-R11 | UI-28 | backend neběží | „Server ZenFeed neběží …“, nic se neskrylo. | node | | | | | |
| M3-R12 | UI-33, UI-34 | omezené stránky | `chrome://`, Web Store, `file://`: zpráva, že ZenFeed tam nefunguje; nic se neanalyzuje. | e2e | | | | | |
| M3-R13 | (nový po B-001/ZF-10) | šířka a odsazení boxu | Box má šířku a levý okraj bloku (i v mřížce a flexu); po změně velikosti okna se přizpůsobí. | e2e (`hider-browser.mjs`) | | | | | |

### C. Shrnutí: každá odpověď

Předpoklady všech řádků: SP1–SP6; F `hider.html` (nebo P05), zapnutá „Válka“, analýza proběhla. Mezi řádky přepni režim atrapy (SP6) a klikni na „Shrnout“ (resp. „Zkusit znovu“). Při každé chybě musí filtrování fungovat dál: boxy zůstávají a „Zobrazit vše“ funguje.

| ID | Režim atrapy → odpověď backendu | Kroky | Očekávaný výsledek | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-10 | `ok` → 200 | Klikni na Shrnout. | Viz M3-01 krok 4: štítek s použitým nastavením a vynechanými tématy, text, odkaz, model; zobrazí se přehrávač. Tlačítko se změní na „Shrnout znovu“. | e2e | | | | | |
| M3-11 | `insufficient` → 200 s `insufficient_input` | Klikni na Shrnout. | „Ve viditelné části stránky nezůstalo dost textu ke shrnutí.“ Štítek zůstává, žádný text shrnutí, žádný přehrávač. | e2e | | | | | |
| M3-12 | `no_relevant` → 200 s `no_relevant_content` | Klikni na Shrnout. | „Ve viditelné části stránky není nic, co by stálo za shrnutí.“ Štítek zůstává, žádný text shrnutí. | e2e | | | | | |
| M3-13 | `rate_limited` → 429 | Klikni na Shrnout. | „Bezplatný limit pro shrnutí je vyčerpaný. Zkuste to později. Filtrování funguje dál.“ Tlačítko „Zkusit znovu“. | e2e | | | | | |
| M3-14 | `unavailable` → 503 `summary_unavailable` | Klikni na Shrnout. | „Shrnutí teď není k dispozici (model není nastavený nebo neodpovídá). Filtrování funguje dál.“ | e2e | | | | | |
| M3-15 | `timeout` → 504 `timeout` | Klikni na Shrnout. | „Shrnutí nedorazilo včas. Zkuste to znovu.“ (Atrapa vrací 504 hned; čekání 30 s na neodpovídající server tu není.) | e2e | | | | | |
| M3-16 | `blocked` (Gemini zablokuje odpověď, bez obsahu) → 503 `summary_unavailable` | Klikni na Shrnout. | Stejná zpráva jako M3-14 (`summarize.md`: odpověď zablokovaná bezpečnostním nastavením je `summary_unavailable`). Zvláštní zpráva pro blokaci v dokumentaci není, viz otevřená otázka 2. | e2e | | | | | |
| M3-17 | po M3-13 až M3-16 režim `ok` | Klikni na „Zkusit znovu“. | Shrnutí se zobrazí jako v M3-10. | e2e | | | | | |
| M3-18 | backend bez klíče (`ZENFEED_AI_API_KEY` nenastaven, atrapa se nepoužije) | Spusť backend bez klíče, klikni na Shrnout. | `503` → zpráva jako M3-14. Žádné „záložní“ shrnutí se nevymyslí. (`summarize.md`) | pytest | | | | | |
| M3-19 | `ok`, 0 viditelných bloků: F `mostly-war.html`, zapnutá „Válka“ | Po analýze klikni na Shrnout. | „Po skrytí nezůstal žádný viditelný obsah, takže není co shrnout. ZenFeed nic nedoplňuje.“ Do atrapy nic nedošlo (`/__fake/last` je prázdné). | e2e | | | | | |
| M3-20 | `ok`, krátký text: stránka, na které po skrytí zůstane méně než 200 znaků viditelného textu | Klikni na Shrnout. | Backend model nevolá (`/__fake/last` je prázdné) a odpoví `insufficient_input`; zpráva jako M3-11. (`summarize.md` bod 2) | pytest | | | | | |
| M3-21 | `ok`, text skrytého bloku | Po skrytí klikni na Shrnout a `curl http://127.0.0.1:8090/__fake/last`. | V poslední žádosti (pole `blocks`) není text žádného skrytého bloku; obalové bloky skrytého bloku se neposílají a panel řekne, kolik jich vynechal. Žádost je bez URL stránky, cookies a titulku stránky (bloky mají jen svůj nadpis `title`). | e2e (`leaked`) | | | | | |

### D. Přehrávání (ruční, se skutečným hlasem)

Předpoklady: SP8 a shrnutí zobrazené jako v M3-10 (atrapa stačí). Zvuk se ověřuje poslechem; automatický test hlas ztlumí.

| ID | Předpoklady | Kroky | Očekávaný výsledek | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-30 | před prvním přehráním | Podívej se na panel, nic neklikej. | Označení „Syntetický hlas · shrnutí napsal stroj“ (i u anglického shrnutí česky) je vidět bez interakce; nad tlačítkem je „Uslyšíte syntetický hlas. Čte strojově vytvořené shrnutí, ne původní text stránky.“ Žádné jméno postavy ani herce. (`voice-player.md`, `hlas-a-oznaceni.md` varianta C) | e2e, node | | | | | |
| M3-31 | | Klikni na Přehrát. | Status „Připravuji hlas…“, pak „Přehrávám syntetickým hlasem (<název hlasu>).“; slyšíš text shrnutí (ne text stránky) lokálním hlasem; nabízí se Pozastavit a Zastavit. | e2e (ztlumeně), node | | | | | |
| M3-32 | probíhá čtení | Klikni na Pozastavit, potom Pokračovat. | „Pozastaveno.“ a tlačítko „Pokračovat“; po kliknutí čtení pokračuje od místa přerušení. | e2e (ztlumeně), node | | | | | |
| M3-33 | probíhá čtení | Klikni na Zastavit, pak znovu Přehrát. | „Zastaveno.“, zvuk okamžitě skončí, tlačítko „Přehrát“; nové přehrání začíná od začátku shrnutí. | e2e (ztlumeně), node | | | | | |
| M3-34 | | Nech dočíst do konce. | „Dočteno.“ a tlačítko „Přehrát znovu“. | e2e (ztlumeně) | | | | | |
| M3-35 | | Zkus změnit rychlost čtení. | **UNSPECIFIED:** dokumentace uvádí pevnou rychlost 0,9 a výšku 0,9 a žádný ovladač rychlosti; ve vyskakovacím okně žádný není. Zapiš, co vidíš a jak čtení zní (otevřená otázka 1). | ne | | | | | |
| M3-36 | probíhá čtení | Během čtení klikni na Shrnout znovu; podruhé spusť novou analýzu; potřetí přepni přepínač tématu; počtvrté zavři popup. | Pokaždé čtení okamžitě skončí (nový text shrnutí, nová analýza, změna přepínače, zavření panelu). | ne (`node` jen pro jednotku přehrávače) | | | | | |
| M3-37 | probíhá čtení | Klikni na Zobrazit vše. | Čtení se zastaví, panel Shrnutí se vrátí na „Shrnout viditelný obsah“ (stav popupu se vymění, `popup.js` `setCurrent`). | ne | | | | | |

#### Záložní chování hlasu (fallback)

| ID | Předpoklady | Kroky | Očekávaný výsledek | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-38 | počítač **bez lokálního** hlasu pro jazyk shrnutí (nebo jazyk shrnutí, pro který hlas není: přepni jazyk v panelu) | Klikni na Přehrát. | Do cca 2 s zpráva „V počítači není nainstalovaný český (resp. anglický) hlas, který běží bez internetu. Shrnutí si můžete přečíst.“ Shrnutí zůstává na obrazovce. Nepoužije se vzdálený (cloudový) hlas. | e2e (simulace bez hlasů), node | | | | | |
| M3-39 | prohlížeč bez `speechSynthesis` (na jiném počítači) **nebo** simulace: ve vyskakovacím okně otevři DevTools a před Shrnout spusť v konzoli `Object.defineProperty(globalThis, "speechSynthesis", { value: undefined })` | Klikni na Shrnout, pak na Přehrát. | „Tento prohlížeč neumí číst text nahlas. Shrnutí si můžete přečíst.“ Shrnutí zůstává. Pokud simulace nejde provést, zapiš Blocked s důvodem; chybu `speech_failed` ručně vyvolat nejde (kryje ji `voice.test.mjs`). | node | | | | | |

### E. Okrajové stavy (ZF-28)

Přesné kroky a znění jsou v [`checklist-m2.md`](checklist-m2.md); v M3 se jen znovu ověřuje, že po ZF-30 a ZF-17 nic nepřestalo platit a že se při nich **nic neodesílá** (log backendu bez nového `POST`).

| ID | Opakuje | Stránka | Očekávaný výsledek (zkráceně) | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-50 | UI-05 | F `empty.html` | „Na stránce jsem nenašel žádný čitelný obsah. Nic se neodeslalo ani neskrylo.“ Panel Shrnutí se neukáže. | node, e2e | | | | | |
| M3-51 | UI-06 | F `no-title.html`, `editable.html` | Zpráva o příliš malém množství textu; nic se neodeslalo. | node | | | | | |
| M3-52 | UI-07 | F `single-block.html`, `html-title.html` | Jediný blok se sám neskryje (režim kontroly); „Přesto skrýt“ ho skryje, „Zobrazit vše“ vrátí. Panel Shrnutí po „Přesto skrýt“ by měl hlásit, že není co shrnout (0 viditelných bloků; odvozeno z `popup.js`, v dokumentaci není, zapiš, co se stalo). | e2e | | | | | |
| M3-53 | UI-08 | F `mostly-war.html` | Skryjí se válečné články, zpráva obsahuje „Po skrytí na stránce …“ a nic se nedoplní; Shrnout hlásí M3-19. | e2e | | | | | |
| M3-54 | UI-09 | W1, F `long-block.html` | Poznámka o dlouhé stránce / dlouhém bloku; zbytek stránky beze změny. | node, e2e | | | | | |
| M3-55 | UI-10 | P03, P06 nebo P02 | Když nic neodpovídá: „Nic na stránce neodpovídá zvoleným tématům ani tónu.“, žádné boxy. | node (`popup-status.test.mjs`) | | | | | |
| M3-56 | UI-21 | W1 | „Nejisté, ponechané viditelné: N“; bloky `review` zůstávají viditelné a bez boxu. | e2e | | | | | |

### F. „Zobrazit vše“ nezanechá stopu

Pevné pravidlo (`mvp.md`): po Zobrazit vše je stránka v původním stavu. Kontroluj po každém z řádků, i když byl před tím spuštěn přehrávač a shrnutí.

| ID | Předpoklady | Kroky | Očekávaný výsledek | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-40 | SP5 uložené před analýzou; F `hider.html`; zapnuté všechny přepínače | 1. Analyzovat.<br>2. Shrnout, Přehrát.<br>3. Zobrazit vše.<br>4. V konzoli stránky: `document.body.innerHTML === window.__zf`, `document.querySelectorAll('[data-zenfeed-hidden], [data-zenfeed-box]').length` a `document.adoptedStyleSheets.filter(s => [...s.cssRules].some(r => r.cssText.includes('data-zenfeed-hidden'))).length` (stejná definice stopy jako v `popup-e2e.mjs`). | Výrazy vrátí `true`, `0` a `0`: žádný značkovací atribut, box ani pravidlo skrytí ve stylech stránky. Stránka vypadá jako před analýzou. | e2e (`traces`, `blockElementsChanged`) | | | | | |
| M3-41 | stejné jako M3-40, stránka P05 nebo W1 (dlouhá, vnořené bloky) | Totéž; navíc po Zobrazit vše klikni na Analyzovat podruhé a znovu Zobrazit vše. | Po obou Zobrazit vše stejný výsledek jako M3-40; druhá analýza skryje stejné bloky jako první (pokud se stránka mezitím nezměnila). | e2e | | | | | |
| M3-42 | po M3-40 | Zavři a znovu otevři popup a podívej se na stránku. | Stránka zůstává v původním stavu; popup nic nepamatuje o skrytých blocích (po otevření je třeba znovu Analyzovat). V `chrome.storage.local` zůstává jen `zenfeed.preferences` a `zenfeed.lastAnalysis` (ID karty, ID extrakce, přepínače), žádný text stránky ani adresa (`audit-soukromi.md` bod 9). | ne | | | | | |
| M3-43 | přehrávač čte, F `hider.html` | Klikni na Zobrazit vše. | Hlas ihned skončí (viz M3-37) a na stránce není nic, co by zbylo z přehrávání nebo shrnutí (panel Shrnutí je jen ve vyskakovacím okně, ne na stránce). | ne | | | | | |
| M3-44 | R04 nebo jiná stránka s `review` bloky | Analyzovat, Přesto skrýt, Zobrazit vše. | Bloky `review` se bez „Přesto skrýt“ nikdy neskryjí; po Zobrazit vše stránka jako původní. | e2e | | | | | |

### G. Soukromí (ruční kontrola, doplňuje [`audit-soukromi.md`](audit-soukromi.md))

| ID | Předpoklady | Kroky | Očekávaný výsledek | Aut. | Výsledek | Datum | Tester | Build | Bug |
|---|---|---|---|---|---|---|---|---|---|
| M3-60 | SP1–SP6; log backendu a atrapy viditelný v terminálu | 1. Otevři stránku a popup, nic neklikej.<br>2. Změň přepínač.<br>3. Klikni na Analyzovat.<br>4. Klikni na Shrnout. | Kroky 1 a 2: v logu žádný nový řádek `POST`. Krok 3: `POST /v1/analyze`. Krok 4: `POST /v1/summarize`, teprve potom atrapa dostane požadavek. | e2e (`injectedBeforeClick`) | | | | | |
| M3-61 | po M3-60 | `curl http://127.0.0.1:8090/__fake/last` | Požadavek na „Gemini“ je JSON bez URL stránky, bez titulku stránky, bez cookies; `key_in_header` je `true` a klíč není nikde v těle. | e2e | | | | | |
| M3-62 | po M3-60 | Otevři terminál backendu a soubor logu atrapy; hledej slovo z textu stránky a (u atrapy) řetězec `fake-key-for-e2e`. | Ani v logu backendu ani v terminálu: žádný text stránky, žádný klíč. Řádky obsahují jen počty bloků, příznaky a délku shrnutí. | e2e (grep jen na `fake-key-for-e2e`, `HIDE-WAR`, `harvest`) | | | | | |
| M3-63 | M3-02 provedeno | Přečti text nad tlačítkem Shrnout a pod Analyzovat. | Uživatel se před odesláním dozví, že text bloků odejde **také do služby Google Gemini** (bezplatná úroveň, Google ho smí použít ke zlepšování produktů, `rozhodnuti-zf-25.md`). Text má znít jako v `popup.html:48` po opravě B-003 (17. 11. 2026); zkontroluj, že se vejde do okna a nic nepřetéká. | ne | | | | | |

## Otevřené otázky

Nic z toho jsem nerozhodl; očekávaný výsledek je v tabulkách buď převzatý z dokumentace, nebo označený UNSPECIFIED.

1. **Rychlost čtení (M3-35).** Zadání M3 uvádí mezi scénáři přehrávání „speed“. `voice-player.md` i kód mají pevnou rychlost 0,9 a ovladač rychlosti neexistuje. Chce tým ovladač rychlosti, nebo je pevná rychlost záměr a „speed“ se jen ověřuje jako 0,9 (kryje `voice.test.mjs`)?
2. **Blokované odpovědi (M3-16).** Odpověď zablokovaná bezpečnostním nastavením Gemini končí jako `503 summary_unavailable` a uživatel vidí „model není nastavený nebo neodpovídá“. `summary-panel.md` pro blokaci vlastní zprávu nemá. Je to záměr?
3. **Příznak jazyka na stránkách se špatným `lang` (M3-03).** P06 deklaruje `lang="en"`, přestože je česká; výchozí jazyk shrnutí je proto angličtina. Je to přijatelné, nebo má výchozí jazyk vycházet z textu?

## Co jsem neověřil

- Žádný scénář jsem v prohlížeči neprovedl; očekávané výsledky jsou z dokumentace a ověřené proti kódu popupu, backendu a testů.
- U řádků označených `e2e` se spoléhám na to, že `popup-e2e.mjs --check` tu kontrolu dělá; spuštěn byl jen na lokálních stránkách v Chromiu v cloudu (viz odpověď k ZF-18), ne v Brave ani v desktopovém Chrome.
- Skutečný hlas, skutečný model a skutečný klik v desktopovém Chrome nejsou ověřeny.
