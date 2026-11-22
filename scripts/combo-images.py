# Run from the project folder:  python3 scripts/combo-images.py
# (needs Pillow: pip install pillow). Rewrites public/images/combos/*.jpg.
# Builds the combo card images from the transparent angled pizza photos.
import sys
from PIL import Image, ImageFilter
PUB = "/home/user/redstonesite/public/images"
OUT = sys.argv[1] if len(sys.argv) > 1 else f"{PUB}/combos"
W, H = 1200, 900  # 4:3, white

def pizza(slug, width):
    im = Image.open(f"{PUB}/pizzas/angled/{slug}.webp").convert("RGBA")
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def shadow_of(im, dx, dy, blur, alpha):
    # soft shadow from the pizza's own outline (same idea as the menu cards)
    a = im.getchannel("A").point(lambda v: int(v * alpha))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(a)
    pad = blur * 3
    big = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    big.alpha_composite(sh, (pad, pad))
    return big.filter(ImageFilter.GaussianBlur(blur)), pad

def place(canvas, im, x, y, k):
    sh, pad = shadow_of(im, 0, 0, round(6 * k), 0.5)
    canvas.alpha_composite(sh, (x - pad + round(7 * k), y - pad + round(8 * k)))
    canvas.alpha_composite(im, (x, y))

def two_pizzas(back, front, width):
    c = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    k = width / 200  # shadow scale: card pizzas are ~200px wide on screen
    b, f = pizza(back, width), pizza(front, width)
    # back pizza up and to the right, front pizza down and to the left, overlapping
    bx = W - b.width - round(W * 0.04); by = round((H - b.height) * 0.18)
    fx = round(W * 0.04); fy = H - f.height - round((H - f.height) * 0.16)
    place(c, b, bx, by, k)
    place(c, f, fx, fy, k)
    return c.convert("RGB")

for name, width in [("2-medium", 700), ("2-large", 780), ("2-xl", 860)]:
    two_pizzas("cheese", "pepperoni", width).save(f"{OUT}/{name}.jpg", "JPEG", quality=84, optimize=True)
    print("saved", name)
