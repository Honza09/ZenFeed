# Výpočet metrik ZF-20 z anotací

Skript `backend/scripts/evaluate_metrics.py` spočítá z anotačního CSV metriky skrývání podle zmrazené metodiky [`metodika-hodnoceni.md`](metodika-hodnoceni.md) (ZF-27). Je připravený pro finální sadu ZF-19: až budou anotace hotové, výsledky dá jeden příkaz. Níže je ukázka na pilotu, **ne finální měření**.

## Co počítá

- **Případ** = stránka × nastavení (S1–S4, §a). Každá stránka má čtyři případy.
- **Respektování preferencí (hlavní číslo, definice B z §b.2):** případ je správný, když na něm není žádné neoprávněné skrytí (FP = 0) ani žádný chybějící skrytý blok (FN = 0). Výsledek je podíl správných případů a porovnává se s cílem 80 %.
- **Skupiny (§a, varianta C):** všechny případy, případy „s cílem“ (aspoň jeden blok ke skrytí) a „bez cíle“. Dále po jazycích (§ jazyk, 95% Wilsonův interval, jen informativně) a po nastaveních.
- **Doplňkové na úrovni bloků:** bloková přesnost (definice A), precision, recall, F1, počet neoprávněných skrytí a chybějících skrytí.
- **`review`** (nejistý výstup) nechává blok viditelný, proto se počítá jako neskrytý. Kolik chybějících skrytí skončilo jako `review`, se uvádí zvlášť (§b.4), aby tým mohl rozhodnout, jak s nimi naložit.
- **Shoda hodnotitelů:** s `--rater-a` a `--rater-b` počítá procentuální shodu a Cohenovo κ pro téma, tón a rozhodnutí o skrytí v každém nastavení. Rozhodnutí se odvodí z tématu a tónu podle [`kategorie-mvp.md`](../kategorie-mvp.md). Když oba hodnotitelé použili jen jednu třídu, κ není definované a skript to napíše.
- **Kontrola anotace:** vypíše řádky, kde ruční značka S1–S4 (H/K) neodpovídá tématu a tónu. Taková chyba by jinak tiše zkreslila výsledek.

Vstupem klasifikátoru je **identifikační úryvek** z CSV, ne celý text bloku na stránce, stejně jako u `measure_lexicon.py`. Na skutečné stránce vidí klasifikátor víc textu, takže čísla se mohou lišit (viz Omezení).

## Jak spustit

Z kořene repozitáře s aktivní virtuální `.venv`:

```bash
PYTHONPATH=backend python backend/scripts/evaluate_metrics.py docs/testing/pilot/anotace.csv
```

Pro finální sadu:

```bash
PYTHONPATH=backend python backend/scripts/evaluate_metrics.py finalni.csv --lang F01=cs --lang F02=en --rater-a hodnotitel-a.csv --rater-b hodnotitel-b.csv --json vysledek.json
```

- **`finalni.csv`:** stejné sloupce jako `pilot/anotace.csv`, tedy anotace po vyřešení rozporů obou hodnotitelů včetně sloupců S1–S4 (H = skrýt, K = ponechat). Jazyk stránky jde zadat sloupcem `jazyk` (`cs`/`en`) nebo parametrem `--lang`, jinak se uvede „neuvedeno“.
- **`hodnotitel-a.csv`, `hodnotitel-b.csv`:** samostatné anotace každého hodnotitele před sjednocením, se sloupci `block_id`, `téma`, `tón` (stejně jako `pilot/anotace-libuse.csv`).
- **Finální část se vyhodnotí jednou** a podle výsledku se už nic neladí (§f). Jinak se výsledek musí označit jako ladění.

## Ukázka: pilot (ladicí sada), 19. 11. 2026

```bash
PYTHONPATH=backend python backend/scripts/evaluate_metrics.py docs/testing/pilot/anotace.csv --lang P01=en --lang P02=en --lang P03=en --lang P04=en --lang P05=en --lang P06=cs
```

Výsledek (`lexicon-2`, 6 stránek, 89 bloků, 24 případů):

| Skupina | Případy | Správně (B) | 95% Wilson | Cíl 80 % | Precision | Recall | Neoprávněná skrytí | Chybějící (z toho review) |
|---|---:|---:|---|---|---:|---:|---:|---:|
| všechny | 24 | 20 (83,3 %) | 64,1–93,3 % | ano | 71,4 % | 45,5 % | 2 | 6 (2) |
| s cílem | 3 | **0 (0 %)** | 0–56,1 % | **ne** | 100 % | 45,5 % | 0 | 6 (2) |
| bez cíle | 21 | 20 (95,2 %) | 77,3–99,2 % | ano | – | – | 2 | 0 |
| čeština | 4 | 4 (100 %) | 51,0–100 % | ano | – | – | 0 | 0 |
| angličtina | 20 | 16 (80,0 %) | 58,4–91,9 % | ano | 71,4 % | 45,5 % | 2 | 6 (2) |

Chybné případy:
- P01 S1: 4 bloky o válce neskryté.
- P01 S2: 2 bloky o obětech války skryté v nastavení „úmrtí a katastrofy“. Podle kategorií jsou oběti války téma válka, takže tu měly zůstat vidět.
- P04 S2: neskrytý blok o úmrtnosti na malárii.
- P05 S1: neskrytý blok o redakčním sporu o Krym.

**Jak to číst:**
- Celkových 83,3 % „splňuje“ cíl jen proto, že 21 z 24 případů nemá co skrýt. Ve **všech třech případech, kde se skrývat mělo, je aspoň jedna chyba**. Přesně před tímhle metodika varuje v §a, a proto se skupiny hlásí zvlášť.
- Na pilotu byl slovník laděný, takže tato čísla jsou optimistická. Bloková přesnost (97,8 %) je vysoká i přes chybné případy, proto je hlavní případová definice B.
- Kontrola anotace nenašla v pilotu žádnou značku S1–S4, která by neodpovídala tématu a tónu.

**Shoda hodnotitelů (ukázka, ne nezávislé měření):** Libuše × nezávislý agent na 232 blocích pilotu a rozšíření:

| Pole | Shoda | κ |
|---|---:|---:|
| téma | 98,3 % | 0,97 |
| tón | 98,3 % | 0,82 |
| skrytí S1 / S2 / S3 / S4 | 99,6 / 98,7 / 98,3 / 100 % | 0,99 / 0,96 / 0,82 / 1,00 |

`shoda-hodnotitelu.md` uvádí pro tón κ 0,83. Ruční přepočet ze souborů dává 0,8245: 228 shod z 232, Libuše má 14 bloků toxických, agent 10. Rozdíl je tedy v zaokrouhlení nebo v dřívější verzi souborů. Výpočet je v testu `test_cohen_kappa`. Dokument jsem neměnil.

## Testy

`backend/tests/test_evaluate_metrics.py` ověřuje:
- Wilsonův interval na známých hodnotách;
- κ na ručně spočítaném příkladu a nedefinované κ;
- počítání TP, FP, FN a TN včetně `review`;
- definici B a skupiny;
- odvození skrytí z kategorií;
- odmítnutí špatné značky (jiné než H/K) a čtení jazyka;
- že na pilotu dává stejné počty skrytí jako `measure_lexicon.py`;
- příkazovou řádku.

## Omezení

- **Klasifikuje se úryvek z CSV, ne blok na stránce.** Pro měření na skutečných stránkách by se musely spárovat bloky rozšíření (`zf-0`, …) s anotovanými bloky (`F01-B001`, …). Párování dělá pro ZF-07 nástroj `pilot/nastroje/zf-07-parovani.js`, ale napojené na tento skript zatím není. Tým musí rozhodnout, zda finální čísla stačí z úryvků, nebo je potřeba párování.
- Shrnutí se tímto skriptem nehodnotí. Respektování preferencí u shrnutí je ruční hodnocení (§b.5), věrnost viz [`zf-31-vernost.md`](zf-31-vernost.md).
- Vratnost (100 %) se neměří tady, ale v `run-e2e.sh` (`--check`). Latence se měří v [`mereni-latence.md`](mereni-latence.md).
- Nastavení S1–S4 jsou příkladová ze šablony. Pokud tým pro ZF-19 určí jiná, musí se upravit `SETTINGS` v `measure_lexicon.py`, odkud je skript přebírá.
