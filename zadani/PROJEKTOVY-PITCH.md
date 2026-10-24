# ZenFeed — PROJEKTOVÝ PITCH

**Semestrální projekt · koncept ke schválení · 22. 10. 2026**  
**Tým:** Jan Kostrhun, Daniel Holub, Jakub Procházka (xproch40), Libuše Babičková.

### 1. Kdo má daný problém?

Uživatelé Chromu, kteří při čtení různých webových stránek potřebují rychlý přehled a chtějí ovlivnit, které informace se do něj zahrnou. Zahrnujeme čtenáře zpráv, blogů, odborných textů a diskuzí v češtině i angličtině. První testy zaměříme na lidi s konkrétní zkušeností s informačním zahlcením nebo ručním používáním AI shrnutí.

### 2. Jaký problém zažívají?

Pro získání stručného přehledu musí číst celou stránku nebo přenášet text do jiného nástroje. Obecné shrnutí navíc může zahrnout témata, která si nepřejí číst, například politické konflikty, katastrofické scénáře či zprávy o úmrtí. Potřebují tedy nejen kratší text, ale kontrolu nad jeho výběrem a způsobem podání.

Zamýšlený průchod je: **otevřít stránku → nastavit preference → vytvořit samostatné shrnutí → přečíst nebo přehrát**. Původní obsah stránky zůstává zachován.

### 3. Jaké máme důkazy/fakta?

Veřejná rešerše zachytila přímé požadavky na [shrnutí webu bez kopírování do AI chatu](https://www.reddit.com/r/mac/comments/1i8v8f0/is_there_a_way_to_summarize_web_pages_with_one/) a na [zpracování pravidelně čtených webových stránek](https://www.reddit.com/r/PKMS/comments/1ggjrcc/looking_for_ai_tools_for_summarizing_notetaking/). Jiné diskuze dokládají potřebu omezit zahlcení, ale i výhrady k vnucené AI a zkreslení významu.

[Sider má v Chrome Web Store uvedeno 5 milionů uživatelů](https://chromewebstore.google.com/detail/sider-chat-with-all-ai-gp/difoiogjjojoaoomphldepapgpbgkhkb?hl=en-GB), což podporuje existenci uživatelů AI nástrojů v prohlížeči. Není to měření poptávky po ZenFeed. **Projekt je ve fázi schvalování konceptu; vlastní uživatelské testy ještě neproběhly.** [Výzkumná příloha](VYZKUM-ZENFEED.md) rozlišuje doloženou potřebu od hypotéz.

### 4. Co vytvoříme a otestujeme?

Vytvoříme prototyp rozšíření Chrome, které získá text právě načtené HTML stránky a vytvoří shrnutí podle uživatelských preferencí. MVP zahrne nastavení vynechávaných témat a omezení toxického či vyhroceného podání, české a anglické texty, samostatné zobrazení výsledku a jeho přehrání syntetickým hlasem známé historické osobnosti. Konkrétní hlas vybereme při technickém ověření.

Zpracování bude obecné pro různé domény, bez omezení na jediný portál. Vyhodnotíme jej na článcích, blozích, odborných textech a diskuzích. Rozšíření pracuje s již načteným textem; další stránky, nenačtené části feedu nebo obsah videa samo nezískává. Pokud vhodný text nezíská, sdělí to uživateli.

Technické řešení počítá s extrakcí textu v rozšíření, předáním textu a preferencí AI službě a následným převodem shrnutí na řeč. Přístup k aktivní stránce lze řešit pomocí [oprávnění activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab). Konkrétní modely a provozní řešení zvolíme po ověření kvality, ceny a podmínek použití.

| Fáze navrženého čtyřtýdenního cyklu po schválení | Výstup |
| --- | --- |
| 1. Ověření potřeby a proveditelnosti | 5–8 rozhovorů, ukázky stránek v obou jazycích, ověření extrakce a vhodného hlasu. |
| 2. Návrh a základ prototypu | Nastavení preferencí, obecná extrakce textu a první personalizovaná shrnutí. |
| 3. Integrace a test | Propojení s dabingem, test s 3–5 uživateli na více doménách. |
| 4. Vyhodnocení a obhajoba | Opravy, výsledky testu, ukázka a doporučení dalšího postupu. |

Jde o návrh postupu, nikoli potvrzená kalendářní data. Pro tuto etapu žádáme o schválení konceptu. Automatické přepisování stránek, zásahy do feedů, autonomní agent a deduplikace mezi weby nejsou součástí MVP.

### 5. Jak změříme úspěch?

Navrhujeme dva hlavní ukazatele: **respektování preferencí** a **čas potřebný k získání požadovaného přehledu**. V testu porovnáme běžné a personalizované shrnutí; účastníci určí, zda výsledek odpovídá jejich nastavení. Pracovní hranicí je správné zpracování alespoň 80 % předem označených případů a alespoň 20% zkrácení mediánu času proti obvyklému postupu bez horšího porozumění ponechanému obsahu.

Faktickou věrnost ověří ruční kontrola. Záměrné vynechání podle preference oddělíme od chybného zkreslení. U audia ověříme samostatné přehrání a zastavení, srozumitelnost v obou jazycích a opakované použití. Prahy jsou navržená kritéria, nikoli dosažené výsledky. [Testovací protokol a rizika](VYZKUM-ZENFEED.md#6-plan-overeni-a-rozhodovaci-kriteria).

### 6. O co žádáme / Co požadujeme?

Žádáme o **schválení konceptu ZenFeed jako semestrálního projektu** a zpětnou vazbu k navrženému rozsahu a ověření uživatelské potřeby. Po schválení chceme v navrženém cyklu doručit prototyp s personalizovaným shrnutím a dabingem, záznam testování a závěrečné vyhodnocení. Potřebujeme pilotní uživatele a dostupnou textovou a hlasovou AI službu; rozpočet, poskytovatelé a rozdělení rolí budou upřesněny před implementací.

Hlavními riziky jsou nepřesné shrnutí, nesprávné vynechání obsahu, různorodost HTML stránek a dostupnost vhodného hlasu. Ověříme je nejprve na malé sadě příkladů, ještě před rozšířením prototypu.

### Projektový pitch — 30sekundové shrnutí

Žádáme o schválení ZenFeed, rozšíření pro Chrome, které z načtené stránky vytvoří samostatné shrnutí podle preferencí uživatele a nabídne jeho poslech historickým hlasem. Koncept počítá s různými weby v češtině i angličtině. Veřejné diskuze potvrzují potřebu shrnutí v prohlížeči a kontroly obsahu. Prototypem ověříme respektování preferencí, rychlost orientace a věrnost informací.
