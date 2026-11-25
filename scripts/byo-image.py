# Run from the project folder:  python3 scripts/byo-image.py
# (needs Pillow: pip install pillow). Writes public/images/byo-pepperoni.webp,
# the Build Your Own Pizza picture (menu card and cart thumbnail).
# The angled Pepperoni photo, shifted up and left so its top and left edges run
# slightly off the picture (like the old byo_thumb.png), with a soft shadow
# down and to the right. Transparent background.
import sys
from PIL import Image, ImageFilter

PUB = "/home/user/redstonesite/public/images"
OUT = sys.argv[1] if len(sys.argv) > 1 else f"{PUB}/byo-pepperoni.webp"
W, H = 564, 284          # same shape as the old 282x142 picture, at 2x
PIZZA_W = 560            # pizza width on the canvas
X, Y = -60, -92          # how far it runs off the left / top edge

im = Image.open(f"{PUB}/pizzas/angled/pepperoni.webp").convert("RGBA")
im = im.resize((PIZZA_W, round(im.height * PIZZA_W / im.width)), Image.LANCZOS)

# shadow from the pizza's own outline
blur = 12
a = im.getchannel("A").point(lambda v: int(v * 0.5))
sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
sh.putalpha(a)
pad = blur * 3
big = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
big.alpha_composite(sh, (pad, pad))
big = big.filter(ImageFilter.GaussianBlur(blur))

canvas = Image.new("RGBA", (W + 400, H + 400), (0, 0, 0, 0))  # room for the off-frame parts
o = 200
canvas.alpha_composite(big, (o + X - pad + 16, o + Y - pad + 14))
canvas.alpha_composite(im, (o + X, o + Y))
canvas = canvas.crop((o, o, o + W, o + H))
canvas.save(OUT, "WEBP", quality=88, method=6)
print("wrote", OUT, canvas.size)
