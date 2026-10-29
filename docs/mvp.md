# ZenFeed — definice produktu a MVP

- **Verze:** 0.2 (sladěno s Project Proposalem `zadani/zenfeed-final-proposal.md`)
- **Stav:** Návrh k odsouhlasení týmem
- **Datum:** 29. 10. 2026
- **Platforma:** Google Chrome, Manifest V3
- **Tým:** Jan Kostrhun, Daniel Holub, Jakub Procházka, Libuše Babičková
- **Termín:** 4 týdny od schválení
- **Účel:** Vymezit rozsah první verze. **Rozhodující je Project Proposal**; tento dokument ho nesmí rozšiřovat ani zužovat.

> Verze 0.1 vycházela z jiného rozsahu (skrývání jen celých stránek, nativní TTS, karty zdrojů). Ten byl v rozporu s proposalem. Přehled změn je v §10.

## 1. Shrnutí produktu

ZenFeed je rozšíření pro Chrome, které čtenáři webu dává dvě věci:

1. Možnost **skrýt** na právě otevřené stránce **bloky obsahu** (články ve výpisu, sekce, komentáře) o tématech, která uživatel nechce číst (např. politické konflikty, válka, zprávy o úmrtí, katastrofické scénáře), nebo s vyhroceným či toxickým tónem.
2. **Samostatné shrnutí** stránky, které respektuje stejné preference a lze si ho **poslechnout** syntetickým hlasem historické osobnosti.

Rozšíření **nikdy nemění text stránky**: nepřepisuje titulky, neupravuje tón ani nic nedopisuje. Skrytý obsah lze jedním kliknutím znovu zobrazit.

## 2. Cílový uživatel a problém

Dospělí uživatelé Chromu, kteří pravidelně čtou weby (zprávy, blogy, odborné texty, diskuze) v češtině nebo angličtině a potřebují rychlý přehled bez obsahu, který číst nechtějí. Vymezení je podle chování a potřeby, ne podle věku, studia nebo země.

Problém: stránky nenabízejí kontrolu nad tím, co uživatel uvidí, a běžné AI shrnutí jeho preference nezohledňuje. Uživatel buď čte vše, nebo web opustí.

Poznatky z rešerše jsou hypotézy, ne ověřené výsledky. Pro dabing historickým hlasem nemáme žádný přímý nález potřeby; ověřujeme ho v testech.

## 3. Rozsah MVP

### Must-have

**F1. Preference uživatele**
- Výběr témat ke skrytí a oddělená volba „vyhrocený / toxický tón“ (téma × tón jsou dvě různé volby; negativní událost není automaticky toxický text).
- Preference se ukládají lokálně a jsou opakovaně použitelné.
- Seznam kategorií je malý, předem definovaný a testovatelný (viz otevřená rozhodnutí).

**F2. Skrývání bloků**
- Rozpoznání bloků na načtené stránce (články ve výpisu, sekce, komentáře), určení tématu a tónu a skrytí těch, které odpovídají preferencím.
- Skrytý blok nahradí minimalistický box, např. „Skryto: válka — Zobrazit“. Text uvnitř zůstává nedotčen.
- Každé skrytí je vratné; volba „Zobrazit vše“ vrací stránku do původního stavu.
- Při nejisté klasifikaci nebo špatně určených blocích se automaticky neskrývá. Nesprávné skrytí je horší než nepodporovaná stránka. *(Pracovní zásada z implementačního plánu; v proposalu výslovně není, souvisí s rizikem „chybné skrytí“.)*
- Zpracování spouští uživatel; rozšíření pracuje jen s již načteným obsahem.

**F3. Samostatné shrnutí**
- Shrnutí načtené stránky v češtině nebo angličtině, zobrazené mimo stránku (panel rozšíření).
- Respektuje stejné preference, uvádí použité preference a jaká témata byla vynechána. Záměrně neúplný přehled se nevydává za úplný ani nestranný.
- Odkaz na originál zůstává. Vynechané téma se nenahrazuje smyšleným pozitivním obsahem.

**F4. Dabing shrnutí**
- Přehrání **shrnutí** (ne textu stránky) syntetickým hlasem historické osobnosti, se spuštěním a zastavením (pozastavení je pracovní doplněk, proposal uvádí spuštění a zastavení).
- Jasné označení, že jde o syntetický hlas.
- Pokud hlas nebo služba není dostupná, shrnutí zůstane čitelné a filtrování funguje dál. Konkrétní osobnost se použije jen při ověřených podmínkách použití hlasu; jinak obecný hlas historicky stylizovaný. *(Záložní řešení je pracovní předpoklad editora, v proposalu není; konečné rozhodnutí je otevřené rozhodnutí č. 2.)*

**F5. Okrajové stavy**
- Málo textu, nepřístupný obsah, po výběru nezůstal relevantní obsah, chyba služby: uživatel dostane srozumitelnou zprávu.

### Pevná pravidla návrhu
- Žádná modifikace obsahu. Jediná změna stránky je skrytí bloku a zobrazení náhradního boxu.
- Vratnost, dobrovolnost, transparentnost (viz F2, F3).
- Dabing patří jen ke shrnutí.
- Jen načtený obsah: nenačtené části feedu, další stránky ani obsah videa rozšíření samo nezískává.

### Should-have (pouze pokud zbyde čas)
> Celý tento seznam je **pracovní předpoklad editora**; proposal žádné should-have položky neuvádí.

- Karty zdrojů s ověřeným textovým úryvkem a odkazem (z návrhu v0.1, kde byly must-have; v proposalu nejsou, proposal vyžaduje jen odkaz na originál).
- Volba délky shrnutí, více hlasů (nad rámec proposalu).
- Vysvětlení klasifikace („Proč byl tento obsah skryt?“ je součástí F2 v základní podobě).

### Mimo rozsah MVP
Přepisování nebo úprava textu stránky (včetně změny tónu a titulků), sociální sítě a zásahy do doporučených feedů, autonomní agent a automatické AI doporučování filtrů, sémantická deduplikace napříč weby, obchodní model, účty a synchronizace, vlastní AI model, plná podpora PDF a videí, automatické posuzování pravdivosti.

*Položky „účty a synchronizace, vlastní AI model, plná podpora PDF a videí, automatické posuzování pravdivosti“ doplnil editor; v proposalu (§4.3) nejsou. Jde o pracovní upřesnění, nikoli o požadavek proposalu.*

## 4. Základní scénář

1. Uživatel otevře stránku v Chrome a nastaví preference (téma × tón).
2. Spustí analýzu (explicitní akce).
3. ZenFeed skryje odpovídající bloky; každý skrytý blok má box s důvodem a tlačítkem „Zobrazit“.
4. Uživatel si vyžádá shrnutí; panel ukáže shrnutí, použité preference, vynechaná témata a odkaz na originál.
5. Uživatel si shrnutí přečte nebo přehraje hlasem.

## 5. Technický návrh

- **Rozšíření (MV3):** content script dělí stránku na bloky se stabilními ID, provádí pouze skrytí a zobrazení; popup/panel pro preference, shrnutí a přehrávač; oprávnění `activeTab` (případně `scripting`, ověřit v týdnu 1); `chrome.storage.local`.
- **Backend (Python, FastAPI, Pydantic):** `/health`, `/v1/analyze` (téma, tón, doporučená akce po blocích), `/v1/summarize`, `/v1/tts`. Validace vstupu i výstupu, limity velikosti a frekvence, API klíče jen na serveru, v logu žádný surový text.
- **AI:** zero-shot klasifikace témat a tónu, abstraktivní shrnutí, strukturovaný výstup, syntéza řeči.
- **Zásady:** klasifikace není neomylná; nejasný výsledek neskrývá. Text stránky je nedůvěryhodný vstup a nesmí přebít instrukce aplikace. Minimální oprávnění. Nic se neodesílá bez akce uživatele. Poskytovatele, přenos a uchovávání dat určíme před nasazením a sdělíme je uživateli (proposal §4.4).
- **Hlavní technické riziko:** dělení libovolné stránky na bloky. Ověřit hned v týdnu 1 na různých doménách.

Podrobnosti: `zenfeed_implementacni_plan.md`.

## 6. Čtyřtýdenní plán (shrnutí)

| Týden | Téma | Výstup |
|---|---|---|
| 1 | Rozhodnutí, segmentační PoC, FastAPI, první klasifikace | Milník M1, go/no-go pro segmentaci |
| 2 | Rozšíření, bloky, skrývání, popup, integrace; rozhovory s uživateli | Milník M2 |
| 3 | Shrnutí, TTS, přehrávač, okrajové stavy, audit soukromí | Milník M3 |
| 4 | 24stránková sada, metriky, test prototypu, opravy, dokumentace, demo | Milník M4 |

Rozsah se zmrazí na konci týdne 1. Při nedostatku času se postupně vyřadí vlastní historický hlas, pokročilé animace a automatické filtrování při načtení; zachová se segmentace, klasifikace, ruční spuštění, skrytí a obnovení.

## 7. Měření úspěchu (pracovní cíle, ne dosažené výsledky)

| Ukazatel | Práh |
|---|---|
| Respektování preferencí (skrytí i shrnutí) | ≥ 80 % |
| Pokles mediánu času k požadovanému přehledu proti obvyklému postupu (bez horších odpovědí o ponechaném obsahu; nedokončené úlohy = neúspěch) | ≥ 20 % |
| Vratnost skrytí | 100 % testovaných případů |

Doplňkově: precision/recall/F1 skrývání (zvlášť neoprávněné skrytí a neskrytý nežádoucí blok), úspěšnost dělení na bloky napříč doménami, faktická věrnost shrnutí (ruční kontrola), compression ratio a semantic similarity, metriky dabingu, latence.

*Pracovní předpoklady editora, které v proposalu nejsou: latence 3 s do prvního výsledku a 10 s pro analýzu 20 bloků, precision skrývání ≥ 90 % (z implementačního plánu; viz ZF-20). Závazné prahy proposalu jsou jen tři výše.*

**Postup testu:** 5–8 rozhovorů s uživateli Chromu a test prototypu se 3–5 lidmi na ~24 stránkách (více domén). Preferovanou oblast u každé stránky předem označí dva hodnotitelé. Část sady slouží k ladění, část k finálnímu hodnocení.

## 8. Rizika

Chybné skrytí nebo neskrytí bloku, různorodost HTML, zkreslené shrnutí, soukromí, závislost na AI službách (cena, odezva), právně problematický hlas, silná konkurence, přecenění rozsahu. Mitigace jsou v proposalu (§6) a v implementačním plánu (§4).

## 9. Otevřená rozhodnutí

1. Textový model a TTS služba.
2. Konkrétní historická osobnost a podmínky použití hlasu.
3. Způsob provozu backendu a limit nákladů.
4. Konkrétní seznam kategorií témat a tónu v MVP.
5. Rozdělení rolí a kapacita členů týmu.

## 10. Změny oproti verzi 0.1

| Téma | v0.1 | v0.2 (podle proposalu) |
|---|---|---|
| Skrývání | Jen celé stránky | Bloky (výpisy, sekce, komentáře) + box „Zobrazit“ |
| Kategorie | Téma a styl celého článku | Téma × tón, po blocích |
| Shrnutí | Na vyžádání, s kartami zdrojů | Respektuje preference, uvádí vynechaná témata a použité preference |
| Hlas | Nativní TTS, externí hlas mimo rozsah | Syntetický hlas historické osobnosti s označením |
| Karty zdrojů | Must-have | Should-have (pracovní předpoklad editora) |
| Test | 20 + 30–50 článků | ~24 stránek, 2 hodnotitelé, 5–8 rozhovorů, 3–5 lidí na prototypu |
