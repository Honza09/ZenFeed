# ZenFeed – implementační plán na 4 týdny

**Role:** Lead Architect / Project Manager  
**Tým:** Jan Kostrhun, Daniel Holub, Jakub Procházka, Libuše Babičková  
**Délka:** 4 týdny (20 pracovních dnů)  
**Výstup:** Funkční MVP rozšíření Google Chrome pro analýzu a filtrování obsahu, shrnutí a volitelný TTS dabing.

> **Poznámka k zadání:** V původním požadavku nebyl vložen skutečný text projektového proposalu, pouze zástupný text. Plán proto vychází z požadavků uvedených v zadání. Cílové metriky, rozpočet a další omezení neuvedená v zadání je nutné potvrdit během prvního týdne.

## Obsah

1. [Architektura a technický stack](#1-architektura-a-technický-stack)
2. [Čtyřtýdenní harmonogram a milníky](#2-čtyřtýdenní-harmonogram-a-milníky)
3. [Rozpad na úkoly a alokace rolí](#3-rozpad-na-úkoly-a-alokace-rolí)
4. [Řízení rizik a mitigace](#4-řízení-rizik-a-mitigace)
5. [Metodika testování](#5-metodika-testování)
6. [První pracovní den](#6-první-pracovní-den)

---

# 1. ARCHITEKTURA A TECHNICKÝ STACK

## 1.1 Architektonický přehled

Základní princip: **prohlížeč řídí vykreslování a uživatelské preference, backend zajišťuje AI analýzu a rozšíření aplikuje výsledky na konkrétní bloky stránky.**

```text
┌───────────────────────────────────────────┐
│             Libovolná webová stránka      │
│      DOM · články · diskuse · feedy       │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│       Chrome Extension – Manifest V3      │
│ Content script · segmentace · popup       │
│ Správa bloků · preference · audio UI      │
└─────────────────────┬─────────────────────┘
                      │ HTTPS / JSON
┌─────────────────────▼─────────────────────┐
│               Backend – FastAPI           │
│ Validace · normalizace · orchestrace      │
│ Pydantic · timeouty · cache               │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│                  AI / ML                  │
│ Klasifikace · toxicita · shrnutí · TTS    │
└───────────────────────────────────────────┘
```

Backend nesmí posílat pokyny typu „skryj element číslo 5“ bez jednoznačného identifikátoru. Každý blok musí mít identifikátor vytvořený pro konkrétní analýzu, aby bylo možné výsledek klasifikace bezpečně přiřadit k původnímu DOM elementu.

## 1.2 Chrome Extension – Manifest V3

### Doporučený stack

- **TypeScript** pro typovou kontrolu a údržbu.
- **Chrome Extension Manifest V3**.
- **Content scripts** pro extrakci a práci s DOM.
- **Popup** pro preference a ruční ovládání.
- `chrome.storage.local` pro lokální nastavení.
- `chrome.runtime` pro komunikaci mezi komponentami.
- `chrome.tabs` a oprávnění `activeTab` pro omezený přístup k aktivní kartě.
- Podle zvoleného způsobu injektáže také `chrome.scripting`.

### Navržená struktura projektu

```text
zenfeed/
├── extension/
│   ├── manifest.json
│   ├── src/
│   │   ├── content/
│   │   │   ├── extractor.ts
│   │   │   ├── segmenter.ts
│   │   │   ├── block-manager.ts
│   │   │   └── overlay.ts
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.ts
│   │   │   └── preferences.ts
│   │   └── shared/
│   │       └── types.ts
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── services/
│   │   └── api/
│   └── tests/
└── docs/
```

### A. Content script – extrakce a segmentace

Odpovědnosti:

1. Projít DOM stránky a identifikovat kandidátní obsahové bloky.
2. Rozpoznat články, odstavce, komentáře, příspěvky, nadpisy a doporučené položky.
3. Sloučit příliš malé elementy do smysluplných celků.
4. Vyloučit navigaci, formuláře, skripty, interaktivní ovládací prvky a kontejnery bez relevantního textu.
5. Přiřadit blokům identifikátory, text a metadata.
6. Odeslat bloky k analýze a přiřadit výsledky zpět ke konkrétním elementům.
7. Umožnit skrytí, obnovení a zobrazení důvodu zásahu.

Segmentaci postavit na kombinaci sémantických elementů (`article`, `main`, `section`, `p`, `li`) a heuristik nad velikostí, délkou textu a strukturou DOM. Nepoužívat samotné názvy CSS tříd jako univerzální řešení.

### B. Správa bloků

Každý blok bude reprezentován záznamem:

```typescript
type ContentBlock = {
  id: string;
  text: string;
  element: HTMLElement;
  kind: "article" | "comment" | "post" | "other";
  hidden: boolean;
};
```

Pole `element` zůstává výhradně v prohlížeči. Do backendu se posílají pouze serializovaná data.

Správce bloků musí podporovat:

- Skrytí a opětovné zobrazení.
- Zachování původního obsahu pro obnovení.
- Uložení důvodu skrytí a možnost „Zobrazit přesto“.
- Ochranu před dvojitou aplikací změn.
- Reakci na dynamické načítání obsahu přes `MutationObserver`, s omezením frekvence a bez nekonečných smyček.

### C. Popup a preference

Popup bude obsahovat:

- Přepínače kategorií obsahu.
- Nastavení citlivosti moderace.
- Režim „Analyzovat“, „Pozastavit“ a „Obnovit vše“.
- Přehled počtu skrytých bloků.
- Akci „Proč byl tento obsah skryt?“
- Spuštění shrnutí a přehrávání audia.

Pro první verzi postačí minimalistické rozhraní bez frameworku, pokud tým nemá připravený React boilerplate.

### Poznámka k oprávněním Manifest V3

Oprávnění `activeTab` poskytuje dočasný přístup k aktivní kartě po uživatelské interakci. Samo o sobě nezajišťuje automatické spuštění content scriptu na všech stránkách. Pro MVP je vhodné po kliknutí na „Analyzovat“ vložit script přes `chrome.scripting.executeScript` a podle potřeby povolit oprávnění `scripting`. Alternativou jsou předem deklarované content scripts a odpovídající host permissions. Výběr je nutné ověřit během prvního týdne.

## 1.3 Backend – Python, FastAPI a Pydantic

### Doporučený stack

| Oblast | Technologie | Účel |
|---|---|---|
| API | FastAPI | Asynchronní HTTP rozhraní |
| Validace | Pydantic v2 | Strukturované vstupy a výstupy |
| Server | Uvicorn | Lokální vývoj a běh API |
| Testování | pytest, httpx | Unit a integrační testy |
| Konfigurace | pydantic-settings | Proměnné prostředí a konfigurace |
| Cache | Volitelně cache v paměti | Omezení opakovaných AI požadavků |
| Typování | Python type hints | Kontrola kontraktů a údržba |

### Navržené API

| Endpoint | Metoda | Funkce |
|---|---|---|
| `/health` | GET | Kontrola dostupnosti backendu |
| `/v1/analyze` | POST | Klasifikace bloků a skóre toxicity |
| `/v1/summarize` | POST | Shrnutí článku nebo vybraných bloků |
| `/v1/tts` | POST | Generování řeči nebo předání úlohy TTS poskytovateli |

### Příklad kontraktu pro analýzu

```python
from typing import Literal
from pydantic import BaseModel, Field


class ContentBlockInput(BaseModel):
    id: str
    text: str = Field(min_length=1, max_length=8000)
    kind: Literal[
        "article", "comment", "post", "other"
    ] = "other"


class AnalysisRequest(BaseModel):
    blocks: list[ContentBlockInput] = Field(
        min_length=1, max_length=100
    )
    preferences: dict[str, bool]


class BlockAnalysis(BaseModel):
    id: str
    category: str
    toxicity_score: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    recommended_action: Literal["show", "hide", "review"]


class AnalysisResponse(BaseModel):
    results: list[BlockAnalysis]
    model_version: str
```

Jde o výchozí kontrakt, nikoliv finální bezpečnostní specifikaci. Preferencím je vhodné později přiřadit vlastní typovaný model a povolené kategorie místo obecného slovníku.

### Povinné zásady backendu

- Validovat délku a počet bloků.
- Omezit velikost requestu.
- Používat timeouty, limity souběhu a řízené opakování požadavků.
- Oddělit AI poskytovatele od obchodní logiky pomocí rozhraní služeb.
- Vrátit validovaný JSON; při nevalidním výstupu provést nejvýše omezenou opravu nebo vrátit bezpečnou chybu.
- Nespoléhat na to, že samotný prompt zajistí validní JSON.
- Nezaznamenávat surový text uživatelů do běžných logů.
- API klíče ukládat v proměnných prostředí, nikoli v repozitáři.

## 1.4 AI / ML vrstva

### 1. Zero-shot klasifikace

Klasifikovat bloky podle kategorií definovaných v preferencích uživatele. Příklady kategorií: politický obsah, clickbait, sport, celebrity nebo konfliktní diskuse.

**Výstup:** kategorie, skóre jistoty a doporučená akce.

Kategorie musí být konfigurovatelné; konkrétní taxonomie se potvrdí v prvním týdnu.

**MVP:** LLM s instrukcemi a strukturovaným JSON výstupem. Pokud bude latence příliš vysoká, porovnat menší klasifikační model.

### 2. Detekce toxicity

Oddělit detekci toxického jazyka od tematické klasifikace. Vyhodnocovat pravděpodobnost urážek, obtěžování nebo agresivního jazyka.

Prototyp může využít moderovací API nebo specializovaný klasifikační model. Citlivé rozhodnutí nesmí stát pouze na jediném skóre bez prahu a možnosti obnovení obsahu.

**MVP:** skóre 0–1, konfigurovatelný práh a ruční obnovení bloku.

### 3. Abstraktivní shrnutí

Vstupem bude text článku nebo omezený výběr relevantních bloků. Výstup má obsahovat stručné shrnutí, hlavní body a případně seznam tvrzení či témat, která vyžadují pozornost.

Použít oddělený endpoint, limit délky vstupu, jasně definovanou délku výstupu a ochranu před instrukcemi vloženými do analyzovaného textu.

**MVP:** 3–5 vět, možnost zkrácení a explicitní chybový stav při selhání modelu.

### 4. Text-to-speech a historický hlas

Generovat zvuk ze shrnutí, nikoliv automaticky z celého webu. Použít TTS službu s povoleným hlasovým profilem, případně předem připravený hlasový preset. Přehrávač musí mít ovládání přehrávání, pauzy a zastavení.

**MVP:** jeden historicky stylizovaný hlas. Konkrétní napodobení reálné historické osobnosti pouze při odpovídajícím oprávnění a dostupné technologii; jinak použít obecný hlas inspirovaný historickým stylem.

### Doporučené pořadí zpracování

1. Extrakce a segmentace na klientovi.
2. Kontrola a normalizace vstupu.
3. Klasifikace a detekce toxicity v dávkách.
4. Aplikace uživatelských preferencí.
5. Shrnutí zobrazeného nebo vybraného obsahu.
6. Volitelné TTS.
7. Zpětná vazba a možnost vrácení skrytých bloků.

Klasifikace a toxicita mohou běžet společně. Shrnutí a TTS se mají spouštět až na vyžádání, aby se šetřila latence i náklady.

---

# 2. ČTYŘTÝDENNÍ HARMONOGRAM A MILNÍKY

## 2.1 Přehled sprintů

| Sprint | Téma | Milník | Výsledek |
|---|---|---|---|
| 1. týden | Infrastruktura a ověření rizik | M1 | Segmentační PoC, běžící FastAPI a první AI klasifikace |
| 2. týden | Chrome Extension a práce s bloky | M2 | Rozšíření s extrakcí, filtrováním, obnovením a popupem |
| 3. týden | Shrnutí a audio | M3 | End-to-end průchod včetně shrnutí a TTS |
| 4. týden | Testování a odevzdání | M4 | Testy 24 stránek, metriky, dokumentace a demo |

## 2.2 Týden 1 – infrastruktura a proof of concept

**Cíl:** Ověřit největší technickou nejistotu – robustní segmentaci různých HTML stránek – a současně zprovoznit backend s AI klasifikací.

| Den | Konkrétní práce | Výstup |
|---|---|---|
| 1 | Kick-off, definice kategorií, metrik a rozsahu MVP; založení repozitáře, issues a CI | Schválený scope, backlog a Definition of Done |
| 2 | Extrakce DOM a první segmentace na statických i dynamických stránkách | Extrakční PoC |
| 3 | Normalizace textu, stabilní ID bloků, základní heuristiky a testovací fixture | Strukturované bloky v JSON |
| 4 | FastAPI, Pydantic schémata, první LLM klasifikace a validace výstupů | Funkční `/v1/analyze` |
| 5 | Integrační test, benchmark latence, vyhodnocení segmentace a rozhodnutí o architektuře | Milník M1 a rozhodnutí o rizicích |

### Kritické experimenty

- Ověřit alespoň 6 různých stránek, ideálně z různých domén a s různou strukturou.
- Zahrnout statický článek, komentáře, sociální feed, dynamicky načítaný obsah, stránku s vnořenými elementy a stránku s reklamními kontejnery.
- Ručně označit očekávané obsahové bloky.
- Změřit podíl nalezených bloků, podíl správně oddělených bloků a čas extrakce.
- Porovnat AI výstup se sadou ručně označených vzorků.

### Akceptační kritéria M1

- Backend se spouští lokálně podle README.
- API přijímá a vrací validní strukturovaná data.
- Extraktor pracuje minimálně na 5 ze 6 pilotních stránek bez kritického selhání.
- Klasifikátor vrací výsledek pro každý validní blok, nebo explicitní chybu.
- Jsou zaznamenány baseline hodnoty latence a kvality.

**Go/no-go rozhodnutí:** Pokud univerzální segmentace selhává, omezit MVP na hlavní obsahové oblasti identifikované heuristikami a deklarovat podporované typy stránek. Nepokoušet se za každou cenu garantovat perfektní rozpoznání každého DOM elementu na libovolném webu.

## 2.3 Týden 2 – Chrome Extension a uživatelské rozhraní

**Cíl:** Propojit extrakci, backend a manipulaci s DOM do použitelného rozšíření.

| Den | Konkrétní práce | Výstup |
|---|---|---|
| 6 | Manifest V3, načtení rozšíření v Chrome, oprávnění a komunikace | Základ rozšíření |
| 7 | Content script, extrakce bloků, mapování ID na DOM elementy | Funkční seznam bloků |
| 8 | Skrytí, obnovení, důvody skrytí a ochrana před dvojím zpracováním | Block manager |
| 9 | Popup, preference, stav analýzy a tlačítka pro obnovení | Použitelné UI |
| 10 | Propojení s backendem, dynamické stránky a integrační testy | Milník M2 |

### Akceptační kritéria M2

- Rozšíření lze načíst jako unpacked extension.
- Uživatel spustí analýzu explicitním kliknutím.
- Výsledek backendu je přiřazen správnému DOM bloku podle ID.
- Uživatel může skrýt i obnovit obsah bez trvalého poškození stránky.
- Preference se zachovají po zavření popupu.
- Chyba backendu nezpůsobí zmizení nebo poškození obsahu.
- Dynamické změny stránky nezpůsobují nekonečné opakování analýzy.

**Výstup pro demonstraci:** Otevřít testovací článek, aktivovat ZenFeed, zapnout jednu kategorii k filtrování, ukázat skryté bloky a následně je obnovit.

## 2.4 Týden 3 – shrnutí, Pydantic a TTS

**Cíl:** Dodat uživateli nejen filtrování, ale i rychlý přehled a zvukový výstup.

| Den | Konkrétní práce | Výstup |
|---|---|---|
| 11 | Finální typované modely pro analýzu, preference a shrnutí | Stabilní API kontrakty |
| 12 | Shrnutí článku, limit délky a validace výstupu | Funkční `/v1/summarize` |
| 13 | Integrace TTS poskytovatele a hlasového profilu | Funkční `/v1/tts` |
| 14 | Audio přehrávač, stavy načítání, chyba a opakování | Integrovaný přehrávač |
| 15 | End-to-end scénář a kontrola faktické věrnosti shrnutí | Milník M3 |

### Akceptační kritéria M3

- Shrnutí lze vygenerovat z vybraného obsahu.
- Strukturované výstupy jsou validovány přes Pydantic.
- Nevalidní výstup modelu nezpůsobí pád aplikace.
- Audio lze přehrát, pozastavit a zastavit.
- Selhání TTS neblokuje filtrování ani shrnutí.
- Shrnutí neobsahuje zjevná nepodložená fakta v ověřované testovací sadě.
- Uživatel je informován o načítání a případném selhání.

**Omezení rozsahu:** Pokud TTS poskytovatel nebo přístup k požadovanému hlasu nebude k dispozici, implementovat adaptér a dokončit přehrávač s dostupným hlasem. Historicky stylizovaný dabing zůstane samostatným experimentálním cílem, nikoliv podmínkou funkčnosti celého rozšíření.

## 2.5 Týden 4 – testování, ladění a odevzdání

**Cíl:** Změřit kvalitu na reprezentativní sadě, odstranit kritické chyby a připravit obhajitelné výsledky.

| Den | Konkrétní práce | Výstup |
|---|---|---|
| 16 | Dokončení 24stránkové testovací sady, anotace a spuštění testů | Testovací dataset |
| 17 | Měření kvality filtrování, respektování preferencí a latence | Tabulka metrik |
| 18 | Opravy chyb, regresní testy a kontrola soukromí | Stabilizované MVP |
| 19 | README, architektura, známá omezení a návod k instalaci | Dokumentace |
| 20 | Závěrečné demo, prezentace, rozdělení řečnických částí a záložní scénář | Milník M4 |

### Akceptační kritéria M4

- Všech 24 stránek má zaznamenaný výsledek nebo důvod, proč ji nebylo možné vyhodnotit.
- Základní metriky jsou vypočítány ze zaznamenaných dat.
- Respektování preferencí dosahuje alespoň 80 % podle předem definované metodiky.
- Nejsou otevřené kritické chyby v instalaci, skrývání a obnovení bloků.
- Jsou zdokumentována omezení, známé chyby a reprodukovatelné kroky k demonstraci.
- Prezentace obsahuje demo, naměřené výsledky a limity řešení.

---

# 3. ROZPAD NA ÚKOLY A ALOKACE ROLÍ

## 3.1 Rozdělení odpovědností

### Jan Kostrhun – Lead Architect / integrace

**Odpovědnost:** architektura, technická rozhodnutí, API kontrakty, integrace, CI a release.

- Stanovit strukturu repozitáře a pravidla code review.
- Navrhnout kontrakty mezi rozšířením a backendem.
- Ověřit oprávnění Manifest V3 a bezpečnost komunikace.
- Koordinovat integrační testy a řídit rozsah MVP.

### Daniel Holub – AI / ML a backend

**Odpovědnost:** FastAPI, Pydantic, klasifikace, toxicita, shrnutí a TTS integrace.

- Implementovat `/v1/analyze` a typované výstupy.
- Porovnat vhodné modely a nastavit klasifikační prahy.
- Implementovat `/v1/summarize`.
- Připravit TTS adaptér a testy chybových stavů.

### Jakub Procházka – Chrome Extension / frontend

**Odpovědnost:** DOM segmentace, obsahové bloky, manipulace s DOM a popup.

- Vytvořit content script a extraktor.
- Implementovat identifikátory a správu bloků.
- Zajistit skrytí, obnovení a podporu dynamického obsahu.
- Implementovat popup, preference a audio přehrávač.

### Libuše Babičková – QA / testování / UX a dokumentace

**Odpovědnost:** testovací metodika, anotace, akceptační testy, měření a prezentace.

- Připravit 24stránkovou sadu a očekávané výsledky.
- Vytvořit testovací checklist a evidenci chyb.
- Měřit metriky kvality, latence a uživatelského přehledu.
- Připravit instalační návod, dokumentaci a prezentaci.

Toto je primární rozdělení odpovědnosti, nikoliv izolace členů. Jan a Daniel musí průběžně kontrolovat API kontrakty; Jakub a Libuše musí společně ověřovat, zda skrytí obsahu odpovídá očekávanému uživatelskému chování.

## 3.2 Backlog připravený pro Jira, Trello nebo GitHub Projects

Odhady jsou v člověkodnech (ČD) a představují plánovací odhad, nikoliv naměřenou pracnost.

| ID | Epic / úkol | Vlastník | Sprint | Odhad |
|---|---|---|---:|---:|
| ZF-01 | Založení repozitáře, CI a konvencí | Jan | 1 | 0,5 |
| ZF-02 | Definice API kontraktů a architektury | Jan + Daniel | 1 | 1 |
| ZF-03 | DOM extraktor a segmentace PoC | Jakub | 1 | 2 |
| ZF-04 | Pilotní stránky a ruční anotace | Libuše | 1 | 1,5 |
| ZF-05 | FastAPI a Pydantic schémata | Daniel | 1 | 1,5 |
| ZF-06 | Zero-shot klasifikace PoC | Daniel | 1 | 1,5 |
| ZF-07 | Vyhodnocení segmentace a go/no-go | Jan + Libuše | 1 | 1 |
| ZF-08 | Manifest V3, oprávnění a bootstrap | Jakub | 2 | 1 |
| ZF-09 | Extrakce a mapování ID na DOM | Jakub | 2 | 2 |
| ZF-10 | Skrytí, obnovení a dynamické bloky | Jakub | 2 | 2 |
| ZF-11 | Popup a preference | Jakub | 2 | 2 |
| ZF-12 | Integrace API a chybové stavy | Jan + Daniel | 2 | 1,5 |
| ZF-13 | Testy UI a integrační checklist | Libuše | 2 | 1,5 |
| ZF-14 | Finální typované modely a validace | Daniel | 3 | 1 |
| ZF-15 | Abstraktivní shrnutí | Daniel | 3 | 1,5 |
| ZF-16 | TTS adaptér a hlasový profil | Daniel | 3 | 1,5 |
| ZF-17 | Audio přehrávač a integrace UI | Jakub | 3 | 1 |
| ZF-18 | End-to-end integrace a regresní testy | Jan + Libuše | 3 | 1,5 |
| ZF-19 | Dokončení 24stránkové sady | Libuše | 4 | 1,5 |
| ZF-20 | Měření metrik a analýza výsledků | Libuše + Jan | 4 | 2 |
| ZF-21 | Opravy kritických chyb | Všichni | 4 | 3 |
| ZF-22 | Dokumentace a instalační návod | Jan + Libuše | 4 | 1,5 |
| ZF-23 | Prezentace a závěrečné demo | Všichni | 4 | 1,5 |

Člověkodny v tabulce se týkají konkrétních uvedených úkolů. Nezahrnují veškerý čas na koordinaci, průběžnou komunikaci, čekání na externí služby a nepředvídané opravy. Je proto nutné vyhradit rezervu.

## 3.3 Workflow a pravidla řízení projektu

Doporučené sloupce v nástroji:

`Backlog → Ready → In Progress → Review → Testing → Done`

Pravidla:

- Každý úkol má právě jednoho vlastníka.
- Úkol lze přesunout do `Ready`, jen pokud má jasné zadání a akceptační kritéria.
- Každá změna prochází code review jiným členem týmu.
- API kontrakty se mění pouze po dohodě Jana a Daniela.
- Úkol není `Done`, dokud nemá splněné akceptační podmínky a relevantní test.
- Kritická chyba blokuje release.
- Úkoly trvající déle než dva pracovní dny bez průběžného výstupu se rozdělí na menší části.

### Rytmus týmu

- **Denně:** 10 minut na překážky a plán dne.
- **Začátek týdne:** plánování sprintu a potvrzení kapacity.
- **Uprostřed týdne:** krátká integrační kontrola.
- **Konec týdne:** demo, vyhodnocení metrik a retrospektiva.
- **Každý pátek:** rozhodnutí, co se přesouvá do dalšího sprintu a co se vyřazuje z rozsahu.

---

# 4. ŘÍZENÍ RIZIK A MITIGACE

Rizika je nutné řídit podle pravděpodobnosti, dopadu a okamžiku, kdy je ještě možné změnit architekturu bez zásadního přepracování.

## 4.1 Registr rizik

| ID | Riziko | Pravděpodobnost / dopad | Vlastník |
|---|---|---|---|
| R1 | Nestandardní HTML a chybné rozdělení bloků | Vysoká / vysoký | Jakub |
| R2 | Latence a náklady AI API | Vysoká / vysoký | Daniel |
| R3 | Fakticky nepřesná shrnutí | Střední / vysoký | Daniel + Libuše |
| R4 | Únik soukromého nebo citlivého obsahu | Střední / kritický | Jan |
| R5 | Nesprávné skrytí legitimního obsahu | Střední / vysoký | Jakub + Libuše |
| R6 | Nedostupnost TTS nebo požadovaného hlasu | Střední / střední | Daniel |
| R7 | Rozsah projektu překročí čtyři týdny | Vysoká / vysoký | Jan |
| R8 | Neplatné nebo nekonzistentní výstupy LLM | Střední / vysoký | Daniel |
| R9 | Změny DOM způsobí chyby nebo opakované analýzy | Vysoká / střední | Jakub |

## 4.2 R1 – Nestandardní HTML struktury webů

**Problém:** Weby používají různá rozložení, vlastní komponenty, vnořené elementy a dynamické načítání. Jeden univerzální selektor nebude spolehlivě fungovat všude.

### Mitigace

1. V prvním týdnu vytvořit reprezentativní pilotní sadu.
2. Upřednostnit sémantické elementy a oblasti `main` a `article`.
3. Pokud sémantická struktura chybí, použít heuristiky délky textu, velikosti a hustoty textového obsahu.
4. Vyloučit skripty, formuláře, navigaci a interaktivní prvky.
5. Použít stabilní ID bloků v rámci jednoho běhu analýzy.
6. Oddělit logiku extrakce od logiky skrytí.
7. U dynamických webů sledovat změny přes `MutationObserver`, ale dávkovat zpracování a ignorovat vlastní změny ZenFeed.
8. U neznámé nebo nekvalitně extrahované stránky zobrazit upozornění a nabídnout režim bez automatického filtrování.

**Fallback:** Pokud extrakce nedosáhne definované kvality, ZenFeed danou stránku pouze analyzuje v omezeném režimu nebo filtrování deaktivuje. Nesprávné automatické skrytí je horší než nepodporovaná stránka.

## 4.3 R2 – Latence AI a náklady

**Problém:** Jedna stránka může obsahovat desítky až stovky bloků. Jednotlivá volání modelu pro každý blok způsobí nepřijatelnou latenci a zvýšené náklady.

### Mitigace

- Posílat bloky po dávkách, například po 10–20 položkách podle limitů modelu.
- Měřit dobu od kliknutí po první výsledky a dobu do dokončení celé analýzy.
- Oddělit rychlou klasifikaci od dražšího shrnutí a TTS.
- Použít cache pro identický normalizovaný text, kategorii úlohy a verzi modelu; cache nesmí míchat rozdílné preference nebo citlivé kontexty.
- Zavést timeout, omezený počet opakování a řízení souběhu.
- Při částečném selhání zachovat úspěšné výsledky a umožnit opakování neúspěšných bloků.
- Neodesílat do AI více textu, než je nutné.

### Doporučené cíle pro MVP

Pokud proposal nestanoví jiné hodnoty:

- První použitelný výsledek do 3 sekund na běžné testovací stránce.
- Dokončení analýzy do 10 sekund pro dávku o 20 blocích.
- Shrnutí do 5 sekund.
- TTS může být asynchronní; cílem je zobrazit stav a přehrát zvuk, jakmile je dostupný.

Tyto hodnoty jsou cílové prahy pro experiment, nikoliv garantované vlastnosti zvoleného modelu.

## 4.4 R3 – Faktická věrnost shrnutí

**Problém:** Abstraktivní shrnutí může doplňovat neexistující informace, měnit význam nebo spojovat tvrzení, která spolu nesouvisejí.

### Mitigace

1. Shrnovat pouze obsah, který byl skutečně extrahován a předán modelu.
2. Oddělit fakta z původního článku od interpretací modelu.
3. Používat prompt, který výslovně zakazuje doplňování nepodložených faktů.
4. Nastavit maximální délku výstupu.
5. U důležitých tvrzení umožnit dohledání odpovídající části původního textu.
6. Ručně vyhodnotit vzorek shrnutí alespoň na 12 stránkách.
7. Zaznamenat faktické chyby, vynechaná klíčová fakta a nepodložená tvrzení.
8. Pokud shrnutí nelze spolehlivě vytvořit, zobrazit chybu místo předstírání jistoty.

**Fallback:** Zobrazit extrahované nadpisy nebo první věty původního textu místo nespolehlivého shrnutí.

## 4.5 R4 – Ochrana soukromí

**Problém:** Stránky mohou obsahovat soukromé zprávy, identifikátory, údaje z účtů nebo jiný citlivý obsah.

### Povinná opatření

- Analyzovat až po explicitní akci uživatele.
- Odesílat pouze minimální množství textu nezbytné pro požadovanou funkci.
- Standardně vyloučit formuláře, textová pole, obsah `input`, `textarea`, `contenteditable` a skryté elementy.
- Citlivé oblasti a stránky s přihlášením ve výchozím nastavení neanalyzovat automaticky.
- Neposílat cookies, tokeny, hlavičky, URL s citlivými parametry ani obsah nesouvisející s analýzou.
- Neponechávat surový text v serverových logách.
- Používat HTTPS při komunikaci s nasazeným backendem.
- API klíče ukládat pouze na serveru.
- Nastavit retenční politiku; pro MVP obsah neukládat trvale.
- Popsat uživateli, která data opouštějí prohlížeč a za jakým účelem.
- Prověřit podmínky zpracování dat zvoleným AI a TTS poskytovatelem.

Je nutné rozlišovat mezi `activeTab` jako oprávněním Chrome a ochranou soukromí. Samotné omezené oprávnění nezaručuje, že aplikace odesílá na server jen bezpečný obsah.

## 4.6 R5–R9 – Další mitigace

### Nesprávné skrytí

- Používat prahy jistoty.
- Zachovat možnost obnovit každý blok.
- Nikdy neodstraňovat DOM elementy trvale.
- Umožnit ruční výjimku.

### Nedostupnost TTS

- Oddělit TTS přes adaptér.
- Umožnit změnu poskytovatele.
- Dokončit základní aplikaci bez audio funkce.

### Překročení rozsahu

- Zmrazit rozsah na konci prvního týdne.
- Pokud se nestíhá, postupně vyřadit vlastní historický hlas, pokročilé animace a automatické filtrování při načtení stránky.
- Zachovat segmentaci, klasifikaci, ruční spuštění, skrytí a obnovení.

### Neplatný výstup LLM

- Použít typované schéma.
- Zavést omezené pokusy o opravu.
- Validovat ID.
- Použít bezpečný fallback pro bloky bez výsledku.

### Opakované zpracování DOM

- Dávkovat změny.
- Označovat vlastní elementy ZenFeed.
- Deduplikovat ID.
- Přidat limit počtu opakovaných analýz.

## 4.7 Kontrolní body rizik

- **Konec 1. týdne:** rozhodnutí, zda segmentace zvládá pilotní weby.
- **Konec 2. týdne:** kontrola, že žádné selhání API nezpůsobuje ztrátu obsahu.
- **Konec 3. týdne:** audit soukromí, ověření shrnutí a fallback TTS.
- **Konec 4. týdne:** uzavření kritických chyb a dokumentace zbytkových rizik.

---

# 5. METODIKA TESTOVÁNÍ

## 5.1 Návrh testovací sady 24 stránek

Testovací sada musí reprezentovat různá rozložení, nikoliv pouze 24 podobných článků. Vhodné je pokrýt alespoň šest typů obsahu po čtyřech stránkách.

| Typ obsahu | Počet | Co ověřit |
|---|---:|---|
| Zpravodajské články | 4 | Nadpisy, perex, text článku, vložené obrázky a doporučené články |
| Diskuse a komentáře | 4 | Vnořené odpovědi, krátké texty, toxický a netoxický obsah |
| Sociální feedy | 4 | Opakované karty příspěvků, autor, čas, text a interaktivní prvky |
| Blogy a dlouhé články | 4 | Dlouhé texty, seznamy, podnadpisy a citace |
| Dynamické weby | 4 | Obsah načítaný po scrollování a asynchronní změny DOM |
| Nestandardní stránky | 4 | Vnořené elementy, reklamy, multimédia a slabá sémantika |
| **Celkem** | **24** | |

Celkem má jít o 24 unikátních stránek, pokud možno z různých domén. Nejde o požadavek na 24 automaticky podporovaných webů, ale o reprezentativní validační vzorek.

U každé stránky zaznamenat:

- Identifikátor stránky a typ rozložení.
- Datum a verzi rozšíření.
- Počet očekávaných bloků podle ruční anotace.
- Počet nalezených bloků.
- Počet správně klasifikovaných bloků.
- Počet správně skrytých a chybně skrytých bloků.
- Dobu extrakce, klasifikace a celkového zpracování.
- Počet chyb a poznámky k reprodukci.

Stránky je vhodné testovat pouze tehdy, když je to v souladu s podmínkami jejich použití. U dynamických webů používat opakovatelné scénáře a kontrolovat, zda se obsah mezi běhy významně nezměnil.

## 5.2 Postup testovacího běhu

1. **Připravit referenční data.** Na každé stránce ručně označit obsahové bloky a jejich kategorie. Pro testování skrytí předem určit, které bloky mají být skryty podle zvolených preferencí.
2. **Spustit baseline bez filtrování.** Zaznamenat původní počet bloků, strukturu stránky a čas potřebný k ručnímu získání přehledu.
3. **Nastavit preference.** Zvolit stejné kategorie pro referenční anotaci i běh ZenFeed. Každá testovací stránka musí mít definované očekávané chování.
4. **Spustit analýzu.** Změřit dobu extrakce, první odpovědi a úplného dokončení. Uložit výsledky klasifikace.
5. **Ověřit skrytí a obnovení.** Porovnat skryté bloky s referenčním seznamem a zkontrolovat, že se všechny bloky dají obnovit.
6. **Změřit přehlednost.** Použít standardizovaný úkol: najít hlavní téma, dvě hlavní informace a případně klíčový závěr. Měřit čas a správnost odpovědí.
7. **Opakovat běhy.** Provést alespoň tři měření latence na stránku a zaznamenat medián. Kvalitu vyhodnocovat vůči ručně anotovanému referenčnímu vzorku.
8. **Vyhodnotit a opravit.** Seřadit chyby podle závažnosti, opravit nejčastější příčiny a znovu spustit regresní testy na všech relevantních typech stránek.

Pro férové srovnání času k přehledu je potřeba použít stejné otázky a podobně obtížný obsah. Ideálně testovat s několika účastníky, střídat pořadí variant a zaznamenat, zda stránku viděli předem.

## 5.3 Metriky úspěchu a výpočty

### A. Respektování preferencí – cíl alespoň 80 %

Pro každou vyhodnocovanou položku určit, zda ZenFeed rozhodl v souladu s referenčními preferencemi.

\[
\text{Preference compliance} =
\frac{\text{počet správných rozhodnutí}}
{\text{počet vyhodnocených rozhodnutí}}
\times 100\,\%
\]

Příklad: 200 správných rozhodnutí z 240 vyhodnocených znamená 83,3 %.

Tato metrika měří celkovou shodu, ale sama o sobě může skrývat časté chyby u menšinové kategorie. Proto je vhodné zvlášť vykázat:

- Precision pro obsah, který má být skryt.
- Recall pro obsah, který má být skryt.
- False positive rate pro obsah, který měl zůstat viditelný.

### B. Preciznost skrytí

\[
\text{Precision} = \frac{TP}{TP+FP}
\]

Kde:

- `TP` = správně skryté bloky.
- `FP` = nesprávně skryté bloky, které měly zůstat viditelné.

Precision odpovídá na otázku: *Když ZenFeed něco skryje, jak často je to správně?*

Pro uživatelskou důvěru je vhodné sledovat i recall:

\[
\text{Recall} = \frac{TP}{TP+FN}
\]

Kde `FN` jsou bloky, které měly být skryté, ale zůstaly viditelné.

**Doporučený interní cíl:** precision alespoň 90 % na ručně anotovaném vzorku a současně preference compliance alespoň 80 %. Jde o navržené cíle pro MVP, nikoliv o potvrzené požadavky chybějícího proposalu.

### C. Čas k přehledu

Měřit čas od okamžiku, kdy testující dostane stránku, do správné odpovědi na definované otázky.

\[
\text{Time saved} =
\frac{T_{\text{baseline}}-T_{\text{ZenFeed}}}
{T_{\text{baseline}}}
\times 100\,\%
\]

Doporučuje se uvádět medián času, relativní úsporu a správnost odpovědí. Samotné zkrácení času není úspěch, pokud se uživatel přehledem nedozví správné informace.

### D. Latence

Měřit samostatně:

- Čas extrakce DOM.
- Čas do první odpovědi backendu.
- Čas do dokončení klasifikace.
- Čas generování shrnutí.
- Čas generování audia.

Reportovat medián a 95. percentil, pokud je počet měření dostatečný. Pro malé vzorky uvést i počet pozorování a maximální hodnotu.

### E. Spolehlivost obnovení

\[
\text{Restore success} =
\frac{\text{úspěšně obnovené bloky}}
{\text{všechny bloky určené k obnovení}}
\times 100\,\%
\]

Pro tento ukazatel doporučuji požadovat 100 % v rámci testovaných scénářů.

## 5.4 Vyhodnocovací tabulka

Tuto tabulku vyplňovat po každém testovacím běhu.

| Metrika | Cílová hodnota | Naměřeno | Stav |
|---|---:|---:|---|
| Respektování preferencí | ≥ 80 % | — | Nezměřeno |
| Precision skrytí | ≥ 90 %* | — | Nezměřeno |
| Úspěšné obnovení bloků | 100 % | — | Nezměřeno |
| První použitelný výsledek | ≤ 3 s* | — | Nezměřeno |
| Analýza 20 bloků | ≤ 10 s* | — | Nezměřeno |
| Čas k přehledu | Zlepšení vůči baseline | — | Nezměřeno |
| Faktické chyby ve shrnutích | Ruční vyhodnocení | — | Nezměřeno |

\* Navržené výchozí cíle pro MVP, které je nutné potvrdit vůči původnímu proposalu a reálným možnostem modelu.

## 5.5 Regresní a akceptační testy

Před odevzdáním musí být ověřeny alespoň následující scénáře:

- [ ] Rozšíření se načte a lze ho spustit na podporované stránce.
- [ ] Prázdný nebo nečitelný obsah nezpůsobí pád.
- [ ] Každý výsledek analýzy odpovídá existujícímu ID bloku.
- [ ] Bloky se skryjí pouze podle zvolených preferencí.
- [ ] Skrytý blok lze obnovit a původní obsah zůstane zachován.
- [ ] Chyba nebo timeout backendu nezablokuje stránku.
- [ ] Nevalidní výstup LLM je odmítnut nebo bezpečně zpracován.
- [ ] Shrnutí lze zobrazit bez dostupného TTS.
- [ ] TTS lze přehrát a zastavit.
- [ ] Dynamicky vložený obsah nezpůsobuje nekonečnou smyčku analýz.
- [ ] Text z formulářů a citlivých oblastí se bez explicitního důvodu neodesílá.
- [ ] README obsahuje instalační a reprodukční postup.

## 5.6 Finální výstupy projektu

Na konci čtvrtého týdne by tým měl předat:

1. Zdrojový kód Chrome Extension a backendu.
2. Instalovatelnou vývojovou verzi rozšíření.
3. README s instrukcemi pro lokální spuštění.
4. Architektonický diagram a dokumentaci API.
5. Testovací sadu 24 stránek a referenční anotace.
6. Naměřené metriky, známé chyby a omezení.
7. Záznam o rozhodnutích k hlavním rizikům.
8. Prezentaci s funkční demonstrací a výsledky experimentu.

**Doporučení pro obhajobu:** Nehodnotit úspěch podle počtu implementovaných AI funkcí, ale podle prokazatelného přínosu pro uživatele: správné filtrování, možnost obnovy, rychlejší orientace a transparentní chování při chybě.

---

# 6. PRVNÍ PRACOVNÍ DEN

Aby tým mohl začít bez dalších přípravných schůzek, doporučuji první den dokončit těchto pět věcí:

- [ ] **Jan:** založí repozitář, nastaví board a připraví API kontrakt.
- [ ] **Daniel:** ověří dostupnost LLM a připraví první klasifikační request.
- [ ] **Jakub:** vytvoří extrakční prototyp a spustí jej na třech různých typech webů.
- [ ] **Libuše:** připraví první sadu anotovaných stránek a šablonu pro měření kvality.
- [ ] **Všichni:** stanoví kategorie filtrování, pravidla pro soukromí a kritéria, podle kterých bude na konci prvního týdne rozhodnuto o pokračování.

Pokud se první den podaří dohodnout datový kontrakt mezi extraktorem a backendem, výrazně se sníží riziko integračních problémů ve druhém a třetím týdnu.
