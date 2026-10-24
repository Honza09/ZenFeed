# ZenFeed — Project Proposal

**Semestrální projekt · Umělá inteligence · MENDELU PEF ·** 
**Tým:** Jan Kostrhun, Daniel Holub, Jakub Procházka (xproch40), Libuše Babičková

**Idea:** ZenFeed je rozšíření pro Chrome, které čtenáři webu dává dvě věci: (1) možnost **skrýt** na právě otevřené stránce bloky obsahu o tématech, která nechce číst (např. politické konflikty, válka, zprávy o úmrtí, vyhrocené či toxické texty), a (2) **samostatné shrnutí** stránky, které respektuje stejné preference a lze si ho **poslechnout** syntetickým hlasem historické osobnosti. Rozšíření **nikdy nemění samotný text stránky**: nepřepisuje titulky, neupravuje tón ani nic nedopisuje. Skrytý obsah lze jedním kliknutím znovu zobrazit.

---

# ČÁST A — PROJEKTOVÝ PITCH

## 1. Kdo má daný problém?

*Zaměřujeme se na **dospělé uživatele Chromu, kteří pravidelně čtou webové stránky (zprávy, blogy, odborné texty, diskuze) v češtině nebo angličtině a potřebují rychlý přehled, když na stránce narazí na obsah, který nechtějí číst nebo na který nemají čas.***

Uživatele vymezujeme chováním a potřebou, ne věkem, studiem ani zemí. Zvlášť relevantní jsou dvě skupiny, které se překrývají:

- **čtenáři, kteří chtějí rychlý přehled místo čtení celé stránky** a dnes si pomáhají ručním kopírováním do AI chatu,
- **čtenáři, kteří chtějí omezit emočně zatěžující témata** (politické konflikty, válka, úmrtí, katastrofické scénáře), ale nechtějí kvůli tomu přestat sledovat web.

Rychlý research proběhl (vizte sekce 3): existují lidé, kteří řeší stejný problém, a existují nástroje, které řeší jeho část.

## 2. Jaký problém zažívají?

*Když čtou nové stránky, mají tito uživatelé problém získat rychlý přehled a zároveň se vyhnout obsahu, který nechtějí číst, protože stránky jim nenabízejí žádnou kontrolu nad tím, co uvidí, a běžné AI shrnutí jejich preference nezohledňuje. To vede k tomu, že buď čtou vše (včetně toho, co jim vadí), nebo web opustí a přijdou o užitečné informace.*

Konkrétně:

1. **Pomalé a krkolomné získání přehledu.** Musí číst celý text nebo ho ručně přenášet do AI chatu a tam zadávat instrukce.
2. **Žádná kontrola nad výběrem.** Politické konflikty, katastrofické scénáře či zprávy o úmrtí jsou na stránce i ve shrnutí stejně jako vše ostatní.
3. **Vyhrocené podání.** Texty bývají psané tak, aby poutaly pozornost. Čtenář si odnáší i emoční nálož.

Současný postup uživatelů: přečíst vše, přeskakovat, vypnout zprávy, využít newslettery/RSS, nebo vložit text do AI chatu.

## 3. Jaké máme důkazy/fakta?

*Provedli jsme rešerši osmi veřejných diskuzí na Redditu, vyhledali relevantní studie a prověřili existující nástroje.*

### 3.1 Reddit — přímé výpovědi (kvalitativní, účelový výběr)

| Potřeba / bariéra | Nález | Co z něj plyne |
| --- | --- | --- |
| **Shrnutí přímo při prohlížení bez ručního kopírování** | [r/mac](https://www.reddit.com/r/mac/comments/1i8v8f0/is_there_a_way_to_summarize_web_pages_with_one/): autor kopíruje odkazy do AI chatu a hledá „more streamlined method". [r/PKMS](https://www.reddit.com/r/PKMS/comments/1ggjrcc/looking_for_ai_tools_for_summarizing_notetaking/): pravidelný čtenář hledá nástroj ke shrnování webových stránek. [r/raycastapp](https://www.reddit.com/r/raycastapp/comments/1l0ubak): frustrace z rozdílu mezi vyhledáváním a skutečným přečtením otevřené stránky. | Lidé mají dnes ruční náhradní postup a chtějí integrovanější. |
| **Kratší přehled a kontrola zahlcení** | [r/digitalminimalism](https://www.reddit.com/r/digitalminimalism/comments/1jobg4x/news_summary_resource/): chce přehled událostí ve 2–3 větách a cestu ke zdroji. [r/digitalminimalism](https://www.reddit.com/r/digitalminimalism/comments/1ikscl3/how_do_you_balance_digital_minimalism_with_the/): nechce se úplně odpojit, ale současný způsob ho zatěžuje. | Potřeba kontroly místo úplného odpojení a zachovaný přístup k originálu. |
| **Volba obsahu a důvěra ve význam** | [r/apple – Boring Report](https://www.reddit.com/r/apple/comments/13ajz6z/boring_report_a_news_app_that_uses_ai_language/): komentující žádají vlastní témata a blokování zdrojů; jiní zpochybňují, zda aplikace nemění význam textu. | Existuje poptávka po vlastní volbě témat. Zásadní je nezasahovat do významu textu, proto ZenFeed originál neupravuje. |
| **Odmítání vnucené AI** | [r/InoReader](https://www.reddit.com/r/InoReader/comments/1j4vhmp/great_more_forced_ai_trash/), [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1exgze4) | Protidůkaz: ne každý chce AI. Funkce musí spouštět uživatel a vždy být vratné. |

**Limity:** sebevýběr autorů, anglicky vedené komunity, některé komentáře propagují vlastní produkty, část nálezů se týká Safari nebo mobilu. Počet hlasů není počet zákazníků. **Pro dabing historickým hlasem nemáme žádný přímý nález potřeby.**

### 3.2 Širší kontext

- **Reuters Institute, Digital News Report 2026:** někdy či často se zprávám vyhýbá **42 % respondentů** napříč 48 trhy. Podporuje relevanci situace; není to míra konverze ani údaj o všech webech. [Zdroj](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary)
- **Robertsonová a kol., Nature Human Behaviour, 2023:** každé další negativní slovo v titulku zvýšilo míru prokliku v průměru relativně o 2,3 %. Ukazuje mechanismus, ne účinek ZenFeed. [Zdroj](https://www.nature.com/articles/s41562-023-01538-4)
- **Maynez a kol., ACL 2020:** abstraktivní shrnování může generovat obsah nevěrný vstupu, proto je v testu ruční kontrola věrnosti. [Zdroj](https://aclanthology.org/2020.acl-main.173/)
- **Chrome Web Store (22. 10. 2026):** Sider 5 000 000 uživatelů, AI Summary Helper 212, Summate 18. Kategorie má uživatele, ale počty nelze přisoudit samotnému shrnování a ukazují, že existence kategorie nezaručuje úspěch. ([Sider](https://chromewebstore.google.com/detail/sider-chat-with-all-ai-gp/difoiogjjojoaoomphldepapgpbgkhkb?hl=en-GB), [AI Summary Helper](https://chromewebstore.google.com/detail/ai-summary-helper-%E2%80%93-summa/hldbejcjaedipeegjcinmhejdndchkmb), [Summate](https://chromewebstore.google.com/detail/summate-ai-page-summarize/pmdmknkgcjkkigibpblmekjgfhnpmhfm))

| Ukazatel                                                              | Hodnota                                      | Zdroj                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Důvěra ve zpravodajství celkově                                       | 31% (–2 p. b. meziročně; světový průměr 37%) | [Reuters Institute Digital News Report 2026](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/czech-republic), [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/) |
| Důvěra ve zprávy České televize                                       | 59%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                      |
| Důvěra ve zprávy Českého rozhlasu                                     | 58%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                     |
| Lidé, kteří se zprávám někdy nebo často vyhýbají                      | 41% (+4 p. b. meziročně)                     | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                 |
| Televize jako zdroj zpráv                                             | 60%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                       |
| Sociální sítě jako zdroj zpráv                                        | 44%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                     |
| Facebook jako platforma pro sledování zpráv                           | 44%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                     |
| YouTube jako platforma pro sledování zpráv                            | 25%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                       |
| WhatsApp jako platforma pro sledování zpráv                           | 25%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                       |
| Instagram jako platforma pro sledování zpráv                          | 22%                                          | [Screen Voice](https://www.screenvoice.cz/en/short-read/nova-is-now-broadcasting-tn-live-outside-of-oneplay-and-has-added-it-to-magenta-tv/), [CERD](https://www.cerd.com/cs-cz/article/duvera-ve-zpravy-v-cesku-zustava-nizka-nejpevnejsi-pozici-maji-ceska-televize-a-cesky-rozhlas-roste-i-vliv-ai-chatbotu)                                       |
| Češi často či velmi často vystavení dezinformacím za posledních 7 dní | 29%                                          | [Social Media Survey 2025](https://europokune.eu/dok/2025/EBFl014P_SocMed/EBFL014EP_SocMed.pdf)                    |
| Češi vysoce znepokojení dezinformacemi                                | 45% – jedna z nejnižších hodnot v EU         | [Eurobarometer and Surveys Unit](https://www.europarl.europa.eu/at-your-service/files/be-heard/eurobarometer/2026/en-public-opinion-euds-spring-2026.pdf)|

### 3.3 Alternativy

[Summate](https://chromewebstore.google.com/detail/summate-ai-page-summarize/pmdmknkgcjkkigibpblmekjgfhnpmhfm) a [AI Summary Helper](https://chromewebstore.google.com/detail/ai-summary-helper-%E2%80%93-summa/hldbejcjaedipeegjcinmhejdndchkmb) shrnují stránky (preference jde vyjádřit vlastním promptem); [Sider](https://chromewebstore.google.com/detail/sider-chat-with-all-ai-gp/difoiogjjojoaoomphldepapgpbgkhkb?hl=en-GB) je široký AI asistent; Boring Report omezuje senzacechtivost ve zprávách. AI chat s ručně vloženým textem je nejsnazší náhrada; newslettery a RSS řeší výběr jinak. Samotné shrnutí stránky tedy není odlišení, naším předpokladem je přínos jednoduchého skrývání a shrnutí řízeného stejnými preferencemi.

## 4. Co vytvoříme a otestujeme?

*Vytvoříme **prototyp rozšíření pro Chrome**, abychom uživatelům pomohli získat přehled z otevřené stránky bez obsahu, který nechtějí číst, a otestovali, zda **možnost skrýt vybraná témata a poslechnout si shrnutí respektující stejné preference** přinese víc než běžné shrnutí.*

### 4.1 Funkce MVP

| # | Funkce | Popis |
| --- | --- | --- |
| 1 | **Preference uživatele** | Výběr témat ke skrytí (např. politické konflikty, válka, zprávy o úmrtí, katastrofické scénáře) a kategorie „vyhrocený / toxický tón". Preference se ukládají a jsou opakovaně použitelné. |
| 2 | **Skrývání bloků** | Rozšíření rozpozná na načtené stránce bloky obsahu (články ve výpisu, sekce, komentáře), určí jejich téma a ty, které odpovídají preferencím, **skryje** a nahradí minimalistickým boxem („Skryto: válka — Zobrazit"). Text uvnitř zůstává nedotčen a lze ho kdykoli jedním kliknutím zobrazit. |
| 3 | **Samostatné shrnutí** | Shrnutí právě načtené stránky v češtině nebo angličtině, zobrazené mimo stránku (panel rozšíření). Respektuje stejné preference a uvádí, jaká témata byla vynechána. Odkaz na originál zůstává. |
| 4 | **Dabing shrnutí** | Přehrání **shrnutí** syntetickým hlasem historické osobnosti s ovládáním spuštění a zastavení a označením, že jde o syntetický hlas. |
| 5 | **Okrajové stavy** | Málo textu, nepřístupný obsah, po výběru nezůstal relevantní obsah, chyba služby: uživatel dostane srozumitelnou zprávu. Nevymýšlíme náhradní pozitivní obsah. |

### 4.2 Pevná pravidla návrhu

- **Žádná modifikace obsahu.** Rozšíření nepřepisuje titulky ani odstavce, nemění tón originálu a nic do něj nedopisuje. Jedinou změnou na stránce je skrytí bloku (a zobrazení boxu nahrazujícího skrytý blok).
- **Vratnost.** Každé skrytí lze zrušit; volba „Zobrazit vše" vrací stránku do původního stavu.
- **Dobrovolnost.** Zpracování spouští vždy uživatel; nic se neodesílá automaticky při procházení.
- **Transparentnost.** Shrnutí je označeno použitými preferencemi. Záměrně neúplný přehled se nevydává za úplný ani nestranný. Negativní událost není automaticky toxický text, proto jde o dvě oddělené volby (téma × tón).
- **Dabing patří jen ke shrnutí,** ne k originálnímu textu stránky.
- **Jen načtený obsah.** Rozšíření pracuje s tím, co je již načteno. Nenačtené části feedu, další stránky ani obsah videa samo nezískává.

### 4.3 Mimo rozsah MVP

Přepisování nebo úprava textu stránky (včetně změny tónu a přepisu titulků), sociální sítě a zásahy do doporučených feedů, autonomní agent a automatické AI doporučování filtrů, sémantická deduplikace napříč weby, obchodní model. Jsou to kandidáti na budoucí rozšíření, pokud se ověří jádro.

### 4.4 Architektura řešení

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│ Chrome extension (Manifest V3)  │        │ Backend (Python, FastAPI)        │
│                                 │        │                                  │
│ Content script                  │ bloky  │ 1. Klasifikace témat a toxicity  │
│  • rozdělí načtenou stránku     │ textu  │    (zero-shot, LLM) po blocích   │
│    na bloky s ID                │ + pref.│ 2. Rozhodnutí o skrytí podle     │
│  • skryje bloky podle odpovědi  │ ─────▶ │    preferencí                    │
│  • vloží box „Zobrazit"         │        │ 3. Shrnutí z ponechaných bloků   │
│                                 │ ◀───── │ 4. Strukturovaný JSON (Pydantic) │
│ Popup / panel                   │ JSON + │ 5. Text-to-speech (hlas historické│
│  • preference, shrnutí, přehrávač│ audio │    osobnosti)                    │
│ (oprávnění activeTab)           │        │                                  │
└─────────────────────────────────┘        └──────────────────────────────────┘
```

- **Frontend:** přístup k aktivní kartě přes [`activeTab`](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab); content script dělí stránku na bloky a provádí pouze skrytí/zobrazení.
- **Backend:** klasifikuje každý blok (téma, vyhrocenost), vrací JSON ověřený přes Pydantic (constrained generation), například `{block_id, topic, hide: true/false}` pro každý blok a samostatně text shrnutí, použité preference, vynechané kategorie a příznaky („nedostatečný vstup", „nezůstal relevantní obsah").
- **AI koncepty:** zero-shot klasifikace témat, detekce toxicity/negativity, abstraktivní shrnování, structured outputs, syntéza řeči.
- **Soukromí:** odesílá se jen text blokovaný uživatelovým spuštěním. Před nasazením určíme poskytovatele, přenos a uchovávání dat a sdělíme je uživateli.
- **Hlavní technické riziko:** obecné dělení libovolné stránky na správné bloky. Proto ho ověříme hned na začátku na různých doménách.

## 5. Jak změříme úspěch?

*Projekt budeme považovat za slibný, pokud uživatelé dokážou **získat požadovaný přehled stránky bez nechtěného obsahu** s měřitelným zlepšením oproti obvyklému postupu.*

**Dva hlavní ukazatele (navržené cíle, ne dosažené výsledky):**

| Ukazatel | Definice | Pracovní práh |
| --- | --- | --- |
| **Respektování preferencí** | Podíl vyhodnotitelných případů (stránka × nastavení), kdy je správně skryto to, co uživatel zvolil, a zůstane vidět to, co zvolil nechat; stejně tak shrnutí vynechá vybraná témata a zachová relevantní informace. | ≥ 80 % |
| **Čas k požadovanému přehledu** | Pokles mediánu času proti obvyklému postupu (čtení bez nástroje / ruční AI chat) bez horších odpovědí o ponechaném obsahu. Nedokončené úlohy se počítají jako neúspěch. | ≥ 20 % |

**Doplňkové metriky:**

- Precision / Recall / F1 skrývání; zvlášť **neoprávněné skrytí** a **neskrytý nežádoucí blok**.
- **Úspěšnost dělení stránky na bloky** napříč doménami (správně nalezené a skrytelné bloky).
- **Vratnost:** skrytí lze vždy zrušit a stránka se vrátí do původního stavu (musí fungovat ve 100 % testovaných případů).
- **Faktická věrnost shrnutí** (ruční kontrola osob, čísel, příčin, času, míry nejistoty). Záměrné vynechání podle preference není chyba; vymyšlený nebo obrácený fakt ano.
- Compression ratio shrnutí a semantic similarity k originálu jako pomocná kontrola zkreslení.
- **Dabing:** samostatné spuštění a zastavení, srozumitelnost v češtině a angličtině, srozumitelné označení syntetického hlasu, srovnání s běžným hlasem (prohozené pořadí), dobrovolné opakované použití.
- Latence: čas od spuštění do skrytí bloků, zobrazení shrnutí a začátku audia.

**Postup testu:** 5–8 rozhovorů s uživateli Chromu (české i anglické čtení, i spokojení uživatelé současných alternativ; ptáme se na poslední konkrétní situaci, ne zda se nápad líbí) a test prototypu s 3–5 lidmi na sadě ~24 stránek (články, blogy, odborné texty, diskuze, více domén). Preferovaná oblast se u každé stránky předem ručně označí dvěma hodnotiteli. Část sady slouží k ladění, část k finálnímu hodnocení.

## 6. O co žádáme / Co požadujeme?

*Žádáme o **schválení konceptu ZenFeed jako semestrálního projektu a zpětnou vazbu k rozsahu**, abychom mohli doručit **prototyp se skrýváním bloků, shrnutím a dabingem, záznam testování a závěrečné vyhodnocení** v rámci čtyřtýdenního cyklu od schválení.*

Potřebujeme: pilotní uživatele (5–8 na rozhovory, 3–5 na test), přístup k textové a hlasové AI službě. 

**Otevřená rozhodnutí:** textový model a TTS služba, konkrétní historická osobnost (včetně podmínek použití hlasu), způsob provozu backendu a limit nákladů, rozdělení rolí, konkrétní seznam kategorií v MVP.

**Rizika a jejich ověření:**

| Riziko | Jak ověříme / zmírníme |
| --- | --- |
| Chybné skrytí nebo neskrytí bloku | Ruční označení testovacích případů, jasné názvy kategorií, vždy dostupné „Zobrazit". |
| Různorodost HTML stránek (špatné dělení na bloky) | Test na více doménách hned v 1. fázi, jednoznačné hlášení, když se bloky nepodaří určit. |
| Zkreslené shrnutí | Označení použitých preferencí, ruční kontrola věrnosti, odkaz na originál. |
| Soukromí | Spouští uživatel, žádné automatické odesílání, předem určený poskytovatel. |
| Závislost na AI službách (cena, odezva) | Technické ověření v rané fázi. |
| Nevhodný nebo právně problematický hlas | Výběr konkrétního hlasu, ověření podmínek, označení syntetického hlasu. |
| Silná konkurence | Porovnání s běžným shrnutím a skutečným náhradním postupem. |
| Přecenění rozsahu | MVP jen skrývání, shrnutí a dabing; žádné přepisování obsahu. |

### Projektový pitch — 30sekundové shrnutí

*Chceme pomoci uživatelům Chromu, kteří při čtení webu potřebují rychlý přehled a nechtějí číst vybraná témata, například politické konflikty, válku nebo zprávy o úmrtí. Naše rešerše veřejných diskuzí ukazuje, že lidé hledají shrnutí přímo v prohlížeči i větší kontrolu nad tím, co vidí. Navrhujeme otestovat rozšíření, které na stránce skryje nechtěné bloky (originální text nikdy nemění) a nabídne shrnutí, které si lze poslechnout historickým hlasem, a úspěch měřit respektováním preferencí a ušetřeným časem. Během čtyř týdnů od schválení chceme doručit prototyp a výsledky testu a potřebujeme schválení konceptu a pilotní uživatele.*

---

# ČÁST B — PRODUKTOVÝ PITCH

## 1. Kdo je náš první uživatel?

*Našimi prvními cílovými uživateli jsou **pravidelní čtenáři webu v Chromu (česky nebo anglicky), kteří už používají nebo hledají AI shrnutí, nebo si ručně omezují nežádoucí obsah**.*

Chceme rychle získat podstatné informace a sami rozhodovat, co uvidí. Zvláštní přínos očekáváme u lidí, kteří chtějí omezit emočně zatěžující témata, ale nechtějí přestat číst web. Skupinu vymezujeme potřebou a chováním, ne věkem, studiem ani zemí.

## 2. Čeho se snaží dosáhnout?

*Když čtou stránku, uživatelé chtějí **zorientovat se bez čtení celého textu a vyhnout se obsahu, který nechtějí číst**, ale **chybí jim kontrola nad výběrem a ruční kopírování do AI chatu je zdlouhavé**.*

**Současné alternativy:** ruční čtení a přeskakování, kopírování do AI chatu, newslettery a RSS, vypnutí zpráv, existující rozšíření (Summate, AI Summary Helper, Sider, Boring Report).

## 3. Proč má smysl tento problém řešit?

*Na tomto problému záleží, protože lidé výslovně hledají shrnutí webu bez kopírování do AI chatu ([r/mac](https://www.reddit.com/r/mac/comments/1i8v8f0/is_there_a_way_to_summarize_web_pages_with_one/), [r/PKMS](https://www.reddit.com/r/PKMS/comments/1ggjrcc/looking_for_ai_tools_for_summarizing_notetaking/)), chtějí několikavětý přehled místo sledování zpráv ([r/digitalminimalism](https://www.reddit.com/r/digitalminimalism/comments/1jobg4x/news_summary_resource/)) a zprávám se někdy či často vyhýbá 42 % respondentů v [Digital News Reportu 2026](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary). Dnes se uživatelé spoléhají na **ruční kopírování do AI chatu nebo obecná shrnutí**, což nepostačuje, protože **nejde snadno řídit, co se do přehledu dostane, a nelze to opakovaně použít přímo na stránce.***

## 4. Jaké je naše navrhované řešení?

*Náš produkt pomáhá **čtenářům webu** dosáhnout **rychlého přehledu bez nechtěného obsahu** pomocí **skrývání bloků podle zvolených témat a samostatného shrnutí, které si lze poslechnout historickým hlasem**.*

Uživatel otevře stránku → nastaví preference → ZenFeed skryje odpovídající bloky (box „Zobrazit" vrací originál) → uživatel si vyžádá shrnutí → přečte nebo přehraje. **Původní text se nikdy nemění**; shrnutí je samostatný výstup označený použitými preferencemi a záměrně vynechané téma nenahrazuje smyšleným pozitivním obsahem. Podrobnosti viz Část A, sekce 4.

## 5. Jaké důkazy naznačují, že to bude fungovat?

*Zjistili jsme, že existují lidé hledající shrnutí přímo v prohlížeči, kteří chtějí větší kontrolu nad obsahem, z rešerše osmi Reddit diskuzí a ze zájmu o nástroje typu Sider. Naším největším zbývajícím předpokladem je, že **volba skrývaných témat a shrnutí řízené stejnými preferencemi přinese víc než běžné shrnutí**, který otestujeme **porovnáním personalizovaného a běžného shrnutí a času k přehledu na ~24 stránkách s 3–5 uživateli**.*

## 6. Jak oslovíme a udržíme své uživatele?

Své první uživatele oslovíme prostřednictvím **osobních kontaktů a čtenářských a produktivitních komunit**.

Nábor nebude omezen na studenty ani české uživatele. Pilot je bezplatný; obchodní model a ochotu platit teprve ověříme.

## 7. Co chceme dále ověřit?

*Během následujícího měsíce budeme testovat, **zda skrývání témat a shrnutí podle preferencí přináší víc než běžné shrnutí**, s **5–8 uživateli v rozhovorech a 3–5 uživateli v testu prototypu na různých webech v obou jazycích**. Hledáme **pilotní uživatele, zpětnou vazbu a přístup k AI službě**, abychom zjistili, zda **uživatelé dosáhnou přehledu rychleji a v souladu se svými preferencemi**.*

U dabingu měříme ovladatelnost, srozumitelnost a dobrovolné opakované použití. Pokud běžné shrnutí postačí, upravíme hodnotovou nabídku; pokud se nepotvrdí zájem o historický hlas, bude to poznatek pro rozhodnutí o této funkci.

### Produktový pitch — 30sekundové shrnutí

*Pro čtenáře webu v Chromu, kteří se potýkají s tím, že nechtějí číst vybraná témata a přesto potřebují rychlý přehled, ZenFeed pomáhá získat přehled prostřednictvím skrývání nežádoucích bloků a shrnutí, které si lze poslechnout historickým hlasem. Originální text přitom nikdy nemění. Věříme, že na tom záleží, protože lidé shrnutí v prohlížeči i kontrolu nad obsahem aktivně hledají. Otestujeme, zda personalizace přináší víc než běžné shrnutí.*

