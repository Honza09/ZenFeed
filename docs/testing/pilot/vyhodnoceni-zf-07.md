# ZF-07: Vyhodnocení segmentace (pilot, 6 stránek)

**Stav:** návrh k posouzení týmem. Rozhodnutí v tomto souboru není zapsáno (viz [`rozhodnuti-zf-07.md`](rozhodnuti-zf-07.md)).
**Měřil:** Claude agent, 2. 11. 2026 (časy běhů jsou v UTC v tabulce stránek).
**Důležité upozornění k anotacím:** referenční anotace ([`anotace.csv`](anotace.csv), 90 bloků) jsou **můj nepotvrzený návrh**. Nepotvrdil je žádný lidský anotátor. Každé číslo níže platí jen vůči nim. Podle bloků, které jsem považoval za chybné, jsem nic neměnil (viz otevřené body).

## 1. Co a jak jsem měřil

- **Extraktor:** `extension/content/segmenter.js` z větve `issue-ZF-07`, commit `9be0e8b1cf18` (`git` hash větve čtený ze souboru `.git/refs/heads/issue-ZF-07`), `segmenter.js` SHA-256 `223e65b5…e46e0d`. Soubory v `extension/` jsem nezměnil.
- **Jak jsem extraktor spustil:** v panelu prohlížeče (vestavěný prohlížeč aplikace Claude) jsem na každé otevřené stránce spustil `ZenFeedSegmenter.segmentPage()`. Do stránky jsem vložil funkci s kódem extraktoru; **kód je shodný se `segmenter.js` až na komentáře a bílé znaky** (porovnáno hashem textu bez komentářů a bílých znaků, oba `d115ce16…f6423`). **Rozšíření jako takové (manifest, vkládání content scriptu, `content.js`) jsem nespouštěl**; měřil jsem jen funkci segmentace.
- **Běhy:** 3 běhy na stránku bez znovunačtení (první běh je „za studena“, druhý a třetí s ohřátou stránkou). Čas = `stats.durationMs` ze segmentéru, zaokrouhlený extraktorem na ms.
- **Párování nalezených bloků s referenčními:** podle **textu**, ne podle pořadí. Každý řádek textu nalezeného bloku se hledá v textu referenčního bloku (po odstranění bílých znaků a bez ohledu na velikost písmen). Referenční blok se určuje z locatoru v `anotace.csv`. Řádky kratší než 8 znaků a řádky, které odpovídají více referenčním blokům a žádný z nich blok nepotvrzuje jinými řádky, se nepočítají. Párování jsem měřil jednorázovým skriptem v panelu; jeho uložená kopie je [`zf-07-parovani.js`](zf-07-parovani.js) (návod ke spuštění je v jeho hlavičce). Kopie má stejnou logiku, ale **nebyla znovu spuštěna na šesti pilotních stránkách**, jen na malé zkušební stránce (3 články, 1 chybějící locator). Pravidla párování jsou i v hlavičce skriptu.
- **„Správně oddělený blok“** (definice ze [`sablona-mereni.md`](sablona-mereni.md)): nalezený blok pokrývá **právě jeden** referenční blok, nepřidává cizí obsah a referenční blok nerozděluje. Použil jsem striktní variantu: žádný cizí řádek, právě jeden nalezený blok na referenční blok.
- **Stavy referenčního bloku:** `correct` (správně), `merged` (část nalezeného bloku, který pokrývá víc referenčních), `split` (rozdělený do víc nalezených), `foreign` (jeden blok, ale s cizím textem), `missed` (nenalezen), `unresolved` (na stránce už není).
- **Pokrytí** referenčního bloku = podíl jeho textu, který se objevil v nalezených blocích. Zapisuji ho informativně, do striktní definice nevstupuje.
- **Klasifikace:** v repozitáři není klasifikátor (ZF-06 nebylo součástí tohoto měření). **TP/FP/FN/TN a `spravne_klasifikovane_bloky` zůstávají prázdné; počty chybně skrytých bloků jsou „nenaměřeno“.** Měřena je jen segmentace.
- **Skript párování:** [`zf-07-parovani.js`](zf-07-parovani.js) (spouští se v konzoli; potřebuje nejdřív vložit `extension/content/segmenter.js`).
- **Syrová data a přepočet:** [`zf-07-surova-mereni.json`](zf-07-surova-mereni.json), skript [`zf-07-prepocet.py`](zf-07-prepocet.py) (`python3 zf-07-prepocet.py --csv` přepočítá metriky a vygeneruje [`sablona-mereni-zf-07.csv`](sablona-mereni-zf-07.csv), 72 řádků = 24 případů × 3 běhy; původní `sablona-mereni.csv` zůstala prázdná). Hodnoty v tomto dokumentu jsou výstupem skriptu.

## 2. Stránky: změřeno 6 z 6

| Stránka | Změřeno | Očekáváno | Nalezeno (celkem) | Správně odděleno | Čas extrakce, medián / max (3 běhy) |
|---|---|---|---|---|---|
| P01 OWID War and Peace (statický článek) | ano | 6 | 74 | 1 (16,7 %) | 9 / 18 ms |
| P02 EA Forum, vlákno komentářů | ano | 25 | 50 | 24 (96,0 %) | 10 / 16 ms |
| P03 NASA, výpis novinek | ano, 24 z 25 | 25 (měřitelných 24) | 26 | 24 (100 % z 24; 96,0 % z 25) | 14 / 22 ms |
| P04 OWID Data Insights (dynamické načítání) | ano | 20 | 23 | 19 (95,0 %) | 31 / 44 ms |
| P05 Wikipedia, diskuse | ano | 6 | 49 | 3 (50,0 %) | 8 / 16 ms |
| P06 Horydoly, článek s reklamami | ano | 8 | 54 | 6 (75,0 %) | 12 / 20 ms |
| **Celkem** | 6 z 6 | 90 (měřitelných 89) | 276 | **77 (86,5 % z 89; 85,6 % z 90)** | medián všech 18 běhů 13,5 ms, max 44 ms |

Poznámky k tabulce:
- „Nalezeno (celkem)“ zahrnuje i bloky navíc, které v anotaci nejsou (celkem 98 z 276). Podíl `nalezené / očekávané` podle šablony (74/6 až 26/25) proto **nevypovídá o úplnosti**; uvádím ho jen kvůli šabloně (viz skript). Žádný z měřitelných referenčních bloků nechyběl úplně (`missed` = 0).
- **P03 byl změřen na 24 z 25 bloků.** Referenční blok P03-B006 (TSIS-2) už na výpisu nebyl: výpis se mezitím posunul o novou položku (ESCAPADE) a starší položka vypadla.
- **P03 a P04 jsou nestálé výpisy.** Snímky: P03 2. 11. 2026 20:43 UTC (25 položek na stránce, z nich 24 anotovaných), P04 2. 11. 2026 20:42 UTC (20 článků na stránce, všech 20 anotovaných stále přítomno). Anotace vznikaly dříve téhož dne (kolem 20:30 podle [`stranky.md`](stranky.md)).
- Locatory P03 v `anotace.csv` používají relativní `href` (`/blogs/…`), zatímco živá stránka má absolutní (`https://www.nasa.gov/blogs/…`). Locatory jsem proto vyhodnocoval jako `a[href*="<cesta>"]`. Anotaci jsem nepřepisoval.
- Časy jsem měřil, když bylo okno prohlížeče v aplikaci **skryté** (nástroj to hlásí); časovače ve skrytých stránkách mohou být nepřesné. Časy jsou řádově jednotky až desítky ms a nezahrnují nic z reálného běhu rozšíření (předání zprávy, klasifikace).

## 3. Citlivost na pracovní předpoklady

Segmentační prahy v proposalu nejsou. Hodnoty dál jsou **pracovní předpoklady plánu, které musí tým potvrdit**, ne požadavky:

| Předpoklad | Bez předpokladu (měřeno) | S předpokladem |
|---|---|---|
| „90 % správně oddělených“ (pracovní předpoklad) | celkem 86,5 %; ≥ 90 % mají P02 (96,0 %), P03 (100 %), P04 (95,0 %); pod 90 % P01 (16,7 %), P05 (50,0 %), P06 (75,0 %) | celkový výsledek **pod** předpokladem; polovina stránek nad ním |
| Tolerantnější definice správného bloku: pokrytí ≥ 80 % a cizí obsah ≤ 5 % znaků bloku (moje volba, ne z plánu) | 77 z 89 | 75 z 89 (84,3 %); mění se P02 (22), P05 (2), P06 (7) |
| Čas extrakce „3 s / 10 s“ (pracovní předpoklad) | max 44 ms, medián 13,5 ms | pod oběma mezemi s velkou rezervou; platí jen pro tyto stránky, tento stroj a skrytý panel |

Produktové prahy proposalu (≥ 80 % respektování preferencí, ≥ 20 % kratší čas, 100 % obnovení) tímto měřením **nejsou ověřeny**, protože klasifikace ani skrývání nebyly měřeny.

## 4. Chyby podle stránek

ID bloků `zf-N` jsou platná jen pro jeden běh extraktoru.

**P01 (1 z 6 správně).**
- Sloučené bloky: `zf-0` (1 362 znaků, titulek „War and Peace“ + úvod) pohltil h1 (81 znaků mimo anotovaný blok) a část sekce B002; `zf-1` („Key Insights…“, 187 znaků) zasahuje do B001 i B002. Důvod: sekce nejsou odděleny vlastním obalem, extraktor je rozděluje podle limitu délky a nadpisů.
- Rozdělené bloky: B005 (grafy) na 55 bloků (popisky a texty u jednotlivých grafů), B006 (endnotes) na 9 bloků.
- Obalový prvek: `zf-4` („Explore Data on Armed Conflict and War“, 460 znaků) i `zf-61` („Acknowledgements“) mají jako `elements` obalový prvek, který obsahuje *všechny* referenční sekce. Text bloku je malý, ale **prvek, který by ZF-10 skrýval, je celý článek**. To je riziko nesprávného skrytí (viz MVP §3 F2).
- Navíc: „Cite this work“, „Reuse this work freely“, patička (nalezeno 4 bloků navíc).

**P02 (24 z 25 správně).**
- Všech 24 komentářů (`article#…`) odděleno správně. Pokrytí 65–97 %, nejnižší P02-B008 (65 %) a P02-B005 (77 %): zkrácené řádky nebo texty kratší než 25 znaků se vypouštějí.
- Rozdělený: tělo příspěvku P02-B025 (3 944 znaků) na 6 bloků (limit 1 500 znaků na blok je záměr extraktoru).
- Navíc (20 bloků): doporučené příspěvky v postranním panelu (`zf-12` až `zf-14`, `zf-39` až `zf-48`), titulek, **souhlas s cookies** (`zf-49`, 244 znaků, jako `section`).

**P03 (24 z 24 měřitelných správně).**
- Navíc: hlavička „Recently Published“ (`zf-0`, 135 znaků, druh `article`) a nová, neanotovaná položka (ESCAPADE, `zf-2`, 324 znaků; jde o skutečný obsah, jen není v anotaci).
- Změna obsahu: B006 už na stránce není.

**P04 (19 z 20 správně).**
- Rozdělený: P04-B010 (plastový odpad) na `zf-10` + `zf-11` (referenční text 1 489 znaků těsně u limitu 1 500).
- Navíc: odběr newsletteru (`zf-2`), výzva k podpoře ve spodní části (`zf-22`).
- **Dynamické načítání:** po kliknutí na „Show more“ měla stránka 40 článků (z 20) a opětovně spuštěný extraktor vrátil 44 bloků za 107 ms (jeden běh, 2. 11. 2026 20:38 UTC). Extraktor ale **sám nový obsah nezachytí**: `content.js` volá `segmentPage()` jednou při `document_idle`, v souboru jsem nenašel `MutationObserver`, posluchač posunu ani časovač. Co se po načtení doplní, se neanalyzuje, dokud se extraktor nespustí znovu. Anotace pokrývají jen prvních 20 článků, správnost nově načtených nenaměřena.

**P05 (3 z 6 správně).**
- Rozdělené: B001 (úvod s šablonami) na 16 bloků, B003 na 4 bloky při pokrytí **25 %** (z 12 211 znaků se objevila čtvrtina; příčinu jsem nezkoumal), B006 na 2 bloky.
- Správně: B002, B004 (ale pokrytí jen 49 %), B005.
- Navíc 24 bloků: 23 bannerů WikiProject (`zf-26` až `zf-48`, druh `post`) a hlavička „From Wikipedia…“ (`zf-0`, 460 znaků).

**P06 (6 z 8 správně).**
- Cizí obsah: P06-B001 (perex) sloučen s titulkem h1 (`zf-0`, 136 znaků cizího textu ze 562); P06-B008 má v `zf-7` 9 znaků cizího textu (1 % bloku). Obě sekce jsou jinak celé.
- Navíc 46 bloků: související články (`zf-9` až `zf-17`), kalendář akcí (`zf-19` až `zf-28`), diskuse (`zf-29` až `zf-47`, druh `comment`, včetně komentářů, které vypadají jako spam), patička (`zf-53`).
- **Reklamy:** mezi bloky navíc jsem nenašel blok, který by byl zjevně reklama; kontejnery reklam jsou podle [`stranky.md`](stranky.md) částečně prázdné. Blok `zf-17` („Levnější letenky a ubytování na hory? Vy…“) může být propagační; neověřil jsem to. Chování extraktoru při reklamách s textem je tedy **nenaměřeno**.

## 5. Hlavní vzorce

1. Kde stránka dává jednu položku do jednoho sémantického prvku (`article` komentář, položka výpisu), extraktor pracuje dobře: P02 24/25, P03 24/24, P04 19/20, tedy 67 z 69 bloků.
2. Kde je referenční blok jen sekce v souvislém textu bez vlastního obalu nebo ve vnořených obalech (P01, P05), extraktor bloky slučuje nebo štěpí (P01 1/6, P05 3/6) a v P01 vrací obalový prvek přes celý článek.
3. Do výsledku se dostává mnoho bloků navíc (98 z 276): cookie lišty, patičky, doporučené články, šablony a diskuse mimo anotaci. Skrývání takových bloků by uživateli nevadilo samo o sobě, ale u cookie lišty a navigace by mohlo.

## 6. Co jsem nemohl ověřit

- **Klasifikaci a skrývání** (TP/FP/FN/TN, chybně skryté bloky, respektování preferencí, obnovení): v repozitáři není klasifikátor a nic jsem nespouštěl.
- **Reálný běh rozšíření** (manifest, injektáž, `content.js`): nespuštěno; měřena je funkce segmentace.
- **České zpravodajské weby:** původně zvolené stránky (root.cz, iROZHLAS, ČT24, lupa.cz) jsou z pilotu vyřazeny; chování extraktoru na nich je **nenaměřeno**. Pilot je 5× EN a 1× CS.
- Vliv bloků navíc na skrytí; chování při jiném rozlišení okna, přihlášení a souhlasu s cookies (lišty jsem nepotvrzoval ani neodmítal).
- Příčinu nízkého pokrytí P05-B003 (25 %) a P05-B004 (49 %).
- Obchodní podmínky EA Fora: §7 obecných podmínek CEA jsem neviděl ([`stranky.md`](stranky.md)); stránku jsem četl jen skriptem pro čtení DOM v prohlížeči a nic jsem nestahoval ani neukládal. Prosím o potvrzení, že to pro P02 stačí.
- Časy při viditelném okně, na jiném stroji a s větší stránkou.

## 7. Otevřené body k anotacím (nic jsem neměnil)

- P03-B006: referenční blok už není na výpisu (nestálost výpisu).
- P03 locatory s relativním `href`: rozumné přepsat na tvar nezávislý na tom, zda je odkaz relativní.
- P05-B003 / P05-B004: pokrytí 25 % a 49 % může znamenat, že referenční blok (`section[data-mw-section-id]`) je širší než to, co extraktor považuje za čitelný text; potvrdit s lidským anotátorem.
- P06-B001: zda má perex zahrnovat titulek h1 (extraktor je sloučil).
- P01 a P05: zda jsou „sekce“ správná jednotka bloku, když stránka vlastní obal nemá.
- Všechny anotace potvrzuje lidský anotátor (stav „nepotvrzeno“ trvá).
