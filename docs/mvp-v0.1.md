# ZenFeed — definice produktu a MVP

- **Verze:** 0.1
- **Stav:** Návrh k diskusi a schválení
- **Datum:** 27. 10. 2026
- **Platforma:** Google Chrome, Manifest V3
- **Tým:** 4 členové
- **Termín:** 4 týdny od zahájení práce
- **Účel:** Vymezit realistický rozsah první verze před zahájením implementace.

> Tento dokument je pracovní návrh. Není schváleným závazným zadáním. Rozsah je záměrně omezen tak, aby tým čtyř lidí mohl cílit na dokončení do jednoho měsíce.

## 1. Shrnutí produktu

ZenFeed je rozšíření pro Google Chrome, které pomáhá informačně zahlceným uživatelům rychle porozumět článkům, omezit obsah, který nechtějí číst, a poslechnout si stručné shrnutí.

MVP kombinuje tři funkce:

1. **AI shrnutí** článku na vyžádání.
2. **Filtrace celých stránek** podle tématu nebo stylu psaní, například vulgarit či senzacechtivých formulací. Pokud uživatel daný filtr zapne, ZenFeed může skrýt celý článek na aktuální stránce a zobrazí oznámení s důvodem a možností obsah znovu zobrazit.
3. **Hlasový přednes** shrnutí pomocí dostupného systémového hlasu.

Shrnutí bude propojeno se zdrojem prostřednictvím vizuálních karet s náhledovým obrázkem, textovým úryvkem a odkazem na původní článek.

## 2. Cílový uživatel a problém

### Cílová skupina

Lidé, kteří pravidelně čtou zprávy, články a blogy, ale mají omezený čas nebo pozornost a chtějí mít větší kontrolu nad obsahem, který konzumují.

### Problém

Uživatel musí věnovat čas orientaci v článku, rozhodovat se, zda je pro něj relevantní, a hledat hlavní informace. Některé články navíc obsahují témata nebo styl psaní, kterým se chce vyhnout.

### Hypotézy k ověření

- Shrnutí pomůže rychleji pochopit hlavní sdělení.
- Filtrace celých stránek bude srozumitelnější a spolehlivější než skrývání jednotlivých odstavců.
- Karty zdrojů zvýší dohledatelnost informací ve shrnutí.
- Hlasový přednes bude pro část uživatelů užitečný.

Tyto body jsou hypotézy, nikoli ověřené výsledky.

## 3. Rozsah MVP

### Must-have

**M1. Chrome rozšíření a panel**
- Otevření panelu ZenFeed na aktuální kartě.
- Název a URL článku.
- Jasné stavy načítání, úspěchu a chyby.

**M2. Extrakce článku**
- Získání hlavního textu z podporovaných běžných textových stránek.
- Pokud se článek nepodaří rozpoznat, zobrazit srozumitelnou chybu.
- Nepodporovat v MVP univerzálně PDF, video, sociální sítě ani všechny dynamické weby.

**M3. AI shrnutí**
- Spuštění výhradně na vyžádání uživatele.
- Výchozí délka přibližně 100–150 slov, pokud délka zdroje dovoluje.
- Při selhání zobrazit chybu a umožnit opakování.

**M4. Vizuální karty zdrojů**
Každý důležitý bod shrnutí má být podle možností propojen s relevantní pasáží původního textu. Karta zdroje obsahuje:
- název článku;
- náhledový obrázek, pokud je dostupný;
- ověřitelný textový úryvek;
- odkaz na původní stránku.

Obrázek je orientační prvek, nikoli důkaz původu informace. Textový úryvek se nesmí vydávat za přesnou citaci, pokud ho nelze ověřit proti původnímu textu. Přesné zvýraznění pasáže přímo na stránce není podmínkou MVP.

**M5. Filtrace celých stránek**
- Klasifikace tématu a vybraných charakteristik stylu článku jako celku.
- Oddělené preference pro témata a styl.
- Příklady témat: politika, hazard, technologie.
- Příklady stylu: vulgární jazyk, senzacechtivé nebo přehnaně dramatické formulace.
- Žádné skrývání jednotlivých odstavců ani jiných částí stránky v MVP.

**M6. Vratné skrývání**
- Uživatel si může zapnout nebo vypnout automatické skrývání celých stránek podle nastavených filtrů.
- Pokud je filtr aktivní a článek odpovídá vybrané kategorii s dostatečnou jistotou, ZenFeed skryje obsah článku jako celek a zobrazí náhradní oznámení.
- Oznámení uvede důvod, například „Skryto podle tématu: hazard“ nebo „Skryto podle stylu: senzacechtivé formulace“.
- Uživatel může kliknutím článek znovu zobrazit.
- Pokud je klasifikace nejistá, obsah se automaticky neskryje; lze zobrazit pouze upozornění.

**M7. Hlasový přednes**
- Spuštění a zastavení čtení shrnutí.
- Preferovat nativní TTS dostupný v prohlížeči nebo operačním systému.
- Pokud hlas nebo jazyk není dostupný, shrnutí zůstává čitelné.

**M8. Preference**
- Lokální ukládání nastavení.
- Výchozí stav skrývání vypnutý.
- Možnost používat shrnutí bez nastavování filtrů.

**M9. Ochrana soukromí**
- Článek se odešle externí AI službě až po výslovné akci uživatele, s jasnou informací o zpracování.
- API klíče zůstávají na backendu.
- V MVP se nebuduje účet, synchronizace ani trvalá historie článků.

### Should-have — pouze pokud zůstane čas

- Volba délky shrnutí.
- Více možností hlasu.
- Pokročilejší vysvětlení klasifikace.
- Historie shrnutí.
- Přesné zvýraznění zdrojové pasáže na stránce.
- Podpora dalších kategorií filtrů nad rámec základního seznamu.

### Mimo rozsah MVP

- Skrývání jednotlivých odstavců nebo libovolných bloků.
- Vlastní feed a doporučování článků.
- Automatické procházení webu na pozadí.
- Automatické shrnování každé otevřené stránky.
- Účty a synchronizace mezi zařízeními.
- Vlastní AI model nebo trénování modelu.
- Externí generování hlasu.
- Vlastní generování obrázků či screenshotů stránek.
- Plná podpora PDF, videí, sociálních sítí a všech webových struktur.
- Automatické posuzování pravdivosti článků.

## 4. Základní uživatelský scénář

1. Uživatel otevře podporovaný článek v Chrome.
2. Klikne na ikonu ZenFeed.
3. Rozšíření rozpozná název a hlavní text článku.
4. ZenFeed vyhodnotí téma a styl podle nastavených preferencí.
5. Pokud je zapnuté skrývání a článek odpovídá filtru s dostatečnou jistotou, zobrazí se oznámení o skrytí a možnost článek obnovit.
6. Uživatel může spustit vytvoření shrnutí.
7. ZenFeed zobrazí shrnutí a vizuální karty zdrojů s obrázkem, ověřitelným úryvkem a odkazem.
8. Uživatel si shrnutí přečte nebo spustí hlasový přednes.

## 5. Základní UX

### Panel ZenFeed

Doporučené pořadí:
1. Název článku.
2. Tematické štítky a případné upozornění na styl.
3. Tlačítko „Vytvořit shrnutí“.
4. Shrnutí.
5. Karty zdrojů.
6. Ovládání hlasového přednesu.
7. Odkaz na nastavení.

### Skrytá stránka

Náhradní obrazovka může zobrazit například:

> Tato stránka byla skryta podle vašich preferencí.
>
> Důvod: senzacechtivý styl.
>
> **[Zobrazit stránku]**

Skrytí musí být vratné. Nejde o mazání stránky ani o zásah do jejího obsahu na serveru. Pokud rozšíření nedokáže bezpečně určit rozsah článku, nemá stránku automaticky skrýt.

### Nastavení

- Témata, která uživatel chce omezit.
- Charakteristiky stylu, které chce omezit.
- Přepínač skrývání celých stránek.
- Volitelná upozornění bez skrývání.

Ve výchozím stavu je skrývání vypnuté. Uživatel může nejprve pouze sledovat štítky a teprve potom zapnout automatické skrývání.

## 6. Technický návrh

### Architektura

**Chrome Extension**
- Manifest V3, vanilla HTML/CSS/JS.
- Extrakce hlavního textu.
- Panel a karty zdrojů.
- Lokální preference.
- Vratné skrývání celého článku.
- Nativní TTS.

**Backend**
- Python, FastAPI a Pydantic.
- Validace vstupu a výstupu.
- Volání externí AI služby.
- Omezení velikosti požadavků a frekvence volání.
- Ověření, že vrácené zdrojové úryvky existují ve vstupním textu.

**Externí AI**
- Shrnutí článku.
- Klasifikace tématu a stylu článku jako celku.
- Přiřazení bodů shrnutí k relevantním úryvkům.

### Zásady implementace

- AI klasifikace se nesmí považovat za neomylnou.
- Nejasný výsledek nesmí vést k automatickému skrytí.
- Text článku je nedůvěryhodný vstup a nesmí přebít instrukce aplikace.
- Rozšíření musí používat minimální potřebná oprávnění.
- Preference se ukládají lokálně pomocí Chrome Storage API.
- Nezavádět databázi ani účty, pokud pro MVP nejsou nezbytné.
- Nezpracovávat články na pozadí bez akce uživatele.

### Náklady a limity

- Sumarizace a klasifikace na vyžádání.
- Maximální velikost článku.
- Rozumné omezení opakovaných požadavků.
- Sledování ceny a latence.
- Rozpočtový strop pro testovací období.
- Porovnání kandidátních AI modelů na stejné testovací sadě.

Konkrétní poskytovatel AI a rozpočet jsou stále otevřená rozhodnutí.

## 7. Čtyřtýdenní plán

Cílem je mít na konci čtvrtého týdne funkční MVP k předvedení. Proto se neplánují žádné funkce nad rámec must-have, dokud nebude hotový kompletní hlavní scénář.

### Týden 1 — Rozhodnutí a technický základ
- Uzavřít seznam podporovaných typů stránek a kategorií.
- Zprovoznit minimální rozšíření a FastAPI endpoint.
- Ověřit extrakci hlavního textu na několika reálných webech.
- Porovnat 2 kandidátní AI modely na stejné sadě článků.
- Ověřit dostupnost systémového TTS.
- Dohodnout datový kontrakt mezi rozšířením a backendem.

**Výstup:** Technický prototyp, který získá text článku a vrátí základní shrnutí.

### Týden 2 — Sumarizace a zdroje
- Dokončit hlavní scénář shrnutí.
- Přidat karty zdrojů.
- Ověřit vrácené úryvky proti původnímu textu.
- Přidat základní chybové stavy.
- Zprovoznit první end-to-end integraci.

**Výstup:** Uživatel získá shrnutí a může otevřít jeho zdrojové karty.

### Týden 3 — Filtrace, preference a hlas
- Implementovat klasifikaci celého článku.
- Přidat nastavení témat a stylu.
- Implementovat vratné skrývání celých stránek.
- Přidat nativní TTS.
- Uložit preference lokálně.
- Ošetřit nejistou klasifikaci a nepodporované stránky.

**Výstup:** Kompletní hlavní scénář napříč všemi třemi funkcemi.

### Týden 4 — Integrace, testování a opravy
- Otestovat alespoň 20 článků pro sumarizaci a zdroje.
- Otestovat 30–50 označených článků pro filtry.
- Provést krátké uživatelské testy, ideálně s 5–8 lidmi.
- Opravit kritické chyby.
- Ověřit cenu, latenci, ochranu soukromí a obnovu skrytého obsahu.
- Připravit předvedení a známá omezení.

**Výstup:** Stabilní MVP s dokumentovanými omezeními.

### Rozdělení práce pro tým čtyř lidí

**Člen 1 — Rozšíření a extrakce**
- Manifest V3, panel, extrakce hlavního textu, integrace API.

**Člen 2 — Backend a AI**
- FastAPI, datové modely, sumarizace, klasifikace, validace zdrojových úryvků.

**Člen 3 — Filtrace a UX**
- Preference, štítky, skrývání celých stránek, obnova a vysvětlení důvodu.

**Člen 4 — TTS, testy a kvalita**
- Hlasový přednes, testovací sada, měření kvality a latence, uživatelské testy.

Všichni členové průběžně integrují práci. Do konce prvního týdne má existovat jeden společný prototyp; integrace se nesmí odkládat až na konec.

## 8. Akceptační kritéria

Cíle jsou pracovní a po prvním týdnu se mohou upravit podle výsledků prototypu.

### Sumarizace a zdroje
- Na podporovaných stránkách lze vytvořit shrnutí.
- Karty zdrojů zobrazují název, úryvek a odkaz; obrázek se zobrazí, pokud je dostupný.
- Každý úryvek prezentovaný jako přesný je ověřen proti původnímu textu.
- V testovací sadě se neobjeví žádná smyšlená přesná citace.
- Nejméně 80 % testovaných shrnutí je hodnotiteli označeno za užitečné.

### Filtrace
- Uživatel může nastavit témata i stylové charakteristiky.
- Skrývá se pouze celá stránka, nikoli jednotlivé odstavce.
- Každá skrytá stránka zobrazuje důvod a možnost obnovení.
- Nejistá klasifikace nezpůsobí automatické skrytí.
- Ve zkušební sadě je dosažena alespoň 80% shoda klasifikace s lidským posouzením; výsledky se vyhodnotí zvlášť pro témata a styl.

### Hlas
- Uživatel může přednes spustit a zastavit.
- Pokud hlas není dostupný, text zůstane čitelný a aplikace zobrazí srozumitelnou zprávu.

### Spolehlivost
- Nepodporované stránky a chyby API mají srozumitelný stav.
- Neúspěšný požadavek nezpůsobí ztrátu obsahu.
- Všechny skryté stránky lze v testovacích scénářích obnovit.
- Cena a latence se změří na testovací sadě před schválením finálního modelu.

## 9. Rizika a jejich omezení

**Nesprávná klasifikace:** Omezit počet kategorií, testovat na ručně označených článcích a při nejistotě neskrývat.

**Nespolehlivá extrakce:** Podporovat pouze ověřené typy stránek a nepředstírat univerzální kompatibilitu.

**Nepodložené shrnutí:** Vyžadovat zdrojové pasáže, ověřovat úryvky a testovat výstupy.

**Poškození nebo ztráta obsahu:** Skrývání musí být vratné; při nejistotě, zda je možné stránku bezpečně obnovit, ji automaticky neskrývat.

**Překročení termínu:** Zmrazit rozsah po prvním týdnu, vynechat všechny funkce „Should-have“ a soustředit se na kompletní hlavní scénář.

**Náklady AI:** Nastavit limity, měřit náklady a nepoužívat externí AI pro hlas v první verzi.

## 10. Otevřená rozhodnutí před zahájením

1. Které konkrétní weby nebo typy článků budou v MVP podporovány?
2. Které kategorie témat a stylu budou v první verzi? Doporučení: začít s malým seznamem, který lze otestovat.
3. Kterého AI poskytovatele zvolíme a jaký bude rozpočtový limit?
4. Na kterých operačních systémech musí fungovat hlasový přednes?
5. Jaké datum přesně znamená „za měsíc“ a kolik času mohou jednotliví členové týmu věnovat projektu?

## 11. Rozhodnutí o rozsahu

Pro dodržení čtyřtýdenního termínu se doporučuje schválit tyto mantinely:

- Pouze Chrome a omezená skupina běžných textových stránek.
- Skrývání výhradně celých stránek.
- Malý, předem definovaný seznam témat a stylových charakteristik.
- Shrnutí na vyžádání.
- Vizuální karty zdrojů s ověřitelným úryvkem, odkazem a volitelným obrázkem.
- Nativní TTS.
- Žádné účty, synchronizace, historie ani vlastní generování obrázků.
- Žádné nové funkce po konci druhého týdne, pokud ohrožují stabilitu hlavního scénáře.

## Závěr

ZenFeed MVP má umožnit uživateli rychle pochopit článek, ověřit původ důležitých informací, skrýt celé stránky podle vlastních preferencí a poslechnout si shrnutí.

**Cílem je dokončit tuto omezenou verzi do čtyř týdnů.** Pro dosažení termínu je zásadní nepřidávat skrývání jednotlivých odstavců ani další funkce, které nejsou nezbytné pro hlavní scénář.

**Stav dokumentu: návrh k diskusi a schválení.**
