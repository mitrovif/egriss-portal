import pandas as pd, numpy as np, pyreadstat, itertools
S='<WORK>'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is None: return round(100*d[ind].mean(),3)
    d=d[d[w].notna()]
    return round(100*(d[ind]*d[w]).sum()/d[w].sum(),3)
k,_=pyreadstat.read_dta(S+'/disagg/ken_rhhs/hh.dta',usecols=['sample','strata','weight','hhsize','e09','e10','e11','electricity'])
k['i']=k.e10.isin([1,2,3,4,5,10]).astype(float)
print('ken san',wp(k[k['sample']==1],'i','weight'),wp(k[k['sample']==0],'i','weight'))
s,_=pyreadstat.read_dta(S+'/disagg/som_w1/SOM_2016_SHFS-W1_v03_M_STATA8/Output hh.dta',usecols=['ind','type','astrata','reg_pess','weight','weight_adj','weight_cons','weight_cons_extra','hhsize','drink_water','water','toilet_type'])
for w in ['weight','weight_adj']: s['p_'+w]=s[w]*s.hhsize
for name,f in {'1,2 excl':lambda x: x.isin([1,2]).astype(float).where(x.notna()),'1,2 incl':lambda x: x.isin([1,2]).astype(float),
  '1,2,1000 excl':lambda x: x.isin([1,2,1000]).astype(float).where(x.notna()),'1,2,1000 incl':lambda x: x.isin([1,2,1000]).astype(float),
  'not 3,4 (nan=improved)':lambda x: (~x.isin([3,4])).astype(float), 'not 4':lambda x: (~x.isin([4])).astype(float).where(x.notna()),
  '1,2 excl other':lambda x: x.isin([1,2]).astype(float).where(x.notna()&(x!=1000))}.items():
    s['i']=f(s.toilet_type)
    for wn in [None,'weight','weight_adj','p_weight','weight_cons_extra']:
        print(name,wn,'idp',wp(s[s.ind==4],'i',wn),'host',wp(s[s.ind!=4],'i',wn),'u',wp(s[s.ind.isin([1,2])],'i',wn),'r',wp(s[s.ind==3],'i',wn), 'ou+r',wp(s[s.ind.isin([2,3])],'i',wn))
