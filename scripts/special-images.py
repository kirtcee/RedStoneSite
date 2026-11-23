# Run from the project folder:  python3 scripts/special-images.py
# (needs Pillow, numpy and scipy). Makes the Special Menu card photos
# (public/images/special-menu/*.jpg, 900x675) from the originals in
# source-photos/special-menu: each item is cut out of its white background
# and put back on white with a soft shadow underneath, like the sides.
# The panzerotti's left (unopened) piece is widened a little.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
SRC = "source-photos/special-menu"; OUT = "public/images/special-menu"
W, H = 900, 675

PANZ_PIVOT = 440     # px in the original: everything left of this gets wider
PANZ_STRETCH = 1.3   # how much wider (1.3 = 30%); the far left may go off frame
PANZ_EASE = 80       # px over which the stretch fades in (no visible crease)

def cut_white(im):
    a = np.asarray(im.convert("RGB")).astype(int)
    bg_like = (a.min(axis=2) > 236) & (a.max(axis=2) - a.min(axis=2) < 18)
    lab, _ = ndimage.label(bg_like)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ndimage.binary_fill_holes(~np.isin(lab, list(edge)))
    out = im.convert("RGBA")
    out.putalpha(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
    return out

def widen_left(im):
    # each output column left of the pivot reads from a column closer to it,
    # so the left part comes out wider; columns past the pivot are unchanged
    a = np.asarray(im)
    w = a.shape[1]
    x = np.arange(w, dtype=float)
    d = np.clip(PANZ_PIVOT - x, 0, None)
    s = PANZ_STRETCH
    src_d = d / s + (1 - 1 / s) * PANZ_EASE * (1 - np.exp(-d / PANZ_EASE))
    src_x = np.where(x < PANZ_PIVOT, PANZ_PIVOT - src_d, x)
    x0 = np.floor(src_x).astype(int).clip(0, w - 1); x1 = (x0 + 1).clip(0, w - 1)
    t = (src_x - np.floor(src_x))[None, :, None]
    out = a[:, x0].astype(float) * (1 - t) + a[:, x1].astype(float) * t
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")

def card(cut, name, fill=0.86, keep_left_edge=False):
    bbox = cut.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    if keep_left_edge:  # item already runs off the left side: keep it touching the frame
        bbox = (0, bbox[1], bbox[2], bbox[3])
    cut = cut.crop(bbox)
    k = min(W * fill / cut.width, H * fill / cut.height)
    if keep_left_edge:
        k = min((W * (fill + 1) / 2) / cut.width, H * fill / cut.height)
    im = cut.resize((round(cut.width * k), round(cut.height * k)), Image.LANCZOS)
    x = 0 if keep_left_edge else (W - im.width) // 2
    y = (H - im.height) // 2 - 8
    c = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    blk = Image.new("RGBA", im.size, (0, 0, 0, 255)); blk.putalpha(im.getchannel("A").point(lambda v: int(v * 0.42)))
    sh = Image.new("RGBA", c.size, (0, 0, 0, 0)); sh.alpha_composite(blk, (x + 10, y + 16))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(13))); c.alpha_composite(im, (x, y))
    c.convert("RGB").save(f"{OUT}/{name}.jpg", "JPEG", quality=85, optimize=True, progressive=True)
    print("saved", name, im.size)

card(widen_left(cut_white(Image.open(f"{SRC}/panzerotti.png"))), "panzerotti", keep_left_edge=True)
card(cut_white(Image.open(f"{SRC}/pizza-sub.png")), "pizza-sub", fill=0.86, keep_left_edge=True)  # the subs run off the left side in the photos
card(cut_white(Image.open(f"{SRC}/meatball-sub.png")), "meatball-sub", fill=0.86, keep_left_edge=True)
