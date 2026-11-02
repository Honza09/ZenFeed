# Co musí ověřit člověk (ZF-04)

Co jsem udělala já: otevřela jsem 6 stránek v prohlížeči (po přepracování sady 2. 11. 2026), přečetla jejich strukturu a navrhla anotace. Co nemůžu nahradit: ruční označení hodnotitelem (proposal §5), přečtení podmínek použití a rozhodnutí o definicích. Odhad času je orientační.

## Úkoly

| # | Úkol | Odhad | Proč já nestačím |
|---|---|---|---|
| 1 | **Otevři všech 6 stránek** podle [`stranky.md`](stranky.md) a ověř, že vypadají jako popsáno (počet bloků, struktura). U P03 (NASA, živý výpis) ověř aspoň to, že locator podle prefixu odkazu pořád funguje; u P04 (OWID Data Insights) klepni na „Show more“ a ověř, že přibude 20 položek. | 30 min | viděla jsem každou stránku jednou (P05 29. 10., ostatní 2. 11. 2026) |
| 2 | **Podmínky použití: kontrola závěrů.** Postup a odkazy jsou ve [`stranky.md`](stranky.md). Nové zdroje: NASA, Our World in Data, Horydoly a Wikipedie **povoleno** (Global Voices je také povoleno, ale mimo pilot); EA Forum **povoleno s výhradou** (nečetla jsem §7 obecných podmínek a licence CC BY 4.0 se podle příspěvku ve výchozím stavu nevztahuje na obsah před 1. 12. 2022, takže část komentářů ve vláknu jí nemusí podléhat). Vyřazeno: root.cz, iROZHLAS, ČT24, lupa.cz (neurčeno), Hacker News a BBC (zakázáno). Potvrď závěry, případně si přečti §7 EA Forum a rozhodni, zda stačí „školní nekomerční projekt“ jako důvod u zdrojů, kde podmínky o strojovém čtení mlčí (NASA, OWID). U vyřazených webů lze napsat provozovateli. | 20–30 min | nejsem právnička |
| 3 | **Projdi anotace** (`anotace.csv`, 90 řádků). Nejdřív řádky s `jistota = H` (13 z 90: P04 4, P05 3, P03 3, P01 2, P02 1), pak namátkou ostatní. Oprav téma a tón. Rozhodující je lidská kontrola, ne moje anotace. | 1–1,5 h | proposal vyžaduje ruční označení |
| 4 | **Zkontroluj seznam bloků a granularitu.** Je u P01 (OWID War and Peace) správně 6 sekcí? U P06 (Horydoly) správně „perex + 7 sekcí podle h2“? U P04 (OWID Data Insights) správně jedna položka = jeden blok? U P05 jsou správně celé diskuze, ne příspěvky? | 20 min | jde o rozhodnutí o metodice |
| 5 | **Rozhodni otevřené body** níže (hlavně 1–4), nebo je přenes do ZF-24 / ZF-27 / ZF-07. | 30 min | rozhodnutí týmu |
| 6 | **Citlivé položky.** Žádná konkrétní citlivá zpráva (pohřešovaná osoba, soud) v nové sadě není. P01 je o válce a P04 obsahuje statistiky o úmrtnosti (HIV/AIDS, dětská úmrtnost); ponechat? | 5 min | je to tvé rozhodnutí o obsahu v repozitáři |
| 7 | **Cookie lišty a reklamy:** pro P06 (Horydoly, cookie souhlas Funding Choices) rozhodni, zda se bude testovat s odmítnutými cookies, nebo po souhlasu. Reklamní kontejnery mohou být zástupné; ověř, jak vypadají s načtenými reklamami. | 15 min | změna nastavení souhlasu je tvoje rozhodnutí |
| 8 | **Rozhodni o velikosti sady.** Požadavek „spíš stovky stránek“ se mi nevešel do ZF-04 (viz [`kandidati-pro-zf-19.md`](kandidati-pro-zf-19.md), část C). Kolik stránek a kdo je anotuje? | 15 min | kapacita týmu |
| 9 | **Přečti si diff a rozhodni o commitu.** Nic není commitnuto. Pravidla repa (`.claude/rules/git-workflow.md`): nepracovat přímo na `main`; navrhuji větev `docs/zf-04-pilot`. Po schválení zaškrtni úkoly v `docs/backlog/04-zf-04.md`, já je nezaškrtávám. | 10 min | commit a zaškrtnutí je na tobě |

## Otevřené body (potřebují lidské rozhodnutí)

1. **Kategorie (ZF-24 není zmrazeno).** Seznam je provizorní; téma `násilí` přibylo 2. 11. 2026 (použito jen v nahrazeném Global Voices) a patří k rozhodnutí ZF-24. Zejména: znamená `katastrofické scénáře` skutečné katastrofy, nebo hypotetické scénáře? Spadá zánik družice (P03-B004) pod `katastrofické scénáře`? V pilotu to mění výsledek jen u hraničních bloků.
2. **Jedno téma na blok.** Zvolila jsem jedno hlavní téma. U P04 (OWID Data Insights): spadá úmrtnost na HIV/AIDS a dětská úmrtnost (statistické texty) pod `zprávy o úmrtí`? Povolí ZF-24 víc témat na blok? Pak se změní odvození skrytí.
3. **Definice „správně oddělený blok“** a **bloky navíc** (viz [`sablona-mereni.md`](sablona-mereni.md)). Plán říká jen „podíl správně oddělených bloků“.
4. **Neanotované bloky:** P01 (jednotlivé grafy a odstavce uvnitř bloků), P03 (stránkování nahrazuje karty bez změny URL, další stránky výpisu nejsou anotovány), P04 (dalších 20 položek po „Show more“). Počítat extraktoru jen anotovaný výběr, nebo doanotovat?
5. **Metodika ZF-27** není v `docs/TESTING.md`. Po zápisu porovnat šablonu a definice „vyhodnotitelného případu“ (stránka × nastavení). **Jazyk:** pilot má 1× CS a 5× EN (původní sada 3× CS, 3× EN); poměr pro 24 stránek určí ZF-27, pro pilot ale zvaž, zda nevyměnit jednu anglickou stránku za českou s ověřenou licencí (například `cs.wikipedia.org`).
6. **Nastavení S1–S4** jsou příkladová (S4 = `násilí` přidala Libuše). Tři stránky ze šesti (P02, P03, P06) nemají v žádném nastavení co skrývat, takže precision a recall jsou definované jen u P01, P04 a P05. S4 (`násilí`) nemá v pilotu žádný pozitivní blok. Přidat jiná nastavení, nebo vyměnit některý článek za zdroj s násilným obsahem (například Global Voices, viz `anotace-nahrazene.csv`)?
7. **Respektování preferencí:** podíl správných rozhodnutí (plán §5.3 A) nebo podíl případů se všemi správnými rozhodnutími (doslovný proposal §5)? Šablona umožní obojí.
8. **Rozsah:** `mvp.md` ani proposal nespecifikují velikost pilotu jinak než „6 stránek“; ZF-04 ji vyžaduje přesně.
9. **Vyřazené zdroje:** chceme je případně vrátit po písemném povolení (root.cz, lupa.cz, ČT24, iROZHLAS), nebo je nechat jen jako historii?

## Co jsem nemohla ověřit

- `robots.txt` nových stránek a Wikipedie (nepodařilo se načíst); §7 „Restrictions“ obecných podmínek EA Forum; přesné datum jednotlivých komentářů u EA Forum. Závěry o podmínkách jsou moje čtení, ne právní posouzení (úkol 2).
- Zda NASA a Our World in Data dovolují strojové čtení stránek: podmínky o něm mlčí.
- Chování stránek s načtenými reklamami a po souhlasu s cookies (P06; úkol 8).
- Zda extraktor ZF-03 existuje a na těchto stránkách běží: `extension/content/content.js` je v repu prázdný, takže nic nebylo měřeno.
- Vývoj stránek v čase: P03 (NASA) se mění po hodinách, P04 (Data Insights) se mění, přibývají nové položky, P06 se může upravit.
- Pokud rozšíření ze ZF-03 zatím neběží, zatím nelze ověřit locatory jinak než ručně v konzoli.
