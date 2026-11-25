# Závěrečné demo a záložní scénář (ZF-23)

> **Stav:** návrh scénáře k odsouhlasení týmem, 25. 11. 2026. Rozdělení řečnických částí a délku určí tým. Podmínka splnění ZF-23 je **zkouška dema včetně záložního scénáře** (část 6). Ta zatím neproběhla.

Demo běží na **ukázkové stránce** `tests/extension/fixtures/demo.html` („Večerník Horní Lhoty“). Všechny zprávy na ní jsou smyšlené a stránka funguje bez internetu. Obsahuje:
- po jednom bloku ke každému z pěti témat,
- jeden toxický komentář,
- šest neutrálních bloků (knihovna, počasí, technika, recept, dva komentáře).

Test `backend/tests/test_demo_page.py` hlídá, že klasifikátor u každého bloku udělá přesně to, co tento scénář slibuje. Stránka je i v end-to-end regresi, takže změna klasifikace nemůže demo rozbít bez povšimnutí. Naposledy ověřeno 25. 11. 2026: se všemi preferencemi se skryje 6 bloků, každé téma i tón jednou, a „Zobrazit vše“ vrátí identické HTML.

## 1. Spuštění

Z kořene repozitáře, s aktivní `.venv` a s `.env` s klíčem Gemini:

```bash
bash tests/extension/run-demo.sh
```

Skript:
- spustí backend na `127.0.0.1:8000`;
- spustí demo stránku na <http://127.0.0.1:8765/demo.html>;
- vypíše, jestli našel klíč pro shrnutí.

**Falešné Gemini záměrně nespouští:** v demu se nikdy neukáže vymyšlené shrnutí, jako by bylo skutečné.

## 2. Návrh rozdělení řečnických částí

Podle rolí z plánu (ZF-36). Tým upraví.

| Část | Kdo (návrh) | Délka (návrh) |
|---|---|---|
| Problém a pro koho (proposal §1–2), dotazník (ZF-32) | Libuše | 1,5 min |
| Architektura a soukromí (diagram v README, co se kam posílá) | Jan | 1,5 min |
| Živé demo (část 3) | Jakub | 5 min |
| Klasifikace a shrnutí: jak funguje a kde selhává | Daniel | 1,5 min |
| Výsledky a limity (část 4) | Libuše + Jan | 2 min |

## 3. Postup živého dema

Každý krok uvádí, **co udělat**, **co se má ukázat** a **co říct** (jen návrh).

| # | Udělat | Má se ukázat | Říct |
|---|---|---|---|
| 1 | Otevřít <http://127.0.0.1:8765/demo.html> | Zpravodajská stránka, nahoře žlutý pruh „Všechny zprávy … jsou smyšlené“ | Běžná stránka se zprávami, které člověk nechce vždycky číst. Zprávy jsou smyšlené. |
| 2 | Kliknout na ikonu ZenFeed | Popup s přepínači. Na stránce se nic nezměnilo | Dokud nekliknu na Analyzovat, ZenFeed ze stránky nic nečte ani neposílá. |
| 3 | Zapnout **Válka** a **Násilí**, kliknout **Analyzovat** | „Skryté bloky: 2 z 13.“ Na stránce jsou místo dvou článků boxy „Skryto: válka“ a „Skryto: násilí“ | Skryje celý blok, text stránky nemění a nic nepřepisuje. |
| 4 | U boxu kliknout **Proč byl tento obsah skryt?**, pak **Zobrazit** | Důvod skrytí. Článek o přístavu se vrátí | Každé skrytí jde vrátit jedním kliknutím. |
| 5 | Zapnout všechna témata a **tón**, kliknout **Analyzovat** | „Skryté bloky: 6 z 13.“ Navíc katastrofy, politické konflikty, úmrtí a toxický komentář. Knihovna, počasí, technika, recept a slušné komentáře zůstanou | Téma a tón jsou dvě různé volby: komentář je skrytý kvůli tónu, ne kvůli tématu. |
| 6 | **Shrnout viditelný obsah** | Shrnutí jen z viditelných bloků a pod ním „Použité nastavení: … Vynechaná témata: …“ | Do shrnutí jde jen to, co zůstalo vidět. Skrytý text se nikam neposílá. Text jde do Google Gemini, popup na to upozorní předem. |
| 7 | **Přehrát**, po pár větách **Pozastavit**, pak **Zastavit** | Označení „Syntetický hlas · shrnutí napsal stroj“ a čtení hlasem systému | Čte se jen shrnutí, nikdy text stránky, a je jasně označené jako syntetický hlas. |
| 8 | **Zobrazit vše** | „Zobrazeno vše, obnovené bloky: 6. Stránka je v původním stavu.“ | Stránka je přesně taková jako na začátku. |
| 9 (volitelně) | Otevřít `chrome://version` a kliknout na ikonu | „Na této stránce ZenFeed nefunguje …“ | Okrajové stavy mají srozumitelnou zprávu a nic se nepokazí. |
| 10 (volitelně, s internetem) | Skutečná stránka, např. [cs.wikipedia: Globální oteplování](https://cs.wikipedia.org/wiki/Glob%C3%A1ln%C3%AD_oteplov%C3%A1n%C3%AD) se všemi tématy | Část bloků se skryje (při posledním měření 21 z 400) | Na skutečném webu to funguje taky, ale klasifikace je slabší (část 4). |

**Pozor:**
- Krok 5 musí jít po kroku 4: Analyzovat se klikne znovu, i když je článek z kroku 4 zobrazený, a pak se zase skryje. Je to nová analýza.
- Krok 10 je mimo demo stránku, takže počty se mohou lišit. Nepouštět bez internetu.

## 4. Výsledky a limity, které je fér říct

Zdroj čísel je u každého řádku. Až budou výsledky finální sady ZF-19 a testu s uživateli (ZF-33), nahradí ukázková čísla.

| Co | Výsledek | Zdroj |
|---|---|---|
| Vratnost skrytí | 100 % v end-to-end regresi (všechny stránky, HTML po „Zobrazit vše“ shodné) | [`../testing/regrese-m3.md`](../testing/regrese-m3.md) |
| Respektování preferencí | **cíl 80 % zatím nesplněn.** Slovník skryje asi 38 % bloků, které má, a 87 % jeho skrytí je správně. Na pilotu 0 ze 3 případů s cílem | [`../testing/pilot/lexicon-2.md`](../testing/pilot/lexicon-2.md), [`../testing/metriky-zf-20.md`](../testing/metriky-zf-20.md) |
| Latence skrytí | medián 40 ms, p95 279 ms (lokálně, 18 stránek) | [`../testing/mereni-latence.md`](../testing/mereni-latence.md) |
| Čas k přehledu (cíl −20 %) | doplnit po ZF-33 | [`../testing/test-uzivatelu/README.md`](../testing/test-uzivatelu/README.md) |
| Limity | slovník místo modelu, text shrnutí jde Googlu, backend jen lokálně, obecný hlas místo historické postavy | [`../zname-omezeni.md`](../zname-omezeni.md) |

Demo stránka je napsaná tak, aby ji slovník zvládl. **Neprezentovat ji jako měření přesnosti.** Přesnost je v řádku „Respektování preferencí“.

## 5. Záložní scénáře

| Co se pokazí | Jak to poznám | Co udělat |
|---|---|---|
| **A. Nejde internet** | Wikipedia se nenačte, shrnutí hlásí chybu | Demo stránka i skrývání běží lokálně, pokračovat kroky 1–5 a 7–8. U kroku 6 ukázat chybovou hlášku jako připravený okrajový stav („Filtrování funguje dál“) a shrnutí ukázat ze záložní nahrávky (B). |
| **B. Shrnutí nejde** (vyčerpaný limit, klíč, výpadek Gemini) | „Bezplatný limit pro shrnutí je vyčerpaný …“, „Shrnutí teď není k dispozici …“ nebo „Shrnutí nedorazilo včas“ | Říct, že je to záměrný okrajový stav a skrývání funguje dál. Shrnutí a hlas ukázat ze **záložní nahrávky** celého dema. **Nepouštět falešné Gemini.** |
| **C. Backend spadl** | „Server ZenFeed neběží. Spusťte ho …“ | V terminálu `Ctrl+C` a znovu `bash tests/extension/run-demo.sh` (asi 5 s). Mezitím mluvit o architektuře. Když to nepomůže, záložní nahrávka. |
| **D. Rozšíření nereaguje nebo se nenačte** | Ikona chybí nebo popup nic nedělá | `chrome://extensions`, u ZenFeed šipka „Načíst znovu“, obnovit demo stránku. Když to nepomůže, záložní nahrávka. |
| **E. Chybí hlas** | „V počítači není nainstalovaný český hlas …“ | Okrajový stav: shrnutí zůstává čitelné. Hlas ukázat z nahrávky. |
| **F. Málo času** | – | Zkrácená verze: kroky 2, 5, 6 a 8. |

**Záložní nahrávka:** Den před prezentací nahraje tým celé demo (kroky 1–8) na prezentačním počítači se skutečným shrnutím. Nahrávka se uloží **mimo repozitář**, stejně jako ostatní obrázky a videa (`evidence-chyb.md`, pravidlo 8). Na nahrávce nesmí být záložky, účty ani oznámení s osobními údaji.

## 6. Příprava a zkouška

**Den předem:**
- [ ] `git pull` na `main`, `pip install -r backend/requirements-dev.txt`, `bash tests/extension/run-e2e.sh` prošel.
- [ ] `.env` s klíčem je na prezentačním počítači a jedno zkušební shrnutí na demo stránce prošlo, takže denní limit není vyčerpaný.
- [ ] Rozšíření je načtené (Load unpacked) a připnuté na liště. Prohlížeč je v čistém profilu bez osobních záložek a účtů.
- [ ] Je k dispozici český hlas (macOS: Nastavení → Zpřístupnění → Mluvený obsah).
- [ ] Záložní nahrávka je hotová a přehrává se offline.

**Zkouška dema** (podmínka ZF-23), vyplnit:

| Datum | Kdo | Celé demo podle části 3 | Vyzkoušený záložní scénář (které písmeno) | Čas | Problémy |
|---|---|---|---|---|---|
| | | | | | |

**30 minut před:** spustit `run-demo.sh`, otevřít demo stránku v jedné kartě a `chrome://extensions` v druhé, vypnout oznámení, zvětšit stránku (Cmd/Ctrl + `+`) a nastavit hlasitost.
