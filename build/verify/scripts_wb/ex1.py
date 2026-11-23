import pandas as pd, numpy as np, pyreadstat
S='<WORK>'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is None: return round(100*d[ind].mean(),2),len(d)
    d=d[d[w].notna()]
    return round(100*(d[ind]*d[w]).sum()/d[w].sum(),2),len(d)
k,_=pyreadstat.read_dta(S+'/disagg/ken_rhhs/hh.dta',usecols=['sample','strata','weight','hhsize','e09','e10','e11','electricity'],user_missing=True)
print(k.dtypes)
for v in ['e09','e10','e11','electricity']:
    print(pd.crosstab(k[v].astype(str),k['sample'],dropna=False))
print(k.weight.describe(), k.hhsize.describe())
s,_=pyreadstat.read_dta(S+'/disagg/som_w1/SOM_2016_SHFS-W1_v03_M_STATA8/Output hh.dta',usecols=['ind','type','astrata','reg_pess','weight','weight_adj','weight_cons','weight_cons_extra','hhsize','drink_water','water','toilet_type','toilet_type_spec','drink_water_spec'])
for v in ['drink_water','water','toilet_type','type']:
    print(pd.crosstab(s[v].astype(str),s['ind'],dropna=False))
print(s[['weight','weight_adj','weight_cons','weight_cons_extra','hhsize']].describe())
print(s.groupby('ind')[['weight','weight_adj','weight_cons']].agg(['count','sum']))
