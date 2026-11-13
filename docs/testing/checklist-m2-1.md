# Regresní checklist M2 (ZF-13)

> **Stav:** návrh k použití pro milník M2 (MVP – Týden 2). Vznikl 13. 11. 2026 z dokumentace ve stavu `origin/main` (commit `5708c3d`, 11. 11. 2026). **Žádný výsledek zde není vyplněný**: scénáře nikdo neprovedl, sloupce Výsledek, Datum, Tester a Bug jsou prázdné. Chyby se zapisují do [`evidence-chyb.md`](evidence-chyb.md).
>
> **Týmová kontrola 13. 11. 2026:** tým přijal stránku P02, `tests/extension/analyze_stub.py` je zkontrolován a číselníky v `evidence-chyb.md` tým potvrdil. Tým potvrdil také stránku W1 a pravidlo pro neshodu klasifikace (otevřené otázky 8 a 10).

Zdroje pravdy pro očekávané výsledky: [`../mvp.md`](../mvp.md), [`../kategorie-mvp.md`](../kategorie-mvp.md), [`../hiding.md`](../hiding.md), [`../block-mapping.md`](../block-mapping.md), [`../popup.md`](../popup.md), [`../edge-states.md`](../edge-states.md), [`../summary-panel.md`](../summary-panel.md), [`../voice-player.md`](../voice-player.md), [`../API.md`](../API.md). Kde dokumentace chování neurčuje, stojí **UNSPECIFIED** a bod je v části [Otevřené otázky](#otevřené-otázky). Kód jsem četl jen k ověření dokumentace; rozpory jsou v otevřených otázkách.

## Jak checklist používat

- Výsledek zapiš jedním slovem: **Pass** (očekávaný výsledek nastal), **Fail** (nenastal, založ chybu v `evidence-chyb.md` a napiš její ID), **Blocked** (scénář nejde provést, napiš důvod), **N/A** (nevztahuje se na tento build nebo stránku, napiš důvod).
- Spouštěj v desktopovém Chrome s rozšířením načteným z `extension/`. Automatické testy z dokumentace běžely v headless Brave 156; desktopový Chrome se skutečným klikem nebyl otestován ([`../hiding.md`](../hiding.md), [`../popup.md`](../popup.md)).
- Tento checklist hodnotí **chování rozšíření** (skrytí, obnovení, chyby, zprávy), ne správnost klasifikace. Že klasifikátor zařadil blok jinak než anotace, není chyba UI; zapiš to do evidence jako poznámku s odkazem na ZF-06 nebo ZF-14 (pravidlo potvrdil tým 13. 11. 2026, viz [otevřené otázky](#otevřené-otázky)). Kvalitu klasifikace měří ZF-19 a ZF-20.
- **Jak číst log backendu:** skutečný backend (`uvicorn app.main:app`) vypisuje jen řádky uvicornu, např. `127.0.0.1:59460 - "POST /v1/analyze HTTP/1.1" 200 OK`. „Přišel požadavek“ znamená, že po akci přibyl nový řádek `POST /v1/analyze`; před akcí si poznamenej poslední řádek a po akci ho porovnej. Řádky mají jen port, ne čas ani adresu stránky.
- Čas odezvy tu není kritérium: dokumentace pro UI žádný časový limit nestanovuje (3 s a 10 s jsou pracovní předpoklady plánu).
- Sloupec **Aut.** říká, zda lze scénář automatizovat: `node` = pokryto jednotkovým testem `node --test tests/extension/*.test.mjs`; `e2e` = pokryto `tests/extension/hider-browser.mjs` nebo `popup-e2e.mjs`; `pytest` = backend; `později` = šlo by, dnes neexistuje; `ne` = z povahy věci ručně. V tomto úkolu se automatické testy nepíšou.

### Společné předpoklady

| Kód | Předpoklad |
|---|---|
| SP1 | Backend běží na `http://127.0.0.1:8000` (`GET /health` vrací `{"status":"ok"}`). |
| SP2 | Rozšíření je načtené z `extension/` (Developer mode, Load unpacked) a po poslední změně znovu načtené. |
| SP3 | Všechny přepínače v popupu jsou vypnuté (výchozí stav). |
| SP4 | Lokální stránky běží: `python3 -m http.server 8765 --directory tests/extension/fixtures`; otevírají se jako `http://127.0.0.1:8765/<soubor>.html`. |
| SP5 | V DevTools stránky je k dispozici konzole; k ověření „beze změny“ se před prvním krokem uloží `window.__zf = document.body.innerHTML` a po kroku porovná `document.body.innerHTML === window.__zf`. Počet skrytých prvků: `document.querySelectorAll('[data-zenfeed-hidden]').length` (atribut je popsán v [`../hiding.md`](../hiding.md)). |

## Jak spustit backend a načíst rozšíření

Zkopírováno z [`../DEVELOPMENT.md`](../DEVELOPMENT.md), bez přepisování (původní je anglicky):

> ## Chrome Extension
>
> 1. Open `chrome://extensions`.
> 2. Enable Developer mode.
> 3. Click **Load unpacked**.
> 4. Select the `extension/` directory.
> 5. Reload the extension after changes and test it again.
>
> ## Backend
>
> Create a virtual environment:
>
> ```bash
> python -m venv .venv
> ```
>
> Activate it on Linux or macOS:
>
> ```bash
> source .venv/bin/activate
> ```
>
> Activate it on Windows PowerShell:
>
> ```powershell
> .venv\Scripts\Activate.ps1
> ```
>
> Install dependencies, including the lint and test tools (`requirements-dev.txt` includes `requirements.txt`):
>
> ```bash
> pip install -r backend/requirements-dev.txt
> ```
>
> Start the API from the repository root:
>
> ```bash
> uvicorn app.main:app --app-dir backend --reload
> ```
>
> `GET http://127.0.0.1:8000/health` returns `{"status":"ok"}`. The extension popup calls this address (port 8000), so keep the default port when using the extension.

Backend se spouští bez klíče; pro tento checklist se žádné klíče ani `.env` nepoužívají.

Pomocné příkazy popsané v dokumentaci (nejsou součástí DEVELOPMENT.md):

| Účel | Příkaz | Zdroj |
|---|---|---|
| Lokální testovací stránky (SP4) | `python3 -m http.server 8765 --directory tests/extension/fixtures` | [`../popup.md`](../popup.md) |
| Stub pro `/v1/summarize` (nahrazuje backend na portu 8000, zastav nejdřív skutečný backend) | `PYTHONPATH=backend uvicorn summary_stub:app --app-dir tests/extension --port 8000` | [`../summary-panel.md`](../summary-panel.md) |
| Přepnutí režimu stubu | `curl -X POST http://127.0.0.1:8000/__stub/mode -H 'Content-Type: application/json' -d '{"mode":"unavailable"}'` (režimy `ok`, `insufficient`, `no_relevant`, `not_served`, `unavailable`, `rate_limited`, `timeout`) | `tests/extension/summary_stub.py` |
| Poslední požadavek stubu | `curl http://127.0.0.1:8000/__stub/last` | `tests/extension/summary_stub.py` |
| Krátký timeout analýzy (jen pro UI-30) | `ZENFEED_ANALYZE_TIMEOUT_SECONDS=0.001 uvicorn app.main:app --app-dir backend` | [`../API.md`](../API.md), `backend/app/config.py` |
| Stub pro `/v1/analyze` (jen UI-29, UI-31, UI-32; nahrazuje backend na portu 8000, zastav nejdřív skutečný backend a stub pro shrnutí) | `PYTHONPATH=backend uvicorn analyze_stub:app --app-dir tests/extension --port 8000` | `tests/extension/analyze_stub.py` (pomocný testovací soubor, v dokumentaci projektu zatím není) |
| Přepnutí režimu stubu analýzy | `curl -X POST http://127.0.0.1:8000/__stub/mode -H 'Content-Type: application/json' -d '{"mode":"status_500"}'` (režimy `ok`, `status_422`, `status_500`, `timeout_504`, `fail_second_request`, `reset_counter`; změna režimu vynuluje počítadlo) | `tests/extension/analyze_stub.py` |
| Počítadlo a poslední požadavky stubu analýzy | `curl http://127.0.0.1:8000/__stub/last` (počet požadavků, u každého počet bloků, první a poslední ID bloku a vrácený status; žádný text) | `tests/extension/analyze_stub.py` |

Do pole „build/commit“ v `evidence-chyb.md` zapisuj výstup `git rev-parse --short HEAD` v den testu.

## Sada stránek pro ruční kontroly

Použité jsou jen stránky, u kterých `docs/testing/pilot/stranky.md` nebo `rozsireni-zdroje.md` uvádí **povoleno**. **BBC je vyloučena.** Zdroje s podmínkami „neurčeno“ (UN News, abclinuxu.cz, Lemmy, Stack Exchange) a vyřazené stránky (root.cz, Hacker News, iROZHLAS, ČT24, lupa.cz) se nepoužívají. Anotace bloků u R-stránek jsou v `docs/testing/pilot/anotace-rozsireni.csv` a slouží jen jako orientace, které bloky patří do jakého tématu; nejsou výstupem klasifikátoru.

| Kód | Stránka | Použití | Poznámka |
|---|---|---|---|
| F | Lokální stránky z `tests/extension/fixtures/`: `hider.html`, `hider-csp.html`, `empty.html`, `no-title.html`, `editable.html`, `single-block.html`, `html-title.html`, `mostly-war.html`, `long-block.html`, `segmentation.html` | okrajové stavy, skrytí, obnovení | vlastní soubory projektu, stabilní |
| P01 | https://ourworldindata.org/war-and-peace | válka, obalové bloky, obnovení | CC BY; stránka se po skrytí sama dotahuje (viz UI-24) |
| P02 | https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons | komentáře, „nic neodpovídá“ | v `stranky.md` **povoleno s výhradou** (§7 podmínek CEA nebyl přečten); tým stránku přijal 13. 11. 2026 |
| P03 | https://www.nasa.gov/news/recently-published/ | výpis karet, „nic neodpovídá“ | povoleno; výpis je nestabilní |
| P04 | https://ourworldindata.org/latest?type=data-insight | dynamický obsah („Show more“) | povoleno; podle `summary-panel.md` (11. 11. 2026) se dnes vykresluje jen patička (125 znaků), proto tam, kde se „Show more“ nezobrazí, zapiš N/A |
| P05 | https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905 | hluboké vnoření, obalové bloky, válka | CC BY-SA, trvalý odkaz |
| P06 | https://www.horydoly.cz/jidlo-a-piti/vejce-losos-i-mleko-kultivovane-potraviny-si-razi-cestu-na-pulty-obchodu.html | česká stránka | CC BY 3.0 CZ; deklaruje `lang="en"`, výchozí jazyk shrnutí je proto angličtina (`summary-panel.md`) |
| W1 | https://cs.wikipedia.org/wiki/Globální_oteplování | dlouhá stránka (400 bloků), nejisté bloky | Wikipedie, stejné podmínky Wikimedia (CC BY-SA) jako P05 a R04–R10; samostatný záznam v `stranky.md` chybí; tým stránku potvrdil 13. 11. 2026 (otevřená otázka 10) |
| R04 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_24 | válka, politické konflikty, násilí, úmrtí | denní stránka; anotace R04: válka 2, násilí 7, katastrofy 2, úmrtí 2, politické konflikty 4 |
| R09 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_9 (revize 1380392089) | katastrofické scénáře | anotace R09: katastrofy 2, politické konflikty 3, násilí 3 |
| R10 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_20 (revize 1383412239) | politické konflikty, katastrofy | anotace R10: politické konflikty 4, katastrofy 3, úmrtí 3 |
| R05 | https://en.wikipedia.org/wiki/Deaths_in_2026 (oldid 1383725904), sekce November → 3 | zprávy o úmrtí | anotace R05: 9 bloků úmrtí |
| R06 | https://en.wikipedia.org/w/index.php?title=Wikipedia:Arbitration/Requests/Enforcement&oldid=1383726700 | tón | anotace R06: 3 hraniční `toxický/vyhrocený`, 3 neutrální |

Jasné příklady vyhroceného tónu (R08) nejsou jedna stránka, ale výběr komentářů z různých diskusních stránek s trvalými odkazy; pro ruční test tónu je nepoužívej jako stránku a drž se R06.

Počty bloků a skrytých bloků v dokumentaci jsou z jednoho konkrétního dne a z klasifikátoru `lexicon-1`; tento checklist je proto nepoužívá jako očekávané hodnoty (výjimka: lokální stránky).

## Scénáře

### A. Načtení stránky a první spuštění

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-01 | SP1–SP4; stránka F `hider.html` | 1. Otevři stránku.<br>2. Klikni na ikonu ZenFeed. | Popup ukáže pět přepínačů „Skrýt témata“ (Válka, Politické konflikty, Zprávy o úmrtí, Katastrofické scénáře, Násilí), přepínač pro `jiné` chybí. Zvlášť je „Skrýt tón“ s přepínačem „Toxický/vyhrocený tón“ a hint, že téma a tón jsou dvě různé volby. Je vidět upozornění, že se text bloků posílá na server na tomto počítači (127.0.0.1) a že se neposílá adresa, cookies ani přihlašovací údaje. Všechny přepínače jsou vypnuté. Viditelné je jen tlačítko Analyzovat (Zobrazit vše, Znovu skrýt, Přesto skrýt a Zkusit znovu jsou skryté). (`popup.md`, `kategorie-mvp.md`) | proposal §4.1 #1, §4.2; mvp F1 | ZF-11 | později | Pass | 2026-11-13 | Libuše | |
| UI-02 | SP1–SP4; F `hider.html`; sleduj výpis backendu | 1. Otevři popup a nic nekliknu; v terminálu backendu zkontroluj, že nepřišel žádný požadavek.<br>2. Při vypnutých přepínačích klikni na Analyzovat. | Před kliknutím se nic nečte ani neposílá. Po kliknutí bez zvoleného přepínače popup jen požádá o výběr („Vyberte aspoň jedno téma nebo tón, který chcete skrýt.“), do stránky se nic nevkládá a na backend nic neodejde (v terminálu backendu nepřibyl nový řádek `POST /v1/analyze`). (`popup.md`) | proposal §4.2 (dobrovolnost, nic bez akce uživatele); mvp „Zpracování spouští uživatel“ | ZF-11, ZF-29 | později | Pass | 2026-11-13 | Libuše | |
| UI-03 | SP1–SP4; stránka P01 nebo F `segmentation.html`; stránka plně načtená | 1. Otevři stránku a počkej na načtení.<br>2. V popupu zapni „Válka“.<br>3. Klikni na Analyzovat.<br>4. Varianta: otevři P05 a klikni na ikonu dřív, než se stránka načte. | Kroky 1–3: stav „Skryté bloky: N z M.“ (případně „Nejisté, ponechané viditelné: …“ a „Nešlo bezpečně skrýt, ponechané viditelné: …“); v souhrnu je název stránky, počet bloků a počet skrytých; je nabídnuto Zobrazit vše; místo každého skrytého bloku je box „Skryto: válka — Zobrazit“. Krok 4: zpráva „ZenFeed k této stránce nemá přístup. Počkejte, až se stránka načte, zavřete tento panel a klikněte na ikonu ZenFeed znovu.“; po načtení stránky a novém kliknutí analýza proběhne. (`popup.md`, `hiding.md`, `extension-bootstrap.md`) | proposal §4.1 #2; mvp F2 | ZF-10, ZF-11 | e2e | Pass | 2026-11-13 | Libuše | |
| UI-04 | SP1–SP4; SP3 | 1. Zapni „Válka“ a „Toxický/vyhrocený tón“.<br>2. Zavři popup, otevři jej na jiné stránce.<br>3. Restartuj Chrome a otevři popup znovu. | Přepínače zůstanou zapnuté po zavření popupu i po restartu prohlížeče; bez změny jsou ostatní vypnuté. (`popup.md`) | proposal §4.1 #1 (preference uložené a znovupoužitelné); mvp F1 | ZF-11 | node (`preferences.test.mjs`), e2e | Pass | 2026-11-13 | Libuše | |

### B. Prázdný nebo málo obsahu

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-05 | SP1–SP5; F `empty.html`; zapnutá „Válka“ | 1. Otevři stránku.<br>2. Klikni na Analyzovat. | „Na stránce jsem nenašel žádný čitelný obsah. Nic se neodeslalo ani neskrylo.“ Do backendu nic neodešlo, stránka beze změny. (`edge-states.md`) | proposal §4.1 #5; mvp F5 | ZF-28 | node (`page-quality.test.mjs`), e2e | Pass | 2026-11-13 | Libuše | |
| UI-06 | SP1–SP5; F `no-title.html` (115 znaků), pak F `editable.html` (196 znaků, obsahuje rozepsané texty v `contenteditable` a `textarea`); zapnutá „Válka“ | 1. Otevři `no-title.html`, klikni na Analyzovat.<br>2. Totéž na `editable.html`.<br>3. V logu backendu zkontroluj, že nepřišel žádný požadavek. | Obě stránky: „Na stránce je jen velmi málo čitelného textu (znaky: N). ZenFeed ho neposlal k analýze a nic neskryl.“ Nic se nepošle; rozepsané texty z editovatelných polí se nesegmentují ani neposílají. (`edge-states.md`, `block-mapping.md`) | proposal §4.1 #5, §4.2; mvp F5 | ZF-28, ZF-09, ZF-29 | node, e2e | Pass | 2026-11-13 | Libuše | |
| UI-07 | SP1–SP5; F `single-block.html` (válka, jeden blok), pak F `html-title.html` (jeden blok bez shody); zapnutá „Válka“ | 1. Na `single-block.html` klikni na Analyzovat.<br>2. Klikni na Přesto skrýt.<br>3. Klikni na Zobrazit vše.<br>4. Na `html-title.html` klikni na Analyzovat. | Krok 1: blok zůstane viditelný, zpráva „ZenFeed stránku nerozdělil na samostatné části: celý text je jeden blok. Odpovídá vašemu nastavení, ale jeho skrytím by zmizela celá stránka, proto zůstal viditelný. Můžete ho přesto skrýt.“ a tlačítko Přesto skrýt. Krok 2: blok se skryje a zpráva uvede, že nezůstal téměř žádný obsah. Krok 3: blok je zpět. Krok 4: „…Neodpovídá zvoleným tématům ani tónu; nic se neskrylo.“ (`edge-states.md`) | proposal §4.1 #5, §4.2 (vratnost); mvp F2, F5 | ZF-28 | node, e2e | Pass | 2026-11-13 | Libuše | |
| UI-08 | SP1–SP5; F `mostly-war.html`; zapnutá „Válka“ | 1. Klikni na Analyzovat.<br>2. Zkontroluj, že se na stránku nic nedopsalo.<br>3. Klikni na Zobrazit vše. | Skryté jsou články, které klasifikátor zařadí do války (ZF-28 test 6. 11. 2026: 4 ze 4 s `lexicon-1`), zpráva obsahuje „Po skrytí na stránce nezůstal téměř žádný obsah (viditelný text: X %). ZenFeed nic nedoplňuje; celou stránku zobrazíte tlačítkem Zobrazit vše.“ Na stránce není žádný přidaný text ani náhradní obsah. Zobrazit vše vrátí všechny články. (`edge-states.md`) | proposal §4.1 #5; mvp F2, F5 („vynechané téma se nenahrazuje smyšleným obsahem“) | ZF-28 | node, e2e | Pass | 2026-11-13 | Libuše | |
| UI-09 | SP1–SP5; W1 (dlouhá stránka), pak F `long-block.html`; zapnuté všechny přepínače | 1. Na W1 klikni na Analyzovat.<br>2. Na `long-block.html` klikni na Analyzovat. | W1: poznámka „Stránka je dlouhá: zpracovalo se prvních 400 bloků, zbytek stránky zůstal beze změny.“ `long-block.html`: poznámka „Velmi dlouhé bloky se posuzovaly jen podle začátku textu (bloky: N).“ (`edge-states.md`) | proposal §4.1 #5; mvp F5 | ZF-28 | node, e2e | Pass | 2026-11-13 | Libuše | |
| UI-10 | SP1–SP5; stránky P03, P06 nebo P02; zapnuté všechny přepínače | 1. Klikni na Analyzovat.<br>2. Zkontroluj stránku a počet `[data-zenfeed-hidden]`. | Pokud klasifikátor neoznačí žádný blok ke skrytí: „Nic na stránce neodpovídá zvoleným tématům ani tónu.“, žádné boxy, `data-zenfeed-hidden` = 0, stránka beze změny (`document.body.innerHTML === window.__zf`). Pokud se něco skryje, přejdi na scénáře skupiny D (očekávaný počet dokumentace neurčuje). (`edge-states.md`, `popup.md`) | proposal §4.1 #5, §4.2; mvp F5 | ZF-28, ZF-11 | e2e | Pass | 2026-11-13 | Libuše | |

### C. ID bloků a mapování na DOM

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-11 | SP1–SP5; stránka s alespoň jedním skrytým blokem (P05 nebo W1); zapnuté všechny přepínače | 1. Klikni na Analyzovat.<br>2. Spočítej viditelné boxy „Skryto: …“.<br>3. V konzoli zjisti `document.querySelectorAll('[data-zenfeed-hidden]').length`.<br>4. Porovnej s číslem „Skryté bloky: N“ ve stavu. | Počet boxů = počet prvků s `data-zenfeed-hidden` = N ve stavu (u dokumentovaných měření platilo na všech stránkách). Každý box je těsně před svým blokem a text bloku zůstává v DOM nezměněný. (`hiding.md`, `block-mapping.md`) | proposal §4.1 #2; mvp F2 | ZF-09, ZF-10 | e2e | Fail | 2026-11-13 | Libuše | B-001 |
| UI-12 | SP1–SP5; P01, P05 a F `hider.html` (obsahuje tabulku a seznam); zapnuté všechny přepínače | 1. Na P01 a P05 klikni na Analyzovat.<br>2. Zkontroluj, že text celého článku je stále vidět.<br>3. Na `hider.html` zkontroluj skrytí v tabulce a v seznamu. | Blok, jehož prvek obaluje jiné bloky (obal přes celou stránku), se neskryje a ve stavu je „Nešlo bezpečně skrýt, ponechané viditelné: N“ (měření 4. 11. 2026: P01 2, P05 3; číslo se může lišit). Buňky tabulky (`td`, `th`) se neskrývají; řádek tabulky (`tr`) lze skrýt a box má jednu buňku přes celý řádek; v seznamu je box jako `li`. (`hiding.md`, `block-mapping.md`) | proposal §4.2 (nesprávné skrytí je horší než nepodporovaná stránka); mvp F2 | ZF-09, ZF-10 | node, e2e | Pass | 2026-11-13 | Libuše | |
| UI-13 | SP1–SP5; W1 (400 bloků, požadavky po 100), zapnuté všechny přepínače | 1. Klikni na Analyzovat.<br>2. Okamžitě stránku znovu načti (F5) nebo na ní přejdi jinam.<br>3. Varianta: klikni na Analyzovat dvakrát těsně po sobě. | Výsledky se nepoužijí na jiný obsah: žádný blok na novém načtení nemá cizí box a žádný text stránky se nezměnil. Zpráva k zavřené nebo přesměrované kartě a k dvojitému kliknutí: **UNSPECIFIED** v dokumentaci (kód zná `tab_unavailable` a `stale_extraction`, viz otevřené otázky). Další dokumentované pravidlo: výsledky platí jen s `extractionId` aktuální extrakce. (`block-mapping.md`, `hiding.md`) | proposal §4.2; mvp „Pevná pravidla návrhu“ | ZF-09, ZF-12 | node (`block-registry.test.mjs`, `bootstrap.test.mjs`), e2e | Pass | 2026-11-13 | Libuše | |

### D. Skrývání podle preferencí (téma × tón)

Společné očekávání pro UI-14 až UI-19: skryté jsou jen bloky, které klasifikátor zařadí do **zapnutého** tématu (nebo tónu) a doporučí `hide`; box říká „Skryto: <téma>“; bloky jiných témat zůstávají; text bloků se nemění. Jestli klasifikátor trefil téma podle anotace, tu se nehodnotí. (`hiding.md`, `API.md`, `kategorie-mvp.md`)

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-14 | SP1–SP5; R04 nebo P05; zapnutá jen „Válka“ | 1. Klikni na Analyzovat.<br>2. Projdi boxy a ověř štítky. | Všechny boxy říkají „Skryto: válka“; bloky s jiným tématem (násilí, úmrtí, politické konflikty, jiné) zůstávají viditelné. | proposal §4.1 #1, #2; mvp F1, F2 | ZF-10, ZF-11, ZF-06 | e2e | | | | |
| UI-15 | SP1–SP5; R04 nebo R10; zapnuté jen „Politické konflikty“ | Jako UI-14. | Boxy „Skryto: politické konflikty“; nic jiného neskryto. | proposal §4.1 #1, #2; mvp F1, F2 | ZF-10, ZF-11, ZF-06 | e2e | | | | |
| UI-16 | SP1–SP5; R05 nebo R04; zapnuté jen „Zprávy o úmrtí“ | Jako UI-14. | Boxy „Skryto: zprávy o úmrtí“; nic jiného neskryto. (V `kategorie-mvp.md` patří sem i nehody s oběťmi a statistiky úmrtí.) | proposal §4.1 #1, #2; mvp F1, F2 | ZF-10, ZF-11, ZF-06 | e2e | | | | |
| UI-17 | SP1–SP5; R09 nebo R10; zapnuté jen „Katastrofické scénáře“ | Jako UI-14. | Boxy „Skryto: katastrofické scénáře“; nic jiného neskryto. | proposal §4.1 #1, #2; mvp F1, F2 | ZF-10, ZF-11, ZF-06 | e2e | | | | |
| UI-18 | SP1–SP5; R04 nebo R09; zapnuté jen „Násilí“ | Jako UI-14. | Boxy „Skryto: násilí“; nic jiného neskryto. | proposal §4.1 #1, #2; mvp F1, F2 | ZF-10, ZF-11, ZF-06 | e2e | | | | |
| UI-19 | SP1–SP5; R06 (hraniční tón) a R04 (věcné zprávy o válce); zapnutý jen „Toxický/vyhrocený tón“ | 1. Na R06 klikni na Analyzovat.<br>2. Na R04 klikni na Analyzovat se stejným nastavením. | R06: skryté bloky mají box „Skryto: toxický/vyhrocený tón“. R04: věcná zpráva o válce se při zapnutém jen tónu **neskryje** (téma a tón jsou dvě různé volby; negativní událost není automaticky toxický text). (`popup.md`, `API.md`, `mvp.md` F1) | proposal §4.1 #1; mvp F1 | ZF-10, ZF-11, ZF-06 | e2e | | | | |
| UI-20 | SP1–SP5; skrytý blok z UI-14 až UI-19 | 1. Klikni na „Proč byl tento obsah skryt?“ v boxu.<br>2. Klikni znovu.<br>3. Pokud na R06 nebo R04 existuje blok skrytý pro téma i tón, zkontroluj štítek. | Vysvětlení se rozbalí a sbalí; jmenuje jen to, co skrytí způsobilo, např. „Téma: válka (jistota 83 %). Tón: …“, a končí „Klasifikace je automatická a může se mýlit; text bloku nebyl změněn.“ Blok skrytý pro obě příčiny má štítek „Skryto: násilí · toxický/vyhrocený tón“ (tvar podle dokumentace; pokud takový blok na stránkách není, zapiš N/A). (`hiding.md`) | proposal §4.2 (transparentnost); mvp F2 | ZF-10 | node (`hider.test.mjs`), e2e | Pass | 2026-11-13 | Libuše | |
| UI-21 | SP1–SP5; W1; zapnuté všechny přepínače | 1. Klikni na Analyzovat.<br>2. Zkontroluj stav a stránku. | Stav obsahuje „Nejisté, ponechané viditelné: N“, pokud klasifikátor vrátil `review` (4. 11. 2026 na W1: 2). Tyto bloky zůstávají viditelné a bez boxu; nejistota nikdy neskrývá. (`hiding.md`, `popup.md`, `CLAUDE.md`) | proposal §4.1 #2; mvp F2 („při nejisté klasifikaci se automaticky neskrývá“) | ZF-10, ZF-06 | node, e2e | Pass | 2026-11-13 | Libuše | |
| UI-22 | SP1–SP5; F `hider.html`; zapnutá „Válka“, analýza proběhla a něco se skrylo | 1. Přepni jiný přepínač (např. zapni „Násilí“).<br>2. Zkontroluj nabídku tlačítek.<br>3. Klikni na Analyzovat. | Po změně přepínače se neskrývá ani neodkrývá nic samo a **Znovu skrýt** není nabídnuto; uživatel musí analyzovat znovu. Po novém Analyzovat odpovídá stránka novému nastavení. (`popup.md`) | proposal §4.1 #1; mvp F1 | ZF-11 | e2e | Pass | 2026-11-13 | Libuše | |

### E. Obnovení skrytých bloků

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-23 | SP1–SP5; F `hider.html`, zapnutá „Válka“, analýza proběhla (alespoň 2 skryté bloky) | 1. Klikni na **Zobrazit** v jednom boxu.<br>2. Zkontroluj ostatní boxy.<br>3. Klikni na Analyzovat znovu. | Krok 1: box zmizí, blok je zpět a bez změny. Krok 2: ostatní boxy zůstávají. Krok 3: ručně zobrazený blok se po nové analýze skryje znovu (kliknutí na Zobrazit platí jen do další extrakce). (`hiding.md`) | proposal §4.2 (vratnost); mvp F2 | ZF-10 | e2e | Pass | 2026-11-13 | Libuše | |
| UI-24 | SP1–SP5; SP5 před analýzou; stránky z matice níže; zapnuté všechny přepínače | 1. Ulož `window.__zf` (SP5).<br>2. Klikni na Analyzovat (skryje se alespoň jeden blok).<br>3. Zkontroluj v DevTools, že původní prvky bloků jsou v DOM a mají původní text.<br>4. Klikni na **Zobrazit vše**.<br>5. Zkontroluj `[data-zenfeed-hidden]` a `document.body.innerHTML === window.__zf`. | Po kroku 4 nejsou žádné boxy, žádný atribut `data-zenfeed-hidden`, ZenFeed přidaný styl je odstraněn a stránka je v původním stavu (pro F, P02, P03, P05, P06 `innerHTML` shodné; ZenFeed prvky ani nepřesunul ani nenahradil). Výjimka z dokumentace: P01 se po skrytí sama dotahuje („Data Explorer“), proto se její `innerHTML` může lišit; kontroluje se, že nezůstala žádná stopa ZenFeedu. Vratnost musí platit ve **100 %** testovaných případů; zapiš výsledek pro každou stránku do matice. (`hiding.md`, `mvp.md` §7) | proposal §4.2, §5 (vratnost 100 %); mvp F2 | ZF-10 | e2e | | | | |
| UI-25 | SP1–SP5; po UI-24 na stejné stránce bez nové analýzy a bez změny přepínačů | 1. Klikni na **Znovu skrýt**.<br>2. Zkontroluj v logu backendu, že nepřišel nový požadavek.<br>3. Klikni na Zobrazit vše. | Skryjí se stejné bloky jako dřív bez nového volání backendu; Zobrazit vše je znovu vrátí beze stopy. Znovu skrýt se nabízí jen pro naposledy skrytou extrakci se stejným nastavením. (`popup.md`) | proposal §4.2; mvp F2 | ZF-10, ZF-11 | e2e | Pass | 2026-11-13 | Libuše | |
| UI-26 | SP1–SP5; F `hider.html` a `hider-csp.html` (stránka s CSP `style-src 'none'`); zapnutá „Válka“ | 1. Na obou stránkách klikni na Analyzovat.<br>2. Zkontroluj blok s vlastním `display: flex !important` a velikost písma v boxu.<br>3. Klikni na Zobrazit vše. | Skryjí se i bloky s inline `display … !important` a stránky s CSP (4 skryté bloky z 11 podle e2e s `lexicon-1`, bloky se štítkem válka); box má písmo 13 px i přes CSS stránky (červených 40 px s `!important`); po obnovení má prvek původní inline styl. (`hiding.md`) | proposal §4.2 (jediná změna stránky je skrytí a box); mvp F2 | ZF-10 | e2e (`hider-browser.mjs`) | Pass | 2026-11-13 | Libuše | |
| UI-27 | SP1–SP5; libovolná stránka se skrytým blokem | 1. Po skrytí stránku znovu načti (F5).<br>2. Zkontroluj stránku a popup. | Po obnovení stránky je skryté zpět viditelné; stav skrytí se s content scriptem ztratí. (`hiding.md` – známá omezení) | proposal §4.2 (jen načtený obsah, vratnost) | ZF-10 | později | Pass | 2026-11-13 | Libuše | |

### F. Chyba backendu (akceptace ZF-12: chyba nebo timeout nezpůsobí zmizení ani poškození obsahu)

U všech scénářů F: před prvním krokem ulož `window.__zf` (SP5) a po kroku ověř, že stránka je beze změny (`document.body.innerHTML === window.__zf`, `[data-zenfeed-hidden]` = 0), že nic nezmizelo a žádný text se nezměnil. Použij stránku bez dynamického obsahu, např. F `mostly-war.html` nebo P03.

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-28 | SP2, SP4, SP5; **backend zastavený**; F `mostly-war.html`; zapnutá „Válka“ | 1. Klikni na Analyzovat.<br>2. Ověř stránku.<br>3. Spusť backend (SP1) a klikni na Analyzovat znovu. | Krok 1: „Server ZenFeed neběží. Spusťte ho (uvicorn, viz docs/DEVELOPMENT.md) a zkuste to znovu. Nic se neskrylo.“, nic se neskrylo. Krok 2: stránka beze změny. Krok 3: analýza proběhne normálně (žádný zaseknutý stav). (`popup.md`, `edge-states.md`) | proposal §4.1 #5, §4.2; mvp F5 | ZF-12, ZF-28 | node (`analyze-client.test.mjs`), e2e | Pass | 2026-11-13 | Libuše | |
| UI-29 | SP2, SP4, SP5; skutečný backend zastavený, běží stub analýzy v režimu `status_500` (příkazy výše) | 1. Klikni na Analyzovat.<br>2. `curl http://127.0.0.1:8000/__stub/last` a zapiš počet požadavků a statusy.<br>3. Ověř stránku. | Po jednom opakování (po cca 0,5 s) zpráva „Server ZenFeed vrátil chybu. Nic se neskrylo.“, stránka beze změny. Stub zaznamená 2 požadavky, oba se statusem 500. 4xx se neopakuje, viz UI-31. (`popup.md`) | proposal §4.1 #5, §4.2; mvp F5 | ZF-12 | node | Pass | 2026-11-13 | Libuše | |
| UI-30 | SP2, SP4, SP5; backend spuštěný jako `ZENFEED_ANALYZE_TIMEOUT_SECONDS=0.001 uvicorn app.main:app --app-dir backend`; stránka W1 (aby analýza trvala). | 1. Klikni na Analyzovat.<br>2. Ověř stránku.<br>3. Backend zastav a spusť znovu bez proměnné. | Backend vrací `504 {"error":"timeout"}`; popup jednou opakuje a pak ukáže „Server ZenFeed neodpověděl včas. Zkuste to znovu. Nic se neskrylo.“ Stránka beze změny. Po restartu bez proměnné analýza funguje. (`API.md`, `popup.md`) | proposal §4.1 #5, §4.2; mvp F5 | ZF-12 | pytest (timeout), node | Pass | 2026-11-13 | Libuše | |
| UI-31 | SP2, SP4, SP5; skutečný backend zastavený, běží stub analýzy v režimu `status_422` | 1. Klikni na Analyzovat.<br>2. `curl http://127.0.0.1:8000/__stub/last` a zapiš počet požadavků a statusy.<br>3. Ověř stránku. | Odpověď 4xx se **neopakuje**: stub zaznamená 1 požadavek se statusem 422. Zpráva „Server ZenFeed vrátil chybu. Nic se neskrylo.“; stránka beze změny. (`popup.md`) | proposal §4.1 #5, §4.2 | ZF-12 | node (`analyze-client.test.mjs`) | Pass | 2026-11-13 | Libuše | |
| UI-32 | SP2, SP4, SP5; stránka s více než 100 bloky (W1, 4 požadavky). Skutečný backend zastavený, běží stub analýzy v režimu `fail_second_request` (příkazy výše) | 1. Klikni na Analyzovat (stub vrátí 500 na druhý požadavek, tedy na bloky 101–200, při obou pokusech).<br>2. `curl http://127.0.0.1:8000/__stub/last` a zapiš počet požadavků a statusy.<br>3. Klikni na **Zkusit znovu nevyhodnocené** (stub stále selhává).<br>4. Přepni stub na `ok` a klikni na **Zkusit znovu nevyhodnocené** znovu.<br>5. Klikni na Zobrazit vše. | Úspěšné výsledky se použijí a bloky selhaných požadavků zůstanou viditelné: „Skryté bloky: N z M. Nevyhodnocené bloky: K (server vrátil chybu); zůstaly viditelné. Můžete je zkusit poslat znovu.“ Tlačítko opakuje jen nevyhodnocené bloky a už rozhodnuté se nemění; při úspěchu „Dovyhodnocené bloky: …, nově skryté: …“. Zobrazit vše nabídku zruší. Stub po kroku 1 zaznamená 5 požadavků: po jednom pro dávky 1, 3 a 4 a dva se statusem 500 pro dávku 2. Po kroku 3 (stub stále selhává) je v počítadle 7 požadavků (5 z kroku 1 a 2 další pokusy o dávku 2, oba se statusem 500). Tyto počty platí pro stránku se 400 bloky (4 dávky); u stránky s 201 až 300 bloky (3 dávky) je to po kroku 1 4 požadavky a po kroku 3 6. Krok 4 počítadlo vynuluje (změna režimu ho nuluje); po úspěšném opakování je v něm 1 požadavek se statusem 200. **Stub nic neskrývá** (každý blok vrací `show`): „Skryté bloky“ je vždy 0 a „nově skryté“ také; scénář ověřuje jen zprávy, tlačítka a počty požadavků, ne skrývání. **Chování popupu při 0 skrytých není v dokumentaci:** není určeno, zda se při 0 skrytých nabídne „Zkusit znovu nevyhodnocené“. Zapiš, co se skutečně stalo; pokud tlačítko chybí, založ chybu v `evidence-chyb.md` nebo to upřesni s týmem. Pozorování z automatického běhu (13. 11. 2026, headless Chromium, stránka s 250 bloky): tlačítko se při 0 skrytých zobrazilo a opakování fungovalo; v desktopovém Chromu to 13. 11. 2026 ověřila Libuše na W1 (400 bloků, skutečný Chrome, stub): tlačítko se při 0 skrytých zobrazilo a opakování fungovalo. Dokumentováno ručně na falešném `chrome` API, ne na skutečném backendu. (`popup.md`) | proposal §4.1 #5; mvp F5 | ZF-12 | node (`analyze-client.test.mjs`) | Pass | 2026-11-13 | Libuše | |

### G. Omezené stránky

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-33 | SP1, SP2; zapnutá „Válka“ | 1. Otevři `chrome://version/` a klikni na Analyzovat.<br>2. Otevři stránku Chrome Web Store a klikni na Analyzovat. | Zpráva „Na této stránce ZenFeed nefunguje (např. chrome://, Chrome Web Store nebo soubor).“ nebo „ZenFeed k této stránce nemá přístup…“; nic se nevkládá, neposílá ani neskrývá; v terminálu backendu nepřišel požadavek. (`edge-states.md`, `popup.md`) | proposal §4.1 #5; mvp F5 | ZF-08, ZF-28 | e2e | Pass | 2026-11-13 | Libuše | |
| UI-34 | SP1, SP2; lokální soubor z `tests/extension/fixtures/` otevřený jako `file://` | 1. Otevři soubor přes `file://`.<br>2. Klikni na Analyzovat. | Stejná zpráva jako v UI-33; nic se neanalyzuje. (`edge-states.md`) | proposal §4.1 #5; mvp F5 | ZF-08, ZF-28 | e2e | Pass | 2026-11-13 | Libuše | |

### H. SPA a dynamický obsah

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-35 | SP1–SP5; P04 (tlačítko „Show more“) nebo jiná povolená stránka, která po akci přidá obsah | 1. Klikni na Analyzovat se zapnutou „Válka“.<br>2. Na stránce přidej obsah („Show more“ nebo rolování).<br>3. Zavři a znovu otevři popup.<br>4. Zkontroluj log backendu.<br>5. Klikni na Analyzovat. | Popup po znovuotevření oznámí, že od poslední analýzy na stránce přibyl obsah, a vyzve ke kliknutí na Analyzovat. Nic se samo neanalyzuje ani neposílá (v logu backendu nepřibyl požadavek) a nový obsah zůstává viditelný, dokud uživatel nespustí analýzu. Po kroku 5 se počítadlo nového obsahu vynuluje. Pokud P04 „Show more“ nenabízí, zapiš N/A. (`hiding.md`, `popup.md`) | proposal §4.2 (jen načtený obsah, dobrovolnost); mvp „Jen načtený obsah“ | ZF-10, ZF-11 | e2e | | | | |
| UI-36 | SP1–SP5; povolená stránka s přechodem trasy bez znovunačtení (např. interní odkaz na P01 nebo P04) | 1. Klikni na Analyzovat se zapnutou „Válka“, nech skrytý blok.<br>2. Přejdi na jinou trasu klikem na interní odkaz stránky bez znovunačtení.<br>3. Zkontroluj stránku a otevři popup.<br>4. Klikni na Zobrazit vše. | Chování po změně trasy bez znovunačtení: **UNSPECIFIED** (dokumentace popisuje jen plné znovunačtení). Zapiš, co se stalo (zůstal box? zůstal skrytý blok? je stav popupu platný?). Neporušitelná pravidla platí vždy: žádný text stránky není změněn, žádný obsah nezmizel napořád, Zobrazit vše nezanechá stopu. (`hiding.md`, `block-mapping.md`) | proposal §4.2; mvp „Pevná pravidla návrhu“ | ZF-10, ZF-09 | později | | | | |

### I. Shrnutí a hlas (jen pokud je v buildu)

Předpoklad skupiny: build obsahuje panel Shrnutí (ZF-30) a přehrávač (ZF-16, ZF-17). Skutečný `POST /v1/summarize` ještě není servírován (ZF-15, [`../API.md`](../API.md)), proto se používá stub z `tests/extension/summary_stub.py`; **stub není sumarizátor**. Pokud build panel nebo přehrávač nemá, zapiš N/A. Skutečné shrnutí a hlas (kvalita, věrnost) se tu neposuzuje (ZF-31, ZF-34).

| ID | Předpoklady | Kroky | Očekávaný výsledek | Požadavek | Issue | Aut. | Výsledek | Datum | Tester | Bug |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-37 | SP2, SP4; skutečný backend zastavený, spuštěný stub (příkazy výše), režim `ok`; F `hider.html`, zapnutá „Válka“, analýza proběhla | 1. V panelu Shrnutí zvol jazyk (výchozí podle `lang` stránky: angličtina pro `en`, jinak čeština).<br>2. Klikni na „Shrnout viditelný obsah“.<br>3. Klikni na odkaz na originál. | Zobrazí se štítek „Použité nastavení: Válka, …“, „Vynechaná témata: válka.“ a „Shrnutí je záměrně neúplné: skrytý obsah v něm není.“, text shrnutí (ze stubu s předponou „[stub, cs] nebo [stub, en]“), odkaz na původní stránku (otevře se v nové kartě) a model (`stub-not-a-summary`). Na W1 navíc „Vychází z prvních 100 viditelných bloků (z N).“ (`summary-panel.md`). | proposal §4.1 #3, §4.2 (transparentnost); mvp F3 | ZF-30 | e2e (`popup-e2e.mjs --summary`) | Pass | 2026-11-13 | Libuše | |
| UI-38 | SP2, SP4; stub v režimu `ok`; F `hider.html` s alespoň jedním skrytým blokem, pak F `mostly-war.html` | 1. Po skrytí klikni na Shrnout.<br>2. `curl http://127.0.0.1:8000/__stub/last` a v odpovědi hledej text skrytého bloku.<br>3. Na `mostly-war.html` skryj vše a klikni na Shrnout. | Požadavek obsahuje jen viditelné bloky (nejvýše 100); text skrytých bloků v něm **není**. Viditelný blok, který obaluje skrytý (nebo s ním sdílí prvek), se neposílá a panel řekne, kolik jich vynechal. Pokud po skrytí nic viditelného nezbylo, nic se neposílá a panel to oznámí; ZenFeed nic nedoplňuje. (`summary-panel.md`, `API.md`) | proposal §4.1 #3, §4.2; mvp F3 | ZF-30, ZF-29 | e2e (`--summary`) | Pass | 2026-11-13 | Libuše | |
| UI-39 | SP2, SP4; stub; F `hider.html` po analýze; později skutečný backend bez `/v1/summarize` | 1. Pro každý režim stubu (`insufficient`, `no_relevant`, `not_served`, `unavailable`, `rate_limited`, `timeout`) přepni režim (`curl` výše) a klikni na Shrnout.<br>2. Po chybě klikni na Zkusit znovu v režimu `ok`.<br>3. Zastav stub, spusť skutečný backend a klikni na Shrnout. | `insufficient`: „Ve viditelné části stránky nezůstalo dost textu ke shrnutí.“ `no_relevant`: „Ve viditelné části stránky není nic, co by stálo za shrnutí.“ `not_served`: „Shrnutí server ZenFeed zatím neumí (připravuje se). Filtrování funguje dál.“ `unavailable`: „Shrnutí teď není k dispozici (model není nastavený nebo neodpovídá). Filtrování funguje dál.“ `rate_limited`: „Bezplatný limit pro shrnutí je vyčerpaný. Zkuste to později. Filtrování funguje dál.“ `timeout`: „Shrnutí nedorazilo včas. Zkuste to znovu.“ U chyb je tlačítko „Zkusit znovu“, které v režimu `ok` shrnutí zobrazí. Ve všech případech filtrování dál funguje (Zobrazit vše, Znovu skrýt). Krok 3 (skutečný backend dnes `/v1/summarize` nemá): `not_served` zpráva jako výše; pokud ZF-15 route servíruje, zapiš N/A a ověř podle `API.md`. (`summary-panel.md`) | proposal §4.1 #3, #5; mvp F3, F5 | ZF-30, ZF-12 | node (`summary-client.test.mjs`), e2e (`--summary`) | Pass | 2026-11-13 | Libuše | |
| UI-40 | SP2, SP4; stub v režimu `ok`; shrnutí zobrazeno (UI-37); v počítači je nainstalovaný lokální hlas pro jazyk shrnutí | 1. Před jakýmkoli kliknutím zkontroluj označení hlasu.<br>2. Klikni na Přehrát, Pozastavit, Pokračovat, Zastavit a znovu Přehrát.<br>3. Změň jazyk nebo spusť novou analýzu během přehrávání. | Označení „Syntetický hlas · shrnutí napsal stroj“ (resp. „Synthetic voice · summary written by AI“) je vidět **bez interakce**, před prvním přehráním je upozornění, že uslyšíte syntetický hlas, který čte strojově vytvořené shrnutí, ne původní text. Přehrávání se dá spustit, pozastavit, obnovit a zastavit; čte se jen shrnutí, ne text stránky; nový text shrnutí, nová analýza nebo změna přepínače čtení zastaví. Bez lokálního hlasu zpráva „V počítači není nainstalovaný český / anglický hlas, který běží bez internetu. Shrnutí si můžete přečíst.“ (nelze vždy vyvolat, pak N/A). (`voice-player.md`) | proposal §4.1 #4; mvp F4 | ZF-16, ZF-17, ZF-26 | node (`voice.test.mjs`), e2e (`--summary`) | | | | |

## Matice stránek pro vratnost a první analýzu

Vyplň při běhu UI-03 a UI-24: Pass nebo Fail na stránku a ID chyby. Vratnost musí platit ve 100 % testovaných případů (`mvp.md` §7), jediné Fail znamená, že práh nesplněn.

| Stránka | UI-03 první analýza | UI-24 Zobrazit vše bez stopy | Datum | Tester | Bug |
|---|---|---|---|---|---|
| F `hider.html` | Pass | Pass | 2026-11-13 | Libuše | |
| F `hider-csp.html` | Pass | Pass | 2026-11-13 | Libuše | |
| F `mostly-war.html` | Pass | Pass | 2026-11-13 | Libuše | |
| P01 | Pass | Pass | 2026-11-13 | Libuše | |
| P02 | Pass | N/A | 2026-11-13 | Libuše | |
| P03 | Pass | N/A | 2026-11-13 | Libuše | |
| P04 | Pass | Pass | 2026-11-13 | Libuše | |
| P05 | Pass | Pass | 2026-11-13 | Libuše | |
| P06 | Pass | N/A | 2026-11-13 | Libuše | |
| W1 | Pass | | 2026-11-13 | Libuše | |
| R04 | Pass | Pass | 2026-11-13 | Libuše | |

## Pokrytí akceptace ZF-12

Akceptace ZF-12 („chyba nebo timeout backendu nezpůsobí zmizení ani poškození obsahu“) je pokryta scénáři UI-28 (backend neběží), UI-29 (odpověď 5xx), UI-30 (timeout), UI-31 (4xx) a UI-32 (částečné selhání). UI-29, UI-31 a UI-32 se vyvolávají pomocným stubem `tests/extension/analyze_stub.py`, viz otevřené otázky.

## Otevřené otázky

Seznam chybějících nebo nesouhlasných míst. Nic z toho jsem nerozhodl; očekávaný výsledek je v tabulkách buď převzatý z dokumentace, nebo označený UNSPECIFIED.

1. **Číslování požadavků.** Zadání odkazuje na „mvp.md §4.1 #… / §4.2“. V `docs/mvp.md` takové číslování není (jsou tam F1 až F5, „Pevná pravidla návrhu“ a §4 Základní scénář); §4.1 #1–5 a §4.2 jsou čísla z `zadani/zenfeed-final-proposal.md` (jak je používá `docs/backlog/TRACEABILITY.md`). Ve sloupci Požadavek je proto proposal §4.1/§4.2 a odpovídající F z `mvp.md`.
2. **Změna trasy v SPA bez znovunačtení.** Dokumentace říká jen, co se stane po navigaci a znovunačtení (obsah content scriptu zmizí). Stav skrytí, boxů a popupu po přechodu trasy bez znovunačtení je UNSPECIFIED (UI-36).
3. **Text zprávy při zavřené nebo přesměrované kartě.** Dokumentace uvádí jen kód `tab_unavailable` (`hiding.md`, `block-mapping.md`). Uživatelský text „Karta se mezitím zavřela nebo přešla na jinou stránku. Klikněte na Analyzovat znovu.“ a zpráva pro `stale_extraction` jsou jen v `extension/popup/popup.js`. Očekávaná zpráva v UI-13 je proto UNSPECIFIED v dokumentaci.
4. **Ruční vyvolání chyb 4xx a částečného selhání.** Žádný dokument nepopisuje, jak je vyvolat na skutečném rozšíření. UI-29, UI-31 a UI-32 proto používají pomocný stub `tests/extension/analyze_stub.py` (nový soubor; tým ho zkontroloval 13. 11. 2026; v dokumentaci projektu zatím není popsán). Stub vrací jen odpovědi `show` a chyby podle `API.md`, žádnou klasifikaci. Bez něj by UI-31 a UI-32 byly Blocked.
5. **Neshody čísel mezi dokumenty.** P04 (OWID Data Insights): `hiding.md` uvádí 3 skryté z 23 bloků (4. 11.), `popup.md` 4 z 23 (5. 11.), `summary-panel.md` (11. 11.) uvádí, že se dnes vykresluje jen patička. P01: `edge-states.md` uvádí „48 z 74“, `hiding.md` a `popup.md` „48 z 75“; P06 má v `block-mapping.md` 52 bloků a v `hiding.md` 50. Stránky jsou nestabilní nebo se extraktor mezi měřeními změnil. Proto checklist nepoužívá počty z dokumentace jako očekávané hodnoty.
6. **Znění oznámení o novém obsahu.** `hiding.md` uvádí jako příklad „Na stránce přibyl obsah, analyzovat znovu“, `popup.md` jen že popup obsah oznámí a vyzve k Analyzovat. Kód používá delší větu („Od poslední analýzy na stránce přibyl obsah (nové prvky: N). Nic se neanalyzuje samo; klikněte na Analyzovat.“). UI-35 kontroluje smysl (oznámení + výzva), ne přesné znění.
7. **Zavření popupu během analýzy.** Dokumentace říká, že stav popupu žije jen dokud je otevřený (`popup.md`, `summary-panel.md`), ale neříká, co se stane se spuštěným požadavkem a zda se pak výsledky použijí. UNSPECIFIED, scénář nebyl zařazen.
8. **Pravidlo pro neshodu klasifikace.** **Vyřešeno:** tým 13. 11. 2026 potvrdil, že případ „klasifikátor zařadil blok jinak než anotace“ se zapíše jako poznámka s odkazem na ZF-06 nebo ZF-14, ne jako chyba UI. Poznámky jdou do samostatné tabulky v `evidence-chyb.md`.
9. **P02 (EA Forum).** `stranky.md` ho označuje „povoleno s výhradou“ (nečtený §7 podmínek CEA). **Vyřešeno:** tým stránku přijal 13. 11. 2026.
10. **Stránka W1 (cs.wikipedia.org/wiki/Globální_oteplování).** `stranky.md` ani `rozsireni-zdroje.md` ji nevedou; povoleny jsou Wikipedie jako web (P05, R04–R10, podmínky Wikimedia, CC BY-SA). **Vyřešeno:** tým W1 potvrdil 13. 11. 2026. Stránku by bylo dobré dopsat jako řádek do `stranky.md` (mimo rozsah ZF-13).
11. **Odezva.** Pro UI žádný časový limit v dokumentaci není; 3 s a 10 s jsou pracovní předpoklady plánu (`mvp.md` §7). Checklist čas neposuzuje.
12. **Desktopový Chrome.** Dokumentace opakovaně uvádí, že skutečný klik v desktopovém Chrome se neotestoval; všechny dokumentované výsledky jsou z headless Brave 156. Tento checklist je tedy poprvé, kdy se to dělá ručně.

## Co jsem neověřil

- Žádný scénář jsem v prohlížeči neprovedl; očekávané výsledky jsou z dokumentace a ověřené proti kódu jen v rozsahu zpráv popupu, konstant a odpovědí backendu.
- Stub `analyze_stub.py` jsem ověřil `curl`em v cloudovém prostředí (všechny režimy), ne s rozšířením. To, jak se popup k odpovědím stubu zachová (UI-29, UI-31, UI-32), je tedy ověřené jen podle dokumentace a kódu klienta, ne spuštěním.
- Chování popupu v UI-32 při 0 skrytých blocích (stub nic neskrývá): není v dokumentaci. V automatickém běhu v headless Chromiu (stránka s 250 bloky) se tlačítko „Zkusit znovu nevyhodnocené“ zobrazilo; v desktopovém Chromu to ověří první ruční běh.
- Aktuálnost odkazů na stránky a jejich podmínek (stav `stranky.md` z 2. 11. 2026 a `rozsireni-zdroje.md` z 4. 11. 2026).
