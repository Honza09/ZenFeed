# Anonymní dotazník s uživateli (ZF-32): otázky a úvodní text

> **Stav:** podklad pro vytvoření Google Formuláře. Dotazník ještě nebyl rozeslán; tento dokument neobsahuje žádné odpovědi ani zjištění. Rozhodnutí z 13. 11. 2026 jsou v části 6.
> Související: [`nabor-a-souhlas.md`](nabor-a-souhlas.md) (nastavení formuláře, šíření, anonymizace), [`zapis-sablona.md`](zapis-sablona.md), [`zprava-sablona.md`](zprava-sablona.md).
> Název souboru zůstal `scenar.md`, aby fungovaly odkazy z `docs/README.md` a `docs/TESTING.md`.

## 1. K čemu dotazník slouží

Dotazník **netestuje prototyp**. Ověřuje hypotézy z rešerše (`zadani/VYZKUM-ZENFEED.md`, `docs/mvp.md` §2). Ty jsou hypotézy, ne ověřené výsledky. Test prototypu a hodnocení klasifikace jsou jinde (ZF-33, ZF-19, [`../metodika-hodnoceni.md`](../metodika-hodnoceni.md)).

| ID | Hypotéza |
|---|---|
| H1 | Někteří čtenáři webu cítí zahlcení vybranými tématy nebo se jim chtějí vyhnout (válka, politické konflikty, zprávy o úmrtí, katastrofické scénáře, násilí, vyhrocený tón). |
| H2 | Chtějí rychlý přehled stránky a běžná AI shrnutí jejich preference nezohledňují. |
| H3 | Skrývání témat a shrnutí řízené stejnými preferencemi je pro ně cennější než běžné shrnutí. |
| H4 | Poslech shrnutí hlasem: **žádný přímý důkaz potřeby**. Ověřujeme jen jednou otevřenou otázkou na konci, nevedeme k ní. |

Vzorek je malý (6 odpovědí), výběr se spoléhá na to, kdo se rozhodne odpovědět, a není reprezentativní. Výstupem jsou anonymní zápisy, opakující se potřeby a příklady odmítnutí, ne čísla o populaci.

**Odchylka od proposalu.** Proposal (§5) mluví o 5–8 rozhovorech. Písemný dotazník nemůže doptávat a lidé u něj píšou stručněji. Tuto odchylku uvedeme v omezeních zprávy.

## 2. Zásady formuláře

- Ptáme se na **poslední konkrétní situaci** (co, kdy, kde, co jste udělal/a), ne na názory a budoucí chování.
- Neptáme se, zda se nápad líbí. Důvody odmítnutí jsou stejně cenné jako zájem.
- Nic nenabízíme, nepředvádíme a nic neslibujeme. Prototyp ani obrazovky neukazujeme. Hlas se nepřehrává, shrnutí je zatím zástupné (ZF-15) a není součástí dotazníku.
- Povinné jsou jen úvodní výběrové otázky a první tři otevřené otázky. Všechno ostatní je nepovinné; kdo chce, přeskočí.
- Témata jako úmrtí nebo násilí mohou být osobní. Ptáme se jen na druh obsahu, ne na osobní příběh, a to v textu formuláře říkáme.
- Nikdo nemá psát jména, e-maily ani adresy stránek (viz úvodní text).
- Každá otázka má v tabulce hypotézu, ke které patří. Formulář je podle odhadu na 15–20 minut.

## 3. Úvodní text formuláře

Vložte do popisu formuláře (první sekce). Název formuláře: **Jak čtete web a jak si dělat přehled**.

> **Jak čtete web a jak si děláte přehled**
>
> Jsme studentský tým z univerzity. Zkoumáme, jak lidé čtou weby a jak si dělají rychlý přehled o stránkách. Nic neprodáváme ani netestujeme na vás hotový produkt; chceme porozumět tomu, jak postupujete vy.
>
> **Pro koho:** dospělí uživatelé prohlížeče Chrome, kteří pravidelně čtou weby (zprávy, blogy, odborné texty, diskuze) česky nebo anglicky.
>
> **Jak dlouho:** 15–20 minut. Nejde o zkoušku, žádné odpovědi nejsou správné ani špatné. Kritika je pro nás užitečná.
>
> **Anonymita:** formulář nesbírá e-mail ani jméno a nevyžaduje přihlášení. Prosíme, nepište do odpovědí jména, e-maily, zaměstnavatele, bydliště ani adresy stránek, podle kterých by vás šlo poznat. Stačí napsat druh stránky (například „zpravodajský web“).
>
> **Dobrovolnost:** můžete přeskočit kteroukoli nepovinnou otázku a formulář kdykoli zavřít. Odpovědi se odešlou až po kliknutí na Odeslat. Protože formulář nesbírá žádné osobní údaje, nelze později poznat, která odpověď je vaše, a proto ji nelze dohledat ani smazat.
>
> **Co s odpověďmi:** odpovědi uchovává Google Formuláře a používáme je ve zprávě týmu a při její prezentaci; citace uvádíme bez údajů, podle kterých by vás šlo poznat. Žádnou odměnu za vyplnění nenabízíme.
>
> **Kontakt:** člen týmu, který vás oslovil.
>
> Odesláním formuláře souhlasíte s tím, že vaše anonymní odpovědi použijeme takto.

## 4. Otázky formuláře

Typ: **R** = povinná, **N** = nepovinná; „výběr“ = jedna možnost, „více“ = více možností, „text“ = delší odpověď. ID otázek v prvním sloupci se používají v zápisech a zprávě (např. „R03, F6“).

### Sekce 1: Výběrové otázky

Tyto otázky slouží k zařazení a ke kvótám (viz [`nabor-a-souhlas.md`](nabor-a-souhlas.md)). Odpověď, která vyřazuje, přesměruje na závěrečnou stránku („Děkujeme, tento formulář je pro jinou skupinu uživatelů.“).

| ID | Otázka | Typ | Odpovědi | Hypotéza |
|---|---|---|---|---|
| S1 | Je vám 18 let nebo víc? | R, výběr | Ano / Ne (Ne vyřadí) | výběr |
| S2 | Používáte Chrome pravidelně na počítači? | R, výběr | Ano / Ne (Ne vyřadí) | výběr |
| S3 | Jak často čtete weby (zprávy, blogy, odborné texty, diskuze)? | R, výběr | Denně / Několikrát týdně / Jednou týdně / Méně často (Méně často vyřadí) | výběr |
| S4 | V jakém jazyce čtete weby? | R, výběr | Hlavně česky / Hlavně anglicky / Obojí | výběr |
| S5 | Jaké druhy stránek čtete nejčastěji? | R, více | Zprávy / Blogy / Odborné texty / Diskuze / Jiné | výběr |
| S6 | Co jste za poslední tři měsíce dělal/a, abyste si udělal/a rychlý přehled o stránce nebo vybral/a, co číst? | R, více | Vlastní shrnutí / AI chat (vložený text) / Rozšíření prohlížeče / Čtečka stránek / Blokátor / Newslettery nebo RSS / Vypnuté zprávy nebo notifikace / Nic z toho | výběr |
| S7 | Jak jste spokojený/á s dnešním postupem? | R, výběr | Spíš spokojen/a / Spíš nespokojen/a / Různě | výběr |
| S8 | Jste student/ka? | R, výběr | Ano / Ne | výběr |
| S9 | Pracujete na produktu, který shrnuje nebo filtruje obsah, nebo jste se podílel/a na tomto projektu? | R, výběr | Ano (vyřadí) / Ne | výběr |

### Sekce 2: Potřeba přehledu

Úvod sekce: „Další otázky se týkají jedné **poslední** situace. Pište stručně, stačí pár vět.“

| ID | Otázka | Typ | Hypotéza |
|---|---|---|---|
| F1 | Vzpomeňte si na **poslední** situaci, kdy jste na webu potřeboval/a rychlý přehled místo čtení celé stránky. Co to bylo za druh stránky? (Bez adresy.) | R, text | H2 |
| F2 | Proč jste přehled potřeboval/a? Co se dělo těsně předtím? | R, text | H2 |
| F3 | Co jste přesně udělal/a? Popište to krok za krokem. | R, text | H2, H3 |
| F4 | Jak dlouho to zhruba trvalo a co bylo při tom nepříjemné nebo zdlouhavé? | N, text | H2 |
| F5 | Pokud jste použil/a AI nebo nástroj: co jste mu zadal/a, co jste dostal/a a co v tom chybělo nebo přebývalo? Zohlednilo to něco, co jste nechtěl/a vidět? | N, text | H2, H3 |

### Sekce 3: Nechtěný obsah

Úvod sekce: „Další otázky se týkají obsahu, který jste nechtěl/a číst. Stačí obecně, bez osobních příběhů; kdykoli můžete přeskočit.“

| ID | Otázka | Typ | Hypotéza |
|---|---|---|---|
| F6 | Vzpomeňte si na **poslední** situaci, kdy jste na webu narazil/a na něco, co jste nechtěl/a číst. O jaký druh obsahu šlo (obecně) a na jakém druhu stránky? | N, text | H1 |
| F7 | Co jste udělal/a potom? | N, text | H1 |
| F8 | Jak jste poznal/a, že to číst nechcete? Podle čeho (titulek, obrázek, tón, téma) a jak rychle? | N, text | H1 |
| F9 | Jak často se vám to stává? | N, výběr | H1 |
| F10 | Čemu se při čtení webu vědomě vyhýbáte, jestli něčemu? Jak to děláte? | N, text | H1 |

Možnosti F9: Denně / Několikrát týdně / Jednou týdně / Méně často / Skoro nikdy.

### Sekce 4: Dnešní postup

| ID | Otázka | Typ | Hypotéza |
|---|---|---|---|
| F11 | Jaký postup nebo nástroj dnes používáte pro rychlý přehled stránky? | N, text | H2 |
| F12 | Co vám na něm vyhovuje? Proč vám to stačí? | N, text | H2, H3 |
| F13 | Kdy vám to naposledy nestačilo? Co se stalo a co jste pak udělal/a? | N, text | H2, H3 |
| F14 | Jak dáváte nástroji najevo, co ve výsledku nechcete? Funguje to? | N, text | H2, H3 |

### Sekce 5: Koncept (nepovinná sekce)

Text sekce: „Nakonec krátká myšlenka. Nic nenabízíme a nic neukazujeme; zajímá nás váš pohled.

*Rozšíření pro Chrome, které na otevřené stránce skryje bloky o tématech, která nechcete číst, a vedle toho nabídne shrnutí stránky, které respektuje stejné preference. Skrytý obsah jde jedním kliknutím vrátit a nic se nepřepisuje.*“

| ID | Otázka | Typ | Hypotéza |
|---|---|---|---|
| K1 | Čím se to podle vás liší od toho, co děláte dnes? | N, text | H3 |
| K2 | Vezměte situaci, kterou jste popsal/a dříve. Co by to v ní změnilo a kde by to nepomohlo? | N, text | H3 |
| K3 | Za jakých okolností byste to nepoužil/a? Co by vás odradilo nebo znepokojovalo (třeba skrytý obsah nebo co se děje s textem stránky)? | N, text | H3 (odmítnutí) |

### Sekce 6: Poslední otázka

Jediná otázka k hlasu, úplně na konci a nesmí odkazovat na ZenFeed.

| ID | Otázka | Typ | Hypotéza |
|---|---|---|---|
| V1 | Stává se vám, že si text z webu necháte přečíst nahlas, třeba aplikací nebo asistentem? Kdy to bylo naposledy a jak to dopadlo? Pokud ne, napište „ne“ a případně proč. | N, text | H4 |
| Z1 | Je něco, na co jsme se nezeptali a mělo by to zaznít? | N, text | všechny |

Závěrečná stránka: „Děkujeme. Odpověď jsme zaznamenali.“

## 5. Sugestivní formulace, které nepoužíváme

| Nepoužívat | Neutrální přepis |
|---|---|
| Nezlobí vás, když se na webu objevují zprávy o válce? | Vzpomeňte si na poslední situaci, kdy jste narazil/a na něco, co jste nechtěl/a číst. |
| Chtěl/a byste, aby šlo takový obsah skrýt? | Co jste v takové situaci udělal/a? |
| Líbí se vám nápad shrnutí podle vašich preferencí? | Jak dnes získáváte přehled stránky a co se při tom nedaří? |
| Používal/a byste to denně? | Kdy jste naposledy změnil/a nástroj nebo postup, a co k tomu vedlo? |
| Není běžné AI shrnutí příliš obecné? | Co vám v posledním shrnutí chybělo nebo přebývalo? |
| Bylo by dobré, kdyby to četl příjemný hlas? | Stává se vám, že si text necháte přečíst nahlas? |
| Nepřipadá vám to užitečnější než váš dnešní nástroj? | Co vám na dnešním nástroji vyhovuje a co ne? |

## 6. Mapování otázek na hypotézy a rozhodnutí

| Hypotéza | Otázky |
|---|---|
| H1 Zahlcení a vyhýbání se tématům | F6–F10 |
| H2 Rychlý přehled, běžné AI shrnutí ignoruje preference | F1–F5, F11–F14 |
| H3 Preference pro skrývání a shrnutí jsou cennější než běžné shrnutí | F3, F5, F12–F14, K1–K3 |
| H4 Hlas | V1 |
| Výběr (bez hypotézy) | S1–S9 |

Do zprávy se vždy píše odkaz na otázku, například „R03, F6“.

### Rozhodnuto (Libuše, 13. 11. 2026)

| # | Téma | Rozhodnutí |
|---|---|---|
| 1 | Forma | Anonymní Google Formulář místo rozhovorů (odchylka od proposalu §5, viz část 1). |
| 2 | Počet | 6 odpovědí. |
| 3 | Odměna | Žádná. |
| 4 | Záznam | Žádný zvuk ani obraz; formulář sbírá jen anonymní odpovědi. |
| 5 | Souhlas vedoucího nebo školy | Není potřeba. |
| 6 | Smazání odpovědí | Neslibuje se; anonymní odpověď nelze k osobě dohledat. |

### Stále otevřené (návrh k potvrzení)

| # | Otázka | Doporučení |
|---|---|---|
| 1 | Kde formulář šířit | Osobní kontakty a komunity čtenářů a produktivity; ne jen jedna skupina. Viz `nabor-a-souhlas.md`. |
| 2 | Co když přijde méně než 6 kvalifikovaných odpovědí | Prodloužit sběr; ve zprávě uvést skutečný počet. |
| 3 | Doptávání | Dotazník nedoptává. Pokud tým chce, přidat jako volitelné pozvání na krátký rozhovor (do formuláře by se ale musel zadávat kontakt, což by narušilo anonymitu); doporučuji nepřidávat. |
