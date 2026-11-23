import pyreadstat, pandas as pd, numpy as np
L="<DATA_LAKE>"
M=L+"/mics/LBN_Palestinians_2011/extracted/Lebanon (Palestinians)_MICS4_Datasets/Lebanon (Palestinians) MICS 2011 SPSS Datasets/"
def wm(x,w):
    return round(100*np.average(x,weights=w),2) if len(x) and w.sum()>0 else None
hr,_=pyreadstat.read_dta(L+"/dhs/MWL_2024/MWHR81FL.dta",usecols=["hv001","hv002","hv005","shv005","shcamps","shdistrict","hv206","hv012","hv013","hv009","hv025"])
print(pd.crosstab(hr.shcamps,hr.shdistrict.isin([12])), hr.hv206.value_counts(dropna=False).to_dict())
print(hr.groupby("shcamps")[["hv005","shv005"]].agg(["sum","min","max","count"]).T)
print(hr[hr.shdistrict.isin([11,12])].groupby("shdistrict")[["hv005","shv005"]].agg(["sum","min","max"]).T)
print(pd.crosstab(hr.shdistrict[hr.shdistrict.isin([11,12])],hr.hv025))
hr["mix"]=np.where(hr.shcamps==1,hr.shv005,hr.hv005); hr["one"]=1.0
def rep(df,ind,name,ws=("one","hv005","shv005","mix")):
    for g,lab in [(df.shcamps==1,"camp"),(df.shcamps==0,"noncamp"),(df.shdistrict==11,"dowa_out"),(df.shdistrict==12,"dowa_camp")]:
        d=df[g]; print(name,lab,"n=",len(d),{w:wm(d[ind],d[w]) for w in ws})
hr["e"]=(hr.hv206==1).astype(float)
rep(hr,"e","7.1.1 HH")
for k in ["hv012","hv013","hv009"]:
    for w in ["hv005","shv005","mix","one"]: hr[w+k]=hr[w]*hr[k]
    rep(hr,"e","7.1.1 HHx"+k,ws=[w+k for w in ["one","hv005","shv005","mix"]])
pr,_=pyreadstat.read_dta(L+"/dhs/MWL_2024/MWPR81FL.dta",usecols=["hv001","hv002","hv005","shv005","shcamps","shdistrict","hv206","hv102","hv103","hv105","hv121","hc70","hc1","hc13","hv120"])
pr["mix"]=np.where(pr.shcamps==1,pr.shv005,pr.hv005); pr["one"]=1.0
pr["e"]=(pr.hv206==1).astype(float)
rep(pr,"e","7.1.1 PR all"); rep(pr[pr.hv102==1],"e","7.1.1 PR dejure"); rep(pr[pr.hv103==1],"e","7.1.1 PR defacto")
k=pr[pr.hv105.between(6,17)].copy()
print(k.hv121.value_counts(dropna=False).to_dict())
k["a"]=(k.hv121>0).astype(float); k["a1"]=(k.hv121==1).astype(float)
for nm,d in [("all",k),("dejure",k[k.hv102==1]),("defacto",k[k.hv103==1]),("nonmiss",k[k.hv121.notna()&(k.hv121<8)])]:
    rep(d,"a","4.1.2 >0 "+nm); rep(d,"a1","4.1.2 ==1 "+nm)
print(pr.hc70.notna().sum(), pr.hc13.value_counts(dropna=False).to_dict(), (pr.hc70>=9990).sum())
c=pr[pr.hc70.notna()&(pr.hc70<9990)].copy(); c["s"]=(c.hc70<-200).astype(float)
rep(c,"s","2.2.1 valid all"); rep(c[c.hv103==1],"s","2.2.1 valid defacto"); rep(c[c.hv102==1],"s","2.2.1 valid dejure")
c2=pr[pr.hc70.notna()].copy(); c2["s"]=(c2.hc70<-200).astype(float); rep(c2,"s","2.2.1 nonNA incl flagged")
c3=pr[pr.hc13==0].copy(); c3["s"]=(c3.hc70<-200).astype(float); rep(c3,"s","2.2.1 hc13==0 incl flagged")
# MICS
hh,m=pyreadstat.read_sav(M+"hh.sav")
for v in ["WS1","WS2","WS8","WS9","WS10","WS11","HC2","HC8A","HH9"]:
    print(v,m.column_names_to_labels.get(v),m.variable_value_labels.get(v)); print("  ",hh[v].value_counts(dropna=False).sort_index().to_dict())
print([c for c in hh.columns]); print(hh.hhweight.describe(), hh.HH11.describe())
hl,m2=pyreadstat.read_sav(M+"hl.sav"); print(list(hl.columns)); print(hl.hhweight.isna().sum(), hl.ED5.value_counts(dropna=False).to_dict(), hl.HL6.between(6,17).sum())
ch,m3=pyreadstat.read_sav(M+"ch.sav",usecols=["HH1","HH2","LN","UF9","AG2","BR1","BR2","HH7","chweight","CAGE"])
print(ch.UF9.value_counts(dropna=False).to_dict(), pd.crosstab(ch.BR1.fillna(-1),ch.BR2.fillna(-1)), ch.chweight.describe(), ch.AG2.value_counts(dropna=False).to_dict())
