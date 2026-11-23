# Run from the project folder:  python3 scripts/side-images.py
# (needs Pillow, numpy and scipy). Makes the side menu photos from the
# originals in source-photos/sides (kept out of public so they aren't deployed):
#  - poutines: overhead bowls on marble, cut out (the bowl is found as the
#    biggest dark shape) and put on white with a soft shadow, like the
#    garlic breads
#  - fries: already on white, just resized
#  - the Sides category cover on the menu's front page (3:2)
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
SRC = "source-photos/sides"; OUT = "public/images/sides"

def cut_bowl(path):
    im = Image.open(path).convert("RGB"); im.thumbnail((2000, 2000), Image.LANCZOS)
    a = np.asarray(im).astype(int)
    dark = a.max(axis=2) < 90
    lab, n = ndimage.label(dark)
    bowl = lab == (np.argmax(ndimage.sum(dark, lab, range(1, n + 1))) + 1)
    bowl = ndimage.binary_fill_holes(ndimage.binary_closing(bowl, iterations=6))
    ys, xs = np.where(bowl)
    oval = Image.new("L", im.size, 0)
    ImageDraw.Draw(oval).ellipse([xs.min(), ys.min(), xs.max(), ys.max()], fill=255)
    alpha = oval.filter(ImageFilter.GaussianBlur(1.5))
    out = im.convert("RGBA"); out.putalpha(alpha)
    return out.crop(alpha.point(lambda v: 255 if v > 12 else 0).getbbox())

def card(cut, name, h=590):
    # 900x675 white card, item centred with a soft shadow (same as garlic bread)
    im = cut.resize((round(cut.width * h / cut.height), h), Image.LANCZOS)
    c = Image.new("RGBA", (900, 675), (255, 255, 255, 255))
    x = (900 - im.width) // 2; y = (675 - h) // 2 - 6
    blk = Image.new("RGBA", im.size, (0, 0, 0, 255)); blk.putalpha(im.getchannel("A").point(lambda v: int(v * 0.45)))
    sh = Image.new("RGBA", c.size, (0, 0, 0, 0)); sh.alpha_composite(blk, (x + 12, y + 14))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14))); c.alpha_composite(im, (x, y))
    c.convert("RGB").save(f"{OUT}/{name}.jpg", "JPEG", quality=85, optimize=True)
    print("saved", name)

for n in ["poutine", "shawarma-poutine"]:
    cut = cut_bowl(f"{SRC}/{n}.jpg")
    cut.resize((1000, round(cut.height * 1000 / cut.width)), Image.LANCZOS).save(f"{OUT}/{n}-top.webp", "WEBP", quality=86, method=6)
    card(cut, n)

fries = Image.open(f"{SRC}/fries.png").convert("RGB")
fries.resize((900, 675), Image.LANCZOS).save(f"{OUT}/fries.jpg", "JPEG", quality=85, optimize=True)
print("saved fries")
# Sides cover: 3:2, fries photo with white added at the sides (nothing cropped)
cover = Image.new("RGB", (1629, 1086), "white")
cover.paste(fries, ((1629 - fries.width) // 2, 0))
cover.resize((1350, 900), Image.LANCZOS).save(f"{OUT}/sides-cover.jpg", "JPEG", quality=85, optimize=True)
print("saved sides-cover")
