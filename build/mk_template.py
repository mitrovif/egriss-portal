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
open(H + "/demo_template.html", "w", encoding="utf-8").write(out)
print(len(out))
