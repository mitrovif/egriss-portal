import pandas as pd, numpy as np, sys, re, zipfile, io, json, pyreadstat
sys.path.insert(0,sys.argv[1]+'/verify/scripts_unhcr')
from xlsx import read_xlsx
S,Z,MOZ,MOZL,SAV,OUT=sys.argv[1:7]
def est(df,flag,g,w=None):
    ok=flag.notna()&df[g].notna(); d=df[ok]; f=flag[ok].astype(float)
    ww=d[w].astype(float) if w else pd.Series(1.0,index=d.index)
    r=((f*ww).groupby(d[g]).sum()/ww.groupby(d[g]).sum()*100)
    return {k:round(float(v),2) for k,v in r.items()}, {k:int(v) for k,v in d.groupby(g).size().items()}
def two(df,flag,g,w,k1,k2):
    r,n=est(df,flag,g,w); return {'g1':r.get(k1),'g2':r.get(k2)},{'g1':n.get(k1),'g2':n.get(k2)}
def var(what,df,flag,g,w,k1,k2):
    r,n=two(df,flag,g,w,k1,k2); return {'what':what,'g1':r['g1'],'g2':r['g2']}
def area(df,flag,a,g,w,amap=None,gmap=None):
    out={}
    d=df[df[a].notna()&(df[a].astype(str)!='')]
    for (av,gv),sub in d.groupby([a,g]):
        f=flag.loc[sub.index]; sub=sub[f.notna()]; f=f[f.notna()].astype(float)
        if len(sub)==0: continue
        ww=sub[w].astype(float) if w else pd.Series(1.0,index=sub.index)
        out[f"{amap.get(av,av) if amap else av}|{gmap.get(gv,gv) if gmap else gv}"]=[round(float((f*ww).sum()/ww.sum()*100),1),int(len(sub))]
    return out
def match(pub,rec): return all(rec[k] is not None and int(np.floor(rec[k]+0.5))==pub[k] for k in ('g1','g2'))
rows=[]; V={}; A={}
# ================= CAMEROON 2024
F24='UNHCR_CMR_2024_PROFILING_data_household_v2.1.csv'
h=pd.read_csv(S+'/disagg/cmr/'+F24,dtype=str,low_memory=False)
i=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_individual_v2.1.csv',dtype=str,usecols=['HOUSEHOLD_ID'])
h['hs']=h.HOUSEHOLD_ID.map(i.groupby('HOUSEHOLD_ID').size()).astype(float)
h['wp']=h.WEIGHT_FINAL.astype(float)*h.hs
x=read_xlsx(S+'/disagg/cmr/Variables_List.xlsx')
vl={r.get('B'):r.get('C') for r in x['Households_File_Var_List'][1:]}
cats={}; cur=None
for r in x['Households_File_Var_Values'][1:]:
    if r.get('A'): cur=r['A']
    cats.setdefault(cur,[]).append([r.get('B',''),r.get('C','')])
for v in ['rCSI_LEVEL','HOUSEHOLD_STATUS','WEIGHT_FINAL','S1Q1','S11Q0','S11Q1']:
    V['Cameroon:'+v]={'label':vl.get(v),'cats':cats.get(v,[])[:15],'source':'Variables_List.xlsx (sheets Households_File_Var_List / Households_File_Var_Values), 2024 round'}
names=dict((c,l) for c,l in cats['S1Q1'])
f=(h.rCSI_LEVEL=='3').astype(float); pub={'g1':51,'g2':32}
rec,n=two(h,f,'HOUSEHOLD_STATUS',None,'1','2')
rows.append({'country':'Cameroon','sdg':'2.1.2','published':pub,'recalc':rec,'match':match(pub,rec),'level':'household','vars':['rCSI_LEVEL'],
 'numerator_codes':'3 = 19+: High','denominator':'all households (no missing values in rCSI_LEVEL)','weight':None,'group_var':'HOUSEHOLD_STATUS',
 'g1':'1 = Internally Displaced (IDP) Household','g2':'2 = Non-Displaced Household','n':n,'file':F24,
 'variants_tried':[var('household, weighted WEIGHT_FINAL',h,f,'HOUSEHOLD_STATUS','WEIGHT_FINAL','1','2'),var('household, unweighted (MATCH)',h,f,'HOUSEHOLD_STATUS',None,'1','2'),
   var('person level: WEIGHT_FINAL x household size (members counted in individual file)',h,f,'HOUSEHOLD_STATUS','wp','1','2'),var('person level unweighted: household size',h,f,'HOUSEHOLD_STATUS','hs','1','2'),
   var('levels 2+3, weighted',h,h.rCSI_LEVEL.isin(['2','3']).astype(float),'HOUSEHOLD_STATUS','WEIGHT_FINAL','1','2')],
 'notes':'Published 51/32 is reproduced only UNWEIGHTED (50.8/32.1). The published method text says "rCSI level 3 weighted"; with WEIGHT_FINAL the values are 55.6/36.0. rCSI is a coping-strategy index, not FIES (SDG 2.1.2 proper).'})
GM={'1':'IDP household','2':'Non-displaced household'}
A['CMR']={'area_var':'S1Q1','unit':'division','names':names,'ind':{'2.1.2':area(h,f,'S1Q1','HOUSEHOLD_STATUS',None,None,GM)},
  'notes':'Keys are S1Q1 p-codes as stored in the 2024 file (names from Variables_List.xlsx). 2.1.2 unweighted (the matching definition). 7.1.1 comes from the 2025 round file where the division variable is LMQ1 (stored as names); mapped back to the 2024 codes by name; weighted WEIGHT_FINAL.'}
# 7.1.1 from 2025 round
z=zipfile.ZipFile(Z); p='CMR_PROFILING_2025_round2_anon/'; F25='UNHCR_CMR_2025_PROFILING_data_household_v2.1.csv'
h5=pd.read_csv(io.BytesIO(z.read(p+F25)),dtype=str,low_memory=False)
l5=pd.read_csv(io.BytesIO(z.read(p+'UNHCR_CMR_2025_PROFILING_labels_household_v2.1.csv')),dtype=str); l5=dict(zip(l5.V1,l5.V2))
h5['g']=np.where(h5.HOUSEHOLD_STATUS_SR.str.startswith('Internally'),'1','2')
h5['wp']=h5.WEIGHT_FINAL.astype(float)*h5.IGQ5.astype(float)
for v in ['AEQ0','HOUSEHOLD_STATUS_SR','WEIGHT_FINAL','LMQ1','IGQ5']:
    c=[] if v in('WEIGHT_FINAL','IGQ5') else [['',re.sub(r'<U\+00E9>','é',k)] for k in h5[v].value_counts().index]
    V['Cameroon2025:'+v]={'label':l5.get(v),'cats':c,'source':'UNHCR_CMR_2025_PROFILING_labels_household_v2.1.csv inside CMR_PROFILING_2025_round2_anon.zip; the CSV stores answer labels as text, numeric codes not read'}
f5=(h5.AEQ0=='Yes').astype(float); pub={'g1':95,'g2':93}
rec,n=two(h5,f5,'g','WEIGHT_FINAL','1','2')
f24=(h.S11Q0=='1').astype(float)
rows.append({'country':'Cameroon','sdg':'7.1.1','published':pub,'recalc':rec,'match':match(pub,rec),'level':'household','vars':['AEQ0'],
 'numerator_codes':'"Yes" (access to electricity from the public distribution network)','denominator':'all households (no missing)','weight':'WEIGHT_FINAL','group_var':'HOUSEHOLD_STATUS_SR',
 'g1':'Internally Displaced (IDP) Household','g2':'Non-Displaced Household','n':n,'file':'CMR_PROFILING_2025_round2_anon.zip :: '+F25+' (2025 round 2, NOT the 2024 file in disagg/cmr)',
 'variants_tried':[var('2025 file, AEQ0=Yes, WEIGHT_FINAL (MATCH)',h5,f5,'g','WEIGHT_FINAL','1','2'),var('2025 file, AEQ0=Yes, unweighted',h5,f5,'g',None,'1','2'),
   var('2025 file, person level: WEIGHT_FINAL x IGQ5 household size',h5,f5,'g','wp','1','2'),
   var('2024 file, S11Q0=1 (access to electricity in home), WEIGHT_FINAL',h,f24,'HOUSEHOLD_STATUS','WEIGHT_FINAL','1','2'),var('2024 file, S11Q0=1, unweighted',h,f24,'HOUSEHOLD_STATUS',None,'1','2'),
   var('2024 file, S11Q1=1 main lighting source Electricity (ENEO), WEIGHT_FINAL',h,(h.S11Q1=='1').astype(float),'HOUSEHOLD_STATUS','WEIGHT_FINAL','1','2')],
 'notes':'AEQ0 does not exist in the 2024 profiling file (disagg/cmr); it is in the 2025 round-2 file (catalogue 1467) found zipped under sdg_docs/pilot/data and read in memory. Year label 2025 is therefore right, but the source differs from the 2.1.2 row (2024 round). Grid access only, so it understates 7.1.1 (solar/generator not counted). Matches the earlier pilot output SDG_DEMONSTRATION_TABULATIONS.csv (95.0 / 93.3, n 1017 / 1521).'})
n2c={v.upper():k for k,v in names.items()}
h5['area']=h5.LMQ1.map(n2c)
A['CMR']['ind']['7.1.1']=area(h5,f5,'area','g','WEIGHT_FINAL',None,GM)
# ================= DR CONGO
FC='UNHCR_COD_2023_KASAI_data_household_v2.1.dta'
c,meta=pyreadstat.read_dta(S+'/disagg/cod/'+FC,usecols=['s06q15_WaterSource','s06q25_Toilet','s00q0_HHtype_HHH','s00q13_HHtype','s00q1_Province','s07q00_SizeChildren','s07q00_SizeMen','s07q00_SizeWomen'])
_,mall=pyreadstat.read_dta(S+'/disagg/cod/'+FC,metadataonly=True)
wv=[k for k,l in mall.column_names_to_labels.items() if re.search('weight|pond|poids',(k+' '+(l or '')),re.I)]
lc=pd.read_csv(S+'/disagg/cod/UNHCR_COD_2023_KASAI_labels_household_v2.1.csv',dtype=str); lc=dict(zip(lc.VAR,lc.LABEL))
for v in ['s06q15_WaterSource','s06q25_Toilet','s00q0_HHtype_HHH','s00q1_Province']:
    vv=meta.variable_value_labels.get(v)
    cc=[[str(int(k)),l] for k,l in sorted(vv.items())][:15] if vv else [['',k] for k in sorted(c[v].unique()) if k]
    V['DR Congo:'+v]={'label':lc.get(v) if isinstance(lc.get(v),str) else meta.column_names_to_labels.get(v),'cats':cc,'source':'UNHCR_COD_2023_KASAI_labels_household_v2.1.csv (label); value labels from the .dta'}
def fl(s,codes):
    x=s.isin(codes).astype(float); x[s.isna()]=np.nan; return x
G='s00q0_HHtype_HHH'; JMP=[1,2,3,4,5,6,8,10,11,12,14]
c['hs']=c[['s07q00_SizeChildren','s07q00_SizeMen','s07q00_SizeWomen']].sum(axis=1)
fw=fl(c.s06q15_WaterSource,JMP); pub={'g1':30,'g2':38}; rec,n=two(c,fw,G,None,2.0,1.0)
rows.append({'country':'DR Congo','sdg':'6.1.1','published':pub,'recalc':rec,'match':match(pub,rec),'level':'household','vars':['s06q15_WaterSource'],
 'numerator_codes':'1 Faucet in dwelling, 2 Faucet in yard/parcel, 3 Public faucet/fountain, 4 Faucet at neighbour\'s house, 5 Pumped well or borehole, 6 Protected well, 8 Protected spring, 10 Rainwater (11 Truck with tank, 12 Cart with small tank, 14 Bottled water also improved under JMP but have zero households)',
 'denominator':'all households with a water source value (1 missing in whole file) and a group value','weight':None,'group_var':G,'g1':'2 = IDP','g2':'1 = Host community','n':n,'file':FC+' (same data as the .csv)',
 'variants_tried':[var('JMP improved, group s00q0_HHtype_HHH, unweighted (MATCH)',c,fw,G,None,2.0,1.0),var('same but excluding neighbour\'s faucet (code 4)',c,fl(c.s06q15_WaterSource,[x for x in JMP if x!=4]),G,None,2.0,1.0),
   var('same but protected spring (8) not counted',c,fl(c.s06q15_WaterSource,[1,2,3,4,5,6,10]),G,None,2.0,1.0),var('JMP improved, group = sampling stratum s00q13_HHtype (2 IDP / 1 host)',c,fw,'s00q13_HHtype',None,2.0,1.0),
   var('JMP improved, weighted by sum of s07q00_Size* (not a usable household size: mostly 0)',c,fw,G,'hs',2.0,1.0)],
 'notes':'Improved source only (no time/distance criterion although s06q16_WaterDistance exists), so this is "improved" not "basic". No weight variable found in the household file (search of names and labels for weight/pond/poids: '+str(wv)+'), consistent with the "unweighted" note. 31 households have no s00q0_HHtype_HHH value and are dropped. The file also has returned IDPs (809) and repatriated refugees (796), not published.'})
ft=fl(c.s06q25_Toilet,[1,2,3,4]); pub={'g1':8,'g2':6}; rec,n=two(c,ft,G,None,2.0,1.0)
rows.append({'country':'DR Congo','sdg':'6.2.1','published':pub,'recalc':rec,'match':match(pub,rec),'level':'household','vars':['s06q25_Toilet'],
 'numerator_codes':'1 Manual flush / Flush, 2 Flush connected to a sewage system/septic tank/cistern, 3 Cistern, 4 Composting toilet','denominator':'all households with a toilet value (1 missing in whole file) and a group value',
 'weight':None,'group_var':G,'g1':'2 = IDP','g2':'1 = Host community','n':n,'file':FC+' (same data as the .csv)',
 'variants_tried':[var('codes 1-4, unweighted (MATCH)',c,ft,G,None,2.0,1.0),var('codes 1-3 (flush only)',c,fl(c.s06q25_Toilet,[1,2,3]),G,None,2.0,1.0),var('code 4 only (composting)',c,fl(c.s06q25_Toilet,[4]),G,None,2.0,1.0),
   var('codes 1-4, group = s00q13_HHtype',c,ft,'s00q13_HHtype',None,2.0,1.0)],
 'notes':'Almost all of the numerator is code 4 "Composting toilet" (299 of 328 households in the whole file). The answer list has no "pit latrine with slab" option; code 8 "Open hole" (2,386 households) is treated as unimproved. Sharing (s06q26_ToiletShare) is ignored, so this is "improved facility", not "basic/safely managed".'})
GC={1.0:'Host community',2.0:'IDP',3.0:'Returned IDP',4.0:'Repatriated refugee'}
A['COD']={'area_var':'s00q1_Province','unit':'province','names':{},'ind':{'6.1.1':area(c,fw,'s00q1_Province',G,None,None,GC),'6.2.1':area(c,ft,'s00q1_Province',G,None,None,GC)},'notes':'Unweighted households. Province stored as text; 7 households have an empty province and are left out.'}
# ================= MOZAMBIQUE
FM='UNHCR_MOZ_2025_PROFILING_data_main_v2.1.csv'
m=pd.read_csv(MOZ,dtype=str,low_memory=False); hid='@_parent_index'
hh=m.drop_duplicates(hid).copy()
ml=pd.read_csv(MOZL,dtype=str); ml=dict(zip(ml.V1,ml.V2)); _,sm=pyreadstat.read_sav(SAV,metadataonly=True)
for v in ['S6Q5','S6Q2','S6Q4','Calculated_HH_Size','S7Q11','S7Q7','S7Q8','S8Q2','S11Q2','hh_type','my_weight','S1Q2','@_parent_index']:
    vv=sm.variable_value_labels.get(v)
    V['Mozambique:'+v]={'label':ml.get(v),'cats':[[str(int(k)),l] for k,l in sorted(vv.items())][:15] if vv else [],'source':'UNHCR_MOZ_2025_PROFILING_labels_main_v2.1.csv (label); answer codes from MOZ_2025_PROFILING_ANON.sav metadata (the CSV stores labels as text)'}
K1,K2='IDPs in Camps','Non-displaced Household'; W='my_weight'
def four(name,fp):
    return [var(name+' | household, weighted my_weight',hh,fp(hh),'hh_type',W,K1,K2),var(name+' | household, unweighted',hh,fp(hh),'hh_type',None,K1,K2),
            var(name+' | person rows, weighted my_weight',m,fp(m),'hh_type',W,K1,K2),var(name+' | person rows, unweighted',m,fp(m),'hh_type',None,K1,K2)]
def add(sdg,pub,fp,vars_,num,den,vt,notes):
    f=fp(hh); rec,n=two(hh,f,'hh_type',W,K1,K2)
    rows.append({'country':'Mozambique','sdg':sdg,'published':pub,'recalc':rec,'match':match(pub,rec),'level':'household (one row per @_parent_index; the file is person-level with household answers repeated on every member row)',
      'vars':vars_,'numerator_codes':num,'denominator':den,'weight':W,'group_var':'hh_type','g1':'1 = IDPs in Camps','g2':'2 = Non-displaced Household','n':n,'file':FM,'variants_tried':vt,'notes':notes})
    A['MOZ']['ind'][sdg]=area(hh,f,'S1Q2','hh_type',W)
A['MOZ']={'area_var':'S1Q2','unit':'district','names':{},'ind':{},'notes':'Household level, weighted my_weight, n = unweighted households. Camp IDPs exist only in Mecufi and Metuge; Cidade de Pemba has none. "IDPs in HC" (IDPs in host community) cells are included for reference though not published.'}
DOC=['DUAT single / legal title','DUAT collective','Owners certificate (declaration de compra)']; CUST='Verbal/writen certificate for long-term use or lease (customary law)'
def d_ans(vals):
    def f(d):
        x=d.S6Q5.isin(vals).astype(float); x[d.S6Q5.isna()]=np.nan; return x
    return f
def d_all(vals): return lambda d:d.S6Q5.isin(vals).astype(float)
add('1.4.2',{'g1':17,'g2':58},d_ans(DOC),['S6Q5','S6Q2'],'1 DUAT single / legal title, 2 DUAT collective, 3 Owners certificate (declaration de compra)',
  'households that were asked S6Q5, i.e. owners only (S6Q2 = Own); renters and "Granted" housing are excluded',
  four('DUAT+owners certificate, owners only',d_ans(DOC))+four('DUAT+owners certificate, all households in denominator',d_all(DOC))+four('adding code 4 customary certificate, owners only',d_ans(DOC+[CUST]))+four('DUAT only (codes 1-2), owners only',d_ans(DOC[:2])),
  'Match needs the owners-only denominator: 80% of camp IDP households and 83% of non-displaced households own. With all households in the denominator the values are 13.9 / 50.2. Not the SDG 1.4.2 definition (adult population with documentation and perceived security).')
def crowd(zero):
    def f(d):
        r=d.S6Q4.astype(float); s=d.Calculated_HH_Size.astype(float)
        if zero=='one': return ((s/r.replace(0,1))>3).astype(float)
        x=((s/r.replace(0,np.nan))>3).astype(float)
        x[r==0]=np.nan if zero=='nan' else 1.0
        return x
    return f
add('11.1.1',{'g1':12,'g2':2},crowd('nan'),['Calculated_HH_Size','S6Q4'],'Calculated_HH_Size / S6Q4 > 3 (strictly more than 3 persons per room)','households with at least one room reported (S6Q4 = 0 excluded: 12 camp, 1 non-displaced household)',
  four('>3 per room, zero-room households excluded',crowd('nan'))+four('>3 per room, zero-room households counted as overcrowded',crowd('crowded'))[:2]+four('>3 per room, zero rooms treated as 1 room',crowd('one'))[:2],
  'Rooms exclude kitchen and bathroom and include the living room. Overcrowding is one component of SDG 11.1.1 (slum/inadequate housing), not the whole indicator. If zero-room households are treated as 1 room or as overcrowded, camps become 12.7 or 13.9.')
EL=['Yes, public electricity grid','Yes, generator/solar']
add('7.1.1',{'g1':37,'g2':78},lambda d:d.S7Q11.isin(EL).astype(float),['S7Q11'],'1 Yes, public electricity grid; 2 Yes, generator/solar','all households (no missing)',
  four('grid or generator/solar',lambda d:d.S7Q11.isin(EL).astype(float))+four('grid only',lambda d:d.S7Q11.isin(EL[:1]).astype(float))[:2],'')
UNIMP=['Unprotected well','River/dam/lake/ponds/stream/canal/++']
JMPI=['Public Tap/standpipe',"Piped water in neighbor's House",'Piped water in yard/plot','Piped water into inside the house','Protected well','Borehole with pump','Tanker truck/cistern water','Rainwater','Bottled water']
def basic(pred): return lambda d:(pred(d.S7Q7)&(d.S7Q8=='Less than 30 minutes')).astype(float)
b_other=basic(lambda s:~s.isin(UNIMP)); b_jmp=basic(lambda s:s.isin(JMPI))
add('6.1.1',{'g1':67,'g2':82},b_other,['S7Q7','S7Q8'],'S7Q7 anything except 6 Unprotected well and 8 River/dam/lake/ponds/stream/canal (so 96 "Other" is counted as improved) AND S7Q8 = 1 Less than 30 minutes','all households (no missing)',
  four('all sources except unprotected well and surface water (Other counted as improved) + under 30 min',b_other)+four('strict JMP improved (codes 1-5,7,9,10,11; Other not improved) + under 30 min',b_jmp)+four('strict JMP improved, no time condition',lambda d:d.S7Q7.isin(JMPI).astype(float))[:2],
  'Exact match (66.66 / 81.90) when code 96 "Other" is counted as improved on top of the JMP list (12 camp + 11 non-displaced households answer Other, before the time condition). All 128 combinations of the doubtful source codes were tested at household and person level: every combination that rounds to 67/82 adds either "Other" or surface water (or both) to the JMP list; "Other" is the plausible one, so this definition is INFERRED, not documented. Strict JMP improved gives 66.4 / 81.3 (66% / 81%), 1 point lower in each group. S7Q8 answer is "Less than 30 minutes" vs "More than 30 minutes": exactly 30 minutes cannot be separated, so "30 minutes or less" in the method text is approximate.')
SAFE=['Very safe','Fairly safe']
def safe(drop):
    def f(d):
        x=d.S8Q2.isin(SAFE).astype(float); x[d.S8Q2.isin(drop)]=np.nan; return x
    return f
add('16.1.4',{'g1':90,'g2':98},safe([]),['S8Q2'],'1 Very safe, 2 Fairly safe','all households, including "Don\'t know" and "Not applicable (never walks alone)" (2 households in the non-displaced group, none in camps)',
  four('very/fairly safe, all in denominator',safe([]))+four('excluding Don\'t know and Not applicable',safe(['Don’t know','Not applicable (never walks alone)']))[:2],
  'Question is about walking alone in the neighbourhood during the DAY and is answered once per household by the respondent; SDG 16.1.4 is about walking alone after dark, per adult.')
add('10.3.1',{'g1':6,'g2':5},lambda d:(d.S11Q2!='No').astype(float),['S11Q2'],'any "Yes" answer: 2 verbal abuse/threats/physical abuse, 3 denied services, 4 denied housing, 5 denied employment, 6 exclusion from community activities, 96 Yes, other','all households (no missing)',
  four('any yes',lambda d:(d.S11Q2!='No').astype(float)),'Asked of the respondent only ("have you personally experienced"), repeated on every member row; household-weighted and household-unweighted both round to 6/5, person-row variants do not (8/5, 8/4).')
# robustness: weight differs within 232 households (person-status based); check first vs mean weight
g=m.groupby(hid).my_weight.nunique()
A['MOZ']['notes']+=f' my_weight varies between members in {int((g>1).sum())} of {len(g)} households (it follows status_person); the first member row per household is used. Using the last row or the household mean changes values by at most a few hundredths of a point.'
json.dump({'rows':rows,'vars':V,'areas':A},open(OUT,'w'),ensure_ascii=False,indent=1)
for r in rows: print(r['country'],r['sdg'],r['published'],r['recalc'],r['match'],r['n'])
for k,a in A.items():
    for s,d in a['ind'].items(): print(k,s,d)
