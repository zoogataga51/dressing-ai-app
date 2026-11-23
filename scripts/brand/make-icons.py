"""Génère l'icône, l'écran de démarrage et les icônes Android aux couleurs de Dressing AI.
python3 scripts/brand/make-icons.py  (Pillow requis)"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

COBALT, PAPER, CORAL, INK, BUTTER = '#2B44C6', '#F6F3EE', '#FF5A3C', '#15151C', '#F6D867'
SYNE = 'node_modules/@expo-google-fonts/syne/800ExtraBold/Syne_800ExtraBold.ttf'

def mark(size, bg=None, letter=PAPER, mono=False, scale=1.0):
    """Le « D » en Syne avec son sticker « AI » penché (signature des stickers de l'appli)."""
    S = size * 4  # dessin en grand puis réduction = bords nets
    img = Image.new('RGBA', (S, S), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(SYNE, int(S * 0.46 * scale))
    box = d.textbbox((0, 0), 'D', font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    x, y = (S - w) / 2 - box[0] - S * 0.05 * scale, (S - h) / 2 - box[1] - S * 0.02 * scale
    d.text((x, y), 'D', font=font, fill='white' if mono else letter)
    # Sticker
    sw, sh = int(S * 0.27 * scale), int(S * 0.15 * scale)
    st = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    sd.rounded_rectangle((0, 0, sw - 1, sh - 1), radius=int(sh * 0.28), fill='white' if mono else CORAL)
    f2 = ImageFont.truetype(SYNE, int(sh * 0.62))
    b2 = sd.textbbox((0, 0), 'AI', font=f2)
    sd.text(((sw - (b2[2] - b2[0])) / 2 - b2[0], (sh - (b2[3] - b2[1])) / 2 - b2[1]), 'AI', font=f2,
            fill=(0, 0, 0, 0) if mono else INK)
    st = st.rotate(-8, resample=Image.BICUBIC, expand=True)
    if not mono:  # petite ombre portée
        shadow = Image.new('RGBA', st.size, (0, 0, 0, 0))
        shadow.paste((21, 21, 28, 70), mask=st.split()[3])
        shadow = shadow.filter(ImageFilter.GaussianBlur(S * 0.006))
        img.alpha_composite(shadow, (int(x + w * 0.62), int(y + h * 0.80 + S * 0.012)))
    img.alpha_composite(st, (int(x + w * 0.60), int(y + h * 0.78)))
    return img.resize((size, size), Image.LANCZOS)

mark(1024, bg=COBALT).convert('RGB').save('assets/icon.png')                 # iOS : pas de transparence
mark(1024, letter=COBALT, scale=0.9).save('assets/splash-icon.png')           # sur fond papier
mark(512, scale=0.62).save('assets/android-icon-foreground.png')              # zone sûre ~66 %
Image.new('RGB', (512, 512), COBALT).save('assets/android-icon-background.png')
mark(512, mono=True, scale=0.62).save('assets/android-icon-monochrome.png')
mark(48, bg=COBALT).save('assets/favicon.png')
print('Icônes générées dans assets/')
