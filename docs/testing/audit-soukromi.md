# Audit soukromí před M3 (ZF-18)

> **Stav:** 17. 11. 2026, větev `issue-ZF-18`. Audit je z **čtení kódu** a z jednoho běhu s atrapou Gemini v cloudovém prostředí. Doplňuje [`../privacy.md`](../privacy.md) (audit ZF-29 z 11. 11. 2026, který vznikl **před** napojením Gemini a před panelem Shrnutí). Nenahrazuje ruční kontroly M3-60 až M3-63 v [`checklist-m3.md`](checklist-m3.md).
>
> Čísla řádků jsou z větve v den auditu (`gemini.py` už s opravou z B-004).

Hodnocení u každého bodu: **ok** (kód i důkaz sedí), **porušení** (kód nebo text odporuje pravidlu), **neověřeno** (z kódu nebo v tomto prostředí nejde potvrdit; napsáno proč).

## Souhrn

| # | Bod | Hodnocení |
|---|---|---|
| 1 | Nic se nečte ani neposílá bez kliknutí | **ok** |
| 2 | Co přesně jde v těle požadavku na ZenFeed server | **ok** |
| 3 | Co přesně jde dál do Gemini | **ok** (s poznámkou o titulcích bloků) |
| 4 | Uživatel se před odesláním dozví, kam text jde | **ok** po opravě B-003; před ní **porušení** |
| 5 | Klíč je jen na backendu | **ok** |
| 6 | Klíč se nedostane do logu ani do výpisu objektu | **ok** po opravě B-004; před ní **porušení (latentní)** |
| 7 | Log backendu neobsahuje text stránky | **ok** (z kódu a z jednoho běhu); pokrytí e2e kontroly je úzké |
| 8 | Cookies, hlavičky, URL a titulek stránky se neposílají | **ok** |
| 9 | Co zůstává uloženo | **ok** |
| 10 | Klíč a tajemství v repozitáři | **ok** pro aktuální strom, **neověřeno** pro historii gitu |
| 11 | Skrytý obsah nejde do shrnutí | **ok** (automaticky ověřeno jen na atrapě) |
| 12 | Oprávnění rozšíření | **ok** |

## Podrobně

### 1. Nic se nečte ani neposílá bez kliknutí: ok

- `extension/manifest.json:7` – oprávnění jen `activeTab`, `scripting`, `storage`; v manifestu není `content_scripts`, takže se do stránek nic samo nevkládá. Skript se vkládá až při kliknutí: `extension/popup/bootstrap.js:73` (`scripting.executeScript` ve funkci `extractActiveTab`, volané z `handleAnalyze`).
- Síťová volání mají v popupu jen dvě místa: `extension/popup/popup.js:480` (`Client.analyzeBlocks`, ve `handleAnalyze` od řádku 441) a `popup.js:407` (`Summary.summarize`, ve `handleSummarize` od řádku 391). `handleRetryFailed` (řádek 581) posílá znovu jen to, co dřív selhalo po kliknutí. Spouští je výhradně posluchače kliknutí na řádcích 676 (Analyzovat), 680 (Zkusit znovu nevyhodnocené) a 681 (Shrnout). Změna přepínače (`handlePreferenceChange`, řádek 160) jen ukládá nastavení a nic neposílá.
- Content script po vložení jen sleduje změny stránky a počítá nový obsah (`extension/content/content.js:50–57`); nic neposílá a nic nevyhodnocuje.
- Automaticky: `popup-e2e.mjs` kontroluje, že před prvním kliknutím obsahový skript na stránce není (`injectedBeforeClick`, `verify`), a `bootstrap.test.mjs` hlídá, že nejsou žádné automatické content scripts. Obojí pokrývá jen to, že se nic nevložilo; že před kliknutím nepřišel požadavek na backend, hlídá ruční M3-60.

### 2. Tělo požadavku na ZenFeed server: ok

- `/v1/analyze`: `extension/popup/analyze-client.js:28–30` (`toRequestBlock`) pošle z každého bloku jen `id`, `kind`, `text` a `title` (zkrácený), plus přepínače. Požadavek jde s `credentials: "omit"` (řádek 55) na `http://127.0.0.1:8000` (`host_permissions`, `manifest.json:8`).
- `/v1/summarize`: `extension/popup/summary-client.js:57–66` pošle `blocks` (`id`, `kind`, `title` do 300 znaků, `text`), `preferences`, `omitted_categories` a `language`; `credentials: "omit"` na řádku 112; nejvýše 100 bloků a 30 000 znaků (řádky 15–19, 50–56).
- URL stránky, titulek stránky, cookies a hlavičky v těle nejsou. Content script sice vrací popupu `url` a `title` (`content.js:61–62`), ale popup je použije jen pro odkaz „Původní stránka“ (`popup.js:428–429`) a do požadavku se nedostanou (`toRequestBlock`, `buildRequest`).
- Automaticky: `analyze-client.test.mjs` a `summary-client.test.mjs` kontrolují sadu klíčů v požadavku a `credentials: "omit"`.

### 3. Co jde dál do Gemini: ok

- `backend/app/services/summarize.py:93–103` skládá zprávu pro model jako JSON pole s `kind`, `title` a `text` bloků (bez ID, bez URL); systémová instrukce (řádky 50–90) označuje text stránky za nedůvěryhodná data. Do Googlu jde nejvýše 30 000 znaků (`MAX_INPUT_CHARS`, řádek 26).
- `backend/app/services/gemini.py:64–73` – tělo žádosti: systémová instrukce, obsah, `generationConfig`. Klíč je jen v hlavičce `x-goog-api-key` (řádek 77), ne v URL.
- Poznámka: `title` bloku (např. nadpis sekce) je text ze stránky, takže odchází také. Není to titulek stránky.
- Důkaz z běhu: s atrapou Gemini (stand-in) `popup-e2e.mjs --fake-gemini` kontroluje, že atrapa dostala klíč v hlavičce a pravidlo o nedůvěryhodném textu (`privacy.provider`).

### 4. Uživatel se před odesláním dozví, kam text jde: ok po opravě, předtím porušení (B-003)

- `extension/popup/popup.html:23` říká, že se text bloků pošle „na server ZenFeed na tomto počítači (127.0.0.1)“. To platí pro Analyzovat.
- `popup.html:48` (nad tlačítkem Shrnout) říká jen „Na server ZenFeed se pošle jen text bloků, které na stránce zůstaly viditelné. Skrytý obsah ne.“ Že server text **dále posílá do Googlu (Gemini, bezplatná úroveň)**, nikde ve vyskakovacím okně není.
- `docs/privacy.md` (sekce Re-audit) i `docs/summarize.md` (sekce Privacy) přitom říkají, že po napojení Gemini musí poznámka u Analyzovat a nápověda u Shrnout říci, že text jde do Googlu. Tato část pravidla splněna není. `docs/privacy.md` to do 17. 11. 2026 tvrdil také („integrace Gemini ještě neexistuje“).
- Opraveno 17. 11. 2026 (B-003): `popup.html:48` nově říká, že text viditelných bloků jde po kliknutí na Shrnout na server ZenFeed a odtud do Google Gemini (bezplatná vrstva, Google text může používat ke zlepšování produktů); `docs/privacy.md` je aktualizované. Opravu zatím nikdo neviděl v prohlížeči (ruční M3-63).

### 5. Klíč je jen na backendu: ok

- Klíč se čte jen z prostředí: `backend/app/config.py:65` (`ZENFEED_AI_API_KEY`). V rozšíření se `ZENFEED_AI_API_KEY`, `x-goog-api-key` ani žádný řetězec podobný klíči nevyskytuje (hledání v `extension/`, 17. 11. 2026, bez nálezu).
- `.gitignore:10–13` ignoruje `.env` a `.env.*` kromě `.env.example`; `.env.example:6` má klíč prázdný.
- Klient (`backend/app/main.py:40–49`) dostane klíč jen při vytvoření a jen z nastavení.

### 6. Klíč se nedostane do logu ani do výpisu objektu: ok po opravě, předtím porušení (latentní)

- `Settings.__repr__` klíč skrývá (`config.py:42–52`, vypíše jen `set`/`unset`).
- `GeminiClient` byl `@dataclass(frozen=True)` s polem `api_key` bez omezení výpisu, takže `repr(client)` klíč vypsal (ověřeno v cloudu: `GeminiClient(api_key='SECRET-XYZ', …)`). Nikde v kódu se klient nelogoval, takže šlo o **latentní** riziko: výjimka s výpisem objektu, `assert` v testu nebo ladicí výpis by klíč ukázaly. Opraveno na `api_key: str = field(repr=False)` (`gemini.py:57`), přidán test `test_gemini_client_repr_hides_the_key` (před opravou padal, po ní prošel). Zapsáno jako B-004.
- Logování v kódu: `gemini.py:79,82,86,92,106` (jen typ chyby nebo stav), `summarize.py:121,125,129,140` (jen počty a délky), `main.py:70,83,88,100,107,114,136,146` (počty, příznaky, délka shrnutí). Ani jeden řádek nevypisuje text bloků, shrnutí ani klíč. Tělo odpovědi Googlu se nelogí (`gemini.py:91–92`, komentář a log jen se stavem); validační chyba se loguje jen jako fakt (`main.py:70`), ne se vstupem.
- Neověřeno: pád s tracebackem, který by vypsal uvicorn mimo `main.py:88` (handler `Exception` loguje jen typ). Traceback může obsahovat zprávu výjimky; u výjimek z `httpx` v ní URL je, klíč ne (je v hlavičce). Nezkoušeno, jen z kódu.

### 7. Log backendu neobsahuje text stránky: ok, ale kontrola je úzká

- Co kontroluje e2e: `tests/extension/run-e2e.sh:93` hledá v logu backendu jen řetězce `fake-key-for-e2e|HIDE-WAR|harvest`. To kryje **atrapový klíč** a dvě značková slova; **neprokazuje**, že v logu není jiný text stránky. Test `backend/tests/test_summarize.py::test_logs_contain_neither_page_text_nor_key` hledá `harvest festival` a klíč v logu loggeru `zenfeed` při úrovni DEBUG; je to přesnější, ale také jen pro jednu větu.
- Důkaz z běhu v cloudu (atrapa Gemini, stand-in): po běhu přes čtyři lokální stránky měl log backendu 39 řádků, jen řádky uvicornu (`POST /v1/analyze … 200 OK`, `POST /v1/summarize … 200`/`503`) a varování `summary provider … status=500`, `rate limited`, `unusable answer error_type=KeyError`. Hledání slov z textu stránky `hider.html` (např. „fighting“, „gardening“, „weather“) a řetězců `fake-key`, `AIza`, `x-goog` v logu: 0 nálezů.
- Poznámka: informační řádky loggeru `zenfeed` (počty bloků) se při spuštění přes `uvicorn app.main:app` bez nastavení loggingu nevypisují; ve výpisu se objevují jen varování a řádky uvicornu. Pro audit je to příznivé, pro ladění ne.
- Neověřeno: skutečný backend s `--log-level debug` a skutečná pilotní stránka.

### 8. Cookies, hlavičky, URL a titulek stránky se neposílají: ok

Viz bod 2. Obě klientská volání mají `credentials: "omit"` a tělo je složené jen z uvedených polí; backend pole mimo schéma zahodí (`extra="ignore"`, `backend/app/schemas.py:48,78,127`) a do Gemini jde jen výběr z bodu 3.

### 9. Co zůstává uloženo: ok

- `chrome.storage.local`: klíč `zenfeed.preferences` (přepínače; `extension/popup/preferences.js:11`) a `zenfeed.lastAnalysis` (ID karty, ID extrakce a přepínače; `popup.js:203`). Žádný text stránky, žádná adresa, žádný výsledek klasifikace.
- Nikde v `extension/` není `localStorage`, `sessionStorage` ani `document.cookie`; `location.href` se čte jen na jednom místě (`content.js:62`, viz bod 2) a neukládá se (hledání v `extension/`, 17. 11. 2026).
- Backend nic neukládá: žádný zápis na disk ani do databáze v `backend/app/` (jen paměť na dobu požadavku). Čtením kódu; databázi ani soubor jsem nehledal mimo `backend/app/`.
- Stav skrytí a výsledky žijí v paměti popupu a content scriptu a zmizí se zavřením popupu, resp. znovunačtením stránky (`popup.md`, `hiding.md`).

### 10. Klíče a tajemství v repozitáři: ok pro strom, neověřeno pro historii

- Aktuální strom (`extension/`, `backend/`, `tests/`, `docs/`, `.env.example`, `CLAUDE.md`, 17. 11. 2026): hledání vzorů `AIza…`, `sk-…`, `ghp_`, `github_pat_` a soukromých klíčů nenašlo nic. Jediný nález je text v `docs/privacy.md`, který tyto vzory jmenuje. Jediné neprázdné přiřazení `ZENFEED_AI_API_KEY=` je atrapový `fake-key` v komentáři `fake_gemini.py:12` a v `run-e2e.sh` (`fake-key-for-e2e`, nejde o klíč).
- Neověřeno: celá historie gitu. V tomto prostředí není přístup k `git log`; ZF-29 ji (11. 11.) prošel, ale před napojením Gemini. Před sloučením doporučuji zopakovat `git log --all -p | grep` pro uvedené vzory.

### 11. Skrytý obsah nejde do shrnutí: ok

- `summary-client.js:37–47` neposílá skryté bloky ani obalové bloky, jejichž text skrytý blok obsahuje. Backend dostává jen tyto bloky (`summarize.py:3`).
- Automaticky: `popup-e2e.mjs` čte text každého skrytého prvku a porovnává prvních 40 znaků s tím, co dostala atrapa (`privacy.leaked`). Omezení: prvky pod 20 znaků se nekontrolují a shoda je jen na 40 znaků (`regrese-m3.md`).

### 12. Oprávnění rozšíření: ok

`manifest.json:7–8`: `activeTab`, `scripting`, `storage` a `http://127.0.0.1:8000/*`. Bez `tabs`, `cookies`, `history`, `webRequest`, `<all_urls>`. Hlas (`speechSynthesis`) nepotřebuje oprávnění a používají se jen lokální hlasy (`voice.js`, `localService === true`), takže se text při čtení neposílá do cloudu.

## Co jsem neověřil

- Skutečné volání Gemini a to, co s textem dělá Google (jen z dokumentace `summarize.md`/`rozhodnuti-zf-25.md`; `rozhodnuti-zf-25.md` jsem celé nečetl).
- Historii gitu (bod 10), skutečný backend s ladicím logováním (bod 7) a tracebacky mimo `main.py` (bod 6).
- Rozšíření v desktopovém Chrome se skutečným klikem; řádky 1 a 3 jsou ověřené čtením kódu a automatickým během v headless prohlížeči (Chromium v cloudu, jen lokální stránky, atrapa Gemini).
