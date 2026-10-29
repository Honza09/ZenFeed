# Karty pilotních stránek

Všechna pozorování pocházejí z jednoho otevření stránky v prohlížeči 29. 10. 2026 (cca 19:10–19:50 SEČ). Nic nebylo stahováno hromadně, nic nebylo odesláno ani změněno. Strukturu stránek jsem četl krátkými skripty spuštěnými v otevřené stránce; co to znamená pro podmínky použití, je v následující sekci. Podmínky jsem prošel 29. 10. 2026 večer (viz níže).

Obecně: u všech stránek je navigace, hlavička, patička a případné cookie lišty a reklamy **mimo** anotované bloky. U stránek, kde jsem prvky ověřil, jsou vypsané níže. Cookie lišty jsem nepotvrzoval ani neodmítal.


## Podmínky použití a robots.txt (stav 29. 10. 2026)

> Není to právní posouzení. Plán (§5.1) a proposal chtějí testovat jen v souladu s podmínkami, závěry níže jsou moje čtení textů a konečné rozhodnutí je na týmu. Texty podmínek pro root.cz, Český rozhlas, Wikimedii a BBC dodala Libuše; podmínky Y Combinator a `robots.txt` jsem načetl sám. Podmínky jsou parafrázované, ne citované.

Značky: **povoleno** = podmínky takový postup výslovně umožňují; **zakázáno** = podmínky ho výslovně vylučují (bez povolení provozovatele); **neurčeno** = podmínky se k ručnímu otevření a pozorování struktury nevyjadřují jednoznačně.

| Stránka | Web | Závěr | Odkaz na podmínky | `robots.txt` |
|---|---|---|---|---|
| P01 | root.cz | **neurčeno** | patička https://www.root.cz/ (text „Copyright © Internet Info, s.r.o.“; odkaz na přesnou stránku doplnit) | https://www.root.cz/robots.txt: zakázány jen `/api/`, `/vyhledavani`, přihlášení a podobné; `/clanky/` povoleno |
| P02 | news.ycombinator.com | **neurčeno, hraniční** (automatizovaný sběr zakázán) | https://www.ycombinator.com/legal (Terms of Use, platí pro celou doménu včetně HN) | https://news.ycombinator.com/robots.txt: `/item` povoleno, ale `Crawl-delay: 30` |
| P03 | irozhlas.cz | **neurčeno** | podmínky užití obsahu Českého rozhlasu (text dodala Libuše; odkaz doplnit); souvisí https://informace.rozhlas.cz/verejne-podminky-redistribuce-online-obsahu-ceskeho-rozhlasu-8524559 | https://www.irozhlas.cz/robots.txt: vše povoleno pro `*`, ale jmenovitě blokuje desítky AI botů včetně ClaudeBot, Claude-Web a anthropic-ai |
| P04 | ct24.ceskatelevize.cz | **neurčeno** (podmínky užití webu jsem nenašel) | v patičce jen https://www.ceskatelevize.cz/ochrana-soukromi/ a „Přístupnost“; sekce https://www.ceskatelevize.cz/vse-o-ct/zakony-a-pravidla/ obsahuje smluvní, dodavatelská a bezpečnostní pravidla, ne podmínky užití webu | https://ct24.ceskatelevize.cz/robots.txt: `User-agent: *`, `Disallow:` prázdné (nic nezakazuje) |
| P05 | en.wikipedia.org | **povoleno** | https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Terms_of_Use (shrnutí dodala Libuše) | nenačteno (stahování se nepodařilo) |
| P06 | lupa.cz | **neurčeno** | Internet Info, s.r.o. (stejný vydavatel jako root.cz): https://www.finance.cz/podminky-uzivani/ a kontakt https://www.lupa.cz/kontakt/ (odkaz na podmínky přímo na lupa.cz doplnit) | nenačteno |
| ~~P06 (původní)~~ | bbc.com | **zakázáno** bez povolení BBC (**vyřazeno**) | BBC Global Terms of Use (verze 1.0, aktualizace 15. 4. 2026, text dodala Libuše; odkaz „Terms of Use“ v patičce bbc.com doplnit) | nenačteno (přístup k webu blokován nástrojem) |

### Důvody

- **root.cz:** podmínky odkazují na autorský zákon a vyžadují souhlas vydavatele s převzetím materiálu. O ručním prohlížení, automatizovaném přístupu ani o analýze se nezmiňují. Ukládáme jen URL, selektory a krátké identifikační úryvky, ne texty. Server si vyhrazuje omezit přístup uživatelům s blokováním reklam (nás se netýká).
- **Hacker News / Y Combinator:** podmínky výslovně zakazují data mining, roboty, scraping a podobné metody sběru dat a obcházení blokování. Ruční prohlížení neomezují. Skript, který jsem v konzoli pustil nad jednou stránkou, aby vypsal komentáře, je v tom smyslu **hraniční**. Doporučení: pro P02 nepoužívat skripty; ID komentářů, odsazení a úryvky ověřit ručně (v anotaci už jsou).
- **iROZHLAS / Český rozhlas:** textové materiály jsou chráněné autorským zákonem a jejich šíření nebo další zpřístupňování bez souhlasu je zakázáno. K ručnímu prohlížení a analýze podmínky nic neříkají. `robots.txt` blokuje jmenovitě crawlery AI (včetně těch od Anthropicu); týká se to automatických robotů, ne ručního otevření stránky v prohlížeči, ale je to signál, že provozovatel je vůči strojovému zpracování zdrženlivý. V repozitáři jsou titulky karet (≤ 75 znaků) jako identifikační úryvky; pokud je repozitář veřejný, zvaž jejich zkrácení nebo odstranění.
- **ČT24:** žádné podmínky užití webu jsem nenašel, `robots.txt` nic nezakazuje. Bez písemných podmínek nelze říct ani povoleno, ani zakázáno. Doporučení: zeptat se České televize (kontakt na stránce ochrany soukromí) nebo ponechat jako „neurčeno“ a zdokumentovat.
- **Wikipedie:** podmínky umožňují číst, sdílet a znovu používat obsah pod svobodnými licencemi (zde CC BY-SA) a vyžadují neškodit infrastruktuře. Pozorování jedné stránky nic nepoškozuje. Při převzetí textu uvádět zdroj; my ukládáme jen odkaz na revizi a názvy sekcí. Poznámka: obsah diskuzí tvoří jména editorů, ta v anotaci nejsou.
- **lupa.cz:** provozuje Internet Info, s.r.o., stejně jako root.cz. Podmínky, které jsem našel, se k ručnímu čtení ani strojové analýze nevyjadřují, proto **neurčeno** (stejně jako root.cz). Ukládáme jen URL, selektory a krátké úryvky.
- **BBC (vyřazeno):** podmínky (§7 a §8) výslovně zakazují roboty, skripty a nástroje na sběr obsahu automatizovanými prostředky a vyžadují povolení pro použití obsahu při vývoji nebo trénování AI i pro „computer analysis“. Neosobní nekomerční použití je povoleno jen pro osobní účely. **Moje chování:** na stránce P06 jsem v prohlížeči čtyřikrát spustil krátký skript, který vypsal strukturu stránky (typy komponent, ID karet). To spadá pod zákaz skriptů ve smyslu podmínek. Nic nebylo uloženo ani sdíleno kromě selektorů a titulků v tomto repozitáři, ale v testování BBC bez povolení se pokračovat nemá.

### Důsledek pro pilot

1. **P06 (BBC) byla nahrazena** stránkou lupa.cz (viz kartu P06). BBC zůstává v historii, viz sekci „Vyřazené stránky“ na konci. Znovu ji lze použít jen s povolením BBC.
2. **P02 (HN):** další měření extraktorem bez ručního výběru je hraniční; rozhodne tým.
3. **Produktová otázka mimo pilot:** ZenFeed sám čte a posílá na backend text stránky na žádost uživatele v jeho prohlížeči. Zda to podmínky těchto webů dovolují (BBC „computer analysis“), je třeba posoudit odděleně od testování.

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

## P06: lupa.cz, reklamní kontejnery (CS)

- **URL:** https://www.lupa.cz/clanky/drahe-pameti-mame-i-kvuli-krvave-lazni-pri-niz-korejci-vyhladoveli-posledniho-vyrobce-ram-v-evrope/ (článek z konce října 2026; po čase se může upravit).
- **Co testuje:** reklamní kontejnery uvnitř těla článku. Obsah leží v `div.element-margin-top-half` (38 potomků), členěný do sekcí `h2#h20`–`h2#h23`; mezi odstavci jsou 3× `ins.adsbygoogle` a reklamní kontejnery `div.ad-detail`. Extraktor nesmí článek v reklamách rozdělit ani reklamu vydat jako obsah.
- **Anotované bloky (11):** (1) úvod před prvním h2, (2–5) čtyři sekce `h20`–`h23`, (6–11) šest doporučených karet `section.recommended-articles li.ra-entity` identifikovaných slugem odkazu.
- **Nemají být bloky:** `ins.adsbygoogle` (na celé stránce 7), `design-advert-placeholder` (10), `div.ad-detail`, promo `o-promo-in-article`, formulář `mdl-subscription-widget`, sekce ANKETA, AUTOR a KOMERČNÍ SDĚLENÍ, navigace.
- **Téma a tón:** všechny bloky mají téma `jiné` a tón `ne`; stránka tedy nemá nic ke skrytí v S1–S3. Jde o záměrně „čistý“ případ, na kterém se měří falešná skrytí a segmentace. Pokud chce tým i reklamní stránku s obsahem ke skrytí, je potřeba přidat další.
- **Reklamy:** část kontejnerů může být prázdná nebo zástupná podle souhlasu s cookies; ověřit se stránkou s načtenými reklamami je úkol pro člověka.
- **Podmínky použití:** viz sekce výše (neurčeno).
- **Postup při výběru:** strukturu jsem na stránce zjišťoval jen čtením DOM (bez stahování nebo ukládání obsahu), a to po zjištění, že podmínky vydavatele nic nezakazují.

## Vyřazené stránky

### Původní P06: BBC News (EN), vyřazeno 29. 10. 2026

- **URL:** https://www.bbc.com/news/articles/cmqxnl312v34o („Spain train crash: Audio reveals exchanges between operators and drivers“, publikováno 2026-10-29 11:07 UTC).
- **Důvod vyřazení:** BBC Global Terms of Use (verze 1.0, 15. 4. 2026) §7 zakazuje roboty, skripty a automatizovaný sběr obsahu a §8 vyžaduje povolení pro strojovou analýzu a použití při vývoji AI. Na stránce jsem před přečtením podmínek čtyřikrát spustil krátký skript pro výpis struktury; to jsem Libuši oznámil. Nic jiného než selektory a titulky se neukládalo.
- **Co zůstalo zachováno:** 9 bloků v [`anotace-vyrazene.csv`](anotace-vyrazene.csv) (ID `P06-BBC-B001`–`B009`; tělo článku a 8 souvisejících karet) a tento popis.
- **Původní struktura:** tělo článku 35× `[data-component="text-block"]`, mezi nimi 3 dvojice `advertisement-block` + `ad-slot`; celkem 6× `ad-slot` a 4× `advertisement-block`; `links-block` se 3 odkazy, 2× `video-block`, 2× `image-block`, nadpis cookie lišty. Reklamní kontejnery byly zástupné (`AdSlotDummyContainer`).
- **Použití:** měření se neprovádí. Stránka se může vrátit, pokud BBC udělí povolení.
