#!/usr/bin/env python
# "As printed" excerpts of the questions in the question bank, taken from the ORIGINAL questionnaire files.
#
#   python build/mk_excerpts.py                 all surveys
#   python build/mk_excerpts.py 12_HBS_SSD ...  only these (the other manifest entries are kept)
#
# Reads   path("bank")       question_bank_v1.csv
#         path("originals")  folder "All Surveys" with one sub-folder per survey_id
# Writes  excerpts/<survey_id>/pNN_x.jpg   crops of PDF pages (question highlighted in yellow)
#         build/excerpts.json              manifest, keyed by survey_id, then by 0-based bank row index
#
# PDF  -> image band around the question.  Spreadsheet / Word -> the cells as printed (no image).
# Only questionnaire files are used: never desk reviews, reports, manuals or microdata.
# Needs: pandas, pymupdf, pillow, openpyxl, python-docx.  Old .doc files need macOS `textutil`.
import io, json, os, re, shutil, subprocess, sys, tempfile, unicodedata, warnings

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import path
import pandas as pd

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG_DIR = os.path.join(ROOT, "excerpts")
MANIFEST = os.path.join(HERE, "excerpts.json")
IMG_W = 1100          # px
MAX_BYTES = 150_000
MAX_ROWS, MAX_COLS, MAX_CHARS = 12, 6, 300

# survey_id -> folder name, where it differs
FOLDER = {"25_EMOP_MLI": "25&25bis_EMOP_MLI", "25bis_EMOP_MLI": "25&25bis_EMOP_MLI", "28bis_MICS_BFA": "28 bis_MICS_BFA"}


def S(file, when=None, **opt):
    """One source: file (relative to the survey folder), optional regex on 'qid | source_location', options."""
    return dict(file=file, when=when, **opt)


# First source whose `when` matches wins. file=None: no original questionnaire for these rows (skipped).
# PDF options: above/below = padding in points round the question. Horizontal extent, instead of the full
# page width: box=(left,right) points either side of the question (dense roster forms; neighbours merge
# up to maxw points), cols=N the page column holding it, xr=(a,b) a fixed share of the page width.
SRC = {
    "01_ENAHOPV": [S("data/CED-01A-1000-2024.pdf", below=150)],
    "02_ECH_CR": [S("Informe Acnur Módulo Migración de la Encuesta Continua de Hogares & cuestionarios (1).pdf",
                    xr=(0, 0.6), above=25, below=260)],
    "03_EPHPM_HON": [S(None, when=r"Piloting\.docx", why="source is a validation report, not a questionnaire"),
                     S("Questionnaire-2024_PD.xlsx", when=r"\.xlsx"),
                     S("02. Boleta EPHPM 2024 Junio.pdf", above=30, below=120)],
    "05_ENVIPE_MEX": [S(None, when=r"https?://", why="2025 edition, only cited as a URL; local original is the 2023 edition"),
                      S("questionnaire_principal_envipe2023.pdf", below=40)],
    "06_ENADID_MEX": [S("2023/hogar_enadid23.pdf", below=230)],
    "07_LEONA_MMR": [S("Asia_Myanmar Survey_ID Questions.docx")],
    "08_EICVMB_BDI": [S("EICVMB2019_QUEST PRINCIPAL MODELE CAPI FINAL.xlsx")],
    "10_SESRE_ETH": [S("sesre_questionnaire_english_version_nov_10_2022.xlsx")],
    "11_KIHBS_KEN": [S("KIHBS Q1A_Household Member Information  1.06.25.pdf", box=(40, 140), above=30, below=260, maxw=520)],
    "12_HBS_SSD": [S("SSD HH Budget survey 2025.pdf", below=110)],
    # data-dictionary print-out: xr leaves out the columns with case counts
    "14_UNHS_UGA": [S("Questionnaire_ddi-documentation-english-80.pdf", below=420, xr=(0.03, 0.755))],
    "16_PHC_BDI": [S("RGPHAE_VF QMO   QUESTIONNAIRE MENAGE ORDINAIRE TRADUIT EN KIRUNDI 12 juin 2024_VF.pdf", below=150)],
    "17_PHC_DJI": [S("QUEST_MÉNAGE ORDINAIRE_NOMADE_RGPH3 10042023.pdf", box=(140, 260), above=130, below=230, maxw=900)],
    "18_PHC_KEN": [S("2019-Kenya-population-and-Housing-Census-Questionnaire.pdf", box=(110, 130), above=15, below=185, maxw=380)],
    "19_PHC_RWA": [S("PHC2022_Privave HH_Questionnaire_English.pdf", cols=2, below=110)],
    "20_PHC_UGA": [S("National-Population-and-Housing-Census-2024-Questionnaire.pdf", box=(100, 140), above=60, below=200, maxw=520)],
    "21_DS_CMR": [S("XLSForm_Questionnaire Profilage PESoP.xlsx")],
    "22_DS_MOZ": [S("Profiling_QNR_Pemba_Nov 11_FINAL .xlsx")],
    "25_EMOP_MLI": [S("EMOP_QUEST_edition14_Passage1_2025_vf_Nov2024.docx", when=r"docx table 11"),
                    S("EMOP_QUEST_edition14_Passage2_2025_Avril_27042025_PDI.docx")],
    "25bis_EMOP_MLI": [S("Module_MDF_Mali_EMOP_v4.pdf", when=r"Module_MDF", below=200),
                       S("EMOP_QUEST_edition15_Passage1_2026_dec.pdf", below=130)],
    "26_PHC_MLI": [S("IMP_RGPH5_Questionnaire_Menag_Ordinaire_VF_SMAP_20MARS2021.pdf", box=(90, 110), above=25, below=200, maxw=420)],
    "28bis_MICS_BFA": [S("MICS Module Déplacement Forcé.docx", header=True)],
    "32_EHCVM": [S("EHCVM2026_MEN_08092025.xlsm")],
    "34_GPHC_CMR": [S("Ordinary Household Questionnaire.pdf", above=40, below=200)],
    "37_RGPH2024_MOR": [S("Feuille MLF_Long RGPH 2024_Français 10052023.doc")],
    "38_MEDHIMS_MOR": [S("MED-HIMS Manual 1 Light Model Questionnaires  Version 31 December 2018.pdf", below=110)],
    "40_SSESR_MOR": [S("Instruction et Questionnaire Enquête Réfugiés au Maroc _28_ OCTOBRE 2022.docx")],
    "41_UKR_IDP": [S("Questionnaire No. 1-IDP (once a year) - EN[23].docx")],
}

# Hand-set page bands for rows the text search cannot place well: (survey_id, bank row) -> (page, y0, y1[, x0, x1])
BAND = {}
# Wording to search for where the bank text is a paraphrase of what is printed: (survey_id, bank row) -> text
# (a list = several pieces on the same page, all highlighted and all inside the crop)
FIND = {
    ("03_EPHPM_HON", 50): "¿A dónde se mudo?",
    ("05_ENVIPE_MEX", 66): ["4.11 Durante 2022, para protegerse de la delincuencia, ¿en este hogar se realizó algún tipo de medida como",
                            "cambiarse de vivienda o lugar de residencia?"],
    ("14_UNHS_UGA", 149): "E04: What is the MAIN reason this hh member has not attended school?",
}
# Hand-set sheet ranges: (survey_id, bank row) -> "A1:F12" or a list of them (sheet comes from source_location)
RANGE = {
    ("03_EPHPM_HON", 54): ["A2:C3", "AO4:AP5"],
    ("08_EICVMB_BDI", 95): "A37:F38",
    ("08_EICVMB_BDI", 99): ["H2:M4", "P5:P22"],
    ("32_EHCVM", 288): "A10:L10",
    ("32_EHCVM", 317): "B4:H4",
}


# ---------------------------------------------------------------- text helpers
def norm(s):
    s = unicodedata.normalize("NFKC", str(s)).lower()
    return "".join(ch for ch in s if ch.isalnum())


def clean(v, keep_nl=True, cap=True):
    if v is None:
        return ""
    if isinstance(v, float):
        v = ("%.2f" % v) if abs(v - round(v)) > 1e-9 else str(int(round(v)))
    s = str(v).replace("\r", "\n").replace("\xa0", " ")
    lines = [" ".join(x.split()) for x in s.split("\n")]
    s = ("\n" if keep_nl else " ").join(x for x in lines if x)
    s = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "", s)                       # e-mail
    s = re.sub(r"(?<![\w.])\+?\d[\d ()-]{8,}\d(?![\w.])", "", s)           # phone-like
    if cap and len(s) > MAX_CHARS:
        s = s[:MAX_CHARS].rstrip() + "…"
    return s.strip()


PLACEHOLDER = re.compile(r"^[\s|_□☐.…/\\:;,\-–—]*$")


def first_part(text):
    """Bank rows that join two questions with ' / ': search on the first."""
    t = str(text)
    if " / " in t and len(t.split(" / ")[0]) >= 12:
        t = t.split(" / ")[0]
    return t


def qid_tokens(qid):
    q = re.sub(r"\(.*?\)", " ", str(qid))            # drop "(Form A)" etc.
    q = q.split("/")[0]
    q = re.sub(r"^(E15|MDF|ACNUR|PILOT)[- ]", "", q.strip())
    return q.strip()


def needles(row, minlen=14):
    """Search strings (normalised), most specific first."""
    raw = first_part(row.text_original)
    t = norm(raw)
    q = norm(qid_tokens(row.qid))
    out = []
    m = re.match(r"^\s*[\[(]?[A-Za-z]{0,6}[.\-_]?\d[\w.\-]*[\])]?[.:]?\s+(.{8,})$", raw, re.S)
    t2 = norm(m.group(1)) if m else ""
    if q and not t.startswith(q):
        for L in (60, 30, 14):
            out.append(q + t[:L])
    for L in (160, 100, 70, 45, 30, 20, minlen):
        if len(t) >= L:
            out.append(t[:L])
    if len(t) < 20 and t:
        out.append(t)
    for L in (70, 30, 14):
        if len(t2) >= 14:
            out.append(t2[:L])
    seen, res = set(), []
    for n in out:
        if n and n not in seen:
            seen.add(n); res.append(n)
    return res, t, q


def pages_in(loc):
    """Page numbers named in source_location (1-based), 'PDF p.' ones first."""
    loc = str(loc)
    pdfp = [int(x) for x in re.findall(r"PDF\s+pp?\.\s*(\d+)", loc)]
    rng = re.findall(r"pp?\.\s*(\d+)(?:\s*(?:to|and|-|–)\s*(\d+))?", loc)
    allp = []
    for a, b in rng:
        allp.append(int(a))
        if b:
            allp.append(int(b))
    res = []
    for p in pdfp + allp:
        if p not in res:
            res.append(p)
    return res


# ---------------------------------------------------------------- PDF
def pdf_survey(sid, fpath, rows, opt, log):
    import fitz
    from PIL import Image
    doc = fitz.open(fpath)
    n = len(doc)
    cache = {}
    upright = set()

    def turn(pi):
        """Pages whose text is printed sideways are turned upright before anything else."""
        if pi in upright:
            return
        upright.add(pi)
        page = doc[pi]
        tally = {}
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                d = (round(l["dir"][0]), round(l["dir"][1]))
                tally[d] = tally.get(d, 0) + sum(len(sp["text"]) for sp in l["spans"])
        if not tally:
            return
        d = max(tally, key=tally.get)
        rot = {(0, -1): 90, (0, 1): 270, (-1, 0): 180}.get(d)
        if rot and tally[d] > 0.6 * sum(tally.values()):
            page.set_rotation((page.rotation + rot) % 360)
            page.remove_rotation()

    def index(pi):
        if pi not in cache:
            turn(pi)
            words = doc[pi].get_text("words")
            s, owner = [], []
            for wi, w in enumerate(words):
                k = norm(w[4])
                s.append(k); owner.extend([wi] * len(k))
            cache[pi] = (words, "".join(s), owner)
        return cache[pi]

    def locate(i, row):
        nd, full, q = needles(row)
        extra = []
        if (sid, i) in FIND:
            f = FIND[(sid, i)]
            f = f if isinstance(f, list) else [f]
            full = norm(f[0]); nd = [full]; extra = [norm(x) for x in f[1:]]
        stated = [p - 1 for p in pages_in(row.source_location) if 1 <= p <= n]
        near = []
        for d in (1, -1, 2, -2, 3, -3):
            for p in stated:
                if 0 <= p + d < n and p + d not in stated and p + d not in near:
                    near.append(p + d)
        rest = [p for p in range(n) if p not in stated and p not in near]
        tiers = [(stated, 0), (near, 12), (rest, 28)] if stated else [(list(range(n)), 20)]
        for pages, minlen in tiers:
            for nee in nd:
                if len(nee) < minlen:
                    continue
                for pi in pages:
                    words, s, owner = index(pi)
                    at = s.find(nee)
                    if at < 0:
                        continue
                    if q and s.count(nee) > 1:                # same wording twice: take the one by its number
                        labels = [w for w in words if norm(w[4]) == q]
                        if labels:
                            lab, best, k = labels[0], None, at
                            while k >= 0:
                                w = words[owner[k]]
                                dist = abs(w[0] - lab[0]) + abs(w[1] - lab[1])
                                if best is None or dist < best[0]:
                                    best = (dist, k)
                                k = s.find(nee, k + 1)
                            at = best[1]
                    end = at + len(nee)
                    if nee in full:                           # extend the highlight along the full text
                        j = full.find(nee) + len(nee)
                        while j < len(full) and end < len(s) and full[j] == s[end]:
                            j += 1; end += 1
                    ws = set(owner[at:end])
                    for x in extra:
                        k = s.find(x, end)
                        if k >= 0:
                            ws |= set(owner[k:k + len(x)])
                    return pi, [words[w] for w in sorted(ws)], len(nee)
        # last resort: the question number as a word on the stated page
        if q and len(q) >= 3:
            for pi in stated:
                words, s, owner = index(pi)
                for w in words:
                    if norm(w[4]) == q:
                        return pi, [w], 0
        return None

    found, missing = {}, []
    for i, row in rows:
        if (sid, i) in BAND:
            b = BAND[(sid, i)]
            found[i] = (b[0] - 1, [], -1, b[1:])
            continue
        hit = locate(i, row)
        if hit:
            found[i] = hit + (None,)
        else:
            missing.append(i)

    above, below, box = opt.get("above", 14), opt.get("below", 150), opt.get("box")
    cols, maxw, xr = opt.get("cols"), opt.get("maxw", 600), opt.get("xr")
    by_page = {}
    for i, (pi, ws, ln, hand) in found.items():
        pr = doc[pi].rect
        if hand:
            y0, y1 = hand[0], hand[1]
            x0, x1 = (hand[2], hand[3]) if len(hand) > 2 else (pr.x0, pr.x1)
        else:
            y0 = min(w[1] for w in ws) - above
            y1 = max(w[3] for w in ws) + below
            if box:
                x0 = max(pr.x0, min(w[0] for w in ws) - box[0])
                x1 = min(pr.x1, max(w[2] for w in ws) + box[1])
                if x1 - x0 < 340:                      # a lone narrow column: widen rather than over-zoom
                    x1 = min(pr.x1, x0 + 340); x0 = max(pr.x0, x1 - 340)
            elif xr:
                x0, x1 = pr.x0 + xr[0] * pr.width, pr.x0 + xr[1] * pr.width
            elif cols:
                cw = pr.width / cols
                k = min(cols - 1, int(((min(w[0] for w in ws) + max(w[2] for w in ws)) / 2 - pr.x0) // cw))
                x0, x1 = pr.x0 + k * cw, pr.x0 + (k + 1) * cw
            else:
                x0, x1 = pr.x0, pr.x1
        by_page.setdefault(pi, []).append([max(pr.y0, y0), min(pr.y1, y1), x0, x1, [i]])

    out = {}
    sdir = os.path.join(IMG_DIR, sid)
    os.makedirs(sdir, exist_ok=True)
    for pi in sorted(by_page):
        page = doc[pi]
        bands = sorted(by_page[pi], key=lambda b: (b[2], b[0]) if box else (b[0], b[2]))
        merged = []
        for b in bands:
            for m in merged:
                if b[0] <= m[1] + 12 and b[1] >= m[0] - 12 and b[2] < m[3] and b[3] > m[2] \
                        and (not (box or cols) or max(m[3], b[3]) - min(m[2], b[2]) <= (maxw if box else m[3] - m[2])):
                    m[0] = min(m[0], b[0]); m[1] = max(m[1], b[1]); m[2] = min(m[2], b[2]); m[3] = max(m[3], b[3]); m[4] += b[4]
                    break
            else:
                merged.append(b)
        merged.sort(key=lambda b: (b[0], b[2]))
        # highlight every located question on this page
        for i, (p2, ws, ln, hand) in found.items():
            if p2 != pi or not ws:
                continue
            lines = {}
            for w in ws:
                r = lines.setdefault((w[5], w[6]), [w[0], w[1], w[2], w[3]])
                r[0] = min(r[0], w[0]); r[1] = min(r[1], w[1]); r[2] = max(r[2], w[2]); r[3] = max(r[3], w[3])
            for r in lines.values():
                try:
                    a = page.add_highlight_annot(fitz.Rect(r))
                    a.set_colors(stroke=(1, 0.9, 0.25)); a.update(opacity=0.55)
                except Exception:
                    pass
        for k, (y0, y1, x0, x1, idx) in enumerate(merged):
            clip = fitz.Rect(x0, y0, x1, y1) & page.rect
            z = IMG_W / clip.width
            pix = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=clip, alpha=False)
            im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            name = "p%02d_%s.jpg" % (pi + 1, "abcdefghijklmnopqrstuvwxyz"[k % 26] * (k // 26 + 1))
            fn = os.path.join(sdir, name)
            for qlt in (70, 62, 54, 46, 38):
                buf = io.BytesIO()
                im.save(buf, "JPEG", quality=qlt, optimize=True)
                if buf.tell() <= MAX_BYTES:
                    break
            with open(fn, "wb") as fh:
                fh.write(buf.getvalue())
            for i in idx:
                out[str(i)] = {"img": "excerpts/%s/%s" % (sid, name), "w": im.width, "h": im.height,
                               "page": pi + 1, "found": True}
                stated = pages_in(dict(rows)[i].source_location)
                if stated and (pi + 1) not in stated:
                    log.append("row %d (%s): found on PDF p. %d, bank says p. %s" % (i, dict(rows)[i].qid, pi + 1, stated))
    for i in missing:
        log.append("row %d (%s): NOT FOUND in %s" % (i, dict(rows)[i].qid, os.path.basename(fpath)))
    return out, missing


# ---------------------------------------------------------------- spreadsheets
def col2n(c):
    n = 0
    for ch in c:
        n = n * 26 + ord(ch) - 64
    return n


def n2col(n):
    s = ""
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def xlsform(ws, wb, rows, log):
    hdr = {clean(c.value, False).lower(): c.column for c in ws[1] if c.value}
    ncol = hdr.get("name")
    names = {}
    for r in range(2, ws.max_row + 1):
        v = ws.cell(r, ncol).value
        if v is not None and str(v).strip() and str(v).strip() not in names:
            names[str(v).strip()] = r
    ch = wb["choices"] if "choices" in wb.sheetnames else None
    chdr = {clean(c.value, False).lower(): c.column for c in ch[1] if c.value} if ch else {}
    lists = {}
    if ch:
        lc = chdr.get("list_name") or chdr.get("list name")
        for r in range(2, ch.max_row + 1):
            v = ch.cell(r, lc).value
            if v is not None and str(v).strip():
                lists.setdefault(str(v).strip(), []).append(r)
    out, missing = {}, []
    for i, row in rows:
        q = re.sub(r"\(.*?\)", "", str(row.qid)).strip()
        m = re.match(r"^(.*?)(\d+)\s*-\s*(\d+)$", q)
        qs = [m.group(1) + str(k) for k in range(int(m.group(2)), int(m.group(3)) + 1)] if m else [q]
        rr = [names[x] for x in qs if x in names]
        if not rr:
            t = norm(first_part(row.text_original))[:40]
            for r in range(2, ws.max_row + 1):
                if any(t and t in norm(c.value) for c in ws[r] if c.value):
                    rr = [r]; break
        if not rr:
            missing.append(i); log.append("row %d (%s): NOT FOUND in survey sheet" % (i, row.qid)); continue
        lang = {"fr": "french", "en": "english", "es": "spanish", "pt": "portuguese"}.get(str(row.language), "")
        labels = [k for k in hdr if k.startswith("label")]
        labels.sort(key=lambda k: (0 if lang and lang in k else 1 if "english" in k else 2, hdr[k]))
        want = ["type", "name"] + labels[:2] + [k for k in ("relevant", "relevance", "constraint", "choice_filter") if k in hdr]
        want = [k for k in want if k in hdr and any(ws.cell(r, hdr[k]).value not in (None, "") for r in rr)][:MAX_COLS]
        cells = [[clean(ws.cell(1, hdr[k]).value) for k in want]]
        for r in rr:
            cells.append([clean(ws.cell(r, hdr[k]).value) for k in want])
        where = "sheet %s, row%s %s" % (ws.title, "s" if len(rr) > 1 else "", "-".join(str(x) for x in ([rr[0], rr[-1]] if len(rr) > 1 else rr)))
        typ = clean(ws.cell(rr[0], hdr["type"]).value, False)
        mt = re.match(r"select_(?:one|multiple)\s+(\S+)", typ)
        e = {}
        if len(rr) == 1 and mt and mt.group(1) in lists:
            crows = lists[mt.group(1)]
            vcol = chdr.get("name") or chdr.get("value")
            room = len(crows) if len(crows) <= 24 else 8
            for r in crows[:room]:
                line = []
                for k in want:
                    if k == "type":
                        line.append(mt.group(1))
                    elif k == "name":
                        line.append(clean(ch.cell(r, vcol).value))
                    elif k in chdr:
                        line.append(clean(ch.cell(r, chdr[k]).value))
                    else:
                        line.append("")
                cells.append(line)
            if len(crows) > room:
                cells.append(["…"]); e["more"] = len(crows) - room
            where += "; sheet choices, rows %d-%d" % (crows[0], crows[-1])
        e.update({"cells": cells, "where": where})
        out[str(i)] = e
    return out, missing


def grid(wb, rows, sid, log):
    """Paper-layout questionnaire sheets: the question cell with what is printed under / beside it."""
    out, missing = {}, []
    titles = sorted(wb.sheetnames, key=lambda t: -len(t.strip()))
    LONG = 26                                  # rows allowed for a one-column code list
    for i, row in rows:
        loc = str(row.source_location)
        ws = None
        for t in titles:
            if re.search(r"sheet\s+'?%s(?![\w(])" % re.escape(t.strip()), loc):
                ws = wb[t]; break
        if ws is None:
            missing.append(i); log.append("row %d (%s): sheet not recognised in '%s'" % (i, row.qid, loc[:60])); continue
        tail = loc.split(ws.title.strip(), 1)[1]
        t_full = norm(first_part(row.text_original))
        q = norm(row.qid)
        mr, mc = ws.max_row, ws.max_column

        def val(r, c):
            cell = ws.cell(r, c)
            v = cell.value
            if isinstance(v, float) and "0.00" in str(cell.number_format):
                if v < 1:                       # numbering formula with no start value: not a question number
                    return ""
                v = ("(%.2f)" if "(" in cell.number_format else "%.2f") % v
            return clean(v)

        def label(x):
            return bool(x) and (norm(x) == q or re.fullmatch(r"\(?[\d.]+\)?|\(.{2,9}\)", x) is not None)

        def best_in(cells_iter):
            best = None
            for r, c in cells_iter:
                v = norm(ws.cell(r, c).value) if ws.cell(r, c).value is not None else ""
                if not v:
                    continue
                for L in (60, 30, 15, 8):
                    k = t_full[:L]
                    if len(k) >= min(L, len(t_full)) and k and k in v:
                        if best is None or L > best[0]:
                            best = (L, r, c)
                        break
            return best

        blocks = []                             # (r0, r1, c0, c1)
        hand = RANGE.get((sid, i))
        m_rng = re.search(r"\b([A-Z]{1,2})(\d+):([A-Z]{1,2})(\d+)\b", tail)
        m_cell = re.search(r"\b([A-Z]{1,2})(\d+)\b", tail)
        m_col = re.search(r"\bcol\s+([A-Z]{1,2})\b", tail)
        m_row = re.search(r"\brow\s+(\d+)\b", tail)
        if hand:
            for h in (hand if isinstance(hand, list) else [hand]):
                m = re.fullmatch(r"([A-Z]{1,2})(\d+):([A-Z]{1,2})(\d+)", h)
                blocks.append((int(m.group(2)), int(m.group(4)), col2n(m.group(1)), col2n(m.group(3))))
        elif m_row and not m_col and not m_rng:
            blocks.append((int(m_row.group(1)), int(m_row.group(1)), 1, mc))
        else:
            if m_rng:
                ac, ar = col2n(m_rng.group(1)), int(m_rng.group(2))
                b = best_in((r, c) for r in range(max(1, ar - 3), min(mr, int(m_rng.group(4))) + 1)
                            for c in range(ac, col2n(m_rng.group(3)) + 1))
            elif m_col:
                ac = col2n(m_col.group(1))
                b = best_in((r, ac) for r in range(1, min(mr, 40) + 1))
                ar = b[1] if b else next((r for r in range(1, mr + 1) if val(r, ac)), 1)
            elif m_cell:
                ac, ar = col2n(m_cell.group(1)), int(m_cell.group(2))
                b = None
            else:
                b = best_in((r, c) for r in range(1, min(mr, 80) + 1) for c in range(1, mc + 1))
                if not b:
                    missing.append(i); log.append("row %d (%s): NOT FOUND in sheet %s" % (i, row.qid, ws.title)); continue
            if b:
                ar, ac = b[1], b[2]
            r0 = ar                             # start: the question number printed above, if any
            for up in range(1, 7):
                if ar - up >= 1 and label(val(ar - up, ac)):
                    r0 = ar - up; break
            c1 = ac                             # width: up to the next column that has its own heading
            while c1 + 1 <= mc and c1 - ac + 1 < MAX_COLS and not any(val(r, c1 + 1) for r in range(r0, ar + 1)):
                c1 += 1
            if m_rng:
                r1 = int(m_rng.group(4))
            else:                               # down to the answer box ("CODE") or a clear gap
                stop = next((r for r in range(ar + 1, min(mr, ar + 45) + 1)
                             if val(r, ac).strip().upper().rstrip(":") in ("CODE", "CODES", "NOMBRE", "NUMERO")), None)
                r1, gap = ar, 0
                for r in range(ar + 1, (stop or mr + 1)):
                    if any(val(r, c) for c in range(ac, c1 + 1)):
                        r1, gap = r, 0
                    else:
                        gap += 1
                        if gap >= (40 if stop else 3):
                            break
            blocks.append((r0, r1, ac, c1))
        cells = []
        for r0, r1, c0, c1 in blocks:
            for r in range(r0, r1 + 1):
                line = [val(r, c) for c in range(c0, min(c1, mc) + 1)]
                line = [x for x in line if x and not PLACEHOLDER.match(x)][:MAX_COLS]
                if len(line) == 1 and line[0].count("\n") >= 2:
                    cells.extend([x] for x in line[0].split("\n"))
                elif line:
                    cells.append(line)
        if not cells:
            missing.append(i); log.append("row %d (%s): empty block in sheet %s" % (i, row.qid, ws.title)); continue
        e = {}
        cap = LONG if max(len(x) for x in cells) <= 2 else MAX_ROWS + 2
        if len(cells) > cap:
            e["more"] = len(cells) - cap; cells = cells[:cap] + [["…"]]
        where = "; ".join("%s%d:%s%d" % (n2col(c0), r0, n2col(min(c1, mc)), r1) for r0, r1, c0, c1 in blocks)
        e.update({"cells": cells, "where": "sheet %s, %s" % (ws.title.strip(), where)})
        out[str(i)] = e
    return out, missing


def sheet_survey(sid, fpath, rows, opt, log):
    import openpyxl
    wb = openpyxl.load_workbook(fpath, data_only=True)
    if "survey" in wb.sheetnames and clean(wb["survey"].cell(1, 1).value, False).lower() == "type":
        return xlsform(wb["survey"], wb, rows, log)
    return grid(wb, rows, sid, log)


# ---------------------------------------------------------------- Word
QSTART = re.compile(r"^(?:Si la réponse[^.]*?(?:”|\")\s*)?\(?[A-Za-z]{0,6}\.?\d+(?:\.\d+)*[A-Za-z]?[.)]\s+\S")
GLUE = re.compile(r"[a-zéèàç)][A-ZÉ][a-zé]|\d\.\d+\d\.\d")
QNUM = re.compile(r"^[A-Za-z]{0,6}\.?\d+(?:\.\d+)*[A-Za-z]?\.?$")


def doc_survey(sid, fpath, rows, opt, log):
    import docx
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    tmp = None
    if fpath.lower().endswith(".doc"):
        if not shutil.which("textutil"):
            log.append("old .doc needs macOS textutil: skipped")
            return {}, [i for i, _ in rows]
        tmp = tempfile.mkdtemp(prefix="mkex_")
        conv = os.path.join(tmp, "converted.docx")
        subprocess.run(["textutil", "-convert", "docx", "-output", conv, fpath], check=True, timeout=120)
        fpath = conv
    d = docx.Document(fpath)
    blocks = []          # ("p", text) | ("t", [[cell,...], ...])
    for el in d.element.body.iterchildren():
        if el.tag.endswith("}p"):
            t = clean(Paragraph(el, d).text, cap=False)
            if t:
                blocks.append(("p", t))
        elif el.tag.endswith("}tbl"):
            tb = []
            for r in Table(el, d).rows:
                seen, line = [], []
                try:
                    cs = r.cells
                except Exception:
                    cs = []
                for c in cs:
                    if c._tc in seen:
                        continue
                    seen.append(c._tc); line.append(clean(c.text, cap=False))
                tb.append(line)
            blocks.append(("t", tb))
    if tmp:
        shutil.rmtree(tmp, ignore_errors=True)

    def squeeze(line):
        res = []
        for x in line:
            if not x or PLACEHOLDER.match(x) or (res and x == res[-1]):
                continue
            res.append(x)
        return res[:MAX_COLS]

    others = {}
    for i, row in rows:
        nd, full, q = needles(row)
        others[i] = (nd, full[:25], q)

    def is_other(i, text):
        k = norm(text)
        for j, (nd, f25, q) in others.items():
            if j != i and len(f25) >= 12 and (f25 in k[:140] or (q and (q + f25[:12]) in k[:140])):
                return True
        return False

    out, missing = {}, []
    for i, row in rows:
        nd, full, q = others[i][0], norm(first_part(row.text_original)), others[i][2]
        hit = None
        for nee in nd:
            cand = []
            for bi, (kind, b) in enumerate(blocks):
                if kind == "p":
                    k = norm(b); at = k.find(nee)
                    if at >= 0:
                        cand.append((at, bi, None))
                else:
                    for ri, line in enumerate(b):
                        for ci, x in enumerate(line):
                            k = norm(x); at = k.find(nee)
                            if at >= 0:
                                cand.append((at + 1000 * ci, bi, ri)); break
            if cand:
                hit = min(cand); break
        if not hit:
            missing.append(i); log.append("row %d (%s): NOT FOUND in %s" % (i, row.qid, os.path.basename(fpath))); continue
        _, bi, ri = hit
        cells = []
        if ri is None:                                   # paragraphs
            if bi > 0 and blocks[bi - 1][0] == "p" and norm(blocks[bi - 1][1]) == q and q:
                cells.append([blocks[bi - 1][1]])
            txt = blocks[bi][1]
            if GLUE.search(txt):                         # text boxes run together by the .doc conversion
                raw = first_part(row.text_original)
                k = txt.lower().find(raw.lower()[:20])
                txt = txt[k:k + len(raw)] if k >= 0 else raw
            raw = first_part(row.text_original).strip()
            if len(raw) < 40 and norm(txt) != norm(raw) and txt.lower().endswith(raw.lower()):
                txt = txt[-len(raw):]
            cells.append([txt])
            for kind, b in blocks[bi + 1: bi + 1 + MAX_ROWS]:
                if kind != "p" or is_other(i, b) or QSTART.match(b) or PLACEHOLDER.match(b) or GLUE.search(b) \
                        or "|__|" in b or re.search(r"\bQ?\d\.\d+\b", b):
                    break
                if any(norm(b) == o[2] and o[2] for j, o in others.items() if j != i):
                    break
                if len(cells) >= MAX_ROWS:
                    break
                cells.append([b])
            where = "paragraph %d" % (bi + 1)
        else:                                            # table rows
            tb = blocks[bi][1]
            h = squeeze(tb[0]) if ri > 0 and opt.get("header") else []
            if h and len(" ".join(h)) < 200 and not QSTART.match(h[0]):
                cells.append(h)
            first = squeeze(tb[ri])
            if max(x.count("\n") for x in first) >= 2:       # code lists printed inside one cell: one line per row
                cols = [x.split("\n") for x in first]
                for k in range(max(len(c) for c in cols)):
                    line = [c[k] if k < len(c) else "" for c in cols]
                    while line and not line[-1]:
                        line.pop()
                    cells.append(line)
                if len(cells) > 26:
                    cells = cells[:26] + [["…"]]
            else:
                cells.append(first)
            lab = first[0].replace(" ", "")
            last = ri
            for rj in range(ri + 1, min(len(tb), ri + 40)):
                line = squeeze(tb[rj])
                if not line:
                    continue
                joined = " ".join(line)
                if is_other(i, joined) or QSTART.match(line[0]) or (QNUM.match(line[0]) and line[0].replace(" ", "") != lab):
                    break
                if line[0].replace(" ", "") == lab and len(line) > 1:
                    rest = [x for x in line[1:] if x not in first]              # same question repeated per option
                    line = ["", ""] + rest if rest else line
                if len(cells) >= 26:
                    cells.append(["…"]); break
                cells.append(line); last = rj
            n_tbl = sum(1 for k, _ in blocks[:bi + 1] if k == "t")
            where = "table %d, row%s" % (n_tbl, " %d" % (ri + 1) if last == ri else "s %d-%d" % (ri + 1, last + 1))
        cells = [[clean(x) for x in line] for line in cells]
        out[str(i)] = {"cells": cells, "where": where}
    return out, missing


# ---------------------------------------------------------------- main
KIND = {".pdf": "pdf", ".xlsx": "sheet", ".xlsm": "sheet", ".docx": "doc", ".doc": "doc"}
ENGINE = {"pdf": pdf_survey, "sheet": sheet_survey, "doc": doc_survey}


def main(only):
    bank = pd.read_csv(path("bank")).fillna("")
    originals = path("originals")
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    report = []
    for sid, grp in bank.groupby("survey_id", sort=False):
        if only and sid not in only:
            continue
        srcs = SRC.get(sid)
        log, total = [], len(grp)
        if not srcs:
            manifest.pop(sid, None)
            report.append((sid, "-", "no original questionnaire available", 0, total, log)); continue
        folder = os.path.join(originals, FOLDER.get(sid, sid))
        buckets = {}
        for i, row in grp.iterrows():
            key = "%s | %s" % (row.qid, row.source_location)
            for k, s in enumerate(srcs):
                if s["when"] is None or re.search(s["when"], key):
                    buckets.setdefault(k, []).append((i, row)); break
        shutil.rmtree(os.path.join(IMG_DIR, sid), ignore_errors=True)
        entry = {"rows": {}}
        files, kinds, counts = [], [], []
        for k in sorted(buckets):
            s, rows = srcs[k], buckets[k]
            if s["file"] is None:
                log.append("%d rows skipped (%s): %s" % (len(rows), s.get("why", ""), ", ".join(str(i) for i, _ in rows)))
                continue
            fpath = os.path.join(folder, s["file"])
            if not os.path.exists(fpath):
                log.append("file missing: %s" % s["file"]); continue
            kind = KIND[os.path.splitext(fpath)[1].lower()]
            try:
                got, _ = ENGINE[kind](sid, fpath, rows, s, log)
            except Exception as e:                                   # unreadable / not downloaded
                log.append("could not read %s: %s" % (s["file"], e)); continue
            for key, v in got.items():
                if len(buckets) > 1 and len([x for x in buckets if srcs[x]["file"]]) > 1:
                    v["file"] = os.path.basename(s["file"]); v["kind"] = kind
                entry["rows"][key] = v
            files.append(os.path.basename(s["file"])); kinds.append(kind); counts.append(len(got))
        if files:
            top = counts.index(max(counts))
            files.insert(0, files.pop(top)); kinds.insert(0, kinds.pop(top))
            entry = {"file": files[0], "kind": kinds[0], "rows": entry["rows"]}
            if len(files) > 1:
                entry["files"] = files
            manifest[sid] = entry
        else:
            manifest.pop(sid, None)
        report.append((sid, "/".join(sorted(set(kinds))) or "-", "; ".join(files) or "-", len(entry.get("rows", {})), total, log))
    order = list(dict.fromkeys(bank.survey_id))
    manifest = {k: manifest[k] for k in order if k in manifest}
    with open(MANIFEST, "w") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(IMG_DIR) for f in fs)
    for sid, kind, files, n, total, log in report:
        print("%-16s %-9s %3d/%-3d  %s" % (sid, kind, n, total, files))
        for l in log:
            print("      - " + l)
    print("excerpts/: %.1f MB" % (size / 1e6))


if __name__ == "__main__":
    main(set(sys.argv[1:]))
