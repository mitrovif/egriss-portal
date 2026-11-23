import pandas as pd, numpy as np, pyreadstat, json
S='<WORK>'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is not None: d=d[d[w].notna()]
    if len(d)==0: return [None,0]
    v=d[ind].mean() if w is None else (d[ind]*d[w]).sum()/d[w].sum()
    return R(round(100*float(v),1),int(len(d)),100*float(v))
def ind(s,codes,miss='excl'):
    i=s.isin(codes).astype(float)
    return i.where(s.notna()) if miss=='excl' else i
class R(list):
    def __init__(s,p,n,raw): super().__init__([p,n]); s.raw=raw
def rr(x): return int(np.floor(x.raw+0.5))
VARS={}
def meta(country,path,names,src):
    _,m=pyreadstat.read_dta(path,metadataonly=True)
    lab=dict(zip(m.column_names,m.column_labels))
    for n in names:
        vl=m.variable_value_labels.get(n,{})
        VARS[f'{country}:{n}']={'label':lab[n],'cats':[[str(int(k)) if isinstance(k,float) and k==int(k) else str(k),str(v)] for k,v in list(vl.items())[:15]],'source':src}
rows=[]; areas={}
def two(d,g,c1,c2,i,w): 
    a=wp(d[d[g]==c1],i,w); b=wp(d[d[g]==c2],i,w); return a,b
def var(what,a,b): return {'what':what,'g1':a[0],'g2':b[0]}
def cells(d,area,grp,gl,i,w):
    out={}
    for (a,g),x in d.groupby([area,grp]):
        r=wp(x,i,w)
        if r[1]>0: out[f'{a}|{gl[g]}']=r
    return out

# ---------------- Kenya
kp=S+'/disagg/ken_rhhs/hh.dta'
k,_=pyreadstat.read_dta(kp,usecols=['sample','strata','weight','hhsize','e09','e10','e11','electricity','psu'])
meta('Kenya',kp,['e09','e10','e11','electricity','sample','strata','weight','hhsize','psu'],'hh.dta')
k['pw']=k.weight*k.hhsize
def krow(sdg,pub,v,codes,w,numtxt,alts,notes,vars_):
    k['i']=ind(k[v],codes); a,b=two(k,'sample',1,0,'i',w)
    vt=[]
    for what,(vv,cc,ww) in alts.items():
        k['j']=ind(k[vv],cc); x,y=two(k,'sample',1,0,'j',ww); vt.append(var(what,x,y))
    rows.append({'country':'Kenya','sdg':sdg,'published':pub,'recalc':{'g1':a[0],'g2':b[0]},'match':rr(a)==pub['g1'] and rr(b)==pub['g2'],'level':'household','vars':vars_,'numerator_codes':numtxt,'denominator':'all households (no missing values in the variable)','weight':w,'group_var':'sample','g1':'Refugees (sample=1)','g2':'Nationals (sample=0; core + wider host strata)','n':{'g1':a[1],'g2':b[1]},'file':'hh.dta','variants_tried':vt,'notes':notes})
J=[5,7,9,10,11,12,13,15]
krow('6.1.1',{'g1':99,'g2':100},'e09',J+[14],'weight','5 Protected Spring, 7 Protected Well, 9 Borehole/Tube well, 10 Piped into dwelling, 11 Piped to yard/plot, 12 Bottled water, 13 Rain/Harvested water, 14 Water Vendor, 15 Public tap/Standpipe (i.e. everything except 1-4 surface water, 6 unprotected spring, 8 unprotected well, 96 other)',
 {'same codes, unweighted':('e09',J+[14],None),'same codes, person-weighted (weight x hhsize)':('e09',J+[14],'pw'),'strict JMP without 14 Water Vendor, weighted':('e09',J,'weight'),'strict JMP without 14 Water Vendor, unweighted':('e09',J,None),'without vendor and bottled, weighted':('e09',[5,7,9,10,11,13,15],'weight')},
 'Published value only reproduces if code 14 Water Vendor counts as improved (411 of 4838 households). Without it: 92% / 85%. Weighted and unweighted both round to 99 / 100, so the weight cannot be confirmed from this row alone.',['e09'])
S6=[1,2,3,4,5,10]
krow('6.2.1',{'g1':97,'g2':94},'e10',S6,'weight','1 Flush to Main Sewer, 2 Flush to Septic tank, 3 Flush to Cess pool, 4 VIP Pit Latrin, 5 Pit latrine covered, 10 Flush to Bio-septic tank (not counted: 6 Pit Latrine uncovered, 7 Bucket latrine, 8 Open, 96 Other)',
 {'same codes, unweighted':('e10',S6,None),'same codes, person-weighted':('e10',S6,'pw'),'without 10 bio-septic, weighted':('e10',[1,2,3,4,5],'weight'),'without 5 covered pit, weighted':('e10',[1,2,3,4,10],'weight'),'plus 6 uncovered pit, weighted':('e10',[1,2,3,4,5,6,10],'weight')},
 'Refugee value is 97.498 before rounding, so it sits on the 97/98 boundary. Only the household-weighted variant gives 94 for nationals (unweighted 96).',['e10'])
krow('7.1.1',{'g1':99,'g2':98},'electricity',[1],None,'electricity = 1 Yes',
 {'electricity=1, weighted (weight)':('electricity',[1],'weight'),'electricity=1, person-weighted':('electricity',[1],'pw'),'e11 = 1 Electricity, unweighted':('e11',[1],None),'e11 = 1 Electricity, weighted':('e11',[1],'weight'),'e11 in 1 Electricity, 7 Solar, 12 Generator, weighted':('e11',[1,7,12],'weight'),'e11 in 1, 7, 8 solar torch, 12, weighted':('e11',[1,7,8,12],'weight')},
 'Variable is `electricity` ("Household has access to electricity"). It is identical record-for-record in its marginals to e11 = 1 (main lighting source is Electricity: 2386 nationals, 2384 refugees), so it is a lighting-source proxy and excludes solar. The published 99 / 98 reproduces UNWEIGHTED (99.1 / 98.1); with the sampling weight nationals come to 97.2 -> 97, which contradicts the method text "electricity var, weight". A weighted variant that also counts solar torch and generator lighting (e11 in 1,7,8,12) gives 99.3 / 97.6 -> 99 / 98 too, so the exact published recipe is ambiguous.',['electricity','e11'])
areas['KEN']={'area_var':None,'unit':None,'note':'No geography in hh.dta or hhm.dta: the only location-like variables are strata (Refugee / Core Host / Wider Host) and psu (enumeration area id, 888 for all refugees). No county, town or camp variable.','ind':{}}
k['i']=ind(k.e09,J+[14]); k['s']=ind(k.e10,S6); k['e']=ind(k.electricity,[1])
sl={1:'Refugee',2:'Core Host',3:'Wider Host'}
areas['KEN']['by_strata']={'6.1.1':{sl[s]:wp(k[k.strata==s],'i','weight') for s in sl},'6.2.1':{sl[s]:wp(k[k.strata==s],'s','weight') for s in sl},'7.1.1 (unweighted)':{sl[s]:wp(k[k.strata==s],'e',None) for s in sl}}

# ---------------- Somalia
sp=S+'/disagg/som_w1/SOM_2016_SHFS-W1_v03_M_STATA8/Output hh.dta'
s,sm=pyreadstat.read_dta(sp,usecols=['ind','reg_pess','weight','weight_adj','weight_cons','hhsize','drink_water','water','toilet_type'])
meta('Somalia',sp,['drink_water','water','toilet_type','ind','reg_pess','weight','weight_adj','weight_cons','hhsize'],'Output hh.dta')
s['g']=np.where(s.ind==4,'IDP','Host'); s['pw']=s.weight*s.hhsize
W=[1,2,3,4,5,7,9,10,12]
def srow(sdg,pub,i,w,vars_,numtxt,den,alts,notes):
    s['i']=i; a,b=two(s,'g','IDP','Host','i',w); vt=[]
    for what,(ii,ww) in alts.items():
        s['j']=ii; x,y=two(s,'g','IDP','Host','j',ww); vt.append(var(what,x,y))
    rows.append({'country':'Somalia','sdg':sdg,'published':pub,'recalc':{'g1':a[0],'g2':b[0]},'match':rr(a)==pub['g1'] and rr(b)==pub['g2'],'level':'household','vars':vars_,'numerator_codes':numtxt,'denominator':den,'weight':w,'group_var':'ind','g1':'IDP Settlements (ind=4)','g2':'Host = Mogadishu + Other Urban + Rural (ind=1,2,3)','n':{'g1':a[1],'g2':b[1]},'file':'Output hh.dta','variants_tried':vt,'notes':notes})
srow('6.1.1',{'g1':84,'g2':89},ind(s.drink_water,W,'incl'),'weight',['drink_water'],'1 Piped water into the home, 2 Piped water into compound, 3 Public tap, 4 Tubewell/borehole, 5 Protected dug well, 7 Protected spring, 9 Rainwater collection, 10 Bottled water, 12 Tanker-truck (not counted: 6, 8 unprotected, 11 Cart with small tank/drum, 13 surface water, 1000 Other)','all households, including the 32 with no answer (counted as not improved)',
 {'same codes, weight, missing excluded':(ind(s.drink_water,W),'weight'),'same codes, unweighted, missing excluded':(ind(s.drink_water,W),None),'same codes, unweighted, missing in denominator':(ind(s.drink_water,W,'incl'),None),'same codes, weight_adj, missing excluded':(ind(s.drink_water,W),'weight_adj'),'same codes, weight_cons, missing excluded':(ind(s.drink_water,W),'weight_cons'),'same codes, person-weighted (weight x hhsize), missing excluded':(ind(s.drink_water,W),'pw'),'plus 11 Cart (full JMP delivered water), weight, missing excluded':(ind(s.drink_water,W+[11]),'weight'),'without 10 bottled and 12 tanker, weight, missing excluded':(ind(s.drink_water,[1,2,3,4,5,7,9]),'weight')},
 'Weight is `weight` (unadjusted household weight), not the survey\'s recommended weight_adj (with weight_adj host is 92.6). The code set equals the file\'s own recode `water` in 1-4. Exact match needs missing answers kept in the denominator (84.4 / 88.6); with missing excluded it is 84.5 / 89.2, which rounds to 85 / 89. Tanker-truck is counted improved but Cart with small tank/drum is not; with both (JMP delivered water) it is 86.3 / 92.6.')
t=s.toilet_type
srow('6.2.1',{'g1':24,'g2':81},(~t.isin([3,4,1000])).astype(float),'weight',['toilet_type'],'1 Water closet (flush), 2 Pit latrine; plus households with no answer (38) fall in the numerator because the rule is "not 3 Public toilet, not 4 Open space, not 1000 Other"','all households',
 {'1,2 only, weight, missing excluded':(ind(t,[1,2]),'weight'),'1,2 only, weight, missing in denominator as not improved':(ind(t,[1,2],'incl'),'weight'),'1,2 only, unweighted, missing excluded':(ind(t,[1,2]),None),'1,2 only, weight_adj, missing excluded':(ind(t,[1,2]),'weight_adj'),'1,2 only, weight_cons, missing excluded':(ind(t,[1,2]),'weight_cons'),'1,2 only, person-weighted, missing excluded':(ind(t,[1,2]),'pw'),'1,2,1000 Other, weight, missing excluded':(ind(t,[1,2,1000]),'weight'),'1,2,3 incl public toilet, weight, missing excluded':(ind(t,[1,2,3]),'weight'),'1 flush only, weight, missing excluded':(ind(t,[1]),'weight')},
 'The clean definition (1 flush + 2 pit latrine, `weight`, missing excluded) gives 24.3 / 80.5 -> 24 / 80, one point below the published host 81. The only variant found that rounds to 24 / 81 counts the 38 households with no answer as improved (24.3 / 80.6); that looks like a side effect of a "not in unimproved codes" rule, not a deliberate choice. Weight is the unadjusted `weight` (weight_adj gives host 86.9). Substantive caveats: the question has only five categories; 3 Public toilet is treated as unimproved although it says nothing about the facility type (251 of 430 IDP households use a public toilet, which is what drives the 24%); 2 Pit latrine is counted improved with no slab information.')
# areas
rl=sm.variable_value_labels['reg_pess']; s['reg']=s.reg_pess.map(rl)
s['iw']=ind(s.drink_water,W,'incl'); s['it']=(~t.isin([3,4,1000])).astype(float); s['it2']=ind(t,[1,2])
gl={'IDP':'IDP','Host':'Host'}
idpn=s[s.g=='IDP'].groupby('reg').size().to_dict()
areas['SOM']={'area_var':'reg_pess','unit':'region (PESS)','idp_households_per_region':{k_:int(v) for k_,v in idpn.items()},'note':'IDP settlements sampled in 5 regions; 3 have 50+ households (Banadir 215, Bari 108, Woqooyi Galbeed 72); Mudug (24) and Togdheer (12) are too small. Weighted with `weight`, same definitions as the national rows. Cells list [percent, unweighted households].','ind':{'6.1.1':cells(s,'reg','g',gl,'iw','weight'),'6.2.1':cells(s,'reg','g',gl,'it','weight'),'6.2.1 (clean: 1,2 only, missing excluded)':cells(s,'reg','g',gl,'it2','weight')}}

# ---------------- Bangladesh
bp=S+'/disagg/bgd_cbps2/cbps_tracking_r3_basic needs.dta'
b,bm=pyreadstat.read_dta(bp,usecols=['settlement_type','stratum','hh_weight_r3','upazila','camp_upazila','fs_fewer_meals_r3'])
meta('Bangladesh',bp,['fs_fewer_meals_r3','settlement_type','stratum','hh_weight_r3','upazila','camp_upazila'],'cbps_tracking_r3_basic needs.dta')
f=b.fs_fewer_meals_r3; b['i']=ind(f,[1]); b['j']=ind(f,[1],'incl')
a,c=two(b,'settlement_type',2,1,'i','hh_weight_r3')
vt=[var('unweighted, missing excluded',*two(b,'settlement_type',2,1,'i',None)),var('weighted, missing kept in denominator',*two(b,'settlement_type',2,1,'j','hh_weight_r3')),var('unweighted, missing kept in denominator',*two(b,'settlement_type',2,1,'j',None))]
hs={'high-spillover host (stratum=1)':wp(b[b.stratum==1],'i','hh_weight_r3'),'low-spillover host (stratum=2)':wp(b[b.stratum==2],'i','hh_weight_r3')}
rows.append({'country':'Bangladesh','sdg':'2.1.2','published':{'g1':31,'g2':32},'recalc':{'g1':a[0],'g2':c[0]},'match':rr(a)==31 and rr(c)==32,'level':'household','vars':['fs_fewer_meals_r3'],'numerator_codes':'1 = Yes','denominator':'households with a Yes/No answer (48 with no answer excluded; no -97 Refused present)','weight':'hh_weight_r3','group_var':'settlement_type','g1':'Refugee camp (settlement_type=2, same households as stratum=3 Camp)','g2':'Host (settlement_type=1, high + low spillover)','n':{'g1':a[1],'g2':c[1]},'file':'cbps_tracking_r3_basic needs.dta','variants_tried':vt,'notes':'Round 3 of the tracking survey (folder bgd_cbps2; folders bgd_cbps and bgd_cbps3 are empty). Variable exists only in round 3. The question stem (reference period) is not in the variable label; label is only "Eat fewer meals than usual or skip meals?". This is a single coping item, not FIES or FCS. Host split: '+json.dumps(hs)})
b['up']=b.upazila.where(b.upazila.notna(),b.camp_upazila).map(bm.variable_value_labels['upazila']).fillna('Unknown')
agree=int(((b.upazila==b.camp_upazila)&b.camp_upazila.notna()).sum()); both=int((b.upazila.notna()&b.camp_upazila.notna()).sum())
areas['BGD']={'area_var':'upazila (camp_upazila used where upazila is missing)','unit':'upazila','note':f'Weighted hh_weight_r3, missing excluded. upazila is missing for 59 camp and 99 host households; camp_upazila fills all camp gaps ({agree} of {both} camp records with both variables agree). Host households without upazila are shown as Unknown. Camps exist only in Teknaf and Ukhia.','ind':{'2.1.2':cells(b,'up','settlement_type',{1:'Host',2:'Refugee camp'},'i','hh_weight_r3')}}

# ---------------- Ecuador
vt=[]; rec=None
for w,v in [(1,'u04_01'),(2,'v04_01'),(3,'w04_01'),(4,'v04_01')]:
    p=f'{S}/disagg/ecu_ven/593_ph2w{w}_venezcasos_library.dta'
    d,_=pyreadstat.read_dta(p,usecols=[v,f'w_hh_ph2w{w}',f'w_ind_ph2w{w}','venez'])
    d['i']=ind(d[v],[1])
    u=wp(d,'i'); h=wp(d,'i',f'w_hh_ph2w{w}'); q=wp(d,'i',f'w_ind_ph2w{w}')
    vt+= [{'what':f'wave {w} ({v}), unweighted, n={u[1]}','g1':u[0],'g2':None},{'what':f'wave {w} ({v}), household weight w_hh_ph2w{w}','g1':h[0],'g2':None},{'what':f'wave {w} ({v}), individual weight w_ind_ph2w{w}','g1':q[0],'g2':None}]
    if w==1: rec=u; meta('Ecuador',p,['u04_01','venez','w_hh_ph2w1','w_ind_ph2w1','u03_05','u03_08'],'593_ph2w1_venezcasos_library.dta')
rows.append({'country':'Ecuador','sdg':'2.1.2','published':{'g1':42,'g2':None},'recalc':{'g1':rec[0],'g2':None},'match':rr(rec)==42,'level':'household (one respondent per household, phone survey)','vars':['u04_01'],'numerator_codes':'1 = si','denominator':'all 401 respondents in the wave 1 Venezuelan file (no missing)','weight':None,'group_var':'venez','g1':'Venezuelans (venez=1, whole file)','g2':None,'n':{'g1':rec[1],'g2':None},'file':'593_ph2w1_venezcasos_library.dta','variants_tried':vt[1:],'notes':'Phase 2 wave 1. u04_01 exists only in wave 1; the same question is v04_01 in waves 2 and 4 and w04_01 in wave 3 (37%, 32%, 30% unweighted). The file ships household and individual weights; weighted wave 1 is 48.8% (household) / 46.0% (individual), so the unweighted 42% understates the weighted estimate by 4-7 points. No host comparison in this file.'})

# ---------------- Nigeria
np_=S+'/disagg/nga_idp/Stata/1_cleanoutput/hhm.dta'
n,_=pyreadstat.read_dta(np_,usecols=['region','migr_idp','weight','B_1_1_hhm_age','B_4_3_hhm_edu_current'])
meta('Nigeria',np_,['B_4_3_hhm_edu_current','B_1_1_hhm_age','migr_idp','region','weight'],'1_cleanoutput/hhm.dta')
e=n.B_4_3_hhm_edu_current
def nsub(lo,hi,miss='excl'):
    a=n[n.B_1_1_hhm_age.between(lo,hi)].copy(); a['i']=ind(a.B_4_3_hhm_edu_current,[1],miss); return a
a=nsub(6,17); x,y=two(a,'migr_idp',1,0,'i','weight')
vt=[var('ages 6-17, unweighted',*two(a,'migr_idp',1,0,'i',None))]
a2=nsub(6,17,'incl'); vt.append(var('ages 6-17, weighted, missing kept in denominator',*two(a2,'migr_idp',1,0,'i','weight')))
for lo,hi in [(6,18),(6,14),(5,17)]:
    a3=nsub(lo,hi); vt.append(var(f'ages {lo}-{hi}, weighted',*two(a3,'migr_idp',1,0,'i','weight')))
rows.append({'country':'Nigeria','sdg':'4.1.2','published':{'g1':70,'g2':74},'recalc':{'g1':x[0],'g2':y[0]},'match':rr(x)==70 and rr(y)==74,'level':'person (household members aged 6-17)','vars':['B_4_3_hhm_edu_current','B_1_1_hhm_age'],'numerator_codes':'B_4_3_hhm_edu_current = 1 Yes','denominator':'members with age 6-17 and a Yes/No answer (9 with no answer excluded)','weight':'weight','group_var':'migr_idp','g1':'IDP (migr_idp=1)','g2':'Host community (migr_idp=0)','n':{'g1':x[1],'g2':y[1]},'file':'1_cleanoutput/hhm.dta','variants_tried':vt,'notes':'The variable is named B_4_3_hhm_edu_current in the file; "B_4_3" in the method text is a shorthand, not a variable name. The weight variable has no label. Unweighted the gap is much wider (67 / 80). The question is not asked of children aged 5 (all missing).'})
a['gl']=a.migr_idp.map({1:'IDP',0:'Host'})
nga={'area_var':'region','unit':'state','note':'Sample is concentrated in Borno (about 82% of households); the other five states have small cells, several below 30. Weighted with `weight`. Cells list [percent, unweighted n].','ind':{'4.1.2':cells(a,'region','gl',{'IDP':'IDP','Host':'Host'},'i','weight')},'new':{}}
hp=S+'/disagg/nga_idp/Stata/1_cleanoutput/hhq.dta'
hv=['region','migr_idp','weight','hhsize','C_1_11_water_home','C_1_21_toilet','C_1_17_light','watersource','sanitation','lighting','C_1_22_share_facility']
h,_=pyreadstat.read_dta(hp,usecols=hv); meta('Nigeria',hp,[v for v in hv if v not in('region','migr_idp','weight')],'1_cleanoutput/hhq.dta')
VARS['Nigeria:hhq.weight']={'label':None,'cats':[],'source':'1_cleanoutput/hhq.dta (household weight, no label stored)'}
h['gl']=h.migr_idp.map({1:'IDP',0:'Host'})
def clean(v): return h[v].where(h[v]>0)   # drop -98 / -99
dist={v:{str(k_):int(c_) for k_,c_ in h[v].value_counts(dropna=False).sort_index().items()} for v in ['C_1_11_water_home','C_1_21_toilet','C_1_17_light']}
def newind(key,v,codes,definition,alts):
    h['i']=ind(clean(v),codes)
    o={'status':'new, not published','definition':definition,'vars':[v],'weight':'weight','level':'household','national':{g:wp(h[h.gl==g],'i','weight') for g in ['IDP','Host']},'national_unweighted':{g:wp(h[h.gl==g],'i',None) for g in ['IDP','Host']},'cells':cells(h,'region','gl',{'IDP':'IDP','Host':'Host'},'i','weight'),'answer_counts_unweighted':dist[v],'variants':[]}
    for what,(vv,cc) in alts.items():
        h['j']=ind(clean(vv),cc); o['variants'].append({'what':what,'IDP':wp(h[h.gl=='IDP'],'j','weight')[0],'Host':wp(h[h.gl=='Host'],'j','weight')[0]})
    nga['new'][key]=o
newind('6.1.1','C_1_11_water_home',[1,2,3,4,5,7,9,10,11,12],'Improved drinking water (JMP incl. packaged and delivered): C_1_11_water_home in 1 Piped into dwelling, 2 Piped to yard/plot, 3 Public tap/standpipe, 4 Tubewell/borehole, 5 Protected dug well, 7 Protected spring, 9 Rainwater collection, 10 Bottled/sachet water, 11 Cart with small tank/drum, 12 Tanker-truck. Not improved: 6 Unprotected dug well, 8 Unprotected spring, 13 Surface water, 1000 Other. -98/-99 and missing excluded. Household level, weighted with `weight`.',
 {'without delivered water (11 cart, 12 tanker)':('C_1_11_water_home',[1,2,3,4,5,7,9,10]),'file recode watersource = 1 Improved':('watersource',[1])})
newind('6.2.1','C_1_21_toilet',[1,2,3,5,6,7,9],'Improved sanitation facility (JMP, sharing ignored): C_1_21_toilet in 1 Flush to piped sewer, 2 Flush to septic tank, 3 Flush to pit latrine, 5 Flush to unknown place, 6 VIP latrine, 7 Pit latrine with slab, 9 Composting toilet. Not improved: 4 Flush to elsewhere, 8 Pit latrine without slab/open pit, 10 Bucket, 11 Hanging toilet, 12 No facilities/bush/field, 13 Toilet on water, 1000 Other. -98/-99 and missing excluded. Household level, weighted with `weight`. Shared facilities (C_1_22_share_facility) are still counted, so this is "improved facility", not JMP "at least basic".',
 {'all flush codes 1-5 plus 6,7,9':('C_1_21_toilet',[1,2,3,4,5,6,7,9]),'file recode sanitation = 1 Improved':('sanitation',[1])})
h['basic']=((ind(clean('C_1_21_toilet'),[1,2,3,5,6,7,9])==1)&(h.C_1_22_share_facility==0)).astype(float).where(clean('C_1_21_toilet').notna())
nga['new']['6.2.1']['variants'].append({'what':'improved and not shared (C_1_22_share_facility = 0), i.e. at least basic','IDP':wp(h[h.gl=='IDP'],'basic','weight')[0],'Host':wp(h[h.gl=='Host'],'basic','weight')[0]})
newind('7.1.1','C_1_17_light',[1,2,3,4],'Electricity access, proxied by main source of lighting (no direct electricity question in the file): C_1_17_light in 1 National Grid connection / PHCN, 2 Local Mini Grid, 3 Diesel Generator (private electricity), 4 Solar Home System. Not counted: 5 Solar Lantern/Lighting System, 6 Rechargeable Battery, 7 Torch, 8 Kerosene, 9 Gas, 10-11 Paraffin, 12 Firewood, 13 Grass, 14 Candle wax, 15 Biogas, 16 No lighting, 1000 Other. Missing excluded. Household level, weighted with `weight`.',
 {'grid and mini-grid only (1,2)':('C_1_17_light',[1,2]),'plus 5 solar lantern and 6 rechargeable battery (1-6)':('C_1_17_light',[1,2,3,4,5,6]),'file recode lighting in 5 Electricity, 6 Solar Power / Biogas':('lighting',[5,6]),'file recode lighting = 5 Electricity':('lighting',[5])})
areas['NGA']=nga
json.dump({'rows':rows,'vars':VARS,'areas':areas},open(S+'/verify/wb.json','w'),ensure_ascii=False,indent=1)
for r in rows: print(r['country'],r['sdg'],r['published'],r['recalc'],r['match'],r['n'])
for r in rows:
    print('--',r['country'],r['sdg']); [print('   ',v) for v in r['variants_tried']]
print(json.dumps(areas,ensure_ascii=False)[:9000])
