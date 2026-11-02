# Šablona záznamu měření

Jedna šablona pro pilot (6 stránek, ZF-07) i pro 24stránkovou sadu (ZF-19) a měření metrik (ZF-20). Jeden řádek v [`sablona-mereni.csv`](sablona-mereni.csv) = jedna dvojice **stránka × nastavení preferencí** v jednom měřicím běhu (stejný „vyhodnotitelný případ“ jako v proposalu §5). Pro latenci se řádek opakuje (≥ 3 běhy na stránku, plán §5.2 bod 7).

**Stav návaznosti na ZF-27:** metodika ZF-27 zatím není zapsána v `docs/TESTING.md` (issue je otevřené). Pole vycházejí z proposalu §5 a z plánu §5.1–5.3. Po zápisu ZF-27 je potřeba šablonu s ním porovnat (viz otevřené body v [`rucni-overeni.md`](rucni-overeni.md)).

## Pole

| Sloupec | Význam | Odkud |
|---|---|---|
| `page_id` | ID stránky (P01…; u 24stránkové sady P01…P24) | plán §5.1 |
| `rozlozeni` | typ rozložení (statický článek, komentáře, feed, dynamický obsah, hluboké vnoření, reklamy) | plán §5.1 |
| `jazyk` | CS / EN | proposal §1, §5 |
| `cast_sady` | `pilot`, `ladeni`, `finale` | proposal §5 (ladění × finále), ZF-27 |
| `nastaveni` | S1 / S2 / S3 / S4 (viz README), u finální sady případně další | proposal §5 (stránka × nastavení) |
| `datum_mereni`, `verze_rozsireni` | datum a verze (commit nebo `manifest.json`) | plán §5.1 |
| `beh` | pořadí opakování (1, 2, 3) | plán §5.2 bod 7 |
| `ocekavane_bloky` | počet bloků v anotaci | plán §5.1 |
| `ocekavane_skryte` | z toho kolik má být skryto v tomto nastavení | anotace |
| `nalezene_bloky` | počet bloků, které extraktor vrátil | plán §2.2 |
| `spravne_oddelene_bloky` | nalezené bloky, které odpovídají přesně jednomu očekávanému bloku (**pracovní definice**, viz níže) | plán §2.2 |
| `spravne_klasifikovane_bloky` | bloky se správným tématem i tónem | plán §5.1 |
| `TP`, `FP`, `FN`, `TN` | správně skryté, neoprávněně skryté, neskryté nežádoucí, správně ponechané | proposal §5, plán §5.3 B |
| `cas_extrakce_ms`, `cas_klasifikace_ms`, `cas_celkem_ms` | časy zpracování | plán §5.1, §5.3 D |
| `pocet_chyb` | chyby při zpracování (výjimky, selhání) | plán §5.1 |
| `obnoveno_ok` | `ano` / `ne`: všechny skryté bloky šly vrátit | proposal §5 (100 %) |
| `hodnotitel` | kdo zápis provedl | proposal §5 |
| `poznamky_k_reprodukci` | stav stránky (cookie lišta, přihlášení, rozbalený feed), nastavení prohlížeče | plán §5.1 |

Pole jsou prázdná; **nic není naměřeno**.

## Odvozené hodnoty (počítají se po vyplnění, ne zapisují)

- Podíl nalezených: `nalezene_bloky / ocekavane_bloky`; podíl správně oddělených: `spravne_oddelene_bloky / ocekavane_bloky` (ZF-07).
- Precision `TP / (TP + FP)`, recall `TP / (TP + FN)`, F1 (proposal §5, plán §5.3 B). Při `TP + FP = 0` nebo `TP + FN = 0` hodnota není definovaná.
- Respektování preferencí: správná rozhodnutí děleno vyhodnocenými, tj. `(TP + TN) / (TP + TN + FP + FN)` (plán §5.3 A). Proposal říká „podíl vyhodnotitelných případů (stránka × nastavení)“, takže se z řádků dá spočítat i podíl případů, kde jsou **všechna** rozhodnutí správná. Šablona uchovává oba přístupy; volba mezi nimi patří do ZF-27.
- Latence: medián a 95. percentil z běhů stejné stránky a nastavení (plán §5.3 D).

## Pracovní definice, které je třeba potvrdit

1. **„Správně oddělený blok“**: nalezený blok pokrývá právě jeden očekávaný blok, nepřidává cizí obsah (reklamu, navigaci) a očekávaný blok nerozděluje. Plán říká jen „podíl správně oddělených bloků“, přesnou definici nedává.
2. **Bloky navíc** (extraktor vrátí něco, co v anotaci není): v šabloně jde do `nalezene_bloky`, ne do `spravne_oddelene_bloky`. Jejich vliv na skrytí řeší ZF-07.
3. **Neanotované bloky** (například související karty u P01 nebo doplněný obsah u P04): `ocekavane_bloky` zahrnuje jen anotované bloky. Porovnává se jen na anotovaném výběru, pokud ZF-07 nerozhodne jinak.

## Co šablona nepokrývá (patří do ZF-20)

Shrnutí (respektování preferencí ve shrnutí, compression ratio, semantic similarity, faktická věrnost), dabing, čas k přehledu. Proposal §5 jmenuje i další metriky, ty se zapisují jinde.
