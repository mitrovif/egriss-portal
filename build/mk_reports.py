# Report evidence for SDG values that were read from published reports ("extracted" rows of
# gain_sdg_values_promoted.csv): one cropped page image per report page, with the value highlighted, and a
# manifest (build/reports.json) that also carries the public link of each report.
#
#   python3 -I build/mk_reports.py            # write reports/*.jpg and build/reports.json
#   python3 -I build/mk_reports.py --probe    # only print where each value was found (no files written)
#
# Needs PyMuPDF (pip install pymupdf). The report PDFs are looked up under the folder(s) in the
# 'reports_src' key of build/paths.local.json (several folders may be joined with the OS path separator);
# each SOURCES entry names the file, optionally with its sub-folder below the first folder.
# Only report PDFs are opened; no microdata.
import csv, json, os, re, sys, io, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths
try:
    import pymupdf as fitz
except ImportError:
    import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "reports")
MANIFEST = os.path.join(HERE, "reports.json")
WIDTH = 1100
MAX_BYTES = 180 * 1024

# ---- report sources -------------------------------------------------------------------------------
# key: 'source' exactly as in the csv.  f: file (relative to a reports_src folder, or just its name).
def S(slug, f, title, publisher, year, url, kind):
    return dict(slug=slug, f=f, title=title, publisher=publisher, year=year, url=url, url_kind=kind)

_LBN = S("lbn_mics2023", "Lebanon (Subnational) MICS 2023 Statistical Snapshots_0.pdf",
         "Sub-National Lebanon 2023 Multiple Indicator Cluster Survey: Statistical Snapshots",
         "Central Administration of Statistics (CAS) and UNICEF", "2025",
         "https://mics.unicef.org/sites/mics/files/2025-12/Lebanon%20%28Subnational%29%20MICS%202023%20Statistical%20Snapshots_0.pdf", "pdf")
_NGA = S("nga_nbs_idp2023", "nso/Nigeria/ex048/Nigeria_NBS_IDP_Survey_Report.pdf",
         "Report of Internally Displaced Persons in Nigeria 2023", "National Bureau of Statistics (NBS), Nigeria", "2024",
         "https://egrisstats.org/wp-content/uploads/Nigeria-IDP-Survey-Report-3rd-December_Final.pdf", "pdf")
_KEN = S("ken_shona2024", "nso/Kenya/ex114/Shona%20report%202024%20_%20online%20version.pdf",
         "The Transformative Power of Citizenship: Findings from the 2024 Socioeconomic Study of the Shona Community in Kenya",
         "UNHCR", "2024", "https://data.unhcr.org/en/documents/details/111718", "landing")
_UDHS = S("uga_dhs2022", "nso/Uganda/ex404/UDHS-2022-Report.pdf", "Uganda Demographic and Health Survey 2022: Main Report",
          "Uganda Bureau of Statistics (UBOS)", "2023", "https://www.ubos.org/wp-content/uploads/publications/UDHS-2022-Report.pdf", "pdf")
_UNHS = S("uga_unhs2023", "nso/Uganda/ex320/Uganda-National-Household-Survey-Report-20232024.pdf",
          "2023/24 Uganda National Household Survey Report", "Uganda Bureau of Statistics (UBOS)", "2025",
          "https://www.jointdatacenter.org/wp-content/uploads/2025/08/Uganda-National-Household-Survey-Report-20232024.pdf", "pdf")
_MAR = S("mar_hcp_refugees2022", "nso/Morocco/ex378/HCP_Refugees_2022.pdf",
         "Situation socioéconomique des réfugiés au Maroc : Analyse des résultats de l’Enquête de 2022",
         "Haut-Commissariat au Plan (HCP), Maroc", "2023", "https://m.hcp.ma/file/240805", "pdf")
SOURCES = {
 "Jordan DOS LFS 2024": S("jor_lfs2024", "nso/Jordan/ex184/Jordan_DOS_LFS_2024.pdf",
    "Press Release. Department of Statistics: 21.4 Unemployment Rate for 2024", "Department of Statistics (DOS), Jordan", "2025",
    "https://dosweb.dos.gov.jo/labourforce/employment-and-unemployment/", "landing"),
 "EVAR 2025 (WFP-CAPMAS)": S("egy_evar2025", "nso/Egypt/ex039/Egypt_EVAR_2025_WFP_CAPMAS.pdf",
    "Egypt Vulnerability Assessment of Refugees (EVAR) 2025", "WFP, UNHCR and CAPMAS", "2025",
    "https://data.unhcr.org/en/documents/details/122243", "landing"),
 "DANE differential poverty 2022": S("col_dane_pobreza2022", "nso/Colombia/ex412/DANE_Poverty_DifferentialApproach_2022.pdf",
    "Comunicado de prensa. Pobreza monetaria con enfoque diferencial (población víctima del conflicto), 2022", "DANE, Colombia", "2023",
    "https://www.dane.gov.co/files/operaciones/PM/cp-PMEnfoqueDiferencial-2022.pdf", "pdf"),
 "INE Estudio Poblacion Desplazada": S("hnd_ine_desplazada2024", "nso/Honduras/ex051/Estudio-Poblacion-Desplazada-Internamente-EPHPM-2024.pdf",
    "Población desplazada internamente en Honduras: Resultados de la Encuesta Permanente de Hogares de Propósitos Múltiples (EPHPM) 2024",
    "Instituto Nacional de Estadística (INE), Honduras", "2026",
    "https://ine.gob.hn/wp-content/uploads/2026/04/Estudio-Poblacion-Desplazada-Internamente-EPHPM-2024.pdf", "pdf"),
 "WB-UNHCR JDC Somalia": S("som_livelihoods_lost", "nso/Somalia/ex394/Somalia_Livelihoods_Lost_displacement.pdf",
    "Livelihoods Lost: Findings from two rounds of the Somalia Displacement Phone Survey (2022)",
    "World Bank, UNHCR and the World Bank-UNHCR Joint Data Center on Forced Displacement", "2024",
    "https://www.jointdatacenter.org/wp-content/uploads/2024/11/Somalia-displacement-report_FINAL.pdf", "pdf"),
 "PCBS": S("pse_pcbs_refugeeday2026", "nso/State_of_Palestine/ex268/PCBS_WorldRefugeeDay_2026.pdf",
    "World Refugee Day, June 20th, 2026", "Palestinian Central Bureau of Statistics (PCBS)", "2026",
    "https://pcbs.gov.ps/media/l32ajxsb/worldrefugeedayinfograph2026e.pdf", "pdf"),
 "UBOS": _UNHS,
 "UBOS Uganda National Household Survey": _UNHS,
 "Home Office integration report": S("gbr_ons_resettled_refugees", "nso/United_Kingdom/ex056/pdf.pdf",
    "Early integration outcomes for refugees resettled in England and Wales: 2015 to 2021", "Office for National Statistics (ONS)", "2023",
    "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/articles/earlyintegrationoutcomesforrefugeesresettledinenglandandwales/2015to2021", "landing"),
 "INEI Condiciones de Vida Poblacion Venezolana 2024": S("per_inei_venezolana2024", "nso/Peru/ex255/Peru_INEI_CondicionesVida_Venezolana_2024.pdf",
    "Informe técnico de Condiciones de vida de la población venezolana en las ciudades de estudio, 2024",
    "Instituto Nacional de Estadística e Informática (INEI), Perú", "2025", "https://data.unhcr.org/es/documents/details/121970", "landing"),
 "NBS Report of IDPs in Nigeria": _NGA,
 "Nigeria NBS IDP Survey 2023": _NGA,
 "INSD ESEP-PDI": S("bfa_esep_pdi", "nso/Burkina/ex115/Burkina_ESEP-PDI_AnalysisReport.pdf",
    "Enquête Socioéconomique et de Protection des Populations Déplacées Internes et des Communautés Hôtes (ESEP-PDI): Rapport d’analyse",
    "Institut National de la Statistique et de la Démographie (INSD), Burkina Faso", "2026",
    "https://www.insd.bf/sites/default/files/2026-02/Rapport%20Analyse_ESEP-PDI.pdf", "pdf"),
 "ECADEFI Chihuahua 2021 (INEGI/JIPS/ACNUR)": S("mex_ecadefi_chih2021", "nso/Mexico/ex374/ecadefi_chih_2021_presentacion_ejecutiva.pdf",
    "Encuesta para Caracterizar a la población en situación de Desplazamiento Forzado Interno en el Estado de Chihuahua (ECADEFI-CHIH) 2021: Principales Resultados",
    "INEGI, México", "2022", "https://www.inegi.org.mx/programas/ecadefi/2021/", "landing"),
 "INS/UNHCR ECVM-PDF 2024": S("cod_ecvm2024", "nso/DRC/ex151/ECVM_RDC_2024_rapport_final.pdf",
    "Enquête sur les Conditions de Vie des Ménages (ECVM-2024): Rapport final", "Institut National de la Statistique (INS), RDC", "2025",
    "https://www.ins.gouv.cd/publications/enquete-conditions-vie-menages-ecvm-2024", "landing"),
 # published as a spreadsheet annex (Table 3.9), not a PDF: link only, no image
 "Moldova PHC 2024 (BNS)": S("mda_phc2024", "",
    "Final Results of the 2024 Population and Housing Census: Migration Characteristics of the Population",
    "National Bureau of Statistics of the Republic of Moldova", "2025",
    "https://statistica.gov.md/en/final-results-of-the-2024-population-and-housing-census-migration-10121_61958.html", "landing"),
 "Shona Socioeconomic Survey 2024 (UNHCR)": _KEN,
 "Shona Socioeconomic Survey 2024": _KEN,
 "Malawi DHS 2024 / JDC Dzaleka": S("mwi_dzaleka_dhs2024", "Malawi-DHS-report-FINAL-.pdf",
    "Understanding the health, nutrition and population situation in Dzaleka Refugee Camp: A Comparative Analysis of Malawi Demographic and Health Survey Data",
    "National Statistical Office of Malawi and UNHCR, with the World Bank-UNHCR Joint Data Center", "2026",
    "https://www.jointdatacenter.org/wp-content/uploads/2026/07/Malawi-DHS-report-FINAL-.pdf", "pdf"),
 "UDHS 2022 (Ch.20)": _UDHS,
 "Uganda DHS 2022 (UBOS)": _UDHS,
 "Lebanon MICS 2023 Subnational": _LBN,
 "Lebanon MICS 2023 Subnational (CAS)": _LBN,
 "NISR RPHC2022 Refugees Thematic": S("rwa_rphc2022_refugees", "nso/Rwanda/ex002/RPHC2022_Refugees_Thematic.pdf",
    "Fifth Rwanda Population and Housing Census, 2022. Thematic Report: Socio-economic status of refugees",
    "National Institute of Statistics of Rwanda (NISR)", "2024",
    "https://statistics.gov.rw/sites/default/files/documents/2025-02/RPHC2022_Refugees%20Thematic_report.pdf", "pdf"),
 "HCP Refugee Survey 2022": _MAR,
 "Morocco HCP 2022 refugee study": _MAR,
 "FIERI-UNHCR refugee survey 2024 (Istat stats)": S("ita_unhcr_refugees2025", "nso/Italy/ex259/UNHCR_socioeconomic_refugees_italy_2025.pdf",
    "Integration between challenges and opportunities: A study on socio-economic conditions of refugees in Italy. Final Report",
    "UNHCR", "2025", "https://www.unhcr.org/sites/default/files/2025-06/study-of-socio-economic-conditions-of-refugees-in-italy.pdf", "pdf"),
}

# ---- per-row hints --------------------------------------------------------------------------------
# key: "<country>|<sdg>|<value>|<source>|<page>" as in the csv.
#   p     : PDF page (1-based) to use, instead of searching around the csv page
#   q     : what to highlight on that page, instead of the csv value. Each item is a phrase, or
#           {"t": text, "row": row label, "col": column label, "y": [from, to], "x": [from, to]} = the word equal
#           to t that lines up with the labels (y/x: part of the page to look in, as fractions)
#   nth   : which match of a phrase to take when it occurs several times (0 = first)
#   clip  : [top, bottom] of the crop as fractions of the page height (instead of the automatic band)
#   pad   : [above, below] the value, as fractions of the page height (instead of the automatic band)
#   xclip : [left, right] of the crop as fractions of the page width (two-page spreads, wide pages)
#   check : what the page shows when that differs from the csv value (copied to the manifest)
_SYR, _PAL = "Settlements of", "Camps of"
def _lb(p, t, lab, y=None, clip=None, col=None, row=None):
    q = {"t": t}
    if col: q["col"] = col
    if row: q["row"] = row
    if not col and not row: q["col"] = lab
    if y: q["y"] = y
    h = {"p": p, "q": [q]}
    if clip: h["clip"] = clip
    return h
_L = "Lebanon MICS 2023 Subnational (CAS)"
HINTS = {
 "Jordan|8.5.2|21.4%|Jordan DOS LFS 2024|": {"p": 1, "q": ["21.4%"], "clip": [0.05, 0.45]},
 "Egypt|1.2.1|65%|EVAR 2025 (WFP-CAPMAS)|29": {"p": 29, "q": ["65 percent"], "xclip": [0.02, 0.96], "clip": [0.42, 0.98]},
 "Egypt|2.1.2|58%|EVAR 2025 (WFP-CAPMAS)|30": {"p": 30, "q": ["58 percent"], "xclip": [0.5, 1.0], "clip": [0.40, 0.98]},
 "Colombia|1.2.1|51.9%|DANE differential poverty 2022|3": {"p": 3, "q": ["51,9%"]},
 "Honduras|1.2.1|45%|INE Estudio Poblacion Desplazada|6": {"p": 6, "q": ["45 por ciento"]},
 "Honduras|2.1.2|46%|INE Estudio Poblacion Desplazada|49": {"p": 49, "q": ["46 por ciento"]},
 "Honduras|4.1.2|80%|INE Estudio Poblacion Desplazada|37": {"p": 37, "q": ["80 por ciento"], "nth": 1, "pad": [0.22, 0.45]},
 "Somalia|1.2.1|63%|WB-UNHCR JDC Somalia|37": {"p": 37, "q": ["63 percent"]},
 "Somalia|6.2.1|61%|WB-UNHCR JDC Somalia|31": {"p": 31, "q": ["61 percent"]},
 "Somalia|11.1.1|75%|WB-UNHCR JDC Somalia|24": {"p": 24, "q": ["75 percent"]},
 "State of Palestine|8.5.2|29.2%|PCBS|2": {"p": 2, "q": ["29.2%"], "clip": [0.39, 0.86]},
 "Uganda|6.1.1|91%|UBOS|17": {"p": 17, "q": ["(91%)"]},
 "United Kingdom|11.1.1|69%|Home Office integration report|3": {"p": 3, "q": ["(69%)"]},
 "Peru|6.1.1|89%|INEI Condiciones de Vida Poblacion Venezolana 2024|": {"p": 20, "q": ["88,7%"]},
 "Peru|11.1.1|15%|INEI Condiciones de Vida Poblacion Venezolana 2024|20": {"p": 20, "q": ["14,7%"]},
 "Uganda|4.1.2|71%|UBOS Uganda National Household Survey|36": {"p": 36, "q": ["71%"]},
 "Nigeria|7.1.1|61%|NBS Report of IDPs in Nigeria|28": {"p": 28, "q": ["38.9 percent"]},
 "Nigeria|10.3.1|41%|Nigeria NBS IDP Survey 2023|18": {"p": 19, "q": ["40.6 percent"]},
 "Burkina Faso|1.2.1|93%|INSD ESEP-PDI|33": {"p": 33, "q": ["92,6%"]},
 "Burkina Faso|2.1.2|76%|INSD ESEP-PDI|37": {"p": 37, "q": ["75,6%"]},
 "Mexico|4.1.2|74%|ECADEFI Chihuahua 2021 (INEGI/JIPS/ACNUR)|48": {"p": 48, "q": ["26.4%"], "clip": [0, 1]},
 "DR Congo|2.1.2|95%|INS/UNHCR ECVM-PDF 2024|166": {"p": 198, "q": [{"t": "95,0", "row": "PDI"}]},
 "DR Congo|7.1.1|15%|INS/UNHCR ECVM-PDF 2024|157": {"p": 189, "q": [{"t": "15,3", "row": "PDI"}]},
 "Kenya|7.1.1|97%|Shona Socioeconomic Survey 2024|46": {"p": 47, "q": ["83.08%", "13.88%"]},
 "Kenya|6.1.1|92%|Shona Socioeconomic Survey 2024|44": {"p": 44, "q": ["92.3 percent"]},
 "Kenya|6.2.1|92%|Shona Socioeconomic Survey 2024|45": {"p": 45, "q": ["92 percent"]},
 "Malawi|6.1.1|30%|Malawi DHS 2024 / JDC Dzaleka|": {"p": 14, "q": ["30 percent"]},
 "Malawi|6.2.1|76%|Malawi DHS 2024 / JDC Dzaleka|": {"p": 15, "q": ["76 percent"]},
 "Malawi|16.9.1|92%|Malawi DHS 2024 / JDC Dzaleka|": {"p": 17, "q": [{"t": "92"}]},
 "Uganda|6.2.1|29%|UDHS 2022 (Ch.20)|385": {"p": 385, "q": ["(29%)"]},
 "Uganda|7.1.1|4%|UDHS 2022 (Ch.20)|390": {"p": 390, "q": [{"t": "4.3", "row": "Electricity"}]},
 "Uganda|3.1.2|98%|Uganda DHS 2022 (UBOS)|388": {"p": 388, "q": ["98%"]},
 "Rwanda|4.1.2|90%|NISR RPHC2022 Refugees Thematic|60": {"p": 61, "q": [{"t": "90.4"}]},
 "Rwanda|6.1.1|84%|NISR RPHC2022 Refugees Thematic|103": {"p": 103, "q": ["84.2%"]},
 "Rwanda|6.2.1|94%|NISR RPHC2022 Refugees Thematic|104": {"p": 104, "q": ["94.3%"]},
 "Rwanda|7.1.1|41%|NISR RPHC2022 Refugees Thematic|106": {"p": 106, "q": ["24%", "17.4%"]},
 "Rwanda|16.9.1|86%|NISR RPHC2022 Refugees Thematic|79": {"p": 79, "q": ["86.1 percent"]},
 "Morocco|6.1.1|99%|HCP Refugee Survey 2022|33": {"p": 33, "q": ["99%"], "xclip": [0, 0.5]},
 "Morocco|6.2.1|97%|HCP Refugee Survey 2022|33": {"p": 33, "q": ["96,9%"], "xclip": [0, 0.5]},
 "Morocco|7.1.1|99%|HCP Refugee Survey 2022|33": {"p": 33, "q": ["99,4%"], "xclip": [0, 0.5]},
 "Morocco|8.5.2|19%|HCP Refugee Survey 2022|18": {"p": 18, "q": ["(19%)"], "xclip": [0, 0.5], "pad": [0.12, 0.2]},
 "Morocco|16.1.4|70%|Morocco HCP 2022 refugee study|": {"p": 13, "q": ["(69,7%)"], "xclip": [0.5, 1], "pad": [0.06, 0.35]},
 "Italy|8.3.1|17%|FIERI-UNHCR refugee survey 2024 (Istat stats)|78": {"p": 79, "q": ["17% of interviewed"], "pad": [0.10, 0.50]},
 "Italy|10.3.1|45%|FIERI-UNHCR refugee survey 2024 (Istat stats)|31": {"p": 32, "q": ["(45%)"]},
 "Italy|1.2.1|67%|FIERI-UNHCR refugee survey 2024 (Istat stats)|53": {"p": 54, "q": ["67% of respondents"]},
 # Lebanon MICS snapshots: values are chart / table labels, picked by the column or row they belong to
 "Lebanon|6.1.1|88%|Lebanon MICS 2023 Subnational|29": _lb(29, "88", _SYR, y=[0.1, 0.45], clip=[0.03, 0.45]),
 "Lebanon|6.1.1|88%|" + _L + "|29": _lb(29, "88", _SYR, y=[0.1, 0.45], clip=[0.03, 0.45]),
 "Lebanon|6.2.1|91%|Lebanon MICS 2023 Subnational|30": {"p": 30, "clip": [0.03, 0.40], "q": [{"t": "7", "row": "Settlements of displaced", "col": "Sewer connection", "y": [0.1, 0.4]}, {"t": "84", "row": "Settlements of displaced", "y": [0.1, 0.4]}]},
 "Lebanon|6.2.1|91%|" + _L + "|30": {"p": 30, "clip": [0.03, 0.40], "q": [{"t": "7", "row": "Settlements of displaced", "col": "Sewer connection", "y": [0.1, 0.4]}, {"t": "84", "row": "Settlements of displaced", "y": [0.1, 0.4]}]},
 "Lebanon|6.2.1|100%|Lebanon MICS 2023 Subnational|30": {"p": 30, "clip": [0.03, 0.40], "q": [{"t": "97", "row": "Camps of Palestinian", "y": [0.1, 0.4]}, {"t": "3", "row": "Camps of Palestinian", "col": "Onsite sanitation", "y": [0.1, 0.4]}]},
 "Lebanon|2.2.1|31%|" + _L + "|": _lb(21, "31", _SYR, y=[0.2, 0.4], clip=[0.19, 0.60]),
 "Lebanon|2.2.1|12%|" + _L + "|": _lb(21, "12", _PAL, y=[0.2, 0.4], clip=[0.19, 0.60]),
 "Lebanon|2.2.2|4%|" + _L + "|": _lb(21, "4", _SYR, y=[0.4, 0.6], clip=[0.19, 0.60]),
 "Lebanon|2.2.2|3%|" + _L + "|": _lb(21, "3", _PAL, y=[0.4, 0.6], clip=[0.19, 0.60]),
 "Lebanon|3.1.2|98%|" + _L + "|": _lb(19, "98", None, row="Settlements of", col="Skilled", y=[0.4, 0.7], clip=[0.38, 0.70]),
 "Lebanon|3.1.2|99%|" + _L + "|": _lb(19, "99", None, row="Camps of Palestinian", col="Skilled", y=[0.4, 0.7], clip=[0.38, 0.70]),
 "Lebanon|3.8.1|88%|" + _L + "|": _lb(19, "88", None, row="Settlements of", col="ANC: At least 1", y=[0.4, 0.7], clip=[0.38, 0.70]),
 "Lebanon|3.8.1|85%|" + _L + "|": _lb(19, "85", None, row="Camps of Palestinian", col="ANC: At least 1", y=[0.4, 0.7], clip=[0.38, 0.70]),
 "Lebanon|4.2.1|41%|" + _L + "|": _lb(25, "41", None, row="Settlements of", y=[0.6, 0.95], clip=[0.63, 0.93]),
 "Lebanon|4.2.1|63%|" + _L + "|": _lb(25, "63", None, row="Camps of Palestinian", y=[0.6, 0.95], clip=[0.63, 0.93]),
 "Lebanon|4.2.2|14%|" + _L + "|": _lb(33, "14", _SYR, y=[0.6, 0.9], clip=[0.54, 0.98]),
 "Lebanon|4.2.2|68%|" + _L + "|": _lb(33, "68", _PAL, y=[0.6, 0.9], clip=[0.54, 0.98]),
 "Lebanon|4.4.1|0%|" + _L + "|": _lb(15, "0", None, row="Settlements of", col="Performed at Least", y=[0.55, 0.9], clip=[0.53, 0.92]),
 "Lebanon|4.4.1|10%|" + _L + "|": _lb(15, "10", None, row="Camps of Palestinian", col="Performed at Least", y=[0.55, 0.9], clip=[0.53, 0.92]),
 "Lebanon|17.8.1|51%|" + _L + "|": _lb(15, "51", None, row="Settlements of", col="Internet Use", y=[0.55, 0.9], clip=[0.53, 0.92]),
 "Lebanon|17.8.1|90%|" + _L + "|": _lb(15, "90", None, row="Camps of Palestinian", col="Internet Use", y=[0.55, 0.9], clip=[0.53, 0.92]),
 "Lebanon|5.3.1|58%|" + _L + "|": _lb(38, "58", _SYR, y=[0.2, 0.42], clip=[0.19, 0.425]),
 "Lebanon|5.3.1|25%|" + _L + "|": _lb(38, "25", _PAL, y=[0.2, 0.42], clip=[0.19, 0.425]),
 "Lebanon|8.7.1|23%|" + _L + "|": _lb(40, "23", _SYR, y=[0.2, 0.4], clip=[0.20, 0.405]),
 "Lebanon|8.7.1|9%|" + _L + "|": _lb(40, "9", _PAL, y=[0.2, 0.4], clip=[0.20, 0.405]),
 "Lebanon|16.2.1|81%|" + _L + "|": _lb(43, "81", _SYR, y=[0.5, 0.78], clip=[0.51, 0.78]),
 "Lebanon|16.2.1|82%|" + _L + "|": _lb(43, "82", _PAL, y=[0.5, 0.78], clip=[0.51, 0.78]),
}

CAPTION = re.compile(r"^\s*(table|figure|fig\.|chart|graph|tableau|graphique|figura|cuadro|gr[aá]fico|tabla|"
                     r"tabella|grafico|box|map)\s*[\dA-Z]", re.I)
STOP = set("the and with from that this for des les une dans pour sur par del las los con que por una "
           "not are who their have has was were than more less among access total national".split())


def find_pdf(rel):
    roots = [os.path.expanduser(r) for r in paths.path("reports_src").split(os.pathsep) if r]
    for r in roots:
        for cand in (os.path.join(r, rel), os.path.join(r, os.path.basename(rel))):
            if os.path.isfile(cand):
                return cand
    return None


def num_targets(value, note):
    """Texts that count as 'the value' on a page: 65 -> 65, 65.0, 65,0 ; plus decimals in the note that round to it."""
    v = value.strip().rstrip("%").strip()
    out = []
    try:
        x = float(v)
    except ValueError:
        return [v]
    for m in re.findall(r"\d+[.,]\d+", note or ""):
        try:
            if round(float(m.replace(",", "."))) == round(x) or abs(float(m.replace(",", ".")) - x) < 0.05:
                out += [m.replace(",", "."), m.replace(".", ",")]
        except ValueError:
            pass
    if "." in v:
        out += [v, v.replace(".", ",")]
    else:
        out += [v, v + ".0", v + ",0"]
    seen, res = set(), []
    for t in out:
        if t not in seen:
            seen.add(t); res.append(t)
    return res


def norm_tok(w):
    return w.strip("()[]{}%;:*·•‰<>≈~=+").rstrip(".,").lstrip(",")


def keywords(*texts):
    ks = []
    for t in texts:
        for w in re.findall(r"[A-Za-zÀ-ÿ]{4,}", t or ""):
            w = w.lower()
            if w not in STOP:
                ks.append(w)
    return ks


def page_offset(doc):
    """printed page number = PDF page number - offset (most common offset over the document), or None."""
    c = collections.Counter()
    n = len(doc)
    step = max(1, n // 60)
    for i in range(0, n, step):
        lines = [l.strip() for l in doc[i].get_text().splitlines() if l.strip()]
        for l in lines[:4] + lines[-4:]:
            m = re.fullmatch(r"(?:page\s*|p\.\s*|-\s*)?(\d{1,3})(?:\s*-)?", l, re.I)
            if m:
                c[(i + 1) - int(m.group(1))] += 1
    if not c:
        return None
    off, k = c.most_common(1)[0]
    return off if k >= 3 else None


def matches_on_page(page, targets, kws):
    """[(score, rect, text)] for words on the page equal to one of the targets."""
    words = page.get_text("words")
    low = [(w[4].lower(), (w[1] + w[3]) / 2, (w[0] + w[2]) / 2) for w in words]
    res = []
    for i, w in enumerate(words):
        raw = w[4]
        t = norm_tok(raw)
        if t not in targets:
            continue
        sc = 10 - targets.index(t)          # earlier target = more specific
        nxt = words[i + 1][4] if i + 1 < len(words) else ""
        if "%" in raw or nxt.startswith("%"):
            sc += 3
        y = (w[1] + w[3]) / 2
        near = sum(1 for (lw, ly, lx) in low if abs(ly - y) < 70 and any(k in lw for k in kws))
        sc += min(near, 8) * 0.8
        onpage = len({k for k in kws if any(k in lw for (lw, _, _) in low)})
        sc += min(onpage, 6) * 0.5
        res.append((sc, fitz.Rect(w[:4]), raw))
    res.sort(key=lambda r: -r[0])
    return res


def pick(page, q, nth=0):
    """One highlight rectangle for a hint item: a phrase, or {t: text, row: label, col: label, y: [a, b], x: [a, b]}
    = the word equal to t that lines up with the row label (same height) and/or the column label (same x)."""
    if isinstance(q, str):
        rs = page.search_for(q)
        return (rs[nth] if nth < len(rs) else rs[0]) if rs else None
    R = page.rect
    ya, yb = q.get("y", [0, 1]); xa, xb = q.get("x", [0, 1])
    rows = page.search_for(q["row"]) if q.get("row") else []
    cols = page.search_for(q["col"]) if q.get("col") else []
    if (q.get("row") and not rows) or (q.get("col") and not cols):
        return None
    best = None
    for w in page.get_text("words"):
        if norm_tok(w[4]) != q["t"] and w[4] != q["t"]:
            continue
        r = fitz.Rect(w[:4]); cx = (r.x0 + r.x1) / 2; cy = (r.y0 + r.y1) / 2
        if not (R.y0 + ya * R.height <= cy <= R.y0 + yb * R.height and R.x0 + xa * R.width <= cx <= R.x0 + xb * R.width):
            continue
        cost = 0
        if rows:
            cost += min(abs(cy - (l.y0 + l.y1) / 2) for l in rows)
        if cols:
            cost += min(abs(cx - (l.x0 + l.x1) / 2) for l in cols)
        if best is None or cost < best[0]:
            best = (cost, r)
    return best[1] if best else None


def locate(doc, row, hint, off):
    """-> (pdf_page_index, [rects], found)"""
    targets = num_targets(row["value"], row["note"])
    kws = keywords(row["note"], row["population"]) + [k.lower() for k in hint.get("near", [])]
    if "p" in hint:
        cand = [hint["p"] - 1]
    else:
        pg = (row["page"] or "").strip()
        if pg.isdigit():
            p = int(pg)
            base = [p - 1]
            if off is not None and off != 0:
                base.append(p - 1 + off)
            cand = []
            for b in base:
                for d in (0, 1, -1, 2, -2):
                    if 0 <= b + d < len(doc) and b + d not in cand:
                        cand.append(b + d)
        else:
            cand = list(range(len(doc)))
    if "q" in hint:
        i = cand[0]
        rects = [r for r in (pick(doc[i], q, hint.get("nth", 0)) for q in hint["q"]) if r is not None]
        return i, rects, len(rects) == len(hint["q"])
    best = None
    for order, i in enumerate(cand):
        ms = matches_on_page(doc[i], targets, kws)
        if not ms:
            continue
        n = hint.get("nth", 0)
        m = ms[n] if n < len(ms) else ms[0]
        sc = m[0] - (0.6 * order if len(cand) <= 12 else 0)
        if best is None or sc > best[0]:
            best = (sc, i, m[1], m[2])
    if best is None:
        return cand[0], [], False
    return best[1], [best[2]], True


def band(page, rects, hint):
    """Crop: full width, from the caption above the value to the next caption / a little below the value."""
    R = fitz.Rect(page.rect)
    H = R.height
    if "xclip" in hint:                                 # a spread or a wide page: keep only part of the width
        R = fitz.Rect(R.x0 + R.width * hint["xclip"][0], R.y0, R.x0 + R.width * hint["xclip"][1], R.y1)
    if "clip" in hint:
        return fitz.Rect(R.x0, R.y0 + H * hint["clip"][0], R.x1, R.y0 + H * hint["clip"][1])
    if not rects:
        return fitz.Rect(R)
    if "pad" in hint:
        return fitz.Rect(R.x0, max(R.y0, min(r.y0 for r in rects) - H * hint["pad"][0]),
                         R.x1, min(R.y1, max(r.y1 for r in rects) + H * hint["pad"][1]))
    y0 = min(r.y0 for r in rects); y1 = max(r.y1 for r in rects)
    caps = []
    for b in page.get_text("blocks"):
        if b[6] != 0:
            continue
        first = b[4].strip().split("\n")[0]
        if CAPTION.match(first) and len(first) < 220:
            caps.append(b[1])
    above = [c for c in caps if c <= y0 + 2 and y0 - c < 0.55 * H]
    below = [c for c in caps if c > y1 + 4]
    top = (max(above) - 14) if above else (y0 - 0.20 * H)
    bot = (min(below) - 6) if below else (y1 + 0.22 * H)
    if bot - top > 0.62 * H:                       # too tall: keep ~45% of the page around the value
        mid = (y0 + y1) / 2
        top = max(top, mid - 0.25 * H); bot = min(bot, top + 0.5 * H)
        if y1 + 12 > bot:
            bot = y1 + 0.1 * H
    top = max(R.y0, min(top, y0 - 18)); bot = min(R.y1, max(bot, y1 + 18))
    return fitz.Rect(R.x0, top, R.x1, bot)


def trim(page, clip, z):
    """Cut blank bands off the top and bottom of the crop."""
    pix = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=clip, alpha=False, colorspace=fitz.csGRAY)
    w, h, buf = pix.width, pix.height, pix.samples
    ink = [min(buf[y * pix.stride:y * pix.stride + w]) < 225 for y in range(h)]
    if True not in ink:
        return clip
    top = ink.index(True); bot = h - 1 - ink[::-1].index(True)
    m = 14
    return fitz.Rect(clip.x0, clip.y0 + max(0, top - m) / z, clip.x1, clip.y0 + min(h, bot + m) / z)


def render(page, rects, clip, out):
    for r in rects:
        box = r + (-2, -1.5, 2, 1.5)
        a = page.add_highlight_annot(box)
        a.set_colors(stroke=(1, 0.93, 0.35)); a.set_opacity(0.6); a.update()
        page.draw_rect(box, color=(0.93, 0.62, 0.05), width=0.9, radius=0.15)      # outline: visible on dark charts too
    z = WIDTH / clip.width
    clip = trim(page, clip, z)
    pix = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=clip, alpha=False)
    for q in (70, 62, 54, 46, 38, 30):
        data = pix.tobytes("jpeg", jpg_quality=q)
        if len(data) <= MAX_BYTES:
            break
    with open(out, "wb") as f:
        f.write(data)
    return pix.width, pix.height


def main():
    probe = "--probe" in sys.argv
    src_csv = os.path.join(paths.path("sdg"), "data", "gain_sdg_values_promoted.csv")
    rows = [r for r in csv.DictReader(open(src_csv, encoding="utf-8-sig")) if r["method"] == "extracted"]
    man = {"rows": {}, "sources": {}}
    old = json.load(open(MANIFEST, encoding="utf-8")).get("rows", {}) if os.path.exists(MANIFEST) else {}
    docs, offs, groups = {}, {}, collections.OrderedDict()
    for s, d in SOURCES.items():
        man["sources"][s] = {"title": d["title"], "publisher": d["publisher"], "year": d["year"], "url": d["url"],
                             "url_kind": d["url_kind"], "file": os.path.basename(d["f"]) if d["f"] else ""}
    for r in rows:
        key = "|".join([r["country"], r["sdg"], r["value"], r["source"], r["page"]])
        d = SOURCES.get(r["source"])
        if not d or not d["f"]:
            print("no file  ", key); continue
        if d["f"] not in docs:
            fp = find_pdf(d["f"])
            docs[d["f"]] = fitz.open(fp) if fp else None
            offs[d["f"]] = page_offset(docs[d["f"]]) if fp else None
        doc = docs[d["f"]]
        if doc is None:                                 # report not on this machine: keep what was made before
            if key in old and not probe:
                man["rows"][key] = old[key]
            print("missing  ", os.path.basename(d["f"]), key); continue
        hint = HINTS.get(key, {})
        if hint.get("skip"):
            print("skipped  ", key); continue
        i, rects, found = locate(doc, r, hint, offs[d["f"]])
        if not found and not (r["page"] or "").strip().isdigit() and "p" not in hint:
            print("not found", key); continue
        groups.setdefault((d["slug"], d["f"], i), []).append((key, r, rects, found, hint))
        if probe:
            ctx = ""
            if rects:
                rr = rects[0]
                ctx = doc[i].get_text("text", clip=fitz.Rect(0, rr.y0 - 3, doc[i].rect.x1, rr.y1 + 3)).replace("\n", " ")[:110]
            print("%-9s pdf p%-3d (csv %s, offset %s) %s  ::  %s" % ("found" if found else "NOT FOUND", i + 1, r["page"] or "-", offs[d["f"]], key, ctx))
    if probe:
        return
    os.makedirs(OUT_DIR, exist_ok=True)
    for (slug, f, i), items in groups.items():
        doc = docs[f]
        page = doc[i]
        rects = [x for it in items for x in it[2]]
        hint = {}
        for it in items:                                # several rows on one page: the crop covers all of them
            for k in ("xclip", "pad"):
                if k in it[4]:
                    hint[k] = it[4][k]
            if "clip" in it[4]:
                c = it[4]["clip"]
                hint["clip"] = [min(c[0], hint["clip"][0]), max(c[1], hint["clip"][1])] if "clip" in hint else list(c)
        clip = band(page, rects, hint)
        name = "%s_p%03d.jpg" % (slug, i + 1)
        w, h = render(page, rects, clip, os.path.join(OUT_DIR, name))
        for key, r, rc, found, _ in items:
            man["rows"][key] = {"img": "reports/" + name, "w": w, "h": h, "page": i + 1, "found": bool(found),
                                "src": r["source"]}
            ck = HINTS.get(key, {}).get("check")
            if ck:
                man["rows"][key]["check"] = ck
    json.dump(man, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("%d rows, %d images, %d sources -> %s" % (len(man["rows"]), len(groups), len(man["sources"]), os.path.relpath(MANIFEST, ROOT)))


if __name__ == "__main__":
    main()
