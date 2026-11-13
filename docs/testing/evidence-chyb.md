# Evidence chyb (ZF-13)

> **Stav:** ruční provádění checklistu [`checklist-m2.md`](checklist-m2.md) běží od 13. 11. 2026. Řádky se přidávají jen z reálného testu.

## Pravidla zápisu

1. **Jedna chyba, jeden řádek.** Dvě různé příčiny jsou dva řádky. Stejná chyba nalezená znovu se nezakládá podruhé: dopiš do původního řádku datum a stránku a označ to ve sloupci Skutečný výsledek.
2. **ID chyby** je `B-001`, `B-002`, … podle pořadí zápisu, bez mezer a bez přečíslování. Na ID se odkazuje ve sloupci Bug v `checklist-m2.md` a v issue.
3. **Kroky musí jít zopakovat.** Číslované kroky od otevřené stránky po chybu, včetně nastavení přepínačů, zda běžel backend a jak (skutečný, stub, atrapa), prohlížeče a jeho verze. Bez opakovatelných kroků je řádek jen poznámka a nemá status „potvrzená“.
4. **Očekávaný výsledek** se přebírá z `checklist-m2.md` (nebo z dokumentu, který tam uvádí). Pokud scénář ve sloupci očekávaného výsledku říká UNSPECIFIED, nepiš, co „by mělo“ být; napiš, co jsi viděl, a odkaz na otevřenou otázku v checklistu.
5. **Skutečný výsledek** je to, co se stalo, bez domněnek o příčině. Příčinu, pokud ji znáš, napiš do issue, ne sem.
6. **Chyba klasifikace není chyba UI** (blok skrytý nebo neskrytý jinak, než říká anotace). Zapiš ji jako poznámku do tabulky „Poznámky ke klasifikaci“ níže, ne mezi chyby; ve sloupci Související issue uveď ZF-06 nebo ZF-14. Pravidlo potvrdil tým 13. 11. 2026.
7. **Žádná tajemství a osobní údaje.** Nepiš cookies, tokeny, klíče, hesla, obsah `.env`, přihlašovací údaje, e-maily, telefony ani jiné kontaktní údaje a nepiš jména lidí mimo tým (autoři, komentátoři, uživatelé na testovaných stránkách). Členy týmu uváděj jen křestním jménem, a to jen ve sloupci Tester. Do URL nepiš parametry s osobními údaji, tokeny ani identifikátory relací; ořež je. Nevkládej texty stránek nad nezbytný krátký úryvek (jedna věta) a jen z povolených zdrojů (`docs/testing/pilot/stranky.md`).
8. **Snímky obrazovky:** do repozitáře se obrázky nevkládají. Ulož je mimo repozitář a do sloupce kroků nebo skutečného výsledku napiš jen **název souboru** (např. `B-001-popup.png`). Na snímku nesmí být tajemství ani osobní údaje.
9. **Datum** je `RRRR-MM-DD`, **build/commit** je výstup `git rev-parse --short HEAD` v den testu, **tester** je křestní jméno člena týmu, který chybu našel (jen křestní jméno, žádný e-mail ani jiný kontakt).
10. **Související issue** je ZF-xx, kterého se chyba týká (např. ZF-10 skrývání, ZF-12 chybové stavy). Pokud jde o opravu už zavřeného issue, napiš to do poznámky.
11. **Stav a závažnost mění ten, kdo je opravuje nebo ověřuje**, ostatní sloupce se po zápisu nemění; když je údaj špatně, oprav ho a v poznámce uveď dnešní datum.
12. Chyba, která porušuje pevná pravidla návrhu z `docs/mvp.md` (změna textu stránky, ztráta nebo poškození obsahu, nevratné skrytí, odeslání dat bez akce uživatele), je vždy **blocker** (viz níže).

## Číselníky (potvrzeno týmem 13. 11. 2026)

Dokumentace závažnost ani stavy chyb nedefinuje; níže uvedené číselníky tým potvrdil 13. 11. 2026.

| Závažnost | Význam |
|---|---|
| blocker | Poruší pevné pravidlo návrhu (`docs/mvp.md`): obsah stránky zmizí, změní se nebo se nedá obnovit; data odejdou bez akce uživatele; nebo scénář nejde provést vůbec. |
| major | Scénář nesplní očekávaný výsledek, ale obsah stránky je v pořádku (např. špatná zpráva, nesprávný stav, nefunkční tlačítko). |
| minor | Kosmetika nebo nepřesnost, která nebrání scénáři (např. text, zarovnání). |

| Status | Význam |
|---|---|
| nová | Zapsáno, nepotvrzeno druhým člověkem. |
| potvrzená | Reprodukováno podle kroků. |
| v řešení | Má vlastníka. |
| opravená | Oprava je v kódu, čeká na ověření testerem. |
| ověřená | Tester znovu provedl scénář a prošel. |
| zamítnutá | Není chyba (uveď důvod, např. odkaz na dokument). |

## Tabulka chyb

| Bug ID | Datum | Tester | Build/commit | URL stránky | ID scénáře | Kroky k reprodukci | Očekávaný výsledek | Skutečný výsledek | Závažnost | Status | Související issue |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B-001 | 2026-11-13 | Libuše | (doplnit: výstup `git rev-parse --short HEAD`) | https://cs.wikipedia.org/wiki/Globální_oteplování | UI-11 | 1. Skutečný backend (`uvicorn app.main:app`), Chrome, emulace zařízení vypnutá.<br>2. Otevři stránku a načti ji znovu (Cmd+R).<br>3. Zapni všech pět témat i tón.<br>4. Klikni jednou na Analyzovat.<br>5. V konzoli spusť `document.querySelectorAll('[data-zenfeed-box]').length` a `document.querySelectorAll('[data-zenfeed-hidden]').length`. | Počet boxů = počet prvků s `data-zenfeed-hidden` = N ve stavu (`checklist-m2.md`, UI-11). | Stav „Skryté bloky: 21 z 400“, boxů 21, prvků s `data-zenfeed-hidden` 35 (značky: P, H2, DIV, SECTION, H3, H4, FIGCAPTION, 6× LI). Text bloků zůstal beze změny. | major | nová | ZF-10 |

## Poznámky ke klasifikaci (ne chyby UI)

Sem patří případ, kdy klasifikátor zařadil blok, skryl nebo neskryl jinak, než říká anotace (`docs/testing/pilot/`). Je to poznámka pro ZF-06 nebo ZF-14, ne chyba rozšíření. ID je `N-001`, `N-002`, … podle pořadí zápisu. Do sloupce „Stránka a blok“ napiš URL bez osobních parametrů a ID bloku (např. `zf-12`), ne text bloku. Text z blokových stránek sem nekopíruj.

| ID | Datum | Tester | Build/commit | Stránka a blok | ID scénáře | Co udělal klasifikátor | Co říká anotace | Související issue |
|---|---|---|---|---|---|---|---|---|

## Tvar řádku (ukázka formátu, ne skutečná chyba)

Hranaté závorky jsou místa k vyplnění; nic z toho není zjištěné chování.

| Bug ID | Datum | Tester | Build/commit | URL stránky | ID scénáře | Kroky k reprodukci | Očekávaný výsledek | Skutečný výsledek | Závažnost | Status | Související issue |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B-[číslo] | [RRRR-MM-DD] | [křestní jméno člena týmu] | [hash] | [URL bez osobních parametrů] | UI-[číslo] | 1. [krok]<br>2. [krok]<br>3. [krok] | [z checklistu] | [co se stalo]; snímek: [název-souboru.png] | [blocker / major / minor] | [nová] | ZF-[číslo] |