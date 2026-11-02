# Kandidáti pro větší sadu (ZF-19) a jak ji rozšířit

Zadání ZF-04 a milník M1 vyžadují přesně 6 pilotních stránek (ZF-03: „≥ 5 ze 6“). Větší sada je ZF-19 (24 stránek, 6 typů × 4, dva hodnotitelé). Tady je zásobník kandidátů. **Nic z toho není anotováno** a u většiny jsem neotevřela obsah stránky. **Podmínky použití nejsou u kandidátů ověřené.** Do finální sady zařazuj jen stránky, u kterých je podmínka ověřena podle postupu ve [`stranky.md`](stranky.md); zdroje z původního pilotu, u kterých se to nepodařilo, jsou tam v sekci „Vyřazené stránky“ (root.cz, Hacker News, iROZHLAS, ČT24, lupa.cz, BBC).

## A. Viděno v této session (z výpisů, ne z obsahu)

| Zdroj | Co | Typ případu | Jazyk | Stav |
|---|---|---|---|---|
| Hacker News, výpis dne 2026-10-20 (`news.ycombinator.com/front?day=2026-10-20`) | vlákna `item?id=` 50163277 (892 komentářů), 50169707 (650), 50154244 (544), 50166579 (504), 50167028 (455), 50170593 (427), 50167536 (409), 50165208 (296), 50159341 (222), 50159616 (222), 50165953 (213) | komentáře | EN | jen název a počet komentářů; **Hacker News byl z pilotu vyřazen** (podmínky zakazují scraping), nezařazovat bez povolení |
| BBC, `bbc.com/news/world` | články `/news/articles/` c9p8gdlz1p2ko, cq8ezj7jylrzo, cmdx3knq1xexo, c3x2w4109pj8o, cm0j06y3pn75o, cknv08nvzld4o, cq5ynw94k7kzo | články s reklamami | EN | jen ID z výpisu; **BBC byla z pilotu vyřazena**, nezařazovat bez povolení |
| BBC, související karty u P06 | c81dw94w5gzyo, ckdd8q9296r4o, cm9qzd47ng98o, ckn9rq8204l0o, cm8xz7pkd0jjo, cm2ke80nd929o, c6p3g84kjqjlo | články | EN | jen titulky |
| The Guardian, `theguardian.com/world` | výpis s 60 odkazy; DOM hloubka nadpisů 13; 16 prvků podobných reklamním slotům | feed, reklamy | EN | změřeno jen ve výpisu |

Stejná doména se v 24stránkové sadě opakovat smí, ale proposal chce „více domén“. Pro finální sadu doporučuji nejvýše 1–2 stránky z jedné domény.

## B. Domény ke zvážení (**nenavštíveno, neověřeno**)

Jen návrh, co zkusit. Podmínky použití, cookie zdi a paywally se musí ověřit před zařazením.

| Případ | Kandidáti | Jazyk | Riziko |
|---|---|---|---|
| Statický článek / blog | aktualne.cz, lidovky.cz, hn.cz, e15.cz, lupa.cz, zive.cz, cnews.cz, dw.com, aljazeera.com, npr.org, apnews.com | CS / EN | souhlas s cookies, paywall |
| Komentáře | abclinuxu.cz (diskuze), lobste.rs, slashdot.org, arstechnica.com | CS / EN | podmínky, přihlášení |
| Feed s kartami | novinky.cz, idnes.cz, seznamzpravy.cz, blesk.cz, theguardian.com, dev.to | CS / EN | souhlas s cookies |
| Dynamický obsah | další živé přenosy a „načíst další“ (idnes.cz online reportáže, theguardian.com live blogy, dw.com) | CS / EN | rychle se mění |
| Hluboké vnoření | diskuzní stránky Wikipedie (jiné články), GitHub issues veřejných repozitářů | EN | na Wikipedii jiná jazyková verze není jiná doména |
| Reklamní kontejnery | idnes.cz, novinky.cz, blesk.cz, dailymail.co.uk, theverge.com | CS / EN | skutečné reklamy se načtou jen po souhlasu s cookies |
| Nestandardní, slabá sémantika | root.cz (už jako P01), starší weby a fóra | CS | – |

## B2. Zdroje s ověřenou otevřenou licencí (doporučeno pro rozšíření)

Rozšiř sadu hlavně o zdroje, kde je licence jasná (stejný postup jako ve [`stranky.md`](stranky.md)). Chybí čeština (pilot je 5× EN, 1× CS) a pozitivní případy (válka, úmrtí, katastrofy).

| Zdroj | Licence | Poznámka |
|---|---|---|
| Global Voices, jiné články (například o konfliktech) | CC BY 3.0 | hodně obsahu o válkách a krizích; anglicky, existují i jiné jazykové verze |
| Wikipedie, další diskuzní stránky a články (včetně `cs.wikipedia.org`) | CC BY-SA | česká verze doplní češtinu |
| Our World in Data, jiná témata a „Data insights“ | CC BY | výpisy mohou mít „načíst další“, tedy dynamický případ s přibývajícími bloky |
| Horydoly.cz, další články | CC BY 3.0 CZ | čeština, reklamní kontejnery |
| NASA, jiné výpisy (blogy, galerie) | většinou bez autorských práv | jen negativní kontroly |
| EA Forum, jiná vlákna | CC BY 4.0 (obsah uživatelů; §7 neověřen) | komentáře; vlákna o politice a válce pro pozitivní případy |

## C. Jak sehnat stovky stránek rozumně

1. **Strukturální profil je levný.** Skript [`nastroje/profil-stranky.js`](nastroje/profil-stranky.js) vypíše na otevřené stránce jeden řádek JSON (počty prvků, hloubka, podezřelé reklamní prvky). Pomůže vybrat, které stránky jsou zajímavé pro konkrétní typ rozložení. Neprohlíží web automaticky: otevřít stránku musí člověk (nebo Claude v prohlížeči po jedné).
2. **Anotace je drahá.** Pilot má 77 bloků na 6 stránkách; 24 stránek bude zhruba 300 bloků, dvakrát (dva hodnotitelé). Kapacita Libuše v `docs/CAPACITY.md` je 25–45 hodin za celý projekt. Stovky plně anotovaných stránek proto nejsou reálné.
3. **Realistický postup:** (a) 24 stránek anotovat plně dvěma hodnotiteli (ZF-19); (b) pro větší počet stránek (desítky až stovky) měřit **jen to, co jde automaticky**: zda extraktor neselhal, počet nalezených bloků, čas, reverzibilitu skrytí. Bez ručního „očekávaného“ počtu nelze počítat precision a recall, ale lze hlídat selhání a rozptyl; (c) u vzorku z velké sady udělat kontrolní anotaci.
4. Sledujte, zda se výpisy a živé přenosy mezi běhy nezměnily (plán §5.1 to žádá).
