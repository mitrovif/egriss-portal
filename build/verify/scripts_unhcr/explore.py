import pandas as pd, sys, re
S=sys.argv[1]; M=sys.argv[2]
pd.set_option('display.width',250); pd.set_option('display.max_colwidth',120); pd.set_option('display.max_rows',500)
# CMR
lab=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_labels_household_v2.1.csv',dtype=str)
print(lab.columns.tolist()); print(lab.head(5))
h=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_household_v2.1.csv',dtype=str,low_memory=False)
print(h.shape); print([c for c in h.columns if re.search('rCSI|AEQ|WEIGHT|STATUS|S1Q|wei|WGT',c,re.I)])
for c in ['rCSI_LEVEL','AEQ0','HOUSEHOLD_STATUS','S1Q1']:
    if c in h: print(c, h[c].value_counts(dropna=False).to_dict())
print(lab[lab.apply(lambda r: r.astype(str).str.contains('rCSI|AEQ0|HOUSEHOLD_STATUS|WEIGHT|S1Q1|S1Q0',regex=True).any(),axis=1)])
x=pd.read_excel(S+'/disagg/cmr/Variables_List.xlsx',sheet_name=None,dtype=str)
for k,v in x.items():
    print('SHEET',k,v.shape,v.columns.tolist())
    print(v[v.apply(lambda r: r.astype(str).str.contains('rCSI|AEQ0|HOUSEHOLD_STATUS|WEIGHT|S1Q1|S1Q0',regex=True).any(),axis=1)])
j=pd.read_csv(S+'/disagg/cmr_jmr/CMR_JMR_data.csv',dtype=str,nrows=5,low_memory=False)
print('JMR',j.shape,[c for c in j.columns][:60])
print([c for c in j.columns if re.search('rCSI|AEQ|WEIGHT|STATUS|wei',c,re.I)])
