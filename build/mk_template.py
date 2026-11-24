import re, os
H = os.path.dirname(os.path.abspath(__file__))
old = open(H + "/demo_template_v10.html", encoding="utf-8").read()
def inner(vid):
    m = re.search(r'<section id="v-%s"[^>]*>\n(.*?)\n  </section>' % vid, old, re.S); return m.group(1)
head = old[:old.index("</style>")] + open(H + "/newcss.css").read() + "</style>\n"
body = (open(H + "/newbody.html").read().replace("__SDG_INNER__", inner("sdg")).replace("__MODEL_INNER__", inner("model")).replace("__BANK_INNER__", inner("bank")))
js0 = old[old.index('<script src="https://cdn.jsdelivr.net/npm/globe.gl'):old.index("/* ---- shared globe ---- */")]
# identification part only in the bank
js0 = js0.replace("[['all','All coded',coded.length],['none','Not coded',B.length-coded.length]]", "[['all','All items',coded.length]]")
js0 = js0.replace("<span><b>${B.length}</b>questions transcribed</span>", "<span><b>${coded.length}</b>identification questions</span>").replace("<span><b>${coded.length}</b>coded against the module</span>", "")
js0 = js0.replace("<details><summary>Response options and coding note</summary>", "${r[11]?`<div class=\"route\">↳ ${esc(r[11])}</div>`:''}<details><summary>Response options and coding note</summary>")
js0 = js0.replace("let bItem='FrcFl'", "let bItem='FrcFl'")
js0 = js0.replace("$('indrows').querySelectorAll('.ind').forEach(b=>b.onclick=()=>{curInd=b.dataset.c;location.hash='sdg';show('sdg')});", "")
js0 = re.sub(r'<script src="https://cdn.jsdelivr.net/npm/globe.gl[^"]*"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>', js0)
out = head + body + js0 + open(H + "/newapp.js").read() + "\n</script>\n"
# review-status pills are not shown to readers; caveats (Check, Draft) stay
out = re.sub(r'\s*<i class="pill (?:ok|new|tbc)"[^>]*>(?:Exists|New|To confirm|New layer)</i>', '', out)
out = re.sub(r'\s*<span><i class="pill (?:ok|new|tbc)">(?:Exists|New|To confirm)</i>[^<]*</span>', '', out)
# ID Questions, world page: one list of the 13 questions, plain headings, the hint before the table
def sub1(pat, new, s, flags=0):
    s2, n = re.subn(pat, new, s, count=1, flags=flags); assert n == 1, pat; return s2
out = sub1(r'<div class="band core">(\s*<div class="lhead"><h2>The EGRISS identification module</h2>)', r'<div class="band core" hidden>\1', out)
out = sub1(r'<h2>Every questionnaire against the model</h2>', '<h2>Which questionnaire asks which question</h2>', out)
out = sub1(r'<span>number = questions coded to the item</span></div>', '<span>number = questions in that questionnaire on the topic</span></div>\n          <p class="lnote">Select a coloured cell to compare that questionnaire\'s wording with the EGRISS question. The comparison opens under the table.</p>', out)
out = sub1(r'<p class="lnote">Causes named: an automatic keyword match.*?</p>', '<p class="lnote">Reasons named: the reasons for fleeing that appear in each questionnaire\'s wording (1 conflict, 2 violence, 3 persecution, 4 rights violations, 6 natural disasters, 7 man-made events). Found by keyword search, so read it as a first indication.</p>', out, re.S)
out = sub1(r'<p class="lnote">The six codes on the right are used in the question bank.*?</p>', '<p class="lnote">The six columns on the right are related topics that are not among the 13 EGRISS questions.</p>', out, re.S)
out = out.replace('<th class="gap">Causes named</th>', '<th class="gap">Reasons named</th>')
out = sub1(r"\$\('mdetail'\)\.innerHTML='<p class=\"lnote\">Select a coloured cell[^<]*</p>'; return \}", "$('mdetail').hidden=true; return } $('mdetail').hidden=false;", out)
out = sub1(r"b\.onclick=\(\)=>\{mSel=\[\+b\.dataset\.s,b\.dataset\.c\];renderModel\(\)\}", "b.onclick=()=>{mSel=[+b.dataset.s,b.dataset.c];renderModel();$('mdetail').scrollIntoView({block:'center',behavior:'smooth'})}", out)
out = out.replace('<h3>EGRISS model</h3>', '<h3>EGRISS question</h3>')
open(H + "/demo_template.html", "w", encoding="utf-8").write(out)
print(len(out))
