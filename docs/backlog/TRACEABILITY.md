# Pokrytí požadavků proposalu issues

Zdroj pravdy: `zadani/zenfeed-final-proposal.md`. Tabulka ukazuje, které issue pokrývá který požadavek.

| Požadavek proposalu | Issues |
|---|---|
| §4.1 #1 Preference: téma × tón, uložené, znovupoužitelné | ZF-06, ZF-11, ZF-24 |
| §4.1 #2 Skrývání bloků (výpisy, sekce, komentáře), box „Zobrazit“ | ZF-03, ZF-09, ZF-10 |
| §4.1 #3 Shrnutí: preference, vynechaná témata, CS/EN, odkaz na originál | ZF-15, ZF-30 |
| §4.1 #4 Dabing historickým hlasem, ovládání, označení syntetického hlasu | ZF-16, ZF-17, ZF-26 |
| §4.1 #5 Okrajové stavy | ZF-12, ZF-28 |
| §4.2 Žádná modifikace, vratnost, dobrovolnost, transparentnost, jen načtený obsah | ZF-10, ZF-11, ZF-12, ZF-17, ZF-29 |
| §4.3 Mimo rozsah MVP | bez vlastního issue (negativní požadavek); rozsah zmrazuje ZF-07 |
| §4.4 Architektura, kontrakty, segmentace (hlavní riziko) | ZF-02, ZF-03, ZF-05, ZF-07, ZF-08 (activeTab) |
| §4.4 AI koncepty: zero-shot klasifikace, toxicita, shrnování, strukturovaný výstup (Pydantic), syntéza řeči | ZF-06, ZF-14, ZF-15, ZF-16 |
| §4.4 Soukromí a výběr poskytovatele | ZF-25, ZF-29 |
| §5 Respektování preferencí ≥ 80 %, čas k přehledu −20 % | ZF-20, ZF-33 |
| §5 P/R/F1, dělení na bloky, vratnost 100 %, latence, compression, similarity | ZF-20 |
| §5 Faktická věrnost shrnutí | ZF-31 |
| §5 Metriky dabingu | ZF-34 |
| Jazyky CS/EN v testech (§1, §4.1 #3, §5 dabing) | ZF-19, ZF-27, ZF-31, ZF-34 |
| §5 Test: ~24 stránek, 2 hodnotitelé, ladění vs. finále | ZF-04, ZF-19, ZF-27 |
| §5 5–8 rozhovorů, 3–5 lidí na prototypu | ZF-32, ZF-33 |
| §6 Otevřená rozhodnutí (model a TTS, osobnost, provoz a náklady, kategorie, role a kapacita) | ZF-24, ZF-25, ZF-26, ZF-36 (metodika hodnocení: ZF-27) |
| §6 Rizika a jejich ověření | ZF-03, ZF-07 (HTML a rozsah), ZF-06, ZF-25 (AI služby), ZF-15, ZF-31 (zkreslení), ZF-29 (soukromí), ZF-26 (hlas), ZF-33 (konkurence) |
| §6 Potřeba: pilotní uživatelé a přístup k AI službě | ZF-32, ZF-33, ZF-25 |
| §6 Dodávka: prototyp, záznam testování, závěrečné vyhodnocení | ZF-22, ZF-23, ZF-35 |
| Průřezově (bez vlastního požadavku): repozitář a CI, UI testy, end-to-end scénář §4.1 #1–4, opravy chyb | ZF-01, ZF-13, ZF-18, ZF-21 |

Nesplnění prahů (např. ≥ 80 %) se pozná až měřením; issues zajišťují, že je co měřit.
