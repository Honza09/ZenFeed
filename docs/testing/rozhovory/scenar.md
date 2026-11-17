# Anonymní dotazník s uživateli (ZF-32): otázky a hypotézy

> **Stav:** sběr proběhl 13.–15. 11. 2026, odpovědi jsou v [`odpovedi.md`](odpovedi.md) a rozbor v [`zprava.md`](zprava.md). Tento dokument popisuje formulář tak, jak byl nakonec rozeslán.
> Související: [`nabor-a-souhlas.md`](nabor-a-souhlas.md) (nastavení formuláře, šíření, anonymizace), [`zapis-sablona.md`](zapis-sablona.md), [`zprava-sablona.md`](zprava-sablona.md).
> Název souboru zůstal `scenar.md`, aby fungovaly odkazy z `docs/README.md` a `docs/TESTING.md`.

## 1. K čemu dotazník slouží

Dotazník **netestuje prototyp**. Ověřuje hypotézy z rešerše (`zadani/VYZKUM-ZENFEED.md`, `docs/mvp.md` §2). Ty jsou hypotézy, ne ověřené výsledky. Test prototypu a hodnocení klasifikace jsou jinde (ZF-33, ZF-19, [`../metodika-hodnoceni.md`](../metodika-hodnoceni.md)).

| ID | Hypotéza |
|---|---|
| H1 | Někteří čtenáři webu cítí zahlcení vybranými tématy nebo se jim chtějí vyhnout (válka, politické konflikty, zprávy o úmrtí, katastrofické scénáře, násilí, vyhrocený tón). |
| H2 | Chtějí rychlý přehled stránky a běžná AI shrnutí jejich preference nezohledňují. |
| H3 | Skrývání témat a shrnutí řízené stejnými preferencemi je pro ně cennější než běžné shrnutí. |
| H4 | Poslech shrnutí hlasem: **žádný přímý důkaz potřeby**. |

Vzorek je malý, výběr se spoléhá na to, kdo se rozhodne odpovědět, a není reprezentativní.

**Odchylky od proposalu (§5).** Proposal mluví o 5–8 rozhovorech. Dotazník je písemný, nedoptává a je krátký a převážně uzavřený; na poslední konkrétní situaci se ptá jednou otázkou (Q10). Ke H3 a H4 se formulář nakonec neptal vůbec (viz část 5).

## 2. Zásady formuláře

- Krátký, převážně uzavřené otázky; otevřené jsou jen Q9 a Q10.
- Neptá se, zda se nápad líbí; na nápad (koncept) se neptá vůbec.
- Nic nenabízí, nepředvádí a nic neslibuje. Prototyp ani obrazovky neukazuje.
- Osobní příběhy nevyžaduje; Q10 se ptá jen na druh obsahu.
- Nikdo nemá psát jména, e-maily ani adresy stránek (viz nastavení v [`nabor-a-souhlas.md`](nabor-a-souhlas.md)).

## 3. Úvodní text formuláře

Skutečné znění úvodního textu je ve formuláři. Níže je navržené znění, ze kterého se vycházelo; použijte ho jako podklad, pokud formulář znovu rozesíláte nebo opakujete.

> Dobrý den,
>
> jsme čtyři studenti a v rámci školního projektu zjišťujeme, jak lidé navštěvují weby a jak konzumují obsah, který na nich najdou. Nic neprodáváme.
>
> Hledáme dospělé, kteří používají Chrome a weby čtou pravidelně, česky nebo anglicky. Vyplnění zabere asi 5 minut.
>
> Dotazník je anonymní: neptáme se na jméno ani e-mail a nemusíte se přihlašovat. Do odpovědí prosím nepište jména, zaměstnavatele ani adresy konkrétních stránek, stačí třeba „zpravodajský web“. Protože nevíme, kdo odpověděl, nejde odpověď později dohledat ani smazat.
>
> Většina otázek je nepovinná, můžete cokoli přeskočit. Žádné odpovědi nejsou správné ani špatné, zajímá nás, jak to děláte vy. Odměnu bohužel nenabízíme.
>
> Odpovědi použijeme jen v naší školní zprávě, citace bez údajů, podle kterých by vás šlo poznat. Odesláním s tím souhlasíte.
>
> Díky!

## 4. Otázky formuláře (jak byly rozeslány)

Název formuláře podle exportu: **Konzumace informací na internetu**. Otázky jsou v pořadí exportu. Sloupec „Odpovědi v exportu“ uvádí jen to, co se v odpovědích objevilo; úplná nabídka možností není v exportu vidět.

| ID | Otázka | Odpovědi v exportu | Hypotéza |
|---|---|---|---|
| Q1 | Kolik je ti let? | 18 a více | výběr |
| Q2 | Jaký webový prohlížeč nejčastěji používáš? | Google Chrome, Duck Duck Go, Mozilla, Safari | výběr |
| Q3 | Používáš webový prohlížeč pravidelně? (tj. několikrát týdně) | Ano | výběr |
| Q4 | Jak často čteš novinky? (zprávy, události atd.) | Denně / Několikrát týdně / Méně často | popis vzorku |
| Q5 | V jakých jazycích si na internetu čteš články? | Hlavně česky / Hlavně anglicky | popis vzorku |
| Q6 | Jaké druhy webů navštěvuješ nejčastěji? | Zprávy / Odborné texty / Diskuze / vlastní odpověď | popis vzorku |
| Q7 | Děláš si nějaké shrnutí článků? | Ne / Ano, sám/sama / Ano, pomocí AI | H2 |
| Q8 | Cítíš se někdy přehlcen/a množstvím informací na internetu? | Velmi často / Často / Někdy | H1 |
| Q9 | Jsou nějaká témata, která bys ze svého čtení nejradši úplně vyřadil/a? Jaká? | volný text (u některých prázdné) | H1 |
| Q10 | Vzpomeň si na poslední situaci, kdy jsi na webu narazil/a na něco, co jsi číst nechtěl/a. O jaký druh obsahu šlo? | volný text | H1 |

Otázka Q8 se ptá na přehlcení **množstvím informací**, ne přímo na přehlcení tématy (jak je v H1).

## 5. Mapování otázek na hypotézy

| Hypotéza | Otázky |
|---|---|
| H1 Zahlcení a vyhýbání se tématům | Q8, Q9, Q10 |
| H2 Rychlý přehled, běžné AI shrnutí ignoruje preference | Q7 (jen zda si shrnutí dělají; otázka na to, zda AI respektuje preference, chybí) |
| H3 Preference pro skrývání a shrnutí jsou cennější než běžné shrnutí | žádná |
| H4 Hlas | žádná |
| Popis vzorku | Q1–Q6 |

Do zprávy se vždy píše odkaz na otázku, například „R03, Q9“.

## 6. Otázky z původního plánu, které nebyly rozeslány

Původní plán (návrh z 13. 11. 2026) počítal s těmito otázkami. Ve formuláři nejsou, proto jsou v [`zprava.md`](zprava.md) hypotézy, které je potřebovaly, vedené jako „bez důkazu“.

| ID v plánu | Otázka |
|---|---|
| S3, S5–S8 | Jak často čtete zprávy; druhy webů; děláte si shrnutí; spokojenost s dnešním postupem; student/ka |
| S9 | Podílel/a jste se na projektu nebo pracujete na produktu, který shrnuje či filtruje obsah? |
| B1–B4 | Poslední nechtěný obsah; přehlcení; témata k vyřazení; jak se takovému obsahu vyhýbáte |
| C1 | Dokázal/a jste někdy zadat shrnutí, co z něj vynechat? |
| K1, K2 | Kdy by nápad pomohl a kdy ne; co by od používání odradilo (po krátkém popisu rozšíření) |
| V1 | Necháváte si text z webu přečíst nahlas? |
| Z1 | Chcete ještě něco dodat? |

Otázky B1–B3 se do formuláře dostaly ve zkrácené podobě jako Q10, Q8 a Q9. Pokud se dotazník bude opakovat, doporučuji doplnit hlavně C1 (H2), K2 (H3, odmítnutí) a otázku na spokojenost s dnešním postupem.

## 7. Rozhodnutí (Libuše, 13. 11. 2026)

| # | Téma | Rozhodnutí |
|---|---|---|
| 1 | Forma | Anonymní Google Formulář místo rozhovorů (odchylka od proposalu §5). |
| 2 | Obsah | Krátký, převážně uzavřené otázky. |
| 3 | Počet | cíl 6 odpovědí (přišlo 10) |
| 4 | Odměna | Žádná. |
| 5 | Záznam | Žádný zvuk ani obraz; formulář sbírá jen anonymní odpovědi. |
| 6 | Souhlas vedoucího nebo školy | Není potřeba. |
| 7 | Smazání odpovědí | Neslibuje se; anonymní odpověď nelze k osobě dohledat. |
