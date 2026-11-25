# Rates each questionnaire question against its EGRISS reference question with a local language model (LM Studio server on port 1234).
# Four parts, each 0-3: concept, asked of, answer options, time and place. Output is then keyed by bank row into build/similarity.json.
# The coder's own notes are not shown to the model. Usage: python mk_similarity.py [model] [sample size]
import json, urllib.request, sys, time
MODEL=sys.argv[1] if len(sys.argv)>1 else 'qwen2.5-7b-instruct-1m'; LIMIT=int(sys.argv[2]) if len(sys.argv)>2 else 0
import re, os
HERE=os.path.dirname(os.path.abspath(__file__)); _s=open(os.path.join(HERE,"..","index.html"),encoding="utf-8").read(); Q,_=json.JSONDecoder().raw_decode(_s[_s.index("Q = {")+4:])
M={m['code']:m for m in Q['model']}
rows=[r for r in Q['bank'] if r[2] in M and r[3] in ('same','close','partial','different')]
if LIMIT: rows=rows[::max(1,len(rows)//LIMIT)][:LIMIT]
SYS="""You compare a survey question with a reference question from an international standard for identifying refugees and internally displaced persons. Judge meaning, not wording: a translation or paraphrase that asks the same thing is equivalent. Rate four aspects from 0 to 3 (3 = equivalent, 2 = minor difference, 1 = substantial difference, 0 = not comparable or missing):
- concept: does it measure the same thing as the reference question?
- asked_of: is it asked of the same people as the reference routing says (for example everyone, or only those who fled)?
- options: do the answer options cover the reference options? If the reference has no listed options, rate whether the answer format fits.
- scope: same time frame and place reference (for example "ever in your lifetime", "in this country")?
Then give overall: "same" (equivalent in all aspects), "close" (same concept, minor differences), "partial" (overlaps but a substantial part differs or is missing), "different" (another concept or approach). Give one short reason."""
SCHEMA={"type":"json_schema","json_schema":{"name":"rating","strict":True,"schema":{"type":"object","properties":{"concept":{"type":"integer","minimum":0,"maximum":3},"asked_of":{"type":"integer","minimum":0,"maximum":3},"options":{"type":"integer","minimum":0,"maximum":3},"scope":{"type":"integer","minimum":0,"maximum":3},"overall":{"type":"string","enum":["same","close","partial","different"]},"reason":{"type":"string"}},"required":["concept","asked_of","options","scope","overall","reason"]}}}
def ask(r):
    m=M[r[2]]
    u=f"""REFERENCE QUESTION ({m['title']})
Text: {m['stem']}
Answer options: {'; '.join(m['opts']) if m['opts'] else 'none listed'}
Asked of: {m['skip']}

SURVEY QUESTION
Text: {r[7] or r[5]}{' (original: '+r[5]+')' if r[7] and r[6]!='en' else ''}
Answer options: {r[9] or 'not recorded'}
Asked of: {r[11] or 'not recorded'}"""
    body={'model':MODEL,'temperature':0,'max_tokens':300,'messages':[{'role':'system','content':SYS},{'role':'user','content':u}],'response_format':SCHEMA}
    req=urllib.request.Request('http://localhost:1234/v1/chat/completions',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
    return json.loads(json.load(urllib.request.urlopen(req,timeout=600))['choices'][0]['message']['content'])
out=[]; t0=time.time()
for i,r in enumerate(rows):
    try: j=ask(r)
    except Exception as e: j={'error':str(e)[:200]}
    j.update(al=r[3],item=r[2],qid=r[1],sid=r[0],disc=r[4]); out.append(j)
    if LIMIT or i%20==0: print(i,round(time.time()-t0),j.get('overall'),'| coder',r[3],'|',j.get('reason','')[:110] if LIMIT else '',flush=True)
    json.dump(out,open(f'rubric_{MODEL.replace("/","_")}{"_s" if LIMIT else ""}.json','w'))
print('done',len(out),round(time.time()-t0),'s')
