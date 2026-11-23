import pandas as pd, sys, re
pd.set_option('display.width',250); pd.set_option('display.max_colwidth',150); pd.set_option('display.max_rows',500)
S=sys.argv[1]; MOZ=sys.argv[2]; MOZL=sys.argv[3]
lab=pd.read_csv(S+'/disagg/cod/UNHCR_COD_2023_KASAI_labels_household_v2.1.csv',dtype=str)
print(lab.columns.tolist(), lab.shape)
print(lab[lab.iloc[:,0].str.contains('s06q15|s06q25|s06q16|s06q17|s06q2[0-9]|HHtype|Province|eight|wgt|wt|s00q|size|nb|hhsize',case=False,na=False)].to_string())
h=pd.read_csv(S+'/disagg/cod/UNHCR_COD_2023_KASAI_data_household_v2.1.csv',dtype=str,low_memory=False)
print(h.shape)
print([c for c in h.columns if re.search('weight|wgt|pond|poids|^w_|size|taille',c,re.I)])
for c in ['s06q15_WaterSource','s06q25_Toilet','s00q0_HHtype_HHH','s00q13_HHtype','s00q1_Province']:
    print(c,h[c].value_counts(dropna=False).to_dict())
print('MOZ')
ml=pd.read_csv(MOZL,dtype=str); print(ml.columns.tolist(), ml.shape)
m=pd.read_csv(MOZ,dtype=str,low_memory=False); print(m.shape)
print([c for c in m.columns if re.search('weight|wgt|^w|size|hh_|status|S6Q|S7Q7|S7Q8|S7Q11|S8Q2|S11Q2|S1Q|room|S5Q',c,re.I)])
print(ml[ml.iloc[:,0].str.contains(r'weight|wgt|size|hh_|status|S6Q[0-9]|S7Q7|S7Q8|S7Q9|S7Q11|S8Q2|S11Q[12]|S1Q[2-5]|room|S6Q1',case=False,na=False)].to_string())
