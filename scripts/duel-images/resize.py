"""Réduit les images brutes des duels pour l'appli : 480x640, JPEG qualité 80 → assets/duels/<id>.jpg
python3 scripts/duel-images/resize.py <dossier brut>"""
import os, sys
from PIL import Image
src = sys.argv[1]
os.makedirs('assets/duels', exist_ok=True)
total = 0
for f in sorted(os.listdir(src)):
    if not f.endswith('.jpg'): continue
    im = Image.open(os.path.join(src, f)).convert('RGB').resize((480, 640), Image.LANCZOS)
    out = os.path.join('assets/duels', f)
    im.save(out, 'JPEG', quality=80, optimize=True, progressive=True)
    total += os.path.getsize(out)
print(f'{len(os.listdir("assets/duels"))} images, {total // 1024} Ko au total')
