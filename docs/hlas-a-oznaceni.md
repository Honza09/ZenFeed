# Hlas historické osobnosti a označení „syntetický hlas“ (ZF-26)

> **NÁVRH, nerozhodnuto.** Podklad pro rozhodnutí týmu (vede Daniel). Není to právní poradenství. Právní a poskytovatelské výroky mají zdroj a datum čtení, jinak jsou označené „neověřeno“. Dokument nevybírá TTS službu (to je ZF-25) a nerozhoduje o soukromí (ZF-29). Stav k 4. 11. 2026. **Návrh Libuše z 4. 11. 2026** (čeština: Švejk, angličtina: Sherlock Holmes, záloha C) je zapsaný v části 8; tým ho zatím nepotvrdil.

## 1. Zadání a požadavky

- Proposal §4.1 #4 a `docs/mvp.md` F4: přehrání **shrnutí** (ne textu stránky) syntetickým hlasem historické osobnosti, jasné označení syntetického hlasu. Konkrétní osobnost se použije jen při ověřených podmínkách, jinak obecný hlas historicky stylizovaný. Pro dabing nemáme přímý důkaz poptávky (proposal, rešerše), ověřuje se v ZF-34.
- **Požadavek týmu (4. 11. 2026, Libuše):** jeden hlas pro české texty a druhý hlas pro anglické texty. Hlas se volí automaticky podle jazyka shrnutí, uživatel nevybírá. *Pozor:* `docs/mvp.md` řadí „více hlasů“ mimo rozsah („nad rámec proposalu“). Zde jde o jeden hlas na jazyk, ne o výběr uživatele; tým by to měl výslovně potvrdit (body k rozhodnutí R3).
- Osobnost ovlivňuje jen hlas. Text shrnutí se nepřepisuje jejím jménem a nikdy se nevkládají smyšlená prohlášení do úst skutečné osoby. Žádná žijící osoba.

## 2. Možnosti

Každá možnost se rozdělí na dvě verze, českou a anglickou (jeden hlas na jazyk).

| | A. Pojmenovaná osobnost, hlas ji napodobuje (klon nebo ladění na nahrávkách) | B. Osobnost jen jako téma, obecný syntetický hlas | C. Obecný historicky stylizovaný hlas bez skutečné osoby | D. Smyšlený nebo anonymní vypravěč („Kronikář“) |
|---|---|---|---|---|
| Slib produktu (§4.1 #4) | splňuje doslova | splňuje volněji (osobnost je jen jméno) | splňuje „historický“ styl, ne osobnost | totéž jako C, s jménem vypravěče |
| ZF-16 (TTS, profil) | klon nebo vlastní hlas na dvě osoby (cs a en), závislost na poskytovateli | obecný hlas na jazyk, osobnost jen v metadatech a štítku | dva stock hlasy (cs, en) | dva stock hlasy + název vypravěče |
| ZF-17 (štítek) | nutný nejvýraznější štítek, hrozí klam | štítek musí vyloučit dojem, že mluví osoba | stačí základní štítek | základní štítek |
| ZF-25 (služba, data) | omezuje volbu na služby s klonováním | bez omezení | bez omezení | bez omezení |
| ZF-34 (měření) | srovnání s běžným hlasem je složitější (zdroj nahrávek) | stejné jako C | nejjednodušší | stejné jako C |
| Právní a etické riziko | **nejvyšší**: nahrávky, osobnostní práva, podmínky poskytovatelů | střední: dojem, že mluví osoba | nízké | nízké |
| Před použitím ověřit | všechny podmínky z části 3 | podmínky štítku a jména osoby | dostupnost cs a en hlasu a stylizace | jako C |
| Záložní řešení | C | C | **sám je záložní řešení** | C |

### Možnost E: existující postava (návrh Libuše)

Postava vystupuje jen jako **styl hlasu a jméno ve štítku**, ne jako napodobenina herce a text shrnutí se nepřepisuje jejím jménem. Sedí k variantě D (smyšlený vypravěč), jen se jménem, které čtenář zná. Proposal říká „historická osobnost“, literární postava je mírný posun; tým to musí odsouhlasit.

| Postava | Jazyk | Autorská práva k postavě | Co zůstává chráněné | Riziko |
|---|---|---|---|---|
| **Švejk** (Jaroslav Hašek, zemřel 3. 1. 1923) | cs | 70 let po smrti autora (část 3, řádek vi): ochrana skončila nejpozději koncem roku 1993 (výpočet) | ilustrace Josefa Lady (zemřel 14. 12. 1957, chráněné do 31. 12. 2027), herecké výkony ve filmech a rozhlase, moderní překlady a pokračování | nízké–střední |
| **Sherlock Holmes** (Arthur Conan Doyle, zemřel 7. 7. 1930) | en | v ČR volné od 1. 1. 2001 (výpočet z pravidla 70 let po smrti); v USA po soudu z roku 2013 a po vypršení práv k posledním povídkám koncem roku 2023 | pozdější adaptace, herecké výkony, ochranné známky dědictví Conan Doyle (řádek vii) | nízké–střední |
| *Mickey Mouse (negativní příklad)* | – | v USA volný jen Mickey ze *Steamboat Willie* (1928), mluvící verze a ochranná známka zůstávají u Disney | vše mimo němého Mickeyho | **vysoké, nedoporučuje se** |

Aby byla E použitelná, musí platit: hlas je **vlastní** stock hlas služby (cs a en), nenapodobuje konkrétního herce, nepoužívají se ilustrace ani zvukové ukázky z adaptací, a štítek říká, že jde o syntetický hlas ve stylu postavy, ne o hlas skutečné osoby.

## 3. Tabulka ověření

Stav: **ověřeno** = přečteno na uvedené adrese; **částečně** = zdroj je sekundární, nebo jsem viděl jen část; **neověřeno** = nečteno.

| # | Podmínka | Stav | Zjištění a zdroj (čteno 4. 11. 2026) |
|---|---|---|---|
| i-a | Podmínky TTS poskytovatele k imitaci skutečných osob a klonování | částečně | **Azure AI Speech:** kodex chování v. 4.0 (1. 5. 2026) zakazuje napodobit osobu bez výslovného souhlasu a zakazuje simulovat hlas politiků i se souhlasem ([zdroj](https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/tts-code-of-conduct)). **ElevenLabs:** zásady aktualizované 9. 10. 2026 jsem viděl jen v nadpisech, obsah pravidel jsem nepřečetl; nápověda odkazuje jen na podmínky a zásady a uvádí, že audio lze vystopovat k uživateli ([zásady](https://elevenlabs.io/use-policy), [nápověda](https://elevenlabs.io/docs/help-center/product/voices/voice-cloning/are-there-any-restrictions-on-what-voices-i-can-upload-for-voice-cloning)). **OpenAI:** vlastní hlasy vznikají ze souhlasné nahrávky mluvčího ([průvodce](https://developers.openai.com/api/docs/guides/text-to-speech)). **Google Cloud TTS:** seznam hlasů nic o souhlasu neuvádí ([seznam](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)). |
| i-b | Komerční vs. nekomerční užití u poskytovatelů | neověřeno | Podmínky použití zdarma, školní projekt a limity jsem nečetl. |
| i-c | Dostupnost hlasu v češtině a angličtině | částečně | **Google:** čeština `cs-CZ` má řadu hlasů Chirp3-HD, jeden Standard a jeden WaveNet; Neural2 a Studio pro češtinu ne ([seznam](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)). **OpenAI:** čeština je podporovaná, vestavěné hlasy jsou optimalizované pro angličtinu; modely `tts-1`, `tts-1-hd` a `gpt-4o-mini-tts` mají skončit 6. 1. 2027 ([průvodce](https://developers.openai.com/api/docs/guides/text-to-speech)). Azure a ElevenLabs: neověřeno. Kvalitu hlasů neposuzuji. |
| ii | Povinnost označit nebo mít souhlas | ověřeno (u 2 poskytovatelů) | **OpenAI:** vývojář musí uživatelům jasně sdělit, že hlas je generovaný AI. **Azure:** aplikace musí uvést syntetickou povahu hlasu, aby uživatel nevěřil, že mluví skutečná osoba (zdroje výše). Google a ElevenLabs: neověřeno. |
| iii-a | Autorská práva a práva výkonných umělců k historické nahrávce | částečně | Majetková práva autora trvají 70 let po smrti ([ePravo](https://epravo.cz/top/clanky/trvani-autorskych-prav-28660.html)). Práva výkonného umělce: 50 let od výkonu, u zvukového záznamu 70 let od prvního zveřejnění ([§ 73 AutZ, podnikatel.cz](https://businesscenter.podnikatel.cz/pravo/zakony/autorsky/f2021827/)); verzi znění jsem nezjišťoval. Práva výrobce záznamu (§ 78 a dále): neověřeno. Podmínky konkrétních archivů: neověřeno. |
| iii-b | Osobnost zemřelého podle českého práva | částečně | Podle § 82 odst. 2 občanského zákoníku se mohou ochrany osobnosti zemřelého domáhat osoby jemu blízké; text neuvádí časový limit ([zákon, podnikatel.cz](https://www.podnikatel.cz/zakony/novy-obcansky-zakonik/f4579101/)). Zda se na hlas vztahuje § 81 odst. 2 („projevy osobní povahy“) nebo § 84–85 (podobizna), jsem neověřil. |
| iv | Transparentnost syntetického zvuku v EU | částečně | Čl. 50 AI Actu: poskytovatelé syntetického zvuku jej musí strojově označit; **provozovatelé musí uvést, že obsah, který připomíná skutečné osoby a mohl by falešně působit autenticky, je uměle vytvořen** (zvuk výslovně); informace nejpozději při prvním kontaktu, jasná a rozlišitelná ([text čl. 50](https://artificialintelligenceact.eu/article/50/)). Platí od **2. 8. 2026**; digitální omnibus (v platnosti od 27. 7. 2026) čl. 50 neodložil, jen strojové označování u systémů uvedených na trh před 2. 8. 2026 má odklad do 2. 12. 2026 ([Usercentrics, aktualizováno 31. 7. 2026](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/), [Cloud Security Alliance](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-article-50-transparency-20260729/)). Sekundární zdroje; úřední znění omnibusu jsem nečetl. Neověřeno, zda se na školní projekt vztahuje výjimka pro výzkum. |
| vi | Autorská práva k postavám Švejk a Sherlock Holmes | částečně | Majetková práva autora: 70 let po smrti, od 1. ledna následujícího roku ([ePravo](https://epravo.cz/top/clanky/trvani-autorskych-prav-28660.html)). Data úmrtí: Hašek 3. 1. 1923, Josef Lada 14. 12. 1957, Conan Doyle 7. 7. 1930 ([Wikipedie: Hašek](https://en.wikipedia.org/wiki/Jaroslav_Ha%C5%A1ek), [Lada](https://en.wikipedia.org/wiki/Josef_Lada), [Doyle](https://en.wikipedia.org/wiki/Arthur_Conan_Doyle)). Z toho vychází, že dílo Haška i Doylea je v ČR volné a Ladovy ilustrace chráněné do konce roku 2027 (výpočet, ne právní posouzení). USA: soud v roce 2013 označil původní postavy Holmese a Watsona za volné a práva k posledním deseti povídkám měla vypršet koncem roku 2023 ([Scripps News](https://www.scrippsnews.com/us-news/sherlock-holmes-is-now-in-the-public-domain), [Wikipedie: Sherlock Holmes](https://en.wikipedia.org/wiki/Sherlock_Holmes)). Nečetl jsem, zda pro Švejka platí zvláštní pravidla (nedokončený román, pokračování, překlady). |
| vii | Ochranné známky a osobnostní práva autora (jméno, nedotknutelnost díla) u Švejka a Holmese | částečně | **Sherlock Holmes:** v americkém podání z 26. 2. 2016 uvádí Conan Doyle Estate Ltd. vlastní známky SHERLOCK HOLMES (č. 4 313 984 pro herní automaty ve třídě 28, č. 4 690 745 pro pořádání výstav ve třídě 41), další přihlášky a „common-law“ práva k filmům a zboží ([podání TTAB](https://ttabvue.uspto.gov/ttabvue/ttabvue-91226593-OPP-1.pdf)). Dnešní stav, zápisy v EU a ČR a třídy pro software jsem neověřil; databáze TMview, EUIPO a ÚPV nástroj nepustil (robots), a zdroje s detaily zápisu byly nedostupné. Z toho plyne reálné riziko, že dědictví bude jméno hájit u zboží a služeb. **Švejk:** v rešerši jsem žádnou známku nenašel, ale databáze ÚPV jsem nemohl prohledat. U osobnostních práv autora neznám dobu ochrany. |
| viii | Podmínky TTS služeb pro hlas „ve stylu“ postavy | neověřeno | Azure zakazuje chatboty, které jsou personou konkrétní osoby bez souhlasu; zda to platí pro literární postavu, jsem neověřil ([kodex](https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/tts-code-of-conduct)). U ostatních služeb nečteno. |
| v | Zpracování dat v TTS (jen text shrnutí) | neověřeno | Do TTS odchází jen shrnutí, ne text stránky (F4). Podmínky zpracování a ukládání textu u poskytovatele se řeší v ZF-25 a ZF-29. |

## 4. Doporučení (doporučení, ne rozhodnutí)

**Návrh Libuše (4. 11. 2026): možnost E, tj. český hlas ve stylu Švejka a anglický hlas ve stylu Sherlocka Holmese, se zálohou C.** Podle části 3 (řádek vi) jsou obě postavy autorsky volné, ale Conan Doyle Estate má (nebo měl) známky SHERLOCK HOLMES a u Švejka jsem databázi známek nemohl prohledat (řádek vii); podmínky služeb jsou neověřené. Moje doporučení zůstává C jako výchozí; E je z pohledu práv přijatelná jen při splnění podmínek z části 2 a po ověření řádků vii a viii.

**Doporučuji C: dva obecné historicky stylizované hlasy, český a anglický, bez pojmenované osoby.** Platí za těchto podmínek: (1) v ZF-25 se vybere služba, která má kvalitní hlas v obou jazycích, (2) stylizaci (tempo, tón, jméno předvolby) lze vytvořit bez napodobení konkrétní osoby, (3) štítek je viditelný bez interakce.

Zdůvodnění: A vyžaduje ověřit nejvíc podmínek (nahrávky, osobnostní práva, podmínky služby) a podle části 3 Azure zakazuje napodobit osobu bez souhlasu a OpenAI vytváří vlastní hlasy jen ze souhlasné nahrávky mluvčího, což u zemřelé osoby nejde získat (ElevenLabs a Google neověřeno); C splňuje pravidlo MVP („jinak obecný hlas historicky stylizovaný“) a můžeme ho nasadit bez právního ověřování. Dá se později rozšířit na B.

**Záložní řešení (funguje bez právního ověřování):** C. Platí i pro E: pokud se nepodaří ověřit známky nebo podmínky služby, přejde se na C a ve štítku se jméno postavy vynechá. Pokud nebude k dispozici vhodný hlas pro jeden z jazyků, použije se pro něj stock hlas bez stylizace a štítek zůstane. Pokud TTS selže, shrnutí zůstává čitelné a filtrování funguje (ZF-16, ZF-17).

## 5. Návrhy znění označení (návrh, ne rozhodnutí)

Pravidla z MVP: viditelné bez interakce, slovo „syntetický hlas“, dabing jen shrnutí, shrnutí čitelné bez TTS. Nesmí naznačit, že mluví skutečná osoba. Zobrazení: u přehrávače, v panelu shrnutí a před prvním přehráním.

| Var. | Česky | Anglicky | Poznámka |
|---|---|---|---|
| 1 | „Syntetický hlas · shrnutí napsal stroj“ | „Synthetic voice · summary written by AI“ | krátké, stále viditelné u přehrávače |
| 2 | „Syntetický hlas ve stylu doby. Nejde o hlas skutečné osoby.“ | „Synthetic voice in a period style. Not the voice of a real person.“ | pro C a D, výslovně vylučuje klam |
| 3 | „Uslyšíte syntetický hlas. Čte strojově vytvořené shrnutí, ne původní text stránky.“ | „You will hear a synthetic voice reading an AI-written summary, not the original page text.“ | delší, před prvním přehráním |

| 4 (pro E) | „Syntetický hlas ve stylu postavy Švejka. Nejde o nahrávku ani o skutečnou osobu.“ | „Synthetic voice in the style of Sherlock Holmes. Not a recording or a real person.“ | jméno postavy jen ve štítku, text shrnutí zůstává věcný |

Doporučuji 1 u přehrávače a 3 před prvním přehráním, u E variantu 4 (návrh).

## 6. Kandidáti na osobnost (jen pro B nebo A, nevybírám za tým)

Nahrávky: u všech **neověřeno**. Žádná žijící osoba.

| Osobnost | Jazyk | Proč se hodí | Riziko |
|---|---|---|---|
| T. G. Masaryk | cs | známá postava, česky psaný a mluvený projev | nahrávky a práva archivů neověřeno; § 82 občanského zákoníku (blízké osoby) |
| Karel Čapek | cs | spojení s psaným slovem a novinářstvím | totéž |
| Winston Churchill | en | rozpoznatelný projev | totéž; politik, Azure zakazuje simulaci hlasu politiků |
| Jan Amos Komenský | cs | symbol vzdělávání | žádné známé nahrávky (neověřeno), hlas lze jen vymyslet, tedy je to téma, ne napodobení |

Politici jsou pro Azure problematičtí, proto by pro A byl vhodnější nepolitik.

## 7. Co plyne z toho, že jde o nekomerční školní projekt

Neověřeno: zda poskytovatelé nabízejí pro školní užití zvláštní podmínky, zda AI Act počítá s výzkumnou výjimkou pro tento projekt a zda zveřejnění v Chrome Web Store mění postavení. Pokud by projekt byl zveřejněn nebo komerční, vše výše se musí ověřit znovu, hlavně podmínky poskytovatelů a transparentnost čl. 50.

## 8. Rozhodnutí týmu

Stav 4. 11. 2026: **verdikty zapsala Libuše, tým (vede Daniel) je zatím nepotvrdil.** U R1 a R3 jde o její rozhodnutí, u R2, R4 a R5 o znění, které navrhl Claude podle tohoto dokumentu a které čeká na její potvrzení. ZF-26 je hotové, až tým celé rozhodnutí potvrdí a zapíše.

| Bod | Verdikt | Původ | Potvrzení týmu |
|---|---|---|---|
| R1. Možnost | **E**: český hlas ve stylu Švejka, anglický hlas ve stylu Sherlocka Holmese | rozhodla Libuše | ____ |
| R2. Osobnost a podmínky | Švejk (Hašek, †1923) pro češtinu, Sherlock Holmes (Doyle, †1930) pro angličtinu. Podmínky: vlastní stock hlas služby bez napodobení herce; žádné ilustrace Josefa Lady (do 31. 12. 2027) ani zvukové ukázky z adaptací; text shrnutí se nepřepisuje jejich jménem; jméno postavy jen ve štítku. Platí **až po** ručním ověření ochranných známek (řádek vii) a podmínek vybrané TTS služby (ZF-25) | návrh Claude | ____ |
| R3. Jeden hlas na jazyk | **Ano**: český a anglický hlas, volí se automaticky podle jazyka shrnutí, uživatel nevybírá. Libuše potvrdila, že je to v souladu s MVP (`docs/mvp.md` řadí mimo rozsah výběr více hlasů uživatelem, ne jeden hlas na jazyk) | rozhodla Libuše | ____ |
| R4. Znění označení | U přehrávače varianta 1 („Syntetický hlas · shrnutí napsal stroj“ / „Synthetic voice · summary written by AI“), před prvním přehráním varianta 3, u hlasů E varianta 4 s názvem postavy. Obě verze viditelné bez interakce | návrh Claude | ____ |
| R5. Záložní řešení | **C**: dva obecné historicky stylizované hlasy bez jména postavy; použije se, když se nepodaří ověřit známky nebo podmínky služby, nebo když pro jazyk není vhodný hlas | návrh Claude | ____ |
| **Celkově** | E (Švejk cs, Sherlock Holmes en) se zálohou C, podmíněně ověřením známek a podmínek služby | | ____ |

**Co musí tým udělat před rozhodnutím:**

- [ ] ručně prohledat známky „Švejk“ a „Sherlock Holmes“ (ÚPV, TMview, EUIPO) a ověřit osobnostní práva autora; jméno Sherlocka Holmese ve štítku zvážit kvůli známkám dědictví
- [ ] nepoužívat ilustrace Josefa Lady (chráněné do 31. 12. 2027) ani zvukové ukázky z adaptací; hlas nesmí napodobit konkrétního herce
- [ ] v ZF-25 vybrat TTS službu a ověřit, že má hlas pro češtinu i angličtinu
- [ ] přečíst úplné podmínky vybrané služby (použití zdarma, školní projekt, imitace osob)
- [ ] u A nebo B zjistit u vedoucího projektu, zda se jmenovaná osobnost smí použít
- [ ] otázky pro právníka nebo univerzitu: hlas zemřelé osoby (§ 82 občanského zákoníku), práva k nahrávkám, výzkumná výjimka AI Actu
- [ ] rozhodnout znění označení a ověřit jeho viditelnost v ZF-17
- [ ] provést test dabingu v ZF-34 zvlášť pro češtinu a angličtinu

## 9. Co jsem nemohl ověřit

Ochranné známky a osobnostní práva autora u Švejka a Holmese, pravidla služeb pro hlas „ve stylu“ postavy, úplné zásady ElevenLabs (viděl jsem jen nadpisy), podmínky Azure Speech pro předpřipravené hlasy, podmínky Google Cloud TTS, úřední znění digitálního omnibusu, práva výrobců záznamů, nahrávky kandidátů a jejich podmínky, kvalitu českých a anglických hlasů a to, zda vedoucí projektu pojmenovanou osobnost dovolí. Nic z toho jsem neposlouchal ani nezkoušel (žádný účet, klíč, vzorek ani klon).
