import pandas as pd, numpy as np, pyreadstat
S='<WORK>'
def wp(d,ind,w=None):
    d=d[d[ind].notna()]
    if w is None: return round(100*d[ind].mean(),2),len(d)
    d=d[d[w].notna()]
    return round(100*(d[ind]*d[w]).sum()/d[w].sum(),2),len(d)
# Ecuador
for w,v in [(1,'u04_01'),(2,'v04_01'),(3,'w04_01'),(4,'v04_01')]:
    d,_=pyreadstat.read_dta(f'{S}/disagg/ecu_ven/593_ph2w{w}_venezcasos_library.dta')
    d['i']=(d[v]==1).astype(float).where(d[v].notna()); d['j']=(d[v]==1).astype(float)
    print('ECU w',w,v,d[v].value_counts(dropna=False).to_dict(),'unw excl',wp(d,'i'),'unw incl',wp(d,'j'),'w_hh',wp(d,'i',f'w_hh_ph2w{w}'),'w_ind',wp(d,'i',f'w_ind_ph2w{w}'), d.venez.value_counts(dropna=False).to_dict())
# Bangladesh
b,m=pyreadstat.read_dta(S+'/disagg/bgd_cbps2/cbps_tracking_r3_basic needs.dta')
print([c for c in b.columns][:40])
print(pd.crosstab(b.fs_fewer_meals_r3.astype(str),b.settlement_type,dropna=False))
print(pd.crosstab(b.upazila.astype(str),b.settlement_type,dropna=False)); print(pd.crosstab(b.camp_upazila.astype(str),b.settlement_type,dropna=False))
print(b.groupby('settlement_type').hh_weight_r3.agg(['count','sum','min','max']))
for name,i in {'==1 excl nan&-97':(b.fs_fewer_meals_r3==1).astype(float).where(b.fs_fewer_meals_r3.isin([0,1])),'==1 excl nan':(b.fs_fewer_meals_r3==1).astype(float).where(b.fs_fewer_meals_r3.notna()),'==1 incl':(b.fs_fewer_meals_r3==1).astype(float)}.items():
    b['i']=i
    for wn in [None,'hh_weight_r3']:
        print('BGD',name,wn,'camp',wp(b[b.settlement_type==2],'i',wn),'host',wp(b[b.settlement_type==1],'i',wn),'hi',wp(b[b.stratum==1],'i',wn),'lo',wp(b[b.stratum==2],'i',wn),'campstr',wp(b[b.stratum==3],'i',wn))
# Nigeria
n,_=pyreadstat.read_dta(S+'/disagg/nga_idp/Stata/1_cleanoutput/hhm.dta',usecols=['region','migr_idp','weight','B_1_1_hhm_age','B_4_3_hhm_edu_current'])
print(n.dtypes, n.region.value_counts(dropna=False).to_dict(), n.weight.isna().sum())
a=n[n.B_1_1_hhm_age.between(6,17)]
print(pd.crosstab(a.B_4_3_hhm_edu_current.astype(str),a.migr_idp,dropna=False))
for lo,hi in [(6,17),(5,17),(6,18),(6,14)]:
    a=n[n.B_1_1_hhm_age.between(lo,hi)].copy()
    for name,i in {'excl':(a.B_4_3_hhm_edu_current==1).astype(float).where(a.B_4_3_hhm_edu_current.notna()),'incl':(a.B_4_3_hhm_edu_current==1).astype(float)}.items():
        a['i']=i
        for wn in [None,'weight']:
            print('NGA',lo,hi,name,wn,'idp',wp(a[a.migr_idp==1],'i',wn),'host',wp(a[a.migr_idp==0],'i',wn))
