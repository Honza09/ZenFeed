# Rozšíření příkladů mimo pilot (návrh, 4. 11. 2026)

> **Návrh ke kontrole člověkem.** Doplňuje příklady pro vzácná témata z ZF-24. Nejsou součástí 6 pilotních stránek ani měřené sady ZF-07; mohou jít do ZF-19. Anotace navrhl Claude; hraniční bloky R01 až R08 prošla Libuše 4. 11. 2026, šest z nich změnila (R01-B003, R04-B007, R04-B008 → zprávy o úmrtí; R04-B016 → jiné; R04-B017, R04-B011 → násilí) a R08-B009 označila jako jistý; ostatní potvrdila. Podmínky jsem četl stejným postupem jako ve [`stranky.md`](stranky.md); není to právní posouzení.

## Použitelné zdroje

| ID | Stránka | Podmínky | Bloků | Poznámka |
|---|---|---|---:|---|
| R01 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_November_1 (denní stránka, po skončení dne se téměř nemění) | **povoleno** (Wikimedia Terms of Use, CC BY-SA; stejný závěr jako u P05) | 15 | výpis krátkých zpráv po sekcích; stejná doména jako P05 |
| R02 | https://globalvoices.org/2026/11/04/tracing-the-recruitment-trap-behind-russias-war/ | **povoleno** (CC BY 3.0; text „Policy on AI“ se týká přispěvatelů, ne čtenářů) | 7 | článek o náboru do ruské armády, sekce podle h3 |
| R03 | https://globalvoices.org/2026/11/03/egypts-crackdown-on-independent-media-reaches-mada-masr-as-editor-faces-trial/ | **povoleno** (viz R02) | 3 | tlak státu na média |
| R04 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_24 | **povoleno** (Wikimedia) | 19 | den s čistými příklady `násilí` a nehod s oběťmi (`zprávy o úmrtí`) |
| R09 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_9 (revize 1380392089) | **povoleno** (Wikimedia) | 19 | den s hurikánem, zemětřesením a nehodou; doplňuje `katastrofické scénáře` |
| R10 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_20 (revize 1383412239) | **povoleno** (Wikimedia) | 17 | záplavy, chemická havárie, epidemie |
| R11 | https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_22 (revize 1382446552) | **povoleno** (Wikimedia) | 19 | bouře, zemětřesení v Tibetu |
| R12 | výběr položek z denních stránek Portal:Current events (2., 7., 12., 14., 15., 19., 23., 27., 28., 29., 30. října 2026; revize ve sloupci `locator`) | **povoleno** (Wikimedia) | 14 | **není stránka**, ale výběr: varování a předpovědi (cyklon, evakuace) a přírodní události; 10 `katastrofické scénáře`, 3 `zprávy o úmrtí`, 1 jiné |
| R05 | https://en.wikipedia.org/wiki/Deaths_in_2026 (oldid 1383725904), sekce November → 3 | **povoleno** (Wikimedia) | 9 | čisté `zprávy o úmrtí`; jména se neukládají |
| R06 | https://en.wikipedia.org/w/index.php?title=Wikipedia:Arbitration/Requests/Enforcement&oldid=1383726700 | **povoleno** (Wikimedia) | 6 | vzorek komentářů; **tón**: 3 hraniční `toxický/vyhrocený`, 3 neutrální |
| R07 | https://en.wikipedia.org/w/index.php?title=Wikipedia:Administrators%%27_noticeboard&oldid=1383724090 | **povoleno** (Wikimedia) | 2 | vzorek komentářů; 1 hraniční `toxický/vyhrocený` |
| R08 | výběr komentářů z různých diskusních stránek Wikipedie (každý blok má vlastní trvalý odkaz `oldid`, viz sloupec `locator`) | **povoleno** (Wikimedia) | 13 | **není stránka**, ale vzorek komentářů pro test tónu: 10 jasných (R08-B009 po rozhodnutí Libuše 4. 11. 2026, R08-B010 po porovnání s nezávislým agentem) a 0 hraničních `toxický/vyhrocený`, 3 neutrální; nehodí se k měření segmentace |

Struktura: R01 jsem zjistila čtením DOM v prohlížeči (`div.current-events-content`), R02 a R03 `div.entry` s odstavci a podnadpisy h3 (blok = úvod nebo sekce od h3 po další h3). Texty se neukládají, jen krátké identifikační úryvky.

## Nepoužito (zatím)

| Zdroj | Důvod |
|---|---|
| UN News | autorská stránka OSN uvádí „All rights reserved“; zpravodajský materiál lze použít s uvedením zdroje a upozorněním OSN. Plná Terms of Use jsem nečetla, o automatizaci nic nevím → **neurčeno** |
| abclinuxu.cz (diskuze) | podmínky přečtené; o botech a strojové analýze mlčí → **neurčeno** (stejné pravidlo jako u root.cz); neověřeno, zda jsou tam vyhrocené příspěvky |
| Lemmy (lemmy.world) | [podmínky](https://legal.lemmy.world/tos/) jsem přečetla: sekce o botech se týká jen botích účtů, o čtení, sběru a licenci obsahu uživatelů mlčí → **neurčeno**. Možný zdroj tónu, rozhodnutí na týmu |
| Stack Exchange | nástroj stránku s podmínkami zablokoval, nepřečteno |
| české bulvární weby | podmínky jsem nenašla |

## Tón

Moderované diskuze Wikipedie (talk stránky kontroverzních hesel, noticeboardy) jasné urážky téměř neobsahují: z nich jsou jen hraniční bloky R06 a R07. **Jasné příklady** jsem našla vyhledáváním na talk stránkách Wikipedie (`list=search` přes API, dotazy typu „you moron“), kde zůstaly starší komentáře od anonymních editorů. Vybral jsem z nich 10 komentářů (jeden jsem původně označil jako neutrální, nezávislý agent ho správně označil za urážku) a 3 neutrální kontroly do vzorku **R08**. Jména a IP adresy se neukládají, jen krátké úryvky. Vzorek je vhodný pro test klasifikace tónu, ne pro test segmentace.

Další možnost je Lemmy nebo abclinuxu.cz, obojí s podmínkami „neurčeno“. Zařazení by rozhodla Libuše; zatím je nepoužíváme, protože Wikipedie stačila.
