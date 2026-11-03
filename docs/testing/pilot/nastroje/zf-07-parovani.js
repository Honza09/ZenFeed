/* ZF-07: párování nalezených bloků extraktoru s referenčními bloky (pilot).
 *
 * Co to je: jednorázový měřicí skript z ZF-07, uložený kvůli opakovatelnosti. Žádná součást rozšíření.
 * Nic na stránce nemění, jen čte DOM. Nic nestahuje a neukládá.
 * Anotace (docs/testing/pilot/anotace.csv) jsou nepotvrzený návrh; výsledek platí jen vůči nim.
 *
 * Jak spustit (DevTools, konzole, na otevřené pilotní stránce, jen na stránkách, kde to dovolují podmínky použití):
 *   1. Vlož celý obsah extension/content/segmenter.js (nastaví globalThis.ZenFeedSegmenter).
 *   2. Vlož celý tento soubor.
 *   3. Spusť:  await zf07Run("P03")        // P01 … P06
 *   Výsledek je objekt (found, expected, sum se stavy, times, extras, multi, refs …).
 *
 * Rozdíl proti měření v ZF-07: tam jsem kód extraktoru vkládal do stránky jako text a pouštěl 3×
 * po sobě s novým načtením extraktoru. Tady se použije už načtený extraktor a 3 běhy proběhnou
 * po sobě; první běh je „za studena“. Logika párování je stejná.
 *
 * Pravidla párování (podle textu, ne podle pořadí):
 *  - Každý řádek textu nalezeného bloku (řádky odděluje "\n") se hledá v textu referenčních bloků
 *    (bez bílých znaků, bez ohledu na velikost písmen). Referenční blok se bere z locatoru v anotaci.
 *  - Řádky kratší než 8 znaků se nepočítají.
 *  - Řádek shodný s víc referenčními bloky se přičte jen těm, které blok potvrdily jednoznačnými řádky.
 *  - Řádek bez shody je cizí text (foreignChars).
 * Stavy referenčního bloku: correct, merged, split, foreign, missed, unresolved.
 *   correct   = jeden nalezený blok, žádný cizí text
 *   merged    = aspoň jeden jeho blok pokrývá i další referenční
 *   split     = víc nalezených bloků
 *   foreign   = jeden blok, ale s cizím textem
 *   unresolved = referenční blok už na stránce není
 * wide = element bloku je obal, který obsahuje víc referenčních bloků (skrytí by zakrylo víc, než má).
 * Pokrytí (cov) je informativní, do stavu nevstupuje.
 */
async function zf07Match(specs) {
  const norm = t => t.replace(/\s+/g, ' ').trim();
  const refs = specs.map(s => {
    let nodes = [];
    if (s.sel) { const n = document.querySelector(s.sel); if (n) nodes = [n]; }
    else if (s.js) { nodes = (0, eval)(s.js) || []; }
    nodes = [].concat(nodes);
    const text = nodes.map(n => norm(n.innerText || '')).join(' ').toLowerCase();
    return { id: s.id, nodes, text, cmp: text.replace(/\s+/g, ''), textLen: text.length };
  });
  const unresolved = refs.filter(r => !r.nodes.length).map(r => r.id);
  const times = []; let res;
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    res = globalThis.ZenFeedSegmenter.segmentPage();
    times.push({ wall: Math.round((performance.now() - t0) * 10) / 10, durationMs: res.stats.durationMs });
  }
  const info = res.blocks.map(b => {
    const chars = {}; let foreignChars = 0, total = 0;
    const hits = [];
    for (const leaf of b.text.split('\n')) {
      total += leaf.length;
      hits.push({ n: leaf.length, hit: refs.filter(r => r.textLen && r.cmp.includes(leaf.toLowerCase().replace(/\s+/g, ''))).map(r => r.id) });
    }
    const U = new Set(hits.filter(x => x.hit.length === 1).map(x => x.hit[0]));
    for (const x of hits) {
      if (x.n < 8) continue;
      if (!x.hit.length) { foreignChars += x.n; continue; }
      let c = x.hit.length === 1 ? x.hit : x.hit.filter(i => U.has(i));
      if (!c.length) c = [];
      for (const i of c) chars[i] = (chars[i] || 0) + x.n;
    }
    const wide = b.elements.some(e => refs.filter(r => r.nodes.some(n => n !== e && e.contains(n))).length >= 2);
    return { id: b.id, kind: b.kind, title: (b.title || b.text.slice(0, 50)).slice(0, 60), len: total, chars, touched: Object.keys(chars), foreignChars, wide };
  });
  const out = [];
  for (const r of refs) {
    const t = info.filter(f => f.touched.includes(r.id));
    let status;
    if (!r.nodes.length) status = 'unresolved';
    else if (!t.length) status = 'missed';
    else if (t.some(f => f.touched.length > 1)) status = 'merged';
    else if (t.length > 1) status = 'split';
    else if (t[0].foreignChars > 0) status = 'foreign';
    else status = 'correct';
    const cov = r.textLen ? Math.min(1, t.reduce((a, f) => a + f.chars[r.id], 0) / r.textLen) : null;
    out.push({ id: r.id, status, F: t.length > 4 ? t.length + ' blocks' : t.map(f => f.id), cov: cov == null ? null : Math.round(cov * 100) / 100, refLen: r.textLen, wide: t.some(f => f.wide) });
  }
  const extras = info.filter(f => !f.touched.length).map(f => ({ id: f.id, kind: f.kind, title: f.title, len: f.len }));
  const multi = info.filter(f => f.touched.length > 1).map(f => ({ id: f.id, kind: f.kind, title: f.title, len: f.len, nref: f.touched.length, foreignChars: f.foreignChars }));
  const foreignMixed = info.filter(f => f.touched.length === 1 && f.foreignChars > 0).map(f => ({ id: f.id, title: f.title, foreignChars: f.foreignChars }));
  const wideN = info.filter(f => f.wide).map(f => f.id);
  const sum = {}; for (const o of out) sum[o.status] = (sum[o.status] || 0) + 1;
  return { url: location.href, when: new Date().toISOString(), found: res.blocks.length, expected: refs.length, unresolved, sum, times, stats: res.stats, extras, multi, foreignMixed, wideN, refs: out };
}

/* Locatory pilotních stránek podle docs/testing/pilot/anotace.csv. */
var ZF07_P02_IDS = [
  "D4iCFgsHqfDeLPH9E",
  "HtSxuniKbmTtShnTS",
  "wSxXbwh4Lz8SkvNEJ",
  "tY5ngyYJgpnConuGy",
  "WzqmHveqMMTqA5iCw",
  "BZYRnnqo4io3cFTjm",
  "G6zBuBJnrrap43DZr",
  "FXhpBCHFHddX5aEjF",
  "iGmYMbKPyATtDPyYc",
  "3GLhvh3t77hkxgzeq",
  "2Ky3Sj2osuxaLpL6h",
  "vXscH7g8GqCoLq3me",
  "Bao25ThWuG5LeTyvm",
  "fwosy98tLPttjvkuu",
  "SiDPf6C5XmryQgzzp",
  "5K2ontwdxW3qM6vCS",
  "Kyw55nML5nHbst3aK",
  "k9peASDxE3TxzSNxz",
  "CMfYqp3Sw75QKKXGz",
  "RW5GBLFFXuSCY559b",
  "p8uP7GpvvLzeLBJDy",
  "xmYSsxcn3pWukj35f",
  "WbivFym9KRCCFZbwN",
  "9JepyLQdwN6rnSoqq"
];
var ZF07_P03_PATHS = [
  "/blogs/spacestation/2026/11/02/week-starts-with-spacewalk-preps-and-li",
  "/image-article/nasas-chapea-crew-returns-to-earth/",
  "/solar-system/skywatching/whats-up-november-20",
  "/blogs/swift/2026/11/02/nasas-swift-observator",
  "/news-release/nasa-invites-media-to-northrop-grumman-crs-25-station-re",
  "/blogs/tsis-2/2026/11/02/nasas-mission-to-stud",
  "/missions/hubble/nasas-hubble-uncovers-case-of",
  "/image-article/apod-2026-november-2-a-long-clo",
  "/earth/earth-observatory/pennsylvanias-grand-c",
  "/image-article/apod-2026-november-1-colors-of-",
  "/image-article/apod-2026-october-31-night-on-a",
  "/news-release/nasa-releases-max-power-key-events-for-media-participant",
  "/blogs/spacestation/2026/10/30/space-crops-and-advanced-tech-wrap-up-w",
  "/image-article/nasas-james-webb-space-telescope-captures-eerie-cats-he",
  "/missions/hubble/nasa-explores-potential-comme",
  "/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-luna",
  "/solar-system/skywatching/night-sky-network/no",
  "/image-article/apod-2026-october-30-haunting-t",
  "/earth/earth-observatory/vega-island-frozen-in",
  "/photojournal/map-showing-potential-origins-of",
  "/photojournal/slice-of-martian-meteorite-tegha",
  "/centers-and-facilities/johnson/halloween-aboard-the-international-spa",
  "/blogs/spacestation/2026/10/29/spacewalkers-install-roll-out-solar-arr",
  "/solar-system/planets/mars/nasa-funded-study-details-one-of-oldest-mar",
  "/blogs/tracers/2026/10/29/nasas-tracers-first-"
];
var ZF07_P04_SLUGS = [
  "one-in-ten-people-in-the-world-is-over-65-how-does-this-compare-in-the-youngest-and-oldest-countries",
  "how-is-life-at-different-levels-of-gdp-per-capita",
  "in-china-more-than-one-in-five-workers-is-still-employed-in-agriculture",
  "the-world-is-getting-more-of-its-electricity-from-renewables-but-less-from-nuclear-power",
  "no-matter-what-poverty-line-you-choose-the-share-below-it-has-declined-globally",
  "at-the-peak-of-the-hiv-epidemic-aids-caused-more-than-half-of-all-deaths-in-some-countries",
  "how-many-people-in-the-world-identify-with-a-particular-religion",
  "a-long-term-perspective-on-humanitys-battle-against-malaria",
  "china-reduced-extreme-poverty-fast-but-indonesia-hasnt-been-far-behind",
  "what-share-of-plastic-waste-ends-up-in-the-ocean",
  "the-living-planet-index-reports-a-73-average-decline-in-studied-wildlife-populations",
  "child-mortality-has-declined-in-all-world-regions",
  "electricity-generation-per-person-in-the-united-kingdom-has-fallen-by-a-third-from-its-early-2000s-peak",
  "europe-is-older-but-latin-america-is-aging-faster",
  "the-united-states-is-the-worlds-largest-oil-producer",
  "foreign-aid-contributions-fell-in-2025-amongst-almost-all-of-the-top-10-donors",
  "electric-car-sales-are-growing-rapidly-in-turkey",
  "after-a-decade-of-growth-indonesia-has-become-the-worlds-largest-producer-of-processed-nickel",
  "beef-production-has-been-the-largest-driver-of-deforestation-this-century",
  "haiti-and-the-dominican-republic-share-the-last-caribbean-island-with-endemic-malaria"
];
var ZF07_PAD = (n, i) => String(i + 1).padStart(n, '0');

var ZF07_SPECS = {
  P01: () => [
    ['P01-B001', 'div#introduction'],
    ['P01-B002', 'div.article-block__key-insights'],
    ['P01-B003', 'section.article-block__research-and-writing'],
    ['P01-B004', 'div.article-block__gray-section'],
    ['P01-B005', 'section.article-block__all-charts'],
  ].map(([id, sel]) => ({ id, sel })).concat([{ id: 'P01-B006', js: "document.querySelector('#article-endnotes').parentElement" }]),
  P02: () => ZF07_P02_IDS.map((s, i) => ({ id: 'P02-B' + ZF07_PAD(3, i), sel: 'article#' + CSS.escape(s) }))
    .concat([{ id: 'P02-B025', sel: 'div.content-base' }]),
  // živá stránka má absolutní href, anotace relativní; hledá se část cesty
  P03: () => ZF07_P03_PATHS.map((p, i) => ({ id: 'P03-B' + ZF07_PAD(3, i), sel: '.hds-content-item:has(a[href*="' + p + '"])' })),
  P04: () => ZF07_P04_SLUGS.map((s, i) => ({ id: 'P04-B' + ZF07_PAD(3, i), sel: 'main#latest-page-root > article#' + CSS.escape(s) })),
  P05: () => [0, 1, 2, 3, 4, 5].map(i => ({ id: 'P05-B00' + (i + 1), sel: '#mw-content-text .mw-parser-output > section[data-mw-section-id="' + i + '"]' })),
  // B001 = perex, B002…B008 = sekce od h2 po další h2 v div#asset_213980
  P06: () => {
    const c = document.querySelector('div#asset_213980.wysiwyg_content');
    const n = c ? c.querySelectorAll('h2').length : 0;
    const rng = i => "(()=>{const h=[...document.querySelector('div#asset_213980.wysiwyg_content').querySelectorAll('h2')];const out=[h[" + i + "]];for(let n=h[" + i + "].nextElementSibling;n&&n.tagName!=='H2';n=n.nextElementSibling)out.push(n);return out;})()";
    const specs = [{ id: 'P06-B001', sel: 'div.wysiwyg_content.perex_content > p' }];
    for (let i = 0; i < n; i++) specs.push({ id: 'P06-B' + ZF07_PAD(3, i + 1), js: rng(i) });
    return specs;
  },
};

async function zf07Run(pageId) { return zf07Match(ZF07_SPECS[pageId]()); }
