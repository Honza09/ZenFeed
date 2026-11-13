# Nábor, nastavení formuláře a anonymizace (ZF-32)

> **Stav:** rozhodnutí z 13. 11. 2026 zapracována: anonymní Google Formulář, 6 odpovědí, žádná odměna, žádný záznam, žádný souhlas vedoucího a žádný slib smazání. Odpovědi zatím nejsou. Do repozitáře se nikdy nezapisují jména ani kontakty.
> Související: [`scenar.md`](scenar.md) (otázky a úvodní text formuláře), [`zapis-sablona.md`](zapis-sablona.md), [`zprava-sablona.md`](zprava-sablona.md). Název souboru zůstal kvůli odkazům.

## 1. Koho hledáme

Dospělí uživatelé Chromu, kteří pravidelně čtou web v češtině nebo angličtině, na různých druzích stránek. Vymezení je podle chování, ne podle věku ani studia (`docs/mvp.md` §2). Hledáme i **spokojené uživatele současných alternativ** (ruční shrnování, AI chat, rozšíření, čtečka stránek, blokátory, newslettery, RSS). Nábor neomezujeme na studenty.

Vzorek je malý a výběr se spoléhá na dobrovolné odpovědi, takže nebude reprezentativní; to uvedeme ve zprávě.

## 2. Nastavení Google Formuláře (aby byl anonymní)

Nastavte před rozesláním a po každé změně ověřte v náhledu:

| Nastavení | Hodnota |
|---|---|
| Shromažďovat e-mailové adresy | **Vypnuto** |
| Omezit na 1 odpověď | **Vypnuto** (vyžaduje přihlášení a rozbilo by anonymitu) |
| Povolit jen uživatele z organizace | **Vypnuto** (škola by viděla identitu) |
| Otázky s nahráním souboru | **Nepoužívat** (vyžadují přihlášení) |
| Zobrazit odkaz na odeslání další odpovědi | podle potřeby |
| Úvodní text a otázky | z [`scenar.md`](scenar.md), část 3 a 4 |
| Otázky S1, S2, S3, S9 | podmíněné přesměrování na závěrečnou stránku při vyřazující odpovědi |

Odpovědi se uloží v tabulce, kterou vlastní autor formuláře. Tabulku nesdílejte veřejně a do repozitáře ji nedávejte. Do repozitáře jdou jen anonymní zápisy podle části 5.

Prohlédněte nastavení z účtu, kterým formulář vytváříte. Pokud formulář vytváříte ze školního účtu, ověřte, že se v něm nezobrazuje otázka „Přihlášený uživatel“ ani žádný automatický sběr identity.

## 3. Kvóty

Cílem je 6 odpovědí, které splňují výběr. Jde o orientační kvóty; protože je formulář anonymní, vyhodnocují se až ze sloupců S4–S8 v tabulce odpovědí. Pokud se nenaplní, ve zprávě to uvedeme.

| Znak | Kvóta | Otázka |
|---|---|---|
| Jazyk čtení | Aspoň 2 odpovědi „hlavně česky“ a aspoň 2 pravidelně anglicky (anglicky a obojí se počítá). | S4 |
| Druhy stránek | Aspoň 2 lidé čtou diskuze, aspoň 2 odborné texty, aspoň 2 zprávy. | S5 |
| Spokojení uživatelé alternativ | Aspoň 1–2. | S6 a S7 |
| Studenti | Nejvýše asi polovina (nejvýš 3 ze 6). | S8 |
| Zdroj | Ne všichni z jedné komunity ani z okruhu jednoho člena týmu. | při šíření |

Odpovědi s vyřazující odpovědí (S1, S2, S3, S9) se nepočítají. Pokud přijde odpověď po naplnění kvóty, může se použít jako šestá až osmá, ale nesmí vytlačit kvótu, která se ještě nenaplnila. Do zpráv se uvádí vždy skutečný počet.

## 4. Kde formulář šířit a pozvánka

Osobní kontakty a komunity čtenářů a produktivity. Neposílejte lidem, které znáte jako členy projektu. Text přizpůsobte kanálu; odkaz doplníte při odeslání.

> Dobrý den,
>
> jsme studentský tým z univerzity a zkoumáme, jak lidé čtou web a jak si dělají přehled o stránkách. Hledáme dospělé uživatele Chromu, kteří čtou weby pravidelně v češtině nebo angličtině.
>
> Nabízíme anonymní dotazník (15–20 minut). Neptáme se na to, zda se vám něco líbí, ale na to, jak jste postupoval/a při konkrétní situaci, kterou jste nedávno zažil/a. Nic neprodáváme ani netestujeme na vás hotový produkt. Formulář nesbírá e-mail ani jméno a odpovědi jsou dobrovolné.
>
> Odkaz: [doplnit při odeslání]
>
> Děkujeme.

## 5. Odpovědi se kopírují do zápisu

Pro každou kvalifikovanou odpověď vznikne soubor `docs/testing/rozhovory/zapisy/R01.md` až `R06.md` podle [`zapis-sablona.md`](zapis-sablona.md). Číslo R se přiděluje v pořadí, v jakém odpovědi z tabulky přepisujete.

**Co se kopíruje:** odpovědi na S4–S8 a na F, K, V a Z. Časové razítko formuláře se **nekopíruje** (podle něj by šlo odpověď spojit s konkrétní osobou).

**Před kopírováním přečtěte každou volnou odpověď.** Lidé občas napíšou jméno, zaměstnavatele, přesné místo nebo adresu stránky i přes prosbu. Takový údaj nahraďte obecným popisem nebo `[vynecháno]`; do repozitáře nepatří ani dočasně.

| Co | Jak místo toho |
|---|---|
| Jméno, přezdívka, uživatelské jméno, e-mail, telefon | Vynechat. |
| Zaměstnavatel, škola, konkrétní pracoviště | Obecná role („zaměstnaná osoba“, „student“). |
| Přesný věk, datum narození | Vynechat (věk se v dotazníku nezjišťuje). |
| Bydliště, konkrétní místo | Vynechat. |
| Adresy stránek, podle kterých lze poznat osobu (osobní blog, vlastní komentář, uživatelský účet) | Obecný druh stránky („zpravodajský web“, „diskuzní fórum“). |
| Osobní nebo citlivé příběhy (zdraví, ztráta blízkého, náboženství, politické postoje) | Nezapisovat; stačí „osobní důvod“. |
| Jména třetích osob | Vynechat. |

Citace: nejvýš jedna až dvě věty, označené uvozovkami a ID otázky (např. „R03, F6“). Identifikující část nahradit `[vynecháno]`.

**Kontrola před commitem:** druhý člen týmu zápisy přečte a vyhledá v nich e-mailové adresy, adresy stránek a jména.

## 6. Smazání a odvolání

Odpovědi se neslibují jako smazatelné: formulář nesbírá žádný údaj, podle kterého by šlo odpověď spojit s osobou. Úvodní text to respondentovi říká předem. Tabulku odpovědí v Google lze smazat celou (například po skončení projektu); to je rozhodnutí týmu, ne slib respondentům.
