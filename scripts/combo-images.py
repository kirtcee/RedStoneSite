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

CANS = ["can-pepsi", "can-canada-dry", "can-crush-orange", "can-coke"]

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
