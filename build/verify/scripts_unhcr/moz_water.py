import pandas as pd, numpy as np, sys, itertools, pyreadstat
MOZ=sys.argv[1]; SAV=sys.argv[2]
m=pd.read_csv(MOZ,dtype=str,low_memory=False); hid='@_parent_index'
m['w']=m.my_weight.astype(float)
K=['IDPs in Camps','Non-displaced Household']
hh_first=m.drop_duplicates(hid); hh_last=m.drop_duplicates(hid,keep='last')
hh_mean=hh_first.copy(); hh_mean['w']=hh_mean[hid].map(m.groupby(hid).w.mean())
frames={'hh_first_w':(hh_first,True),'hh_last_w':(hh_last,True),'hh_mean_w':(hh_mean,True),'hh_unw':(hh_first,False),'person_w':(m,True),'person_unw':(m,False)}
src=sorted(m.S7Q7.unique())
core=['Public Tap/standpipe','Piped water in yard/plot','Piped water into inside the house','Protected well','Borehole with pump']
opt=[s for s in src if s not in core]
print(opt)
def val(d,wt,flag):
    w=d.w if wt else pd.Series(1.0,index=d.index)
    r=(flag*w).groupby(d.hh_type).sum()/w.groupby(d.hh_type).sum()*100
    return r[K[0]],r[K[1]]
hits=[]
for k in range(len(opt)+1):
    for extra in itertools.combinations(opt,k):
        imp=core+list(extra)
        for tname in ['lt30','none']:
            for fn,(d,wt) in frames.items():
                f=d.S7Q7.isin(imp)
                if tname=='lt30': f=f&(d.S7Q8=='Less than 30 minutes')
                a,b=val(d,wt,f.astype(float))
                if round(a)==67 and round(b)==82: hits.append((fn,tname,extra,round(a,2),round(b,2)))
for h in hits: print(h)
print(len(hits))
# weight within-hh variation
g=m.groupby(hid).w.agg(['min','max']); print('hh with varying weight',(g['min']!=g['max']).sum())
print(pd.crosstab(m.status_person,m.hh_type).to_string()); print(m.groupby(['hh_type','status_person']).w.agg(['min','max','mean']).round(3).to_string())
print(pd.crosstab(hh_first.S7Q7,hh_first.hh_type).to_string())
df,meta=pyreadstat.read_sav(SAV,metadataonly=True)
print('SAV',meta.number_rows,meta.number_columns)
for v in ['my_weight','status_person','status_hh','hh_type','S1Q2','S1Q5','Calculated_HH_Size','S6Q2','S6Q4','S6Q5','S7Q7','S7Q8','S7Q11','S8Q2','S11Q2']:
    print(v,'|',meta.column_names_to_labels.get(v),'|',meta.variable_value_labels.get(v))
print([c for c in meta.column_names if c not in m.columns], [c for c in m.columns if c not in meta.column_names])
