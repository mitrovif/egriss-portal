# Merges the recalculation results (verify/*.json) into the demo data: one verified definition per published value.
import json, os
H = os.path.dirname(os.path.abspath(__file__))
def J(n):
    p = os.path.join(H, "verify", n); return json.load(open(p)) if os.path.exists(p) else {"rows": [], "vars": {}, "areas": {}}
ISO = {"South Sudan": "SSD", "Pakistan": "PAK", "Zambia": "ZMB"}
FILES = {"SSD": "UNHCR_SSD_2023_FDS_data_%s.csv", "PAK": "UNHCR_PAK_2024_FDS_v2_data_%s.csv", "ZMB": "UNHCR_ZAM_2025_FDS_v2_data_%s.csv"}
GV = {"SSD": ("Intro_07_1", "wgh_samp_resc_pop", ["Refugees", "Host community North"]), "PAK": ("Intro_07", "wgh_strata_spec", ["Refugees", "Host community"]), "ZMB": ("Intro_07", "wgh_strata_spec", ["Refugees", "Host Community"])}
FOODS = ["Food_div%d" % i for i in range(1, 9)]; FOODP = ["Food11aa", "Food12a", "Food13a", "Food14a", "Food15a", "Food16a", "Food17a", "Food18a"]
WAT = "Every source except unprotected well, unprotected spring, surface water and 'other'. Tanker, cart and packaged water count (current JMP list)"
SAN = "Any flush or pour-flush toilet (including flush to open drain), ventilated improved pit, pit latrine with slab, composting toilet"
FCS = "Food Consumption Score of 35 or less: days eaten in the last 7, weighted cereals 2, pulses 3, dairy 4, meat, fish and eggs 4, vegetables 1, fruit 1, oil 0.5, sugar 0.5"
HHD = "Households with an answer"
# (iso, code): what, vars, numerator, denominator, level, file part, weight override
F = {
 "6.1.1": ("Main source of drinking water", ["BD01"], WAT, HHD, "Households", "main"),
 "6.2.1": ("Type of toilet facility", ["SAN01"], SAN, HHD, "Households", "main"),
 "2.1.2": ("Days each of 8 food groups was eaten in the last 7", None, FCS, "Households with all eight answers", "Households", "main"),
 "16.9.1": ("Whether the child has a birth certificate, and whether the birth is registered", ["HH_07a", "HH_07b"], "Has a birth certificate, or the birth is registered with the civil authorities", "Children under 5 with an answer to either question", "Household members", "roster"),
 "4.1.2": ("Whether each child is currently going to school", ["HH_Educ02a"], "Yes", "Children aged 6 to 17 with a yes or no answer", "Household members", "roster"),
}
def fds_rows():
    V = J("fds.json"); out = {}
    for country, iso in ISO.items():
        gv, w, gs = GV[iso]
        for code, x in V.get(iso, {}).items():
            if code == "7.1.1":
                m = ("Main source of electricity", ["HE01"], "Any source except 'no electricity', 'dry cell battery / torch' and 'other'", HHD, "Households", "main") if iso == "SSD" else \
                    ("Electricity access tier, derived by UNHCR in the file", ["C070101"], "Tier 1 or above", HHD, "Households", "main")
            elif code == "8.5.2":
                m = ("Work in the last 7 days, job search in the last 30 days, availability within 14 days", ["EMP01", "EMP02", "EMP03", "EMP04", "EMP05", "EMP25a", "EMP29"],
                     "Not employed (no to EMP01 to EMP05), looked for a paid job (EMP25a) and could start within 14 days (EMP29)", "Employed plus unemployed among the randomly selected adults", "One randomly selected adult per household", "member")
            else: m = F[code]
            vars_ = m[1] or (FOODS if iso == "SSD" else FOODP)
            ww = "wgh_strata_spec_resp" if code == "8.5.2" else w
            age = {"SSD": "ageYears"}.get(iso, "agetouse")
            if code in ("16.9.1", "4.1.2"): vars_ = vars_ + [age]
            nat = x["national"]
            out[(country, code)] = {"what": m[0], "vars": vars_, "num": m[2], "den": m[3], "lvl": m[4], "file": FILES[iso] % m[5], "w": ww, "gv": gv,
                                    "rc": [nat.get(gs[0], [None])[0], nat.get(gs[1], [None])[0]], "n": [nat.get(gs[0], [0, 0])[1], nat.get(gs[1], [0, 0])[1]],
                                    "g": gs, "script": "fds", "x": {k: v for k, v in x.items() if k not in ("national", "areas", "camps")}, "third": {k: v for k, v in nat.items() if k not in gs}}
    return out
def agent_rows():
    out = {}; vq = {}; areas = {}
    for f in ("unhcr.json", "wb.json", "dhs_mics.json"):
        d = J(f)
        for r in d["rows"]:
            rc = r.get("recalc") or {}
            out[(r["country"], r["sdg"])] = {"what": None, "vars": r.get("vars") or [], "num": r.get("numerator_codes") or "", "den": r.get("denominator") or "", "lvl": (r.get("level") or "").capitalize(),
                "file": r.get("file") or "", "w": r.get("weight") or "", "gv": r.get("group_var") or "", "rc": [rc.get("g1"), rc.get("g2")], "n": [(r.get("n") or {}).get("g1"), (r.get("n") or {}).get("g2")],
                "g": [r.get("g1") or "", r.get("g2") or ""], "match": r.get("match"), "notes": r.get("notes") or "", "mnote": r.get("match_note") or "", "script": f[:-5]}
        for k, v in d["vars"].items():
            vq[k] = {"q": v.get("label") or "", "cats": [[str(c[0]), str(c[1])] for c in (v.get("cats") or [])][:12], "more": max(0, (v.get("n_cats_in_file") or len(v.get("cats") or [])) - 12),
                     "src": "Label stored in the survey file" + (" (" + v["source"] + ")" if v.get("source") else ""), "url": "", "note": ""}
        areas.update(d.get("areas") or {})
    return out, vq, areas
def status(pub, rc):
    ds = [abs(p - r) for p, r in zip(pub, rc) if p is not None and r is not None]
    if not ds: return "none"
    return "ok" if max(ds) <= 0.5 else "near" if max(ds) <= 1.5 else "diff"
