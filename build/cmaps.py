# Country maps in the GAIN story's own frame: outline, UNHCR locations, IDP areas, and survey areas projected into it.
import json, os, re, math, sys
HERE = os.path.dirname(os.path.abspath(__file__))
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import path
REPO = path("gain_story")
CD = REPO + "/assets/countries/"
topo = json.load(open(REPO + "/tools/.cache/atlas50m.json"))
sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
ARCS = []
for arc in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in arc:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    ARCS.append(pts)
def ring(ids):
    out = []
    for i in ids:
        a = ARCS[i] if i >= 0 else ARCS[~i][::-1]
        out += a[1:] if out else a
    return out
def polys(geom):
    if geom['type'] == 'Polygon': return [[ring(r) for r in geom['arcs']]]
    if geom['type'] == 'MultiPolygon': return [[ring(r) for r in pg] for pg in geom['arcs']]
    return []
GEO = {g['properties']['name']: polys(g) for g in topo['objects']['countries']['geometries']}
ATLAS = {'COD': 'Dem. Rep. Congo', 'CAF': 'Central African Rep.', 'COG': 'Congo', 'SSD': 'S. Sudan', 'MDA': 'Moldova', 'PSE': 'Palestine', 'SYR': 'Syria', 'TUR': 'Turkey', 'XKX': 'Kosovo', 'MHL': 'Marshall Is.', 'LAO': 'Laos', 'CIV': "Côte d'Ivoire", 'USA': 'United States of America', 'GBR': 'United Kingdom', 'RUS': 'Russia', 'BIH': 'Bosnia and Herz.', 'DOM': 'Dominican Rep.', 'TZA': 'Tanzania', 'IRN': 'Iran', 'VEN': 'Venezuela', 'BOL': 'Bolivia'}
def merc(lon, lat):
    lat = max(-85, min(85, lat))
    return lon, math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))
def area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2
def projector(atlas_name, W=560):
    pg = GEO[atlas_name]
    big = max(area(pp[0]) for pp in pg)
    keep = [pp for pp in pg if area(pp[0]) >= big * 0.15]
    xs = [merc(*q)[0] for pp in keep for q in pp[0]]; ys = [merc(*q)[1] for pp in keep for q in pp[0]]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    span = max(x1 - x0, y1 - y0, 0.6); pad = span * 0.08
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad
    k = W / (x1 - x0); H = int(min(560, max(260, (y1 - y0) * k))); k = min(k, H / (y1 - y0))
    ox = (W - (x1 - x0) * k) / 2; oy = (H - (y1 - y0) * k) / 2
    def P(lon, lat):
        mx, my = merc(lon, lat); return (ox + (mx - x0) * k, oy + (y1 - my) * k)
    return P, H
def bbox(d):
    n = [float(v) for v in re.findall(r"-?\d+\.?\d*", d)]; return min(n[0::2]), max(n[0::2]), min(n[1::2]), max(n[1::2])
def rings(geom):
    for poly in (geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]):
        for r in poly: yield r
def adm(iso, atlas_name):
    cj = json.load(open(CD + iso + ".json")); P, H = projector(atlas_name)
    # check: the atlas outline projected here must land on the outline stored in the country file
    pg = GEO[atlas_name]; q = [P(*v) for pp in pg for v in pp[0]]
    q = [v for v in q if -5 <= v[0] <= 565 and -5 <= v[1] <= H + 5]
    mine = (min(v[0] for v in q), max(v[0] for v in q), min(v[1] for v in q), max(v[1] for v in q))
    print(iso, "frame check", [round(a - b, 1) for a, b in zip(mine, bbox(cj["land"]))], "H", H, cj["h"], file=sys.stderr)
    g = json.load(open(os.path.join(HERE, "bounds", iso + ".geojson"))); out = []
    for f in g["features"]:
        d = ""; best = None
        for r in rings(f["geometry"]):
            o = []
            for v in r:
                xy = P(*v[:2]); xy = (round(xy[0], 1), round(xy[1], 1))
                if not o or abs(xy[0] - o[-1][0]) + abs(xy[1] - o[-1][1]) > 0.9: o.append(xy)
            if len(o) < 4: continue
            d += "M" + "L".join("%g %g" % v for v in o) + "Z"
            xs = [v[0] for v in o]; ys = [v[1] for v in o]; ar = (max(xs) - min(xs)) * (max(ys) - min(ys))
            if not best or ar > best[0]: best = (ar, round((max(xs) + min(xs)) / 2, 1), round((max(ys) + min(ys)) / 2, 1))
        out.append({"n": f["properties"]["shapeName"], "d": d, "cx": best[1], "cy": best[2]})
    return out
def build(isos, full=("SSD", "PAK", "MOZ")):
    cm = {}
    for iso in isos:
        p = CD + iso + ".json"
        if not os.path.exists(p): continue
        cj = json.load(open(p))
        if not cj.get("land"): continue
        named = iso in full or len(cj["pts"]) <= 120
        m = {"w": cj["w"], "h": cj["h"], "land": cj["land"], "pts": [q if named else q[:4] for q in cj["pts"]]}
        if cj.get("near"): m["near"] = cj["near"]; m["nlab"] = cj.get("nlab") or []
        if os.path.exists(os.path.join(HERE, "..", "relief", iso + ".jpg")): m["rel"] = 1
        if "states" in cj and cj.get("areas"):
            tot = {}
            for a in cj["areas"]: tot[a[3]] = tot.get(a[3], 0) + (a[4] or 0)
            m["states"] = [[s[0], s[1], s[2], s[3], tot.get(s[1], 0)] for s in cj["states"]]
            if iso in full: m["areas"] = [[a[0], a[2], a[3], a[4]] for a in cj["areas"]]
            m["lay"] = {k: cj["layer"].get(k, "") for k in ("parent", "unit", "who", "cover")}; m["src"] = cj["areas_src"]
        cm[iso] = m
    return cm
if __name__ == "__main__":
    for iso, nm in (("PAK", "Pakistan"), ("SSD", "S. Sudan")):
        a = adm(iso, nm); print(iso, [(x["n"], x["cx"], x["cy"]) for x in a][:20])
    cm = build(["SSD", "PAK", "MOZ", "NGA", "ETH", "AFG", "COL"])
    for k, v in cm.items(): print(k, len(json.dumps(v)), len(v["pts"]), len(v.get("states", [])), len(v.get("areas", [])))
    print([a[1:] for a in cm["MOZ"]["areas"] if "emba" in a[1]], [s[1:] for s in cm["MOZ"]["states"]])
