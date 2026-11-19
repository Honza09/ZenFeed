# Měření latence a kompresního poměru (ZF-20)

Nástroj pro část metrik ZF-20, které nepotřebují finální anotace: **latence** (čas do skrytí, do shrnutí a do začátku audia, ≥ 3 měření na stránku, medián a 95. percentil podle metodiky §g) a **compression ratio** shrnutí. Respektování preferencí, precision/recall a vratnost se měří jinde (anotace ZF-19, `--check` v `run-e2e.sh`). Tento dokument popisuje postup a jedno vývojové měření; **finální měření na 24stránkové sadě ZF-19 to není.**

## Co se měří

Měří se v popupu skutečného rozšíření (headless Brave, `performance.now()` v popupu), od kliknutí na tlačítko:

| Metrika | Začátek | Konec |
|---|---|---|
| Čas do skrytí | klik na „Analyzovat“ | popup je znovu nečinný: bloky vyhledané, klasifikované na backendu a skryté |
| Čas do shrnutí | klik na „Shrnout viditelný obsah“ | odpověď `/v1/summarize` zobrazená v panelu |
| Čas do začátku audia | klik na „Přehrát“ | událost `start` první promluvy (`speechSynthesis`) |
| Compression ratio | | znaky shrnutí ÷ znaky textu bloků odeslaných ke shrnutí (menší = kratší shrnutí) |

- Na každé stránce se popup otevře jednou, zapnou se všechny preference a pak proběhne N běhů (výchozí 3): Analyzovat → Shrnout → Přehrát → Zastavit → Zobrazit vše.
- Čas do skrytí se počítá jen u běhu, kde bloky opravdu šly na backend a nevrátila se chyba. Prázdná stránka, stránka s málem textu a nepřístupná stránka (`chrome://`) skončí hned a do latence by ji zkreslily.
- 95. percentil je **nearest-rank**: nejmenší hodnota, pod kterou leží aspoň 95 % měření. Při 3 měřeních na stránku je to tedy maximum. Výpočet je v `tests/extension/measure-stats.mjs` s unit testy v `measure-stats.test.mjs`.
- Výstup `--out` (JSON) obsahuje jen časy, počty, délky a URL, žádný text stránky ani shrnutí.

## Jak spustit

Vývojově, s lokálním backendem a falešným Gemini (nic neopouští počítač, kvóta se nespotřebuje):

```bash
MEASURE=3 MEASURE_OUT=latence.json bash tests/extension/run-e2e.sh
```

Bez dalších argumentů se použije výchozí sada stránek z `run-e2e.sh`. Vlastní stránky se přidají jako argumenty, například `bash tests/extension/run-e2e.sh <url> <url>`.

Se skutečným modelem, pro finální čísla: spusťte backend s klíčem (`uvicorn app.main:app --app-dir backend --env-file .env`, port 8000) a pak:

```bash
node tests/extension/popup-e2e.mjs --measure=3 --out=latence.json <url> <url> …
```

Každý běh spotřebuje jeden požadavek bezplatné vrstvy Gemini. Při 24 stránkách × 3 bězích to je 72 požadavků, takže je potřeba hlídat denní limit (chyba `rate_limited` se zapíše k běhu a do mediánu se nezapočte). Podmínky měření (stroj, prohlížeč, síť, datum) se zapisují k výsledku. Prohlížeč a platformu ukládá JSON sám.

## Vývojové měření 19. 11. 2026

**Podmínky:**
- Apple M4, macOS 27.2.1, Brave 158.1.100.58 headless, Node 25.9.0.
- Backend lokálně (`lexicon-2`), falešné Gemini, sada stránek z `run-e2e.sh` (10 testovacích stránek, 6 skutečných stránek, 2 nepřístupné stránky), 3 běhy na stránku.

| Stránka | Bloky | Skryto | Skrytí ms (medián / p95) | Shrnutí ms | Audio ms |
|---|---:|---:|---:|---:|---:|
| fixture hider.html | 11 | 3 | 24 / 30 | 24 / 59 | 2 / 222 |
| fixture hider-csp.html | 11 | 3 | 25 / 39 | 23 / 24 | 1 / 2 |
| fixture segmentation.html | 8 | 0 | 26 / 42 | 18 / 23 | 1 / 5 |
| fixture single-block.html | 1 | 0 | 17 / 33 | 24 / 29 | 1 / 2 |
| fixture mostly-war.html | 4 | 3 | 24 / 40 | 24 / 30 | 1 / 2 |
| fixture long-block.html | 2 | 0 | 31 / 36 | 24 / 26 | 1 / 1 |
| fixture html-title.html | 1 | 0 | 20 / 29 | 23 / 25 | 1 / 2 |
| fixture no-title.html, editable.html | 1 | 0 | málo textu, neanalyzováno | – | – |
| fixture empty.html | 0 | 0 | prázdná, neanalyzováno | – | – |
| ourworldindata.org war-and-peace (P01) | 74 | 41 | 125 / 128 | 17 / 17 | 1 / 2 |
| forum.effectivealtruism.org | 51 | 0 | 64 / 70 | 17 / 18 | 1 / 2 |
| nasa.gov recently-published | 26 | 1 | 49 / 55 | 18 / 18 | 1 / 1 |
| en.wikipedia Talk:Russo-Ukrainian war (oldid) | 49 | 8 | 58 / 59 | 18 / 18 | 1 / 2 |
| horydoly.cz | 48 | 0 | 52 / 58 | 19 / 23 | 1 / 2 |
| cs.wikipedia Globální oteplování | 400 | 21 | 279 / 282 | 18 / 19 | 1 / 2 |
| chrome://version, Chrome Web Store | – | – | nepřístupné, neanalyzováno | – | – |

**Všechny stránky dohromady:**

| Metrika | n | Medián | p95 |
|---|---:|---:|---:|
| Čas do skrytí | 39 | 40 ms | 279 ms |
| Čas do shrnutí (falešné Gemini) | 39 | 18 ms | 30 ms |
| Čas do začátku audia (headless) | 39 | 1 ms | 5 ms |

## Co z toho plyne a co ne

- **Čas do skrytí** je reálný pro lokální backend: celá cesta segmentace → `/v1/analyze` → skrytí. I stránka se 400 bloky je pod 0,3 s, takže pracovní předpoklady plánu „3 s do prvního výsledku“ a „10 s pro 20 bloků“ jsou lokálně splněné s velkou rezervou. Se vzdáleným backendem přibude síť. Backend teď běží jen lokálně.
- **Čas do shrnutí s falešným Gemini neobsahuje model.** Měří jen rozšíření a backend. Skutečný čas do shrnutí se změří až se skutečným klíčem (postup výše). Do té doby je **neměřeno**.
- **Čas do začátku audia v headless prohlížeči nic neříká o skutečném hlase.** Headless prohlížeč hlásí `start` téměř hned. Jediná vyšší hodnota (222 ms) je první přehrání, kdy se načítají hlasy. Pro závěr se musí změřit ve skutečném prohlížeči se zvukem, ideálně při testu dabingu ZF-34. Do té doby je **neměřeno**.
- **Compression ratio s falešným Gemini nic neznamená**, protože „shrnutí“ je jeho první věta. Proto ho tabulka neuvádí, ale skript ho počítá a ukládá. Skutečná hodnota bude ze stejného běhu se skutečným klíčem.
- **Semantic similarity se neměří.** Potřebuje model vět (embeddingy), tedy novou závislost nebo externí službu, což je týmové rozhodnutí (pravidla architektury). Alternativou je ruční hodnocení věrnosti jako v `zf-31-vernost.md`.

## Omezení

- Měření běží v headless prohlížeči na vývojovém počítači. Na pomalejším stroji a v prohlížeči s mnoha rozšířeními budou časy delší.
- Stránka se mezi běhy může změnit (dynamické stránky). Běhy jsou proto zapsané každý zvlášť a JSON obsahuje počty bloků každého běhu.
- Měří se od kliknutí v popupu, ne od kliknutí na ikonu rozšíření. Otevření popupu není započtené ani změřené.
