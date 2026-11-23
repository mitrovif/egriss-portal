import pandas as pd, numpy as np, pyreadstat
S='<WORK>'
D=S+'/disagg/som_w1/SOM_2016_SHFS-W1_v03_M_STATA8/'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is None: return round(100*d[ind].mean(),3)
    d=d[d[w].notna()]
    return round(100*(d[ind]*d[w]).sum()/d[w].sum(),3)
s,_=pyreadstat.read_dta(D+'Output hh.dta',usecols=['ind','weight','weight_adj','weight_cons','drink_water','toilet_type','hhsize'])
tests={'toilet not in 3,4,1000 (nan improved)':(~s.toilet_type.isin([3,4,1000])).astype(float),
'toilet not in 3,4 (nan improved)':(~s.toilet_type.isin([3,4])).astype(float),
'water not in 6,8,11,13,1000 (nan improved)':(~s.drink_water.isin([6,8,11,13,1000])).astype(float),
'water not in 6,8,13,1000 (nan improved)':(~s.drink_water.isin([6,8,13,1000])).astype(float),
'water 1-5,7,9,10,12 incl':s.drink_water.isin([1,2,3,4,5,7,9,10,12]).astype(float),
'water 1-5,7,9,10,12 excl':s.drink_water.isin([1,2,3,4,5,7,9,10,12]).astype(float).where(s.drink_water.notna())}
for n,i in tests.items():
    s['i']=i
    for wn in [None,'weight','weight_adj']:
        print(n,wn,wp(s[s.ind==4],'i',wn),wp(s[s.ind!=4],'i',wn))
