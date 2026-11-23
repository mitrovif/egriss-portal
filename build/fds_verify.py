# SDG values from the UNHCR Forced Displacement Survey files (South Sudan 2023, Pakistan 2024, Zambia 2025).
# Reads the csv files of the public-use datasets (UNHCR Microdata Library, licensed access) from the folder given
# as first argument and prints, for every indicator, the share by population group. Only aggregates are written.
import sys, os, json
import pandas as pd, numpy as np

D = sys.argv[1]
rd = lambda f: pd.read_csv(os.path.join(D, f), low_memory=False)
low = lambda s: s.astype(str).str.strip().str.lower()
num = lambda s: pd.to_numeric(s.astype(str).str.replace("60 or more", "60"), errors="coerce")

def share(df, value, weight, by):
    """Weighted share of rows with value == 1 among rows with a value; returns {group: [percent, rows]}."""
    d = df[[value, weight] + by].dropna(subset=[value, weight])
    return {" | ".join(map(str, k if isinstance(k, tuple) else (k,))): [round(float(100 * np.average(x[value], weights=x[weight])), 1), int(len(x))]
            for k, x in d.groupby(by)}

# ---- definitions ---------------------------------------------------------------------------------------------
def improved_water(label):            # 6.1.1, current JMP: every source except unprotected wells and springs, surface water, other
    l = low(label)
    return pd.Series(np.where(l.isin(["nan", ""]), np.nan, np.where(l.str.contains("unprotected|surface|other"), 0, 1)), index=label.index)

def improved_sanitation(label):       # 6.2.1: any flush toilet, ventilated pit, pit latrine with slab, composting toilet
    l = low(label)
    ok = l.str.contains("flush|ventilated|with slab|compost") & ~l.str.contains("without slab")
    return pd.Series(np.where(l.isin(["nan", ""]), np.nan, ok.astype(int)), index=label.index)

FCS_WEIGHTS = [2, 3, 4, 4, 1, 1, .5, .5]  # cereals, pulses, dairy, meat-fish-eggs, vegetables, fruit, oil, sugar
def food_insecure(df, cols):          # 2.1.2 proxy: WFP Food Consumption Score of 35 or less
    days = df[cols].apply(pd.to_numeric, errors="coerce")
    return (days.mul(FCS_WEIGHTS, axis=1).sum(axis=1, skipna=False) <= 35).astype(float).where(days.notna().all(axis=1))

def yes_no(s):                        # 1 = yes, 0 = no, anything else (don't know, refused, not asked) left out
    l = low(s)
    return pd.Series(np.where(l.isin(["yes", "1", "1.0"]), 1.0, np.where(l.isin(["no", "0", "0.0", "2", "2.0"]), 0.0, np.nan)), index=s.index)

def registered(df):                   # 16.9.1: has a birth certificate, or birth registered with the civil authorities
    a, b = yes_no(df["HH_07a"]), yes_no(df["HH_07b"])
    return pd.Series(np.where((a == 1) | (b == 1), 1.0, np.where(a.isna() & b.isna(), np.nan, 0.0)), index=df.index)

out = {}
def put(country, code, national, areas=None, camps=None, extra=None):
    out.setdefault(country, {})[code] = {"national": national, "areas": areas or {}, "camps": camps or {}, **(extra or {})}
    print(country, code, national, extra or "")

# ---- South Sudan 2023 -----------------------------------------------------------------------------------------
G, W, A = "Intro_07_1", "wgh_samp_resc_pop", "admin1"
hh = rd("UNHCR_SSD_2023_FDS_data_main.csv"); ro = rd("UNHCR_SSD_2023_FDS_data_roster.csv")
ro["age"] = num(ro["ageYears"])
hh["v611"] = improved_water(hh["BD01"]); hh["v621"] = improved_sanitation(hh["SAN01"])
he = low(hh["HE01"]); hh["v711"] = np.where(he == "nan", np.nan, (~he.isin(["no electricity in household", "dry cell battery / torch", "other: specify"])).astype(int))
hh["v212"] = food_insecure(hh, ["Food_div%d" % i for i in range(1, 9)])
u5 = ro[ro.age < 5].copy(); u5["v1691"] = registered(u5); u5["v1691_pub"] = yes_no(u5["HH_07b"])
sc = ro[(ro.age >= 6) & (ro.age <= 17)].copy(); sc["v412"] = yes_no(sc["HH_Educ02a"]); sc["v412_all"] = (low(sc["HH_Educ02a"]) == "yes").astype(float)
for code, df, v, extra in (("6.1.1", hh, "v611", None), ("6.2.1", hh, "v621", None), ("7.1.1", hh, "v711", None), ("2.1.2", hh, "v212", None),
                           ("16.9.1", u5, "v1691", {"as_published": share(u5, "v1691_pub", W, [G])}),
                           ("4.1.2", sc, "v412", {"all_6_17_in_denominator": share(sc, "v412_all", W, [G])})):
    put("SSD", code, share(df, v, W, [G]), share(df[df[A].notna()], v, W, [A, G]), share(df[(df[G] == "Refugees") & df["Intro_camp_label"].notna()], v, W, ["Intro_camp_label"]), extra)

# ---- Pakistan 2024 --------------------------------------------------------------------------------------------
G, W, WP, A = "Intro_07", "wgh_strata_spec", "wgh_prov_spec", "Intro_03a_NUTS1"
hh = rd("UNHCR_PAK_2024_FDS_v2_data_main.csv"); ro = rd("UNHCR_PAK_2024_FDS_v2_data_roster.csv"); me = rd("UNHCR_PAK_2024_FDS_v2_data_member.csv")
ro["age"] = num(ro["agetouse"])
hh["v611"] = improved_water(hh["BD01"]); hh["v621"] = improved_sanitation(hh["SAN01"]); hh["v711"] = yes_no(hh["C070101"])
hh["v212"] = food_insecure(hh, ["Food11aa", "Food12a", "Food13a", "Food14a", "Food15a", "Food16a", "Food17a", "Food18a"])
u5 = ro[ro.age < 5].copy(); u5["v1691"] = registered(u5); u5["v1691_pub"] = yes_no(u5["HH_07b"])
# 8.5.2 on the randomly selected adult: employed = any of EMP01 to EMP05; unemployed = not employed, looked for work, available
emp = (low(me[["EMP01", "EMP02", "EMP03", "EMP04", "EMP05"]].stack()) == "yes").groupby(level=0).any().reindex(me.index, fill_value=False)
une = ~emp & (low(me["EMP25a"]) == "yes") & (low(me["EMP29"]) == "yes")
me["v852"] = np.where(emp | une, une.astype(float), np.nan)
me["v852_file"] = np.where(pd.to_numeric(me["labour_force"], errors="coerce") == 1, pd.to_numeric(me["unemployed"], errors="coerce"), np.nan)
for code, df, v, w, wp, extra in (("6.1.1", hh, "v611", W, WP, None), ("6.2.1", hh, "v621", W, WP, None), ("7.1.1", hh, "v711", W, WP, None), ("2.1.2", hh, "v212", W, WP, None),
                                  ("16.9.1", u5, "v1691", W, WP, {"as_published": share(u5, "v1691_pub", W, [G])}),
                                  ("8.5.2", me, "v852", "wgh_strata_spec_resp", "wgh_prov_spec_resp", {"derived_in_file": share(me, "v852_file", "wgh_strata_spec_resp", [G])})):
    put("PAK", code, share(df, v, w, [G]), share(df[df[A].notna()], v, wp, [A, G]) if A in df else {}, None, extra)

# ---- Zambia 2025 (coded answers; code lists from the value labels file) -------------------------------------------
G, W, A = "Intro_07", "wgh_strata_spec", "Intro_03a_NUTS1"
hh = rd("UNHCR_ZAM_2025_FDS_v2_data_main.csv"); ro = rd("UNHCR_ZAM_2025_FDS_v2_data_roster.csv")
code_in = lambda s, codes: pd.Series(np.where(s.isna(), np.nan, num(s).isin(codes).astype(int)), index=s.index)
hh["v611"] = code_in(hh["BD01"], [11, 12, 13, 14, 21, 31, 41, 51, 61, 71, 72, 91, 92])
hh["v621"] = code_in(hh["SAN01"], [11, 12, 13, 14, 18, 21, 22, 31])
hh["v711"] = code_in(hh["C070101"], [1])
hh["v212"] = food_insecure(hh, ["Food11aa", "Food12a", "Food13a", "Food14a", "Food15a", "Food16a", "Food17a", "Food18a"])
ro["age"] = num(ro["agetouse"]); u5 = ro[ro.age < 5].copy()
a, b = num(u5["HH_07a"]), num(u5["HH_07b"])
u5["v1691"] = np.where((a == 1) | (b == 1), 1.0, np.where(a.isin([1, 2]) | b.isin([1, 2]), 0.0, np.nan))
sc = ro[(ro.age >= 6) & (ro.age <= 17)].copy(); e = num(sc["HH_Educ02a"]); sc["v412"] = np.where(e == 1, 1.0, np.where(e == 2, 0.0, np.nan))
for code, df, v in (("6.1.1", hh, "v611"), ("6.2.1", hh, "v621"), ("7.1.1", hh, "v711"), ("2.1.2", hh, "v212"), ("16.9.1", u5, "v1691"), ("4.1.2", sc, "v412")):
    put("ZMB", code, share(df, v, W, [G]), share(df[df[A].notna()], v, W, [A, G]) if A in df else {})

if len(sys.argv) > 2: json.dump(out, open(sys.argv[2], "w"), indent=1)
