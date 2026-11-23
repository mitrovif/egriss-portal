import pandas as pd, numpy as np, pyreadstat
S='<WORK>'
D=S+'/disagg/som_w1/SOM_2016_SHFS-W1_v03_M_STATA8/'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is None: return round(100*d[ind].mean(),2)
    d=d[d[w].notna()]
    return round(100*(d[ind]*d[w]).sum()/d[w].sum(),2)
s,_=pyreadstat.read_dta(D+'Input hh.dta',usecols=['type','weight','weight_adj','weight_cons','drink_water','toilet_type'])
print(pd.crosstab(s.toilet_type.astype(str),s.type)); print(pd.crosstab(s.drink_water.astype(str),s.type))
for v,c in [('toilet_type',[1,2]),('toilet_type',[1,2,1000]),('drink_water',[1,2,3,4,5,7,9,10,12]),('drink_water',[1,2,3,4,5,7,9,10,11,12])]:
  for miss in (0,1):
    s['i']=s[v].isin(c).astype(float)
    if not miss: s['i']=s['i'].where(s[v].notna())
    for wn in [None,'weight','weight_adj','weight_cons']:
        print('INPUT',v,c,'incl' if miss else 'excl',wn,'idp',wp(s[s.type==3],'i',wn),'host',wp(s[s.type!=3],'i',wn),'all',wp(s,'i',wn))
