# Karty pilotních stránek

Všechna pozorování pocházejí z jednoho otevření stránky v prohlížeči 29. 10. 2026 (cca 19:10–19:50 SEČ). Nic nebylo stahováno hromadně, nic nebylo odesláno ani změněno. Podmínky použití jednotlivých webů jsem **nečetl**, ověření je úkol pro člověka ([`rucni-overeni.md`](rucni-overeni.md)).

Obecně: u všech stránek je navigace, hlavička, patička a případné cookie lišty a reklamy **mimo** anotované bloky. U stránek, kde jsem prvky ověřil, jsou vypsané níže. Cookie lišty jsem nepotvrzoval ani neodmítal.

## P01: root.cz, statický článek (CS)

- **URL:** https://www.root.cz/clanky/postrehy-z-bezpecnosti-vypadek-cloudu-odstrihl-banky-soudy-i-dalsi-sluzby/ (článek z 26. 10. 2026, stabilní).
- **Co testuje:** slabá sémantika. Na stránce nenajdeš `<article>` ani `<main>`, nadpisy jsou `h2#h20` až `h2#h25` v kontejneru `div.element-margin-top-half`, hloubka nadpisu v DOM je 10.
- **Anotované bloky (6):** `h2#h20` Ransomware / MFA, `h2#h21` LiteLLM, `h2#h22` výpadek Google Cloudu, `h2#h23` únik e-mailů AfD, `h2#h24` Ve zkratce, `h2#h25` Pro pobavení. Blok = nadpis a následující prvky do dalšího `h2`.
- **Nemají být bloky:** `h2` „Sdílet“ (třída `element-blind-user`), `h2` „O seriálu“, widget hodnocení článku, bloky „Podpořte redakci“.
- **Neanotováno (rozhodnutí o granularitě):** tři dlaždice související články (`h3.prj003-heading`) pod článkem; na stránce je pravděpodobně i diskuse, tu jsem neprozkoumal.
- **Reklamy:** hrubý selektor našel desítky prvků (74), ale tak široký selektor reklamy neidentifikuje. Reklamy na této stránce se neanotují (reklamní případ je P06).
- **Cookie lišta:** prvek existuje, stav neověřen.

## P02: Hacker News, komentáře (EN)

- **URL:** https://news.ycombinator.com/item?id=50153664 („Ukraine claims first drone evacuation of wounded soldier“; vlákno z 20. 10. 2026, stabilní).
- **Co testuje:** komentáře s hlubokým odsazením. Na stránce je 350 komentářů, z toho 21 na nejvyšší úrovni, odsazení až 17 úrovní. Tabulková stavba (`tr.athing.comtr`).
- **Anotované bloky (15):** prvních 15 komentářů v pořadí DOM, locator = `tr.athing.comtr#<id komentáře>`. Zbylých 335 není anotováno.
- **Důsledek pro měření:** extraktor vrátí zřejmě stovky bloků. ZF-07 musí rozhodnout, zda se porovnává jen na anotovaném vzorku (navrženo), nebo se doanotuje víc.
- **Uživatelská jména a texty:** neukládají se. Úryvky mají ≤ 50 znaků.
- **Nemají být bloky:** hlavička a navigace HN, odkazy „reply“, „parent“, formulář pro vložení komentáře.

## P03: iROZHLAS, feed s kartami (CS)

- **URL:** https://www.irozhlas.cz/zpravy-domov (**nestabilní výpis**, snapshot 29. 10. 2026 kolem 19:30; nejnovější karta z 18:58).
- **Co testuje:** opakované karty. Na stránce je 28 prvků `article.c-articles__item` v `div.c-articles__list`, nadpis karty je `h3`.
- **Anotované bloky (28):** všechny karty. Locator = karta, jejíž odkaz obsahuje číslo článku z URL (například `_2610291858_`). Číslo článku zůstává, i když se výpis posune.
- **Nemají být bloky:** tři nadpisy `h2` sekcí, hlavička s navigací, patička.
- **Cookie lišta:** při snapshotu překrývala stránku (dolní část obrazovky), nebyla potvrzena ani odmítnuta. DOM kart pod ní byl načtený.
- **Reprodukce:** výpis se změní během hodin a trvalý odkaz na jeho stav neexistuje. Při opakování hledej karty podle čísla článku; kdo už ze stránky zmizel, nahraď stránkou vyhodnocení „nelze reprodukovat“ nebo otevři článek podle URL a ověř ho zvlášť.

## P04: ČT24 „Právě se děje“, dynamický obsah (CS)

- **URL:** https://ct24.ceskatelevize.cz/textovy-prenos/prave-se-deje-380 (**živý přenos**; číslo v URL se může časem změnit). Stránka je aplikace v Next.js.
- **Co testuje:** asynchronní změny DOM. Počáteční stav: 24 zpráv `li.text-stream__message-wrap` s id `zprava-<id>`. Jedno kliknutí na tlačítko „Zobrazit další příspěvky“ **přidalo dalších 24 zpráv** (48 celkem), URL se nezměnila a první zpráva zůstala stejná. Nové zprávy navíc přibývají živě nahoře.
- **Anotované bloky (24):** počáteční stav, id `zprava-245555` až `zprava-245528`. Dalších 24 po kliknutí **není anotováno**.
- **Prázdné zprávy:** dvě zprávy (`zprava-245549`, `zprava-245528`) nemají žádný text, pravděpodobně jde o vložený objekt. Mají zůstat viditelné (nejistá klasifikace se neskrývá).
- **Nemají být bloky:** hlavička a menu, dlaždice `article-strip` s nadpisy `h3` (odkazy na články mimo přenos), tlačítko „Zobrazit další příspěvky“.
- **Reprodukce:** podle id zprávy; starší zprávy mohou časem zmizet z úvodních 24 a objevit se až po rozbalení.

## P05: Wikipedia, diskuzní stránka, hluboké vnoření (EN)

- **URL:** https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905 (**trvalý odkaz na revizi**; licence CC BY-SA).
- **Co testuje:** hloubka. Nejhlubší text je v DOM na úrovni 43 a v sekci „Last sentence of lede“ jsou odpovědi vnořené do 17 úrovní `<dl>`.
- **Anotované bloky (6):** šest `<section data-mw-section-id="0|1|2|3|4|5">`: úvodní upozornění, „Clockwise from top left“, „Last sentence of lede“, „Still no Response regarding belligerents list“, „Edit request“, „Pro west propaganda?“. Anotuje se úroveň celé diskuze, jednotlivé příspěvky ne.
- **Uživatelská jména a podpisy:** v anotaci nejsou.
- **Nemají být bloky:** panel nástrojů Wikipedie, šablony `WikiProject`, navigace.
- **Poznámka:** úvodní sekce (`id="0"`) je jen upozornění na „contentious topic“. Je v anotaci kvůli kontrole, zda extraktor takový blok nevydává jako obsahový.

## P06: BBC News, reklamní kontejnery (EN)

- **URL:** https://www.bbc.com/news/articles/cmqxnl312v34o („Spain train crash: Audio reveals exchanges between operators and drivers“, publikováno 2026-10-29 11:07 UTC; po čase se může upravit).
- **Co testuje:** reklamy uvnitř textu. Tělo článku má 35 odstavců (`[data-component="text-block"]`) a mezi nimi tři vložené dvojice `advertisement-block` + `ad-slot`. Extraktor nesmí článek v reklamách rozdělit ani reklamu vydat jako obsah.
- **Anotované bloky (9):** (1) tělo článku `main > article`; (2–9) osm souvisejících karet v `main > aside` (`div[data-testid="chester-card"]` a sourozenecké karty), identifikované koncem odkazu (například `…/c81dw94w5gzyo`).
- **Nemají být bloky:** 6× `[data-component="ad-slot"]` (3 uvnitř článku, 3 mimo), 4× `advertisement-block` (3 uvnitř), `links-block` uvnitř článku (3 odkazy, jeden duplicitní s kartou), 2× `video-block`, 2× `image-block`, nadpis „Let us know you agree to cookies“.
- **Reklamní kontejnery:** podle názvů tříd (`AdSlotDummyContainer`) jde o zástupné kontejnery, ne o skutečně načtené reklamy (bez souhlasu s cookies). Ověřit, jak se stránka chová s načtenými reklamami, je úkol pro člověka.
- **Prohlížeč:** BBC vyžadoval opakované jednorázové povolení v panelu prohlížeče; neovlivňuje obsah stránky.
