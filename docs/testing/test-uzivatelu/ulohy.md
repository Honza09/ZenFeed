# Scénář moderátora a úlohy (ZF-33, ZF-34)

Text pro moderátora. Kurzívou jsou pokyny pro moderátora, ostatní se čte účastníkovi. Postup a pořadí variant jsou v [`README.md`](README.md). Celé je to návrh k odsouhlasení týmem.

## 1. Úvod a souhlas (ústně, nic se nepodepisuje)

> Děkujeme, že jste přišli. Jsme studentský tým a zkoušíme prototyp rozšíření pro Chrome. **Netestujeme vás, ale prototyp.** Když něco nepůjde, je to chyba prototypu, ne vaše.
>
> Dostanete tři krátké úlohy na třech webových stránkách. U každé si uděláte přehled o stránce a pak mi odpovíte na čtyři otázky. Měřím čas, ale nespěchejte víc než obvykle, chceme vidět běžné čtení. Každá úloha má limit 10 minut.
>
> Nic nenahráváme, nefotíme obrazovku ani nezapisujeme vaše jméno. Zapisuju jen čas, jestli odpovědi sedí a krátké poznámky pod kódem, třeba U02. Výsledky použijeme jen v semestrálním projektu. Kdykoli můžete skončit bez udání důvodu. Souhlasíte?

*Pokračovat jen po jasném „ano“. Do záznamu se souhlas nepíše, protože bez něj záznam nevznikne.*

> Na stránkách může být obsah, který čtete neradi, například zprávy o válce nebo násilí. Když vám bude cokoli nepříjemné, řekněte a úlohu přeskočíme.

## 2. Ukázka (jen před první úlohou s variantou A, asi 3 minuty)

*Na cvičné stránce, která není T1–T3, ukaž: ikonu ZenFeed, přepínače témat, Analyzovat, box „Skryto“ s tlačítkem Zobrazit, Zobrazit vše a Shrnout. Hlas zatím ne. Ukázka se do času nepočítá.*

## 3. Úlohy

*Pro každou úlohu podle tabulky pořadí v README. Před pokynem připrav stránku v nové kartě, ale ještě ji neukazuj. Téma „nechtěného obsahu“ pro stránku je pevně dané předem.*

### Pokyn (stejný pro všechny varianty, mění se jen věta o způsobu)

> Představte si, že nechcete číst o tématu **[nechtěné téma stránky]**. Udělejte si přehled o této stránce tak, abyste mi pak dokázali říct, o čem je, dvě hlavní informace a hlavní závěr. Až budete mít přehled, řekněte „mám přehled“.

Doplň podle varianty:
- **A (ZenFeed):** „Použijte rozšíření ZenFeed: zapněte téma, které nechcete číst, a pak můžete použít i shrnutí.“
- **B (bez nástroje):** „Čtěte stránku tak, jak jste zvyklí, bez dalších nástrojů.“
- **C (AI chat):** „Zkopírujte text stránky do tohoto AI chatu a požádejte ho o shrnutí. Klidně mu napište, co číst nechcete.“

*Start stopek: po dočtení pokynu, když ukážeš stránku. Stop: „mám přehled“. Pak se ptej (otázky se do času nepočítají):*

1. O čem stránka hlavně je?
2. Jaká je první hlavní informace?
3. Jaká je druhá hlavní informace?
4. Jaký je hlavní závěr nebo co z toho plyne?
5. Narazili jste při tom na téma **[nechtěné téma]**? (ne / viděl jsem nadpis nebo zmínku / četl jsem to)

*Odpovědi 1–4 hodnoť podle klíče stránky: 1 = sedí, 0 = nesedí nebo chybí. Částečná odpověď je 0 a do poznámky napiš proč. Nenapovídej a neopravuj. Po 10 minutách řekni „Děkuji, tady skončíme“ a úlohu zapiš jako nedokončenou (`dokonceno = ne`, odpovědi se přesto zapíšou).*

### Zápis

Jeden řádek na úlohu v kopii [`zaznam-uloh.csv`](zaznam-uloh.csv):

| Sloupec | Hodnota |
|---|---|
| `ucastnik` | U01–U05 |
| `poradi` | 1–3, kolikátá úloha v sezení |
| `varianta` | A, B nebo C |
| `stranka` | T1, T2 nebo T3 |
| `jazyk` | cs nebo en (jazyk stránky) |
| `cas_s` | sekundy od startu po „mám přehled“; u nedokončené úlohy prázdné |
| `dokonceno` | ano / ne |
| `tema`, `info1`, `info2`, `zaver` | 1 nebo 0 |
| `nechteny_obsah` | ne / zminka / cetl |
| `poznamka` | krátce, bez jmen a citací ze stránky |

## 4. Dabing (ZF-34), po třetí úloze

*Na stránce, kde měl účastník variantu A. Shrnutí už je v panelu. Ověř, že je jazyk shrnutí stejný jako jazyk stránky. Pokud čas dovolí, zopakuj to i na stránce v druhém jazyce (shrnutí v panelu přepneš na druhý jazyk a necháš vytvořit znovu).*

> Shrnutí, které jste viděli, si můžete také poslechnout. Zkuste ho přehrát a v půlce zastavit. Čtení skončí, když panel rozšíření zavřete.

*Nenapovídej, kde je tlačítko. Zapiš, zda spustil a zastavil sám (ano / s nápovědou / ne).*

Po poslechu:

1. Jak dobře jste rozuměli? (1 = vůbec, 5 = úplně)
2. Řekněte jednu věc, kterou hlas říkal. *(zapiš 1, pokud odpovídá shrnutí, jinak 0)*
3. Byl to hlas člověka, nebo počítače? Podle čeho to poznáte? *(zapiš, zda zmínil označení „syntetický hlas“ v panelu: ano / ne)*
4. Chtěli byste si takhle poslechnout i shrnutí další stránky? *(ano / ne / nevím. Pokud ano, nabídni to a zapiš, zda to opravdu spustil. To je „dobrovolné opakované použití“.)*

**Srovnání s běžným hlasem** zatím neprovádět, dokud tým nerozhodne ZF-26 (viz [`README.md`](README.md), část 8). Až bude rozhodnuto: oba hlasy se přehrají na stejném shrnutí, pořadí se mezi účastníky prohazuje a ptá se „Který hlas byl srozumitelnější? Který byste používali?“

Zápis: jeden řádek na jazyk v kopii [`zaznam-dabingu.csv`](zaznam-dabingu.csv). Hodnoty sloupců:

| Sloupec | Hodnota |
|---|---|
| `spustil_a_zastavil` | ano / napoveda / ne |
| `srozumitelnost_1_5` | 1–5 |
| `zapamatoval_si` | 1 nebo 0 (otázka 2) |
| `zminil_oznaceni` | ano / ne (otázka 3) |
| `chce_znovu` | ano / ne / nevim |
| `spustil_znovu` | ano / ne |

## 5. Závěr (asi 3 minuty)

1. Co vám na ZenFeed nejvíc pomohlo, nebo vadilo?
2. Bylo vám jasné, co se na stránce skrylo a proč?
3. Použili byste ho i doma? Na jakých stránkách?

*Odpovědi zapiš krátce do poznámky posledního řádku účastníka, bez jmen a bez údajů, podle kterých by šel poznat.*

> Děkujeme, to je vše.
