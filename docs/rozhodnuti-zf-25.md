# Model, TTS, hosting a strop nákladů (ZF-25)

> **Návrh Daniela, 4. 11. 2026, upraveno týž den: školní projekt bez placení. Schválil Jan 4. 11. 2026.** Žádný model neběžel na pilotních blocích. Ceníky jsou přečtené 4. 11. 2026. Denní limit bezplatné vrstvy Google v dokumentaci neuvádí jako pevné číslo; ukazuje ho AI Studio a může se změnit.

## Volba

Do projektu se nepřipojuje platební karta. Strop je **0 USD**.

| Oblast | Volba | Proč |
|---|---|---|
| Text | Gemini API, bezplatná vrstva, bez připojeného účtu k fakturaci. Model `gemini-3.5-flash-lite` (pro nové projekty). Když dojde denní limit nebo služba spadne, klasifikace zůstane na lokálním `lexicon-1` | OpenAI i placené Gemini chtějí kartu. `lexicon-1` už v repozitáři je a nic nestojí. Bezplatné Gemini je jediný způsob, jak mít v demu opravdový model a přesto nezaplatit. |
| Hlas | `speechSynthesis` v Chromu. Žádná cloudová TTS | Hlas čte prohlížeč na počítači uživatele. Čeština zazní jen tehdy, když ji má operační systém nainstalovanou. Hlas je běžný hlas prohlížeče, postava z návrhu ZF-26 je jen ve štítku. |
| Kde backend poběží | Jen lokálně, `uvicorn` na počítači, který zrovna demuje | Cloud Run má volný limit, ale účet k fakturaci je podmínka. Ten nezakládáme. |
| Strop | 0 USD. Platební účet se k Gemini ani ke Google Cloud nepřipojuje | Jakmile se připojí karta, překročení volného limitu začne stát peníze. |

Klíč k bezplatnému Gemini, pokud ho tým vůbec použije, je jen na serveru. Do rozšíření ani do gitu nepatří. Švejk a Sherlock Holmes z návrhu Libuše zůstávají (možnost E se zálohou C, [`hlas-a-oznaceni.md`](hlas-a-oznaceni.md) část 8): česky Švejk, anglicky Sherlock Holmes, jméno postavy jen ve štítku a žádné napodobení, takže karta není potřeba. Platí to za podmínek z ZF-26, hlavně po ručním ověření ochranných známek. Jinak se použije záloha C bez jména postavy.

## Co tím platíme místo peněz

Bezplatná vrstva Gemini používá odeslaný text ke zlepšování produktů Google. Píše to [ceník](https://ai.google.dev/gemini-api/docs/pricing) (sloupec Free Tier, „Used to improve our products: Yes“) a [dodatečné podmínky](https://ai.google.dev/gemini-api/terms), čteno 4. 11. 2026. Na tuhle vrstvu proto nepatří nic, co uživatel neposlal vědomě tlačítkem, a v demu stačí stránky, jejichž text smíme ukázat třetí straně. Logy aplikace text stránky dál neukládají.

Tým ví, že [dodatečné podmínky](https://ai.google.dev/gemini-api/terms) (čteno 4. 11. 2026) mají zvláštní pravidla pro EHP: API klienty dostupné uživatelům v EHP dovolují jen na placených službách a pro bezplatnou kvótu v EHP uvádějí podmínky nakládání s daty z placených služeb. Volbu to nemění.

Hlas z prohlížeče nikam neodchází. Lokální slovník taky ne.

Denní strop requestů Google na stránce [limitů](https://ai.google.dev/gemini-api/docs/rate-limits) negarantuje a ukazuje ho až AI Studio daného projektu (stav dokumentace 28. 10. 2026). Na jednom bezplatném projektu 21. 10. 2026 někdo viděl u Flash-Lite 15 requestů za minutu a 500 za den. To není slib pro nás.

## Proč ne ty levné placené varianty

Pořád jsou levné, ale kartu chtějí, a ta sem nepatří.

| Varianta | Proč ne |
|---|---|
| `gpt-5-nano` (0,05 / 0,40 USD za milion tokenů) | Nejlevnější placený text, ale bez kreditu neběží. |
| Chirp 3 HD, první milion znaků měsíčně zdarma | Pak 30 USD za milion znaků a fakturace musí být zapnutá. |
| Cloud Run, minimum instancí 0 | Volný měsíční limit demo pokryje, účet k fakturaci je stejně nutný. |

## Co ještě není hotové

- Napojení `gemini-3.5-flash-lite` do `/v1/analyze`. Dnes tam běží `lexicon-1`.
- Hlas v prohlížeči (ZF-16 / ZF-17). Teď není.
- Kvalita a latence na pilotních stránkách. Porovnání se přesouvá k napojení Gemini do `/v1/analyze`.
