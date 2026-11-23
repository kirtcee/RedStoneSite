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

def plate(count, width):
    # wings plate photo: the biggest public/images/wings/plate-<n>.webp with
    # n <= count (an exact match when there is one), else the smallest
    import glob, re
    plates = sorted(int(re.search(r"plate-(\d+)", f).group(1)) for f in glob.glob(f"{PUB}/wings/plate-*.webp"))
    pick = max([n for n in plates if n <= count], default=plates[0])
    path = f"{PUB}/wings/plate-{pick}.webp"
    im = Image.open(path).convert("RGBA")
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def two_pizzas_wings(back, front, pizza_w, wings, plate_w):
    c = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    k = pizza_w / 200
    b, f, w = pizza(back, pizza_w), pizza(front, pizza_w), plate(wings, plate_w)
    # pizzas further back (upper part), wings plate in front on the right
    bx = W - b.width - round(W * 0.03); by = round(H * 0.03)
    fx = round(W * 0.03); fy = round(H * 0.20)
    wx = W - w.width - round(W * 0.02); wy = H - w.height - round(H * 0.03)
    place(c, b, bx, by, k)
    place(c, f, fx, fy, k)
    place(c, w, wx, wy, k)
    return c.convert("RGB")

def pizza_wings(slug, pizza_w, wings, plate_w):
    c = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    k = pizza_w / 200
    p, w = pizza(slug, pizza_w), plate(wings, plate_w)
    px_ = round(W * 0.03); py = round((H - p.height) * 0.12)
    wx = W - w.width - round(W * 0.02); wy = H - w.height - round(H * 0.04)
    place(c, p, px_, py, k)
    place(c, w, wx, wy, k)
    return c.convert("RGB")

def save(img, name):
    img.save(f"{OUT}/{name}.jpg", "JPEG", quality=84, optimize=True)
    print("saved", name)

for name, width in [("2-medium", 700), ("2-large", 780), ("2-xl", 860)]:
    save(two_pizzas("cheese", "pepperoni", width), name)

# 2 pizzas + wings (plate grows with the wing count)
save(two_pizzas_wings("cheese", "pepperoni", 600, 16, 560), "2-medium-16-wings")
save(two_pizzas_wings("cheese", "pepperoni", 650, 20, 600), "2-large-20-wings")
save(two_pizzas_wings("cheese", "pepperoni", 700, 25, 640), "2-xl-25-wings")
# 1 pizza + wings
save(pizza_wings("pepperoni", 760, 6, 540), "small-6-wings")
save(pizza_wings("pepperoni", 840, 12, 590), "large-12-wings")
