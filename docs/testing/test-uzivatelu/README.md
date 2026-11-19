# Test prototypu s uživateli (ZF-33) a evaluace dabingu (ZF-34)

> **Stav:** návrh k odsouhlasení týmem, 19. 11. 2026. Nic z toho zatím neproběhlo. Vše, co proposal ani zmrazená metodika ([`../metodika-hodnoceni.md`](../metodika-hodnoceni.md) §g) neurčují, je označené jako **návrh**. Tým to může změnit, ale **před prvním účastníkem**: po začátku testu se postup nemění, jinak nejsou výsledky srovnatelné.

Podklady:
- [`ulohy.md`](ulohy.md): scénář moderátora, souhlas a otázky.
- [`zaznam-uloh.csv`](zaznam-uloh.csv): šablona záznamu úloh.
- [`zaznam-dabingu.csv`](zaznam-dabingu.csv): šablona záznamu dabingu.
- Vyhodnocení: `backend/scripts/evaluate_user_test.py` (viz část 7).

## 1. Co test ověřuje

Proposal §5 a §6 a `docs/mvp.md`:

| Otázka | Měřítko | Práh |
|---|---|---|
| Získá uživatel s ZenFeed přehled rychleji než obvyklým postupem? | pokles mediánu času k přehledu; nedokončená úloha = neúspěch | **≥ 20 %** (závazný) |
| … a bez horších odpovědí o ponechaném obsahu? | podíl správných odpovědí s ZenFeed není nižší než u obvyklého postupu | podmínka prahu výše |
| Přinese personalizované shrnutí víc než běžné shrnutí? | čas a správnost varianty A proti C (níže) | bez prahu, popisně |
| Dabing (ZF-34) | samostatné spuštění a zastavení, srozumitelnost v CS a EN, pochopení označení „syntetický hlas“, srovnání s běžným hlasem, dobrovolné opakované použití | bez prahu, zvlášť CS a EN |

Respektování preferencí (≥ 80 %) a vratnost (100 %) se neměří na lidech, ale na anotované sadě ([`../metriky-zf-20.md`](../metriky-zf-20.md)) a v end-to-end testu.

## 2. Účastníci

- **3–5 lidí** (proposal), dospělí uživatelé Chromu, kteří pravidelně čtou web česky i anglicky. Nábor stejnými kanály jako ZF-32 ([`../rozhovory/nabor-a-souhlas.md`](../rozhovory/nabor-a-souhlas.md)), ne členové týmu.
- **Návrh:** aspoň jeden člověk, který dnes používá AI shrnutí, a aspoň jeden, který ho nepoužívá.
- Každý dostane kód `U01`–`U05`. **Do repozitáře se nezapisují jména, kontakty, nahrávky ani snímky obrazovky.** Kdo je kdo, ví jen moderátor mimo repozitář.
- Medián z 3–5 lidí je nejistý (metodika §g), proto se vedle mediánu hlásí i jednotlivé časy.

## 3. Varianty

Každý účastník projde **tři varianty, každou na jiné stránce**:

| Kód | Varianta | Co účastník dělá |
|---|---|---|
| **A** | ZenFeed | Nastaví témata, která nechce číst, klikne na Analyzovat, pak na Shrnout. Může číst stránku i shrnutí. |
| **B** | Obvyklý postup: čtení bez nástroje | Čte stránku, jak je zvyklý. Témata, která nechce, přeskakuje sám. Je to **základ pro práh 20 %**. |
| **C** | Běžné AI shrnutí | Zkopíruje text stránky do AI chatu (návrh: Gemini nebo ChatGPT ve webu, bez přihlášení k osobnímu účtu moderátora), požádá o shrnutí a čte ho. Personalizaci si účastník může dopsat sám do dotazu. |

- Základem pro práh je **B**, protože proposal uvádí čtení bez nástroje jako obvyklý postup na prvním místě.
- **C** je druhý obvyklý postup („ruční AI chat“) a zároveň „běžné shrnutí“ pro srovnání s personalizovaným. Výsledek A proti C se hlásí zvlášť.
- Kdyby na C nebyl čas, tým může test zkrátit na A a B. Musí to ale rozhodnout předem a uvést ve zprávě.

## 4. Stránky

- **Tři stránky T1, T2, T3** (návrh: dvě české a jedna anglická, nebo naopak, aby oba jazyky byly zastoupené).
- Každá stránka musí obsahovat:
  - téma ze seznamu kategorií, které se dá skrýt (válka, politické konflikty, úmrtí, katastrofy, násilí),
  - dost dalšího obsahu, aby měla otázky smysl.
- Jen ze zdrojů, které povolují čtení a analýzu ([`../pilot/stranky.md`](../pilot/stranky.md)). **Ne z finální části sady ZF-19** (metodika §f). BBC ne.
- Stránky se zafixují permalinkem nebo ID verze a datem. Když se mezi účastníky změní, úloha se nevyhodnocuje.
- **Klíč odpovědí** ke každé stránce (hlavní téma, dvě hlavní informace, klíčový závěr) připraví předem jeden hodnotitel a potvrdí druhý, ještě před prvním účastníkem. Klíč obsahuje jen informace z obsahu, který při zvolených tématech zůstává viditelný. Stejné „nechtěné“ téma pro každou stránku určí tým předem (návrh: téma, které na stránce opravdu je) a účastník ho dostane jako zadání, aby byly varianty srovnatelné.

## 5. Pořadí (vyvážení)

Pořadí stránek je pevné (T1, T2, T3) a pořadí variant se střídá, takže se každá varianta dostane na každou stránku:

| Účastník | T1 | T2 | T3 |
|---|---|---|---|
| U01 | A | B | C |
| U02 | B | C | A |
| U03 | C | A | B |
| U04 | A | C | B |
| U05 | C | B | A |

U01–U03 tvoří latinský čtverec. U04 a U05 jsou z obráceného čtverce a vyrovnávají pořadí, ve kterém varianty jdou po sobě. Při zkrácení na A a B se střídá A–B a B–A.

## 6. Průběh jednoho sezení (návrh, asi 40 minut)

1. Úvod a ústní souhlas ([`ulohy.md`](ulohy.md), část 1). Ukázka ZenFeed na cvičné stránce, která není T1–T3 (asi 3 minuty).
2. Tři úlohy podle tabulky pořadí. Každá úloha:
   - **Start stopek:** účastník dostane pokyn a odkaz na stránku.
   - **Konec stopek:** účastník řekne „mám přehled“ a odpoví ústně na čtyři otázky (hlavní téma, dvě hlavní informace, klíčový závěr).
   - **Časový limit, návrh: 10 minut.** Po limitu se úloha ukončí jako nedokončená, a ta je podle proposalu **neúspěch**.
   - Moderátor zapíše čas, odpovědi hodnotí podle klíče a zapíše, zda účastník narazil na nechtěné téma (viděl ho, nebo ho četl).
3. Dabing (ZF-34) na stránce z varianty A, viz [`ulohy.md`](ulohy.md), část 4.
4. Krátké závěrečné otázky.

Měří moderátor stejnými stopkami pro všechny varianty (metodika §g). Za časový limit nemůže účastník. Když se úloha zastaví kvůli chybě prototypu (server neběží, stránka se nenačte), zapíše se do poznámky a úloha je **nedokončená**. Opakovat ji nejde, protože by účastník stránku už znal.

## 7. Vyhodnocení

Z vyplněné šablony `zaznam-uloh.csv` (z kořene repozitáře, s aktivní virtuální `.venv`):

```bash
PYTHONPATH=backend python backend/scripts/evaluate_user_test.py zaznam-uloh.csv
```

Skript vypíše:
- **Medián času po variantách.** Nedokončená úloha se řadí za všechny dokončené. Když medián padne na nedokončenou úlohu, je medián „nedokončeno“ a práh nesplněný.
- **Pokles mediánu A proti B** a vůči prahu 20 %.
- **Podíl správných odpovědí** po variantách a podmínku „bez horších odpovědí“: A ≥ B.
- Jednotlivé časy každé varianty, kolikrát účastník narazil na nechtěné téma (a kolikrát ho četl), srovnání A proti C a mediány po jazycích stránky.
- Kontrolu záznamu: odmítne neznámou variantu, chybějící čas u dokončené úlohy, jiné hodnocení odpovědi než 0 a 1, a také stejnou stránku dvakrát u jednoho účastníka.

Výsledek se zapíše do závěrečného vyhodnocení (ZF-35) včetně počtu účastníků a všech jednotlivých časů.

**Dabing** se vyhodnocuje zvlášť pro češtinu a angličtinu ze `zaznam-dabingu.csv`. Stačí jednoduché počty, například „spustil a zastavil sám 4 z 5“ nebo „srozumitelnost medián 4 z 5“. Skript na to není potřeba.

## 8. Co zatím brání úplnému testu dabingu

- **Hlas historické postavy zatím není** (ZF-26, ověření ochranných známek). Prototyp čte obecným hlasem systému. „Srovnání s běžným hlasem“ podle proposalu proto dnes znamená srovnání dvou obecných hlasů. **Návrh:** srovnání provést, až tým rozhodne ZF-26. Do té doby ho zapsat jako **neměřeno** a změřit, co jde:
  - samostatné spuštění a zastavení,
  - srozumitelnost v CS a EN,
  - pochopení označení „syntetický hlas“,
  - dobrovolné opakované použití.
- Čtení skončí, když se popup zavře. Moderátor to účastníkovi řekne předem, aby ho to nepřekvapilo ([`../../voice-player.md`](../../voice-player.md)).
- Počítač pro test musí mít český i anglický hlas (macOS je má). Ověří se před sezením.

## 9. Před prvním účastníkem (kontrolní seznam)

- [ ] Tým odsouhlasil varianty, časový limit, stránky T1–T3 a nechtěné téma pro každou stránku.
- [ ] Klíč odpovědí ke každé stránce je hotový a potvrdil ho druhý hodnotitel.
- [ ] Na testovacím počítači běží backend s klíčem (shrnutí), rozšíření je načtené a hlasy CS i EN jsou dostupné. Pilotní sezení s členem týmu proběhlo a vyzkoušel se v něm i časový limit.
- [ ] Prohlížeč na testovacím počítači je v čistém profilu, bez osobních účtů a historie moderátora.
- [ ] Šablony záznamu jsou zkopírované mimo repozitář. Do repozitáře jde až anonymní vyplněný záznam.
