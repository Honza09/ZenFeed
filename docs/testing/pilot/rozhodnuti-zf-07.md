# ZF-07: Návrh rozhodnutí go/no-go a zmrazení rozsahu

**Stav:** NÁVRH. Rozhodnutí tým zatím neučinil. Doporučení níže je doporučení, ne rozhodnutí.
**Podklad:** [`vyhodnoceni-zf-07.md`](vyhodnoceni-zf-07.md) (měření extraktoru ZF-03 na 6 pilotních stránkách, 2. 11. 2026). Všechna čísla se opírají o referenční anotace, které jsou **můj nepotvrzený návrh** (nepotvrzené lidským anotátorem). Klasifikace a skrývání **nebyly měřeny**.

## 1. Co měření ukázalo (shrnutí)

- Správně odděleno 77 z 89 měřitelných bloků (86,5 %); P02 96 %, P03 100 %, P04 95 %, P06 75 %, P05 50 %, P01 16,7 %.
- Čas extrakce: medián 13,5 ms, max 44 ms na 18 bězích (skryté okno prohlížeče, jen funkce segmentace).
- Slabá místa: sekce bez vlastního obalu (P01, P05), obalový prvek přes celý článek (P01 `zf-4`, `zf-61`), 98 z 276 nalezených bloků je navíc (cookie lišta, patičky, doporučené články, bannery), dynamické načítání se neodchytí (P04 po „Show more“: 20 → 40 článků, extraktor nic nezachytí sám).
- Nenaměřeno: klasifikace, skrývání, obnovení, české zpravodajské weby, reklamy s textem.

## 2. Možnosti

### A. Pokračovat podle plánu beze změny rozsahu
- **Co to znamená:** ZF-08 a dál počítají s tím, že extraktor zvládne obecné stránky; ZF-10 skrývá vrácené `elements`.
- **Pro:** žádná ztráta rozsahu.
- **Proti:** na stránkách typu P01 a P05 extraktor sekce slučuje a štěpí, a prvek, který by ZF-10 skrýval, může být celý článek. MVP říká, že špatně určený blok se nemá skrývat a že nesprávné skrytí je horší než nepodporovaná stránka (`docs/mvp.md` §3 F2). Bez dalšího omezení by to pravidlo nebylo splněno.
- **Dopad na ZF-08 a dál:** ZF-09 (mapování ID na DOM) a ZF-10 (skrývání) by museli ošetřit obalové prvky a bloky navíc až při integraci; ZF-19 (24 stránek) by pravděpodobně odhalila totéž později.

### B. Pokračovat, ale omezit MVP na hlavní obsahové oblasti a deklarovat podporované typy stránek (doporučení)
- **Co to znamená:** MVP podporuje jen typy stránek, kde měření ukázalo dobré oddělování (výpisy s položkami, vlákna komentářů s prvkem na komentář, články s nadpisy h2 po opravě sloučení titulku), a na ostatních neskrývá, jen to uživateli řekne. Do ZF-09 přijdou tři úpravy: (1) vyřadit z `elements` obalové prvky, které obsahují víc bloků, a takový blok neskrývat; (2) vynechat zjevné bloky navíc (souhlas s cookies, patička, doporučené články mimo hlavní obsah); (3) při „Zpracování spouští uživatel“ znovu spustit extraktor po načtení dalšího obsahu.
- **Pro:** zachová rozsah proposalu (skrývání bloků + shrnutí + dabing), opírá se o změřené typy a plní pravidlo „nejistý blok se neskrývá“.
- **Proti:** menší pokrytí webů; typy stránek P01 a P05 (souvislé sekce, MediaWiki diskuse) by byly v MVP nepodporované nebo omezené; chybí měření na českých zpravodajských webech.
- **Dopad na ZF-08 a dál:** ZF-08 beze změny. ZF-09 dostane tři úpravy výše. ZF-10 skrývá jen bloky s ověřeným prvkem. ZF-11 až ZF-12 beze změny. ZF-19 pokryje i deklarované nepodporované typy (měří se, že se neskrývá). ZF-22 vypíše známá omezení.

### C. Zastavit a přehodnotit (bez pokračování na ZF-08)
- **Co to znamená:** místo skrývání bloků zvážit jiný přístup (například jen shrnutí a skrývání celé stránky), nebo jiný způsob segmentace.
- **Pro:** vyhne se stavbě na extraktoru, který je na části stránek nespolehlivý.
- **Proti:** měření k tomu nevede: na třech ze šesti stránek extraktor funguje (95–100 %), nenaměřeno jsou části, které by to rozhodly (klasifikace, české weby), a proposal skrývání bloků požaduje. Verze 0.1 s celými stránkami byla označena za nesoulad s proposalem (`docs/mvp.md`).
- **Dopad na ZF-08 a dál:** ZF-08 až ZF-13 se pozdrží; změna rozsahu musí projít úpravou proposalu.

### Doporučení (ne rozhodnutí)
Doporučuji **B**, protože měření podporuje částečnou použitelnost (67 z 69 bloků na výpisech a komentářích) a zároveň ukazuje konkrétní rizika, která se dají ošetřit v ZF-09. Doporučení platí jen při těchto výhradách: anotace nejsou potvrzené, klasifikace není změřena, pilot je 5× EN a 1× CS, české zpravodajské weby nejsou změřeny. Tým by měl před zmrazením rozsahu potvrdit anotace a rozhodnout, zda stačí 3 z 6 stránek bez úprav jako důkaz.

**Návrh volby:** varianta B, navrhla Libuše 2. 11. 2026 v konverzaci s Claude agentem. Nejde o rozhodnutí týmu.

**Rozhodnutí týmu: ____**   (A / B / C / jiné; datum: ____; kdo rozhodl: ____)

## 2a. Návrh doplnění ZF-09 pro variantu B (NÁVRH, backlog jsem neměnil)

Body by se přidaly do `docs/backlog/13-zf-09.md` až po rozhodnutí týmu. Jsou formulované jako nezaškrtnuté úkoly:

- [ ] Do `elements` nevracet obalový prvek, který obsahuje víc bloků; takový blok se neskrývá (P01 `zf-4`, `zf-61`).
- [ ] Nevracet jako bloky zjevný nesouvisející obsah: souhlas s cookies, patičku, doporučené články mimo hlavní obsah, šablony a bannery (P02 `zf-49`, P05 `zf-26`…`zf-48`).
- [ ] Opravit sloučení titulku h1 s perexem (P06-B001).
- [ ] Po uživatelem spuštěné analýze umět extraktor spustit znovu, aby zachytil obsah doplněný po načtení (P04 po „Show more“: 20 → 40 článků).
- [ ] Po úpravách zopakovat měření ze ZF-07 (`zf-07-parovani.js`, `zf-07-prepocet.py`) a porovnat s výchozím stavem 77 z 89.

## 3. Návrh zmrazení rozsahu (NÁVRH, platí až po schválení týmem)

Zmrazení má proběhnout na konci týdne 1 (ZF-07). Níže je návrh pro variantu B.

**Zůstává v MVP** (podle `docs/mvp.md` v0.2, nemění ho): preference téma × tón, skrývání bloků s vratným boxem, samostatné shrnutí, dabing shrnutí, okrajové stavy. Zpracování spouští uživatel a pracuje jen s načteným obsahem.

**Podporované typy stránek (návrh podle měření):**
1. Výpis s položkami v samostatném prvku (zpravodajský výpis, výpis článků): P03 24/24, P04 19/20.
2. Vlákno komentářů s prvkem na komentář: P02 24/25.
3. Dlouhý článek s nadpisy h2 v jednom obsahovém kontejneru, po opravě sloučení titulku s perexem: P06 6/8 (nutná oprava).

**Nepodporované nebo omezené (návrh):**
- Souvislé sekce bez vlastního obalu a vnořené obaly (P01 1/6, P05 3/6): bez skrývání, jen shrnutí.
- Obsah, který se dotahuje po načtení stránky (P04 po „Show more“): zpracuje se jen to, co je načtené při spuštění; nové je třeba spustit znovu.
- České zpravodajské portály: **nenaměřeno**, nelze je zatím prohlásit za podporované.
- Stránky s přihlášením, aplikace s nekonečným posunem a živé přenosy: nenaměřeno.

**Otevřené před zmrazením:** potvrzení anotací, výběr a potvrzení případných prahů (90 % správně oddělených a 3 s / 10 s jsou jen pracovní předpoklad plánu), doplnění pilotu o české weby, změření klasifikace (ZF-06).
