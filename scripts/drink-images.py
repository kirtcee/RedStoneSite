# Run from the project folder:  python3 scripts/drink-images.py
# (needs Pillow, numpy and scipy). Turns the photos in source-photos/drinks
# into transparent cut-outs in public/images/drinks/<name>.webp, all at the
# same scale: every can is exactly the same size, and bottles are sized to
# match real life (a 2L bottle is about 2.7 cans tall).
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
SRC = "source-photos/drinks"  # originals, kept out of public so they are not deployed
OUT = "public/images/drinks"
PX_PER_MM = 4.0                      # 122 mm can -> 488 px tall
CAN_H, CAN_W = round(122 * PX_PER_MM), None   # CAN_W = average can width, worked out below

CANS = {  # file -> name
    "Cokecan.png": "can-coke", "CokeZerocan.png": "can-coke-zero", "DietCokecan.png": "can-diet-coke",
    "DrPeppercan.png": "can-dr-pepper", "MugRootbeercan.png": "can-mug-root-beer", "Briskcan.png": "can-brisk",
    "Pepsican.png": "can-pepsi", "DietPepsican.png": "can-diet-pepsi", "CanadaDrycan.png": "can-canada-dry",
    "Spritecan.png": "can-sprite", "Crushorangecan.png": "can-crush-orange", "CrushGrapecan.png": "can-crush-grape",
    "CrushCreamSodacan.png": "can-crush-cream-soda",
}
BOTTLES = {  # file -> (name, real height in mm)
    "coke2l.avif": ("2l-coke", 330), "2lpepsi.avif": ("2l-pepsi", 330), "2lcanadadry.avif": ("2l-canada-dry", 330),
    "redbull.avif": ("red-bull", 134), "applejuice.avif": ("apple-juice", 170), "eskawaterbottle.jpeg": ("water", 205),
}
GATORADES = ("Gatorades.avif", ["gatorade-red", "gatorade-yellow", "gatorade-orange", "gatorade-blue"], 215)

def crop(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox())

def cut_white(im):
    # remove a white studio background: flood fill from the edges through
    # near-white pixels, keep everything else (holes inside are kept)
    a = np.asarray(im.convert("RGB")).astype(int)
    bg_like = (a.min(axis=2) > 232) & (a.max(axis=2) - a.min(axis=2) < 20)
    lab, _ = ndimage.label(bg_like)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    fg = ndimage.binary_fill_holes(~bg)
    alpha = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA"); out.putalpha(alpha)
    return out

def to_height(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)

def save(im, name):
    im.save(f"{OUT}/{name}.webp", "WEBP", quality=88, method=6)
    print(f"{name:24s} {im.size}")

cans = {n: crop(Image.open(f"{SRC}/{f}").convert("RGBA")) for f, n in CANS.items()}
CAN_W = round(CAN_H * np.median([c.width / c.height for c in cans.values()]))
for n, c in cans.items():          # every can stretched to exactly the same size
    save(c.resize((CAN_W, CAN_H), Image.LANCZOS), n)

bottles = {n: (to_height(crop(cut_white(Image.open(f"{SRC}/{f}"))), round(mm * PX_PER_MM))) for f, (n, mm) in BOTTLES.items()}
# the three 2L bottles stretched to the same width too
two_l = [n for n in bottles if n.startswith("2l-")]
w2 = round(np.median([bottles[n].width for n in two_l]))
for n in two_l:
    bottles[n] = bottles[n].resize((w2, bottles[n].height), Image.LANCZOS)
for n, im in bottles.items():
    save(im, n)

f, names, mm = GATORADES
g = crop(cut_white(Image.open(f"{SRC}/{f}")))
cols = np.asarray(g.getchannel("A")).max(axis=0) > 40
# split at the empty columns between bottles
runs, x = [], 0
while x < len(cols):
    if cols[x]:
        s = x
        while x < len(cols) and cols[x]: x += 1
        runs.append((s, x))
    x += 1
runs = [r for r in runs if r[1] - r[0] > 10]
assert len(runs) == len(names), runs
for (x0, x1), n in zip(runs, names):
    save(to_height(crop(g.crop((x0, 0, x1, g.height))), round(mm * PX_PER_MM)), n)

# ---- Menu tiles (Drinks page): a few drinks standing in a row on white ----
def tile(names, name, overlap=0.18, fill=0.86):
    TW, TH = 900, 600
    ims = [Image.open(f"{OUT}/{n}.webp").convert("RGBA") for n in names]
    k = TH * fill / max(i.height for i in ims)
    ims = [i.resize((round(i.width * k), round(i.height * k)), Image.LANCZOS) for i in ims]
    step = [round(i.width * (1 - overlap)) for i in ims]
    row_w = sum(step[:-1]) + ims[-1].width
    k2 = min(1, (TW * 0.92) / row_w)          # shrink to fit the width
    if k2 < 1:
        ims = [i.resize((round(i.width * k2), round(i.height * k2)), Image.LANCZOS) for i in ims]
        step = [round(i.width * (1 - overlap)) for i in ims]; row_w = sum(step[:-1]) + ims[-1].width
    c = Image.new("RGBA", (TW, TH), (255, 255, 255, 255))
    x = (TW - row_w) // 2; base = TH - round((TH - max(i.height for i in ims)) / 2)
    for i, st in zip(ims, step):
        y = base - i.height
        sh = Image.new("RGBA", c.size, (0, 0, 0, 0))
        blk = Image.new("RGBA", i.size, (0, 0, 0, 255)); blk.putalpha(i.getchannel("A").point(lambda v: int(v * 0.35)))
        sh.alpha_composite(blk, (x + 8, y + 10)); c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(9)))
        c.alpha_composite(i, (x, y)); x += st
    c.convert("RGB").save(f"{OUT}/{name}.jpg", "JPEG", quality=85, optimize=True)
    print("tile", name)

tile(["2l-coke", "2l-canada-dry", "2l-pepsi"], "tile-2l", overlap=0.12)
tile(["can-coke", "can-sprite", "can-crush-orange", "can-pepsi"], "tile-cans", overlap=0.06)
tile(["gatorade-red", "red-bull", "apple-juice", "water", "gatorade-blue"], "tile-other", overlap=0.15)
