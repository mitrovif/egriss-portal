import pandas as pd, sys, re
sys.path.insert(0,sys.argv[1]+'/verify/scripts_unhcr')
from xlsx import read_xlsx
S=sys.argv[1]
x=read_xlsx(S+'/disagg/cmr/Variables_List.xlsx')
for k,rows in x.items():
    print('SHEET',k,len(rows)); 
    for r in rows[:6]: print(r)
    for r in rows:
        if re.search('rCSI|AEQ|HOUSEHOLD_STATUS|WEIGHT|S1Q1|S1Q0|S1Q2|lectri|CM008',' '.join(r.values())): print('  >>',r)
i=pd.read_csv(S+'/disagg/cmr/UNHCR_CMR_2024_PROFILING_data_individual_v2.1.csv',dtype=str,nrows=5)
print('IND',i.columns.tolist())
j=pd.read_csv(S+'/disagg/cmr_jmr/CMR_JMR_data.csv',dtype=str,low_memory=False)
print('JMR',j.shape,j.columns.tolist()[:80])
print([c for c in j.columns if re.search('rCSI|AEQ|WEIGHT|STATUS|wei|admin|region|pop|group|strat',c,re.I)])
