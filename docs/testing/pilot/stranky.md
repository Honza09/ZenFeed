# Karty pilotních stránek

Stav: **přepracováno 2. 11. 2026**. Původní pilot (root.cz, Hacker News, iROZHLAS, ČT24, lupa.cz) byl vyřazen, protože u nich nebylo možné **ověřit**, že je lze použít (viz „Vyřazené stránky“ na konci). Nová sada vychází ze zdrojů s ověřenou otevřenou licencí. Wikipedie (P05) zůstala beze změny. Global Voices bylo ověřeno a anotováno, ale z pilotu vypadlo (viz „Nahrazené stránky“).

Pozorování nových stránek pochází z jednoho otevření stránky v prohlížeči 2. 11. 2026 (cca 20:00–20:50 SEČ), P05 z 29. 10. 2026. Nic nebylo stahováno hromadně, nic nebylo odesláno ani změněno. Strukturu stránek jsem četla krátkými skripty spuštěnými v otevřené stránce (čtení DOM). Cookie lišty jsem nepotvrzovala ani neodmítala.

Obecně: navigace, hlavička, patička, cookie lišty, reklamy a doporučené odkazy jsou **mimo** anotované bloky, pokud karta nepíše jinak.

## Podmínky použití (stav 2. 11. 2026)

> Není to právní posouzení. Závěry jsou čtení textů licencí a pravidel a konečné rozhodnutí je na týmu. Podmínky jsou parafrázované, ne citované. Projekt je školní a nekomerční. Všechny nové zdroje jsem otevřela v prohlížeči bez problémů, takže se na ně agent dostane.

Značky: **povoleno** = licence nebo pravidla výslovně umožňují použití obsahu; **povoleno s výhradou** = licence je jasná, ale zůstává otevřený bod uvedený v „Důvodech“; **neurčeno / zakázáno** = viz „Vyřazené stránky“.

| Stránka | Web | Závěr | Odkaz na podmínky | Co podmínky neříkají |
|---|---|---|---|---|
| P01 | ourworldindata.org | **povoleno** (CC BY) | https://ourworldindata.org/faqs, licence stránky https://ourworldindata.org/war-and-peace#article-licence | scraping stránek; pro data nabízí Chart Data API |
| P02 | forum.effectivealtruism.org | **povoleno s výhradou** (obsah uživatelů CC BY 4.0) | https://forum.effectivealtruism.org/termsOfUse (dodatek o licenci), příspěvek o licenci https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons; obecné podmínky CEA https://effectivealtruism.org/terms-and-conditions | dodatek o scrapingu neříká nic a odkazuje na §7 „Restrictions“ obecných podmínek, jehož text jsem neviděla |
| P03 | nasa.gov | **povoleno** | https://www.nasa.gov/multimedia/guidelines/index.html | automatizovaný přístup; podmínky řeší hlavně média a obrázky |
| P04 | ourworldindata.org | **povoleno** (CC BY) | https://ourworldindata.org/faqs (licence obsahu OWID: CC BY) | scraping stránek; pro data nabízí Chart Data API |
| P05 | en.wikipedia.org | **povoleno** (CC BY-SA) | https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Terms_of_Use | `robots.txt` nenačteno; verdikt vychází z dřívějšího záznamu |
| P06 | horydoly.cz | **povoleno** (CC BY 3.0 CZ) | http://www.horydoly.cz/media/horydoly-uvolnuji-obsah-pro-verejnost.html | boty, scraping, data mining ani AI |

`robots.txt` nových stránek se mi nepodařilo načíst, nehodnotím ho; pozorování jsem dělala jen v otevřené stránce.

### Důvody

- **Global Voices (nahrazeno, dříve P01):** obsah je pod CC BY 3.0, sdílení a úpravy včetně komerčních jsou povoleny při uvedení autora a odkazu na licenci. Fotky, video a audio třetích stran nemusí mít stejné podmínky; my je neukládáme. Stránka ani pravidla pro AI nic neříkají o strojovém čtení, a proto je to „povoleno“ jen v tom smyslu, že licence nic nezakazuje. Ukládáme jen URL, selektory a popisky bloků.
- **EA Forum (P02):** podle dodatku k podmínkám dávají autoři svůj obsah pod CC BY 4.0 a ostatním uživatelům povolují jeho sdílení a úpravy k jakémukoli účelu. Výhrady: (1) §7 obecných podmínek jsem nečetla; (2) obecné podmínky CEA (effectivealtruism.org) omezují web na osobní nekomerční použití a o scrapingu mlčí, přičemž licence CC se týká obsahu uživatelů, ne vlastních textů CEA; pro školní nekomerční projekt to nevadí, ale je to dobré vědět; (3) podle příspěvku se licence ve výchozím stavu **nevztahuje na obsah zveřejněný před 1. 12. 2022**; komentáře ve vlákně jsou z let 2022–2023 (zjištěno z časů na stránce: nejstarší 18. 11. 2022, další z března 2023), takže část komentářů nemusí být pod CC BY 4.0. Ukládáme z nich jen krátký identifikační úryvek bez autora. Uživatelská jména neukládáme.
- **NASA (P03):** většina obsahu NASA (obrázky, zvuk, video, soubory) není v USA chráněna autorským právem; vzdělávací a informační použití je široce povoleno. Chráněné jsou insignie, logo a identifikátory, dále materiály třetích stran a osoby (astronauti, zaměstnanci) v komerčním kontextu. Pokyny nic neříkají o automatizovaném přístupu. Na kartách jsou jen titulky a odkazy; obrázky neukládáme.
- **Our World in Data (P01 a P04):** texty, vlastní grafy a vlastní data jsou pod CC BY (uvést OWID a autory, odkaz). Data třetích stran (WHO, OSN, UCDP apod.) mají licence svých zdrojů, grafy třetích stran také. Kód Grapheru má vlastní licenci a bez písemného povolení se nepřebírá. Stránka nabízí Chart Data API pro automatizované použití, ale scraping HTML výslovně neřeší. Neukládáme grafy ani data, jen selektory a názvy sekcí.
- **Wikipedie (P05):** beze změny, viz dřívější závěr: podmínky umožňují číst, sdílet a znovu používat obsah pod svobodnými licencemi (CC BY-SA) a vyžadují neškodit infrastruktuře. Ukládáme jen odkaz na revizi a názvy sekcí, bez jmen editorů.
- **Horydoly.cz (P06):** obsah webu i tištěného magazínu je od 24. 6. 2010 pod CC BY 3.0 CZ (text, fotky, videa), podmínkou je uvést autora a odkaz na zdroj (www.horydoly.cz). Vyloučeny jsou materiály s jiným označením a obsah přebraný z jiných médií. Podmínky nezmiňují boty ani AI.

**Moje chování:** na všech nových stránkách jsem v prohlížeči spustila krátký skript, který jen čte DOM (počty prvků, selektory, titulky). U zdrojů výše to neodporuje žádnému zákazu, který jsem našla, ale u EA Forum je to podmíněno nepřečteným §7 a u NASA, OWID a Global Voices podmínky o strojovém čtení mlčí.

### Důsledek pro pilot

1. **Původní P01–P04 a P06 jsou vyřazené**, jejich anotace jsou zachované v [`anotace-vyrazene.csv`](anotace-vyrazene.csv). Znovu je lze použít, jen pokud provozovatel povolení vydá nebo tým rozhodne jinak.
2. **Domény:** pilot má 5 různých domén (Our World in Data je dvakrát: P01 a P04). **Jazyk:** nová sada je 5× angličtina a 1× čeština (jen Horydoly). Proposal chce češtinu i angličtinu; poměr pro 24 stránek určí ZF-27. Další české zdroje s ověřenou licencí viz [`kandidati-pro-zf-19.md`](kandidati-pro-zf-19.md).
3. **Pozitivní případy:** v příkladových nastaveních S1–S4 má co skrývat jen OWID War and Peace (P01, S1: 5 bloků), OWID Data Insights (P04, S2: 2 bloky) a Wikipedie (P05). P02, P03 a P06 jsou „negativní kontroly“ (měří falešná skrytí a dělení bloků, ne recall).
4. **Produktová otázka mimo pilot:** ZenFeed sám čte a posílá na backend text stránky na žádost uživatele v jeho prohlížeči. Zda to podmínky navštívených webů dovolují, je třeba posoudit odděleně od testování.

## P01: Our World in Data, War and Peace, statická tematická stránka (EN)

- **URL:** https://ourworldindata.org/war-and-peace (tematická stránka o válce a míru; licence CC BY, uvádějte Our World in Data; stránku zvolila Libuše jako statický případ s pozitivním S1).
- **Co testuje:** statickou stránku s více sekcemi (`H1` pro každou sekci) a mnoha grafy; všechno je v dokumentu hned po načtení (neověřeno jako dynamické: opakované měření 2. 11. 2026 nezměnilo počet prvků ani po rolování). Grafy jsou vykresleny JavaScriptem (`figure.chart`, `figure.explorer`), takže extraktor musí počítat s obsahem uvnitř `svg`.
- **Anotované bloky (6):** `div#introduction`, `div.article-block__key-insights` (h1#key-insights), `section.article-block__research-and-writing` (h1#research-writing), `div.article-block__gray-section` (h1#explore-data-on-armed-conflict-and-war), `section.article-block__all-charts` (h1#all-charts), kontejner `h3#article-endnotes`.
- **Nemají být bloky:** hlavička a navigace, `section#article-citation`, `section#article-licence`, vyhledávání (`div#autocomplete`), anketa (`div#user-survey-root`), patička. **Skrytý prvek:** `section.article-block__featured-metrics` („Featured Data on War & Peace“) je v DOM, ale má `display: none` a uživatel ho nevidí, proto není blok; extraktor, který čte `textContent`, ji může omylem vrátit.
- **Téma a tón:** statistický a věcný text o válce, takže je 5 bloků `válka` (S1 je skryje; `válka` má přednost před `zprávy o úmrtí`, protože úmrtí jsou důsledkem války, rozhodla Libuše). Endnotes jsou `jiné` (jistota `H`). Tón je všude `ne`.
- **Neanotováno:** jednotlivé grafy a odstavce uvnitř bloků.

## P02: EA Forum, komentáře (EN)

- **URL:** https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons (vlákno o změně licence fóra).
- **Co testuje:** komentáře s vnořením. 24 komentářů, vnoření do 3 úrovní odpovědí; každý komentář je `article#<id>` (17 znaků), vnořené jsou uvnitř rodiče.
- **Anotované bloky (25):** všech 24 komentářů ve vlákně (locator `article#<id>`) a tělo příspěvku (`P02-B025`, `div.content-base`, 5 sekcí `h2`, anotováno jako jeden blok podle rozhodnutí Libuše). Jména autorů se neukládají.
- **Nemají být bloky:** hlavička, boční panel, formulář pro nový komentář; na stránce je 36 prvků `article`, z toho 24 komentářů.
- **Téma a tón:** diskuze o licenci, všechno `jiné` a `ne`. Jediný hraniční tón je `xmYSsxcn3pWukj35f` (podrážděná otázka), ale vyhrocený není.
- **Poznámka:** komentáře jsou pod licencí uživatelů (CC BY 4.0), úryvky jsou krátké a bez autorů.

## P03: NASA, nejnovější zprávy, feed s kartami (EN)

- **URL:** https://www.nasa.gov/news/recently-published/ (**nestabilní výpis**, snapshot 2. 11. 2026 kolem 20:30).
- **Co testuje:** opakované karty. 25 prvků `div.hds-content-item`, stránka má jeden `article` (obal stránky). Nadpis a odkaz jsou uvnitř karty, u každé karty je „N MIN READ“.
- **Anotované bloky (25):** všechny karty. Locator = karta, jejíž odkaz začíná daným prefixem `href` (relativní i absolutní, odkazy vedou na nasa.gov i science.nasa.gov). Prefix zůstane, i když se výpis posune.
- **Nemají být bloky:** záhlaví stránky, nabídka (včetně rozbalovací položky „More“ v hlavičce, která s feedem nesouvisí), odkazy na sociální sítě („More NASA Social Accounts“), stránkování pod výpisem (1, 2, 3 … 4063, Next), patička.
- **Téma a tón:** žádná karta nespadá do příkladových nastavení (vesmírná věda, Halloween v titulcích), takže jde o **negativní kontrolu** na falešná skrytí. Tři karty jsou `H` (jistota): Swift (zánik družice), Vega Island „Frozen in Fright“, TRACERS „Violent Magnetic Process“.
- **Dynamické chování (ověřeno 2. 11. 2026):** klepnutí na stránkování „2“ **nahradilo** 25 karet jinými 25 (první karta se změnila) bez změny URL. Jde tedy o dynamický případ s výměnou obsahu, ne s přidáváním. Anotované jsou jen karty první stránky výpisu (stránka 1). Karty z dalších stránek nejsou anotovány.
- **Reprodukce:** výpis se mění po hodinách; hledej karty podle prefixu odkazu.

## P04: Our World in Data, Data Insights, dynamický obsah (EN)

- **URL:** https://ourworldindata.org/latest?type=data-insight (výpis „Data Insights“, nestabilní, nejnovější nahoře; licence CC BY, uvádějte Our World in Data).
- **Co testuje:** obsah, který se **přidává** po akci uživatele. Počáteční stav: 20 položek (`main#latest-page-root > article#<slug>`). Klepnutí na tlačítko „Show more“ přidalo dalších 20 (celkem 40), URL se nezměnila a první položka zůstala stejná (ověřeno 2. 11. 2026 v prohlížeči). Tlačítko po klepnutí zůstává na stránce.
- **Anotované bloky (20):** počáteční stav, locator `main#latest-page-root > article#<slug>` (slug v URL položky je stabilní, i když se výpis posune). Dalších 20 po klepnutí **není anotováno**.
- **Nemají být bloky:** hlavička a navigace, nadpis „Latest“, filtry, tlačítko „Show more“, patička.
- **Téma a tón:** krátké statistické texty o světě (demografie, energie, chudoba, zdraví, příroda). Tón je všude `ne`. Dvě položky jsou `zprávy o úmrtí` s jistotou `H` (úmrtnost na HIV/AIDS, dětská úmrtnost); v S2 se skryjí. Dvě další jsou `jiné` s `H` (malárie, Living Planet Index).
- **Poznámka:** původně byla jako P04 zvolena stránka War and Peace (https://ourworldindata.org/war-and-peace). Všechen její obsah je na stránce hned po načtení, takže nešlo o dynamický případ; sekce „Featured Data on War & Peace“ je v DOM, ale má `display: none`.

## P05: Wikipedia, diskuzní stránka, hluboké vnoření (EN)

- **URL:** https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905 (**trvalý odkaz na revizi**; licence CC BY-SA).
- **Co testuje:** hloubka. Nejhlubší text je v DOM na úrovni 43 a v sekci „Last sentence of lede“ jsou odpovědi vnořené do 17 úrovní `<dl>`.
- **Anotované bloky (6):** šest `<section data-mw-section-id="0|1|2|3|4|5">`: úvodní upozornění, „Clockwise from top left“, „Last sentence of lede“, „Still no Response regarding belligerents list“, „Edit request“, „Pro west propaganda?“. Anotuje se úroveň celé diskuze, jednotlivé příspěvky ne.
- **Uživatelská jména a podpisy:** v anotaci nejsou.
- **Nemají být bloky:** panel nástrojů Wikipedie, šablony `WikiProject`, navigace.
- **Poznámka:** úvodní sekce (`id="0"`) je jen upozornění na „contentious topic“. Je v anotaci kvůli kontrole, zda extraktor takový blok nevydává jako obsahový.

## P06: Horydoly.cz, reklamní kontejnery (CS)

- **URL:** https://www.horydoly.cz/jidlo-a-piti/vejce-losos-i-mleko-kultivovane-potraviny-si-razi-cestu-na-pulty-obchodu.html (článek „Vejce, losos i mléko. Kultivované potraviny si razí cestu na pulty obchodů“; licence CC BY 3.0 CZ).
- **Co testuje:** reklamní kontejnery u textu. Reklamy na stránce: `div#banner_top` (nahoře), 3× `ins.adsbygoogle` (z toho jedna uvnitř `div.google-auto-placed` v `div#search`), `div#sklikReklama_122882.adFull` (v `div.content` článku); k tomu cookie souhlas `div.fc-consent-root`. Extraktor nesmí reklamu vydat za obsah ani rozdělit článek.
- **Anotované bloky (8):** perex (`div.wysiwyg_content.perex_content`) a sedm sekcí podle `h2` v `div#asset_213980.wysiwyg_content`: Rybí prsty z laboratoře, Náhrada mléčných výrobků, Vaječná bílkovina ze zkumavky, Investice?, Dělící čára, Nadějná studie z Finska, Velký otazník. Každé `h2` následuje jeden odstavec (poslední sekce má navíc podpis autorky).
- **Nemají být bloky:** „Užitečné odkazy“, „Hlavní nabídka“, „Nejčtenější články“, „Regiony“, „Kalendář akcí“, „Diskuse“, „Fórum“, formulář nového komentáře (`form.newEntry`), všechny reklamy výše.
- **Ověřeno:** struktura těla je pravidelná (h2, odstavec, h2, odstavec …), „Dělící čára“ je skutečná sekce, což potvrdila Libuše.
- **Téma a tón:** celý článek o kultivovaných potravinách je `jiné` a `ne`, takže jde o **negativní kontrolu** (reklamy a dělení bloků). Cookie souhlas není potvrzen ani odmítnut, skutečné reklamy se mohou lišit podle souhlasu.

## Vyřazené stránky

Všechny níže byly součástí původního pilotu (stav 29. 10. 2026). Důvod vyřazení je vždy stejný: **nebylo možné ověřit, že je lze použít**, případně to podmínky výslovně zakazují. Anotace jsou zachované v [`anotace-vyrazene.csv`](anotace-vyrazene.csv) (ID s příponou zdroje, například `P01-ROOT-B001`) a nepoužívají se pro měření. Projekt je školní a nekomerční, ale tým chtěl mít u každé stránky ověřeno, že ji lze použít.

| Zdroj | Dříve | Závěr | Důvod vyřazení | Odkaz na podmínky | `robots.txt` |
|---|---|---|---|---|---|
| root.cz | P01 | **neurčeno** | podmínky odkazují na autorský zákon a vyžadují souhlas vydavatele s převzetím; k ručnímu čtení ani strojové analýze se nevyjadřují | patička https://www.root.cz/ (Copyright © Internet Info, s.r.o.; přesný odkaz nedoplněn) | https://www.root.cz/robots.txt: zakázány jen `/api/`, `/vyhledavani`, přihlášení; `/clanky/` povoleno |
| Hacker News | P02 | **zakázáno** (automatizovaný sběr) | podmínky Y Combinator výslovně zakazují data mining, roboty, scraping a obcházení blokování; ruční prohlížení neomezují, skript v konzoli je hraniční | https://www.ycombinator.com/legal | https://news.ycombinator.com/robots.txt: `/item` povoleno, `Crawl-delay: 30` |
| iROZHLAS | P03 | **neurčeno** | textové materiály jsou chráněné autorským zákonem; `robots.txt` jmenovitě blokuje AI boty včetně ClaudeBot, Claude-Web a anthropic-ai | podmínky užití obsahu Českého rozhlasu (text dodala Libuše), https://informace.rozhlas.cz/verejne-podminky-redistribuce-online-obsahu-ceskeho-rozhlasu-8524559 | https://www.irozhlas.cz/robots.txt |
| ČT24 | P04 | **neurčeno** | podmínky užití webu se nepodařilo najít; sekce „Zákony a pravidla“ obsahuje jen smluvní, dodavatelská a bezpečnostní pravidla. Pro běžné články a videa se nepodařilo ověřit podmínky použití obsahu | https://www.ceskatelevize.cz/ochrana-soukromi/, https://www.ceskatelevize.cz/vse-o-ct/zakony-a-pravidla/ | https://ct24.ceskatelevize.cz/robots.txt: nic nezakazuje |
| lupa.cz | P06 | **neurčeno** | stejný vydavatel jako root.cz (Internet Info, s.r.o.), podmínky se k strojové analýze nevyjadřují | https://www.finance.cz/podminky-uzivani/, kontakt https://www.lupa.cz/kontakt/ | nenačteno |
| BBC | původní P06 | **zakázáno** bez povolení | viz níže | BBC Global Terms of Use (v1.0, 15. 4. 2026) | nenačteno |

Historie karet vyřazených stránek (struktura při snapshotu 29. 10. 2026):

### root.cz, statický článek (CS), dříve P01

- **URL:** https://www.root.cz/clanky/postrehy-z-bezpecnosti-vypadek-cloudu-odstrihl-banky-soudy-i-dalsi-sluzby/ (článek z 26. 10. 2026, stabilní).
- **Co testuje:** slabá sémantika. Na stránce nenajdeš `<article>` ani `<main>`, nadpisy jsou `h2#h20` až `h2#h25` v kontejneru `div.element-margin-top-half`, hloubka nadpisu v DOM je 10.
- **Anotované bloky (6):** `h2#h20` Ransomware / MFA, `h2#h21` LiteLLM, `h2#h22` výpadek Google Cloudu, `h2#h23` únik e-mailů AfD, `h2#h24` Ve zkratce, `h2#h25` Pro pobavení. Blok = nadpis a následující prvky do dalšího `h2`.
- **Nemají být bloky:** `h2` „Sdílet“ (třída `element-blind-user`), `h2` „O seriálu“, widget hodnocení článku, bloky „Podpořte redakci“.
- **Neanotováno (rozhodnutí o granularitě):** tři dlaždice související články (`h3.prj003-heading`) pod článkem; na stránce je pravděpodobně i diskuse, tu jsem neprozkoumal.
- **Reklamy:** hrubý selektor našel desítky prvků (74), ale tak široký selektor reklamy neidentifikuje. Reklamy na této stránce se neanotují (reklamní případ je P06).
- **Cookie lišta:** prvek existuje, stav neověřen.

### Hacker News, komentáře (EN), dříve P02

- **URL:** https://news.ycombinator.com/item?id=50153664 („Ukraine claims first drone evacuation of wounded soldier“; vlákno z 20. 10. 2026, stabilní).
- **Co testuje:** komentáře s hlubokým odsazením. Na stránce je 350 komentářů, z toho 21 na nejvyšší úrovni, odsazení až 17 úrovní. Tabulková stavba (`tr.athing.comtr`).
- **Anotované bloky (15):** prvních 15 komentářů v pořadí DOM, locator = `tr.athing.comtr#<id komentáře>`. Zbylých 335 není anotováno.
- **Důsledek pro měření:** extraktor vrátí zřejmě stovky bloků. ZF-07 musí rozhodnout, zda se porovnává jen na anotovaném vzorku (navrženo), nebo se doanotuje víc.
- **Uživatelská jména a texty:** neukládají se. Úryvky mají ≤ 50 znaků.
- **Nemají být bloky:** hlavička a navigace HN, odkazy „reply“, „parent“, formulář pro vložení komentáře.

### iROZHLAS, feed s kartami (CS), dříve P03

- **URL:** https://www.irozhlas.cz/zpravy-domov (**nestabilní výpis**, snapshot 29. 10. 2026 kolem 19:30; nejnovější karta z 18:58).
- **Co testuje:** opakované karty. Na stránce je 28 prvků `article.c-articles__item` v `div.c-articles__list`, nadpis karty je `h3`.
- **Anotované bloky (28):** všechny karty. Locator = karta, jejíž odkaz obsahuje číslo článku z URL (například `_2610291858_`). Číslo článku zůstává, i když se výpis posune.
- **Nemají být bloky:** tři nadpisy `h2` sekcí, hlavička s navigací, patička.
- **Cookie lišta:** při snapshotu překrývala stránku (dolní část obrazovky), nebyla potvrzena ani odmítnuta. DOM kart pod ní byl načtený.
- **Reprodukce:** výpis se změní během hodin a trvalý odkaz na jeho stav neexistuje. Při opakování hledej karty podle čísla článku; kdo už ze stránky zmizel, nahraď stránkou vyhodnocení „nelze reprodukovat“ nebo otevři článek podle URL a ověř ho zvlášť.

### ČT24 „Právě se děje“, dynamický obsah (CS), dříve P04

- **URL:** https://ct24.ceskatelevize.cz/textovy-prenos/prave-se-deje-380 (**živý přenos**; číslo v URL se může časem změnit). Stránka je aplikace v Next.js.
- **Co testuje:** asynchronní změny DOM. Počáteční stav: 24 zpráv `li.text-stream__message-wrap` s id `zprava-<id>`. Jedno kliknutí na tlačítko „Zobrazit další příspěvky“ **přidalo dalších 24 zpráv** (48 celkem), URL se nezměnila a první zpráva zůstala stejná. Nové zprávy navíc přibývají živě nahoře.
- **Anotované bloky (24):** počáteční stav, id `zprava-245555` až `zprava-245528`. Dalších 24 po kliknutí **není anotováno**.
- **Prázdné zprávy:** dvě zprávy (`zprava-245549`, `zprava-245528`) nemají žádný text, pravděpodobně jde o vložený objekt. Mají zůstat viditelné (nejistá klasifikace se neskrývá).
- **Nemají být bloky:** hlavička a menu, dlaždice `article-strip` s nadpisy `h3` (odkazy na články mimo přenos), tlačítko „Zobrazit další příspěvky“.
- **Reprodukce:** podle id zprávy; starší zprávy mohou časem zmizet z úvodních 24 a objevit se až po rozbalení.

### lupa.cz, reklamní kontejnery (CS), dříve P06

- **URL:** https://www.lupa.cz/clanky/drahe-pameti-mame-i-kvuli-krvave-lazni-pri-niz-korejci-vyhladoveli-posledniho-vyrobce-ram-v-evrope/ (článek z konce října 2026; po čase se může upravit).
- **Co testuje:** reklamní kontejnery uvnitř těla článku. Obsah leží v `div.element-margin-top-half` (38 potomků), členěný do sekcí `h2#h20`–`h2#h23`; mezi odstavci jsou 3× `ins.adsbygoogle` a reklamní kontejnery `div.ad-detail`. Extraktor nesmí článek v reklamách rozdělit ani reklamu vydat jako obsah.
- **Anotované bloky (11):** (1) úvod před prvním h2, (2–5) čtyři sekce `h20`–`h23`, (6–11) šest doporučených karet `section.recommended-articles li.ra-entity` identifikovaných slugem odkazu.
- **Nemají být bloky:** `ins.adsbygoogle` (na celé stránce 7), `design-advert-placeholder` (10), `div.ad-detail`, promo `o-promo-in-article`, formulář `mdl-subscription-widget`, sekce ANKETA, AUTOR a KOMERČNÍ SDĚLENÍ, navigace.
- **Téma a tón:** všechny bloky mají téma `jiné` a tón `ne`; stránka tedy nemá nic ke skrytí v S1–S3. Jde o záměrně „čistý“ případ, na kterém se měří falešná skrytí a segmentace. Pokud chce tým i reklamní stránku s obsahem ke skrytí, je potřeba přidat další.
- **Reklamy:** část kontejnerů může být prázdná nebo zástupná podle souhlasu s cookies; ověřit se stránkou s načtenými reklamami je úkol pro člověka.
- **Podmínky použití:** viz sekce výše (neurčeno).
- **Postup při výběru:** strukturu jsem na stránce zjišťoval jen čtením DOM (bez stahování nebo ukládání obsahu). Později se ukázalo, že podmínky se k tomu nevyjadřují, proto je stránka vyřazena.

### BBC News (EN), původně P06, vyřazeno 29. 10. 2026

- **URL:** https://www.bbc.com/news/articles/cmqxnl312v34o („Spain train crash: Audio reveals exchanges between operators and drivers“, publikováno 2026-10-29 11:07 UTC).
- **Důvod vyřazení:** BBC Global Terms of Use (verze 1.0, 15. 4. 2026) §7 zakazuje roboty, skripty a automatizovaný sběr obsahu a §8 vyžaduje povolení pro strojovou analýzu a použití při vývoji AI. Na stránce jsem před přečtením podmínek čtyřikrát spustil krátký skript pro výpis struktury; to jsem Libuši oznámil. Nic jiného než selektory a titulky se neukládalo.
- **Co zůstalo zachováno:** 9 bloků v [`anotace-vyrazene.csv`](anotace-vyrazene.csv) (ID `P06-BBC-B001`–`B009`; tělo článku a 8 souvisejících karet) a tento popis.
- **Původní struktura:** tělo článku 35× `[data-component="text-block"]`, mezi nimi 3 dvojice `advertisement-block` + `ad-slot`; celkem 6× `ad-slot` a 4× `advertisement-block`; `links-block` se 3 odkazy, 2× `video-block`, 2× `image-block`, nadpis cookie lišty. Reklamní kontejnery byly zástupné (`AdSlotDummyContainer`).
- **Použití:** měření se neprovádí. Stránka se může vrátit, pokud BBC udělí povolení.

## Nahrazené stránky (podmínky ověřeny)

Tyto stránky byly pro pilot ověřeny a anotovány, ale nevešly se do přesně 6 stránek. Nejsou vyřazené kvůli podmínkám. Anotace jsou v [`anotace-nahrazene.csv`](anotace-nahrazene.csv).

### Global Voices, statický článek (EN), dříve P01

- **URL:** https://globalvoices.org/2026/10/29/a-digital-publication-sheds-light-on-turkeys-prison-system/ (rozhovor z 29. 10. 2026, stabilní URL; licence CC BY 3.0).
- **Co testuje:** statický článek bez nadpisů uvnitř těla: celé tělo je plochý seznam odstavců v `div.entry` (42 potomků, žádné `<h2>` mezi nimi), členění určují jen otázky rozhovoru („GV: …“, „AK: …“).
- **Anotované bloky (8):** úvod (děti 2–8) a sedm bloků podle otázek rozhovoru. Locator je rozsah potomků `div.entry` podle indexu a začátku odstavce, protože prvky nemají ID. Index se může posunout, kdyby redakce článek upravila.
- **Nemají být bloky:** výzva „We need your help“ (`div.gv-super-donate-banner`), popisek titulního obrázku, odkaz „Read more“ (zahrnut do úvodu), menu, kategorie, widgety „Recent … Stories“, „Top World Stories“, „Start the conversation“, patička, 6 karet souvisejících článků (`article.gv-promo-card`).
- **Neanotováno:** karty souvisejících článků (6×) mimo tělo, sekce „Start the conversation“.
- **Důvod nahrazení:** Libuše zvolila na místo statického případu War and Peace (pozitivní S1); Global Voices zůstává kandidátem pro ZF-19.
- **Téma a tón:** úvod (`P01-B001`) je `násilí` (jistota `H`): zmiňuje mučení a porušování lidských práv ve věznicích a vězně povolané do války; téma zvolila Libuše, vedlejší téma je válka. Ostatních 7 bloků je `jiné`. Tón je ve všech blocích `ne`. V příkladovém nastavení S4 (skrýt `násilí`) se tedy skryje právě 1 blok.
