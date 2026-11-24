# Bake one grey shaded-relief image per country, in the same frame as the country map (cmaps.projector).
# Source: Natural Earth "Gray Earth with Shaded Relief" 10m raster (GRAY_HR_SR.tif, public domain, naturalearthdata.com).
# Usage: python mk_relief.py /path/to/GRAY_HR_SR.tif   (needs Pillow and numpy; the raster is not kept in this repository)
import sys, os, json, math
import numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmaps
from paths import path
Image.MAX_IMAGE_PIXELS = None
src = sys.argv[1] if len(sys.argv) > 1 else path("relief_src")
R = np.asarray(Image.open(src).convert("L")); RH, RW = R.shape
REPO = path("gain_story"); CJ = json.load(open(REPO + "/assets/countries/countries.json"))["countries"]
OUT = os.path.join(HERE, "..", "relief"); os.makedirs(OUT, exist_ok=True)
W, SC = 560, 2
def frame(nm):
    # the same numbers cmaps.projector uses, kept so the frame can be inverted
    pg = cmaps.GEO[nm]; big = max(cmaps.area(pp[0]) for pp in pg); keep = [pp for pp in pg if cmaps.area(pp[0]) >= big * 0.15]
    xs = [cmaps.merc(*q)[0] for pp in keep for q in pp[0]]; ys = [cmaps.merc(*q)[1] for pp in keep for q in pp[0]]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys); span = max(x1 - x0, y1 - y0, 0.6); pad = span * 0.08
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad
    k = W / (x1 - x0); H = int(min(560, max(260, (y1 - y0) * k))); k = min(k, H / (y1 - y0))
    return x0, y1, k, (W - (x1 - x0) * k) / 2, (H - (y1 - y0) * k) / 2, H
n = 0
for iso in sorted(CJ):
    p = REPO + "/assets/countries/" + iso + ".json"
    if not os.path.exists(p): continue
    cj = json.load(open(p)); nm = cmaps.ATLAS.get(iso) or CJ[iso]["name"]
    if not cj.get("land") or nm not in cmaps.GEO: continue
    x0, y1, k, ox, oy, H = frame(nm)
    if abs(H - int(cj["h"])) > 1: print("skip", iso, "frame differs"); continue
    px = (np.arange(W * SC) + .5) / SC; py = (np.arange(H * SC) + .5) / SC
    lon = x0 + (px - ox) / k; my = y1 - (py - oy) / k
    lat = np.degrees(2 * np.arctan(np.exp(np.radians(my))) - math.pi / 2)
    fx = ((lon + 180) % 360) / 360 * RW - .5; fy = (90 - lat) / 180 * RH - .5
    ix = np.floor(fx).astype(int); iy = np.clip(np.floor(fy).astype(int), 0, RH - 2); tx = (fx - ix)[None, :]; ty = (fy - iy)[:, None]
    a = ix % RW; b = (ix + 1) % RW
    v = (R[iy][:, a] * (1 - tx) + R[iy][:, b] * tx) * (1 - ty) + (R[iy + 1][:, a] * (1 - tx) + R[iy + 1][:, b] * tx) * ty
    im = Image.fromarray(np.clip(v, 0, 255).astype(np.uint8), "L")
    # keep the light and shadow, drop the broad lowland/highland tint, then centre on mid grey
    base = np.asarray(im.filter(ImageFilter.GaussianBlur(28 * SC / 2)), dtype=np.float32)
    d = np.asarray(im.filter(ImageFilter.GaussianBlur(0.8)), dtype=np.float32) - base
    sd = float(d.std()) or 1.0; d = np.clip(d / max(sd, 2.5) * 30, -110, 110) + 128
    Image.fromarray(d.astype(np.uint8), "L").save(os.path.join(OUT, iso + ".jpg"), quality=72, optimize=True); n += 1
print(n, "relief images in", os.path.abspath(OUT))
