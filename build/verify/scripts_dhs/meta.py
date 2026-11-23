import pyreadstat, sys, re
L="<DATA_LAKE>"
M=L+"/mics/LBN_Palestinians_2011/extracted/Lebanon (Palestinians)_MICS4_Datasets/Lebanon (Palestinians) MICS 2011 SPSS Datasets/"
for f,rd,pat in [(L+"/dhs/MWL_2024/MWHR81FL.dta",pyreadstat.read_dta,r"^(hv00\d|hv01[0-3]|hv02\d|hv206|shv005|shcamps|shdistrict|sh.*)$"),
          (L+"/dhs/MWL_2024/MWPR81FL.dta",pyreadstat.read_dta,r"^(hv005|shv005|sh.*|hv10[2-5]|hv12\d|hv206|hc70|hc1|hc13|hv042|hv027|hv028)$"),
          (M+"hh.sav",pyreadstat.read_sav,r"."),(M+"hl.sav",pyreadstat.read_sav,r"."),(M+"ch.sav",pyreadstat.read_sav,r"^(HH\d+|UF\d+|BR.*|AG.*|.*weight|CAGE.*|UB.*|ethn.*|wind.*|strat.*|PSU|LN|HL.*)$")]:
    _,m=rd(f,metadataonly=True)
    print("=====",f.split("/")[-1],m.number_rows,len(m.column_names))
    for c in m.column_names:
        if re.match(pat,c):
            vl=m.variable_value_labels.get(c,{})
            s=str(dict(list(vl.items())[:12])) if vl else ""
            print(c,"|",m.column_names_to_labels.get(c),"|",s[:300])
