# Run from the project folder:  python3 scripts/share-images.py
# (needs Pillow and fontTools: pip install pillow fonttools brotli)
# Writes:
#   public/images/share/og.jpg          1200x630 link preview (iMessage,
#                                       Facebook, Instagram DMs, Google...)
#   public/apple-touch-icon.png         180x180 iPhone home-screen icon
#   public/icon-192.png, icon-512.png   Android home-screen icons
import io
import os
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
LOGO = Image.open(os.path.join(PUB, "images", "redstonelogo(WHITE).png")).convert("RGBA")
LOGO = LOGO.crop(LOGO.getbbox())


def brand_font(size):
    # Red Stone Face (always-950 "Max" cut), converted from the site's woff2
    f = TTFont(os.path.join(PUB, "fonts", "RedStoneFace-ExtraBlack.woff2"))
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def pizza(slug, width):
    im = Image.open(os.path.join(PUB, "images", "pizzas", "angled", f"{slug}.webp")).convert("RGBA")
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def with_shadow(canvas, im, x, y, blur=18, off=(14, 18), alpha=0.6):
    a = im.getchannel("A").point(lambda v: int(v * alpha))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    sh.putalpha(a)
    pad = blur * 3
    big = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    big.alpha_composite(sh, (pad, pad))
    big = big.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(big, (x - pad + off[0], y - pad + off[1]))
    canvas.alpha_composite(im, (x, y))


def fit(img, max_w, max_h):
    k = min(max_w / img.width, max_h / img.height)
    return img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)


# ---- link preview 1200x630 ----
W, H = 1200, 630
og = Image.new("RGBA", (W, H), (17, 17, 17, 255))
# warm glow behind the pizzas
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((560, 40, 1320, 760), fill=(139, 26, 26, 150))
og.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))
# pizzas running off the right edge
with_shadow(og, pizza("hawaiian", 560), 790, -40)
with_shadow(og, pizza("pepperoni", 640), 600, 250)
# logo + words on the left
logo = fit(LOGO, 470, 225)
og.alpha_composite(logo, (70, 110))
d = ImageDraw.Draw(og)
font = brand_font(64)
d.text((72, 380), "ORDER ONLINE", font=font, fill=(255, 255, 255, 255))
d.text((72, 452), "CARRYOUT & DELIVERY", font=brand_font(40), fill=(229, 196, 160, 255))
os.makedirs(os.path.join(PUB, "images", "share"), exist_ok=True)
og.convert("RGB").save(os.path.join(PUB, "images", "share", "og.jpg"), quality=86, optimize=True, progressive=True)

# ---- home-screen icons: the logo on black ----
for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    mark = fit(LOGO, round(size * 0.84), round(size * 0.84))
    icon.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    icon.convert("RGB").save(os.path.join(PUB, name), optimize=True)

print("wrote og.jpg, apple-touch-icon.png, icon-192.png, icon-512.png")
