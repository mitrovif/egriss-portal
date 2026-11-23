import pandas as pd, numpy as np, sys, re, zipfile, io, pyreadstat
S=sys.argv[1]; Z=sys.argv[2]; MOZ=sys.argv[3]
def pct(df,flag,g,w=None):
    d=df[flag.notna()].copy(); f=flag[flag.notna()].astype(float)
    ww=d[w].astype(float) if w else pd.Series(1.0,index=d.index)
    r=((f*ww).groupby(d[g]).sum()/ww.groupby(d[g]).sum()*100).round(2).to_dict()
    n=d.groupby(g).size().to_dict()
    return r,n
def show(name,df,flag,g,w=None,keys=None):
    r,n=pct(df,flag,g,w)
    if keys: r={k:r.get(k) for k in keys}; n={k:n.get(k) for k in keys}
    print(f'{name:60s}',list(r.values()),list(n.values()))
# ---------- CMR 2024
h=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_household_v2.1.csv',dtype=str,low_memory=False)
i=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_individual_v2.1.csv',dtype=str)
h['hhsize']=h.HOUSEHOLD_ID.map(i.groupby('HOUSEHOLD_ID').size())
h['w']=h.WEIGHT_FINAL.astype(float); h['wp']=h.w*h.hhsize
print('CMR hhsize missing',h.hhsize.isna().sum(), 'rcsi na',h.rCSI_LEVEL.isna().sum())
f=(h.rCSI_LEVEL=='3').astype(float)
K=['1','2']
print('CMR 2.1.2 published 51/32')
show('hh weighted',h,f,'HOUSEHOLD_STATUS','w',K); show('hh unweighted',h,f,'HOUSEHOLD_STATUS',None,K); show('person (w*hhsize)',h,f,'HOUSEHOLD_STATUS','wp',K)
h['hs']=h.hhsize.astype(float); show('person unweighted (hhsize)',h,f,'HOUSEHOLD_STATUS','hs',K)
f23=h.rCSI_LEVEL.isin(['2','3']).astype(float); show('level 2+3 weighted',h,f23,'HOUSEHOLD_STATUS','w',K)
print('CMR 7.1.1 published 95/93; 2024 file S11Q0 / S11Q1')
f=(h.S11Q0=='1').astype(float); show('2024 S11Q0 yes, weighted',h,f,'HOUSEHOLD_STATUS','w',K); show('2024 S11Q0 yes, unweighted',h,f,'HOUSEHOLD_STATUS',None,K)
f=(h.S11Q1=='1').astype(float); show('2024 S11Q1 ENEO, weighted',h,f,'HOUSEHOLD_STATUS','w',K)
z=zipfile.ZipFile(Z); p='CMR_PROFILING_2025_round2_anon/'
h5=pd.read_csv(io.BytesIO(z.read(p+'UNHCR_CMR_2025_PROFILING_data_household_v2.1.csv')),dtype=str,low_memory=False)
h5['g']=np.where(h5.HOUSEHOLD_STATUS_SR.str.startswith('Internally'),'1','2')
f=(h5.AEQ0=='Yes').astype(float)
show('2025 AEQ0 yes, WEIGHT_FINAL',h5,f,'g','WEIGHT_FINAL',K); show('2025 AEQ0 yes, unweighted',h5,f,'g',None,K)
h5['wp']=h5.WEIGHT_FINAL.astype(float)*h5.IGQ5.astype(float); show('2025 AEQ0 yes, weight*IGQ5',h5,f,'g','wp',K)
for c in ['LMQ0','LMQ1','LMQ2','LMQ13','AEQ1','AEQ2A']: print(c,h5[c].value_counts(dropna=False).to_dict())
print([c for c in h5.columns if 'WEIGHT' in c], h5.WEIGHT_FINAL.astype(float).describe().round(2).to_dict())
# ---------- COD
c,meta=pyreadstat.read_dta(S+'/disagg/cod/UNHCR_COD_2023_KASAI_data_household_v2.1.dta',usecols=['s06q15_WaterSource','s06q25_Toilet','s00q0_HHtype_HHH','s00q0_HHtype_RESP','s00q1_Province','s00q13_HHtype','s06q16_WaterDistance','s06q26_ToiletShare','s07q00_SizeChildren','s07q00_SizeMen','s07q00_SizeWomen'])
print(meta.variable_value_labels.get('s06q26_ToiletShare'), meta.variable_value_labels.get('s00q0_HHtype_RESP'))
K=[2.0,1.0]
def fl(s,codes): 
    x=s.isin(codes).astype(float); x[s.isna()]=np.nan; return x
print('COD 6.1.1 published 30/38 (IDP/host)')
W={'JMP improved 1-6,8,10,11,12,14':[1,2,3,4,5,6,8,10,11,12,14],'excl neighbour (4)':[1,2,3,5,6,8,10,11,12,14],'piped+borehole+prot well 1-6':[1,2,3,4,5,6],'1-6,8':[1,2,3,4,5,6,8],'1-6,10':[1,2,3,4,5,6,10],'1-5':[1,2,3,4,5],'1-6,8,10':[1,2,3,4,5,6,8,10],'1-3,5,6,10':[1,2,3,5,6,10],'8 only +5,6':[5,6,8]}
for g in ['s00q0_HHtype_HHH','s00q13_HHtype','s00q0_HHtype_RESP']:
    for k,v in W.items(): show(g+' '+k,c,fl(c.s06q15_WaterSource,v),g,None,K)
    f0=c.s06q15_WaterSource.isin(W['JMP improved 1-6,8,10,11,12,14']).astype(float); show(g+' JMP, missing in denom',c,f0,g,None,K)
print('COD 6.2.1 published 8/6')
for g in ['s00q0_HHtype_HHH','s00q13_HHtype','s00q0_HHtype_RESP']:
    for k,v in {'1-4':[1,2,3,4],'1-3':[1,2,3],'1,2,4':[1,2,4],'4':[4]}.items(): show(g+' toilet '+k,c,fl(c.s06q25_Toilet,v),g,None,K)
    f=fl(c.s06q25_Toilet,[1,2,3,4]); f[(f==1)&(c.s06q26_ToiletShare==1)]=0; show(g+' 1-4 & not shared(code1=shared?)',c,f,g,None,K)
c['hs']=c[['s07q00_SizeChildren','s07q00_SizeMen','s07q00_SizeWomen']].sum(axis=1)
print(c.hs.describe().to_dict())
show('HHH water JMP person-weighted (size)',c,fl(c.s06q15_WaterSource,W['JMP improved 1-6,8,10,11,12,14']),'s00q0_HHtype_HHH','hs',K)
show('HHH toilet 1-4 person-weighted (size)',c,fl(c.s06q25_Toilet,[1,2,3,4]),'s00q0_HHtype_HHH','hs',K)
# ---------- MOZ
m=pd.read_csv(MOZ,dtype=str,low_memory=False)
hid='@_parent_index'
chk=m.groupby(hid).agg(n=('S6Q4','size'),size=('Calculated_HH_Size','first'),wn=('my_weight','nunique'),tn=('hh_type','nunique'),q=('S7Q11','nunique'),sp=('status_person','nunique'))
print('MOZ hh',len(chk),'rows==size',(chk.n==chk['size'].astype(int)).mean(),'weight const',(chk.wn==1).mean(),'hhtype const',(chk.tn==1).mean(),'S7Q11 const',(chk.q==1).mean(), 'status_person varies',(chk.sp>1).mean())
hh=m.drop_duplicates(hid).copy()
K=['IDPs in Camps','Non-displaced Household']
def four(name,fp):
    # fp: function df->flag
    show(name+' | hh unw',hh,fp(hh),'hh_type',None,K); show(name+' | hh w',hh,fp(hh),'hh_type','my_weight',K)
    show(name+' | person unw',m,fp(m),'hh_type',None,K); show(name+' | person w',m,fp(m),'hh_type','my_weight',K)
def isin(col,vals,drop=()):
    def f(d):
        x=d[col].isin(vals).astype(float); x[d[col].isin(list(drop))]=np.nan; return x
    return f
def isin_ex(col,vals,drop=()):
    def f(d):
        x=d[col].isin(vals).astype(float); x[d[col].isna()|d[col].isin(list(drop))]=np.nan; return x
    return f
print('MOZ 1.4.2 published 17/58')
DOC=['DUAT single / legal title','DUAT collective','Owners certificate (declaration de compra)']
DOC2=DOC+['Verbal/writen certificate for long-term use or lease (customary law)']
four('DUAT+cert, all hh denom',isin('S6Q5',DOC)); four('DUAT+cert+customary, all hh',isin('S6Q5',DOC2)); four('DUAT only, all hh',isin('S6Q5',DOC[:2]))
four('DUAT+cert, answered only',isin_ex('S6Q5',DOC)); four('DUAT+cert+cust, answered only',isin_ex('S6Q5',DOC2)); four('DUAT only, answered only',isin_ex('S6Q5',DOC[:2]))
four('any but none (incl Other), all',isin('S6Q5',DOC2+['Other'])); four('any but none (incl Other), answered',isin_ex('S6Q5',DOC2+['Other']))
print(pd.crosstab(hh.S6Q2,hh.S6Q5.fillna('NA')).to_string())
print('MOZ 11.1.1 published 12/2')
def crowd(d,zero='nan',op='gt'):
    r=d.S6Q4.astype(float); s=d.Calculated_HH_Size.astype(float)
    ratio=s/r.replace(0,np.nan)
    x=(ratio>3).astype(float) if op=='gt' else (ratio>=3).astype(float)
    if zero=='nan': x[r==0]=np.nan
    elif zero=='crowded': x[r==0]=1
    elif zero=='one': x=((s/r.replace(0,1))>3).astype(float)
    return x
for zz in ['nan','crowded','one']: four('size/rooms>3 zero-rooms='+zz,lambda d,zz=zz:crowd(d,zz))
four('size/rooms>=3',lambda d:crowd(d,'nan','ge'))
print('MOZ 7.1.1 published 37/78'); four('grid or gen/solar',isin('S7Q11',['Yes, public electricity grid','Yes, generator/solar'])); four('grid only',isin('S7Q11',['Yes, public electricity grid']))
print('MOZ 6.1.1 published 67/82')
IMP=['Public Tap/standpipe',"Piped water in neighbor's House",'Piped water in yard/plot','Piped water into inside the house','Protected well','Borehole with pump','Tanker truck/cistern water','Rainwater','Bottled water']
def basic(imp):
    return lambda d:(d.S7Q7.isin(imp)&(d.S7Q8=='Less than 30 minutes')).astype(float)
four('improved(JMP incl tanker,bottled)&<30',basic(IMP)); four('improved excl tanker&<30',basic([x for x in IMP if 'Tanker' not in x])); four('improved excl tanker,bottled,rain',basic(IMP[:6]))
four('improved excl neighbour',basic([x for x in IMP if 'neighbor' not in x])); four('improved only (no time)',isin('S7Q7',IMP)); four('piped/tap only &<30',basic(IMP[:4]))
print('MOZ 16.1.4 published 90/98'); SAFE=['Very safe','Fairly safe']
four('very/fairly, all denom',isin('S8Q2',SAFE)); four('excl DK+NA',isin('S8Q2',SAFE,['Don’t know','Not applicable (never walks alone)'])); four('excl NA only',isin('S8Q2',SAFE,['Not applicable (never walks alone)']))
print(hh.S8Q2.unique())
print('MOZ 10.3.1 published 6/5'); four('any yes',lambda d:(d.S11Q2!='No').astype(float))
print(hh.groupby('hh_type').size().to_dict(), m.groupby('hh_type').size().to_dict())
