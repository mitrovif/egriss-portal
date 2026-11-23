import pandas as pd, sys, re, numpy as np
sys.path.insert(0,sys.argv[1]+'/verify/scripts_unhcr')
from xlsx import read_xlsx
S=sys.argv[1]
x=read_xlsx(S+'/disagg/cmr/Variables_List.xlsx')
cur=None
for r in x['Households_File_Var_Values'][1:]:
    if r.get('A'): cur=r['A']
    if cur in ('HOUSEHOLD_STATUS','rCSI_LEVEL','rCSI','S11Q0','S11Q1','S11Q2','S11Q3'): print(cur,r.get('B'),'|',r.get('C'))
for r in x['Households_File_Var_List']:
    if re.match('S11Q|S10Q|WEIGHT',r.get('B','')): print(r.get('B'),'|',r.get('C'))
h=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_household_v2.1.csv',dtype=str,low_memory=False)
h['w']=h.WEIGHT_FINAL.astype(float)
print(h.w.describe())
for c in [c for c in h.columns if c.startswith('S11Q')]: print(c,h[c].value_counts(dropna=False).to_dict())
i=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_individual_v2.1.csv',dtype=str)
print(i.shape, i.groupby('HOUSEHOLD_ID').WEIGHT_FINAL.nunique().max(), i.PERSON_STATUS.value_counts(dropna=False).to_dict(), i.HOUSEHOLD_STATUS.value_counts().to_dict())
