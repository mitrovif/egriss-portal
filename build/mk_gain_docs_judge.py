# Second pass over build/gain_docs.json: a local language model (LM Studio, port 1234) decides which of the links found by
# keyword really are the questionnaire, report, data or methodology OF THAT EXAMPLE, and drops menu and unrelated links.
# The linked PDF of a "document" row and microdata catalogue tabs are kept as they are. Usage: python mk_gain_docs_judge.py [model]
import json, os, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, "gain_docs.json"); J = json.load(open(F, encoding="utf-8"))
MODEL = sys.argv[1] if len(sys.argv) > 1 else "qwen2.5-7b-instruct-1m"
SYS = """You check links found on a web page against one statistical activity (a survey, census, administrative data system or data integration project). For each numbered link decide whether it clearly leads to a document or dataset OF THAT SPECIFIC ACTIVITY, and if so which kind: "questionnaire" (the survey or census form), "report" (a results report or publication of this activity), "data" (its dataset, microdata or tables), "method" (its methodology or metadata). Reject site menus, generic portals, other surveys, news, price lists, feedback forms and anything you are not sure belongs to this activity. Return only the links you keep."""
SCHEMA = {"type": "json_schema", "json_schema": {"name": "keep", "strict": True, "schema": {"type": "object", "properties": {"keep": {"type": "array", "items": {"type": "object", "properties": {"n": {"type": "integer"}, "kind": {"type": "string", "enum": ["questionnaire", "report", "data", "method"]}}, "required": ["n", "kind"]}}}, "required": ["keep"]}}}
def ask(x, cand):
    u = f"ACTIVITY: {x['title']}\nBy: {x['org']} · {x['country'] or 'regional or global'} · {x['year']} · {', '.join(x['types'])}\nPage: {x['url']}\n\nLINKS\n" + "\n".join(f"{i+1}. \"{c[1]}\" -> {c[0][:140]}" for i, c in enumerate(cand))
    body = {"model": MODEL, "temperature": 0, "max_tokens": 250, "messages": [{"role": "system", "content": SYS}, {"role": "user", "content": u}], "response_format": SCHEMA}
    r = urllib.request.urlopen(urllib.request.Request("http://localhost:1234/v1/chat/completions", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}), timeout=600)
    return json.loads(json.load(r)["choices"][0]["message"]["content"])["keep"]
n = kept = 0
for x in J["rows"]:
    if x.get("status") != "page read" or not x.get("found"): continue
    cand = []
    for k, v in x["found"].items():
        for c in v:
            if c[0] not in [y[0] for y in cand]: cand.append(c)
    try: keep = ask(x, cand)
    except Exception as e: x["checked"] = None; continue
    out = {}
    for it in keep:
        if 1 <= it["n"] <= len(cand): out.setdefault(it["kind"], []).append(cand[it["n"] - 1])
    x["checked"] = out; n += 1; kept += bool(out)
    if n % 15 == 0: print(n, kept, flush=True); json.dump(J, open(F, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
J["judged"] = MODEL; json.dump(J, open(F, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("judged", n, "pages; with at least one link kept", kept)
