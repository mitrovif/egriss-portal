import json, os, subprocess, time
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mdl")
def get(url):
    r = subprocess.run(["curl", "-sS", "-m", "60", "-A", "Mozilla/5.0", url], capture_output=True, text=True).stdout
    try: return json.loads(r)
    except Exception: return {}
FOODP = ["Food11aa","Food12a","Food13a","Food14a","Food15a","Food16a","Food17a","Food18a"]
want = {
 "1175": ("UNHCR_SSD_2023_FDS_v2.1", ["HH_07a","admin1","Intro_camp_label","ID_00","ID_01a","ID_01b","ID_03","ID_09"]),
 "1421": ("UNHCR_PAK_2024_FDS_v2.1", ["HH_07a","wgh_prov_spec","Intro_03a_NUTS1","wgh_strata_spec_resp","labour_force","unemployed","employed"]),
 "1423": ("UNHCR_ZMB_2025_FDS_v2.1", ["Intro_07","BD01","SAN01","C070101","HH_07a","HH_07b","HH_Educ02a","agetouse","wgh_strata_spec","Intro_03a_NUTS1"] + FOODP),
}
out = json.load(open(os.path.join(D, "labels.json")))
for sid, (idno, names) in want.items():
    p = os.path.join(D, sid + "_vars.json")
    if not os.path.exists(p):
        json.dump(get(f"https://microdata.unhcr.org/index.php/api/catalog/{idno}/variables"), open(p, "w"))
    vs = json.load(open(p)).get("variables", [])
    byname = {}
    for v in vs: byname.setdefault(v["name"].lower(), []).append(v)
    print(sid, len(vs), "variables")
    for n in names:
        if f"{sid}:{n}" in out: continue
        cands = byname.get(n.lower())
        if not cands: print("missing", sid, n); continue
        best = None
        for v in cands:   # same name can sit in several files; keep the one with wording or categories
            m = get(f"https://microdata.unhcr.org/index.php/api/catalog/{idno}/variable/{v['vid']}").get("variable", {}).get("metadata", {})
            cats = [(c.get("value"), c.get("labl")) for c in (m.get("var_catgry") or []) if c.get("labl")]
            rec = {"name": v["name"], "labl": (v["labl"] or "").strip(), "fid": v["fid"], "vid": v["vid"], "qstn": (m.get("var_qstn_qstnlit") or "").strip(), "universe": (m.get("var_universe") or "").strip(), "cats": cats}
            if best is None or (len(rec["labl"]) + len(cats)) > (len(best["labl"]) + len(best["cats"])): best = rec
            time.sleep(0.25)
            if best["labl"] and best["cats"]: break
        out[f"{sid}:{n}"] = best
        print(sid, n, "|", best["labl"][:70], "|", best["qstn"][:50], "|", len(best["cats"]), best["cats"][:2])
json.dump(out, open(os.path.join(D, "labels.json"), "w"), ensure_ascii=False, indent=1)
