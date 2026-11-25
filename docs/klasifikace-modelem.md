# Klasifikace modelem (volitelná, ve výchozím stavu vypnutá)

> **Stav 25. 11. 2026:** připraveno a otestované s podvrženým modelem. **Ve výchozím stavu je vypnuté.** Zapnutí mění rozhodnutí ZF-25 (Gemini jen pro shrnutí), a proto ho **musí odsouhlasit tým**. Se skutečným klíčem to zatím nikdo nezměřil.

## Proč

Slovník `lexicon-2` skryje asi 38 % bloků, které skrýt má. Na pilotu nebyl správně ani jeden ze tří případů, kde se skrývat mělo ([`testing/metriky-zf-20.md`](testing/metriky-zf-20.md)). **Cíl 80 % respektování preferencí tak se slovníkem nesplníme.** Model chápe kontext, takže pozná i popis události bez klíčového slova. Jestli to stačí, ukáže až měření (níže).

## Jak to funguje

- Backend pošle celý požadavek `/v1/analyze` (nejvýš 100 bloků) **jedním voláním** Gemini. Z každého bloku jde jen prvních 1000 znaků.
- Model vrátí ke každému bloku téma, tón a jistotu podle zmrazených kategorií ([`kategorie-mvp.md`](kategorie-mvp.md)). Text definic je v `backend/app/services/model_classify.py` a **při změně kategorií se musí upravit i tam**.
- **O skrytí rozhoduje backend, ne model**, a to stejným pravidlem a prahem 0,7 jako u slovníku (`decide_action`). Nejistý výsledek (jistota pod 0,7) dá `review`, takže blok zůstane vidět.
- Text stránky jde modelu jako data v JSON a instrukce říká, že nic v něm není pokyn. Stejně se to dělá u shrnutí. Prompt injection to úplně nevyloučí ([`zname-omezeni.md`](zname-omezeni.md)).
- **Záloha:** když model selže (limit, timeout, výpadek, nesmyslná odpověď), použije se pro celý požadavek slovník. Bloky, ke kterým model neodpoví nebo odpoví špatně, určí taky slovník. `model_version` v odpovědi říká, kdo výsledek určil: `gemini/<model>`, `gemini/<model>+lexicon-2` nebo `lexicon-2`.
- Model má na odpověď čas analýzy minus 1,5 s (výchozí 10 s, tedy 8,5 s). Zbytek času je rezerva pro slovník, aby se rozšíření vždy dočkalo odpovědi.

## Soukromí

Se zapnutým modelem jde **text bloků Googlu už po kliknutí na Analyzovat**, ne jen po kliknutí na Shrnout. Popup to musí říct předem:
- Při otevření se zeptá `GET /health`. Ten neposílá nic ze stránky a vrátí `analyze_provider`.
- Podle odpovědi upozornění nad tlačítkem **Analyzovat** přesně řekne, jestli text zůstane v počítači, nebo půjde do Google Gemini.
- Než `/health` odpoví (nejvýš 1,5 s), ukazuje popup obecný text, který platí v obou případech. Upozornění tak není nikdy nepravdivé.

Podrobnosti jsou v [`privacy.md`](privacy.md).

## Jak zapnout

V `.env` na serveru (klíč už je tam kvůli shrnutí):

```text
ZENFEED_ANALYZE_PROVIDER=gemini
# volitelně jiný model než pro shrnutí:
# ZENFEED_ANALYZE_MODEL=gemini-3.5-flash-lite
```

Pak restartovat backend. `GET http://127.0.0.1:8000/health` vrátí `"analyze_provider": "gemini"`. Bez klíče server nenastartuje a řekne proč. Vypíná se smazáním řádku nebo hodnotou `lexicon`.

**Kvóta:** jedno volání na každých až 100 bloků. Stránka se 400 bloky tedy stojí 4 volání a k tomu jedno na shrnutí. Denní limit bezplatné vrstvy není zaručený ([`rozhodnuti-zf-25.md`](rozhodnuti-zf-25.md)). Po jeho vyčerpání klasifikace tiše přejde na slovník a funguje dál.

## Jak změřit, jestli to stojí za to (jen na ladicí sadě)

```bash
PYTHONPATH=backend python backend/scripts/evaluate_metrics.py docs/testing/pilot/anotace.csv --provider gemini
```

- Potřebuje `ZENFEED_AI_API_KEY` v prostředí (například `set -a; source .env; set +a`).
- Pošle úryvky pilotu Googlu, při 89 blocích jedno volání.
- Výsledek se porovná se stejným příkazem bez `--provider` (slovník): hlavně případy „s cílem“, neoprávněná skrytí a recall.
- **Finální sada ZF-19 se tímhle neladí.** Vyhodnotí se jednou, až tým rozhodne, kterým klasifikátorem (metodika §f).

## Co rozhoduje tým

1. Zda model zapnout. Cenou je kvóta a to, že text bloků jde Googlu i při analýze.
2. Pokud ano, **před finálním měřením ZF-19**, aby se finále měřilo tím klasifikátorem, který bude v demu.
3. Zda se má promítnout do dema a do popisu soukromí v prezentaci.

## Co je ověřené a co ne

**Ověřené (25. 11. 2026):**
- 21 unit testů backendu s podvrženým modelem: práh, fallback, špatné a chybějící odpovědi, časový limit, nastavení a že v logu není text.
- 3 testy rozšíření pro `/health`.
- End-to-end regrese 19 z 19 se slovníkem, včetně kontroly, že popup ukazuje upozornění pro slovník.
- Ruční běh v rozšíření se zapnutým modelem proti falešnému Gemini: `/health` hlásí `gemini`, popup ukáže upozornění o Googlu, a když falešný model neodpoví klasifikací, backend použije slovník (demo stránka skryla stejných 6 bloků). V logu není text ani klíč.

**Neověřené:**
- Kvalita skutečného modelu, latence, jestli název modelu existuje a skutečné limity. To vše čeká na běh se skutečným klíčem (příkaz výše).
