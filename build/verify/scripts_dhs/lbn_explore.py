import pyreadstat, pandas as pd, numpy as np
L="<DATA_LAKE>"
M=L+"/mics/LBN_Palestinians_2011/extracted/Lebanon (Palestinians)_MICS4_Datasets/Lebanon (Palestinians) MICS 2011 SPSS Datasets/"
def wm(x,w): return round(100*np.average(x,weights=w),2)
hh,m=pyreadstat.read_sav(M+"hh.sav",usecols=["HH1","HH2","HH7","HH9","HH11","WS1","WS2","WS8","WS9","HC2","HC8A","hhweight","HH14","HH15"])
print("weight>0 by HH9",pd.crosstab(hh.HH9,hh.hhweight>0))
c=hh[hh.HH9==1].copy(); c["one"]=1.0; c["pw"]=c.hhweight*c.HH11; c["pn"]=c.HH11
W=["one","hhweight","pn","pw"]
def rep(name,x,d=None):
    d=c if d is None else d
    x=x.loc[d.index].astype(float)
    print(name,"n=",len(d),{w:wm(x,d[w]) for w in W})
imp={11,12,13,14,21,31,41,51}
rep("6.1.1 A piped/protected only",c.WS1.isin(imp))
rep("6.1.1 +bottled any",c.WS1.isin(imp|{91}))
rep("6.1.1 +bottled if WS2 improved",c.WS1.isin(imp)|((c.WS1==91)&c.WS2.isin(imp)))
rep("6.1.1 +bottled+tanker+cart",c.WS1.isin(imp|{91,61,71}))
rep("6.1.1 all but 32,42,81,96,99",~c.WS1.isin([32,42,81,96,99]))
rep("6.1.1 WS1 notna",c.WS1.notna())
rep("6.1.1 code<=91",c.WS1<=91)
si={11,12,13,15,21,22}
rep("6.2.1 improved(11,12,13,15,21,22)&WS9==2",c.WS8.isin(si)&(c.WS9==2))
rep("6.2.1 improved +14 &WS9==2",c.WS8.isin(si|{14})&(c.WS9==2))
rep("6.2.1 improved & WS9!=1",c.WS8.isin(si)&(c.WS9!=1))
rep("6.2.1 improved only",c.WS8.isin(si))
rep("6.2.1 flush 11-15 & WS9==2",c.WS8.between(11,15)&(c.WS9==2))
d=c[~c.WS8.isin([99])]; rep("6.2.1 improved&WS9==2 excl WS8 missing",c.WS8.isin(si)&(c.WS9==2),d)
rep("7.1.1 HC8A==1",c.HC8A==1)
ok=c[c.HC2!=99]
r=c.HH11/c.HC2.where(c.HC2!=99)
rep("11.1.1 >3 excl HC2 missing",r>3,ok); rep("11.1.1 >3 missing in denom(as not)",r>3); rep("11.1.1 >=3 excl missing",r>=3,ok)
rep("11.1.1 >3 treating 99 as value",(c.HH11/c.HC2)>3)
hl,_=pyreadstat.read_sav(M+"hl.sav",usecols=["HH1","HH2","HL1","HL6","ED3","ED5","HH7","hhweight","schage"])
print("hl n",len(hl),"sum HH11",c.HH11.sum())
hl["one"]=1.0
def rp(name,x,d):
    print(name,"n=",len(d),{w:wm(x.loc[d.index].astype(float),d[w]) for w in ["one","hhweight"]})
k=hl[hl.HL6.between(6,17)]
print(pd.crosstab(k.ED3.fillna(-1),k.ED5.fillna(-1)))
rp("4.1.2 ED5==1 /all 6-17",hl.ED5==1,k)
rp("4.1.2 ED5==1 /ED5 notna",hl.ED5==1,k[k.ED5.notna()])
rp("4.1.2 ED5==1 /ED5 in 1,2",hl.ED5==1,k[k.ED5.isin([1,2])])
rp("4.1.2 ED5==1 /excl ED3,ED5 missing(9)",hl.ED5==1,k[(k.ED3!=9)&(k.ED5!=9)])
k2=hl[hl.schage.between(6,17)]; rp("4.1.2 schage 6-17 /all",hl.ED5==1,k2)
k3=hl[hl.HL6.between(5,17)]; rp("4.1.2 5-17",hl.ED5==1,k3)
ch,_=pyreadstat.read_sav(M+"ch.sav",usecols=["HH1","HH2","LN","UF9","AG2","BR1","BR2","HH7","chweight","CAGE"])
ch["one"]=1.0; ch["hhweight"]=ch.chweight
print("chw>0 by UF9",pd.crosstab(ch.UF9,ch.chweight>0))
cc=ch[ch.UF9==1]
reg=ch.BR1.isin([1,2])|(ch.BR2==1)
rp("16.9.1 BR1 1,2 or BR2==1 /completed",reg,cc)
rp("16.9.1 BR1 1,2 only",ch.BR1.isin([1,2]),cc)
rp("16.9.1 /all rows",reg,ch)
rp("16.9.1 excl missing",reg,cc[ch.BR1.notna()])
print(cc.BR1.value_counts(dropna=False).to_dict())
