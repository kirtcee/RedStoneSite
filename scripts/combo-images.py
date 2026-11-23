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

def compose(parts, shift_y=0):
    # parts: [(image, x, y, shadow_k)] in any coordinates. The whole group is
    # centred on the white canvas, so smaller pizzas sit closer to the middle
    # and the gaps between the items stay the same in every combo.
    # If the group is too big for the canvas (with a margin), it's built on a
    # bigger canvas and shrunk to fit.
    x0 = min(x for _, x, _, _ in parts); x1 = max(x + im.width for im, x, _, _ in parts)
    y0 = min(y for _, _, y, _ in parts); y1 = max(y + im.height for im, _, y, _ in parts)
    m = 24
    s = max(1, (x1 - x0 + 2 * m) / W, (y1 - y0 + 2 * m) / H)
    cw, ch = round(W * s), round(H * s)
    c = Image.new("RGBA", (cw, ch), (255, 255, 255, 255))
    ox = round((cw - (x1 - x0)) / 2) - x0; oy = round((ch - (y1 - y0)) / 2) - y0 + shift_y
    for im, x, y, k in parts:
        place(c, im, x + ox, y + oy, k)
    if s > 1:
        print(f"  (shrunk to {1 / s:.0%} to fit)")
        c = c.resize((W, H), Image.LANCZOS)
    return c.convert("RGB")

BACK, FRONT = "veggie-lover", "meat-lover"  # every combo comes with 3 toppings
PLATE_W = 540     # wings plate: the same size in every combo
OVER_X = 110      # how far the wings plate tucks under the pizza's right edge
OVER_Y = 130      # and how far up it overlaps the pizza's bottom edge

def two_pizzas(back, front, width):
    b, f = pizza(back, width), pizza(front, width)
    k = width / 200
    # back pizza up and to the right, front pizza down and to the left, overlapping
    fx = -round(width * 0.42); fy = round(b.height * 0.54)
    return compose([(b, 0, 0, k), (f, fx, fy, k)])

def plate(count, width=PLATE_W):
    # wings plate photo: the biggest public/images/wings/plate-<n>.webp with
    # n <= count (an exact match when there is one), else the smallest
    import glob, re
    plates = sorted(int(re.search(r"plate-(\d+)", f).group(1)) for f in glob.glob(f"{PUB}/wings/plate-*.webp"))
    pick = max([n for n in plates if n <= count], default=plates[0])
    im = Image.open(f"{PUB}/wings/plate-{pick}.webp").convert("RGBA")
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def side(path, width):
    im = Image.open(f"{PUB}/{path}").convert("RGBA")
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def two_pizzas_front(back, front, pizza_w, item, over_x=OVER_X, over_y=OVER_Y):
    # 2 pizzas, plus one item (wings plate or garlic bread) in front on the right
    b, f = pizza(back, pizza_w), pizza(front, pizza_w)
    k = pizza_w / 200
    fx = -round(pizza_w * 0.64); fy = round(b.height * 0.37)
    ix = fx + f.width - over_x; iy = fy + f.height - over_y
    return [(b, 0, 0, k), (f, fx, fy, k), (item, ix, iy, k)]

def two_pizzas_wings(back, front, pizza_w, wings):
    return compose(two_pizzas_front(back, front, pizza_w, plate(wings)))

def pizza_wings(slug, pizza_w, wings):
    p, w = pizza(slug, pizza_w), plate(wings)
    k = pizza_w / 200
    return compose([(p, 0, 0, k), (w, p.width - OVER_X, p.height - OVER_Y, k)])

CANS = ["combo-can-pepsi", "combo-can-canada-dry", "combo-can-crush-orange", "combo-can-coke"]

def take_care(back, front, pizza_w, bread_w, can_h, can_step_x, can_step_y):
    # same layout as 2 Large + 20 Wings with the garlic bread in the wings'
    # place, plus the 4 pops in the top left in a diagonal: the first can is
    # lowest and in front, each next one steps right by can_step_x and up by
    # can_step_y and sits behind the one before it.
    # the bread plate tucks further in than the wings, so it overlaps the
    # pizzas a little and pulls them toward the centre (BREAD_OVER_X / _Y)
    parts = two_pizzas_front(back, front, pizza_w, side("sides/garlic-bread-plate.webp", bread_w),
                             BREAD_OVER_X, BREAD_OVER_Y)
    cans = [Image.open(f"{PUB}/drinks/{n}.webp").convert("RGBA") for n in CANS]
    cans = [im.resize((round(im.width * can_h / im.height), can_h), Image.LANCZOS) for im in cans]
    f, fx, fy = parts[1][0], parts[1][1], parts[1][2]
    # first can: its left side at the front pizza's left edge (+CAN_X), its
    # bottom CAN_TUCK px down behind the front pizza's left side
    x = fx + CAN_X; y = fy + round(f.height * 0.5) + CAN_TUCK - can_h
    can_parts = []
    for im in cans:
        can_parts.append((im, x, y, pizza_w / 200 * 0.6))
        x += can_step_x; y -= can_step_y
    return compose(can_parts[::-1] + parts)  # back can drawn first

CAN_X, CAN_TUCK = 10, -55
BREAD_OVER_X, BREAD_OVER_Y = 190, 200

def save(img, name):
    img.save(f"{OUT}/{name}.jpg", "JPEG", quality=84, optimize=True)
    print("saved", name)

for name, width in [("2-medium", 700), ("2-large", 780), ("2-xl", 860)]:
    save(two_pizzas(BACK, FRONT, width), name)

# 2 pizzas + wings (the plate is the same size in all of them)
save(two_pizzas_wings(BACK, FRONT, 600, 16), "2-medium-16-wings")
save(two_pizzas_wings(BACK, FRONT, 650, 20), "2-large-20-wings")
save(two_pizzas_wings(BACK, FRONT, 700, 25), "2-xl-25-wings")
# 1 pizza + wings
save(pizza_wings(FRONT, 600, 6), "small-6-wings")
save(pizza_wings(FRONT, 720, 12), "large-12-wings")
# 2 large pizzas + garlic bread + 4 pops
save(take_care(BACK, FRONT, 650, 580, 280, 105, 45), "takecare")

# Combos category cover on the menu page (3:2 tile): the Take Care image with
# white added at the sides so nothing gets cropped off the top or bottom
tc = Image.open(f"{OUT}/takecare.jpg"); cover = Image.new("RGB", (1350, 900), "white")
cover.paste(tc, ((1350 - tc.width) // 2, 0)); save(cover, "combos-cover")

# ======================= Deals page cover images =======================
# public/images/deals/*.jpg, same white 4:3 style as the combos.
import os
DEALS = f"{PUB}/deals"
os.makedirs(DEALS, exist_ok=True)

def item(path, width=None, height=None):
    im = Image.open(f"{PUB}/{path}").convert("RGBA")
    if width:
        return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)

def save_deal(img, name):
    img.save(f"{DEALS}/{name}.jpg", "JPEG", quality=84, optimize=True)
    print("saved deal", name)

# Large 2-Topping (2 pizza minimum): two specialty pizzas
save_deal(two_pizzas("deluxe", "hawaiian", 780), "large-2topping")

# Choose Any 2 or More: a pizza, wings, garlic bread and a poutine
def pick2():
    p = pizza("pepperoni", 560); k = 560 / 200
    w = plate(6, 400)
    b = item("sides/cheesy-garlic-bread-top.webp", width=330)
    pt = item("sides/poutine-top.webp", width=300)
    return compose([
        (p, 0, 0, k),
        (pt, p.width - 120, -40, k),
        (b, -60, p.height - 120, k),
        (w, p.width - 170, p.height - 150, k),
    ])
save_deal(pick2(), "pick2mix")

# 2 Medium Pizzas + 8 Wings
save_deal(two_pizzas_wings(BACK, FRONT, 600, 8), "2medium-8wings")

# Feed 4: 2 large pizzas, 8 wings, garlic bread, a 2L, 2 dips
def feed4():
    parts = two_pizzas_front(BACK, FRONT, 650, plate(8))
    b, bx, by, k = parts[0]; f, fx, fy, _ = parts[1]; w, wx, wy, _ = parts[2]
    bottle = item("drinks/2l-coke.webp", height=round(b.height * 1.2))
    bread = item("sides/garlic-bread-plate.webp", width=430)
    dip1 = item("dips/garlic-cut.webp", width=125); dip2 = item("dips/ranch-cut.webp", width=125)
    return compose([
        # the 2L stands behind the back pizza's right side
        (bottle, bx + b.width - round(bottle.width * 0.75), by + round(b.height * 0.78) - bottle.height, k * 0.6),
        (b, bx, by, k), (f, fx, fy, k),
        (bread, fx - 90, fy + f.height - 150, k),
        (w, wx, wy, k),
        (dip1, wx - 70, wy + w.height - 95, k * 0.5),
        (dip2, wx + 45, wy + w.height - 60, k * 0.5),
    ])
save_deal(feed4(), "feed-4")

# Party Combo: 3 large pizzas, 20 wings, garlic bread, a 2L, 3 dips
def party():
    pw = 600; k = pw / 200
    p1, p2, p3 = pizza(BACK, pw), pizza("pepperoni", pw), pizza(FRONT, pw)
    ph = p1.height
    w = plate(20)
    bottle = item("drinks/2l-pepsi.webp", height=round(ph * 1.3))
    bread = item("sides/garlic-bread-plate.webp", width=420)
    dips = [item(f"dips/{n}-cut.webp", width=120) for n in ("garlic", "ranch", "blue-cheese")]
    x2, y2 = 470, 20                  # back row: two pizzas side by side
    x3, y3 = 170, round(ph * 0.62)    # front pizza in the middle
    wx, wy = x3 + pw - 140, y3 + ph - 170
    bx, by = x3 - 250, y3 + ph - 170
    parts = [
        (bottle, x2 + pw - round(bottle.width * 0.7), y2 + round(ph * 0.7) - bottle.height, k * 0.6),
        (p1, 0, 0, k), (p2, x2, y2, k), (p3, x3, y3, k),
        (bread, bx, by, k),
        (w, wx, wy, k),
    ]
    for i, d in enumerate(dips):
        parts.append((d, wx - 150 + i * 100, wy + w.height - 80 + (i % 2) * 28, k * 0.5))
    return compose(parts)
save_deal(party(), "party")
