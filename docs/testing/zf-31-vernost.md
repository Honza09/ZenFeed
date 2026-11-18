# ZF-31: ruční průchod a věrnost shrnutí

Daniel, 17. 11. 2026. Chrome, rozšíření a backend z commitu `0ac02db`, server `127.0.0.1:8000`. Klíč Gemini byl jen v lokálním `.env`. Issue [#46](https://github.com/Honza09/ZenFeed/issues/46).

Prošel dvanáct stránek ze seznamu níže a zapsal, co se při filtru a shrnutí pokazilo. Celý text shrnutí je uložený jen u P01. U ostatních stránek je výsledek filtru, ne věta po větě. `model_version` se ze shrnutí neopisoval.

## Na co jsme přišli

1. **Jedno slovo „war“ schová celou kartu.** Na https://ourworldindata.org/latest?type=data-insight filtr válka schoval „Global CO2 emissions from fossil fuels are set to fall in 2026“ (Hannah Ritchie, Pablo Rosado, 10. 11. 2026). Karta je o emisích: 38,2 miliardy tun v roce 2026, pokles 0,4 % proti roku 2025, zdroj Global Carbon Budget (2026). Válka v Íránu je tam jedna věta o ceně ropy. Slovník má `\bwar\b` jako silné vodítko, jistota 0,8, práh skrytí 0,7.
2. **Nová analýza neschované bloky nevrátí.** Na https://globalvoices.org/2026/10/29/a-digital-publication-sheds-light-on-turkeys-prison-system/ násilí neschovalo nic, válka něco schovala a další analýza jen s násilím ty boxy nechala. `applyHiding` blok jen schová. Zpět ho dá „Zobrazit vše“.
3. **Násilí slovník skoro nepozná.** V baseline úryvků bylo 0 z 13. Hledá murder, assault, terrorist a podobně, ne prison.
4. **Shrnutí P01 vymyslelo zdroj geoBoundaries.** Zbytek té věty na stránce je: UCDP (ve shrnutí rozepsané jako Uppsala Conflict Data Program), Project Mars, interstate a intrastate conflicts, uprchlíci, mírové mise OSN, Acknowledgements, Cite this work, Endnotes a licence Creative Commons BY. Číslo 37 milionů z úvodu ve shrnutí není. Úvod byl schovaný, takže to není chyba.
5. **Štítek vynechaných témat byl prázdný.** U P01 při zapnuté válce stálo „Použité nastavení: Válka. Vynechaná témata: žádná.“ a text shrnutí byl celý o válce. Key Insights na stránce zůstaly vidět, takže model válečný text pořád dostal.
6. **Druhý jazyk shrnutí občas spadne na 503.** V logu je `summary provider error status=503` a často hned další `POST /v1/summarize` se 200. Popup řekne, že model není nastavený nebo neodpovídá a že filtrování funguje dál. Čeština jako funkce nechybí. 503 vrací Gemini.
7. **Po skrytí války na P01 se rozbije sloupec Related topics.** Odkazy se zlomí po písmenech. „Zobrazit vše“ stránku vrátí. Our World in Data má text a sloupec v mřížce a schovaný blok je `display: none`.
8. **Tón se chytá tří vykřičníků.** Tak je slovník napsaný (`!{3,}`). Sproštá slova v něm skoro nejsou.
9. **Hlas Daniel čte anglický text česky** a je špatně srozumitelný. To patří do ZF-34, tady se nepočítá.

Forum a NASA při filtru válka neschovaly nic. To sedí: vlákno je o licenci CC BY 4.0 a výpis NASA z 17. 11. 2026 je o vesmíru. Ani snímek Thunderbirds (air show 7. 11. 2026) se neschoval, slovo war v něm není.

## Stránky

| | URL | Jazyk | Filtr, který se zkoušel | Výsledek |
|---|---|---|---|---|
| 1 | https://ourworldindata.org/war-and-peace | EN | válka | Schovalo úvod. Shrnutí níže. Rozbitý pravý sloupec. |
| 2 | https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons | EN | válka | Nic. Stránka je o licenci. |
| 3 | https://www.nasa.gov/news/recently-published/ | EN | válka | Nic. Výpis z 17. 11. 2026. |
| 4 | https://ourworldindata.org/latest?type=data-insight | EN | válka | Špatně schovaná karta o emisích CO₂. |
| 5 | https://en.wikipedia.org/w/index.php?title=Talk:Russo-Ukrainian_war&oldid=1382272905 | EN | válka | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |
| 6 | https://www.horydoly.cz/jidlo-a-piti/vejce-losos-i-mleko-kultivovane-potraviny-si-razi-cestu-na-pulty-obchodu.html | CS | válka | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |
| 7 | https://globalvoices.org/2026/10/29/a-digital-publication-sheds-light-on-turkeys-prison-system/ | EN | násilí, pak válka, pak znovu násilí | Násilí nic. Válka schovala. Po návratu na násilí boxy zůstaly. |
| 8 | https://globalvoices.org/2026/11/04/tracing-the-recruitment-trap-behind-russias-war/ | EN | válka | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |
| 9 | https://cs.wikipedia.org/wiki/Globální_oteplování | CS | katastrofy | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |
| 10 | https://cs.wikipedia.org/wiki/Ruská_invaze_na_Ukrajinu | CS | válka | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |
| 11 | https://cs.wikipedia.org/wiki/Zemětřesení_v_Turecku_a_Sýrii_2023 | CS | katastrofy | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |
| 12 | https://en.wikipedia.org/w/index.php?title=Deaths_in_2026&oldid=1383725904 | EN | zprávy o úmrtí | Proklikáno. Další chyba nehlášena. Text shrnutí neuložen. |

## P01, text shrnutí

Štítek: „Použité nastavení: Válka. Vynechaná témata: žádná.“

> The page provides data and insights on armed conflict, war, and peace, including information on deaths in armed conflicts based on geographic location and source data from the Uppsala Conflict Data Program and geoBoundaries. It lists various charts and data explorers covering topics such as deaths in state-based conflicts, Project Mars wars, interstate and intrastate conflicts, refugees, internally displaced people, and United Nations peacekeeping missions. Additionally, the page includes acknowledgements of contributors, academic references, and licensing information stating that visualizations and articles are open access under the Creative Commons BY license.

Porovnáno s textem stránky staženým 17. 11. 2026.

| Tvrzení | Verdikt |
|---|---|
| Data o válce, konfliktu a míru | sedí |
| Úmrtí podle zemí | sedí jako parafráze |
| Uppsala Conflict Data Program | sedí jako rozepsání zkratky UCDP. PRIO shrnutí vynechalo |
| geoBoundaries | nesedí, na stránce není |
| Project Mars, interstate a intrastate conflicts, uprchlíci, mírové mise | sedí |
| Acknowledgements, citace a endnotes, licence CC BY | sedí |
| 37 milionů z úvodu | ve shrnutí není, úvod byl schovaný |

## Co z toho neplyne

Věrnost shrnutí větu po větě je hotová jen na P01. U stránek 5, 6 a 8 až 12 není uložený text shrnutí, jen to, že při prokliku nepřišla další stížnost. Hlas se nehodnotil.
