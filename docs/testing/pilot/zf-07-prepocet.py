#!/usr/bin/env python3
"""ZF-07: přepočet odvozených metrik ze surových počtů (zf-07-surova-mereni.json).
Vstup: zf-07-surova-mereni.json. Výstup: tabulka na stdout a (s --csv) kopie šablony měření.
Pracovní předpoklad (musí potvrdit tým, NENÍ v proposalu): tolerantní varianta = pokrytí >= 0,80
a cizí obsah <= 5 % znaků bloku. Striktní varianta tyto prahy nepoužívá."""
import csv, json, statistics, sys, math
from pathlib import Path
here = Path(__file__).parent
raw = json.loads((here / "zf-07-surova-mereni.json").read_text(encoding="utf-8"))
COV, FOR = 0.80, 0.05
def p95(v):  # nearest-rank
    s = sorted(v); return s[max(0, math.ceil(0.95 * len(s)) - 1)]
rows, tot = {}, dict(exp=0, mea=0, found=0, strict=0, lenient=0)
for pid, p in raw["pages"].items():
    st = {k: [r for r in p["refs"].values() if r[0] == k] for k in ("correct","merged","split","foreign","missed","unresolved")}
    strict = len(st["correct"])
    lenient = sum(1 for r in p["refs"].values() if (r[0] == "correct" and r[1] >= COV) or (r[0] == "foreign" and r[1] >= COV and r[2] <= FOR))
    meas = sum(1 for r in p["refs"].values() if r[0] != "unresolved")
    assert meas == p["measurable"] and len(p["refs"]) == p["expected"], pid
    rows[pid] = dict(exp=p["expected"], mea=meas, found=p["found"], strict=strict, lenient=lenient,
                     med=statistics.median(p["times_ms"]), p95=p95(p["times_ms"]), mx=max(p["times_ms"]),
                     stat={k: len(v) for k, v in st.items() if v})
    for k in tot:
        if k in rows[pid]: tot[k] += rows[pid][k]
print("page  exp mea found  strict(%mea) lenient(%mea) found/exp  median p95 max  stavy")
for pid, r in rows.items():
    print(f"{pid}  {r['exp']:3d} {r['mea']:3d} {r['found']:5d}  {r['strict']:3d} ({100*r['strict']/r['mea']:5.1f}%)  {r['lenient']:3d} ({100*r['lenient']/r['mea']:5.1f}%)  {r['found']/r['mea']:6.2f}  {r['med']:5.1f} {r['p95']:4d} {r['mx']:3d}  {r['stat']}")
print(f"SUM  {tot['exp']:3d} {tot['mea']:3d} {tot['found']:5d}  {tot['strict']:3d} ({100*tot['strict']/tot['mea']:5.1f}%)  {tot['lenient']:3d} ({100*tot['lenient']/tot['mea']:5.1f}%)  strict/expected(90)={100*tot['strict']/tot['exp']:.1f}%")
allt = [t for p in raw["pages"].values() for t in p["times_ms"]]
print("vsechny behy ms: median", statistics.median(allt), "p95", p95(allt), "max", max(allt), "n", len(allt))
# bez P01 a P05 (zvlášť, jen informativně)
sub = [k for k in rows if k not in ("P01","P05")]
print("bez P01,P05: strict", sum(rows[k]['strict'] for k in sub), "z", sum(rows[k]['mea'] for k in sub))
if "--csv" in sys.argv:
    src = list(csv.DictReader(open(here / "sablona-mereni.csv", encoding="utf-8")))
    fn = list(src[0].keys()); out = []
    for row in src:
        p = raw["pages"][row["page_id"]]; r = rows[row["page_id"]]
        for run in (1, 2, 3):
            n = dict(row)
            n.update(datum_mereni=raw["datum"], verze_rozsireni=raw["verze_rozsireni"][:12], beh=str(run),
                     nalezene_bloky=str(p["found"]), spravne_oddelene_bloky=str(r["strict"]),
                     cas_extrakce_ms=str(p["times_ms"][run-1]), pocet_chyb="0", hodnotitel="Claude agent",
                     poznamky_k_reprodukci=(f"stav {p['snapshot_utc']}; extraktor ZF-03 (segmenter.js beze změny) spuštěn v panelu prohlížeče; segmentace nezávisí na nastavení; "
                       f"měřitelných očekávaných bloků {r['mea']} z {r['exp']}; klasifikace nenaměřena; anotace = nepotvrzený návrh"))
            out.append(n)
    with open(here / "sablona-mereni-zf-07.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(out)
    print("zapsáno", len(out), "řádků")
