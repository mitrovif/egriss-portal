# Scans the public link of each GAIN example that is a data source (survey, administrative data, census, data integration)
# and records where its questionnaire, report, data and methodology can be found. One further hop is made into microdata
# catalogues (NADA sites), where questionnaires sit under "related materials". Nothing is downloaded and kept: pages are read,
# PDFs are only identified. Sites that refuse automated access are recorded as such and left for a person to open.
# Usage: python mk_gain_docs.py   ->  build/gain_docs.json
import json, os, re, subprocess, sys, html
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(HERE, "..", "index.html"), encoding="utf-8").read(); Q, _ = json.JSONDecoder().raw_decode(s[s.index("Q = {") + 4:])
SN = ["Survey", "Administrative data", "Census", "Data integration"]
url = {}
for c in Q["ctry"].values():
    for e in c["ex"]: url[int(e[0])] = e[8]
for r in Q["reg"]: url[int(r[0])] = r[5] if len(r) > 5 else ""
KW = {"questionnaire": r"questionnaire|cuestionario|formulaire|formulario|fragebogen|survey instrument|boleta|questionário|анкет",
      "data": r"microdata|microdatos|microdonn|dataset|datos abiertos|open data|get-microdata|download data|base de datos|\.csv\b|\.xlsx?\b|\.zip\b|\.dta\b|\.sav\b|data-dictionary|variables?\b",
      "report": r"report|informe|rapport|bericht|publication|publicaci|relat[oó]rio|results|resultados|r[ée]sultats|\.pdf\b",
      "method": r"methodolog|metodolog|m[ée]thodolog|metadata|metadatos|technical note|nota t[ée]cnica|sampling|documentation|ddi"}
SKIP = re.compile(r"^(mailto:|javascript:|#|tel:)|facebook\.|twitter\.|x\.com/|linkedin\.|youtube\.|instagram\.|/login|/search\?|privacy|cookie|annual-report|sitemap", re.I)
def get(u, limit=3000000):
    p = subprocess.run(["curl", "-sL", "-m", "30", "--max-filesize", str(limit), "-A", "Mozilla/5.0 (compatible; research-link-check)", "-D", "-", "-o", "-", "--", u], capture_output=True)
    raw = p.stdout; head, _, body = raw.rpartition(b"\r\n\r\n") if b"\r\n\r\n" in raw else (b"", b"", raw)
    hs = raw[:8000].decode("latin-1", "ignore"); codes = re.findall(r"HTTP/[\d.]+ (\d{3})", hs); ct = re.findall(r"(?i)content-type:\s*([^\r\n;]+)", hs)
    return (codes[-1] if codes else "000"), (ct[-1].strip().lower() if ct else ""), raw
def links(base, page):
    out = []
    for href, txt in re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', page, flags=re.S | re.I):
        t = re.sub(r"\s+", " ", html.unescape(re.sub("<[^>]+>", " ", txt))).strip()[:120]
        if SKIP.search(href) or not (href.startswith("http") or href.startswith("/") or not href.startswith("#")): continue
        out.append((urljoin(base, html.unescape(href)), t))
    return out
def classify(ls):
    found = {k: [] for k in KW}
    for u, t in ls:
        pu = urlparse(u); hay = (pu.path + "?" + pu.query + " " + t).lower()  # not the host: a site called "microdata..." would match every link
        if re.fullmatch(r"(home|inicio|accueil|about.*|contact.*|news|login|english|fran[cç]ais|espa[nñ]ol|microdata catalog|data catalog|catalog|statistics|publications?|reports?|data|datasets?|search|faq|help|sitemap|terms.*|dissemination policy|download|more)", t.strip().lower()) and not re.search(r"\.(pdf|xlsx?|csv|zip|docx?)$", pu.path.lower()): continue
        for k, pat in KW.items():
            if re.search(pat, hay) and len(found[k]) < 4 and u not in [x[0] for x in found[k]] and len(t) > 2: found[k].append([u, t])
    return found
def scan(i):
    r = Q["sx"][i - 1]; u = url.get(i) or ""; rec = {"id": i, "year": r[0], "country": r[10], "title": r[8], "org": r[9], "types": [SN[k] for k in r[5] if k < 4], "url": u}
    if not u: rec["status"] = "no link"; return rec
    try:
        code, ct, raw = get(u)
    except Exception as x:
        rec["status"] = "error"; return rec
    rec["http"] = code
    if code in ("403", "401", "429"): rec["status"] = "refused automated access"; return rec
    if code != "200": rec["status"] = "not reachable"; return rec
    if "pdf" in ct or raw[:5] == b"%PDF-" or u.lower().split("?")[0].endswith(".pdf"):
        kind = "questionnaire" if re.search(KW["questionnaire"], (u + " " + r[8]).lower()) else "report"; rec["status"] = "document"; rec["found"] = {kind: [[u, "the linked PDF"]]}; return rec
    page = raw.decode("utf-8", "ignore"); ls = links(u, page); f = classify(ls); rec["status"] = "page read"
    low = page.lower(); host = urlparse(u).netloc
    cat = re.search(r"/catalog/(\d+)", u)
    if cat:  # a microdata catalogue entry: questionnaires and access conditions are on its own tabs
        base = u.split("/catalog/")[0] + "/catalog/" + cat.group(1)
        for tab in ("related-materials", "related_materials", "get-microdata", "get_microdata"):
            try:
                c2, ct2, raw2 = get(base + "/" + tab)
                if c2 == "200":
                    p2 = raw2.decode("utf-8", "ignore"); f2 = classify(links(base, p2))
                    for k in f2:
                        for x in f2[k]:
                            if x[0] not in [y[0] for y in f[k]] and len(f[k]) < 5: f[k].append(x)
                    if "microdata" in tab: low += " " + p2.lower()
            except Exception: pass
        rec["catalogue"] = base
    acc = "public" if re.search(r"public use|direct access|open data|acceso p[uú]blico|libre acc", low) else "licensed, on request" if re.search(r"licensed|licence|request access|on request|application for access|solicitud", low) else "not available" if re.search(r"data not available|no access|not available from", low) else ""
    if acc and (f["data"] or cat): rec["data_access"] = acc
    rec["found"] = {k: v for k, v in f.items() if v}
    return rec
ids = [i + 1 for i, r in enumerate(Q["sx"]) if any(k < 4 for k in r[5])]
with ThreadPoolExecutor(8) as ex: out = list(ex.map(scan, ids))
json.dump({"scanned": "2026-11-25", "note": "Public links only; found by keyword on link text and address, not checked by a person.", "rows": out}, open(os.path.join(HERE, "gain_docs.json"), "w"), ensure_ascii=False, indent=0)
import collections
print(collections.Counter(x["status"] for x in out)); print({k: sum(1 for x in out if k in x.get("found", {})) for k in KW}); print("catalogue entries", sum(1 for x in out if x.get("catalogue")), "| access", collections.Counter(x.get("data_access", "") for x in out))
