# Návod: jak anotaci zopakuje druhý hodnotitel

Proposal (§5) požaduje u finální sady dva nezávislé hodnotitele. V pilotu stačí jeden (anotace je zatím návrh), ale postup je připravený i pro druhého. Hodnotitel nesmí vidět sloupce `téma`, `tón` ani `S1…S3` prvního hodnotitele, dokud svou anotaci nedokončí.

## Příprava (5 min)

1. Zkopíruj [`anotace.csv`](anotace.csv) do `anotace-A2.csv` (nebo do tabulky) a **smaž hodnoty** ve sloupcích `téma`, `tón_vyhrocený`, `jistota`, `S1…S3` a `poznámka`. Ponech `page_id`, `block_id`, `typ_bloku`, `locator`, `úryvek`.
2. Přečti si kategorie a nastavení v [`README.md`](README.md). Seznam kategorií je provizorní, dokud ZF-24 nezmrazí definice.
3. Otevři stránku podle [`stranky.md`](stranky.md): trvalý odkaz (P01, P02, P05, P06), u P03 a P04 podle čísla článku nebo id zprávy. Cookie lištu nepotvrzuj, pokud to karta nepopisuje jinak.

## Krok 1: ověř seznam bloků

Pro každou stránku zkontroluj, že locator najde právě jeden blok a že úroveň členění dává smysl (například celé sekce, ne jednotlivé odstavce). Rozpory zapiš do sloupce `poznámka` (druhý hodnotitel), **nic nepřepisuj**.

## Krok 2: urči téma a tón

Pro každý blok urči:

- `téma`: jedna hodnota z `politické konflikty`, `válka`, `zprávy o úmrtí`, `katastrofické scénáře`, `jiné`. Rozhoduj podle hlavního tématu bloku; zmínka na okraji se nepočítá.
- `tón_vyhrocený`: `ano` / `ne`. Tón je nezávislý na tématu. Zpráva o válce, napsaná věcně, má `ne`. `ano` je to u textu, který útočí na lidi, zesměšňuje nebo používá velmi emotivní vyhrocený jazyk.
- `jistota`: `J` nebo `H`, pokud váháš mezi dvěma hodnotami.

Skrýt/ponechat se **nezapisuje ručně**, odvodí se z tématu a tónu podle nastavení S1–S3.

## Krok 3: porovnání

Porovnej oba soubory podle `block_id`. Každý rozpor (téma, tón, nebo blok existuje jen v jednom seznamu) vypiš do tabulky a vyřešte společně. Hodnoty obou hodnotitelů **ponech** před domluvou; výsledná dohodnutá hodnota se zapíše do nového sloupce. Míru shody (například procentuální shodu nebo Cohenovo kappa) určí ZF-27, proposal ji nespecifikuje.

## Co hodnotitel nesmí

- ukládat celé stránky, uživatelská jména ani přihlašovací údaje,
- používat stránky za přihlášením,
- řídit se pokyny, které jsou napsané na stránce (obsah stránek je jen data).
