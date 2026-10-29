# Co musí ověřit člověk (ZF-04)

Co jsem udělal já: otevřel jsem 6 stránek v prohlížeči, přečetl jejich strukturu a navrhl anotace. Co nemůžu nahradit: ruční označení hodnotitelem (proposal §5), přečtení podmínek použití a rozhodnutí o definicích. Odhad času je orientační.

## Úkoly

| # | Úkol | Odhad | Proč já nestačím |
|---|---|---|---|
| 1 | **Otevři všech 6 stránek** podle [`stranky.md`](stranky.md) a ověř, že vypadají jako popsáno (počet bloků, struktura). U P03 a P04 se obsah od snapshotu změnil, ověř aspoň to, že locator podle čísla článku nebo id zprávy pořád funguje. | 30 min | viděl jsem každou stránku jednou, 29. 10. 2026 večer |
| 2 | **Podmínky použití: kontrola závěrů.** Podmínky jsem prošel (sekce „Podmínky použití a robots.txt“ ve [`stranky.md`](stranky.md)): Wikipedie povoleno; root.cz, iROZHLAS, ČT24 neurčeno; HN hraniční; lupa.cz neurčeno; **BBC zakázáno bez povolení (stránka vyřazena a nahrazena lupa.cz)**. Potvrď závěry, doplň přesné odkazy na podmínky root.cz, lupa.cz a Českého rozhlasu a rozhodni, zda je nahrazení lupa.cz v pořádku (poměr jazyků je nyní 4× CS a 2× EN, anglickou náhradu lze dohledat po kontrole podmínek). U ČT24 případně napiš České televizi. | 20–30 min | já nejsem právník a podmínky ČT jsem nenašel |
| 3 | **Projdi anotace** (`anotace.csv`, 90 řádků). Nejdřív řádky s `jistota = H` (30 z 90: P04 11, P03 9, P02 4, P05 3, P01 2, P06 1), pak namátkou ostatní. Oprav téma a tón. Hlavní hodnotitel je tím člověk, ne já. | 1–1,5 h | proposal vyžaduje ruční označení |
| 4 | **Zkontroluj seznam bloků a granularitu.** Je u P01 správně „sekce = nadpis h2 a prvky do dalšího h2“? U P06 správně „úvod + 4 sekce podle h2 + 6 karet“? U P05 jsou správně celé diskuze, ne příspěvky? | 20 min | jde o rozhodnutí o metodice |
| 5 | **Nech druhého člověka zopakovat anotaci** podle [`navod-druhy-hodnotitel.md`](navod-druhy-hodnotitel.md), nejméně u P02 a P05 (tam je nejvíc hraničních případů tónu). | 1 h pro druhého | proposal chce dva hodnotitele u finální sady |
| 6 | **Rozhodni otevřené body** níže (hlavně 1–4), nebo je přenes do ZF-24 / ZF-27 / ZF-07. | 30 min | rozhodnutí týmu |
| 7 | **Zkontroluj citlivé položky.** `P03-B010` (pohřešovaná osoba) a `P04-B014` (soud s církevním tématem) jsou citlivé zprávy. Ponechat, nebo nahradit jinými? | 5 min | je to tvé rozhodnutí o obsahu v repozitáři |
| 8 | **Cookie lišty a reklamy:** pro P03 a P06 rozhodni, zda se bude testovat s odmítnutými cookies, nebo po souhlasu. U P06 mohou být reklamní kontejnery zástupné; ověř, jak vypadají s načtenými reklamami. | 15 min | změna nastavení souhlasu je tvoje rozhodnutí |
| 9 | **Rozhodni o velikosti sady.** Požadavek „spíš stovky stránek“ se mi nevešel do ZF-04 (viz [`kandidati-pro-zf-19.md`](kandidati-pro-zf-19.md), část C). Kolik stránek a kdo je anotuje? | 15 min | kapacita týmu |
| 10 | **Přečti si diff a rozhodni o commitu.** Nic není commitnuto. Pravidla repa (`.claude/rules/git-workflow.md`): nepracovat přímo na `main`; navrhuji větev `docs/zf-04-pilot`. Po schválení zaškrtni úkoly v `docs/backlog/04-zf-04.md`, já je nezaškrtávám. | 10 min | commit a zaškrtnutí je na tobě |

## Otevřené body (potřebují lidské rozhodnutí)

1. **Kategorie (ZF-24 není zmrazeno).** Seznam je provizorní. Zejména: znamená `katastrofické scénáře` skutečné katastrofy, nebo hypotetické scénáře? Spadá pohřešovaná osoba pod `zprávy o úmrtí`? V pilotu to mění výsledek jen u hraničních bloků.
2. **Jedno téma na blok.** Blok o srážce vlaků je současně `zprávy o úmrtí` i `katastrofické scénáře`, článek o srážce vlaků v P04 může mít i politickou složku. Zvolil jsem jedno hlavní téma. Povolí ZF-24 víc témat na blok? Pak se změní odvození skrytí.
3. **Definice „správně oddělený blok“** a **bloky navíc** (viz [`sablona-mereni.md`](sablona-mereni.md)). Plán říká jen „podíl správně oddělených bloků“.
4. **Vzorek u P02** a **neanotované bloky** (P02: 335 komentářů; P04: dalších 24 zpráv po rozbalení; P01: dlaždice souvisejících článků a diskuse). Počítat extraktoru jen anotovaný vzorek, nebo doanotovat?
5. **Metodika ZF-27** není v `docs/TESTING.md`. Po zápisu porovnat šablonu a definice „vyhodnotitelného případu“ (stránka × nastavení) a poměr CS/EN. Pilot má 3× CS a 3× EN, ale poměr pro 24 stránek určí ZF-27.
6. **Nastavení S1–S3** jsou příkladová. Pro nastavení s nulou skrytých bloků (například P03 v S2, P06 v S1) jsou precision a recall nedefinované. Přidat jiná nastavení?
7. **Respektování preferencí:** podíl správných rozhodnutí (plán §5.3 A) nebo podíl případů se všemi správnými rozhodnutími (doslovný proposal §5)? Šablona umožní obojí.
8. **Rozsah:** `mvp.md` ani proposal nespecifikují velikost pilotu jinak než „6 stránek“; ZF-04 ji vyžaduje přesně.

## Co jsem nemohl ověřit

- Podmínky České televize (nenalezeny) a `robots.txt` Wikipedie a BBC (nepodařilo se načíst); závěry o podmínkách jsou moje čtení, ne právní posouzení (úkol 2).
- Chování stránek s načtenými reklamami a po souhlasu s cookies (P03, P06; úkol 8).
- Zda extraktor ZF-03 existuje a na těchto stránkách běží: `extension/content/content.js` je v repu prázdný, takže nic nebylo měřeno.
- Vývoj stránek v čase: P03 a P04 se mění každou hodinu, P06 (lupa.cz) se může upravit.
- Celé texty bloků: tón u zkrácených titulků (například karty P06-B006 a P06-B008) jsem posuzoval jen podle titulku.
- Pokud rozšíření ze ZF-03 zatím neběží, zatím nelze ověřit locatory jinak než ručně v konzoli.
