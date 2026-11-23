import pyreadstat, pandas as pd, numpy as np, json, math, sys
OUT=sys.argv[1]
L="<DATA_LAKE>"
D=L+"/dhs/MWL_2024/"
M=L+"/mics/LBN_Palestinians_2011/extracted/Lebanon (Palestinians)_MICS4_Datasets/Lebanon (Palestinians) MICS 2011 SPSS Datasets/"
def wm(x,w=None):
    x=np.asarray(x,dtype=float)
    if len(x)==0: return None
    if w is None: return round(100*float(x.mean()),2)
    w=np.asarray(w,dtype=float)
    return round(100*float((x*w).sum()/w.sum()),2) if w.sum()>0 else None
def r0(v): return None if v is None else int(math.floor(v+0.5))
rows=[]; vars_={}; areas={"LBN":{"area_var":"HH7","unit":"region","ind":{}},"MWI":{"note":"Dowa outside camp","ind":{}}}
def addvars(prefix,meta,names,src):
    for v in names:
        vl=meta.variable_value_labels.get(v,{})
        cats=[]
        for k,l in list(vl.items())[:15]:
            ks=str(int(k)) if isinstance(k,float) and k==int(k) else str(k)
            cats.append([ks,str(l)])
        vars_[f"{prefix}:{v}"]={"label":meta.column_names_to_labels.get(v),"cats":cats,"n_cats_in_file":len(vl),"source":src}
# ---------------- Malawi
hr,mh=pyreadstat.read_dta(D+"MWHR81FL.dta",usecols=["hv005","shv005","shcamps","shdistrict","hv206","hv012","hv013"])
pr,mp=pyreadstat.read_dta(D+"MWPR81FL.dta",usecols=["hv005","shv005","shcamps","shdistrict","hv206","hv102","hv103","hv105","hv121","hc70","hc13"])
addvars("Malawi",mh,["hv206","hv005","shv005","shcamps","shdistrict","hv012"],"MWHR81FL.dta")
addvars("Malawi",mp,["hv121","hv105","hv102","hv103","hc70","hc13"],"MWPR81FL.dta")
for d in (hr,pr): d["mix"]=np.where(d.shcamps==1,d.shv005,d.hv005)
wnote=("hv005 is 0 for all 681 camp households and shv005 is 0 for all 22,414 non-camp households, so only one weight is usable per group: shv005 for the camp, hv005 for the rest. "
       "A single-weight run (hv005 only or shv005 only) cannot produce both columns.")
def mw(df,x,sub=None):
    """returns dict of variant -> (g1,g2) and n"""
    d=df if sub is None else df[sub]
    xs=x.loc[d.index].astype(float)
    c=d.shcamps==1; o=d.shcamps==0
    return {"w":(wm(xs[c],d.shv005[c]),wm(xs[o],d.hv005[o])),"u":(wm(xs[c]),wm(xs[o])),"n":(int(c.sum()),int(o.sum()))}
def dowa(df,x,sub=None):
    d=df if sub is None else df[sub]; xs=x.loc[d.index].astype(float)
    c=d.shdistrict==12; o=d.shdistrict==11
    return {"Dowa (camp)":[wm(xs[c],d.shv005[c]),int(c.sum())],"Dowa (outside camp)":[wm(xs[o],d.hv005[o]),int(o.sum())]}
def V(what,t): return {"what":what,"g1":t[0],"g2":t[1]}
# 7.1.1
e=hr.hv206==1; a=mw(hr,e)
ep=pr.hv206==1; pj=mw(pr,ep,pr.hv102==1); pf=mw(pr,ep,pr.hv103==1); pa=mw(pr,ep)
rows.append({"country":"Malawi","sdg":"7.1.1","published":{"g1":25,"g2":16},"recalc":{"g1":a["w"][0],"g2":a["w"][1]},
 "match":r0(a["w"][0])==25 and r0(a["w"][1])==16,"level":"household","vars":["hv206"],"numerator_codes":"1 = yes","denominator":"all interviewed households (hv206 has no missing values)",
 "weight":"shv005 for camp households, hv005 for all other households","group_var":"shcamps","g1":"1 = yes","g2":"0 = no","n":{"g1":a["n"][0],"g2":a["n"][1]},"file":"MWHR81FL.dta",
 "variants_tried":[V("household, unweighted",a["u"]),V("de jure persons (PR file, hv102=1), shv005/hv005",pj["w"]),V("de facto persons (PR, hv103=1), shv005/hv005",pf["w"]),V("all listed persons (PR), shv005/hv005",pa["w"]),V("de jure persons, unweighted",pj["u"]),
   {"what":"household, hv005 only","g1":None,"g2":a["w"][1]},{"what":"household, shv005 only","g1":a["w"][0],"g2":None}],
 "notes":"Published value is the share of HOUSEHOLDS, not of population: the person-level value for the camp is about 30%, not 25%. "+wnote+" Person-level n: de jure camp %d, other %d."%pj["n"]})
areas["MWI"]["ind"]["7.1.1"]=dowa(hr,e)
areas["MWI"]["ind"]["7.1.1 (de jure persons)"]=dowa(pr,ep,pr.hv102==1)
# 4.1.2
k=pr.hv105.between(6,17); at=pr.hv121>0
a=mw(pr,at,k); aj=mw(pr,at,k&(pr.hv102==1)); af=mw(pr,at,k&(pr.hv103==1)); a1=mw(pr,pr.hv121==1,k)
vc={str(int(x)):int(n) for x,n in pr.hv121[k].value_counts().items()}
rows.append({"country":"Malawi","sdg":"4.1.2","published":{"g1":87,"g2":86},"recalc":{"g1":a["w"][0],"g2":a["w"][1]},
 "match":r0(a["w"][0])==87 and r0(a["w"][1])==86,"level":"person (household member)","vars":["hv121","hv105"],"numerator_codes":"hv121 = 2 (attended at some time); code 1 does not occur in the file",
 "denominator":"all listed household members aged 6-17 (hv105), no missing hv121 in that age range","weight":"shv005 for camp, hv005 for the rest","group_var":"shcamps","g1":"1 = yes","g2":"0 = no",
 "n":{"g1":a["n"][0],"g2":a["n"][1]},"file":"MWPR81FL.dta",
 "variants_tried":[V("all members 6-17, unweighted",a["u"]),V("de jure (hv102=1), weighted",aj["w"]),V("de facto (hv103=1), weighted",af["w"]),V("hv121 == 1 only (currently attending), weighted",a1["w"])],
 "notes":"Weighted value matches; unweighted gives 89/88 so the published figure is weighted. De jure and de facto restrictions give the same rounded result. In this file hv121 only takes 0 and 2 among ages 6-17 (counts "+json.dumps(vc)+"); the stored label of code 2 is 'attended at some time' during the current school year, code 1 'currently attending' is unused, so the indicator is attendance at any time in the current school year, not attendance at the time of interview. "+wnote})
areas["MWI"]["ind"]["4.1.2"]=dowa(pr,at,k)
# 2.2.1
val=pr.hc70.notna()&(pr.hc70<9990); st=pr.hc70<-200
a=mw(pr,st,val); af=mw(pr,st,val&(pr.hv103==1)); aj=mw(pr,st,val&(pr.hv102==1)); afl=mw(pr,st,pr.hc70.notna()); am=mw(pr,st,pr.hc13==0)
rows.append({"country":"Malawi","sdg":"2.2.1","published":{"g1":34,"g2":38},"recalc":{"g1":a["w"][0],"g2":a["w"][1]},
 "match":r0(a["w"][0])==34 and r0(a["w"][1])==38,"level":"person (child under 5)","vars":["hc70"],"numerator_codes":"hc70 < -200 (height-for-age below -2 SD, WHO standard)",
 "denominator":"children with a valid hc70 (not missing, not 9996/9997/9998 flagged)","weight":"shv005 for camp, hv005 for the rest","group_var":"shcamps","g1":"1 = yes","g2":"0 = no",
 "n":{"g1":a["n"][0],"g2":a["n"][1]},"file":"MWPR81FL.dta",
 "variants_tried":[V("valid hc70, unweighted",a["u"]),V("valid hc70, de facto (hv103=1), weighted",af["w"]),V("valid hc70, de jure (hv102=1), weighted",aj["w"]),V("hc70 not missing incl. flagged codes in denominator, weighted",afl["w"]),V("all measured (hc13=0) incl. flagged/missing z-score in denominator, weighted",am["w"])],
 "notes":"Weighted matches (34/38); unweighted gives 34/36 so the published host value is weighted. De facto restriction (DHS standard) gives the same rounded result (n camp %d, other %d). Height was measured in a subsample of households only. "%af["n"]+wnote})
areas["MWI"]["ind"]["2.2.1"]=dowa(pr,st,val)
areas["MWI"]["weights"]="Dowa (camp) = shdistrict 12 = shcamps 1, weighted with shv005; Dowa (outside camp) = shdistrict 11, weighted with hv005; n is unweighted denominator"
# ---------------- Lebanon
hh,m1=pyreadstat.read_sav(M+"hh.sav",usecols=["HH1","HH2","HH7","HH9","HH11","WS1","WS2","WS8","WS9","HC2","HC8A","hhweight"])
hl,m2=pyreadstat.read_sav(M+"hl.sav",usecols=["HH1","HH2","HL6","ED3","ED5","HH7","hhweight"])
ch,m3=pyreadstat.read_sav(M+"ch.sav",usecols=["UF9","AG2","BR1","BR2","HH7","chweight"])
addvars("Lebanon",m1,["WS1","WS2","WS8","WS9","HC8A","HC2","HH11","HH9","HH7","hhweight"],"hh.sav")
addvars("Lebanon",m2,["ED5","ED3","HL6"],"hl.sav"); addvars("Lebanon",m3,["BR1","BR2","UF9","AG2","chweight"],"ch.sav")
reg={int(k):v for k,v in m1.variable_value_labels["HH7"].items()}
c=hh[hh.HH9==1].copy(); c["pw"]=c.hhweight*c.HH11
def lv(x,d=None,wcol="hhweight"):
    d=c if d is None else d; xs=x.loc[d.index].astype(float)
    return {"hh_w":wm(xs,d[wcol]),"hh_u":wm(xs),"n":int(len(d))}
def lvp(x,d=None):
    d=c if d is None else d; xs=x.loc[d.index].astype(float)
    return {"mem_w":wm(xs,d.pw),"mem_u":wm(xs,d.HH11),"n_members":int(d.HH11.sum())}
def byreg(x,d,wcol):
    xs=x.loc[d.index].astype(float); o={}
    for code,lab in reg.items():
        s=d.HH7==code
        o[f"{lab}|Palestinian refugees"]=[wm(xs[s],d.loc[s,wcol]),int(s.sum())]
    return o
def LV(what,val): return {"what":what,"g1":val}
def lrow(sdg,pub,rec,level,vars_l,num,den,weight,n,file,variants,notes):
    rows.append({"country":"Lebanon","sdg":sdg,"published":{"g1":pub,"g2":None},"recalc":{"g1":rec,"g2":None},"match":r0(rec)==pub,"level":level,"vars":vars_l,
      "numerator_codes":num,"denominator":den,"weight":weight,"group_var":None,"g1":"whole sample (Palestinian refugees in Lebanon: camps and gatherings)","g2":None,"n":{"g1":n,"g2":None},"file":file,"variants_tried":variants,"notes":notes})
common=" hhweight is non-zero only for the 4,747 completed households (HH9=1); the other 443 rows have no answers."
# 6.1.1
impA={11,12,13,14,21,31,41,51}; full=c.WS1.isin(impA|{61,71,91})
a=lv(full); p=lvp(full)
vA=lv(c.WS1.isin(impA)); vB=lv(c.WS1.isin(impA|{91})); vC=lv(c.WS1.isin(impA)|((c.WS1==91)&c.WS2.isin(impA)))
ws1c={str(int(x)):int(n) for x,n in c.WS1.value_counts().sort_index().items()}
lrow("6.1.1",100,a["hh_w"],"household (member-level gives the same rounded value)",["WS1"],"11,12,13,14 piped/public tap; 21 tube well; 31 protected well; 41 protected spring; 51 rainwater; 61 tanker-truck; 71 cart with small tank; 91 bottled water",
 "all completed households (HH9=1)","hhweight",a["n"],"hh.sav",
 [LV("same definition, unweighted households",a["hh_u"]),LV("same definition, household members (hhweight x HH11)",p["mem_w"]),
  LV("MICS4-era improved: piped/tube well/protected/rainwater only (no bottled, tanker, cart), hhweight",vA["hh_w"]),LV("previous + bottled (any), hhweight",vB["hh_w"]),
  LV("MICS4 standard: previous + bottled only if WS2 is improved, hhweight",vC["hh_w"]),LV("MICS4 standard, household members",lvp(c.WS1.isin(impA)|((c.WS1==91)&c.WS2.isin(impA)))["mem_w"])],
 "100% is reproduced only when tanker-truck (61), cart (71) and bottled water (91) are counted as improved, i.e. the current JMP list with 'packaged/delivered' water, as the method record's section 2 states. Under the definition used by MICS4 in 2011 (tanker/cart unimproved, bottled conditional on WS2) the value is about 71%. Tanker-truck alone is about a quarter of households. Unweighted WS1 counts among completed households: "+json.dumps(ws1c)+". Weighted, unweighted, household-level and member-level all round to 100, so the weight and level cannot be told apart from the data for this row."+common)
areas["LBN"]["ind"]["6.1.1"]=byreg(full,c,"hhweight")
areas["LBN"]["ind"]["6.1.1 (MICS4 2011 definition: no tanker/cart, bottled only if WS2 improved)"]=byreg(c.WS1.isin(impA)|((c.WS1==91)&c.WS2.isin(impA)),c,"hhweight")
# 6.2.1
si={11,12,13,15,21,22}; x=c.WS8.isin(si)&(c.WS9==2); a=lv(x); p=lvp(x)
lrow("6.2.1",98,a["hh_w"],"household (member-level gives the same rounded value)",["WS8","WS9"],"WS8 in 11,12,13,15 (flush to sewer/septic/pit/unknown), 21 VIP, 22 pit latrine with slab AND WS9 = 2 (not shared)",
 "all completed households (HH9=1), WS8 'Other'/'Missing' kept in denominator","hhweight",a["n"],"hh.sav",
 [LV("unweighted households",a["hh_u"]),LV("household members (hhweight x HH11)",p["mem_w"]),LV("also counting 14 flush to somewhere else as improved",lv(c.WS8.isin(si|{14})&(c.WS9==2))["hh_w"]),
  LV("improved type only, sharing ignored",lv(c.WS8.isin(si))["hh_w"]),LV("WS8 missing (99) excluded from denominator",lv(x,c[c.WS8!=99])["hh_w"])],
 "The shared-toilet variable is WS9 ('Toilet facility shared', 1 Yes / 2 No / 9 Missing); WS10 and WS11 only describe the 21 sharing households. All variants round to 98, so weight, level and the exact improved list cannot be told apart from the data."+common)
areas["LBN"]["ind"]["6.2.1"]=byreg(x,c,"hhweight")
# 7.1.1
x=c.HC8A==1; a=lv(x); p=lvp(x)
lrow("7.1.1",100,a["hh_w"],"household (member-level gives the same rounded value)",["HC8A"],"1 = Yes","all completed households (HH9=1); HC8A has no missing among them","hhweight",a["n"],"hh.sav",
 [LV("unweighted households",a["hh_u"]),LV("household members (hhweight x HH11)",p["mem_w"])],"99.7% before rounding. Weight and level cannot be told apart from the data."+common)
areas["LBN"]["ind"]["7.1.1"]=byreg(x,c,"hhweight")
# 4.1.2
k=hl[hl.HL6.between(6,17)]; x=hl.ED5==1; kk=k[k.ED5.isin([1,2])]
a=lv(x,kk); b=lv(x,k)
lrow("4.1.2",84,a["hh_w"],"person (household member)",["ED5","HL6"],"ED5 = 1 (Yes, attended school during current school year 2010-2011)",
 "household members aged 6-17 (HL6) with an ED5 answer (1 or 2); the 94 children who never attended school (ED3 = 2, ED5 skipped) or have ED3 missing are NOT in the denominator","hhweight (as carried in hl.sav)",a["n"],"hl.sav",
 [LV("same, unweighted",a["hh_u"]),LV("denominator = ALL members 6-17 (never-attended counted as not attending), hhweight",b["hh_w"]),LV("denominator = all members 6-17, unweighted",b["hh_u"]),
  LV("ages 5-17, all members, hhweight",lv(x,hl[hl.HL6.between(5,17)])["hh_w"])],
 "84%% is reproduced only if children with ED5 blank are dropped; ED5 is blank by skip for children who never attended school (ED3 = 2). With the stated definition (all children 6-17 in the denominator, n=%d) the value is %s%%, which rounds to 83. Weighted and unweighted round the same."%(b["n"],b["hh_w"]))
areas["LBN"]["ind"]["4.1.2"]=byreg(x,kk,"hhweight")
areas["LBN"]["ind"]["4.1.2 (all children 6-17 in denominator)"]=byreg(x,k,"hhweight")
# 11.1.1
ok=c[c.HC2!=99]; ratio=c.HH11/c.HC2.where(c.HC2!=99); x=ratio>3; a=lv(x,ok); p=lvp(x,ok); b=lv(x)
lrow("11.1.1",19,a["hh_w"],"household",["HH11","HC2"],"HH11 / HC2 > 3 (household members per room used for sleeping, strictly more than 3)",
 "completed households with HC2 reported (HC2 = 99 'Missing' excluded, 71 households)","hhweight",a["n"],"hh.sav",
 [LV("unweighted households",a["hh_u"]),LV("HC2 missing kept in denominator as not overcrowded, hhweight",b["hh_w"]),LV("household members living in overcrowded households (hhweight x HH11)",p["mem_w"]),
  LV("3 or more per room (>=3), hhweight",lv(ratio>=3,ok)["hh_w"])],
 "The sleeping-rooms variable is HC2 ('Number of rooms used for sleeping'); household size is HH11 ('Number of HH members'). The published 19% is the share of HOUSEHOLDS; the share of household members is about 27%. Excluding or keeping the 71 households with HC2 missing both round to 19; weighted and unweighted round the same."+common)
areas["LBN"]["ind"]["11.1.1"]=byreg(x,ok,"hhweight")
areas["LBN"]["ind"]["11.1.1 (household members)"]=byreg(x,ok,"pw")
# 16.9.1
cc=ch[ch.UF9==1]; cert=ch.BR1.isin([1,2]); std=cert|(ch.BR2==1)
a=lv(cert,cc,"chweight"); s=lv(std,cc,"chweight"); allr=lv(std,ch,"chweight")
lrow("16.9.1",98,a["hh_w"],"person (child under 5)",["BR1","BR2"],"BR1 = 1 (Yes, seen) or 2 (Yes, not seen): child has a birth certificate; BR2 = 1 (registered without certificate) NOT counted",
 "children under 5 with a completed under-5 questionnaire (UF9=1)","chweight",a["n"],"ch.sav",
 [LV("same, unweighted",a["hh_u"]),LV("standard MICS: BR1 in (1,2) OR BR2 = 1, chweight",s["hh_w"]),LV("standard MICS, unweighted, completed interviews",s["hh_u"]),
  LV("standard MICS, unweighted, ALL 1,922 rows incl. 6 not-completed interviews as not registered",allr["hh_u"])],
 "Not uniquely reproduced. The standard MICS definition the method text points to (certificate BR1 = 1/2 or registered BR2 = 1, chweight) gives %s%%, which rounds to 99, one point above the published 98. Two variants round to 98: (a) birth certificate only (BR1 in 1,2), weighted %s / unweighted %s; (b) the standard definition taken unweighted over all 1,922 rows including the 6 not-completed interviews, %s. Which one the pipeline used cannot be decided from the data; (a) is reported here as recalc. BR2 was asked only when BR1 = 3 (41 children: 17 registered, 24 not). chweight is non-zero only for UF9=1."%(s["hh_w"],a["hh_w"],a["hh_u"],allr["hh_u"]))
areas["LBN"]["ind"]["16.9.1"]=byreg(cert,cc,"chweight")
areas["LBN"]["ind"]["16.9.1 (standard: certificate or registered)"]=byreg(std,cc,"chweight")
areas["LBN"]["weights"]="hhweight for household and household-member indicators, chweight for 16.9.1; n is the unweighted denominator. Keys without a bracket use the definition that reproduces the published value; bracketed keys are the alternative definition."
for r in rows:
    r["match_note"]={"Lebanon:16.9.1":"ambiguous: matches only with a non-standard variant; standard definition gives 99","Lebanon:4.1.2":"matches only with never-attended children dropped from the denominator; stated definition gives 83","Lebanon:6.1.1":"matches only with tanker/cart/bottled counted as improved"}.get(r["country"]+":"+r["sdg"],"unambiguous at whole-percent rounding")
areas["LBN"]["ind_note"]="for '11.1.1 (household members)' the n is still the number of households"
json.dump({"rows":rows,"vars":vars_,"areas":areas},open(OUT,"w"),indent=1,ensure_ascii=False)
for r in rows: print(r["country"],r["sdg"],r["published"],r["recalc"],r["match"],r["n"]); [print("    ",v) for v in r["variants_tried"]]
print(json.dumps(areas,indent=0)[:6000])
