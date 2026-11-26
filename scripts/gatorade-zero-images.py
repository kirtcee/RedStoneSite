# Run from the project folder:  python3 scripts/gatorade-zero-images.py
# (needs Pillow, numpy, scipy). Makes the Gatorade Zero bottle cut-outs:
#   source-photos/drinks/gatorade-zero/*.png  ->  public/images/drinks/gatorade-zero-*.webp
# Berry and Glacier Cherry came transparent. Grape and Lemon Lime came on
# white, and their white labels touch the background, so a normal "remove
# the white" also eats the label. They're the same 20 oz bottle in the same
# framing as Glacier Cherry, so Glacier Cherry's outline is used as their
# stencil. All are sized like the other Gatorades (215 mm tall at 4 px/mm,
# see scripts/drink-images.py).
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "source-photos/drinks/gatorade-zero"
OUT = "public/images/drinks"
H = round(215 * 4.0)


def crop(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox())


def white_bg(im):
    a = np.asarray(im.convert("RGB")).astype(int)
    bg_like = (a.min(axis=2) > 232) & (a.max(axis=2) - a.min(axis=2) < 20)
    lab, _ = ndimage.label(bg_like)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return np.isin(lab, list(edge))


def save(im, name):
    im = crop(im)
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    im.save(f"{OUT}/{name}.webp", "WEBP", quality=88, method=6)
    print(f"{name:28s} {im.size}")


stencil = Image.open(f"{SRC}/glacier-cherry.png").convert("RGBA").getchannel("A")
for name in ["berry", "glacier-cherry"]:
    save(Image.open(f"{SRC}/{name}.png").convert("RGBA"), f"gatorade-zero-{name}")
for name in ["grape", "lemon-lime"]:
    im = Image.open(f"{SRC}/{name}.png").convert("RGBA")
    body = Image.fromarray(((~white_bg(im)) * 255).astype(np.uint8))  # bottle outside the label
    alpha = Image.fromarray(np.maximum(np.asarray(stencil), np.asarray(body)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(alpha)
    save(im, f"gatorade-zero-{name}")
