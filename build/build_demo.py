import csv, json, base64, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import path
REPO = path("gain_story")
BANK = path("bank")

rows = list(csv.DictReader(open(BANK, encoding="utf-8-sig")))

FR = {  # draft French for the English-language FDS questions
 "HH_00": "Depuis votre naissance / la naissance de ${member_name}, avez-vous / a-t-il/elle toujours vécu au Soudan du Sud ?",
 "ID_00": "De quel pays êtes-vous / ${member_name} est-il/elle citoyen(ne) ?",
 "ID_01a": "Lorsque vous viviez au Soudan du Sud, avez-vous / ${member_name} a-t-il/elle déjà dû fuir son domicile ?",
 "ID_01b": "Lorsque vous viviez en ${origincountry_label}, avez-vous / ${member_name} a-t-il/elle déjà dû abandonner son domicile ? Le domicile désigne votre maison et/ou vos terres.",
 "ID_02": "Quelle est la raison principale pour laquelle vous avez / ${member_name} a dû fuir son domicile ?",
 "ID_03": "Après avoir été forcé(e) de quitter votre/son domicile, avez-vous / ${member_name} a-t-il/elle dû franchir une frontière internationale ?",
 "ID_04": "Combien de temps êtes-vous / ${member_name} est-il/elle resté(e) à l'étranger ? Moins de 12 mois ou plus de 12 mois ?",
 "ID_05": "À l'étranger / au Soudan du Sud, avez-vous / ${member_name} a-t-il/elle demandé la protection internationale (enregistrement auprès du gouvernement ou du HCR) ? Avez-vous / a-t-il/elle déposé une demande d'asile ?",
 "ID_06": "À l'étranger / au Soudan du Sud, aviez-vous / ${member_name} avait-il/elle l'intention de demander la protection internationale (enregistrement auprès du gouvernement ou du HCR) ?",
 "ID_06b": "Quel est le résultat de votre demande de protection internationale ?",
 "ID_07": "Si vous le souhaitez / si ${member_name} le souhaite, pouvez-vous / peut-il/elle rentrer chez vous/lui ?",
 "ID_08": "Quelle est la raison principale pour laquelle vous ne pouvez pas / ${member_name} ne peut pas rentrer ?",
 "ID_09": "Quel est le principal document qui vous permet / permet à ${member_name} de rester dans le pays ?",
 "HH_06": "Dans quel pays êtes-vous / ${member_name} est-il/elle né(e) ?",
}

def pack(sid, limit=None):
    out = []
    for x in [r for r in rows if r["survey_id"] == sid][:limit]:
        loc = x["source_location"]
        url, page = "", ""
        if loc.startswith("http"):
            url, _, page = loc.partition(" p. ")
        q = {
            "id": x["qid"], "item": x["module_item"], "align": x["alignment"], "disc": x["discrepancy_type"],
            "orig": x["text_original"], "lang": x["language"],
            "en": x["text_en"], "enBy": x["translation_by"],
            "opts": [o.strip() for o in x["response_options"].split(";") if o.strip()],
            "uni": x["universe_skip"], "note": x["notes"],
            "url": url, "page": page.strip(), "loc": "" if url else loc,
        }
        if sid == "FDS_SSD_2023":
            q["fr"] = FR.get(x["qid"], "")
        out.append(q)
    return out

data = {
    "ssd": pack("FDS_SSD_2023"),
    "mli": pack("25bis_EMOP_MLI", 12),
}

# ---- whole bank, compact ----
surveys = []; sidx = {}
bank = []
for x in rows:
    k = x["survey_id"]
    if k not in sidx:
        sidx[k] = len(surveys); surveys.append([x["country"], x["survey"]])
    bank.append([sidx[k], x["qid"], x["module_item"], x["alignment"], x["discrepancy_type"], x["text_original"],
                 x["language"], x["text_en"] if x["language"] != "en" else "", 1 if x["translation_by"] != "original" else 0,
                 x["response_options"], x["notes"], x["universe_skip"]])
data["surveys"] = surveys; data["bank"] = bank

# ---- datasets behind calculated values, and outreach lists ----
SDG = path("sdg") + "/data/"
ds = {}
for x in csv.DictReader(open(SDG + "gain_sdg_values_calculated.csv", encoding="utf-8-sig")):
    src = x["source"].replace(" (shcamps refugee flag)", "")
    d = ds.setdefault((x["country"], src), {"country": x["country"], "src": src, "year": x["year"], "inds": []})
    if x["sdg"] not in d["inds"]: d["inds"].append(x["sdg"])
    d["year"] = d["year"] or x["year"]
data["datasets"] = sorted(ds.values(), key=lambda d: (-len(d["inds"]), d["country"]))
asks = []
for x in csv.DictReader(open(SDG + "census_sdg_tabulation_targets.csv", encoding="utf-8-sig")):
    asks.append({"country": x["country"], "what": "Census: tabulation of " + x["sdg_vars_in_census"], "who": x["nso"], "pop": x["identifies"], "status": x["route"], "ex": x["example"]})
for x in csv.DictReader(open(SDG + "nso_census_targets.csv", encoding="utf-8-sig")):
    asks.append({"country": x["country"], "what": x["source"] + ": " + x["ask"], "who": x["ask_who"], "pop": x["population"], "status": x["status"], "ex": ""})
for x in csv.DictReader(open(SDG + "mics_acquisition_targets.csv", encoding="utf-8-sig")):
    asks.append({"country": x["country"], "what": x["survey"] + ": " + x["what_we_need"], "who": x["ask_who"], "pop": x["population"], "status": x["status"], "ex": x["gain_example"]})
data["asks"] = asks

# ---- SDG: variables per survey, written out from the values file and the methodology record ----
FDS = ("Intro_07", "Refugees", "Host community")
SRC = {
 "UNHCR SSD FDS": ("UNHCR Forced Displacement Survey", "Intro_07_1", "Refugees", "Host community"),
 "UNHCR PAK FDS": ("UNHCR Forced Displacement Survey",) + FDS,
 "UNHCR ZAM FDS": ("UNHCR Forced Displacement Survey",) + FDS,
 "UNHCR CMR Profiling": ("UNHCR profiling survey", "HOUSEHOLD_STATUS", "IDPs", "Host"),
 "UNHCR COD Kasai Profiling": ("UNHCR profiling survey, Grand Kasaï", "s00q0_HHtype_HHH", "IDPs", "Host"),
 "WB-UNHCR KEN RHHS": ("World Bank and UNHCR refugee and host household survey", "", "Refugees", "Host"),
 "WB ECU HFPS-VEN": ("World Bank high-frequency phone survey of Venezuelans", "", "Venezuelans", ""),
 "WB BGD CBPS-HFT R3": ("Cox's Bazar Panel Survey, round 3", "stratum", "Rohingya in camps", "Host"),
 "WB SOM SHFS-W1": ("Somali High Frequency Survey, wave 1", "", "IDPs", "Urban and rural host"),
 "Malawi DHS 2024": ("Demographic and Health Survey", "shcamps", "Refugees in camp", "Host"),
 "MICS 2011 Lebanon (Palestinians)": ("MICS, Palestinian camps and gatherings", "", "Palestinian refugees", ""),
 "WB-UNHCR Nigeria IDP survey": ("World Bank and UNHCR IDP survey", "migr_idp", "IDPs", "Host"),
 "JIPS/UN-HABITAT Pemba profiling 2025": ("JIPS and UN-Habitat urban profiling, Pemba", "", "IDPs in camps", "Non-displaced"),
}
FOODP = ["Food11aa","Food12a","Food13a","Food14a","Food15a","Food16a","Food17a","Food18a"]
FOODS = ["Food_div1","Food_div2","Food_div3","Food_div4","Food_div5","Food_div6","Food_div7","Food_div8"]
W = "weighted"; U = "unweighted"; NR = ""
# (country, sdg): (what the survey asked, variables, rule applied, weight)
E = {
 ("Cameroon","2.1.2"): ("Coping strategies when food is short", ["rCSI_LEVEL"], "Reduced coping strategy index at level 3, already computed in the file", W),
 ("South Sudan","2.1.2"): ("Days each of 8 food groups was eaten in the last 7", FOODS, "Food Consumption Score of 35 or less", "wgh_samp_resc_pop"),
 ("Pakistan","2.1.2"): ("Days each of 8 food groups was eaten in the last 7", FOODP, "Food Consumption Score of 35 or less", "wgh_strata_spec"),
 ("Zambia","2.1.2"): ("Days each of 8 food groups was eaten in the last 7", FOODP, "Food Consumption Score of 35 or less", "wgh_strata_spec"),
 ("Ecuador","2.1.2"): ("Whether the household ran out of food in the last 30 days", ["u04_01"], "Ran out of food", U),
 ("Bangladesh","2.1.2"): ("Whether meals were reduced or skipped", ["fs_fewer_meals_r3"], "Reduced or skipped meals", W),
 ("South Sudan","6.1.1"): ("Main source of drinking water", ["BD01"], "Improved source on the JMP ladder", W),
 ("Pakistan","6.1.1"): ("Main source of drinking water", ["BD01"], "Improved source on the JMP ladder", W),
 ("Zambia","6.1.1"): ("Main source of drinking water", ["BD01"], "Improved source on the JMP ladder", W),
 ("DR Congo","6.1.1"): ("Main source of drinking water", ["s06q15_WaterSource"], "Improved source on the JMP ladder", U),
 ("Kenya","6.1.1"): ("Main source of drinking water", ["e09"], "Improved source on the JMP ladder", W),
 ("Somalia","6.1.1"): ("Main source of drinking water", ["drink_water"], "Improved source on the JMP ladder", W),
 ("Lebanon","6.1.1"): ("Main source of drinking water", ["WS1"], "Improved source", "hhweight"),
 ("Mozambique","6.1.1"): ("Main source of drinking water and time to fetch it", ["S7Q7"], "Improved source within a 30-minute round trip", NR),
 ("South Sudan","6.2.1"): ("Type of toilet facility", ["SAN01"], "Improved facility on the JMP ladder", W),
 ("Pakistan","6.2.1"): ("Type of toilet facility", ["SAN01"], "Improved facility on the JMP ladder", W),
 ("Zambia","6.2.1"): ("Type of toilet facility", ["SAN01"], "Improved facility on the JMP ladder", W),
 ("DR Congo","6.2.1"): ("Type of toilet facility", ["s06q25_Toilet"], "Improved facility (codes 1 to 4)", U),
 ("Kenya","6.2.1"): ("Type of toilet facility", ["e10"], "Improved facility on the JMP ladder", W),
 ("Somalia","6.2.1"): ("Type of toilet facility", ["toilet_type"], "Improved facility on the JMP ladder", W),
 ("Lebanon","6.2.1"): ("Type of toilet facility", ["WS8"], "Improved facility that is not shared", NR),
 ("South Sudan","16.9.1"): ("Whether each child's birth is registered", ["HH_07b","ageYears"], "Registered, among children under 5", W),
 ("Pakistan","16.9.1"): ("Whether each child's birth is registered", ["HH_07b","agetouse"], "Registered, among children under 5", W),
 ("Lebanon","16.9.1"): ("Whether each child's birth is registered", ["BR1","BR2"], "Registered, among children under 5", NR),
 ("South Sudan","4.1.2"): ("Whether each child currently attends school", ["HH_Educ02a"], "Attending, among ages 6 to 17", W),
 ("Malawi","4.1.2"): ("Whether each child attended school this year", ["hv121"], "hv121 above 0, among ages 6 to 17", NR),
 ("Lebanon","4.1.2"): ("Whether each child currently attends school", ["ED5"], "Attending, among ages 6 to 17", NR),
 ("Nigeria","4.1.2"): ("Whether each child currently attends school", ["B_4_3"], "Attending, among ages 6 to 17", W),
 ("Pakistan","8.5.2"): ("Work in the last week, job search, availability", ["EMP01","EMP02","EMP03","EMP04","EMP05","EMP25a","EMP29"], "Not employed (EMP01 to EMP05), looked for work (EMP25a) and available (EMP29), over the labour force", NR),
 ("South Sudan","7.1.1"): ("Main source of electricity", ["HE01"], "Any source in codes 1 to 6; none and torch excluded", "wgh_samp_resc_pop"),
 ("Pakistan","7.1.1"): ("Electricity access tier, derived in the file", ["C070101"], "Tier 1 or above", "wgh_strata_spec"),
 ("Zambia","7.1.1"): ("Electricity access tier, derived in the file", ["C070101"], "Tier 1 or above", "wgh_strata_spec"),
 ("Kenya","7.1.1"): ("Whether the household has electricity", [], "Has electricity", W),
 ("Cameroon","7.1.1"): ("Whether the household is connected to the grid", ["AEQ0"], "Grid access", "WEIGHT_FINAL"),
 ("Malawi","7.1.1"): ("Whether the household has electricity", ["hv206"], "Has electricity", "shv005 / hv005"),
 ("Lebanon","7.1.1"): ("Whether the household has electricity", ["HC8A"], "HC8A equals 1", NR),
 ("Mozambique","7.1.1"): ("Main source of electricity", ["S7Q11"], "Grid, solar or generator", NR),
 ("Lebanon","11.1.1"): ("Household size and rooms used for sleeping", [], "More than 3 persons per sleeping room", NR),
 ("Mozambique","11.1.1"): ("Household size and number of rooms", [], "More than 3 persons per room", NR),
 ("Malawi","2.2.1"): ("Height and age of children under 5, measured", ["hc70"], "Height for age below minus 2 standard deviations (hc70 under -200)", W),
 ("Mozambique","1.4.2"): ("Whether the household has a document for its dwelling or land", ["S6Q5"], "Documented tenure", W),
 ("Mozambique","16.1.4"): ("How safe people feel in their area during the day", ["S8Q2"], "Very safe or fairly safe", NR),
 ("Mozambique","10.3.1"): ("Whether people experienced discrimination", ["S11Q2"], "Experienced discrimination", NR),
}
DEF = {  # code: (name, numerator, denominator, priority, note on official definition)
 "1.4.2": ("Secure tenure", "People with documented rights to their dwelling or land", "All people in the group", True, "The official indicator also counts people who perceive their rights as secure; these values use documents only."),
 "2.1.2": ("Food insecurity", "People who are food-insecure on the survey's measure", "All people in the group", False, "The official indicator uses the Food Insecurity Experience Scale. Every survey here uses another measure, and not the same one, so values are not comparable across surveys."),
 "2.2.1": ("Child stunting, under 5", "Children under 5 whose height for age is below minus 2 standard deviations", "All children under 5 who were measured", True, ""),
 "4.1.2": ("School attendance, ages 6 to 17", "Children aged 6 to 17 attending school", "All children aged 6 to 17", False, "The official indicator is the completion rate. These values are attendance."),
 "6.1.1": ("Drinking water", "People whose main drinking water source is improved", "All people in the group", True, "The official indicator is safely managed water, which needs a water quality test. These values are the basic-water proxy."),
 "6.2.1": ("Sanitation", "People using an improved sanitation facility", "All people in the group", False, "The official indicator is safely managed sanitation. These values are use of an improved facility."),
 "7.1.1": ("Access to electricity", "People whose household has electricity", "All people in the group", True, "Surveys count different sources: some grid only, some include solar and generators."),
 "8.5.2": ("Unemployment rate", "People not employed, who looked for work and are available to start", "People employed plus people unemployed (the labour force)", True, ""),
 "10.3.1": ("Discrimination", "People who say they experienced discrimination", "All people in the group", True, "The official indicator refers to the previous 12 months and to grounds prohibited under human rights law; the record does not say whether the question matches."),
 "11.1.1": ("Overcrowding", "People in households with more than 3 persons per room", "All people in the group", True, "The official indicator is the urban population in slums or inadequate housing. Overcrowding is one of its components."),
 "16.1.4": ("Feeling safe", "People who feel very or fairly safe", "All people in the group", True, "The official indicator asks about walking alone after dark. The Mozambique question asks about the daytime."),
 "16.9.1": ("Birth registration, under 5", "Children under 5 whose birth is registered", "All children under 5", True, ""),
}
def pct(s):
    s = (s or "").strip()
    return int(s.split("%")[0]) if s[:1].isdigit() else None
sdg = {}
for x in csv.DictReader(open(SDG + "gain_sdg_values_calculated.csv", encoding="utf-8-sig")):
    src = x["source"].replace(" (shcamps refugee flag)", "")
    fam, gv, g1, g2 = SRC[src]
    what, vars_, rule, w = E[(x["country"], x["sdg"])]
    yr = x["year"]
    sdg.setdefault(x["sdg"], []).append({"country": x["country"], "src": src, "fam": fam, "year": yr, "gv": gv, "g1": g1, "g2": g2,
        "r": pct(x["refugee_value"]), "h": pct(x["host_value"]), "what": what, "vars": vars_, "rule": rule, "w": w,
        "old": bool(yr) and int(yr) < 2018})
order = sorted(DEF, key=lambda c: [int(p) for p in c.split(".")])
data["sdg"] = [{"c": c, "n": DEF[c][0], "num": DEF[c][1], "den": DEF[c][2], "pri": DEF[c][3], "off": DEF[c][4],
                "rows": sorted(sdg.get(c, []), key=lambda r: (r["old"], r["country"]))} for c in order]

# ---- verification merge: every published value recalculated from the survey file (verify/*.json) ----
import sys; sys.path.insert(0, HERE)
import vermerge
FV = vermerge.fds_rows(); AV, AVQ, AAREAS = vermerge.agent_rows()
OFFT = {
 "1.4.2": "Proportion of total adult population with secure tenure rights to land, (a) with legally recognized documentation, and (b) who perceive their rights to land as secure, by sex and type of tenure",
 "2.1.2": "Prevalence of moderate or severe food insecurity in the population, based on the Food Insecurity Experience Scale (FIES)",
 "2.2.1": "Prevalence of stunting (height for age <-2 standard deviation from the median of the World Health Organization (WHO) Child Growth Standards) among children under 5 years of age",
 "4.1.2": "Completion rate (primary education, lower secondary education, upper secondary education)",
 "6.1.1": "Proportion of population using safely managed drinking water services",
 "6.2.1": "Proportion of population using (a) safely managed sanitation services and (b) a hand-washing facility with soap and water",
 "7.1.1": "Proportion of population with access to electricity",
 "8.5.2": "Unemployment rate, by sex, age and persons with disabilities",
 "10.3.1": "Proportion of population reporting having personally felt discriminated against or harassed in the previous 12 months on the basis of a ground of discrimination prohibited under international human rights law",
 "11.1.1": "Proportion of urban population living in slums, informal settlements or inadequate housing",
 "16.1.4": "Proportion of population that feel safe walking alone around the area they live after dark",
 "16.9.1": "Proportion of children under 5 years of age whose births have been registered with a civil authority, by age",
}
FIX = {
 ("South Sudan", "16.9.1"): "The published 62% and 27% counted only the registration question (HH_07b), which this survey asks only when the child has no birth certificate. That gives 62% and 26%. Counting children with a certificate as registered, as the indicator does, gives 95% and 57%.",
 ("Pakistan", "16.9.1"): "The published 42% and 86% used the registration question (HH_07b) alone; in this version of the file that gives 44% and 86%. Counting children with a certificate as registered, as the indicator does, gives 47% and 87%.",
 ("South Sudan", "4.1.2"): "The published 81% and 47% used two denominators: children with an answer for refugees, all children aged 6 to 17 for hosts. With one denominator it is 81% and 49% (children with an answer) or 76% and 47% (all children).",
}
WAS = {
 ("South Sudan", "16.9.1"): "Corrected on 23 November 2026, from 62% and 27%. The earlier value counted only the registration question, which this survey asks only when the child has no birth certificate.",
 ("Pakistan", "16.9.1"): "Corrected on 23 November 2026, from 42% and 86%. The earlier value used the registration question alone and left out children with a birth certificate.",
 ("South Sudan", "4.1.2"): "Corrected on 23 November 2026, from 81% and 47%. The earlier host value used all children aged 6 to 17 as denominator, the refugee value only children with an answer.",
}
CAVE = {
 ("Kenya", "7.1.1"): "Reproduced only without weights; weighted it is 99% and 97%. The variable is the main source of lighting being electricity, so solar is not counted.",
 ("Kenya", "6.1.1"): "Water bought from a vendor is counted as improved. Without it the values are 92% and 85%.",
 ("Somalia", "6.1.1"): "Tanker truck is counted as improved, cart with small tank is not. The unadjusted weight is used; with the adjusted weight the host value is 93%.",
 ("Somalia", "6.2.1"): "The question has five answers, not the JMP list. Public toilet counts as not improved (251 of 430 IDP households use one) and 38 households with no answer were counted as improved. Without those 38 the host value is 80%.",
 ("Ecuador", "2.1.2"): "Unweighted, wave 1 only. With the file's weights the value is 46% to 49%.",
 ("Bangladesh", "2.1.2"): "One question on reducing or skipping meals; the reference period is not in the file.",
 ("Lebanon", "6.1.1"): "Reaches 100% only because tanker truck, cart and bottled water count as improved (about a quarter of households use a tanker). Under the definition MICS used in 2011 the value is 71%.",
 ("Lebanon", "4.1.2"): "Children who never attended school are not asked the question and were left out. With all children aged 6 to 17 the value is 83%.",
 ("Lebanon", "16.9.1"): "Reproduced with birth certificate only. Certificate or registered, the usual definition, gives 99%.",
 ("Lebanon", "11.1.1"): "Share of households. As a share of people it is 27%.",
 ("Malawi", "7.1.1"): "Share of households. As a share of people the camp value is 30%.",
 ("Malawi", "4.1.2"): "The file records attendance at any time in the school year, not current attendance.",
 ("Cameroon", "2.1.2"): "Reproduced only without weights. With the file's weight (WEIGHT_FINAL) the values are 56% and 36%. The measure is a coping strategy index, not the Food Insecurity Experience Scale.",
 ("Cameroon", "7.1.1"): "From the 2025 second round of the profiling, a different file from the 2024 one used for food insecurity. Grid connection only.",
 ("DR Congo", "6.1.1"): "No weight variable exists in the file.",
 ("DR Congo", "6.2.1"): "No weight variable exists in the file. Nearly all households counted use a composting toilet; the question has no 'pit latrine with slab' answer.",
 ("Mozambique", "6.1.1"): "Reproduced only when the answer 'other' counts as an improved source. With the strict list the values are 66% and 81%. The file separates under and over 30 minutes only.",
 ("Mozambique", "1.4.2"): "Among households that own their dwelling. Among all households the values are 14% and 50%.",
 ("Mozambique", "16.1.4"): "One respondent per household. The question is about the daytime.",
 ("Mozambique", "10.3.1"): "One respondent per household.",
 ("Zambia", "6.2.1"): "Recalculation gives 76% and 30%, one point above the published values.",
}
r1 = lambda v: None if v is None else int(v + 0.5)
def first(t):
    t = (t or "").strip(); i = t.find(". "); return t if i < 0 else t[:i + 1]
for d in data["sdg"]:
    for r in d["rows"]:
        k = (r["country"], d["c"]); m = FV.get(k) or AV.get(k)
        if not m: r["v"] = {"st": "none"}; continue
        pub = [r["r"], r["h"]]
        if m.get("what"): r["what"] = m["what"]
        r["vars"] = m["vars"] or r["vars"]; r["rule"] = m["num"] or r["rule"]; r["den"] = m["den"]; r["lvl"] = m["lvl"]; r["file"] = m["file"]
        r["w"] = m["w"] or "unweighted"; r["gv"] = m["gv"] or r["gv"]; r["gc"] = m["g"]
        st = vermerge.status(pub, m["rc"]); was = k in FIX and st == "ok"
        if k in FIX and st != "ok": st = "fix"
        if m.get("match") and st == "diff": st = "near"
        r["v"] = {"st": st, "rc": m["rc"], "pub": pub, "n": m["n"], "note": (WAS[k] if was else FIX.get(k)) or CAVE.get(k) or "", "script": m["script"]}
        if st == "fix": r["r"], r["h"] = r1(m["rc"][0]), r1(m["rc"][1])
        if m.get("third"): r["v"]["third"] = m["third"]
# Zambia values that the same script gives and the published file does not have
for code in ("16.9.1", "4.1.2"):
    m = FV.get(("Zambia", code)); d = next(x for x in data["sdg"] if x["c"] == code)
    if m and not any(r["country"] == "Zambia" for r in d["rows"]):
        fam, gv, g1, g2 = SRC["UNHCR ZAM FDS"]
        d["rows"].append({"country": "Zambia", "src": "UNHCR ZAM FDS", "fam": fam, "year": "2025", "gv": m["gv"], "g1": g1, "g2": g2, "r": r1(m["rc"][0]), "h": r1(m["rc"][1]), "what": m["what"], "vars": m["vars"],
            "rule": m["num"], "den": m["den"], "lvl": m["lvl"], "file": m["file"], "w": m["w"], "gc": m["g"], "old": False,
            "v": {"st": "new", "rc": m["rc"], "pub": [None, None], "n": m["n"], "note": "Not in the published values file. Calculated with the same script and definition as South Sudan and Pakistan.", "script": "fds", "third": m.get("third") or {}}})
for d in data["sdg"]: d["offt"] = OFFT[d["c"]]
data["script"] = {"fds": open(os.path.join(HERE, "fds_verify.py"), encoding="utf-8").read()}
# identification questions against the group variable, counted in the South Sudan roster (unweighted household members who were asked)
data["idcmp"] = {"UNHCR SSD FDS": [
  ["Refugee sample", "7,198 asked their citizenship (ID_00)", "98% are nationals of another country or stateless; 2% are nationals of South Sudan"],
  ["Refugee sample", "6,235 asked if they ever had to flee home while living abroad (ID_01b)", "80% yes, 20% no"],
  ["Refugee sample", "7,058 asked for their main document (ID_09)", "83% recognised refugee, 7% refugee enrolment document, 9% no documents"],
  ["Host sample", "4,066 asked if they ever had to flee home while living in this country (ID_01a)", "30% yes: displaced inside the country at some time, but counted as host"]]}

# ---- question wording per variable (hover cards) ----
lab = json.load(open(os.path.join(HERE, "mdl", "labels.json"), encoding="utf-8"))
MDL = "UNHCR Microdata Library data dictionary"
vq = {}
def put(country, sid, v, note=""):
    x = lab[f"{sid}:{v}"]
    cats = [] if (v.lower().startswith("age")) else [[c, l] for c, l in x["cats"]]
    vq[f"{country}:{x['name']}"] = {"q": x["labl"], "cats": cats[:9], "more": max(0, len(cats) - 9), "src": MDL,
        "url": f"https://microdata.unhcr.org/index.php/catalog/{sid}/variable/{x['fid']}/{x['vid']}", "note": note}
import re
ZVL = json.load(open(os.path.join(HERE, "zmb_valuelabels.json"), encoding="utf-8"))
for k in lab:
    sid, v = k.split(":")
    c_ = {"1175": "South Sudan", "1421": "Pakistan", "1423": "Zambia"}[sid]
    put(c_, sid, v)
    e_ = vq[f"{c_}:{lab[k]['name']}"]
    e_["q"] = re.sub(r"^%s - " % re.escape(lab[k]["name"]), "", e_["q"]).replace("${doyou1}", "[Do you/does name]").replace("${your1}", "[your/name]").replace("${areyou2}", "[Are you/Is name]")
    if sid == "1423" and not e_["cats"] and v in ZVL and not v.lower().startswith("age"):
        e_["cats"] = ZVL[v][:9]; e_["more"] = max(0, len(ZVL[v]) - 9); e_["note"] = "Answer codes from the value labels file of the dataset."
STD = {
 ("Malawi","hv206"): ("Has electricity", "Standard DHS recode label."),
 ("Malawi","hv121"): ("Member attended school during current school year", "Standard DHS recode label."),
 ("Malawi","hc70"): ("Height/Age standard deviation (new WHO)", "Standard DHS recode label."),
 ("Lebanon","WS1"): ("What is the main source of drinking water for members of your household?", "Standard MICS wording."),
 ("Lebanon","WS8"): ("What kind of toilet facility do members of your household usually use?", "Standard MICS wording."),
 ("Lebanon","HC8A"): ("Does your household have: electricity?", "Standard MICS wording."),
 ("Lebanon","ED5"): ("During the school year, did (name) attend school or preschool at any time?", "Standard MICS wording."),
 ("Lebanon","BR1"): ("Does (name) have a birth certificate?", "Standard MICS wording."),
 ("Lebanon","BR2"): ("Has (name)'s birth been registered with the civil authorities?", "Standard MICS wording."),
 ("Lebanon","hhweight"): ("Household sample weight", "Standard MICS variable."),
}
for (c, v), (q, n) in STD.items():
    vq[f"{c}:{v}"] = {"q": q, "cats": [], "more": 0, "src": "", "url": "", "note": n + " Not checked against this survey's questionnaire."}
for k_, v_ in AVQ.items(): vq[k_.replace("Cameroon2025:", "Cameroon:") if k_.split(":")[1] not in ("WEIGHT_FINAL",) or "Cameroon:WEIGHT_FINAL" not in AVQ else k_] = v_
for v_ in ("BD01", "SAN01"):
    z_, p_ = vq.get("Zambia:" + v_), vq.get("Pakistan:" + v_)
    if z_ and p_ and not z_["cats"]: z_["cats"] = p_["cats"]; z_["more"] = p_["more"]; z_["note"] = "The answer codes are not in the Zambia files. Shown from the Pakistan survey, which uses the same code list; the Zambia values were calculated with these codes and reproduce the published figures."
data["vq"] = vq

# ================= EGRISS model, globe geometry, per-country data =================
import re, importlib.util
IDQ = path("idq") + "/"
def load(n):
    s = importlib.util.spec_from_file_location(n, IDQ + "prototype-python/" + n + ".py"); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
strip = lambda s: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", str(s or "")).replace("&ldquo;", "“").replace("&rdquo;", "”").replace("&rarr;", "→").replace("&mdash;", "—").replace("&middot;", "·").replace("{country}", "[country]")).strip()
men = load("module_i18n").M["en"]; fen = load("question_i18n").T["en"]
TITLES = {"FrcFl":"Forced to flee","FrcOth":"Other reasons for fleeing","FleeLoc":"Country of the home fled","IDPLoc":"Place lived before fleeing",
 "LocLiv":"Always lived there","CitLoc":"Citizen when fled","FleeCross":"Moved to another country","IDPPost":"First place moved to","12Mnths":"Time abroad",
 "Apply":"Applied for international protection","IntApply":"Intended to apply","Outcome":"Outcome of the application","Legal":"Main document held"}
KEY = {"FrcOth":"frcoth","FleeLoc":"fleeloc","IDPLoc":"idploc","LocLiv":"locliv","CitLoc":"citloc","FleeCross":"fleecross","IDPPost":"idppost","12Mnths":"mnths12","Apply":"apply","IntApply":"intapply","Outcome":"outcome","Legal":"legal"}
CORE = {"FrcFl","FleeLoc","FleeCross","Apply","Outcome"}
model = [{"code":"FrcFl","title":TITLES["FrcFl"],"core":True,"skip":"Ask all",
          "stem":strip(fen["stem1"]+" "+fen["stem2"]+" "+fen["lead"]), "opts":[strip(fen["opts"].get(i, fen["opts"].get(str(i)))) for i in range(1,9)]}]
for code in ["FrcOth","FleeLoc","IDPLoc","LocLiv","CitLoc","FleeCross","IDPPost","12Mnths","Apply","IntApply","Outcome","Legal"]:
    it = men[KEY[code]]; o = it.get("opts") or [c[0] for c in it.get("cats", [])]
    model.append({"code":code,"title":TITLES[code],"core":code in CORE,"skip":strip(it.get("skip")),"stem":strip(it.get("stem")),"opts":[strip(x) for x in o]})
data["model"] = model

# first-pass keyword match of the eight FrcFl causes in each questionnaire's wording (draft, automatic)
KW = {1:["armed conflict","conflict","war ","guerre","conflit","conflicto","guerra"],
      2:["violence","violencia","public order","ordre public","insecurity","insécurité","inseguridad","pandilla","maras","banditry","crimen","delincuen"],
      3:["persecu","persécu","discrimin"],
      4:["human rights","droits humains","droits de l'homme","droits de l’homme","derechos humanos"],
      6:["disaster","catastrophe","desastre","flood","inondation","inundaci","drought","sécheresse","sequía","earthquake","natural hazard","naturel"],
      7:["eviction","éviction","expulsion","desalojo","man-made","development project","projet de développement","pollution"]}
cause = {}
for x in rows:
    if x["module_item"] in ("FrcFl","FrcOth","ResMov","ResMig"):
        t = (x["text_original"] + " " + x["text_en"] + " " + x["response_options"]).lower()
        s = cause.setdefault(sidx[x["survey_id"]], set())
        for k, ws in KW.items():
            if any(w in t for w in ws): s.add(k)
data["cause"] = {str(k): sorted(v) for k, v in cause.items()}

# globe geometry, taken from the SDG globe page
gh = open(path("sdg") + "/globe.html", encoding="utf-8").read()
i = gh.index("WORLDGEO"); i = gh.index("{", i)
geo, _ = json.JSONDecoder().raw_decode(gh[i:])
def iso_of(f):
    a = f["properties"].get("ISO_A3"); return a if a and a != "-99" else (f["properties"].get("ADM0_A3") or "")
feats = []; name2iso = {}; cent = {}
for f in geo["features"]:
    iso = iso_of(f); nm = f["properties"].get("ADMIN") or f["properties"].get("NAME") or iso
    feats.append({"type":"Feature","properties":{"i":iso,"n":nm},"geometry":f["geometry"]})
    name2iso[nm] = iso
    bb = f.get("bbox")
    if bb: cent[iso] = [round((bb[1]+bb[3])/2,1), round((bb[0]+bb[2])/2,1)]
data["geo"] = feats; data["cent"] = cent

CJ = json.load(open(f"{REPO}/assets/countries/countries.json"))["countries"]
for iso, c in CJ.items(): name2iso[c["name"]] = iso
name2iso.update({"DR Congo":"COD","State of Palestine":"PSE","Palestine":"PSE","Morocco (regional model)":"MAR","Türkiye":"TUR","Turkey":"TUR","Syria":"SYR","UK":"GBR","United Kingdom":"GBR","Tanzania":"TZA","Côte d'Ivoire":"CIV","Iran":"IRN"})
ctry = {}
def C(iso, nm=None):
    return ctry.setdefault(iso, {"n": nm or (CJ.get(iso, {}).get("name")) or next((k for k, v in name2iso.items() if v == iso), iso), "ex": [], "pop": None, "rep": [], "sv": [], "cz": []})
for iso, c in CJ.items():
    d = C(iso, c["name"])
    d["ex"] = sorted([[e["id"], e["year"], e["title"][:110], e["org"], 1 if e.get("uses") else 0, "C" if e.get("lead") == "Country-led" else "I",
                       ", ".join(e.get("method") or []), ", ".join(e.get("groups") or []), e.get("link") or "", 1 if e.get("cover") and os.path.exists(os.path.join(HERE, "covers", "ex%s.jpg" % e["id"])) else 0, (e.get("note") or "")[:400], "|".join(dict.fromkeys((e.get("areas") or []) + (e.get("places") or []))), e.get("recs") or "", ", ".join(e.get("sources") or []), e.get("method_basis") or "", e.get("groups_basis") or ""] for e in c["examples"]], key=lambda e: (-e[1], e[2]))
    yrs = sorted(c.get("population") or {})
    if yrs:
        pp = c["population"][yrs[-1]]; d["pop"] = [yrs[-1], pp.get("refugees",0)+pp.get("asylum",0), pp.get("idps",0), pp.get("stateless",0)]
miss = set()
for g in data["sdg"]:
    for r in g["rows"]:
        r["iso"] = name2iso.get(r["country"], "")
        if not r["iso"]: miss.add(r["country"])
        else: C(r["iso"])
for x in csv.DictReader(open(SDG + "gain_sdg_values_promoted.csv", encoding="utf-8-sig")):
    iso = name2iso.get(x["country"])
    if not iso: miss.add(x["country"]); continue
    C(iso)["rep"].append([x["sdg"], x["value"], x["population"], x["source"], x["page"], x["method"]])
for k, (cn, sv) in enumerate(surveys):
    iso = name2iso.get(cn)
    if iso: C(iso)["sv"].append(k)
    else: miss.add(cn)
geo_iso = {f["properties"]["i"]: f["properties"]["n"] for f in feats}
for x in csv.DictReader(open(IDQ + "outputs/showcard_recommendations.csv", encoding="utf-8-sig")):
    if x["iso3"] in geo_iso and x["iso3"] not in ctry and float(x["displaced"] or 0) > 0: C(x["iso3"], geo_iso[x["iso3"]])
    if x["iso3"] in ctry:
        ctry[x["iso3"]]["cz"].append([int(x["code_id"]), x["status"], (x["local_examples"] or "")[:150], int(float(x["displaced"] or 0)), round(float(x["domestic_share"] or 0), 3), round(float(x["origin_share"] or 0), 3)])
        ctry[x["iso3"]]["dp"] = [int(float(x["idps_total"] or 0)), int(float(x["refugees_hosted"] or 0))]
data["ctry"] = ctry
print("no ISO for:", sorted(miss))

# ================= sub-national values (calculated by subnat.py from the FDS files) =================
import math
def merc(lon, lat): return (math.radians(lon), math.log(math.tan(math.pi/4 + math.radians(lat)/2)))
def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        for ring in poly: yield ring
def build_map(iso, W=520):
    g = json.load(open(os.path.join(HERE, "bounds", iso + ".geojson")))
    pts = [merc(*q[:2]) for f in g["features"] for r in rings(f["geometry"]) for q in r]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts); y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    k = (W - 20) / (x1 - x0); H = round((y1 - y0) * k + 20)
    P = lambda lon, lat: (round(10 + (merc(lon, lat)[0] - x0) * k, 1), round(10 + (y1 - merc(lon, lat)[1]) * k, 1))
    areas = []
    for f in g["features"]:
        d = ""; best = None
        for r in rings(f["geometry"]):
            out = []; 
            for q in r:
                xy = P(*q[:2])
                if not out or abs(xy[0]-out[-1][0]) + abs(xy[1]-out[-1][1]) > 0.9: out.append(xy)
            if len(out) < 4: continue
            d += "M" + "L".join(f"{x} {y}" for x, y in out) + "Z"
            xs = [x for x, _ in out]; ys = [y for _, y in out]; ar = (max(xs)-min(xs)) * (max(ys)-min(ys))
            if not best or ar > best[0]: best = (ar, round((max(xs)+min(xs))/2, 1), round((max(ys)+min(ys))/2, 1))
        areas.append({"n": f["properties"]["shapeName"], "d": d, "cx": best[1], "cy": best[2]})
    return {"w": W, "h": H, "areas": areas}, (x0, y1, k)
_fv = json.load(open(os.path.join(HERE, "verify", "fds.json")))
sub = {iso: {c: {"nat": x["national"], "areas": {k.replace(" | ", "|"): v for k, v in x["areas"].items()}, **({"camps": {k: v for k, v in x["camps"].items() if k != "Other"}} if x["camps"] else {})}
             for c, x in ind.items() if x["areas"]} for iso, ind in _fv.items()}
maps = {}
for iso in ("PAK", "SSD"): maps[iso], _ = build_map(iso)
# camp points: the country card's own UNHCR locations, moved from its frame into this one by matching the country outline
sj = json.load(open(f"{REPO}/assets/countries/SSD.json"))
nums = [float(v) for v in re.findall(r"-?\d+\.?\d*", sj["land"])]
lx = nums[0::2]; ly = nums[1::2]
ax = [a for A in maps["SSD"]["areas"] for a in [float(v) for v in re.findall(r"-?\d+\.?\d*", A["d"])][0::2]]
ay = [a for A in maps["SSD"]["areas"] for a in [float(v) for v in re.findall(r"-?\d+\.?\d*", A["d"])][1::2]]
kx = (max(ax) - min(ax)) / (max(lx) - min(lx)); ky = (max(ay) - min(ay)) / (max(ly) - min(ly))
CAMP = {"Doro":"Doro","Yusuf Batil":"Yusuf Batil","Kaya":"Kaya","Gendrassa":"Gendrassa","Ajuong Thok":"Ajuong Thok","Pamir":"Pamir","Yida":"Yida","GOROM":"Gorom","MAKPANDU":"Makpandu","EZO":"Ezo"}
loc = {p[4]: p for p in sj["pts"]}
maps["SSD"]["camps"] = [{"k": k_, "n": v, "x": round(min(ax) + (loc[v][0] - min(lx)) * kx, 1), "y": round(min(ay) + (loc[v][1] - min(ly)) * ky, 1)} for k_, v in CAMP.items() if v in loc]
maps["PAK"]["camps"] = []
data["sub"] = {"val": sub, "map": maps,
  "meta": {"PAK": {"name": "Pakistan", "survey": "UNHCR Forced Displacement Survey 2024", "g": ["Refugees", "Host community"], "w": "wgh_prov_spec", "wl": "province-specific weight", "unit": "province",
                   "alias": {"Khyber Pakhtunkhwa": "Khyber-Pakhtunkhwa", "Islamabad Capital Territory": "Islamabad"}, "pub": {"6.1.1": [92, 90], "6.2.1": [74, 95], "7.1.1": [62, 66]}},
           "SSD": {"name": "South Sudan", "survey": "UNHCR Forced Displacement Survey 2023", "g": ["Refugees", "Host community North"], "w": "wgh_samp_resc_pop", "wl": "national weight; no state-level weight in the file", "unit": "state",
                   "alias": {}, "pub": {"6.1.1": [97, 88], "6.2.1": [58, 18], "7.1.1": [1, 1]}}}}

# ================= v11: one country map for all layers, in the GAIN story's own frame =================
import sys; sys.path.insert(0, HERE)
import cmaps
def slim(d):
    out = []
    for part in d.split("M")[1:]:
        last = None; seg = []
        for xy in part.rstrip("Z").split("L"):
            a, b = xy.split(" "); v = (round(float(a)), round(float(b)))
            if v != last: seg.append(v); last = v
        if len(seg) > 2: out.append("M" + "L".join("%d %d" % v for v in seg) + "Z")
    return "".join(out)
FULL = ("SSD", "PAK", "NGA")
cm = cmaps.build(sorted(ctry), full=FULL)
for iso, m in cm.items():
    if iso not in FULL and "states" in m:
        for st in m["states"]: st[0] = slim(st[0])
for m_ in cm.values(): m_["bb"] = [round(v, 1) for v in cmaps.bbox(m_["land"])]
data["cm"] = cm
# displacement by cause, placed on the same country maps
dpts = {}
for x in csv.DictReader(open(IDQ + "outputs/subnational_displacement_points.csv", encoding="utf-8-sig")):
    if x["iso3"] in cm and x["code_id"] != "0" and x["lat"] and float(x["people"] or 0) > 0: dpts.setdefault(x["iso3"], []).append(x)
cpts = {}
for iso, L in dpts.items():
    nm = cmaps.ATLAS.get(iso) or CJ[iso]["name"]
    if nm not in cmaps.GEO: continue
    P, H = cmaps.projector(nm); out = []
    for x in sorted(L, key=lambda x: -float(x["people"]))[:220]:
        px, py = P(float(x["lon"]), float(x["lat"]))
        if 0 <= px <= 560 and 0 <= py <= H: out.append([round(px), round(py), int(x["code_id"]), int(float(x["people"])), x["location"][:40], x["hazard"][:24]])
    if out: cpts[iso] = out
data["cpts"] = cpts
data["subr"] = {}
for x in csv.DictReader(open(IDQ + "outputs/subreason_taxonomy.csv", encoding="utf-8-sig")):
    data["subr"].setdefault(x["code"], []).append([x["sub_id"], x["mechanism"], x["respondent_phrasing"]])
print("cause points:", len(cpts), "countries,", sum(len(v) for v in cpts.values()), "points")
for iso, nm in (("PAK", "Pakistan"), ("SSD", "S. Sudan"), ("ZMB", "Zambia")):
    maps[iso] = {"w": cm[iso]["w"], "h": cm[iso]["h"], "areas": cmaps.adm(iso, nm), "camps": []}
loc = {p_[4]: p_ for p_ in cm["SSD"]["pts"]}
maps["SSD"]["camps"] = [{"k": k_, "n": v, "x": loc[v][0], "y": loc[v][1]} for k_, v in CAMP.items() if v in loc]
data["sub"]["map"] = maps
data["sub"]["meta"]["ZMB"] = {"name": "Zambia", "survey": "UNHCR Forced Displacement Survey 2025", "g": ["Refugees", "Host Community", "Former Refugees"], "w": "wgh_strata_spec", "wl": "stratum weight; no province-level weight in the file", "unit": "province", "alias": {}, "pub": {"6.1.1": [98, 75], "6.2.1": [75, 29], "7.1.1": [24, 13]}}
ST = ["Adamawa", "Benue", "Borno", "Katsina", "Nasarawa", "Sokoto", "Yobe"]
HH = [3284, 32421, 206753, 58, 1864, 3501, 3201]; PP = [19227, 187513, 877299, 382, 12249, 18707, 19451]
def rv(vals, ns): return {s_: [v, n] for s_, v, n in zip(ST, vals, ns)}
data["sub"]["rep"] = {"NGA": {
  "src": "National Bureau of Statistics, Reports of Internally Displaced Persons in Nigeria (survey of 2023, seven states)", "ex": 45, "unit": "state",
  "ind": {
    "edu0": {"num": "Displaced household members who never attended school", "den": "All displaced household members in the state", "n": "Never attended school", "of": "displaced household members", "nl": "people", "tbl": "Appendix II, IDP Table 6, page 66", "all": 63.4, "vals": rv([22.7, 48.7, 67.9, 52.9, 22.5, 63.5, 70.2], PP)},
    "water": {"num": "Displaced households reporting inadequate or bad drinking water in camps", "den": "All displaced households in the state", "n": "Inadequate or bad drinking water", "of": "displaced households, as a challenge faced in camps", "nl": "households", "tbl": "Appendix II, IDP Table 1, page 61", "all": 55.0, "vals": rv([67.7, 94.9, 48.4, 83.7, 55.7, 46.7, 70.6], HH)},
    "toilet": {"num": "Displaced households reporting a bad or missing toilet facility in camps", "den": "All displaced households in the state", "n": "Bad or no toilet facility", "of": "displaced households, as a challenge faced in camps", "nl": "households", "tbl": "Appendix II, IDP Table 1, page 61", "all": 80.1, "vals": rv([79.3, 90.9, 78.6, 85.3, 66.0, 73.6, 79.3], HH)},
    "power": {"num": "Displaced households reporting inadequate or no power supply in camps", "den": "All displaced households in the state", "n": "Inadequate or no power supply", "of": "displaced households, as a challenge faced in camps", "nl": "households", "tbl": "Appendix II, IDP Table 1, page 61", "all": 87.8, "vals": rv([75.6, 96.7, 86.9, 82.3, 85.7, 84.0, 71.2], HH)}}}}
LINKS = {"UNHCR SSD FDS": "Forced Displacement Survey 2023 (online)", "UNHCR PAK FDS": "Forced Displacement Survey 2024 (online, labels)", "JIPS/UN-HABITAT Pemba profiling 2025": "Urban DS profiling, Pemba"}
data["link"] = {k: next(i for i, sv in enumerate(surveys) if sv[1] == v) for k, v in LINKS.items()}
dz = os.path.join(HERE, "disagg_rows.json")
data["disagg"] = json.load(open(dz)) if os.path.exists(dz) else []
TABN = {"LBN": "Lebanon", "SOM": "Somalia", "BGD": "Bangladesh", "NGA": "Nigeria", "CMR": "Cameroon", "MOZ": "Mozambique", "COD": "DR Congo", "MWI": "Malawi"}
tab = {}
for iso, a in AAREAS.items():
    ind = {c: x for c, x in (a.get("ind") or {}).items() if isinstance(x, dict) and x and "(" not in c} if isinstance(a.get("ind"), dict) else {}
    if ind: tab[iso] = {"unit": (a.get("unit") or "area").split(" (")[0], "names": a.get("names") or {}, "ind": ind}
data["sub"]["tab"] = tab
if "SOM" in tab: data["disagg"].append({"country": "Somalia", "survey": "High frequency survey, wave 1 (2016)", "level": "Region; IDP settlements in 3 with 50 or more households", "groups": "IDP settlements, host", "status": "calc", "note": "Banadir, Bari, Woqooyi Galbeed."})
for d_ in data["disagg"]:
    iso_ = next((i for i, n in TABN.items() if n == d_["country"]), None)
    if iso_ in tab and d_["status"] in ("can", "thin"):
        hit = {"NGA": "World Bank", "SOM": "wave", "BGD": "Cox", "LBN": "MICS", "CMR": "profiling", "MOZ": "Pemba", "COD": "Kasai"}.get(iso_, "")
        if hit.lower() in d_["survey"].lower() and not (iso_ == "SOM" and "wave 2" in d_["survey"]): d_["status"] = "calc"
data["exsrc"] = {"186": "UNHCR SSD FDS", "191": "UNHCR PAK FDS", "289": "UNHCR ZAM FDS", "246": "JIPS/UN-HABITAT Pemba profiling 2025", "243": "UNHCR CMR Profiling", "384": "UNHCR COD Kasai Profiling"}
print("cm:", len(cm), "countries,", len(json.dumps(cm)) // 1024, "KB; links", data["link"])

# ================= more from the GAIN survey's own roster (one row per example) =================
GR = path("roster", required=False)
gx = {}
if os.path.exists(GR):
    rr = list(csv.DictReader(open(GR, encoding="utf-8-sig", errors="replace"))); k0 = list(rr[0].keys())[0]; byrow = {x[k0]: x for x in rr}
    val = lambda q, k: "" if q.get(k) in (None, "", "NA") else q[k].strip()
    IDC = ["FORCED TO FLEE", "HABITUAL RESIDENCY", "CROSSING A BORDER", "CITIZENSHIP", "INTERNATIONAL PROTECTION"]
    WHY = ["LACK OF CLARITY (ON HOW TO IMPLEMENT)", "LACK OF FURTHER GUIDANCE (NOT SUFFICIENT METHODOOLOGICAL INFORMATION)", "LACK OF TECHNICAL SUPPORT", "LACK OF TRAINING AND CAPACITY BUILDING OPPORTUNITIES", "LACK OF PEER-TO-PEER LEARNING OPPORTUNITITES"]
    cap = lambda t: t[:1] + t[1:].lower()
    for x in csv.DictReader(open(f"{REPO}/pipeline/data/gain_examples.csv", encoding="utf-8-sig")):
        q = byrow.get(x["roster_row"])
        if not q or q["PRO03"][:25].lower() != x["title"][:25].lower(): continue
        g = {}
        y0, y1 = val(q, "PRO04_year"), val(q, "PRO05_year")
        if y0: g["t"] = [y0, y1]
        if val(q, "phase"): g["ph"] = cap(val(q, "phase"))
        rc = [k for k, c in (("IRRS", "PRO10.A"), ("IRIS", "PRO10.B"), ("IROSS", "PRO10.C")) if val(q, c) == "1"]
        if rc: g["rc"] = rc
        idc = [cap(k) for k in IDC if k in val(q, "PRO13C")]
        if idc: g["id"] = idc
        if val(q, "PRO13C_other"): g["ido"] = val(q, "PRO13C_other")[:160]
        if val(q, "PRO18"): g["pt"] = val(q, "PRO18")[:220]
        if val(q, "PRO07a"): g["og"] = val(q, "PRO07a")[:80]
        if val(q, "PRO14A").startswith("http"): g["pub"] = val(q, "PRO14A")
        if val(q, "PRO14C"): g["use"] = val(q, "PRO14C")[:260]
        if val(q, "PRO03C"): g["cov"] = val(q, "PRO03C")[:120]
        if g: gx[str(int(x["ex_id"][2:]))] = g
data["gx"] = gx
print("GAIN roster detail for", len(gx), "examples")

cover = base64.b64encode(open(f"{REPO}/assets/covers-web/ex186.jpg", "rb").read()).decode()
font = base64.b64encode(open(f"{REPO}/assets/fonts/Obvia-SemiBold.otf", "rb").read()).decode()

def scrub(o):
    if isinstance(o, str):
        if "@" in o: o = " ".join(p for p in re.split(r"(?<=[.!?])\s+", o) if not re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", p)).strip()
        return o
    if isinstance(o, list): return [scrub(x) for x in o]
    if isinstance(o, dict): return {k: scrub(v) for k, v in o.items()}
    return o
_script = data.pop("script"); data = scrub(data); data["script"] = _script
tpl = open(os.path.join(HERE, "demo_template.html"), encoding="utf-8").read()
html = (tpl.replace("__QDATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
           .replace("__COVER__", cover).replace("__FONT__", font))
out = os.path.join(os.path.dirname(HERE), "index.html")
html = html.replace("<title>GAIN Layers Demo</title>", "<title>EGRISS portal: GAIN, SDG, ID Questions</title>")
open(out, "w", encoding="utf-8").write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}img{max-width:100%}</style></head><body style="margin:0">' + html + "</body></html>")
print(out, len(html), "bytes;", len(data["ssd"]), "SSD q;", len(data["mli"]), "MLI q")
