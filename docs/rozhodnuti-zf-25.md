# Model, TTS, hosting a strop nákladů (ZF-25)

> **Návrh Daniela, 4. 11. 2026.** Čeká na souhlas Jana. Není to měření kvality: žádný model neběžel na pilotních blocích, protože v repozitáři není API klíč a text stránek se nemá posílat, dokud neplatí pravidla níže. Ceny jsou ceníkové, přečtené 4. 11. 2026. Odhad spotřeby je předpoklad, ne naměřený provoz.

## Volba

| Oblast | Volba | Proč |
|---|---|---|
| Text (klasifikace i pozdější shrnutí) | OpenAI `gpt-5-nano`, endpoint `/v1/chat/completions`, strukturovaný JSON | Nejnižší ceníková cena z modelů, které umí JSON a češtinu i angličtinu. Vstup stránky je velký, výstup krátký, a právě vstup je u něj nejlevnější. |
| Hlas | Google Cloud Text-to-Speech, stock hlasy Chirp 3 HD, `cs-CZ` a `en-US` | Čeština u Chirp 3 HD je v ZF-26 ověřená. První 1 milion znaků měsíčně je zdarma. Žádné klonování hlasu. |
| Kde backend poběží | Do dema lokálně (`uvicorn`). Pro společné zkoušení Google Cloud Run, region `europe-west1`, účtování podle requestů, minimum instancí 0 | Při nule requestů je účet za Cloud Run nula. Volný měsíční limit demo pokryje. |
| Strop | **15 USD za celé MVP** (OpenAI + Google Cloud dohromady). Upozornění na účtu při 5 USD | Při překročení se přestane volat model. Klasifikace zůstane na `lexicon-1`. Shrnutí a TTS vrátí chybu, filtrování běží dál. |

Klíč je jen na serveru, v proměnné prostředí, nikdy v rozšíření a nikdy v gitu. U OpenAI se nezapíná sdílení vstupů a výstupů pro trénink. Bezplatná vrstva Gemini se pro text stránek nepoužije: Google u ní uvádí, že obsah používá ke zlepšování produktů.

Švejk a Sherlock zůstávají otázka štítku z ZF-26. Tahle volba je stock hlas, ne napodobenina herce.

## Ceny k 4. 11. 2026

Text, standardní ceník, USD za 1 milion tokenů:

| Model | Vstup | Výstup | Jedna analýza 20 bloků | Poznámka |
|---|---:|---:|---:|---|
| **gpt-5-nano** | 0,05 | 0,40 | 0,0014 | volba |
| gemini-2.5-flash-lite | 0,10 | 0,40 | 0,0022 | pro nové účty už Google směruje jinam |
| gpt-4.1-mini | 0,40 | 1,60 | 0,0090 | zastaralý, dražší |
| gpt-5-mini | 0,25 | 2,00 | 0,0072 | pětkrát dražší výstup |
| gemini-3.5-flash-lite | 0,30 | 2,50 | 0,0088 | aktuální malý Gemini, šestkrát dražší výstup |

Předpoklad jedné analýzy, ne měření: 20 bloků, 800 vstupních a 80 výstupních tokenů na blok, tedy 16 000 vstupních a 1 600 výstupních tokenů. U `gpt-5-nano` je to 16 000 / 1 000 000 × 0,05 + 1 600 / 1 000 000 × 0,40 = 0,00144 USD. Dvacet čtyři stránek po dvou dávkách vyjdou pod 0,10 USD. Padesát takových průchodů je pořád jednotky dolarů.

Hlas, [ceník Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/pricing): Chirp 3 HD je 0 až 1 milion znaků měsíčně zdarma, potom 30 USD za milion znaků. Shrnutí o 800 znacích je uvnitř volného milionu. OpenAI hlasy `tts-1`, `tts-1-hd` a `gpt-4o-mini-tts` mají podle průvodce skončit 6. 1. 2027, takže se pro semestr nehodí.

Cloud Run, [ceník](https://cloud.google.com/run/pricing), účtování podle requestů: prvních 180 000 vCPU-sekund, 360 000 GiB-sekund a 2 miliony requestů měsíčně zdarma. Minimum instancí 0, region `europe-west1`. Neplatí se za čas, kdy nikdo rozšíření nepoužívá.

## Data

- OpenAI API: od 1. 3. 2023 se data z API nepoužívají k tréninku, pokud tým výslovně nezapne sdílení. U `/v1/chat/completions` se logy pro kontrolu zneužití drží až 30 dní. Zdroj: [Data controls](https://developers.openai.com/api/docs/guides/your-data), čteno 4. 11. 2026. Sdílení se nezapíná.
- Gemini, neplacená vrstva: obsah se používá ke zlepšování produktů. Placená vrstva ne. Zdroj: [ceník](https://ai.google.dev/gemini-api/docs/pricing) a [dodatečné podmínky](https://ai.google.dev/gemini-api/terms), čteno 4. 11. 2026. Text stránek proto na neplacenou vrstvu nepatří.
- Do TTS odchází jen shrnutí, ne text stránky. Klonování a vlastní hlas se nepoužívají.

## Co ještě není hotové

- Kvalita a latence `gpt-5-nano` na pilotních blocích. Bez klíče a bez souhlasu Jana se texty neposílají.
- Nasazení na Cloud Run. Do té doby stačí lokální server.
- Souhlas Jana s touto volbou.
