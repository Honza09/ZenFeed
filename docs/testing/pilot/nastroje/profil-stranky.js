// Pomůcka pro ZF-04/ZF-19: vloží se do konzole prohlížeče (DevTools) na otevřené stránce.
// Jen ČTE strukturu aktuální stránky, nic nestahuje, nic neposílá, nic nemění.
// Výstup je JSON jedním řádkem k zapsání do tabulky kandidátů (kandidati-pro-zf-19.md).
(() => {
  const q = (s) => document.querySelectorAll(s).length;
  const depth = (e) => { let d = 0; while (e && e !== document.documentElement) { d++; e = e.parentElement; } return d; };
  const ps = [...document.querySelectorAll('p')].filter((p) => p.innerText.trim().length > 40);
  const ds = ps.map(depth).sort((a, b) => a - b);
  const adSel = '[data-component="ad-slot"],[class*="ad-slot"],[id^="google_ads"],[id^="div-gpt"],ins.adsbygoogle,[class*="AdSlot"]';
  const profile = {
    url: location.origin + location.pathname,      // bez query a hash
    lang: document.documentElement.lang || null,
    title: document.title.slice(0, 80),
    article: q('article'), main: q('main'), section: q('section'),
    h2: q('h2'), h3: q('h3'), p: ps.length,
    pMaxDepth: ds.length ? ds[ds.length - 1] : 0,
    pMedDepth: ds.length ? ds[Math.floor(ds.length / 2)] : 0,
    adLike: q(adSel),
    iframes: q('iframe'),
    textLen: document.body.innerText.length,
    scrollHeight: document.documentElement.scrollHeight,
    ts: new Date().toISOString(),
  };
  console.log(JSON.stringify(profile));
  return profile;
})();
