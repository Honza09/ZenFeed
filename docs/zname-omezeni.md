# Známá omezení a zbytková rizika (ZF-22)

Souhrn omezení, která jsou zapsaná v jednotlivých dokumentech, na jednom místě. Nic z toho není nové zjištění: u každého bodu je zdroj, kde je popsaný podrobně. Stav k 19. 11. 2026. Když se omezení odstraní, smaže se odsud i ze zdroje.

## Klasifikace (co se skryje)

- **Klasifikátor je slovník, ne model** (`lexicon-2`). Na anotovaných blocích skryje zhruba 38 % bloků, které se skrýt mají, a z jeho skrytí je zhruba 87 % správných. **Cíl 80 % respektování preferencí zatím splněný není.** Zdroj: [`testing/pilot/lexicon-2.md`](testing/pilot/lexicon-2.md).
- Slovník nepozná zápor („nikdo nezemřel“), ironii ani kontext. Událost popsaná bez klíčového slova se nepozná vůbec. Zdroj: tamtéž.
- Nejistá shoda (slabé vodítko) vede k `review`, tedy blok zůstane viditelný. Neskrytý nežádoucí blok je proto častější než neoprávněné skrytí. Zdroj: [`API.md`](API.md), [`kategorie-mvp.md`](kategorie-mvp.md).
- Napojení modelu na `/v1/analyze` je týmové rozhodnutí (kvóta, odesílání textu Googlu i při analýze). Zdroj: [`rozhodnuti-zf-25.md`](rozhodnuti-zf-25.md).

## Dělení stránky a skrývání

- Analyzuje se jen obsah, který je už načtený. Obsah v iframech, shadow DOM a na canvasu se nerozdělí. Zdroj: [`segmentation.md`](segmentation.md).
- Obalový blok přes celý článek ani buňka tabulky se nikdy neskryjí, i když výsledek zní `hide`. Jejich obsah zůstane viditelný, dokud tým nerozhodne variantu B ze ZF-07. Zdroj: [`hiding.md`](hiding.md).
- Krátké položky pod 25 znaků nejsou bloky, takže je nejde skrýt. Dlouhá stránka se zpracuje jen do 400 bloků. Zdroj: [`segmentation.md`](segmentation.md), [`edge-states.md`](edge-states.md).
- Po obnovení stránky nebo přechodu jinam se skrytí ztratí a stránka ukáže vše. Obsah, který přibude později, se sám neanalyzuje: popup jen oznámí, že přibyl. Zdroj: [`hiding.md`](hiding.md), [`popup.md`](popup.md).
- Stránka může na skrytí reagovat po svém (líné načítání, lepivé prvky). ZenFeed vrací své změny, ne to, co stránka udělá v reakci na ně. Zdroj: [`hiding.md`](hiding.md).
- Obsah za paywallem nebo přihlášením se nepozná jako „nepřístupný“. Uživatel uvidí „žádný čitelný obsah“ nebo běžný výsledek pro viditelnou část. Zdroj: [`edge-states.md`](edge-states.md).

## Shrnutí

- **Viditelný text se posílá do Google Gemini** (bezplatná vrstva) a Google ho může použít ke zlepšování svých produktů. Popup to uvádí před kliknutím. Skrytý obsah se neposílá. Zdroj: [`privacy.md`](privacy.md), [`summarize.md`](summarize.md).
- Shrnutí se kontroluje jen na tvar a délku, ne na obsah. Při ručním průchodu sedělo až na jeden vymyšlený zdroj. Věrnost se dál měří. Zdroj: [`testing/zf-31-vernost.md`](testing/zf-31-vernost.md).
- Zbytkové riziko: prompt žádá model, aby neposlouchal pokyny z textu stránky, a text jde jako data v JSON, ale žádný prompt prompt injection úplně nevyloučí. Zdroj: [`summarize.md`](summarize.md).
- Shrnuje se nejvýš prvních 30 000 znaků viditelného textu. Denní limit bezplatné vrstvy není zaručený, po jeho vyčerpání shrnutí do dalšího dne hlásí chybu. Zdroj: [`summarize.md`](summarize.md).

## Hlas

- Čte se hlasem, který je nainstalovaný v systému. Když chybí hlas pro daný jazyk, přehrávač to oznámí a shrnutí zůstane čitelné. Zdroj: [`voice-player.md`](voice-player.md).
- Čtení skončí, když se popup zavře. Hlas se řídí jazykem shrnutí, a ten jazykem stránky, takže stránka se špatně uvedeným jazykem dostane špatný výchozí hlas. Zdroj: tamtéž.
- Je to obecný syntetický hlas, ne hlas pojmenované historické postavy (čeká na ověření ochranných známek, ZF-26). Zdroj: [`hlas-a-oznaceni.md`](hlas-a-oznaceni.md).

## Provoz

- Backend běží jen lokálně na `http://127.0.0.1:8000`. Jiná adresa nebo hostovaný backend vyžaduje změnu v rozšíření (`analyze-client.js`, `summary-client.js`) a v `host_permissions`. Zdroj: [`popup.md`](popup.md), [`architecture.md`](architecture.md).
- Rozšíření se instaluje jen jako rozbalené (Developer mode), v Chrome Web Store není.
- Automatický end-to-end test používá Brave, protože Chrome 137+ nepovoluje `--load-extension`. Ruční instalace přes „Load unpacked“ v Chrome funguje normálně. Zdroj: `tests/extension/popup-e2e.mjs`.

## Měření a hodnocení

- Pilotní anotace navrhl Claude a potvrdila Libuše, takže nejsou nezávislé. Rozšířená sada R01–R12 byla při ladění `lexicon-2` měřena opakovaně, a proto je pro finální hodnocení „viděná“. Zdroj: [`testing/pilot/lexicon-2.md`](testing/pilot/lexicon-2.md), `CLAUDE.md`.
- Finální 24stránková sada se dvěma hodnotiteli (ZF-19) ještě není hotová. Čísla výše jsou z pilotu a rozšířené sady, ne z finálního hodnocení.
- Latence je změřená jen lokálně, s falešným Gemini a v headless prohlížeči. Čas do shrnutí se skutečným modelem, začátek skutečného audia a semantic similarity změřené nejsou. Zdroj: [`testing/mereni-latence.md`](testing/mereni-latence.md).
- Test s uživateli (ZF-33) a evaluace dabingu (ZF-34) zatím neproběhly.
