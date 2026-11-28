# Run from the project folder:  python3 scripts/deal-pizza-images.py
# (needs Pillow). Makes the cover images for the "1-topping / 3-topping
# pizza by size" deals: public/images/deals/{small,medium,large,xl}-{1,3}topping.jpg
#   1 topping:  the Pepperoni photo
#   3 toppings: the Deluxe photo (pepperoni, mushroom, green pepper)
# Every image is the same 1200x900 white canvas and the pizza's width is
# in proportion to its real size (10", 12", 14", 16"), so side by side on
# the deals page the sizes compare correctly.
from PIL import Image, ImageFilter

PUB = "public/images"
W, H = 1200, 900
XL_WIDTH = 0.80 * W  # the 16" pizza's width; the others scale from it
SIZES = {"small": 10, "medium": 12, "large": 14, "xl": 16}
PHOTOS = {1: "pepperoni", 3: "deluxe"}


def pizza(slug, width):
    im = Image.open(f"{PUB}/pizzas/angled/{slug}.webp").convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox())
    return im.resize((round(width), round(im.height * width / im.width)), Image.LANCZOS)


def place(canvas, im, x, y, k):
    # soft shadow down and to the right (same look as the combo images)
    a = im.getchannel("A").point(lambda v: int(v * 0.5))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    sh.putalpha(a)
    blur = max(4, round(10 * k))
    pad = blur * 3
    big = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    big.alpha_composite(sh, (pad, pad))
    canvas.alpha_composite(big.filter(ImageFilter.GaussianBlur(blur)), (x - pad + round(10 * k), y - pad + round(14 * k)))
    canvas.alpha_composite(im, (x, y))


for toppings, slug in PHOTOS.items():
    for name, inches in SIZES.items():
        k = inches / 16
        im = pizza(slug, XL_WIDTH * k)
        c = Image.new("RGBA", (W, H), (255, 255, 255, 255))
        # all pizzas sit on the same "table line" so they read as one set,
        # high enough that the card's Add Coupon button doesn't cover them
        floor = round(H * 0.72)
        x = (W - im.width) // 2
        y = floor - im.height
        place(c, im, x, y, k)
        out = f"{PUB}/deals/{name}-{toppings}topping.jpg"
        c.convert("RGB").save(out, "JPEG", quality=85, optimize=True, progressive=True)
        print("saved", out, im.size)
