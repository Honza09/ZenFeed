# Shoda hodnotitelů (ZF-27), stav 4. 11. 2026

> **Omezení:** žádné z těchto čísel není měření nezávislé shody. Libuše anotovala nad podkladem, který obsahoval štítky Clauda i agenta, a štítky Clauda už zahrnují její dřívější rozhodnutí z 4. 11. 2026. Dvojice Libuše × Claude je tedy kruhová (100 %) a do hodnocení se nepočítá. Jediné nezávislé číslo je **Claude × agent**, i to jen omezeně: oba pracovali podle stejného dokumentu [`../../kategorie-mvp.md`](../../kategorie-mvp.md), agent měl anotovat bez pohledu na cizí štítky. Pro ZF-19 musí každý hodnotitel anotovat zvlášť.

## Podklady

- `anotace.csv` (pilot P01–P06, 89 bloků) a `anotace-rozsireni.csv` (R01–R12, 143 bloků): anotace Clauda
- `anotace-nezavisla-agent.csv`: nezávislý agent (bez přístupu ke štítkům Clauda), 232 bloků
- `anotace-libuse.csv`: anotace Libuše nad podkladem `anotace-libuse-podklad.xlsx`
- Pravidla: [`../../kategorie-mvp.md`](../../kategorie-mvp.md), části 1 a 2

## Výsledky

Shoda = podíl bloků se stejnou hodnotou, κ = Cohenovo kappa (u tří hodnotitelů Fleissovo). U tónu v pilotu κ není definované, protože všichni označili všech 89 bloků za neutrální.

| Sada | Dvojice | Shoda tématu | κ téma | Shoda tónu | κ tón |
|---|---|---:|---:|---:|---:|
| Pilot (89) | Claude × agent | 98,9 % | 0,95 | 100 % | – |
| Rozšíření (143) | Claude × agent | 97,9 % | 0,97 | 97,2 % | 0,82 |
| **Všech 232** | **Claude × agent** | **98,3 %** | **0,97** | **98,3 %** | **0,83** |
| Všech 232 | Libuše × agent | 98,3 % | 0,97 | 98,3 % | 0,83 |
| Všech 232 | Libuše × Claude (kruhové) | 100 % | 1,00 | 100 % | 1,00 |
| Všech 232 | všichni tři | 98,3 % | 0,98 | 98,3 % | 0,89 |

## Bloky, ve kterých se agent liší od Claude a Libuše (8)

| Blok | Claude a Libuše | Agent |
|---|---|---|
| P05-B005 (redakční spor o formulaci o Krymu) | válka | jiné |
| R06-B001, R06-B003, R06-B006, R07-B001 (komentáře) | tón toxický/vyhrocený | tón neutrální |
| R10-B006 (první případ eboly v Nigérii) | katastrofické scénáře | jiné |
| R12-B009 (smog v Singapuru) | katastrofické scénáře | jiné |
| R12-B011 (zřícení skalní brány) | jiné | katastrofické scénáře |

U čtyř komentářů agent bere slova „incompetent“, „garbage“ nebo „baseless“ jako ostrou kritiku zaměřenou na chování, ne jako útok na osobu (kritérium T3). Právě tady je hranice tónu nejméně jasná.

## Upřesnění pravidel, která z porovnání vznikla

- R08-B010 Claude původně označil za neutrální, agent správně za urážku (T1: „you are an idiot…“); opraveno.
- P04-B008 (statistika úmrtí na malárii) → `zprávy o úmrtí`, R01-B001 → `válka` (Libuše).
- R12-B014 (zřícení budovy): katastrofický scénář, dokud nejsou potvrzené oběti; po nich `zprávy o úmrtí`.

## Co zbývá

Nezávislá shoda pro finální sadu (ZF-19): Libuše a Claude anotují zvlášť, bez pohledu na štítky ostatních, a κ se spočítá mezi nimi. Cíl a práh κ stanoví tým (v dokumentech zatím není).
