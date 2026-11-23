import pandas as pd, sys, re
pd.set_option('display.width',250); pd.set_option('display.max_colwidth',150); pd.set_option('display.max_rows',500)
MOZ=sys.argv[1]
m=pd.read_csv(MOZ,dtype=str,low_memory=False)
print(m.columns.tolist())
idc=[c for c in m.columns if re.search('id|ID',c)]
print(idc, [m[c].nunique() for c in idc])
for c in ['status_person','status_hh','hh_type','S1Q2','S1Q5','S1Q7','S6Q2','S6Q4','S6Q5','S7Q7','S7Q8','S7Q11','S8Q2','S11Q2','Calculated_HH_Size']:
    print(c, m[c].value_counts(dropna=False).to_dict())
print(m.my_weight.astype(float).describe())
