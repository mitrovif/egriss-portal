import sys, re, pyreadstat
f=sys.argv[1]; pat=sys.argv[2] if len(sys.argv)>2 else '.'
_,m=pyreadstat.read_dta(f,metadataonly=True)
print('##',f.split('/')[-1],m.number_rows,len(m.column_names))
for n,l in zip(m.column_names,m.column_labels):
    if re.search(pat,n+' '+str(l),re.I):
        vl=m.variable_value_labels.get(n)
        print(n,'|',l,'|',dict(list(vl.items())[:25]) if vl else '')
