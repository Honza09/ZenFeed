"""Reprodukovatelný PNG graf z přiložených předpokladů. Vyžaduje Pillow."""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "zenfeed-adopce.json").read_text(encoding="utf-8"))
font_candidates = [
    Path("/System/Library/Fonts/Helvetica.ttc"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
]
font_file = next((p for p in font_candidates if p.exists()), None)
if font_file is None:
    raise RuntimeError("Není dostupný font s českou diakritikou; nastavte font_candidates.")

def font(size):
    return ImageFont.truetype(str(font_file), size)

canvas = Image.new("RGB", (1680, 1060), "#F7F9FC")
d = ImageDraw.Draw(canvas)
ink, muted = "#132C41", "#516679"
colors = ["#9AAFC2", "#338CC1", "#117C69"]
d.text((90, 50), data["title"], font=font(48), fill=ink)
d.text((90, 118), "Plánovací model • nejedná se o výsledky pilotu", font=font(29), fill=muted)

legend = [("Oslovení", colors[0]), ("První vyzkoušení", colors[1]), ("Opakované použití (SOM)", colors[2])]
for x, (label, color) in zip([95, 445, 925], legend):
    d.rounded_rectangle((x, 188, x + 26, 214), radius=5, fill=color)
    d.text((x + 40, 183), label, font=font(27), fill=ink)

left, top, right, bottom = 150, 300, 1585, 805
d.text((92, 253), "Počet osob", font=font(25), fill=muted)
scale = (bottom - top) / 60
for tick in range(0, 61, 10):
    y = bottom - tick * scale
    d.line((left, y, right, y), fill="#D8E1EA", width=2)
    label = str(tick)
    d.text((left - 25 - d.textlength(label, font=font(25)), y - 16), label, font=font(25), fill=muted)

for i, item in enumerate(data["scenarios"]):
    center = left + (i + 0.5) * (right - left) / 3
    trials = item["contacted"] * item["trial_rate"]
    returns = math.floor(trials * item["return_rate"] + 0.5)
    values = [item["contacted"], round(trials), returns]
    for j, value in enumerate(values):
        x = center + (j - 1) * 92 - 34
        y = bottom - value * scale
        d.rectangle((x, y, x + 68, bottom), fill=colors[j])
        text = str(value)
        d.text((x + 34 - d.textlength(text, font=font(29)) / 2, y - 42), text, font=font(29), fill=ink)
    title = item["name"]
    d.text((center - d.textlength(title, font=font(28)) / 2, 829), title, font=font(28), fill=ink)

d.text((90, 914), "SOM = oslovení × podíl vyzkoušení × podíl návratu; optimisticky 25,2 ≈ 25 osob.", font=font(25), fill=muted)
d.text((90, 955), "Zdroj: vlastní předpoklady, 22. 10. 2026; metodika a vstupy: VYZKUM-ZENFEED.md, část 5.", font=font(25), fill=muted)
d.text((90, 996), "Návrat znamená další dobrovolné použití při jiné návštěvě; nejde o platící zákazníky.", font=font(25), fill=muted)
canvas.save(ROOT / "zenfeed-adopce.png", optimize=True)
print(ROOT / "zenfeed-adopce.png")
