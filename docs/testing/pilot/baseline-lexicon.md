# Baseline slovníku lexicon-1

Měřeno 4. 11. 2026 skriptem `backend/scripts/measure_lexicon.py` na úryvcích v repozitáři. Úryvek je sloupec `úryvek_pro_identifikaci`, ne celý text bloku ze stránky. Model je `lexicon-1` z ZF-06. Čísla níže jsou výstup toho běhu a hlídá je `backend/tests/test_lexicon_baseline.py`.

Skrytí: `hide` je zásah. `review` a `show` se počítají jako neskryto, protože nejistota nesmí skrývat. `H` v anotaci znamená „má se skrýt“, `K` „má zůstat“.

## Co z toho plyne

Na 89 blocích pilotu sedí téma v 82 případech (92,1 %). Z toho je 78 bloků `jiné` a těch slovník trefí všechny, protože na ně nemá signál. Na zbylých 11 blocích, které mají být válka nebo zpráva o úmrtí, sedí 4 (36 %). Rozšířená sada, kde už jsou i konflikty, katastrofy a násilí, dá na těch tématech 24 z 88 (27 %).

Falešné skrytí je vzácné. V pilotu jsou dvě, obě na P01 při nastavení „skrýt úmrtí a katastrofy“: `P01-B001` a `P01-B004`. V rozšířené sadě je jich pět (`R01-B001` S2, `R01-B006` S4, `R04-B012` S2, `R09-B013` S2, `R10-B001` S2). Válku, kterou uživatel chtěl skrýt, slovník většinou nechá viditelnou: v pilotu 3 z 8, v rozšířené sadě 6 z 33.

Násilí na úryvcích nepoznal ani jednou (0 z 13). Tón v pilotu sedí ve všech 89 řádcích, protože po opravě anotace je všude neutrální. V rozšířené sadě sedí ve 135 z 143 a z 14 vyhrocených schová 6.

Čas jednoho průchodu, včetně pěti klasifikací na řádek (bez preferencí a čtyři nastavení): pilot 21 ms, rozšířená sada 36 ms. Na řádek je to pod 0,3 ms.

## Pilot, `anotace.csv` (89)

| | Správně | Z |
|---|---:|---:|
| Téma, všechny řádky | 82 | 89 |
| Téma, jen jistota `J` | 73 | 76 |
| Téma, bez `jiné` | 4 | 11 |
| Tón | 89 | 89 |
| `válka` | 3 | 8 |
| `zprávy o úmrtí` | 1 | 3 |
| `jiné` | 78 | 78 |

| Nastavení | Má se skrýt | Skryto správně | Necháno viditelné | Skryto omylem |
|---|---:|---:|---:|---:|
| S1 válka a politické konflikty | 8 | 3 | 5 | 0 |
| S2 úmrtí a katastrofy | 3 | 1 | 2 | 2 |
| S3 vyhrocený tón | 0 | 0 | 0 | 0 |
| S4 násilí | 0 | 0 | 0 | 0 |

## Rozšířené příklady, `anotace-rozsireni.csv` (143)

Tohle není součást šestistránkového pilotu. Jsou tu vzácná témata, která v pilotu skoro nejsou.

| Téma | Správně | Z |
|---|---:|---:|
| všechny řádky | 79 | 143 |
| jen jistota `J` | 58 | 93 |
| bez `jiné` | 24 | 88 |
| tón | 135 | 143 |
| `válka` | 4 | 16 |
| `politické konflikty` | 5 | 17 |
| `katastrofy` | 6 | 21 |
| `zprávy o úmrtí` | 9 | 21 |
| `násilí` | 0 | 13 |
| `jiné` | 55 | 55 |

| Nastavení | Má se skrýt | Skryto správně | Necháno viditelné | Skryto omylem |
|---|---:|---:|---:|---:|
| S1 | 33 | 6 | 27 | 0 |
| S2 | 42 | 22 | 20 | 4 |
| S3 | 14 | 6 | 8 | 0 |
| S4 | 13 | 0 | 13 | 1 |

U S1 jsou 3 z 27 nechycených bloků ve stavu `review`, ne `hide`.

## Co to znamená pro další krok

Slovník je rychlý a málokdy schová něco, co anotace nechává viditelné. Na tématech, kvůli kterým ZenFeed existuje, většinu bloků nechá na stránce. Než se na něj bude spoléhat demo, musí buď dostat lepší signál, nebo ho nahradí model z ZF-25. Tahle stránka se má přegenerovat stejným skriptem, až se slovník změní. Test pak spadne, dokud se čísla neporovnají znovu.
