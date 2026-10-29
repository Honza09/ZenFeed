# Pilotní sada ZF-04: 6 stránek a referenční anotace

> **Stav: NÁVRH ke kontrole člověkem.** Strukturu stránek jsem (Claude) přečetl v prohlížeči 29. 10. 2026 (cca 19:10–19:50 SEČ). Téma, tón a rozhodnutí skrýt/ponechat jsou **můj návrh, ne ruční anotace hodnotitele**. Proposal (§5) vyžaduje ruční označení člověkem, proto je potřeba kontrola podle [`rucni-overeni.md`](rucni-overeni.md). Nic zde není naměřený výsledek, jde o referenční data pro ZF-07.

Issue: ZF-04 (milník M1, týden 1). Spotřebitelé: ZF-03 (extraktor), ZF-07 (vyhodnocení segmentace, go/no-go), později ZF-20 (metriky) a ZF-19 (24stránková sada).

## Obsah složky

| Soubor | K čemu |
|---|---|
| [`stranky.md`](stranky.md) | Karta každé pilotní stránky: URL, snapshot, selektory, prvky, které **nemají** být bloky, poznámky k reprodukci |
| [`anotace.csv`](anotace.csv) | Referenční anotace: 88 bloků, jeden řádek = jeden očekávaný blok (zdroj pravdy pro ZF-07) |
| [`sablona-mereni.csv`](sablona-mereni.csv), [`sablona-mereni.md`](sablona-mereni.md) | Šablona záznamu měření (předvyplněno 6 stránek × 3 nastavení, výsledky prázdné); stejná šablona pro 24 stránek v ZF-19 |
| [`navod-druhy-hodnotitel.md`](navod-druhy-hodnotitel.md) | Jak anotaci zopakuje druhý hodnotitel |
| [`kandidati-pro-zf-19.md`](kandidati-pro-zf-19.md) | Kandidátní stránky a domény pro větší sadu (neanotováno) |
| [`nastroje/profil-stranky.js`](nastroje/profil-stranky.js) | Skript pro konzoli prohlížeče, který jen čte strukturu stránky a vypíše JSON profil |
| [`rucni-overeni.md`](rucni-overeni.md) | Úkoly, které musí udělat člověk |

## Pilotní stránky

| ID | URL | Doména | Jazyk | Typ rozložení | Anotovaných bloků |
|---|---|---|---|---|---:|
| P01 | https://www.root.cz/clanky/postrehy-z-bezpecnosti-vypadek-cloudu-odstrihl-banky-soudy-i-dalsi-sluzby/ | root.cz | CS | statický článek (slabá sémantika, bez `<article>`/`<main>`) | 6 |
| P02 | https://news.ycombinator.com/item?id=50153664 | news.ycombinator.com | EN | komentáře (350 komentářů, vnoření až 17 úrovní; anotuje se vzorek 15) | 15 |
| P03 | https://www.irozhlas.cz/zpravy-domov | irozhlas.cz | CS | feed s opakovanými kartami | 28 |
| P04 | https://ct24.ceskatelevize.cz/textovy-prenos/prave-se-deje-380 | ct24.ceskatelevize.cz | CS | dynamicky načítaný obsah (živý přenos, tlačítko „Zobrazit další příspěvky“) | 24 |
| P05 | https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905 | en.wikipedia.org | EN | hluboce vnořené elementy (DOM hloubka až 43, `<dl>` až 17 úrovní) | 6 |
| P06 | https://www.bbc.com/news/articles/cmqxnl312v34o | bbc.com | EN | stránka s reklamními kontejnery (6× `ad-slot`) | 9 |

Pokrytí: 6 různých domén, všech 6 případů z plánu (§2.2), 3× čeština a 3× angličtina.

## Provizorní kategorie (ZF-24 zatím nezmrazeno)

V `docs/` žádný zmrazený seznam kategorií není (`mvp.md` §9, bod 4 ho vede jako otevřené rozhodnutí). Použil jsem příklady z proposalu (§4.1 #1) a **seznam je provizorní**:

- **Téma** (právě jedna hodnota na blok): `politické konflikty`, `válka`, `zprávy o úmrtí`, `katastrofické scénáře`, `jiné`.
- **Tón** (samostatné pole, nezávislé na tématu): `vyhrocený / toxický` = `ano` nebo `ne`. Negativní událost není automaticky vyhrocený tón (proposal §4.2).
- **Jistota** anotace: `J` jistá, `H` hraniční (o hraničních případech má rozhodnout druhý hodnotitel).

Kategorie `katastrofické scénáře` může znamenat skutečné katastrofy, nebo hypotetické katastrofické scénáře. Proposal to nerozlišuje, rozhodnutí patří do ZF-24. V pilotu je pro stránku BBC a živý přenos ČT24 tahle nejasnost bez dopadu, protože nastavení S2 skrývá obě kategorie dohromady (`zprávy o úmrtí` i `katastrofické scénáře`).

## Příkladová nastavení preferencí

Skrytí se **odvozuje mechanicky** z tématu a tónu, takže anotátor rozhoduje jen o tématu a tónu:

| Nastavení | Skrýt téma | Skrýt tón |
|---|---|---|
| S1 | `válka`, `politické konflikty` | – |
| S2 | `zprávy o úmrtí`, `katastrofické scénáře` | – |
| S3 | – | `vyhrocený / toxický` |

Blok se skryje v S1 a S2, pokud jeho téma patří do vybraných; v S3, pokud má `tón = ano`. V `anotace.csv` je výsledek ve sloupcích `S1_…`, `S2_…`, `S3_…` (`H` = má být skryto, `K` = má zůstat viditelné).

Očekávaný počet skrytých bloků (z celkového počtu bloků stránky):

| Stránka | bloků | S1 | S2 | S3 |
|---|---:|---:|---:|---:|
| P01 | 6 | 1 | 0 | 0 |
| P02 | 15 | 15 | 0 | 3 |
| P03 | 28 | 4 | 0 | 0 |
| P04 | 24 | 8 | 3 | 0 |
| P05 | 6 | 4 | 0 | 1 |
| P06 | 9 | 0 | 6 | 0 |

U případů s nulou skrytých bloků nejsou precision a recall definované (dělení nulou); vyhodnocuje se jen počet neoprávněných skrytí. Případně doplníme další nastavení.

## Pravidla anotace (pracovní, k potvrzení v ZF-27)

1. **Blok** = typ `section` (sekce nebo tělo článku), `listing article` (karta nebo položka výpisu), `comment` (komentář). Tři typy z proposalu §4.1 #2.
2. **Granularita**: anotuje se nejvyšší smysluplná úroveň (u Wikipedie `<section>` úrovně h2, ne vnořené h3). Jemnější úroveň zůstává otevřená (viz níže).
3. **Locator** je selektor nebo stabilní ID (id položky, číslo článku v URL, `oldid` revize). Pořadí na stránce se jako locator nepoužívá, protože u feedů se mění.
4. **Úryvek** má sloužit jen k identifikaci bloku (do ~75 znaků), plné texty se neukládají.
5. **Prvky, které nemají být bloky** (navigace, reklamy, formuláře, cookie lišta) jsou v [`stranky.md`](stranky.md) u každé stránky. Odpovídají ZF-03 („vyloučit navigaci, formuláře, skripty, interaktivní prvky“).
6. **Snapshot**: výpisy a živé přenosy (P03, P04) se mění. Reprodukovatelnost zajišťují stabilní ID a čas snapshotu, ne celý obsah stránky.

## Otevřené body

Jsou na konci [`rucni-overeni.md`](rucni-overeni.md), aby byly spolu s úkoly pro člověka.

## Co tento adresář neobsahuje

Žádné naměřené hodnoty, žádné prahy navíc (platí jen ≥ 80 % / −20 % / 100 % z proposalu §5), žádné uložené celé stránky, přihlašovací údaje ani osobní údaje. U HN a Wikipedie nejsou uložena uživatelská jména.
