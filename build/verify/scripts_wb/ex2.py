import pandas as pd, numpy as np, pyreadstat, itertools
S='<WORK>'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is None: return round(100*d[ind].mean(),2),len(d)
    d=d[d[w].notna()]
    return round(100*(d[ind]*d[w]).sum()/d[w].sum(),2),len(d)
k,_=pyreadstat.read_dta(S+'/disagg/ken_rhhs/hh.dta',usecols=['sample','strata','weight','hhsize','e09','e10','e11','electricity'])
k['pw']=k.weight*k.hhsize
defs={'w_jmp(5,7,9,10,11,12,13,15)':('e09',[5,7,9,10,11,12,13,15]),'w_jmp+vendor':('e09',[5,7,9,10,11,12,13,14,15]),'w_nobottle':('e09',[5,7,9,10,11,13,15]),
 's_1-5,10':('e10',[1,2,3,4,5,10]),'s_1-4,10':('e10',[1,2,3,4,10]),'s_1-5':('e10',[1,2,3,4,5]),'s_1-6,10':('e10',[1,2,3,4,5,6,10]),'s_1-4':('e10',[1,2,3,4]),
 'elec':('electricity',[1]),'e11=1':('e11',[1]),'e11 in 1,7,8,12':('e11',[1,7,8,12]),'e11 in 1,7,12':('e11',[1,7,12])}
for n,(v,c) in defs.items():
    k['i']=k[v].isin(c).astype(float).where(k[v].notna())
    for wn in [None,'weight','pw']:
        print(n,wn,'ref',wp(k[k['sample']==1],'i',wn),'host',wp(k[k['sample']==0],'i',wn),'core',wp(k[k.strata==2],'i',wn),'wider',wp(k[k.strata==3],'i',wn))
print(k.groupby('strata').weight.sum())
s,_=pyreadstat.read_dta(S+'/disagg/som_w1/SOM_2016_SHFS-W1_v03_M_STATA8/Output hh.dta',usecols=['ind','type','astrata','reg_pess','weight','weight_adj','weight_cons','weight_cons_extra','hhsize','drink_water','water','toilet_type'])
for w in ['weight','weight_adj','weight_cons']: s['p_'+w]=s[w]*s.hhsize
defs={'w_1-5,7,9,10,11,12':('drink_water',[1,2,3,4,5,7,9,10,11,12]),'w_1-5,7,9,10':('drink_water',[1,2,3,4,5,7,9,10]),'w_1-5,7,9':('drink_water',[1,2,3,4,5,7,9]),'w_1-5,7,9,10,12':('drink_water',[1,2,3,4,5,7,9,10,12]),'water1-4':('water',[1,2,3,4]),'water1-3':('water',[1,2,3]),
 't_1,2':('toilet_type',[1,2]),'t_1':('toilet_type',[1]),'t_1,2,3':('toilet_type',[1,2,3]),'t_2':('toilet_type',[2])}
for n,(v,c) in defs.items():
  for miss in ['excl','incl']:
    s['i']=s[v].isin(c).astype(float)
    if miss=='excl': s['i']=s['i'].where(s[v].notna())
    for wn in [None,'weight','weight_adj','weight_cons','p_weight','p_weight_adj','p_weight_cons']:
        print(n,miss,wn,'idp',wp(s[s.ind==4],'i',wn),'host',wp(s[s.ind!=4],'i',wn),'urb',wp(s[s.ind.isin([1,2])],'i',wn),'rur',wp(s[s.ind==3],'i',wn))
