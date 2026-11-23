import pandas as pd, sys, re, zipfile, io, pyreadstat
pd.set_option('display.width',250); pd.set_option('display.max_colwidth',200); pd.set_option('display.max_rows',500)
S=sys.argv[1]; Z=sys.argv[2]
df,meta=pyreadstat.read_dta(S+'/disagg/cod/UNHCR_COD_2023_KASAI_data_household_v2.1.dta',usecols=['s06q15_WaterSource','s06q25_Toilet','s00q0_HHtype_HHH','s00q1_Province','s00q13_HHtype','s06q16_WaterDistance'])
for v in df.columns:
    print(v,'|',meta.column_names_to_labels.get(v),'|',meta.variable_value_labels.get(v))
    print(df[v].value_counts(dropna=False).sort_index().to_dict() if v!='s06q16_WaterDistance' else df[v].describe().to_dict())
_,m2=pyreadstat.read_dta(S+'/disagg/cod/UNHCR_COD_2023_KASAI_data_household_v2.1.dta',metadataonly=True)
print([c for c in m2.column_names if re.search('weight|wgt|pond|poids|wt$|^w_|strat|psu|cluster',c,re.I)])
z=zipfile.ZipFile(Z)
p='CMR_PROFILING_2025_round2_anon/'
lab=pd.read_csv(io.BytesIO(z.read(p+'UNHCR_CMR_2025_PROFILING_labels_household_v2.1.csv')),dtype=str)
print(lab.to_string()[:6000])
h=pd.read_csv(io.BytesIO(z.read(p+'UNHCR_CMR_2025_PROFILING_data_household_v2.1.csv')),dtype=str,low_memory=False)
print(h.shape, h.columns.tolist()[:40])
for c in ['AEQ0','HOUSEHOLD_STATUS_SR','HOUSEHOLD_STATUS','S1Q0','S1Q1','S1Q2','PERIOD','AEQ1']:
    if c in h: print(c,h[c].value_counts(dropna=False).to_dict())
import tempfile,os
