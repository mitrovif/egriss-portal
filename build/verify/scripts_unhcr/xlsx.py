import zipfile, re, xml.etree.ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def read_xlsx(path):
    z=zipfile.ZipFile(path)
    ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%NS['m'])))
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    names=[s.get('name') for s in wb.find('m:sheets',NS)]
    out={}
    for i,n in enumerate(names):
        fn='xl/worksheets/sheet%d.xml'%(i+1)
        rows=[]
        for r in ET.fromstring(z.read(fn)).iter('{%s}row'%NS['m']):
            row={}
            for c in r.findall('m:c',NS):
                col=re.match('[A-Z]+',c.get('r')).group()
                v=c.find('m:v',NS); t=c.get('t')
                if t=='s' and v is not None: val=ss[int(v.text)]
                elif t=='inlineStr': val=''.join(x.text or '' for x in c.iter('{%s}t'%NS['m']))
                else: val=v.text if v is not None else ''
                row[col]=val
            rows.append(row)
        out[n]=rows
    return out
