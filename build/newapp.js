/* ---- verified definitions: every value recalculated from the survey file ---- */
const VST={ok:['ok','Checked','The recalculation from the survey file gives the published value.'],near:['tbc','Within 1 point','The recalculation is within one percentage point of the published value.'],
  diff:['flag','Not reproduced','The recalculation does not give the published value.'],fix:['flag','Corrected','The published value does not follow the definition. The value shown is the recalculation.'],
  new:['new','New','Not in the published values file.'],none:['tbc','Not recalculated','The survey file was not available for a recalculation.']};
const p1=v=>v==null?'':(Math.round(v*10)/10)+'%';
function verLine(r){
  const v=r.v||{st:'none'}, S=VST[v.st], two=r.h!=null||(v.rc&&v.rc[1]!=null);
  if(v.st==='none') return `<div class="fl"><i class="pill ${S[0]}">${S[1]}</i><span>${S[2]}</span></div>`;
  const rc=`${p1(v.rc[0])}${two&&v.rc[1]!=null?' and '+p1(v.rc[1]):''}`, pub=v.pub&&v.pub[0]!=null?`${v.pub[0]}%${v.pub[1]!=null?' and '+v.pub[1]+'%':''}`:'';
  const n=v.n&&v.n[0]?` Records: ${fmt(v.n[0])}${v.n[1]?' and '+fmt(v.n[1]):''}.`:'';
  const third=v.third?Object.entries(v.third).map(([k,x])=>` ${esc(k)}: ${p1(x[0])} (${fmt(x[1])} records).`).join(''):'';
  return `<div class="fl"><i class="pill ${S[0]}" tabindex="0" ${tipA(S[1],S[2])}>${S[1]}</i><span>Recalculated from the file: <b style="color:var(--ink)">${rc}</b>${pub?` · published: ${pub}`:''}.${n}${third}</span></div>
    ${v.note?`<div class="fl"><i class="pill ${v.st==='fix'?'flag':'plain'}">${v.st==='fix'?'Why':'Note'}</i><span>${esc(v.note)}</span></div>`:''}`;
}
function howRows(r){
  const vars=vs=>vs.map(v=>vchip(r.country,v)).join('');
  const wv=r.w&&r.w!=='weighted'&&r.w!=='unweighted'&&!/ /.test(r.w);
  return `<div class="howr"><span class="hk">Asked</span><div class="hv"><span>${esc(r.what)}</span><div class="vars">${r.vars.length?vars(r.vars):'<span class="lnote">variable not named</span>'}</div></div></div>
    <div class="howr"><span class="hk">Counted</span><div class="hv"><span>${esc(r.rule)}</span></div></div>
    ${r.den?`<div class="howr"><span class="hk">Among</span><div class="hv"><span>${esc(r.den)}${r.lvl?` <span class="lnote">· unit: ${esc(r.lvl.toLowerCase())}</span>`:''}</span></div></div>`:''}
    <div class="howr"><span class="hk">Groups</span><div class="hv">${r.gv?`<div class="vars">${vars([r.gv])}</div>`:'<span>Whole sample</span>'}${r.gc?`<span>${esc(r.gc.filter(Boolean).join(' · '))}</span>`:''}</div></div>
    <div class="howr"><span class="hk">Weight</span><div class="hv">${r.w==='unweighted'?'<span><i class="pill flag">Unweighted</i></span>':wv?`<div class="vars">${vars([r.w])}</div>`:r.w==='weighted'?'<span>Weighted <span class="lnote">(variable not recorded)</span></span>':`<span>${esc(r.w||'')}</span>`}</div></div>
    ${r.file?`<div class="howr"><span class="hk">File</span><div class="hv"><span style="font:400 12.5px var(--mono);color:var(--soft);overflow-wrap:anywhere">${esc(r.file)}</span></div></div>`:''}`;
}
function scriptBox(r){
  const k=r.v&&r.v.script; if(k!=='fds'||!Q.script.fds) return k?`<p class="lnote">Recalculated in the survey file with a script kept with the Secretariat's working files. It is not shown here yet.</p>`:'';
  return `<details class="full"><summary>The script that gives these values</summary><div><pre class="syn">${esc(Q.script.fds)}</pre><p class="lnote">This is the script that was run on the three Forced Displacement Survey files. It replaces the earlier reconstruction. It reads the licensed files from a local folder and writes percentages only.</p></div></details>`;
}
function howBand(r,d){
  return `<div class="band"><div class="lhead"><h3>How this survey measured it</h3></div><div class="how">${howRows(r)}</div>${verLine(r)}
    <p class="lnote">Point at a variable name to see the question as asked and its answer codes.</p>${scriptBox(r)}</div>`;
}
const tabOf=(iso,ind,r)=>Q.sub.tab&&Q.sub.tab[iso]&&Q.sub.tab[iso].ind[ind]&&!(iso==='NGA'&&!/Nigeria IDP/.test(r.src));
function tabTable(iso,ind){
  const T=Q.sub.tab[iso], V=T.ind[ind], areas=[...new Set(Object.keys(V).map(k=>k.split('|')[0]))], gs=[...new Set(Object.keys(V).map(k=>k.split('|')[1]))];
  const td=c=>c?`<td><span class="v">${Math.round(c[0])}%</span> <span class="n">n=${fmt(c[1])}</span>${c[1]<50?' <i class="pill tbc">small</i>':''}</td>`:'<td><span class="n">not sampled</span></td>';
  return `<div class="tw"><table class="snt"><tr><th>${esc(T.unit)}</th>${gs.map(g=>`<th>${esc(g)}</th>`).join('')}</tr>${areas.map(a=>`<tr><td>${esc(T.names[a]||a)}</td>${gs.map(g=>td(V[a+'|'+g])).join('')}</tr>`).join('')}</table></div>`;
}
function renderSdg(){
  $('indchips').innerHTML = Q.sdg.map(d=>`<button class="chip gch" type="button" aria-pressed="${d.c===curInd}" data-c="${d.c}" style="--gc:${gcolOf(d.c)}">${gicon(d.c)}${d.c}${d.pri?' ◆':''} · ${esc(d.n)}</button>`).join('');
  $('indchips').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{curInd=b.dataset.c;renderSdg()});
  const d = Q.sdg.find(x=>x.c===curInd), nOk=d.rows.filter(r=>r.v&&(r.v.st==='ok'||r.v.st==='near')).length;
  $('sdghead').innerHTML = `<div class="eqcard" style="border-top:4px solid ${gcolOf(d.c)}">
    <div style="display:flex;gap:14px;align-items:center">${goalTile(d.c,d.pri,true)}<div><p class="eyebrow">SDG ${d.c}${d.pri?' · ◆ EGRISS priority':' · supplementary'}</p><h2 style="font-size:22px;margin-top:6px">${esc(d.n)}</h2></div></div>
    <div class="eq"><div class="fracv"><div class="n"><small>Numerator</small>${esc(d.num)}</div><div class="d"><small>Denominator</small>${esc(d.den)}</div></div><span class="eqop">× 100</span></div>
    <div class="fl"><i class="pill plain">Official</i><span>${esc(d.offt)}.</span></div>
    ${d.off?`<div class="fl"><i class="pill flag">Check</i><span>${esc(d.off)}</span></div>`:''}
  </div>`;
  $('svtitle').textContent = d.rows.length ? `How each survey measured it · ${d.rows.length} ${d.rows.length===1?'survey':'surveys'} · ${nOk} reproduced from the file` : 'No survey has a calculated value yet';
  const bar=(lab,v,cls)=>`<div class="svbar"><span>${esc(lab)}</span><div class="track"><div class="fill ${cls}" style="width:${v}%"></div></div><span class="bv">${v}%</span></div>`;
  $('svlist').innerHTML = d.rows.map(r=>`<article class="svc sg ${r.old?'old':''}" style="--gc:${gcolOf(d.c)}">
    <div class="svh"><b>${esc(r.country)}${r.year?' · '+esc(r.year):''}</b><span>${esc(r.fam)}</span></div>
    <div class="svr">${bar(r.g1,r.r,'r')}${r.h!=null?bar(r.g2||'Host',r.h,'h'):`<span class="lnote">No comparison group in this survey</span>`}</div>
    <div class="how">${howRows(r)}</div>${verLine(r)}
    ${r.old?`<div class="fl"><i class="pill plain">Before 2018</i><span>Outside the map's time scope.</span></div>`:''}
  </article>`).join('');
  const fd=$('fulldet'); if(fd) fd.hidden=true;
}

/* ===== v11: one fixed start (globe or flat map, then the country map), three layers beside it, Datasets as a side drawer ===== */
const LAYER={
 gain:{n:'GAIN',col:'#4cc3c9',sub:'Examples, countries, populations',live:'https://mitrovif.github.io/GAIN-story/',t:'Where countries and institutions reported implementing the recommendations, 2021 to 2025. The country map with camps and IDP populations is its page.'},
 sdg:{n:'SDG',col:'#7aa7e6',sub:'Indicator values and how each was calculated',live:'https://mitrovif.github.io/gain_sdg_workstream/globe.html',t:'Where an SDG value exists for refugees, IDPs or stateless people, how each survey produced it, and who was counted.'},
 idq:{n:'ID Questions',col:'#e0a93b',sub:'How refugees and IDPs are identified',live:'https://mitrovif.github.io/idq-map/map.html',t:'Where a questionnaire has been mapped against the EGRISS identification module, and which values were produced with those questions.'}};
const LK=Object.keys(LAYER);
const CZ=['','Armed conflict or war','Widespread violence','Discrimination or persecution','Rights violations by authorities','Other threats of violence','Natural disasters','Man-made events','A different threat'];
const SNN={'6.1.1':'Improved drinking water source','6.2.1':'Improved sanitation facility','7.1.1':'Access to electricity','2.1.2':'Food insecurity (Food Consumption Score of 35 or less)','4.1.2':'Children aged 6 to 17 attending school','16.9.1':'Children under 5 whose birth is registered'};
const SDGC={1:'#E5243B',2:'#DDA63A',3:'#4C9F38',4:'#C5192D',5:'#FF3A21',6:'#26BDE2',7:'#FCC30B',8:'#A21942',9:'#FD6925',10:'#DD1367',11:'#FD9D24',12:'#BF8B2E',13:'#3F7E44',14:'#0A97D9',15:'#56C02B',16:'#00689D',17:'#19486A'};
const SDGN={1:'No poverty',2:'Zero hunger',3:'Good health and well-being',4:'Quality education',5:'Gender equality',6:'Clean water and sanitation',7:'Affordable and clean energy',8:'Decent work and economic growth',10:'Reduced inequalities',11:'Sustainable cities and communities',16:'Peace, justice and strong institutions',17:'Partnerships for the goals'};
const goalOf=code=>+String(code).split('.')[0], gcolOf=code=>SDGC[goalOf(code)]||'#7aa7e6';
const SDGI=new Set([1,2,3,4,5,6,7,8,10,11,16,17]);
const goalTile=(code,pri,big)=>{ const g=goalOf(code), tip=tipA('Goal '+g+' · '+(SDGN[g]||''),'Indicator '+esc(code)+(pri?'<br>◆ EGRISS priority indicator':''));
  return SDGI.has(g)?`<span class="gt img ${big?'big':''}" ${tip}><img src="sdg/${g}.png" alt="SDG ${g}: ${esc(SDGN[g]||'')}"><small>${esc(code)}${pri?' ◆':''}</small></span>`
    :`<span class="gt ${big?'big':''}" style="background:${gcolOf(code)}" ${tip}><b>${g}</b><small>${esc(code)}${pri?' ◆':''}</small></span>` };
const COVER186='data:image/jpeg;base64,__COVER__';
let layer='gain', level='world', view='3d', gSel='SSD', chosen=false, gGoal=null;
let fSrc=null, fInd=null, fEx=null, fSv=null, mapInd=null, mapG=0, hitSrc=null, belowDone={};
const fmt=n=>Number(n).toLocaleString('en');
const sdgRows=iso=>{const o=[];Q.sdg.forEach(d=>d.rows.forEach(r=>{if(r.iso===iso)o.push([d,r])}));return o};
function surveysOf(iso){const m=new Map(); sdgRows(iso).forEach(([d,r])=>{if(!m.has(r.src))m.set(r.src,[]);m.get(r.src).push([d,r])}); return m}
function has(iso,L){const c=Q.ctry[iso]; if(!c) return 0; return L==='gain'?c.ex.length:L==='sdg'?(sdgRows(iso).length+c.rep.length+(Q.sub.rep[iso]?1:0)):(c.sv.length||(c.cz.some(z=>z[3]>0)?1:0))}
const any=iso=>LK.some(L=>has(iso,L));
const subKeys=iso=>Q.sub.val[iso]?Object.keys(Q.sub.val[iso]):Q.sub.rep[iso]?Object.keys(Q.sub.rep[iso].ind):[];
const SNS={'6.1.1':'Drinking water','6.2.1':'Sanitation','7.1.1':'Electricity','2.1.2':'Food insecurity','4.1.2':'School attendance','16.9.1':'Birth registration'};
const subName=(iso,k)=>Q.sub.val[iso]?(k+' '+(SNS[k]||(Q.sdg.find(d=>d.c===k)||{n:''}).n)):Q.sub.rep[iso].ind[k].n;
const _rg={}; function rampOf(code){ const g=goalOf(code), col=SDGC[g]; if(!col) return ramp; return _rg[g]||(_rg[g]=d3.scaleLinear().domain([0,50,85,100]).range(['#1c2850',d3.interpolateRgb('#1c2850',col)(.5),col,d3.interpolateRgb(col,'#ffffff')(.5)]).clamp(true)) }
const gicon=(code,sz)=>SDGI.has(goalOf(code))?`<img class="gi" src="sdg/${goalOf(code)}.png" alt="" style="display:inline-block;vertical-align:-4px;margin-right:6px;width:${sz||18}px;height:${sz||18}px">`:'';
function ramp(v){const st=[[0,[39,55,95]],[45,[47,111,143]],[80,[76,195,201]],[100,[201,244,246]]]; for(let i=1;i<st.length;i++){ if(v<=st[i][0]){const a=st[i-1],b=st[i],t=(v-a[0])/(b[0]-a[0]); return 'rgb('+a[1].map((x,j)=>Math.round(x+(b[1][j]-x)*t)).join(',')+')'} } return 'rgb(201,244,246)'}
function idpCol(v,mx){const t=Math.sqrt(v/mx), a=[40,50,79], b=[224,169,59]; return 'rgb('+a.map((x,j)=>Math.round(x+(b[j]-x)*t)).join(',')+')'}
const dots=iso=>`<span class="dots" title="In: ${LK.filter(L=>has(iso,L)).map(L=>LAYER[L].n).join(', ')||'no layer'}">${LK.map(L=>`<i style="${has(iso,L)?'background:'+LAYER[L].col:''}"></i>`).join('')}</span>`;
const act=(a,v,label,cls,extra)=>`<button class="${cls||'lkbtn'}" type="button" data-act="${a}" data-v="${esc(v==null?'':v)}" ${extra||''}>${label}</button>`;

/* ---- hover cards for anything carrying data-tip ---- */
const tipA=(title,body)=>`data-tip="${esc(`<span class="tn">${esc(title)}</span>${body?`<span class="tq" style="font-size:13.5px">${body}</span>`:''}`)}"`;
(function(){
  const tip=$('tip'); let cur=null;
  function at(x,y){ const w=tip.offsetWidth,h=tip.offsetHeight,vw=window.innerWidth,vh=window.innerHeight; tip.style.left=Math.max(12,Math.min(x+14,vw-w-12))+'px'; tip.style.top=(y+16+h>vh&&y-12-h>0?y-12-h:y+16)+'px' }
  document.addEventListener('pointerover',e=>{ const el=e.target.closest&&e.target.closest('[data-tip]'); if(el){ cur=el; tip.innerHTML=el.dataset.tipq?qTip(el.dataset.tipq):el.dataset.tip; tip.classList.toggle('wide',!!el.dataset.tipq); tip.hidden=false; at(e.clientX,e.clientY) } else if(cur){ cur=null; tip.hidden=true } });
  document.addEventListener('pointermove',e=>{ if(cur) at(e.clientX,e.clientY) });
  document.addEventListener('focusin',e=>{ const el=e.target.closest&&e.target.closest('[data-tip]'); if(el){ cur=el; tip.innerHTML=el.dataset.tipq?qTip(el.dataset.tipq):el.dataset.tip; tip.classList.toggle('wide',!!el.dataset.tipq); tip.hidden=false; const r=el.getBoundingClientRect(); at(r.left,r.bottom-8) } });
  document.addEventListener('focusout',()=>{ if(cur){ cur=null; tip.hidden=true } });
})();

/* ---- the fixed start: a globe drawn the way the story draws its own (lit ocean, glow, examples rising from each country) ---- */
const RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const CAUSE_COL=['','#f06667','#f29d52','#b48ef0','#e77fb3','#8b98b3','#4cc3c9','#7aa7e6','#cfe0f4'];
let G=null, busy=false, hov=null, grow=1;
const czTot=iso=>{const c=Q.ctry[iso]; return c?c.cz.reduce((s,z)=>s+(z[3]||0),0):0};
const czTop=iso=>{const c=Q.ctry[iso]; return c&&c.cz.length?[...c.cz].sort((a,b)=>(b[3]||0)-(a[3]||0))[0]:null};
const GF={yr:null,rec:null,grp:null,src:null,lead:null};
const GFDEF=[['yr','Year',[2021,2022,2023,2024,2025].map(y=>[y,y])],['rec','Recommendations',[['IRRS','IRRS'],['IRIS','IRIS'],['IROSS','IROSS']]],['grp','Who is covered',[['Refugees','Refugees'],['IDPs','IDPs'],['Stateless','Stateless people']]],['src','Data source',[['Survey','Survey'],['Census','Census'],['Administrative','Administrative data'],['integration','Data integration']]],['lead','Led by',[['C','Country'],['I','Organisation']]]];
const gfOn=()=>Object.values(GF).some(v=>v!=null);
function exOK(e){ return (GF.yr==null||+e[1]===+GF.yr)&&(GF.rec==null||recSet(e).includes(GF.rec))&&(GF.grp==null||(e[7]||'').includes(GF.grp))&&(GF.src==null||(e[6]||'').includes(GF.src))&&(GF.lead==null||e[5]===GF.lead) }
const exF=iso=>{ const c=Q.ctry[iso]; return c?(gfOn()?c.ex.filter(exOK):c.ex):[] };
const gfText=()=>GFDEF.filter(d=>GF[d[0]]!=null).map(d=>(d[2].find(o=>String(o[0])===String(GF[d[0]]))||[0,GF[d[0]]])[1]).join(' · ');
function beads(iso){ const c=Q.ctry[iso]; if(!c) return null;
  if(layer==='gain'){ const x=exF(iso); return x.length?x.map(e=>e[4]):null }
  if(layer==='sdg'){ const a=sdgRows(iso).map(()=>1).concat(Q.sub.rep[iso]?[1]:[]).concat(c.rep.map(()=>0)); return a.length?a:null }
  return c.sv.length?c.sv.map(()=>1):null }
function mainGeom(iso){ const f=Q.geo.find(x=>x.properties.i===iso); if(!f) return null;
  const P=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates], ar=P.map(p=>d3.geoArea({type:'Polygon',coordinates:p})), mx=Math.max(...ar);
  return {type:'MultiPolygon',coordinates:P.filter((p,i)=>ar[i]>=mx*.15)} }
function tween(dur,fn,done,ez){ ez=ez||d3.easeCubicInOut;
  let fin=false; const end=()=>{ if(fin) return; fin=true; fn(1); done&&done() };
  if(RM||document.hidden||typeof requestAnimationFrame==='undefined'){ end(); return }
  const t0=performance.now(); setTimeout(end,dur+400);
  requestAnimationFrame(function step(now){ if(fin) return; const t=Math.min(1,(now-t0)/dur); if(t>=1){ end(); return } fn(ez(t)); requestAnimationFrame(step) });
}
const lerp=(a,b,t)=>a+(b-a)*t;
function lerpLon(a,b,t){ let d=((b-a+540)%360)-180; return a+d*t }
function gBase(){ const kO=Math.min(G.W,G.H)/2.45, kE=Math.min((G.W-24)/5.42,(G.H-60)/2.64); return view==='2d'?{rot:[0,0],k:kE,tr:[G.W/2,G.H/2+8],alpha:1,fade:0,m:0}:{rot:[G.rot[0],Math.max(-40,Math.min(40,G.rot[1]))],k:kO,tr:[G.W/2,G.H/2+6],alpha:0,fade:0,m:0} }
const _po=d3.geoOrthographic(), _pe=d3.geoEqualEarth();
function gInv(q){ const a=G.alpha, p=a<.01?_po:a>.99?_pe:null; if(!p) return null; return p.scale(G.k).translate(G.tr).rotate([G.rot[0],G.rot[1]]).invert(q) }
function gProj(){ const a=G.alpha; G.mut(a); G.proj.scale(G.k).translate(G.tr).rotate([G.rot[0],G.rot[1]]).clipAngle(a>=.999?null:90+89.9*a) }
function rgba(hex,al){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${al})` }
function draw(){
  if(!G) return; gProj();
  const ctx=G.ctx, W=G.W, H=G.H, a=G.alpha, f=G.fade, P=G.path, cx=G.tr[0], cy=G.tr[1], R=G.k, glob=1-a, col=LAYER[layer].col, TAU=6.2832, selIso=(chosen||level==='country'||G.fade>0)?gSel:null, sdgL=layer==='sdg', cof=c=>!sdgL?col:gGoal?(goalsOf(c.iso).includes(gGoal)?SDGC[gGoal]:null):(SDGC[leadGoal(c.iso)]||col);
  ctx.setTransform(G.dpr,0,0,G.dpr,0,0); ctx.clearRect(0,0,W,H);
  const vis=1-f;
  if(vis>.01){
    ctx.globalAlpha=vis*glob;
    if(glob>.02){ const ag=ctx.createRadialGradient(cx,cy,R*.96,cx,cy,R*1.22); ag.addColorStop(0,'rgba(76,195,201,0.34)'); ag.addColorStop(.35,'rgba(76,195,201,0.10)'); ag.addColorStop(1,'rgba(76,195,201,0)'); ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(cx,cy,R*1.22,0,TAU); ctx.fill() }
    ctx.globalAlpha=vis;
    const og=ctx.createRadialGradient(cx-R*.38*glob,cy-R*.42*glob,R*.05,cx,cy,R*(1+1.8*a)); og.addColorStop(0,'#22468c'); og.addColorStop(.55,'#14295a'); og.addColorStop(1,'#0a1634');
    ctx.fillStyle=og; ctx.beginPath(); P({type:'Sphere'}); ctx.fill();
    ctx.strokeStyle='rgba(207,224,244,0.08)'; ctx.lineWidth=.7; ctx.beginPath(); P(G.gr); ctx.stroke();
    ctx.fillStyle='#2a3f78'; ctx.strokeStyle='rgba(217,226,239,0.16)'; ctx.lineWidth=.6; ctx.beginPath(); for(const c of G.cs) if(!c.w) P(c.f); ctx.fill(); ctx.stroke();
    for(const c of G.cs){ if(!c.w||c.iso===selIso) continue; const cc=cof(c); ctx.beginPath(); P(c.f); ctx.fillStyle=cc?rgba(cc,sdgL?.78:.26+.5*c.w):'#2a3f78'; ctx.fill(); ctx.strokeStyle=c.iso===hov?'rgba(255,255,255,.9)':cc?rgba(cc,.9):'rgba(217,226,239,0.16)'; ctx.lineWidth=c.iso===hov?1.4:.8; ctx.stroke() }
    if(hov&&hov!==selIso){ const c=G.by[hov]; if(c&&!c.w){ ctx.beginPath(); P(c.f); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1; ctx.stroke() } }
  }
  const s=G.by[selIso];
  if(s){ ctx.globalAlpha=1; ctx.beginPath(); if(G.m>.002&&G.M&&a<.01) selPath(ctx,s.f); else P(s.f);
    ctx.fillStyle=d3.interpolateRgb(s.w&&cof(s)?d3.interpolateRgb('#2a3f78',cof(s))(sdgL?.85:.3+.55*s.w):'#3a4f8a','#16264f')(f); ctx.fill('evenodd');
    ctx.save(); ctx.shadowColor='rgba(255,255,255,.75)'; ctx.shadowBlur=10*(1-f); ctx.strokeStyle=d3.interpolateRgb('#ffffff','rgba(207,224,244,0.45)')(f); ctx.lineWidth=lerp(1.8,1,f); ctx.stroke(); ctx.restore() }
  if(vis>.01){
    ctx.globalAlpha=vis;
    if(glob>.02){ ctx.save(); ctx.globalAlpha=vis*glob; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.clip(); const sh=ctx.createRadialGradient(cx-R*.3,cy-R*.35,R*.2,cx,cy,R*1.02); sh.addColorStop(0,'rgba(255,255,255,0.06)'); sh.addColorStop(.6,'rgba(5,10,30,0)'); sh.addColorStop(1,'rgba(5,10,30,0.55)'); ctx.fillStyle=sh; ctx.fillRect(cx-R,cy-R,2*R,2*R); ctx.restore() }
    // marks: one bead per example, value or questionnaire, rising from the country
    const ctr=[-G.rot[0],-G.rot[1]], list=[];
    for(const c of G.cs){ if(!c.cen) continue; const b=beads(c.iso), tot=layer==='idq'?czTot(c.iso):0; if(!b&&!tot) continue; if(sdgL&&gGoal&&!goalsOf(c.iso).includes(gGoal)) continue;
      const dist=d3.geoDistance(c.cen,ctr); if(a<.999&&dist>1.45) continue; const p=G.proj(c.cen); if(!p) continue; list.push([c,b,tot,p,dist]) }
    // marks: one badge per country. Number = examples, values or questionnaires; ring = the filled share
    list.sort((x,y)=>(y[0].iso===selIso||y[0].iso===hov?-1:0)-(x[0].iso===selIso||x[0].iso===hov?-1:0)||(y[1]?y[1].length:0)-(x[1]?x[1].length:0)); G.hit=[]; const placed=[], later=[];
    for(const it of list){ const [c,b,tot,p,dist]=it, edge=a<.999?Math.max(0,Math.min(1,(1.45-dist)/.25)):1, on=c.iso===hov||c.iso===selIso;
      if(tot){ const r=Math.max(.1,(3+Math.sqrt(tot/G.maxTot)*20)*grow), top=czTop(c.iso); ctx.globalAlpha=vis*edge; ctx.beginPath(); ctx.arc(p[0],p[1],r,0,TAU); ctx.fillStyle=rgba(CAUSE_COL[top[0]],on?.7:.42); ctx.fill(); ctx.strokeStyle=rgba(CAUSE_COL[top[0]],.95); ctx.lineWidth=on?1.6:.9; ctx.stroke(); if(!b&&edge>.5) G.hit.push([c.iso,p[0],p[1],p[0],p[1],r]) }
      if(!b) continue; const n=b.length, r=((on?11:8)+Math.min(1,n/14)*(on?5:6))*grow;
      const clash=!on&&placed.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<q[2]+r-1); if(!clash) placed.push([p[0],p[1],r]);
      later.push([c,b,p,edge,on,clash?3.2*grow:r,clash]) }
    for(const [c,b,p,edge,on,r0,small] of later.reverse()){ const r=Math.max(.1,r0);
      const n=b.length, share=b.filter(Boolean).length/n; ctx.globalAlpha=vis*edge;
      if(small){ ctx.beginPath(); ctx.arc(p[0],p[1],r,0,TAU); ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle='rgba(10,20,48,.9)'; ctx.lineWidth=1; ctx.stroke() }
      else { ctx.save(); ctx.shadowColor=on?'rgba(255,255,255,.55)':'rgba(5,10,30,.7)'; ctx.shadowBlur=on?12:6; ctx.beginPath(); ctx.arc(p[0],p[1],r,0,TAU); ctx.fillStyle='rgba(10,20,48,.94)'; ctx.fill(); ctx.restore();
        ctx.lineWidth=on?3:2.4; ctx.beginPath(); ctx.arc(p[0],p[1],Math.max(.1,r-1.2),0,TAU); ctx.strokeStyle=rgba(col,.3); ctx.stroke();
        const gl=layer==='sdg'?goalsOf(c.iso):null;
        if(gl&&gl.length){ gl.forEach((g,i)=>{ ctx.beginPath(); ctx.arc(p[0],p[1],Math.max(.1,r-1.2),-TAU/4+TAU*i/gl.length*grow+(gl.length>1?.08:0),-TAU/4+TAU*(i+1)/gl.length*grow); ctx.strokeStyle=SDGC[g]; ctx.stroke() });
          if(on&&grow>.9){ const sz=22, gap=3, w=gl.length*(sz+gap)-gap; gl.forEach((g,i)=>{ const im=G.ic[g], x=p[0]-w/2+i*(sz+gap), y=p[1]-r-sz-7; if(im&&im.complete&&im.naturalWidth) ctx.drawImage(im,x,y,sz,sz); else { ctx.fillStyle=SDGC[g]; ctx.fillRect(x,y,sz,sz) } }) } }
        else if(share>0){ ctx.beginPath(); ctx.arc(p[0],p[1],Math.max(.1,r-1.2),-TAU/4,-TAU/4+TAU*share*grow); ctx.strokeStyle=on?'#ffffff':col; ctx.stroke() }
        if(grow>.6){ ctx.font=`600 ${on?12:10.5}px Figtree,system-ui,sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#ffffff'; ctx.fillText(n,p[0],p[1]+.5) } }
      if(edge>.5) G.hit.push([c.iso,p[0],p[1],p[0],p[1],r]);
    }
    ctx.globalAlpha=1;
  }
}
const sstep=x=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x) };
function gTo(T,dur,done,ez){
  const S={rot:G.rot.slice(),k:G.k,tr:G.tr.slice(),alpha:G.alpha,fade:G.fade,m:G.m||0}, Tf=T.fade==null?S.fade:T.fade, Tm=T.m==null?S.m:T.m, Ta=T.alpha==null?S.alpha:T.alpha; busy=true;
  if(T.M) G.M=T.M;
  const glide=S.alpha<.5&&Ta<.5, deg=k=>G.W*57.3/k, x0=-S.rot[0], x1=x0+(((S.rot[0]-T.rot[0])%360+540)%360-180), y0=-S.rot[1], y1=-T.rot[1];
  const zi=d3.interpolateZoom.rho(1.2)([x0,y0,deg(S.k)],[x1,y1,deg(T.k)]), lim=Array.isArray(dur)?dur:null;
  if(lim) dur=Math.max(lim[0],Math.min(lim[1],zi.duration*(lim[2]||1.05)));
  const inw=Tf>S.fade, unf=Tm>S.m;
  tween(dur,e=>{
    if(glide){ const v=zi(e); G.rot=[-v[0],-v[1]]; G.k=deg(v[2]) }
    else { G.rot=[lerpLon(S.rot[0],T.rot[0],e),lerp(S.rot[1],T.rot[1],e)]; G.k=S.k*Math.pow(T.k/S.k,e) }
    G.tr=[lerp(S.tr[0],T.tr[0],e),lerp(S.tr[1],T.tr[1],e)]; G.alpha=lerp(S.alpha,Ta,e);
    G.fade=lerp(S.fade,Tf,inw?sstep((e-.3)/.55):sstep(e/.6));
    G.m=lerp(S.m,Tm,unf?sstep((e-.45)/.55):sstep(e/.5)); draw() },()=>{ busy=false; done&&done() },ez) }
function flatProj(g,ext){ const b=d3.geoBounds(g), p=d3.geoMercator(); if(b[0][0]>b[1][0]) p.rotate([-d3.geoCentroid(g)[0],0]); return p.fitExtent(ext,g) }
function targetFor(iso){
  const m=Q.cm[iso], g=mainGeom(iso); if(!g) return null; const c=d3.geoCentroid(g);
  const vw=m?m.w:560, vh=m?m.h:520, s=Math.min(G.W/vw,G.H/vh), ox=(G.W-vw*s)/2, oy=(G.H-vh*s)/2, b=m?m.bb:[20,540,20,500];
  const ext=[[ox+b[0]*s,oy+b[2]*s],[ox+b[1]*s,oy+b[3]*s]];
  const p=d3.geoOrthographic().rotate([-c[0],-c[1]]).fitExtent(ext,g), M0=flatProj(g,ext); let M=M0, fits=1;
  if(m){ const bb=d3.geoPath(M0).bounds(g), sx=(ext[1][0]-ext[0][0])/(bb[1][0]-bb[0][0]), sy=(ext[1][1]-ext[0][1])/(bb[1][1]-bb[0][1]);
    fits=Math.max(sx,sy)/Math.min(sx,sy)<1.14?1:0; M=q=>{ const v=M0(q); return [ext[0][0]+(v[0]-bb[0][0])*sx,ext[0][1]+(v[1]-bb[0][1])*sy] } }
  return {rot:[-c[0],-c[1]],k:p.scale(),tr:p.translate(),alpha:0,fade:1,m:fits,M};
}
function selPath(ctx,f){ const m=G.m, M=G.M, pr=G.proj, P=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
  for(const poly of P) for(const ring of poly){ for(let i=0;i<ring.length;i++){ const a=pr(ring[i]), b=M(ring[i]), x=a[0]+(b[0]-a[0])*m, y=a[1]+(b[1]-a[1])*m; i?ctx.lineTo(x,y):ctx.moveTo(x,y) } ctx.closePath() } }
const _lg={}; function leadGoal(iso){ if(iso in _lg) return _lg[iso]; const n={}; sdgRows(iso).forEach(([d])=>{const g=goalOf(d.c); n[g]=(n[g]||0)+1}); ((Q.ctry[iso]||{rep:[]}).rep||[]).forEach(x=>{const g=goalOf(x[0]); n[g]=(n[g]||0)+1}); return _lg[iso]=+(Object.keys(n).filter(g=>SDGC[g]).sort((a,b)=>n[b]-n[a]||a-b)[0]||0) }
const _gl={}; function goalsOf(iso){ return _gl[iso]||(_gl[iso]=[...new Set(sdgRows(iso).map(([d])=>goalOf(d.c)).concat((Q.ctry[iso]||{rep:[]}).rep.map(x=>goalOf(x[0]))))].filter(g=>SDGC[g]).sort((a,b)=>a-b)) }
function weights(){ const v=G.cs.map(c=>{const b=beads(c.iso); return b?b.length:0}), mx=Math.max(2,...v); G.cs.forEach((c,i)=>c.w=v[i]?Math.max(.12,Math.min(1,v[i]/Math.min(mx,12))):0); G.maxTot=Math.max(1,...G.cs.map(c=>czTot(c.iso))) }
function hoverCard(iso){
  const c=Q.ctry[iso], nm=(G.by[iso]||{f:{properties:{n:iso}}}).f.properties.n; let h=`<span class="tn">${esc(c?c.n:nm)}</span>`;
  if(!c||!any(iso)) return h+'<span class="ts">Nothing in any layer yet</span>';
  if(!has(iso,layer)) return h+`<span class="ts">Not in ${LAYER[layer].n}. It is in ${LK.filter(L=>has(iso,L)).map(L=>LAYER[L].n).join(' and ')}.</span>`;
  const more=(n,cap)=>n>cap?`<span class="ts">and ${n-cap} more · select to open the country card</span>`:'<span class="ts">Select to open the country card</span>';
  if(layer==='gain'){ const X=exF(iso), mxn=Math.max(1,...[2021,2022,2023,2024,2025].map(y=>X.filter(e=>+e[1]===y).length));
    h+=`<span class="tq" style="font-size:13.5px">${X.length} GAIN ${X.length===1?'example':'examples'}${gfOn()?' · '+esc(gfText()):''}</span>
      <div class="tml">${[2021,2022,2023,2024,2025].map(y=>{const es=X.filter(e=>+e[1]===y); return `<div><span class="dots" style="height:${Math.min(mxn,8)*9+2}px">${es.slice(0,8).map(e=>`<i class="${e[4]?'u':''}"></i>`).join('')}</span><b>${es.length||''}</b><small>${y}</small></div>`}).join('')}</div>
      <ul class="tc">${X.slice(0,8).map(e=>`<b>${e[1]}</b><span>${e[4]?'●':'○'} ${esc(e[2].length>64?e[2].slice(0,62)+'…':e[2])}</span>`).join('')}</ul>${more(X.length,8)}<span class="ts">● uses the Recommendations · ○ does not or not known</span>` }
  else if(layer==='sdg'){ const rs=sdgRows(iso); h+=`<span class="tq" style="font-size:13.5px">${rs.length} calculated · ${c.rep.length} from reports</span><ul class="tc">${rs.slice(0,10).map(([d,r])=>`<b>${SDGI.has(goalOf(d.c))?`<img class="gi" src="sdg/${goalOf(d.c)}.png" alt="">`:d.c}</b><span>${d.c} ${esc(d.n)}: ${r.r}%${r.h!=null?' · '+r.h+'%':''}</span>`).join('')}${rs.length<10?c.rep.slice(0,10-rs.length).map(x=>`<b>${esc(x[0])}</b><span>${esc(x[1])} · ${esc(x[2])}</span>`).join(''):''}</ul>${more(rs.length+c.rep.length,10)}` }
  else { const tot=czTot(iso), cz=[...c.cz].filter(z=>z[3]>0).sort((a,b)=>b[3]-a[3]);
    h+=(tot?`<span class="tq" style="font-size:13.5px">${fmt(tot)} people displaced, by cause</span><ul class="tc">${cz.map(z=>`<b style="color:${CAUSE_COL[z[0]]}">■</b><span>${CZ[z[0]]}: ${fmt(z[3])}</span>`).join('')}</ul>`:'')
      +(c.sv.length?`<span class="tq" style="font-size:13.5px">${c.sv.length} ${c.sv.length===1?'questionnaire':'questionnaires'} mapped</span><ul class="tc">${c.sv.map(s=>`<b>${itemsAsked(s).length}/13</b><span>${esc(Q.surveys[s][1])}</span>`).join('')}</ul>`:'<span class="ts">No questionnaire mapped yet</span>')+more(0,1) }
  return h;
}
function initGlobe(){
  if(G) return;
  Q.geo.forEach(f=>{ const P=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]; P.forEach(p=>{ if(d3.geoArea({type:'Polygon',coordinates:p})>2*Math.PI) p.forEach(r=>r.reverse()) }) });
  const box=$('stage'), cv=$('gcv'), tip=$('tip'), W=box.clientWidth||600, H=box.clientHeight||560, dpr=Math.min(2,window.devicePixelRatio||1);
  const mut=d3.geoProjectionMutator(a=>(x,y)=>{ const o=d3.geoOrthographicRaw(x,y), e=d3.geoEqualEarthRaw(x,y); return [o[0]+a*(e[0]-o[0]),o[1]+a*(e[1]-o[1])] });
  const proj=mut(0).precision(.5), ctx=cv.getContext('2d');
  const size=()=>{ cv.width=G.W*G.dpr; cv.height=G.H*G.dpr };
  G={mut,proj,ctx,path:d3.geoPath(proj,ctx),W,H,dpr,rot:[-28,-8],k:1,tr:[W/2,H/2],alpha:0,fade:0,spin:true,gr:d3.geoGraticule().step([30,30])(),hit:[],
     cs:Q.geo.map(f=>{const g=mainGeom(f.properties.i); return {f,iso:f.properties.i,cen:g?d3.geoCentroid(g):null,bb:d3.geoBounds(f),w:0}})};
  G.by={}; G.cs.forEach(c=>G.by[c.iso]=c); G.ic={}; SDGI.forEach(g=>{ const im=new Image(); im.onload=()=>{ if(layer==='sdg') draw() }; im.src='sdg/'+g+'.png'; G.ic[g]=im }); size(); Object.assign(G,gBase()); if(view==='3d') G.rot=[-28,-8];
  const find=(x,y)=>{ let best=null,bd=3; for(const h of G.hit){ const vx=h[3]-h[1], vy=h[4]-h[2], L=vx*vx+vy*vy||1, t=Math.max(0,Math.min(1,((x-h[1])*vx+(y-h[2])*vy)/L)), d=Math.hypot(x-h[1]-t*vx,y-h[2]-t*vy)-h[5]; if(d<bd){bd=d;best=h[0]} } if(best) return best;
    if(G.alpha<.999&&Math.hypot(x-G.tr[0],y-G.tr[1])>G.k) return null; const ll=gInv([x,y]); if(!ll||isNaN(ll[0])) return null;
    for(const c of G.cs){ const b=c.bb; if(ll[1]<b[0][1]||ll[1]>b[1][1]) continue; if(b[0][0]<=b[1][0]&&(ll[0]<b[0][0]||ll[0]>b[1][0])) continue; if(d3.geoContains(c.f,ll)) return c.iso } return null };
  let dn=null, moved=0;
  cv.addEventListener('pointerdown',e=>{ if(level!=='world'||busy) return; G.spin=false; dn=[e.clientX,e.clientY]; moved=0; coast=false; vel=[0,0]; lastT=e.timeStamp });
  window.addEventListener('pointermove',e=>{ if(!dn||view!=='3d'||level!=='world') return; const dx=e.clientX-dn[0], dy=e.clientY-dn[1]; if(pts.size>1) return; moved+=Math.abs(dx)+Math.abs(dy); dn=[e.clientX,e.clientY]; const s=57.3/G.k, dt=Math.max(8,e.timeStamp-lastT); lastT=e.timeStamp; vel=[lerp(vel[0],dx*s/dt,.5),lerp(vel[1],-dy*s/dt,.5)]; G.rot=[G.rot[0]+dx*s,Math.max(-70,Math.min(70,G.rot[1]-dy*s))]; draw() });
  window.addEventListener('pointerup',e=>{ if(dn&&moved>6&&e.timeStamp-lastT<70&&Math.hypot(vel[0],vel[1])*G.k/57.3>.05){ coast=true; kick() } dn=null });
  // scroll or pinch zooms; the globe leans toward the pointer, keeps a little momentum after a drag,
  // and once a country with data fills the view it opens on its own
  let kT=0, aim=null, vel=[0,0], coast=false, live=false, lastT=0; const pts=new Map(); let pin=null;
  const centreIso=()=>{ const ll=gInv(G.tr); if(!ll||isNaN(ll[0])) return null; for(const c of G.cs){ if(has(c.iso,layer)&&d3.geoContains(c.f,ll)) return c.iso } return null };
  const kick=()=>{ if(!live){ live=true; requestAnimationFrame(step) } };
  function step(){ live=false; if(level!=='world'||busy||view!=='3d'){ kT=0; coast=false; return } let on=false;
    if(kT){ const d=Math.log(kT/G.k); if(Math.abs(d)>.003){ const s=d*.17; G.k*=Math.exp(s); if(aim&&d>0){ const f=Math.min(.5,s*1.1); G.rot=[lerpLon(G.rot[0],-aim[0],f),lerp(G.rot[1],Math.max(-70,Math.min(70,-aim[1])),f)] } on=true } else { G.k=kT; kT=0; aim=null } }
    if(coast){ G.rot=[G.rot[0]+vel[0]*16,Math.max(-70,Math.min(70,G.rot[1]+vel[1]*16))]; vel=[vel[0]*.94,vel[1]*.94]; if(Math.hypot(vel[0],vel[1])*G.k/57.3<.012) coast=false; else on=true }
    draw();
    if(kT&&kT>G.k){ const base=gBase().k, iso=centreIso(), T=iso&&targetFor(iso);
      if(T&&G.k>=Math.max(base*1.7,Math.min(T.k*.55,base*4.5))){ kT=0; aim=null; coast=false; if(iso!==gSel){ gSel=iso; fSrc=fInd=fEx=fSv=mapInd=null; czSel=null; mapG=0; render() } tip.hidden=true; zoomIn(true); return } }
    if(on) kick() }
  G.zoomBy=(f)=>zoomBy(f); const zoomBy=(f,x,y)=>{ const base=gBase().k, cur=kT||G.k; kT=Math.max(base,Math.min(base*9,cur*f)); G.spin=false;
    if(f>1&&x!=null&&Math.hypot(x-G.tr[0],y-G.tr[1])<G.k){ const ll=gInv([x,y]); if(ll&&!isNaN(ll[0])) aim=ll } kick() };
  cv.addEventListener('wheel',e=>{ if(level!=='world'||busy||view!=='3d') return; const out=e.deltaY>0; if(out&&(kT||G.k)<=gBase().k*1.002) return;   // at full view the page scrolls as usual
    e.preventDefault(); const r=cv.getBoundingClientRect(); zoomBy(Math.exp(-Math.max(-60,Math.min(60,e.deltaY))*(e.ctrlKey?.014:.0028)),e.clientX-r.left,e.clientY-r.top) },{passive:false});
  cv.addEventListener('pointerdown',e=>{ pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===2){ const [a,b]=[...pts.values()]; pin=[Math.hypot(a[0]-b[0],a[1]-b[1])||1,G.k]; dn=null } });
  cv.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===2&&pin&&level==='world'&&!busy&&view==='3d'){ const [a,b]=[...pts.values()], r=cv.getBoundingClientRect(), base=gBase().k; kT=Math.max(base,Math.min(base*9,pin[1]*Math.hypot(a[0]-b[0],a[1]-b[1])/pin[0])); if(kT>G.k){ const ll=gInv([(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top]); if(ll&&!isNaN(ll[0])) aim=ll } kick() } });
  const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pin=null }; window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up);
  $('cmap').addEventListener('wheel',e=>{ if(level==='country'&&!busy&&e.ctrlKey&&e.deltaY>0){ e.preventDefault(); zoomOut() } },{passive:false});
  box.dataset.v=view;
  { const sw=$('swipe'); let on=false; const mv=e=>{ const r=box.getBoundingClientRect(); setSwipe((e.clientX-r.left)/r.width) };
    sw.addEventListener('pointerdown',e=>{ on=true; sw.setPointerCapture(e.pointerId); mv(e); e.preventDefault() });
    sw.addEventListener('pointermove',e=>{ if(on) mv(e) }); const off=()=>{ on=false }; sw.addEventListener('pointerup',off); sw.addEventListener('pointercancel',off);
    sw.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ setSwipe(swX+(e.key==='ArrowLeft'?-.04:.04)); e.preventDefault() } }) }
  cv.addEventListener('pointermove',e=>{ if(level!=='world'||busy||dn&&moved>6) return; const r=cv.getBoundingClientRect(), h=find(e.clientX-r.left,e.clientY-r.top);
    if(h!==hov){ hov=h; cv.style.cursor=h&&any(h)?'pointer':(view==='3d'?'grab':'default'); draw(); if(h){ tip.innerHTML=hoverCard(h); tip.hidden=false } else tip.hidden=true }
    if(h){ const w=tip.offsetWidth, hh=tip.offsetHeight; tip.style.left=Math.max(12,Math.min(e.clientX+16,window.innerWidth-w-12))+'px'; tip.style.top=Math.max(12,Math.min(e.clientY+16,window.innerHeight-hh-12))+'px' } });
  cv.addEventListener('pointerleave',()=>{ if(hov){ hov=null; tip.hidden=true; draw() } });
  cv.addEventListener('click',e=>{ if(moved>6||busy||level!=='world') return; const r=cv.getBoundingClientRect(), h=find(e.clientX-r.left,e.clientY-r.top); if(h) pick(h,true) });
  window.addEventListener('resize',()=>{ const w=box.clientWidth, h=box.clientHeight; if(!w||w===G.W&&h===G.H) return; G.W=w; G.H=h; size(); Object.assign(G,level==='country'?(targetFor(gSel)||gBase()):gBase()); draw() });
  if(!RM) (function spin(){ if(G.spin&&level==='world'&&view==='3d'&&!busy&&!hov&&!document.hidden){ G.rot[0]+=.07; draw() } requestAnimationFrame(spin) })();
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw);
  weights(); draw();
}
let lastLayer=null;
function paintGlobe(){ weights(); if(lastLayer!==layer&&level==='world'&&!busy){ lastLayer=layer; grow=0; tween(700,t=>{ grow=t; if(!busy) draw() }) } else { lastLayer=layer; draw() } }
function pick(iso,move){ if(!Q.ctry[iso]||!any(iso)||busy) return; chosen=true; gSel=iso; fSrc=fInd=fEx=fSv=mapInd=null; czSel=null; mapG=0; G.spin=false; render(); const p=$('panel'); p.classList.remove('slide'); void p.offsetWidth; p.classList.add('slide'); setTimeout(()=>p.classList.remove('slide'),600);
  if(move&&view==='3d'&&level==='world'){ const g=mainGeom(iso); { const go=layer==='sdg'&&has(iso,'sdg'); if(g&&!go){ const c=d3.geoCentroid(g); gTo({rot:[-c[0],Math.max(-40,Math.min(40,-c[1]))],k:G.k,tr:G.tr,alpha:0},[750,1500,1.8]) } } }
  if(level==='world'&&layer==='sdg'&&has(iso,'sdg')) zoomIn() }
function setView(v){ if(v===view||busy) return; view=v; $('stage').dataset.v=v; G.spin=false; render(); gTo(gBase(),950) }
function zoomIn(hand){
  if(level==='country') return; chosen=true; if(busy){ setTimeout(zoomIn,160); return } const T=targetFor(gSel), st=$('stage'); $('tip').hidden=true; hov=null;
  const land=()=>{ level='country'; setHash(); render(); st.classList.add('country','landing'); setTimeout(()=>st.classList.remove('landing'),1500) };
  if(!T){ land(); return } hand===true?gTo(T,[900,1900],land,d3.easeCubicOut):gTo(T,[1450,2600],land);
}
function zoomOut(){
  if(busy||level==='world') return; const st=$('stage'); st.classList.remove('country'); level='world'; setHash(); render();
  setTimeout(()=>gTo(gBase(),[1400,2400]),RM?0:90);
}

/* ---- the country map: drawn once per country, then recoloured so colours blend when the view is switched ---- */
let mapIso=null;
function outlineSvg(iso){
  const g=mainGeom(iso); if(!g) return '<p class="lnote" style="padding:20px">No map for this country yet.</p>';
  const p=flatProj(g,[[20,20],[540,500]]);
  return `<svg viewBox="0 0 560 520" role="img" aria-label="Outline of the country"><path class="land" d="${d3.geoPath(p)(g)}"/></svg>`;
}
/* relief, neighbours and outline shared by the country map and the small GAIN map (px keeps their ids apart) */
/* a location mark: IDP locations are diamonds, every other group a circle, so the two do not differ by colour alone */
const ptMark=(cls,p,r,attrs)=>p[2]===2?`<rect class="${cls}" data-g="2" data-n="${esc(p[4]||'')}" data-x="${p[0]}" data-y="${p[1]}" x="${(p[0]-r*.9).toFixed(1)}" y="${(p[1]-r*.9).toFixed(1)}" width="${(r*1.8).toFixed(1)}" height="${(r*1.8).toFixed(1)}" transform="rotate(45 ${p[0]} ${p[1]})" ${attrs}/>`:`<circle class="${cls}" data-g="${p[2]}" data-n="${esc(p[4]||'')}" cx="${p[0]}" cy="${p[1]}" r="${r}" ${attrs}/>`;
function ptSize(el,r){ if(el.tagName==='rect'){ const x=+el.dataset.x, y=+el.dataset.y; el.setAttribute('x',x-r*.9); el.setAttribute('y',y-r*.9); el.setAttribute('width',r*1.8); el.setAttribute('height',r*1.8) } else el.setAttribute('r',r) }
const diam='border-radius:1px;transform:rotate(45deg) scale(.82)';
function relKit(iso,m,px){
  const rel=(cp,cls)=>m.rel?`<image class="relief ${cls}" href="relief/${iso}.jpg" x="0" y="0" width="${m.w}" height="${m.h}" preserveAspectRatio="none" clip-path="url(#rc${cp}${px}-${iso})" ${cls==='ov'?'':`filter="url(#rt${cp}${px}-${iso})"`}/>`:'', tint=(id,t)=>`<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feComponentTransfer><feFuncR type="table" tableValues="${t[0]}"/><feFuncG type="table" tableValues="${t[1]}"/><feFuncB type="table" tableValues="${t[2]}"/></feComponentTransfer></filter>`;
  return {rel, head:`<defs><clipPath id="rcl${px}-${iso}"><path d="${m.land}"/></clipPath>${m.near?`<clipPath id="rcn${px}-${iso}"><path d="${m.near}"/></clipPath>`:''}${tint('rtl'+px+'-'+iso,['.02 .086 .27','.035 .149 .38','.11 .31 .60'])}${tint('rtn'+px+'-'+iso,['.02 .063 .17','.04 .11 .24','.11 .25 .42'])}</defs>${m.near?`<path class="near" d="${m.near}"/>${rel('n','nb')}<path class="nearline" d="${m.near}"/>`:''}<path class="land" d="${m.land}"/>${rel('l','base')}<path class="landline" d="${m.land}"/>`} }
function buildCountryMap(iso){
  const m=Q.cm[iso], adm=Q.sub.map[iso]; mapIso=iso;
  if(!m){ $('cmap').innerHTML=outlineSvg(iso); return }
  const pc=g=>g===0||g===3?'pr':g===2?'pi':'po', pn=g=>g===0||g===3?'Refugee or asylum-seeker location':g===2?'IDP location':'Other location';
  const K=relKit(iso,m,''), rel=K.rel;
  let s=`<svg viewBox="0 0 ${m.w} ${m.h}" role="img" aria-label="Map of ${esc(Q.ctry[iso].n)}">${K.head}<g id="m-idp">`;
  if(m.areas){ const mx=Math.max(1,...m.areas.map(a=>a[3])); s+=m.areas.map(a=>a[3]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[3],mx)}" ${tipA(a[1]+', '+a[2],fmt(a[3])+' internally displaced people')}/>`:'').join('') }
  else if(m.states){ const mx=Math.max(1,...m.states.map(a=>a[4])); s+=m.states.map(a=>a[4]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[4],mx)}" ${tipA(a[1],fmt(a[4])+' internally displaced people')}/>`:'').join('') }
  s+='</g><g id="m-adm">'+(adm?adm.areas.map(a=>`<path class="ar" data-k="${esc(a.n)}" d="${a.d}"/>`).join(''):'')+(m.states?m.states.map(a=>`<path class="ar" data-k="${esc(a[1])}" d="${a[0]}"/>`).join(''):'')+'</g>';
  s+=rel('l','ov')+(m.nlab?'<g id="m-near">'+m.nlab.map(l=>`<text class="nl" x="${l[0]}" y="${l[1]}" text-anchor="middle">${esc(l[2])}</text>`).join('')+'</g>':'');
  s+='<g id="m-pts">'+m.pts.map(p=>ptMark(pc(p[2]),p,m.pts.length>800?1.6:2.7,p[4]?tipA(p[4],pn(p[2])):'')).join('')+'</g>';
  s+='<g id="m-cz">'+(Q.cpts[iso]?(mx=>Q.cpts[iso].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${(2+Math.sqrt(p[3]/mx)*15).toFixed(1)}" data-c="${p[2]}" fill="${CAUSE_COL[p[2]]}" fill-opacity=".5" stroke="${CAUSE_COL[p[2]]}" ${tipA(p[4],fmt(p[3])+' people displaced<br>'+CZ[p[2]]+(p[5]?' · '+esc(p[5]):''))}/>`).join(''))(Math.max(1,...Q.cpts[iso].map(p=>p[3]))):'')+'</g>';
  s+='<g id="m-camps">'+(adm?adm.camps.map(c=>`<circle data-k="${esc(c.k)}" data-n="${esc(c.n)}" cx="${c.x}" cy="${c.y}" r="5.5" stroke="#ffffff" stroke-width="1.5"/>`).join(''):'')+'</g><g id="m-lab">';
  const lab=(k,x,y,an,nm)=>`<text class="lv" data-k="${esc(k)}" x="${x}" y="${y}" text-anchor="${an}" font-size="15" font-weight="600"></text><text class="ln" data-k="${esc(k)}" x="${x}" y="${y+13}" text-anchor="${an}" font-size="10">${esc(nm)}</text>`;
  if(adm) s+=adm.areas.map(a=>{const isl=a.n.startsWith('Islamabad'); return lab(a.n,isl?a.cx+12:a.cx,isl?a.cy+12:a.cy,isl?'start':'middle',isl?'Islamabad':a.n)}).join('');
  if(m.states) s+=m.states.map(a=>lab(a[1],a[2],a[3],'middle',a[1])).join('');
  s+=`</g><g id="m-nat" style="opacity:0"><text class="a" x="${(m.bb[0]+m.bb[1])/2}" y="${(m.bb[2]+m.bb[3])/2}" text-anchor="middle" font-size="44" font-weight="600"></text><text class="b" x="${(m.bb[0]+m.bb[1])/2}" y="${(m.bb[2]+m.bb[3])/2+22}" text-anchor="middle" font-size="13"></text>`;
  $('cmap').innerHTML=s+'</g></svg>';
}
function swipeGroups(){ const iso=gSel, S=Q.sub, V=mapInd&&S.val[iso]?S.val[iso][mapInd]:null, M=S.meta[iso];
  if(V&&M.g.length>1) return [M.g[0],M.g[Math.max(1,mapG)]||M.g[1]];
  const NR=(!V&&mapInd&&mapInd!=='__cause'&&fSrc&&!(S.rep[iso]&&S.rep[iso].ind[mapInd])&&surveysOf(iso).get(fSrc)||[]).find(([d])=>d.c===mapInd);
  return NR&&NR[1].h!=null?[NR[1].g1,NR[1].g2||'Host']:null }
let swX=.5;
function setSwipe(x){ swX=Math.max(.04,Math.min(.96,x)); const p=(swX*100).toFixed(2)+'%'; $('cmap').style.clipPath=`inset(0 ${(100-swX*100).toFixed(2)}% 0 0)`; $('cmap2').style.clipPath=`inset(0 0 0 ${p})`; $('swipe').style.left=p }
function paintMap(){
  const iso=gSel; if(mapIso!==iso) buildCountryMap(iso);
  const m=Q.cm[iso], sw=$('swipe'), c2=$('cmap2'), sg=m&&layer==='sdg'?swipeGroups():null, code=mapInd&&mapInd!=='__cause'&&(sg||Q.sub.val[iso]&&Q.sub.val[iso][mapInd])?mapInd:null, bd=$('mapbadge');
  bd.hidden=!code; if(code) bd.innerHTML=`${gicon(code,40)}<span><b>${esc(code)}</b><small>${esc(SNS[code]||(Q.sdg.find(d=>d.c===code)||{n:''}).n)}</small></span>`;
  if(!m){ sw.hidden=true; c2.innerHTML=''; $('cmap').style.clipPath=''; return }
  if($('cmap').dataset.cov){ $('cmap').querySelectorAll('#m-pts [data-g]').forEach(p=>p.style.opacity=''); $('cmap').querySelectorAll('#m-camps circle').forEach(k=>k.style.fill=''); delete $('cmap').dataset.cov }
  paintInto($('cmap'),sg?0:mapG);
  if(sg){ c2.innerHTML=$('cmap').innerHTML; paintInto(c2,Math.max(1,mapG)); sw.hidden=false; sw.querySelector('.sl').textContent=sg[0]; sw.querySelector('.sr').textContent=sg[1]; setSwipe(swX) }
  else { sw.hidden=true; c2.innerHTML=''; $('cmap').style.clipPath='' }
}
function paintInto(root,g){ const iso=gSel, m=Q.cm[iso];
  const S=Q.sub, M=S.meta[iso], V=mapInd&&S.val[iso]?S.val[iso][mapInd]:null, R=mapInd&&S.rep[iso]?S.rep[iso].ind[mapInd]:null, cause=mapInd==='__cause', NR=(!V&&!R&&!cause&&mapInd&&fSrc&&surveysOf(iso).get(fSrc)||[]).find(([d])=>d.c===mapInd), NV=NR?[NR[1].r,NR[1].h][g]:null, base=!V&&!R&&!cause&&NV==null, rmp=(V||NR)?rampOf(mapInd):ramp;
  const land=root.querySelector('.land'), nt=q0=>root.querySelector(q0); land.style.fill=NV!=null?rmp(NV):''; const natT=nt('#m-nat'); if(natT){ natT.style.opacity=NV!=null?1:0; if(NV!=null){ natT.querySelector('.a').textContent=NV+'%'; natT.querySelector('.b').textContent=[NR[1].g1,NR[1].g2||'Host'][g]+' · national value only' } }
  const val=k=>V?V.areas[((M.alias||{})[k]||k)+'|'+M.g[g]]:R?R.vals[k]:null;
  const top=m.states?new Set([...m.states].sort((a,b)=>b[4]-a[4]).slice(0,6).filter(a=>a[4]).map(a=>a[1])):null;
  const q=id=>root.querySelector('#'+id);
  q('m-idp').style.opacity=base?1:0; q('m-cz').style.opacity=cause?1:0; q('m-cz').style.pointerEvents=cause?'auto':'none'; czFocus(czSel); q('m-pts').style.opacity=base?.85:.28;
  q('m-adm').style.pointerEvents=base&&m.states?'none':'auto'; { const nl=q('m-near'); if(nl) nl.style.opacity=base?1:.4; const ov=root.querySelector('.relief.ov'); if(ov) ov.style.opacity=base||cause?'':.4 }
  q('m-adm').querySelectorAll('.ar').forEach(p=>{ const k=p.dataset.k, c=val(k); p.classList.toggle('on',!!c); if(c) p.style.fill=rmp(c[0]);
    p.setAttribute('data-tip',`<span class="tn">${esc(k)}</span>`+(c?`<span class="tq">${c[0]}%</span><span class="ts">${V?esc(SNN[mapInd])+' · '+esc(M.g[g])+' · '+c[1]+' households in the sample'+(c[1]<50?' (small)':''):esc(R.n)+' · '+fmt(c[1])+' '+R.nl}</span>`:`<span class="ts">${base?'No value shown: switch the map to an indicator':'No value for this area'}</span>`)) });
  q('m-camps').querySelectorAll('circle').forEach(c=>{ const v0=V&&g===0&&V.camps?V.camps[c.dataset.k]:null, v=v0&&v0[1]>=10?v0:null; c.style.opacity=v?1:0; c.style.pointerEvents=v?'auto':'none'; if(v){ c.style.fill=rmp(v[0]); c.setAttribute('data-tip',`<span class="tn">${esc(c.dataset.n)}</span><span class="tq">${v[0]}%</span><span class="ts">${esc(SNN[mapInd])} · refugees · ${v[1]} households in the sample</span>`) } });
  q('m-lab').querySelectorAll('.lv').forEach(t=>{ const c=val(t.dataset.k); t.textContent=c?Math.round(c[0])+'%':''; });
  q('m-lab').querySelectorAll('.ln').forEach(t=>{ const k=t.dataset.k, c=val(k), show=c||(base&&(top?top.has(k):!k.startsWith('Islamabad'))); t.style.opacity=show?(c?.9:.75):0; t.setAttribute('y',+t.previousSibling.getAttribute('y')+(c?13:0)) });
}
function czFocus(k){ const g=$('cmap').querySelector('#m-cz'); if(g) g.querySelectorAll('circle').forEach(c=>c.style.opacity=!k||+c.dataset.c===+k?'':.05) }
function renderMapFoot(){
  const iso=gSel, m=Q.cm[iso], S=Q.sub, M=S.meta[iso], keys=subKeys(iso), V=mapInd&&S.val[iso]?S.val[iso][mapInd]:null, R=mapInd&&S.rep[iso]?S.rep[iso].ind[mapInd]:null;
  const g=m?m.pts.reduce((o,p)=>{const k=p[2]===0||p[2]===3?'r':p[2]===2?'i':'o'; o[k]++; return o},{r:0,i:0,o:0}):{r:0,i:0,o:0};
  const pill=(cls,txt,title,body)=>/^(Exists|New|To confirm)$/.test(txt)?'':`<i class="pill ${cls}" tabindex="0" ${tipA(title,body)}>${txt}</i>`;
  const NR=(!V&&!R&&mapInd&&mapInd!=='__cause'&&fSrc&&surveysOf(iso).get(fSrc)||[]).find(([d])=>d.c===mapInd);
  let leg='', notes=''; const rmp=(V||NR)?rampOf(mapInd):ramp, sg=layer==='sdg'&&m?swipeGroups():null;
  if(NR){ leg=`<span style="flex:1 1 200px"><span>0%</span><i style="flex:1;height:8px;border-radius:1px;background:linear-gradient(90deg,${[0,25,50,70,85,100].map(v=>rmp(v)+' '+v+'%').join(',')})"></i><span>100%</span></span>`; notes=pill('plain','National','One value for the whole country','This indicator has not been calculated below country level for this survey yet, so the map shows the national value.') }
  else if(mapInd==='__cause'){ const cs=[...new Set(Q.cpts[iso].map(p=>p[2]))].sort(); leg=cs.map(k=>`<span><i class="d" style="background:${CAUSE_COL[k]}"></i>${CZ[k]}</span>`).join('')+'<span>larger circle = more people</span>'; notes=pill('ok','Exists','Displacement by cause','Places where people were displaced, by cause, from the causing events analysis in the ID Questions repository. The '+Q.cpts[iso].length+' largest records are shown.') }
  else if(!mapInd){
    leg=(g.r?`<span><i class="d" style="background:#7df3f7"></i>${fmt(g.r)} refugee locations</span>`:'')+(g.i?`<span><i class="d" style="background:#ffd166;${diam}"></i>${fmt(g.i)} IDP locations</span>`:'')+(g.o?`<span><i class="d" style="background:#8b98b3"></i>${fmt(g.o)} other</span>`:'')+(m&&m.states?`<span><i class="g"></i>IDPs by ${esc(m.areas?m.lay.unit:m.lay.parent)}</span>`:'')||'<span>No locations recorded.</span>';
    notes=pill('ok','Exists','Population base','As on the GAIN country page. Locations from UNHCR.'+(m&&m.lay?' IDPs by '+esc(m.lay.unit)+' from '+esc(m.lay.who)+'. '+esc(m.lay.cover):''))+(m&&m.src?pill('plain','Source','Source of the IDP counts',esc(m.src)):'');
  } else {
    leg=`<span style="flex:1 1 200px"><span>0%</span><i style="flex:1;height:8px;border-radius:1px;background:linear-gradient(90deg,${[0,25,50,70,85,100].map(v=>rmp(v)+' '+v+'%').join(',')})"></i><span>100%</span></span>${V&&V.camps&&(sg||mapG===0)?'<span><i class="d" style="background:#4cc3c9;outline:1.5px solid #fff"></i>camp</span>':''}`;
    notes=V?pill('new','New','Calculated from microdata',esc(M.survey)+', by '+M.unit+(V.camps?' and by camp':'')+'. '+esc(M.wl)+'.')+pill('tbc','To confirm','Read with care','The survey was designed for national or stratum estimates. Small cells are marked; confidence intervals are not calculated yet.')
      :pill('new','New','From a published table','Share of '+esc(R.of)+'. '+esc(R.tbl)+'. Not calculated from microdata.')+(m&&m.areas?pill('plain','Levels','Two levels on one map','Population is counted by '+esc(m.lay.unit)+'; these values exist only by '+esc(m.lay.parent)+'.'):'')+pill('flag','Check','Not an SDG indicator','It is what the report tabulates by state. Katsina rests on very few households.');
  }
  $('stfoot').innerHTML=`<div class="chips" id="mapchips">${act('map','','Population','chip',`aria-pressed="${!mapInd}"`)}${Q.cpts[iso]?act('map','__cause','Displaced by cause','chip',`aria-pressed="${mapInd==='__cause'}"`):''}${keys.map(k=>act('map',k,(Q.sub.val[iso]?gicon(k):'')+esc(subName(iso,k)),'chip gch',`aria-pressed="${k===mapInd}" style="--gc:${Q.sub.val[iso]?gcolOf(k):'var(--teal)'}"`)).join('')}${NR?act('map',mapInd,gicon(mapInd)+esc(mapInd+' '+NR[0].n),'chip gch',`aria-pressed="true" style="--gc:${gcolOf(mapInd)}"`):''}${sg?(V&&M.g.length>2?`<span class="lnote" style="align-self:center;margin:0 2px 0 8px">${esc(M.g[0])} compared with</span>`+M.g.slice(1).map((x,i)=>act('mapg',i+1,esc(x),'chip',`aria-pressed="${i+1===Math.max(1,mapG)}"`)).join(''):''):V||NR&&NR[1].h!=null?`<span class="lnote" style="align-self:center;margin:0 2px 0 8px">for</span>`+(V?M.g:[NR[1].g1,NR[1].g2||'Host']).map((x,i)=>act('mapg',i,esc(x),'chip',`aria-pressed="${i===mapG}"`)).join(''):''}</div>
    ${sg?`<p class="lnote" style="margin:0">Drag the divider on the map: ${esc(sg[0])} on the left, ${esc(sg[1])} on the right.</p>`:''}<div class="mleg">${leg}<span style="margin-left:auto;gap:5px">${notes}</span></div>`;
}

/* ---- shared pieces used by more than one layer ---- */
function identList(bs){
  const order=Q.model.map(m=>m.code).concat(EXTRA), rs=Q.bank.filter(r=>r[0]===bs&&r[2]!=='none').sort((a,b)=>order.indexOf(a[2])-order.indexOf(b[2]));
  return rs.map(r=>`<div class="idr"><div class="c"><span tabindex="0" ${(m=>m?tipA(m.code+' · '+m.title+(m.core?' · core':''),esc(m.stem)):tipA(r[2],esc(ITEM[r[2]]||'')+' · outside the 13 module items'))(Q.model.find(x=>x.code===r[2]))}>${esc((Q.model.find(x=>x.code===r[2])||{}).title||ITEM[r[2]]||r[2])}</span><i class="pill a-${r[3]}">${esc(r[3])}</i></div><div><span style="color:var(--dim);font:500 12px var(--mono)">${esc(r[1])}</span> ${esc(r[5])}${r[7]&&r[7]!==r[5]?`<div class="e">${esc(r[7])} ${r[8]?'<i class="pill draft">Draft</i>':''}</div>`:''}</div></div>`).join('');
}
const itemsAsked=bs=>Q.model.filter(m=>bankFor(bs,m.code).length);
function identBand(iso,src,r0){
  const bs=Q.link[src];
  return `<div class="band" style="border-left:3px solid ${LAYER.idq.col}"><div class="lhead"><h2>Who is counted</h2><span class="lnote">how the groups were identified · shared with ID Questions</span></div>
    <div class="how"><div class="howr"><span class="hk">Groups from</span><div class="hv">${r0.gv?`<div class="vars">${vchip(r0.country,r0.gv)}</div>`:'<span>The survey\'s sample <i class="pill tbc">To confirm</i></span>'}<span>${esc(r0.g1)}${r0.g2?' compared with '+esc(r0.g2.toLowerCase()):', no comparison group'}</span></div></div></div>
    ${bs!=null?`<p style="margin-top:10px">The questionnaire asks ${itemsAsked(bs).length} of the 13 EGRISS identification questions, ${itemsAsked(bs).filter(m=>m.core).length} of the 5 core ones.</p><details class="idfold"><summary>Show the identification questions as asked</summary><div class="idq" style="margin-top:8px">${identList(bs)}</div></details>
      <p class="lnote">${Q.idcmp[src]?'':'Whether these questions give the same groups as the group variable has not been compared in this file.'}</p>
      ${Q.idcmp[src]?`<h3>Do the questions give the same groups?</h3><div class="tw"><table class="snt"><tr><th>Group in the sample</th><th>Question</th><th>Answers</th></tr>${Q.idcmp[src].map(x=>`<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`).join('')}</table></div><p class="lnote">Counted in the survey file, unweighted. The sample group and the answers mostly agree for refugees; they do not for the host sample.</p>`:''}
      <div>${act('open-idq',bs,'Open in ID Questions →','lkbtn',`style="--lc:${LAYER.idq.col}"`)}</div>`
     :`<div class="fl"><i class="pill tbc">To confirm</i><span>This survey's questionnaire is not in the question bank yet, so its identification questions cannot be shown.</span></div>`}</div>`;
}
function areaTable(iso,ind){
  const S=Q.sub, M=S.meta[iso], V=S.val[iso][ind], small=n=>n<50?' <i class="pill tbc">small</i>':'';
  const td=c=>c?`<td><span class="v">${c[0]}%</span> <span class="n">n=${c[1]}</span>${small(c[1])}</td>`:'<td><span class="n">not sampled</span></td>';
  const names=[...new Set(Object.keys(V.areas).map(k=>k.split('|')[0]))].sort();
  const camps=V.camps?Object.entries(V.camps).sort((a,b)=>b[1][0]-a[1][0]):[];
  return `<div class="tw"><table class="snt"><tr><th>${M.unit}</th><th>${esc(M.g[0])}</th><th>${esc(M.g[1])}</th></tr>${names.map(a=>`<tr><td>${esc(a)}</td>${td(V.areas[a+'|'+M.g[0]])}${td(V.areas[a+'|'+M.g[1]])}</tr>`).join('')}
    <tr><td><b>National, recalculated</b></td><td class="v">${V.nat[M.g[0]][0]}%</td><td class="v">${V.nat[M.g[1]][0]}%</td></tr></table></div>
    ${camps.length?`<h3 style="margin-top:6px">Refugees by camp or settlement</h3><div class="tw"><table class="snt"><tr><th>Camp</th><th>Refugees</th></tr>${camps.map(([k,c])=>`<tr><td>${esc((S.map[iso].camps.find(x=>x.k===k)||{n:k}).n)}</td>${td(c)}</tr>`).join('')}</table></div>`:''}`;
}
function sits(L,exists,what){ const c=Q.ctry[gSel]; return `<div class="chead" style="--lc:${LAYER[L].col}"><div><p class="eyebrow" style="color:var(--lc)">${LAYER[L].n}</p><h2>${esc(c.n)}</h2></div><span style="margin-left:auto;display:flex;gap:10px;align-items:center">${wsBtn(L,gSel)}</span></div>`}
function elsewhere(iso){const o=LK.filter(L=>L!==layer&&has(iso,L)); return o.length?`<p class="lnote">It is in: ${o.map(L=>act('layer',L,LAYER[L].n,'lkbtn',`style="--lc:${LAYER[L].col}"`)).join(' ')}</p>`:''}

/* ---- right panel at world level: the country card ---- */
const tiles=c=>c.pop?`<div class="ptiles">${[['Refugees and asylum-seekers',c.pop[1]],['Internally displaced',c.pop[2]],['Stateless',c.pop[3]]].map(([l,v])=>`<div><b>${v?fmt(v):'None reported'}</b><span>${l}</span></div>`).join('')}</div><p class="lnote">People in ${esc(c.n)} at the end of ${c.pop[0]}. Source: UNHCR and IDMC.</p>`:'';
function exCard(e,iso,btn){ const k=exLinks(iso,e[0]);
  return `<article class="exc ${btn&&e[0]===fEx?'cur':''}" ${e[10]?tipA('What it is',esc(e[10])+(e[10].length>=260?'…':'')):''}>${e[9]?`<img src="covers/ex${e[0]}.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<div class="noc">no cover</div>'}
    <div class="exb"><span class="exmeta">${e[1]} · ${e[5]==='C'?'COUNTRY-LED':'INSTITUTION-LED'} · EXAMPLE ${e[0]}</span><b>${esc(e[2])}</b><span class="org">${esc(e[3])}</span>
    <div class="tags">${e[4]?'<i class="pill ok">Uses the Recommendations</i>':'<i class="pill plain">Not using or not known</i>'}${(e[6]?e[6].split(', '):[]).concat(e[7]?e[7].split(', '):[]).map(t=>`<i class="pill plain">${esc(t)}</i>`).join('')}${k.bs!=null?`<i class="pill" style="background:${LAYER.idq.col};color:var(--night)">Questionnaire</i>`:''}</div>
    <div class="exl">${e[8]?`<a href="${esc(e[8])}" target="_blank" rel="noopener">Open the source ↗</a>`:''}${btn?act('ex',e[0],e[0]===fEx?'Card open below ↓':'Open its card'):''}</div></div></article>` }
const GN=['Refugees','Returnees','IDPs','Asylum-seekers','Stateless people','Others of concern'], GCOL=['#7df3f7','#8b98b3','#ffd166','#7df3f7','#b48ef0','#8b98b3'];
function miniMap(iso){
  const m=Q.cm[iso], adm=Q.sub.map[iso]; if(!m) return outlineSvg(iso);
  const K=relKit(iso,m,'k'); let s=`<svg viewBox="0 0 ${m.w} ${m.h}" role="img" aria-label="Map of ${esc(Q.ctry[iso].n)}">${K.head}<g class="kidp">`;
  if(m.areas){ const mx=Math.max(1,...m.areas.map(a=>a[3])); s+=m.areas.map(a=>a[3]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[3],mx)}" ${tipA(a[1]+', '+a[2],fmt(a[3])+' internally displaced people')}/>`:'').join('') }
  else if(m.states){ const mx=Math.max(1,...m.states.map(a=>a[4])); s+=m.states.map(a=>a[4]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[4],mx)}" ${tipA(a[1],fmt(a[4])+' internally displaced people')}/>`:'').join('') }
  s+='</g>'+K.rel('l','ov')+'<g>'+(adm?adm.areas.map(a=>`<path class="so ka" data-n="${esc(a.n)}" d="${a.d}"/>`).join(''):'')+(m.states?m.states.map(a=>`<path class="so ka" data-n="${esc(a[1])}" d="${a[0]}"/>`).join(''):'')+(m.areas?m.areas.map(a=>`<path class="so ka fine" data-n="${esc(a[1])}" d="${a[0]}"/>`).join(''):'')+'</g>';
  const big=m.pts.length>800;
  s+='<g>'+m.pts.map(p=>ptMark('kp',p,big?1.8:3.3,`data-r="${big?1.8:3.3}" fill="${GCOL[p[2]]}" ${p[4]?tipA(p[4],GN[p[2]]+' location'):''}`)).join('')+'</g>';
  s+='<g>'+(adm?adm.camps.map(c=>`<circle class="kc" cx="${c.x}" cy="${c.y}" r="9" ${tipA(c.n,'Sampled by this survey')}/>`).join(''):'')+'</g>';
  return s+'</svg>';
}
function coverMap(id){
  const root=document.querySelector('.kmap'), leg=$('kleg'); if(!root||!leg) return;
  const iso=gSel, c=Q.ctry[iso], m=Q.cm[iso], e=id!=null?c.ex.find(x=>x[0]===+id):null;
  const gs=e?(e[7]?e[7].split(', '):[]):null, idx=gs?new Set(gs.map(g=>GN.indexOf(g)).filter(i=>i>=0)):null, names=e&&e[11]?e[11].toLowerCase().split('|'):[];
  if(idx&&idx.has(0)) idx.add(3);
  const cnt=[0,0,0,0,0,0]; let lit=0;
  root.querySelectorAll('.kp').forEach(p=>{ const g=+p.dataset.g; cnt[g]++; const on=!idx||idx.has(g)||(p.dataset.n&&names.includes(p.dataset.n.toLowerCase())); if(on&&idx) lit++; p.style.opacity=on?(idx?1:.8):.07; ptSize(p,on&&idx?+p.dataset.r*1.35:+p.dataset.r) });
  const idp=root.querySelector('.kidp'); if(idp) idp.style.opacity=!idx?1:idx.has(2)?1:.1;
  let named=0; root.querySelectorAll('.ka').forEach(p=>{ const on=names.includes(p.dataset.n.toLowerCase()); if(on) named++; p.classList.toggle('hit',on) });
  const src=e?Q.exsrc[e[0]]:null, sampled=!!(src&&Q.sub.val[iso]&&surveysOf(iso).has(src)); root.querySelectorAll('.kc').forEach(k=>k.style.opacity=sampled?1:0);
  const row=(col,txt,dm)=>`<span><i class="d" style="background:${col};${dm?diam:''}"></i>${txt}</span>`;
  if(!e){ leg.innerHTML=`<div class="mleg" style="margin-top:0">${cnt[0]+cnt[3]?row(GCOL[0],fmt(cnt[0]+cnt[3])+' refugee locations'):''}${cnt[2]?row(GCOL[2],fmt(cnt[2])+' IDP locations',1):''}${cnt[4]?row(GCOL[4],fmt(cnt[4])+' stateless'):''}${m&&m.states?`<span><i class="g"></i>IDPs by ${esc(m.areas?m.lay.unit:m.lay.parent)}</span>`:''}</div>`
      +(c.pop?`<p class="lnote">${fmt(c.pop[1])} refugees and asylum-seekers · ${fmt(c.pop[2])} internally displaced · ${fmt(c.pop[3])} stateless, end of ${c.pop[0]}</p>`:''); return }
  const miss=gs.filter(g=>{const i=GN.indexOf(g); return i<0||(!cnt[i]&&!(i===0&&cnt[3])&&!(i===2&&m&&m.states))});
  leg.innerHTML=`<p style="font-size:13px"><b style="font-weight:600">On the map:</b> ${gs.length?'where the groups this example covers are located':'this example does not record which groups it covers'}.</p>
    <div class="mleg" style="margin-top:0">${gs.map(g=>{const i=GN.indexOf(g); return `<span><i class="d" style="background:${i>=0?GCOL[i]:'#8b98b3'};${i===2?diam:''}"></i>${esc(g)}</span>`}).join('')}${sampled?'<span><i class="d" style="border:2px solid #fff"></i>camps the survey sampled</span>':''}${named?`<span><i class="d" style="border:2px solid var(--gold)"></i>${esc(e[11].replace(/\|/g,', '))}</span>`:''}</div>
    ${miss.length?`<p class="lnote">No mapped locations for: ${esc(miss.join(', ').toLowerCase())}.</p>`:''}`;
}
function recSet(e){ const x=Q.gx[e[0]]; if(x&&x.rc) return x.rc; const r=e[12]; if(r==='IRRS'||r==='IRIS'||r==='IROSS') return [r]; if(!e[4]) return []; const g=e[7]||''; const o=[]; if(/Refugees|Asylum/.test(g)) o.push('IRRS'); if(/IDPs/.test(g)) o.push('IRIS'); if(/Stateless/.test(g)) o.push('IROSS'); return r==='Mixed use'?o:[] }
const RECS={IRRS:'International Recommendations on Refugee Statistics (IRRS)',IRIS:'International Recommendations on IDP Statistics (IRIS)',IROSS:'International Recommendations on Statelessness Statistics (IROSS)','Mixed use':'More than one set of Recommendations',Undetermined:'Not determined'};
function exOpen(e,iso,noBack){ const k=exLinks(iso,e[0]), c=Q.ctry[iso], x=Q.gx[e[0]]||{}, pills=a=>a.map(t=>`<i class="pill plain">${esc(t)}</i>`).join(' ');
  const row=(k_,v,tip)=>v?`<tr><th>${k_}</th><td ${tip?tipA(k_,tip)+' tabindex="0" style="cursor:help"':''}>${v}</td></tr>`:'';
  const basis=b=>b==='title'?'Read from the title of the example.':b==='none'?'':b?'Assigned from: '+esc(b)+'.':'';
  const also=[false&&k.rows?act('open-sdg',k.src,`SDG · ${k.rows.length} values`,'mini',`style="--lc:${LAYER.sdg.col}"`):false&&k.rep?act('open-sdg','__rep','SDG · values by state','mini',`style="--lc:${LAYER.sdg.col}"`):'',
              k.bs!=null?act('open-idq',k.bs,`ID Questions · ${itemsAsked(k.bs).length} of 13 items`,'mini',`style="--lc:${LAYER.idq.col}"`):'', k.src?act('ds',k.src,'Dataset','mini','style="--lc:var(--line2)"'):''].filter(Boolean).join('');
  return `<div class="exopen">${noBack?'':`<div>${act('exclose','','← All examples','lk')}</div>`}
    <div class="cover full">${e[9]?`<a href="covers/ex${e[0]}.jpg" target="_blank" rel="noopener" ${tipA('Cover','Open the full-size cover')}><img src="covers/ex${e[0]}.jpg" alt="Cover of the example" onerror="this.parentNode.style.display='none'"></a>`:''}<div style="display:flex;flex-direction:column;gap:6px;min-width:0"><span class="exmeta">GAIN ${e[1]} · EXAMPLE ${e[0]} · ${esc(c.n).toUpperCase()}</span><h2>${esc(e[2])}</h2><span style="font-size:13.5px;color:var(--soft)">${esc(e[3])}</span>
      <div>${e[4]?'<i class="pill ok">Uses the Recommendations</i>':'<i class="pill plain">Not using them, or not known</i>'}</div></div></div>
    ${e[10]?`<div><h3 style="margin-bottom:6px">What was reported</h3><p style="font-size:14px;color:var(--soft)">${esc(e[10])}${e[10].length>=400?'…':''}</p></div>`:''}
    <table class="meta gx">
      ${row('Reported in','GAIN Survey '+e[1])}
      ${row('Led by',e[5]==='C'?'Country-led':'Institution-led')}
      ${row('Timing',x.t?(x.t[1]==='9999'?'Since '+x.t[0]+', ongoing':x.t[1]&&x.t[1]!==x.t[0]?x.t[0]+' to '+x.t[1]:x.t[0]):'')}
      ${row('Stage',x.ph?`<i class="pill ${x.ph==='Completed'?'ok':'plain'}">${esc(x.ph)}</i>`:'')}
      ${row('Partners',x.pt?esc(x.pt):'')}
      ${row('Countries covered',x.cov?esc(x.cov):'')}
      ${row('Recommendations',e[4]?`<div class="recs">${recSet(e).map(k=>`<a href="recs/${k}.jpg" target="_blank" rel="noopener" ${tipA(k,esc(RECS[k]))}><img src="recs/${k}.jpg" alt="Cover of ${k}"></a>`).join('')}<span>${(Q.gx[e[0]]||{}).rc?recSet(e).map(k=>esc(RECS[k])).join('<br>'):esc(RECS[e[12]]||e[12]||'Used; which set is not recorded')}${e[12]==='Mixed use'&&recSet(e).length&&!(Q.gx[e[0]]||{}).rc?'<br><small class="lnote">Covers shown by the groups this example covers.</small>':''}</span></div>`:'Not used, or not known')}
      ${row('Data sources',e[13]?e[13].split(', ').map(t=>`<i class="pill plain">${esc(t)}</i>`).join(' '):'')}
      ${row('How it counted',e[6]?e[6].split(', ').map(t=>`<i class="pill plain">${esc(t)}</i>`).join(' '):'<span class="lnote">not recorded</span>',basis(e[14]))}
      ${row('Who it covered',e[7]?e[7].split(', ').map(t=>`<i class="pill plain">${esc(t)}</i>`).join(' '):'<span class="lnote">not recorded</span>',basis(e[15]))}
      ${row('Other groups',x.og?esc(x.og):'')}
      ${row('Places named',e[11]?esc(e[11].replace(/\|/g,', ')):'')}
      ${row('Identification',x.id?pills(x.id)+(x.ido?`<br><small class="lnote">${esc(x.ido)}</small>`:''):'','The concepts this example said it used to identify the population: the same ones the identification questions module covers.')}
      ${row('How it was used',x.use?esc(x.use):'')}
      ${row('Publication',x.pub?`<a href="${esc(x.pub)}" target="_blank" rel="noopener">Open the publication ↗</a>`:'')}
      ${row('Source',e[8]?`<a href="${esc(e[8])}" target="_blank" rel="noopener">Open the source ↗</a>`:'<span class="lnote">no link recorded</span>')}
    </table>
    ${also?`<div class="also"><span>Also in</span>${also}</div>`:''}</div>`;
}
function causesBlock(c,inter){
  const cz=[...c.cz].sort((a,b)=>a[0]-b[0]), mx=Math.max(1,...cz.map(z=>z[3]||0)), tot=cz.reduce((s,z)=>s+(z[3]||0),0);
  if(!cz.length) return '';
  const st={RECOMMENDED:['ok','Recorded here','Displacement for this reason is recorded in this country, so interviewers can give local examples.'],LOW_SALIENCE:['plain','Little recorded','Little displacement for this reason is recorded in this country.'],RESIDUAL:['plain','Always offered','A catch-all answer that stays in the list in every country.'],UNEVIDENCED:['tbc','No data source','No source records displacement for this reason, so it cannot be checked.']};
  return `<div class="band"><div class="lhead"><h2>Why people were displaced</h2><span class="lnote">the eight reasons offered in the first identification question, and the people each displaced in ${esc(c.n)}</span></div>
    ${c.dp?`<div class="ptiles"><div><b>${fmt(tot)}</b><span>Displaced, with a recorded reason</span></div><div><b>${(v=>v?fmt(v):'None reported')(c.dp[0]||(c.pop?c.pop[2]:0))}</b><span>Internally displaced</span></div><div><b>${c.dp[1]?fmt(c.dp[1]):'None reported'}</b><span>Refugees hosted</span></div></div>`:''}
    <div>${cz.map(z=>{const sub=Q.subr[z[0]]||[]; return `<${inter?`button type="button" data-act="cz" data-v="${z[0]}" data-czh="${z[0]}" aria-pressed="${czSel===z[0]}"`:'div tabindex="0"'} class="czr" ${tipA(z[0]+' · '+CZ[z[0]],(z[2]?'<b>In the sources:</b> '+esc(z[2])+'<br>':'')+(sub.length?'<b>How people say it:</b><br>'+sub.slice(0,4).map(x=>'“'+esc(x[2])+'”').join('<br>'):''))}><span class="czn"><i class="sw" style="background:${CAUSE_COL[z[0]]}"></i>${z[0]} · ${CZ[z[0]]}</span><span class="czb"><i style="width:${z[3]?Math.max(2,z[3]/mx*100):0}%;background:${CAUSE_COL[z[0]]}"></i></span><span class="czv">${z[3]?fmt(z[3]):'–'}</span><i class="pill ${st[z[1]][0]}" title="${st[z[1]][2]}">${st[z[1]][1]}</i></${inter?'button':'div'}>`}).join('')}</div>
    <p class="lnote">Point at a reason for local examples and how people describe it${inter?'. Select it to show only that reason on the map':''}. The eight answer options are the same in every country; the figures only guide the examples interviewers give. Sources: IDMC, UCDP, ACLED and others.</p></div>`;
}
function regBlock(){ return Q.reg.length?`<details class="band"><summary style="cursor:pointer"><h3 style="display:inline">${Q.reg.length} regional and global examples</h3> <span class="lnote">from organisations, not tied to one country</span></summary><div class="exrows" style="max-height:420px;overflow-y:auto;margin-top:10px">${Q.reg.map(e=>`<${e[5]?`a href="${esc(e[5])}" target="_blank" rel="noopener"`:'div'} class="exr reg">${e[6]?`<img class="th" src="covers/ex${e[0]}.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<span class="th none"></span>'}<span class="tt"><span class="yr">${e[1]}</span><b>${esc(e[2])}</b><small>${esc(e[3])}</small></span><span class="mk">${e[5]?'<small style="color:var(--tealhi)">Open ↗</small>':''}</span></${e[5]?'a':'div'}>`).join('')}</div></details>`:'' }
const WS={gain:['GAIN story','https://mitrovif.github.io/GAIN-story/',i=>'#country-'+i],sdg:['SDG workstream','https://mitrovif.github.io/gain_sdg_workstream/',i=>'sdg-map.html'],idq:['ID Questions workstream','https://mitrovif.github.io/idq-map/',i=>'questions.html?c='+i]};
const wsBtn=(L,iso)=>`<a class="wsbtn" href="${WS[L][1]+(iso?WS[L][2](iso):'')}" target="_blank" rel="noopener" style="--lc:${LAYER[L].col}" ${tipA('Full '+WS[L][0],L==='gain'?'The whole GAIN story'+(iso?', opened on this country':'')+', in a new tab.':L==='sdg'?'The full SDG site'+(iso?': the country map with every value':': globe, country map and methods')+', in a new tab.':'The full identification-questions site'+(iso?': the questionnaire built for this country':': map, crosswalk and questionnaire builder')+', in a new tab.')}>Open the full ${WS[L][0]} ↗</a>`;
const OVER={gain:['Examples of refugee, IDP and statelessness statistics','What countries and organisations reported to the GAIN survey, 2021 to 2025.'],sdg:['SDG indicators for displaced people','Values for refugees, IDPs and stateless people next to the host population, with how each one was calculated.'],idq:['How surveys identify refugees and IDPs','Questionnaires compared with the EGRISS identification questions, and the reasons people were displaced.']};
function pOverview(){
  const L=layer, list=Object.keys(Q.ctry).filter(i=>L==='gain'?exF(i).length:has(i,L)).sort((a,b)=>Q.ctry[a].n.localeCompare(Q.ctry[b].n));
  const cnt=i=>L==='gain'?exF(i).length+(exF(i).length===1?' example':' examples'):L==='sdg'?(n=>n+(n===1?' value':' values'))(sdgRows(i).length+Q.ctry[i].rep.length):(Q.ctry[i].sv.length?Q.ctry[i].sv.length+(Q.ctry[i].sv.length===1?' questionnaire':' questionnaires'):'reasons for displacement');
  const fo=L==='gain'&&gfOn(), nEx=list.reduce((s,i)=>s+exF(i).length,0), nUse=list.reduce((s,i)=>s+exF(i).filter(e=>e[4]).length,0)+(fo?0:Q.reg.filter(e=>e[4]).length);
  const tiles=L==='gain'?[[nEx+(fo?0:Q.reg.length),fo?'examples match the filters':'examples'],[list.length,'countries'],[nUse,'use the Recommendations']]
    :L==='sdg'?[[list.reduce((s,i)=>s+sdgRows(i).length+Q.ctry[i].rep.length,0),'values'],[list.length,'countries'],[Q.sdg.filter(d=>d.rows.length).length,'indicators calculated from survey files']]
    :[[Q.surveys.length,'questionnaires compared'],[list.filter(i=>Q.ctry[i].sv.length).length,'countries with a questionnaire'],[list.filter(i=>Q.ctry[i].cz.some(z=>z[3]>0)).length,'countries with reasons for displacement']];
  return `<div class="chead" style="--lc:${LAYER[L].col}"><div><p class="eyebrow" style="color:var(--lc)">${LAYER[L].n}</p><h2>${OVER[L][0]}</h2></div><span style="margin-left:auto">${wsBtn(L)}</span></div>
   <div class="band"><p style="color:var(--soft)">${OVER[L][1]}</p><div class="ptiles" style="margin-top:12px">${tiles.map(x=>`<div><b>${fmt(x[0])}</b><span>${x[1]}</span></div>`).join('')}</div></div>
   <div class="band"><h3>Choose a country</h3><p class="lnote" style="margin:4px 0 10px">Select one on the globe, or find it here.</p><input id="cfind" class="cfind" type="search" placeholder="Type a country name" aria-label="Find a country" autocomplete="off">
     <div class="clist" id="cfl" style="max-height:330px;overflow-y:auto;margin-top:10px">${list.map(i=>`<button class="crow" type="button" data-act="pick" data-v="${i}"><span>${esc(Q.ctry[i].n)}</span><span>${cnt(i)}</span></button>`).join('')}</div><p class="lnote" id="cfnone" hidden style="margin-top:8px">No country with that name in ${LAYER[L].n}. Check the spelling or try another layer.</p>
     ${L==='idq'?'<p class="lnote" style="margin-top:8px">EHCVM 2026 covers 10 countries and is not on the map yet.</p>':''}</div>`
   +(L==='gain'?regBlock():'');
}
document.addEventListener('input',e=>{ if(e.target.id!=='cfind') return; const q=e.target.value.trim().toLowerCase(); let n=0; $('cfl').querySelectorAll('.crow').forEach(b=>{ const on=b.firstChild.textContent.toLowerCase().includes(q); b.hidden=!on; n+=on }); $('cfnone').hidden=n>0 });
function repCard(x){ const pg=x[9]||x[4];
  return `<div class="rcard" style="--gc:${gcolOf(x[0])}"><div class="itop">${goalTile(x[0])}<span><b style="font-weight:600">${esc((Q.sdg.find(d=>d.c===x[0])||{n:'Indicator '+x[0]}).n)}</b><br><small>${esc(x[2])}</small></span><b class="rv">${esc(x[1])}</b></div>
    ${x[13]?`<div class="fl"><i class="pill flag">Check</i><span>The report page says something different: ${esc(x[13])}</span></div>`:''}
    ${x[6]?`<figure class="prt"><a href="${x[6]}" target="_blank" rel="noopener" ${tipA('From the report','Open the page image at full size')}><img loading="lazy" src="${x[6]}" width="${x[7]}" height="${x[8]}" alt="Report page showing the value${pg?', page '+pg:''}"></a></figure>`:''}
    <p class="rsrc">${esc(x[11]||x[3])}${x[12]?' · '+esc(x[12]):''}${pg?' · page '+esc(pg):''}${x[10]?` · <a href="${esc(x[10])}" target="_blank" rel="noopener">Open the report ↗</a>`:''}</p></div>` }
/* ---- small charts under the globe ---- */
const FWC={IRRS:'#8db8e3',IRIS:'#3f78d6',IROSS:'#e3c3a0','Mixed use':'#d7dde6',Undetermined:'#8b98b3'}, LEADC={C:'#5b8fd9',I:'#4cc3c9'};
const fwOf=e=>FWC[e[12]]?e[12]:'Undetermined';
let zChart=null;
/* ===== the story's dot charts: one dot per example, moving between the same layouts as in "Counted, and counting" ===== */
const SXC={BLUE:'#5b8fd9',TEAL:'#4cc3c9',RED:'#f06667',FW:['#8db8e3','#3f78d6','#e3c3a0','#d7dde6','#6b7a99'],FWL:['#8db8e3','#3f78d6','#e3c3a0','#d7dde6','#8b98b3']};
const SXK={cU:[SXC.BLUE,1],iU:[SXC.TEAL,1],cN:[SXC.BLUE,0],iN:[SXC.TEAL,0],lc:[SXC.RED,1],li:[SXC.TEAL,1],fw0:[SXC.FW[0],1],fw1:[SXC.FW[1],1],fw2:[SXC.FW[2],1],fw3:[SXC.FW[3],1],fw4:[SXC.FW[4],1],bg:['rgba(207,224,244,1)',1]};
const SXFW=['IRRS','IRIS','IROSS','Mixed use','Undetermined'], SXSN=['Survey','Administrative data','Census','Data integration','Non-traditional','Tools and other'], SXSNS=['Survey','Admin','Census','Integr.','Non-trad.','Tools'], SXRG=['Africa','Europe','Americas','Asia and Oceania','Middle East'], SXRGS=['Africa','Europe','Amer.','Asia','M. East'], SXMXC=[[0,1,2],[0,1],[0,2],[1,2]], SXMXN=['All three combined','IRRS + IRIS','IRRS + IROSS','IRIS + IROSS'];
let _sxr=null; const sxRows=()=>_sxr||(_sxr=Q.sx.map((r,i)=>({id:i,y:r[0],lead:r[1],fw:r[2],use:r[3],reg:r[4],src:r[5],mix:r[6],iso:r[7],title:r[8],org:r[9],country:r[10],pop:r[11]})));
const sxHash=(i,k)=>{ const v=Math.sin(i*12.9898+k*78.233)*43758.5453; return v-Math.floor(v) };
function sxTomb(n,per,p){ const R=per*p/2; let Hb=0, pts=[]; for(let guard=0;guard<400;guard++){ pts=[]; const rws=Math.ceil((Hb+R)/p)+1; for(let k=0;k<rws;k++){ const y=(k+.5)*p; for(let c=0;c<per;c++){ const x=(c-(per-1)/2)*p; if(y<=Hb||Math.hypot(x,y-Hb)<=R-.3*p) pts.push([x,y]) } } if(pts.length>=n) break; Hb+=p } return {pts,Hb,H:Hb+R} }
function sxBuild(lay,yr,by,W,H,small){
  const rows=sxRows(), pos=new Map(), deco=[], labels=[], g=small?{L:6,R:W-6,T:6,B:H-13}:{L:48,R:W-48,T:58,B:H-62};
  const put=(id,j,o)=>pos.set(id*8+j,o), yN=yr==='all'?null:+yr, lab=(x,y,t,al,col,sz,sans)=>labels.push({x,y,t:String(t),al:al||'center',col:col||'#fff',sz,sans:!!sans});
  let title='', legend=[], mode=yN?(yN===2025?'LATEST ROUND · GAIN 2025':'SINGLE ROUND · GAIN '+yN):'ALL ROUNDS · GAIN 2021–2025';
  if(lay==='bars'){ mode='ALL ROUNDS · GAIN 2021–2025';
    const band=(g.R-g.L)/5, per=4, pitch=Math.min(Math.min(64,band*.34)/4,(g.B-g.T-(small?6:40))/27), bw=per*pitch, gap=Math.max(small?2:6,pitch*.8);
    [2021,2022,2023,2024,2025].forEach((y,i)=>{ const gx=g.L+band*i+band/2;
      [0,1].forEach(ld=>{ const es=rows.filter(d=>d.y===y&&d.lead===ld).sort((a,b)=>(b.use-a.use)||(a.id-b.id)), xc=gx-bw/2-gap/2+ld*(bw+gap), T1=sxTomb(es.length,per,pitch), u=es.filter(d=>d.use).length, col=ld?SXC.TEAL:SXC.BLUE;
        es.forEach((d,k)=>put(d.id,0,{x:xc+T1.pts[k][0],y:g.B-T1.pts[k][1],r:pitch*.36,k:d.use?(ld?'iU':'cU'):(ld?'iN':'cN')}));
        if(es.length){ deco.push({t:'tomb',x:xc,w:bw+4,B:g.B+1,Hb:T1.Hb,fill:u?(u===es.length?T1.H:T1.pts[u-1][1]+pitch/2):0,c:col});
          if(!small){ lab(xc,g.B-T1.H-14,es.length,'center',col,15); lab(xc,g.B+13,u,'center','rgba(255,255,255,.9)',12) } } });
      lab(gx,g.B+(small?7:36),small?"'"+String(y).slice(2):y,'center','#fff',small?8:14) });
    title='EXAMPLES BY YEAR AND LEAD · 2021–2025'; legend=[['cU','Country-led, using'],['iU','Institution-led, using'],['cN','Not using / did not know']];
  } else if(lay==='donut'){
    const byLead=by==='lead', ORD=[0,1,4,3,2], list=rows.filter(d=>d.use&&(yN==null||d.y===yN));
    list.sort((a,b)=>byLead?((a.lead-b.lead)||(ORD.indexOf(a.fw)-ORD.indexOf(b.fw))||(a.id-b.id)):((ORD.indexOf(a.fw)-ORD.indexOf(b.fw))||(a.mix-b.mix)||(a.lead-b.lead)||(a.id-b.id)));
    const N=list.length||1, cx=(g.L+g.R)/2, cy=(g.T+g.B)/2+(small?0:10), rO=small?Math.min((g.R-g.L)/2,(g.B-g.T)/2)-1:Math.max(70,Math.min((g.R-g.L)/2-190,(g.B-g.T)/2-24)), rowsN=N<=130?3:5;
    let p=small?9:30, pts=[]; for(let guard=0;guard<200;guard++){ pts=[]; for(let q=0;q<rowsN;q++){ const rk=rO-(q+.5)*p; if(rk<p) continue; const nk=Math.floor(6.2832*rk/p); for(let m=0;m<nk;m++) pts.push([(m+.5+q*.33)/nk*6.2832,rk]) } if(pts.length>=N||p<=1.5) break; p-=.25 }
    pts.sort((a,b)=>a[0]-b[0]);
    list.forEach((d,k)=>{ const s=pts[Math.min(pts.length-1,Math.floor((k+.5)*pts.length/N))]; put(d.id,0,{x:cx+Math.sin(s[0])*s[1],y:cy-Math.cos(s[0])*s[1],r:p*.38,k:byLead?(d.lead?'li':'lc'):'fw'+d.fw,mx:!byLead&&d.fw===3&&d.mix>=0?SXMXC[d.mix]:null}) });
    const band0=rO-rowsN*p-3, band1=rO+3, rin=band0-(small?7:26), nC=list.filter(d=>!d.lead).length, nI=list.length-nC;
    const groups=byLead?[{n:nC,name:'Country-led',col:SXC.RED},{n:nI,name:'Institution-led',col:SXC.TEAL}]:ORD.map(fw=>({n:list.filter(d=>d.fw===fw).length,name:fw===3?'Mixed use':SXFW[fw],col:SXC.FWL[fw],fw}));
    if(byLead){ let a=0; ORD.forEach(fw=>{ const n=list.filter(d=>d.fw===fw).length; if(n) deco.push({t:'arc',cx,cy,r:rin,a0:a/N,a1:(a+n)/N,c:SXC.FWL[fw],w:small?4:12,al:.3}); a+=n }) }
    else { if(nC) deco.push({t:'arc',cx,cy,r:rin,a0:0,a1:nC/N,c:SXC.RED,w:small?5:22,al:1}); if(nI) deco.push({t:'arc',cx,cy,r:rin,a0:nC/N,a1:1,c:SXC.TEAL,w:small?5:22,al:1}) }
    let acc=0; groups.forEach(gr=>{ if(!gr.n) return; const f0=acc/N, f1=(acc+gr.n)/N; acc+=gr.n; deco.push({t:'sector',cx,cy,r0:band0,r1:band1,a0:f0+.004,a1:f1-.004,c:gr.col});
      if(small) return; const mid=(f0+f1)/2*6.2832, side=Math.sin(mid)>=0?1:-1, bx=cx+Math.sin(mid)*band1, by2=cy-Math.cos(mid)*band1, ex=cx+Math.sin(mid)*(band1+16), ey=cy-Math.cos(mid)*(band1+16), hx=Math.max(90,Math.min(W-90,side>0?Math.max(ex+14,cx+band1+74):Math.min(ex-14,cx-band1-74)));
      deco.push({t:'leader',pts:[[bx,by2],[ex,ey],[hx,ey]],c:gr.col}); lab(hx+side*8,ey-7,gr.n,side>0?'left':'right',gr.col,24); lab(hx+side*8,ey+14,gr.name,side>0?'left':'right','#cfe0f4',12);
      if(gr.fw===3) SXMXN.map((nm,m)=>[list.filter(d=>d.fw===3&&d.mix===m).length,nm]).filter(x=>x[0]).forEach((x,i)=>lab(hx+side*8,ey+30+i*14,x[0]+'  '+x[1],side>0?'left':'right','#cfe0f4',10.5)) });
    lab(cx,cy-(small?0:6),list.length,'center','#fff',small?15:(list.length>99?54:64),true); if(!small) lab(cx,cy+34,'examples','center','#cfe0f4',12);
    title='EXAMPLES USING THE RECOMMENDATIONS · '+(yN||'2021–2025')+(byLead?' · BY LEAD':' · BY RECOMMENDATIONS');
    legend=byLead?[['','Circles: who led the example'],['lc','Country-led '+nC],['li','Institution-led '+nI],['','Faded inner ring: the Recommendations applied']]
      :[['','Circles: Recommendations applied'],['fw0','IRRS'],['fw1','IRIS'],['fw2','IROSS'],['fw3','Mixed use (circle split)'],['fw4','Undetermined'],['','Inner ring: who led the example'],['lc','Country-led '+nC],['li','Institution-led '+nI]];
  } else if(lay==='regions'){
    const cats=[4,3,2,1,0], bk=cats.map(()=>[]); rows.forEach(d=>{ if((yN==null||d.y===yN)&&d.lead===0&&d.use&&d.reg>=0) bk[cats.indexOf(d.reg)].push(d) });
    const maxN=Math.max(1,...bk.map(b=>b.length)), rowH=Math.min(small?19:76,(g.B-g.T+(small?10:0))/5), top=g.T+((g.B-g.T+(small?10:0))-rowH*5)/2, x0=g.L+(small?34:200), per2=maxN>40?4:2, pitch2=Math.min(16,rowH*.7/per2,(g.R-(small?16:50)-x0)/Math.ceil(maxN/per2));
    bk.forEach((b,qi)=>{ b.sort((a,c)=>(a.y-c.y)||(a.id-c.id)); const yc=top+qi*rowH+rowH/2;
      b.forEach((d,k)=>put(d.id,0,{x:x0+(Math.floor(k/per2)+.5)*pitch2,y:yc+(k%per2-(per2-1)/2)*pitch2,r:pitch2*.38,k:'cU'}));
      const wv=Math.ceil(b.length/per2)*pitch2; if(b.length) deco.push({t:'pill',x:x0,y:yc-pitch2*per2/2-2,w:wv+4+pitch2/2,h:pitch2*per2+4,c:SXC.BLUE});
      deco.push({t:'hit',reg:cats[qi],x0:0,x1:W,y0:yc-rowH/2,y1:yc+rowH/2});
      lab(x0-(small?4:14),yc,small?SXRGS[cats[qi]]:SXRG[cats[qi]],'right','#cfe0f4',small?7.5:13,true); lab(x0+wv+(small?5:12),yc,b.length,'left','#fff',small?8:15) });
    title='COUNTRY-LED EXAMPLES USING THE RECOMMENDATIONS, BY REGION · '+(yN||'2021–2025'); legend=[['cU','Country-led, using']];
  } else if(lay==='sources'){ if(!yN) mode='ALL ROUNDS · GAIN 2024–2025';
    const bk=SXSN.map(()=>[]); rows.forEach(d=>{ if((yN==null||d.y===yN)&&d.lead===0) d.src.forEach((c,j)=>{ if(bk[c]) bk[c].push([d,j]) }) });
    const maxB=Math.max(1,...bk.map(b=>b.length)), band3=(g.R-g.L)/6, per3=maxB>45?6:4, pitch3=Math.min(18,Math.min(72,band3*.6)/per3,(g.B-g.T-(small?6:40))/(Math.ceil(maxB/per3)+per3/2));
    bk.forEach((b,ci)=>{ b.sort((a,c)=>(c[0].use-a[0].use)||(a[0].y-c[0].y)||(a[0].id-c[0].id)); const xc=g.L+band3*ci+band3/2, u3=b.filter(it=>it[0].use).length, T3=sxTomb(b.length,per3,pitch3);
      b.forEach((it,k)=>put(it[0].id,it[1],{x:xc+T3.pts[k][0],y:g.B-T3.pts[k][1],r:pitch3*.36,k:(it[0].use?'cU':'cN')+(it[0].src.length>1?'m':'')}));
      if(b.length){ deco.push({t:'tomb',x:xc,w:per3*pitch3+4,B:g.B+1,Hb:T3.Hb,fill:u3?(u3===b.length?T3.H:T3.pts[u3-1][1]+pitch3/2):0,c:SXC.BLUE});
        if(!small){ lab(xc,g.B-T3.H-14,b.length,'center',SXC.BLUE,15); lab(xc,g.B+13,u3,'center','rgba(255,255,255,.9)',12) } }
      lab(xc,g.B+(small?7:36),small?SXSNS[ci]:SXSN[ci],'center','#fff',small?6.5:12,true) });
    if(yN!=null&&yN<2024&&!small) lab((g.L+g.R)/2,g.T-18,'Data sources were first asked in GAIN 2024. Pick 2024, 2025 or All years.','center','#e0a93b',14,true);
    title='DATA SOURCES OF COUNTRY-LED EXAMPLES · '+(yN||'2024–2025')+' · MULTIPLE CHOICE, ONE ENTRY PER ANSWER';
    legend=[['cU','Example using the Recommendations'],['cN','Not using / did not know'],['cUm','White ring: reported several sources']];
  }
  return {pos,deco,labels,title,legend,mode};
}
function sxDot(ctx,x,y,r,key,mx,al){ if(al<.01) return; const m=key.length>2&&key.endsWith('m'), base=SXK[m?key.slice(0,-1):key]||SXK.cU; r=Math.max(.8,r); ctx.globalAlpha=al; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832);
  if(base[1]){ ctx.fillStyle=base[0]; ctx.fill() } else { ctx.strokeStyle=base[0]; ctx.lineWidth=Math.min(1.3,r*.5); ctx.stroke() }
  if(mx) mx.forEach((f,i)=>{ ctx.beginPath(); ctx.moveTo(x,y); ctx.arc(x,y,r,-1.5708+i/mx.length*6.2832,-1.5708+(i+1)/mx.length*6.2832); ctx.closePath(); ctx.fillStyle=SXC.FW[f]; ctx.fill() });
  if(m){ ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1; ctx.stroke() } }
function sxDeco(ctx,d,al){ ctx.save(); const A=a=>a*6.2832-1.5708;
  if(d.t==='tomb'){ const R=d.w/2, path=()=>{ ctx.beginPath(); ctx.moveTo(d.x-R,d.B); ctx.lineTo(d.x-R,d.B-d.Hb); ctx.arc(d.x,d.B-d.Hb,R,Math.PI,0); ctx.lineTo(d.x+R,d.B); ctx.closePath() };
    if(d.fill>0){ ctx.save(); ctx.beginPath(); ctx.rect(d.x-R-2,d.B-d.fill,d.w+4,d.fill+2); ctx.clip(); path(); ctx.globalAlpha=.2*al; ctx.fillStyle=d.c; ctx.fill(); ctx.restore() }
    path(); ctx.globalAlpha=.8*al; ctx.strokeStyle=d.c; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke() }
  else if(d.t==='pill'){ const r=d.h/2; ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x+d.w-r,d.y); ctx.arc(d.x+d.w-r,d.y+r,r,-1.5708,1.5708); ctx.lineTo(d.x,d.y+d.h); ctx.closePath(); ctx.globalAlpha=.16*al; ctx.fillStyle=d.c; ctx.fill() }
  else if(d.t==='sector'){ ctx.beginPath(); ctx.arc(d.cx,d.cy,d.r1,A(d.a0),A(d.a1)); ctx.arc(d.cx,d.cy,d.r0,A(d.a1),A(d.a0),true); ctx.closePath(); ctx.globalAlpha=.1*al; ctx.fillStyle=d.c; ctx.fill(); ctx.globalAlpha=.85*al; ctx.strokeStyle=d.c; ctx.lineWidth=1.2; ctx.stroke() }
  else if(d.t==='arc'){ ctx.beginPath(); ctx.arc(d.cx,d.cy,d.r,A(d.a0)+.01,A(d.a1)-.01); ctx.globalAlpha=d.al*al; ctx.strokeStyle=d.c; ctx.lineWidth=d.w; ctx.stroke() }
  else if(d.t==='leader'){ ctx.beginPath(); d.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.globalAlpha=.8*al; ctx.strokeStyle=d.c; ctx.lineWidth=1; ctx.stroke() }
  ctx.restore() }
function sxLabels(ctx,labels,al){ ctx.globalAlpha=al; ctx.textBaseline='middle'; labels.forEach(l=>{ ctx.font=(l.sans?(l.sz>30?'600 ':'400 ')+l.sz+'px Figtree, system-ui, sans-serif':'500 '+l.sz+'px "IBM Plex Mono", ui-monospace, monospace'); ctx.textAlign=l.al; ctx.fillStyle=l.col; if(l.rot){ ctx.save(); ctx.translate(l.x,l.y); ctx.rotate(l.rot*Math.PI/180); ctx.fillText(l.t,0,0); ctx.restore() } else ctx.fillText(l.t,l.x,l.y) }); ctx.globalAlpha=1 }
function sxCanvas(cv,W,H){ const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; cv.style.width=W+'px'; cv.style.height=H+'px'; const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return ctx }
/* small still previews in the tiles under the globe */
function sxThumbs(){ document.querySelectorAll('canvas[data-sx]').forEach(cv=>{ const W=Math.max(120,cv.parentNode.clientWidth), H=118, ctx=sxCanvas(cv,W,H), b=sxBuild(cv.dataset.sx,cv.dataset.yr||'2025','fw',W,H,true);
  ctx.clearRect(0,0,W,H); b.deco.forEach(d=>sxDeco(ctx,d,1)); b.pos.forEach(o=>sxDot(ctx,o.x,o.y,o.r,o.k,o.mx,1)); sxLabels(ctx,b.labels,1) }) }
/* the full interactive chart */
const SX={lay:'bars',yr:'2025',by:'fw',P:null,hover:null,reg:null,raf:0,last:0,labA:0,key:'',b:null,W:0,H:0};
function sxShell(){
  const z=$('zoomer'), [W,H]=chSize(); SX.W=W; SX.H=H;
  const b=sxBuild(SX.lay,SX.yr,SX.by,W,H,false), seg=(a,v,t,on)=>`<button type="button" class="chip" data-act="${a}" data-v="${v}" aria-pressed="${on}">${t}</button>`;
  z.innerHTML=`<div class="zbox sxbox" role="dialog" aria-modal="true" aria-label="GAIN examples, chart"><div class="zhead"><div><p class="eyebrow" style="color:${LAYER.gain.col}">${b.mode}</p><h2 style="font-size:15px;font-family:var(--mono);font-weight:500;letter-spacing:.06em;color:#8db8e3">${b.title}</h2></div><span class="zact">${act('ztab','',zTab?'Show as chart':'Show as table','chip',`aria-pressed="${zTab}"`)}<button type="button" class="x" data-act="zclose">Close ✕</button></span></div>
    <div class="sxctl"><span>Show</span>${seg('sxl','bars','By year',SX.lay==='bars')}${seg('sxl','donut','Donut',SX.lay==='donut')}${seg('sxl','regions','Regions',SX.lay==='regions')}${seg('sxl','sources','Data sources',SX.lay==='sources')}
      ${SX.lay!=='bars'?`<span style="margin-left:14px">Year</span>${seg('sxy','all','All years',SX.yr==='all')}${[2021,2022,2023,2024,2025].map(y=>seg('sxy',y,y,String(SX.yr)===String(y))).join('')}`:''}
      ${SX.lay==='donut'?`<span style="margin-left:14px">Split by</span>${seg('sxb','fw','Recommendations',SX.by==='fw')}${seg('sxb','lead','Lead',SX.by==='lead')}`:''}</div>
    ${zTab?sxTable(W,H):`<div class="sxwrap" style="width:${W}px;height:${H}px"><canvas id="sxcv" role="img" aria-label="${esc(b.title)}"></canvas><div id="sxpv" hidden></div></div>`}
    <div class="zleg">${b.legend.map(l=>l[0]?`<span><i class="d ${SXK[l[0].replace(/m$/,'')][1]?'':'ring'}" style="--c:${SXK[l[0].replace(/m$/,'')][0]};${l[0].endsWith('m')&&l[0].length>2?'outline:1.5px solid #fff':''}"></i>${l[1]}</span>`:`<b>${l[1]}</b>`).join('')}<span><i class="d" style="--c:rgba(207,224,244,.3)"></i>Faint dots: other years or not in this chart</span></div>
    <p class="lnote">One circle is one example. Point at a circle to read it. Select it to open the example in its country.${SX.lay==='regions'?' Point at a region to pick it out.':''}</p></div>`;
  z.hidden=false; if(zTab) return; const cv=$('sxcv'); SX.ctx=sxCanvas(cv,W,H); SX.b=b; SX.labA=0; SX.hover=null; SX.reg=null;
  if(!SX.P){ SX.P=[]; sxRows().forEach(d=>{ const n=Math.max(1,d.lead===0?d.src.length:0); for(let j=0;j<n;j++) SX.P.push({id:d.id,j,x:sxHash(d.id,1)*W,y:-30-sxHash(d.id,2)*H*1.2,r:2,a:0,k:'cU',mx:null,rate:.05+sxHash(d.id*7+j,13)*.07}) }) }
  cv.addEventListener('mousemove',sxMove); cv.addEventListener('mouseleave',()=>{ SX.hover=null; SX.reg=null; $('sxpv').hidden=true; cv.style.cursor='default' }); cv.addEventListener('click',sxTap);
  if(!SX.raf){ SX.last=performance.now(); SX.raf=requestAnimationFrame(sxTick) }
}
function sxNearest(e){ const r=e.currentTarget.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; let best=null, bd=1e9; for(const p of SX.P){ if(p.a<.12||p.j&&!SX.b.pos.has(p.id*8+p.j)) continue; const d=Math.hypot(p.x-x,p.y-y); if(d<Math.max(8,p.r+4)&&d<bd){ bd=d; best=p } } return [best,x,y] }
function sxMove(e){ const [p,x,y]=sxNearest(e), cv=e.currentTarget, pv=$('sxpv'); let reg=null;
  if(!p&&SX.lay==='regions'){ const h=SX.b.deco.find(d=>d.t==='hit'&&y>=d.y0&&y<d.y1); if(h) reg=h.reg } SX.reg=reg;
  cv.style.cursor=p||reg!=null?'pointer':'default';
  if(!p){ SX.hover=null; pv.hidden=true; return } if(SX.hover===p.id&&!pv.hidden) return; SX.hover=p.id;
  const d=sxRows()[p.id], mixN=['IRRS + IRIS + IROSS','IRRS + IRIS','IRRS + IROSS','IRIS + IROSS'], rec=d.use?(d.fw===3?(d.mix>=0?mixN[d.mix]:'Mixed use'):SXFW[d.fw]):'';
  pv.innerHTML=`<span class="exmeta">GAIN ${d.y} · ${esc(d.country||'Regional / global')} · ${d.lead?'Institution-led':'Country-led'}</span><b>${esc(d.title||'Untitled example')}</b><small>${esc(d.org||'Organisation not reported')}</small><div class="chips2">${(d.pop||'').split(' · ').filter(Boolean).slice(0,3).map(t=>`<i>${esc(t)}</i>`).join('')}${d.use?`<i class="rc" style="background:${SXC.FWL[d.fw]};color:#0a1430">${rec}</i>`:'<i class="off">Not using the Recommendations, or not known</i>'}</div><small class="hint">${d.iso&&Q.ctry[d.iso]?'Select the circle to open the example':'Regional or global example'}</small>`;
  pv.hidden=false; const pw=Math.min(300,SX.W-24), ph=pv.offsetHeight||150; let px=p.x+20; if(px+pw>SX.W-8) px=p.x-20-pw; pv.style.width=pw+'px'; pv.style.left=Math.max(8,px)+'px'; pv.style.top=Math.max(8,Math.min(SX.H-ph-8,p.y-50))+'px' }
function sxTap(e){ const [p]=sxNearest(e); if(p) sxOpen(p.id) }
function sxOpen(id){ const d=sxRows()[id], iso=d.iso;
  if(iso&&Q.ctry[iso]&&Q.ctry[iso].ex.some(x=>x[0]===d.id+1)){ zChart=null; Object.keys(GF).forEach(k=>GF[k]=null); layer='gain'; level='world'; chosen=true; gSel=iso; fSrc=fInd=fSv=mapInd=null; fEx=d.id+1; render(); const c=G.by[iso]; if(c&&c.cen&&view==='3d') gTo({rot:[-c.cen[0],Math.max(-40,Math.min(40,-c.cen[1]))],k:G.k,tr:G.tr,alpha:0},[750,1500,1.8]); $('panel').scrollIntoView({block:'start',behavior:RM?'auto':'smooth'}) }
  else { const r=Q.reg.find(x=>x[0]===d.id+1); if(r&&r[5]) window.open(r[5],'_blank','noopener') } }
function sxTick(now){ SX.raf=0; const z=$('zoomer'); if(z.hidden||zChart!=='sx'||!$('sxcv')) return; const dt=Math.min(64,now-SX.last); SX.last=now;
  const b=SX.b, ctx=SX.ctx, W=SX.W, H=SX.H, first={}; SX.labA+=(1-SX.labA)*(RM?1:1-Math.pow(.9,dt/16.7));
  ctx.setTransform(Math.min(2,window.devicePixelRatio||1),0,0,Math.min(2,window.devicePixelRatio||1),0,0); ctx.clearRect(0,0,W,H);
  b.deco.forEach(d=>sxDeco(ctx,d,SX.labA));
  const rows=sxRows(), ringE=SX.hover;
  for(const p of SX.P){ const t=b.pos.get(p.id*8+p.j), k=RM?1:1-Math.pow(1-p.rate,dt/16.7); let tx,ty,tr,ta;
    if(t){ tx=t.x; ty=t.y; tr=t.r; ta=SX.lay==='regions'&&SX.reg!=null&&rows[p.id].reg!==SX.reg?.18:1; p.k=t.k; p.mx=t.mx||null }
    else if(p.j===0&&!b.pos.has(p.id*8)){ tx=sxHash(p.id,1)*W; ty=sxHash(p.id,2)*H; tr=1.1+sxHash(p.id,3)*1.3; ta=.16; if(p.a<.3) p.k='bg'; if(p.k!=='bg'&&Math.abs(p.a-ta)<.05) p.k='bg'; p.mx=null }
    else { const f=first[p.id]; tx=f?f.x:p.x; ty=f?f.y:p.y; tr=p.r; ta=0 }
    p.x+=(tx-p.x)*k; p.y+=(ty-p.y)*k; p.r+=(tr-p.r)*k; p.a+=(ta-p.a)*k; if(p.j===0) first[p.id]=p;
    sxDot(ctx,p.x,p.y,p.r,p.k,p.a>.6?p.mx:null,p.a);
    if(ringE===p.id&&p.a>.1&&(t||p.j===0)){ ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(6,p.r+4),0,6.2832); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke() } }
  sxLabels(ctx,b.labels,SX.labA);
  if(SX.lay==='regions'&&SX.reg!=null){ const h=b.deco.find(d=>d.t==='hit'&&d.reg===SX.reg); if(h){ ctx.globalAlpha=.07; ctx.fillStyle='#fff'; ctx.fillRect(0,h.y0,W,h.y1-h.y0); ctx.globalAlpha=1 } }
  SX.raf=requestAnimationFrame(sxTick) }

/* GAIN charts, modelled on the story's: each is drawn small under the globe and large when enlarged */
function gainCharts(big){
  const all=Object.keys(Q.ctry).flatMap(k=>Q.ctry[k].ex), X=gfOn()?all.filter(exOK):all;
  const yrOff=(()=>{ const keep=GF.yr; GF.yr=null; const r=gfOn()?all.filter(exOK):all; GF.yr=keep; return r })();
  const dotsOf=es=>{ const c=es.filter(e=>e[4]&&e[5]==='C').length, i=es.filter(e=>e[4]&&e[5]==='I').length; return `<i class="u" style="background:${LEADC.C}"></i>`.repeat(c)+`<i class="u" style="background:${LEADC.I}"></i>`.repeat(i)+'<i></i>'.repeat(es.length-c-i) };
  const tipOf=(full,es,on,key)=>tipA(full,es.length+' examples: '+es.filter(e=>e[4]&&e[5]==='C').length+' country-led and '+es.filter(e=>e[4]&&e[5]==='I').length+' organisation-led using the Recommendations, '+es.filter(e=>!e[4]).length+' not using or not known.'+(key?'<br>Select to '+(on?'clear this filter':'show only these on the globe')+'.':''));
  const col=(lab,full,es,key,val)=>{ const on=key&&String(GF[key])===String(val);
    return `<${key?`button type="button" data-act="gf" data-v="${key}:${on?'':val}" aria-pressed="${on}"`:'div'} class="dcol" aria-label="${full}: ${es.length} examples" ${tipOf(full,es,on,key)}><span class="dts">${dotsOf(es)}</span><b>${es.length}</b><small>${big?full:lab}</small></${key?'button':'div'}>` };
  const cols=a=>`<div class="dcols">${a.join('')}</div>`;
  const YS=[2021,2022,2023,2024,2025];
  // donut: examples that use the Recommendations, by which one
  const U=X.filter(e=>e[4]), order=['IRRS','IRIS','Mixed use','IROSS','Undetermined'], nfw=k=>U.filter(e=>fwOf(e)===k).length; let off=25, segs='';
  order.forEach(k=>{ const n=nfw(k); if(!n) return; const len=n/(U.length||1)*100, d=Math.max(.5,len-1.2), act=k.length<6?`data-act="gf" data-v="rec:${GF.rec===k?'':k}" style="cursor:pointer"`:'';
    segs+=`<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${FWC[k]}" stroke-width="6.5" stroke-dasharray="${d.toFixed(2)} ${(100-d).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" ${act} ${tipA(k,n+' of '+U.length+' examples that use the Recommendations'+(RECS[k]?'<br>'+esc(RECS[k]):''))}/>`; off-=len });
  const dz=big?230:72, donut=`<div class="dn"><svg viewBox="0 0 42 42" width="${dz}" height="${dz}" role="img" aria-label="Examples using the Recommendations, by Recommendation">${segs}<text x="21" y="${big?19.5:21}" text-anchor="middle" dominant-baseline="central" font-size="${big?9:10}" font-weight="600" fill="#fff">${U.length}</text>${big?'<text x="21" y="26" text-anchor="middle" font-size="2.6" fill="#b8c4d9">use the Recommendations</text>':''}</svg><div class="dkey">${order.filter(k=>nfw(k)).map(k=>`<span><i style="background:${FWC[k]}"></i>${big?(k+(RECS[k]?' · '+esc(RECS[k]):'')):(k==='Mixed use'?'Mixed':k==='Undetermined'?'Undet.':k)} <b>${nfw(k)}</b></span>`).join('')}</div></div>`;
  // trend: one line per Recommendation
  const Uy=yrOff.filter(e=>e[4]), ser=['IRRS','IRIS','IROSS','Mixed use'].map(k=>[k,YS.map(y=>Uy.filter(e=>+e[1]===y&&fwOf(e)===k).length)]), mx=Math.max(1,...ser.flatMap(s=>s[1])), W=big?520:150, H=big?250:92, L=big?30:16, R=big?70:8, T=10, B=big?26:16, px=i=>L+i*(W-L-R)/4, py=v=>H-B-v/mx*(H-T-B);
  const trend=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Examples using each Recommendation, by year">${[0,.5,1].map(f=>`<line x1="${L}" x2="${W-R}" y1="${py(mx*f)}" y2="${py(mx*f)}" stroke="rgba(255,255,255,.12)" stroke-width="1"/><text x="${L-4}" y="${py(mx*f)+3}" text-anchor="end" font-size="${big?11:8}" fill="#8b98b3">${Math.round(mx*f)}</text>`).join('')}${YS.map((y,i)=>`<text x="${px(i)}" y="${H-(big?8:4)}" text-anchor="middle" font-size="${big?11:8}" fill="#8b98b3">${big?y:"'"+String(y).slice(2)}</text>`).join('')}${ser.map(([k,v])=>`<polyline points="${v.map((n,i)=>px(i).toFixed(1)+','+py(n).toFixed(1)).join(' ')}" fill="none" stroke="${FWC[k]}" stroke-width="${big?2.6:2}" stroke-linejoin="round" stroke-linecap="round" ${tipA(k,YS.map((y,i)=>y+': '+v[i]).join(' · '))}/>${v.map((n,i)=>`<circle cx="${px(i).toFixed(1)}" cy="${py(n).toFixed(1)}" r="${big?3.5:2.2}" fill="${FWC[k]}" ${tipA(k+' · '+YS[i],n+' examples')}/>`).join('')}`).join('')}${big?(()=>{ const L2=ser.map(([k,v])=>[k,v[4],py(v[4])+4]).sort((a,b)=>a[2]-b[2]); for(let i=1;i<L2.length;i++) if(L2[i][2]-L2[i-1][2]<15) L2[i][2]=L2[i-1][2]+15; return L2.map(x=>`<text x="${px(4)+8}" y="${x[2]}" font-size="12" fill="${FWC[x[0]]}">${x[0]==='Mixed use'?'Mixed':x[0]} ${x[1]}</text>`).join('') })():''}</svg>${big?'':`<div class="dkey row">${ser.map(([k])=>`<span><i style="background:${FWC[k]}"></i>${k==='Mixed use'?'Mixed':k}</span>`).join('')}</div>`}`;
  // regions, as the story: country-led examples that use the Recommendations
  const RN=['Africa','Europe','Americas','Asia and Oceania','Middle East'], RS=['Afr.','Eur.','Amer.','Asia','M.E.'], CU=X.filter(e=>e[4]&&e[5]==='C');
  const SRC=[['Survey','Survey','Survey'],['Administrative','Admin','Administrative data'],['Census','Census','Census'],['integration','Integ.','Data integration']];
  const prev=(lay,yr)=>`<button type="button" class="sxt" data-act="zc" data-v="sx:${lay}:${yr}" aria-label="Open the interactive chart"><canvas data-sx="${lay}" data-yr="${yr}"></canvas></button>`;
  return [
    ['sx:bars:all','By year and lead','',prev('bars','all')],
    ['sx:donut:2025','Recommendations · 2025','',prev('donut','2025')],
    ['sx:regions:2025','Regions · 2025','',prev('regions','2025')],
    ['sx:sources:2025','Data sources · 2025','',prev('sources','2025')],
    ['trend','Trend by Recommendation','Examples using each Recommendation, 2021 to 2025.',trend],
    ['grp','Who is covered','Examples by population group. An example can cover more than one.',cols([['Refugees','Refugees','Refugees'],['IDPs','IDPs','IDPs'],['Stateless','Statel.','Stateless people']].map(([k,l,f])=>col(l,f,X.filter(e=>(e[7]||'').includes(k)),'grp',k)))]
  ];
}
const GLEG=`<div class="zleg"><span><i class="d" style="background:${LEADC.C}"></i>Country-led, using the Recommendations</span><span><i class="d" style="background:${LEADC.I}"></i>Organisation-led, using</span><span><i class="d" style="box-shadow:inset 0 0 0 1.5px #4cc3c9"></i>Not using, or not known</span><span>One dot = one example</span></div>`;
function ixInit(){ if(ixInit.done) return; ixInit.done=1; Object.keys(IXA).forEach(k=>SXK['a_'+k]=[IXA[k],1]); CAUSE_COL.forEach((c,k)=>{ if(c) SXK['z'+k]=[c,1] }) }

/* ===== ID Questions as the same kind of chart: one circle per identification question, or per country and reason ===== */
const IXA={same:'#4cc3c9',close:'#5b8fd9',partial:'#e0a93b',different:'#f06667',other:'#8b98b3'}, IXAN={same:'Same wording',close:'Close wording',partial:'Partial match',different:'Different wording',other:'Not rated'};
let _ixr=null, _ixo=null;
function ixRows(){ ixInit(); if(_ixr) return _ixr; const sv2iso={}; Object.keys(Q.ctry).forEach(k=>Q.ctry[k].sv.forEach(s=>{ if(sv2iso[s]==null) sv2iso[s]=k }));
  _ixo=Q.model.map(m=>m.code).concat(EXTRA);
  const q=Q.bank.filter(r=>r[2]!=='none'&&_ixo.includes(r[2])).map(r=>{ const m=Q.model.find(x=>x.code===r[2]); return {t:'q',s:r[0],qid:r[1],item:r[2],al:IXA[r[3]]&&r[3]!=='other'?r[3]:'other',text:r[7]||r[5],opt:r[9]||'',who:r[11]||'',row:r,iso:sv2iso[r[0]]||'',ord:_ixo.indexOf(r[2]),core:!!(m&&m.core),title:m?m.title:(ITEM[r[2]]||r[2])} });
  const c=Object.keys(Q.ctry).flatMap(k=>Q.ctry[k].cz.filter(z=>z[3]>0).map(z=>({t:'c',iso:k,cz:z[0],n:z[3]})));
  _ixr=q.concat(c); _ixr.forEach((d,i)=>d.id=i); return _ixr }
function ixBuild(lay,W,H,small){
  let hc=null, zb=0; const rows=ixRows(), pos=new Map(), deco=[], labels=[], put=(id,o)=>pos.set(id,o), lab=(x,y,t,al,col,sz,sans,rot)=>labels.push({x,y,t:String(t),al:al||'center',col:col||'#fff',sz,sans:!!sans,rot:rot||0});
  const nar=!small&&W<560, qs=rows.filter(d=>d.t==='q'), AO=['same','close','partial','different','other']; let cols=null, zone=0, title='', legend=AO.filter(a=>qs.some(d=>d.al===a)).map(a=>['a_'+a,IXAN[a]+' ('+qs.filter(d=>d.al===a).length+')']), mode=qs.length+' IDENTIFICATION QUESTIONS · '+new Set(qs.map(d=>d.s)).size+' QUESTIONNAIRES';
  if(lay==='items'){ const g=small?{L:6,R:W-6,T:6,B:H-13}:nar?{L:8,R:W-8,T:44,B:H-34}:{L:124,R:W-30,T:44,B:H-128};
    const codes=_ixo.filter((c,i)=>i<Q.model.length||qs.some(d=>d.item===c)), nM=Q.model.length, gapX=small?5:nar?10:26, band=(g.R-g.L-gapX)/codes.length, per=small||nar?2:3, cols=codes.map(c=>qs.filter(d=>d.item===c).sort((a,b)=>AO.indexOf(a.al)-AO.indexOf(b.al)||a.s-b.s));
    const maxB=Math.max(1,...cols.map(c=>c.length)), pitch=Math.min(small?4.6:15,band*.82/per,(g.B-g.T-(small?4:26))/(Math.ceil(maxB/per)+per/2));
    hc=[]; zb=g.B;
    cols.forEach((b,i)=>{ const xc=g.L+band*i+band/2+(i>=nM?gapX:0), T1=sxTomb(b.length,per,pitch), m=Q.model[i]; hc.push({code:codes[i],i,x0:xc-band/2,x1:xc+band/2});
      b.forEach((d,k)=>put(d.id,{x:xc+T1.pts[k][0],y:g.B-T1.pts[k][1],r:pitch*.37,k:'a_'+d.al}));
      deco.push({t:'tomb',x:xc,w:per*pitch+4,B:g.B+1,Hb:Math.max(T1.Hb,b.length?0:pitch),fill:0,c:m&&m.core?CC.teal:CC.mute});
      if(small){ lab(xc,g.B+7,i<nM?i+1:'+','center',m&&m.core?CC.teal:CC.dim,7) }
      else { lab(xc,g.B-T1.H-12,b.length,'center','#fff',12.5); lab(xc,g.B+14,i<nM?i+1:'abcdefgh'[i-nM],'center',m&&m.core?CC.teal:CC.dim,nar?10:13); if(!nar) lab(xc+4,g.B+(i<nM?30:16),(m?m.title:(ITEM[codes[i]]||codes[i]))+(m&&m.core?' · core':''),'right',CC.soft,11,true,-38) } });
    if(!small){ lab(g.L,g.T-22,nar?'The 13 questions':'The 13 EGRISS questions, in order','left',CC.mute,11); lab(g.L+band*nM+gapX,g.T-22,nar?'Related':'Related topics, not part of the 13','left',CC.mute,11) }
    title='HOW QUESTIONNAIRES ASK EACH EGRISS QUESTION';
    return {pos,deco,labels,title,legend,mode,cols:hc,zone:zb,below:1};
  } else if(lay==='surveys'){ const g=small?{L:6,R:W-6,T:5,B:H-5}:nar?{L:116,R:W-8,T:34,B:H-8}:{L:Math.min(270,W*.3),R:W-150,T:124,B:H-12};
    const codes=_ixo.filter((c,i)=>i<Q.model.length||qs.some(d=>d.item===c)), nM=Q.model.length, gapX=small?4:nar?8:18, colW=(g.R-g.L-gapX)/codes.length;
    const sv=[...new Set(qs.map(d=>d.s))].sort((a,b)=>(Q.surveys[a][0]+Q.surveys[a][1]).localeCompare(Q.surveys[b][0]+Q.surveys[b][1])), rowH=(g.B-g.T)/sv.length, rr=Math.min(rowH,colW)*(small?.3:.36), X=i=>g.L+colW*i+colW/2+(i>=nM?gapX:0);
    cols=codes.map((c,i)=>({code:c,i,x0:X(i)-colW/2,x1:X(i)+colW/2})); zone=g.T;
    codes.forEach((c,i)=>{ const m=Q.model[i], col=m&&m.core?CC.teal:CC.mute; deco.push({t:'leader',pts:[[X(i),g.T-4],[X(i),g.B]],c:m&&m.core?'rgba(76,195,201,.34)':'rgba(141,184,227,.16)'});
      if(!small){ if(!nar||i%2===0||i>=nM) lab(X(i),g.T-14,i<nM?i+1:'abcdefgh'[i-nM],'center',col,nar?9:12); if(!nar) lab(X(i)+3,g.T-28,(m?m.title:(ITEM[c]||c)),'left',m&&m.core?CC.teal:CC.soft,11,true,-40) } });
    sv.forEach((s,r)=>{ const yc=g.T+rowH*r+rowH/2, mine=qs.filter(d=>d.s===s), has=codes.map(c=>mine.filter(d=>d.item===c)), on=has.map((b,i)=>b.length?i:-1).filter(i=>i>=0);
      if(on.length) deco.push({t:'leader',pts:[[X(on[0]),yc],[X(on[on.length-1]),yc]],c:'rgba(207,224,244,.45)'});
      has.forEach((b,i)=>{ const step=Math.min(rr*2+1,(colW-4)/Math.max(1,b.length)); b.forEach((d,k)=>put(d.id,{x:X(i)+(k-(b.length-1)/2)*step,y:yc,r:rr,k:'a_'+d.al})) });
      deco.push({t:'hit',reg:s,x0:0,x1:W,y0:yc-rowH/2,y1:yc+rowH/2});
      if(!small){ const nm=Q.surveys[s][0]+' · '+Q.surveys[s][1], mx=Math.floor((g.L-22)/6.1); lab(g.L-14,yc,nm.length>mx?nm.slice(0,mx-1)+'…':nm,'right',CC.soft,11,true); if(!nar){ const nr=new Set(mine.filter(d=>d.ord>=nM).map(d=>d.item)).size; lab(g.R+10,yc,new Set(mine.filter(d=>d.ord<nM).map(d=>d.item)).size+' of '+nM+(nr?' · '+nr+' related':''),'left',CC.dim,11) } } });
    if(!small&&!nar){ lab(g.L-14,g.T-14,'Questionnaire','right',CC.mute,11); lab(g.R+10,g.T-14,'a–'+'abcdefgh'[codes.length-nM-1]+' = related topics','left',CC.mute,11) }
    title='EVERY QUESTIONNAIRE AGAINST THE 13 EGRISS QUESTIONS';
  } else if(lay==='match'){ const g=small?{L:6,R:W-6,T:6,B:H-6}:{L:48,R:W-48,T:50,B:H-40};
    const list=qs.slice().sort((a,b)=>AO.indexOf(a.al)-AO.indexOf(b.al)||(b.core-a.core)||a.ord-b.ord||a.s-b.s), N=list.length||1, cx=(g.L+g.R)/2, cy=(g.T+g.B)/2, rO=small?Math.min((g.R-g.L)/2,(g.B-g.T)/2)-1:nar?Math.min((W-16)/2,(g.B-g.T)/2-8):Math.max(70,Math.min((g.R-g.L)/2-190,(g.B-g.T)/2-20)), rowsN=N<=130?3:5;
    let p=small?9:30, pts=[]; for(let guard=0;guard<200;guard++){ pts=[]; for(let q=0;q<rowsN;q++){ const rk=rO-(q+.5)*p; if(rk<p) continue; const nk=Math.floor(6.2832*rk/p); for(let m=0;m<nk;m++) pts.push([(m+.5+q*.33)/nk*6.2832,rk]) } if(pts.length>=N||p<=1.5) break; p-=.25 }
    pts.sort((a,b)=>a[0]-b[0]); list.forEach((d,k)=>{ const s=pts[Math.min(pts.length-1,Math.floor((k+.5)*pts.length/N))]; put(d.id,{x:cx+Math.sin(s[0])*s[1],y:cy-Math.cos(s[0])*s[1],r:p*.38,k:'a_'+d.al}) });
    const band0=rO-rowsN*p-3, band1=rO+3, rin=band0-(small?7:26); let acc=0;
    AO.forEach(a=>{ const sub=list.filter(d=>d.al===a), n=sub.length; if(!n) return; const f0=acc/N, f1=(acc+n)/N, nc=sub.filter(d=>d.core).length; 
      if(nc) deco.push({t:'arc',cx,cy,r:rin,a0:f0,a1:f0+nc/N,c:CC.teal,w:small?5:20,al:1}); if(n-nc) deco.push({t:'arc',cx,cy,r:rin,a0:f0+nc/N,a1:f1,c:CC.grey,w:small?5:20,al:.55});
      acc+=n; deco.push({t:'sector',cx,cy,r0:band0,r1:band1,a0:f0+.004,a1:f1-.004,c:IXA[a]}); if(small||nar) return;
      const mid=(f0+f1)/2*6.2832, side=Math.sin(mid)>=0?1:-1, bx=cx+Math.sin(mid)*band1, by2=cy-Math.cos(mid)*band1, ex=cx+Math.sin(mid)*(band1+16), ey=cy-Math.cos(mid)*(band1+16), hx=Math.max(90,Math.min(W-90,side>0?Math.max(ex+14,cx+band1+74):Math.min(ex-14,cx-band1-74)));
      deco.push({t:'leader',pts:[[bx,by2],[ex,ey],[hx,ey]],c:IXA[a]}); lab(hx+side*8,ey-7,n,side>0?'left':'right',IXA[a],24); lab(hx+side*8,ey+14,IXAN[a],side>0?'left':'right',CC.soft,12.5); lab(hx+side*8,ey+29,nc+' on core questions',side>0?'left':'right',CC.dim,11) });
    lab(cx,cy-(small?0:6),list.length,'center','#fff',small?15:nar?36:(list.length>99?54:64),true); if(!small) lab(cx,cy+(nar?24:34),'questions','center',CC.soft,12.5);
    title='HOW CLOSE THE WORDING IS TO THE EGRISS QUESTION'; legend=legend.concat([['','Inner ring'],['iU','On one of the 5 core questions'],['fw4','On an optional question or related topic']]);
  } else if(lay==='sim'){ const g=small?{L:6,R:W-6,T:4,B:H-12}:nar?{L:8,R:W-8,T:30,B:H-38}:{L:170,R:W-40,T:40,B:H-56};
    const S=qs.filter(d=>simOf(d.row)), bands=AO.filter(a=>S.some(d=>d.al===a)), bh=(g.B-g.T)/bands.length, cw=(g.R-g.L)/13, per=small?2:nar?2:4, T=d=>simTot(d.row);
    const mxc=Math.max(1,...bands.flatMap(a=>Array.from({length:13},(_,v)=>S.filter(d=>d.al===a&&T(d)===v).length))), pitch=Math.min(cw*.84/per,(bh-(small?3:16))/Math.ceil(mxc/per),small?4:14);
    if(!small) for(let v=0;v<13;v++) deco.push({t:'leader',pts:[[g.L+cw*v+cw/2,g.T],[g.L+cw*v+cw/2,g.B]],c:'rgba(141,184,227,.1)'});
    bands.forEach((a,bi)=>{ const yb=g.T+bh*(bi+1)-(small?1:8), all=S.filter(d=>d.al===a);
      for(let v=0;v<13;v++) all.filter(d=>T(d)===v).sort((p,q)=>p.ord-q.ord||p.s-q.s).forEach((d,k)=>put(d.id,{x:g.L+cw*v+cw/2+((k%per)-(per-1)/2)*pitch,y:yb-pitch/2-Math.floor(k/per)*pitch,r:pitch*.4,k:'a_'+d.al}));
      deco.push({t:'leader',pts:[[g.L,yb],[g.R,yb]],c:IXA[a]});
      if(!small&&!nar){ lab(g.L-14,yb-bh/2+2,'Coder: '+IXAN[a].toLowerCase(),'right',IXA[a],12.5,true); lab(g.L-14,yb-bh/2+19,all.length+' questions','right',CC.dim,11) } else if(nar) lab(g.L,yb-bh+12,IXAN[a]+' · '+all.length,'left',IXA[a],11,true) });
    if(!small){ [0,3,6,9,12].forEach(v=>lab(g.L+cw*v+cw/2,g.B+14,Math.round(v/12*100)+'%','center',CC.dim,11)); lab((g.L+g.R)/2,g.B+36,nar?'Estimated similarity →':'Similarity to the EGRISS question, estimated by a language model →','center',CC.soft,12.5,true) }
    title='ESTIMATED SIMILARITY, SET AGAINST THE CODER RATING'; mode=S.length+' QUESTIONS WITH AN EGRISS REFERENCE QUESTION';
  } else if(lay==='reasons'){ const g=small?{L:6,R:W-6,T:6,B:H-13}:nar?{L:6,R:W-6,T:40,B:H-30}:{L:48,R:W-48,T:50,B:H-78};
    const cs=rows.filter(d=>d.t==='c'), ks=[...new Set(cs.map(d=>d.cz))].sort((a,b)=>a-b), band=(g.R-g.L)/ks.length, per=small?5:nar?6:8, cols=ks.map(k=>cs.filter(d=>d.cz===k).sort((a,b)=>b.n-a.n)), maxB=Math.max(1,...cols.map(c=>c.length)), pitch=Math.min(small?4.6:17,band*.7/per,(g.B-g.T-(small?4:30))/(Math.ceil(maxB/per)+per/2));
    cols.forEach((b,i)=>{ const xc=g.L+band*i+band/2, T1=sxTomb(b.length,per,pitch), k=ks[i];
      b.forEach((d,j)=>put(d.id,{x:xc+T1.pts[j][0],y:g.B-T1.pts[j][1],r:pitch*.37,k:'z'+k}));
      deco.push({t:'tomb',x:xc,w:per*pitch+4,B:g.B+1,Hb:T1.Hb,fill:0,c:CAUSE_COL[k]});
      if(small) lab(xc,g.B+7,b.length,'center',CAUSE_COL[k],7.5);
      else if(nar) lab(xc,g.B+14,b.length,'center',CAUSE_COL[k],12.5);
      else { lab(xc,g.B-T1.H-13,b.length+' countries','center',CAUSE_COL[k],15); lab(xc,g.B+18,CZ[k],'center','#fff',12.5,true); lab(xc,g.B+36,fmt(b.reduce((s,d)=>s+d.n,0))+' people displaced','center',CC.dim,11) } });
    title='REASONS FOR DISPLACEMENT'; mode=new Set(cs.map(d=>d.iso)).size+' COUNTRIES · ONE CIRCLE PER COUNTRY AND REASON'; legend=ks.map(k=>['z'+k,CZ[k]+' ('+cols[ks.indexOf(k)].length+')']);
  }
  return {pos,deco,labels,title,legend,mode,cols,zone};
}
function ixThumbs(){ document.querySelectorAll('canvas[data-ix]').forEach(cv=>{ const W=Math.max(120,cv.parentNode.clientWidth), H=118, ctx=sxCanvas(cv,W,H), b=ixBuild(cv.dataset.ix,W,H,true);
  ctx.clearRect(0,0,W,H); b.deco.forEach(d=>sxDeco(ctx,d,1)); b.pos.forEach(o=>sxDot(ctx,o.x,o.y,o.r,o.k,null,1)); sxLabels(ctx,b.labels,1) }) }
const IX={lay:'items',P:null,hover:null,reg:null,raf:0,last:0,labA:0,b:null,W:0,H:0};
function ixShell(){
  if(IX.lay==='routes') return ixRoutesShell();
  const z=$('zoomer'), [W,H]=chSize(IX.lay==='surveys'); IX.W=W; IX.H=H;
  const b=ixBuild(IX.lay,W,H,false), seg=(v,t)=>`<button type="button" class="chip" data-act="ixl" data-v="${v}" aria-pressed="${IX.lay===v}">${t}</button>`;
  z.innerHTML=`<div class="zbox sxbox" role="dialog" aria-modal="true" aria-label="Identification questions, chart"><div class="zhead"><div><p class="eyebrow" style="color:${LAYER.idq.col}">${b.mode}</p><h2 style="font-size:15px;font-family:var(--mono);font-weight:500;letter-spacing:.06em;color:#8db8e3">${b.title}</h2></div><span class="zact">${act('ztab','',zTab?'Show as chart':'Show as table','chip',`aria-pressed="${zTab}"`)}<button type="button" class="x" data-act="zclose">Close ✕</button></span></div>
    <div class="sxctl"><span>Show</span>${ixSegs()}</div>
    ${zTab?ixTable(W,H):`<div class="sxwrap" style="width:${W}px;height:${H}px"><canvas id="ixcv" role="img" aria-label="${esc(b.title)}"></canvas><div id="sxpv" hidden></div></div>`}
    <div class="zleg">${b.legend.map(l=>l[0]?`<span><i class="d" style="--c:${SXK[l[0]][0]}"></i>${l[1]}</span>`:`<b>${l[1]}</b>`).join('')}</div>
    <p class="lnote">${IX.lay==='reasons'?'One circle is one country where that reason is recorded, largest first. Point at a circle to read it. Select it to open the country.':'One circle is one identification question in one questionnaire. Point at a circle to read it. Select it to open that questionnaire.'+(IX.lay==='surveys'?' Each line is one questionnaire, read across the 13 questions; a gap means the question is not asked. Point at a name or number at the top to read the EGRISS question.':IX.lay==='items'?' Point at a name or number under a column to read the EGRISS question.':IX.lay==='sim'?' Each row is the coder\'s rating; left to right is the similarity a language model estimated from concept, who is asked, answer options, and time and place. Circles far from the rest of their row are worth a second look. The estimate is not reviewed.':'')}</p></div>`;
  z.hidden=false; if(zTab) return; const cv=$('ixcv'); cv.addEventListener('pointerdown',e=>{ IX.touch=e.pointerType!=='mouse' }); IX.ctx=sxCanvas(cv,W,H); IX.b=b; IX.labA=0; IX.hover=null; IX.reg=null; IX.col=null; IX.hk=null;
  if(!IX.P) IX.P=ixRows().map(d=>({id:d.id,x:sxHash(d.id,1)*W,y:-30-sxHash(d.id,2)*H,r:2,a:0,k:'a_close',rate:.05+sxHash(d.id,13)*.07}));
  cv.addEventListener('mousemove',ixMove); cv.addEventListener('mouseleave',()=>{ IX.hover=null; IX.reg=null; IX.col=null; IX.hk=null; $('sxpv').hidden=true; cv.style.cursor='default' }); cv.addEventListener('click',ixTap);
  if(!IX.raf){ IX.last=performance.now(); IX.raf=requestAnimationFrame(ixTick) }
}
function ixNearest(e){ const r=e.currentTarget.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; let best=null, bd=1e9; for(const p of IX.P){ if(p.a<.12||!IX.b.pos.has(p.id)) continue; const d=Math.hypot(p.x-x,p.y-y); if(d<Math.max(8,p.r+4)&&d<bd){ bd=d; best=p } } return [best,x,y] }
const cut=(t,n)=>t.length>n?t.slice(0,n-1)+'…':t;
function ixQCard(code){ const i=_ixo.indexOf(code), m=Q.model.find(x=>x.code===code), qs=ixRows().filter(d=>d.t==='q'&&d.item===code), nS=new Set(qs.map(d=>d.s)).size, AO=['same','close','partial','different','other'];
  return `<span class="exmeta" style="color:${m&&m.core?CC.teal:CC.mute}">${m?'EGRISS QUESTION '+(i+1)+' OF '+Q.model.length+(m.core?' · CORE':' · OPTIONAL'):'RELATED TOPIC · NOT ONE OF THE 13 QUESTIONS'}</span><b class="long">${esc(m?m.stem:(ITEM[code]||code))}</b>`
    +(m&&m.opts&&m.opts.length?`<small>Answers: ${esc(cut(m.opts.join(' · '),230))}</small>`:'')+(m?`<small>Routing: ${esc(m.skip)}</small>`:'')
    +`<div class="chips2"><i>${nS} of ${Q.surveys.length} questionnaires ask it</i>${AO.map(a=>[a,qs.filter(d=>d.al===a).length]).filter(x=>x[1]).map(x=>`<i class="rc" style="background:${IXA[x[0]]};color:#0a1430">${x[1]} ${IXAN[x[0]].toLowerCase()}</i>`).join('')}</div>` }
function ixMove(e){ const [p,x,y]=ixNearest(e), cv=e.currentTarget, pv=$('sxpv'), b=IX.b; let reg=null, col=null;
  if(IX.lay==='surveys'){ const h=b.deco.find(d=>d.t==='hit'&&y>=d.y0&&y<d.y1); if(h) reg=h.reg }
  if(b.cols){ const c=b.cols.find(c=>x>=c.x0&&x<c.x1); if(c) col=c.code }
  IX.reg=reg; IX.col=col; cv.style.cursor=p?'pointer':'default';
  const head=!p&&col&&(b.below?y>b.zone:y<b.zone), key=p?'p'+p.id:head?'c'+col:null;
  if(!key){ IX.hover=null; IX.hk=null; pv.hidden=true; return } IX.hover=p?p.id:null;
  if(IX.hk!==key||pv.hidden){ IX.hk=key; IX.hkT=performance.now(); const d=p?ixRows()[p.id]:null;
    pv.innerHTML=!p?ixQCard(col):d.t==='q'?(m=>`<span class="exmeta">${esc(Q.surveys[d.s][0])} · ${esc(Q.surveys[d.s][1])}</span><small>EGRISS question: ${esc(d.title)}${d.core?' (core)':''} · ${esc(d.qid)}</small>${d.row[6]!=='en'||!m?`<b class="long">${esc(cut(d.row[5]||d.text||'',200))}</b>`:''}${m?wCompare(m,d.row):''}${d.who?`<small>Asked of: ${esc(cut(d.who,140))}</small>`:''}<div class="chips2"><i class="rc" style="background:${IXA[d.al]};color:#0a1430">${IXAN[d.al]}</i></div><small class="hint">${d.iso?TCH()+' to open this questionnaire':'This questionnaire covers several countries and has no country page'}</small>`)(Q.model.find(x=>x.code===d.item))
    :`<span class="exmeta">REASON FOR DISPLACEMENT</span><b>${esc(Q.ctry[d.iso].n)}</b><small>${esc(CZ[d.cz])}</small><div class="chips2"><i class="rc" style="background:${CAUSE_COL[d.cz]};color:#0a1430">${fmt(d.n)} people displaced</i></div><small class="hint">${TCH()} to open the country</small>`; pv.hidden=false }
  const ax=p?p.x:x, ay=p?p.y:y, pw=Math.min(p&&ixRows()[p.id].t==='q'?460:380,IX.W-24), ph=(pv.style.width=pw+'px',pv.offsetHeight||150); let px=ax+20; if(px+pw>IX.W-8) px=ax-20-pw; pv.style.width=pw+'px'; pv.style.left=Math.max(8,px)+'px'; pv.style.top=Math.max(8,Math.min(IX.H-ph-8,b.below&&!p?ay-ph-14:ay-(p?50:-18)))+'px' }
function ixTap(e){ const [p]=ixNearest(e); if(!p||(IX.touch&&performance.now()-(IX.hkT||0)<700)) return; ixOpen(p.id) }
function ixOpen(id){ const d=ixRows()[id]; if(!d.iso||!Q.ctry[d.iso]) return;
  zChart=null; layer='idq'; chosen=true; gSel=d.iso; fSrc=fInd=fEx=mapInd=null; czSel=null; fSv=d.t==='q'?d.s:null; if(d.t==='c'&&Q.cpts[d.iso]){ mapInd='__cause'; czSel=d.cz } level='country'; setHash(); render(); window.scrollTo({top:0,behavior:RM?'auto':'smooth'}) }
function ixTick(now){ IX.raf=0; const z=$('zoomer'); if(z.hidden||zChart!=='ix'||!$('ixcv')) return; const dt=Math.min(64,now-IX.last); IX.last=now;
  const b=IX.b, ctx=IX.ctx, W=IX.W, H=IX.H, rows=ixRows(), dpr=Math.min(2,window.devicePixelRatio||1); IX.labA+=(1-IX.labA)*(RM?1:1-Math.pow(.9,dt/16.7));
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H); b.deco.forEach(d=>sxDeco(ctx,d,IX.labA));
  ctx.fillStyle='#fff'; ctx.globalAlpha=.07; if(IX.lay==='surveys'&&IX.reg!=null){ const h=b.deco.find(d=>d.t==='hit'&&d.reg===IX.reg); if(h) ctx.fillRect(0,h.y0,W,h.y1-h.y0) } if(b.cols&&IX.col!=null){ const c=b.cols.find(c=>c.code===IX.col); if(c) ctx.fillRect(c.x0,0,c.x1-c.x0,H) } ctx.globalAlpha=1;
  for(const p of IX.P){ const t=b.pos.get(p.id), k=RM?1:1-Math.pow(1-p.rate,dt/16.7); let ta=0;
    if(t){ p.x+=(t.x-p.x)*k; p.y+=(t.y-p.y)*k; p.r+=(t.r-p.r)*k; p.k=t.k; const d=rows[p.id], lit=IX.lay==='surveys'?((IX.reg==null&&IX.col==null)||d.s===IX.reg||d.item===IX.col):IX.lay==='items'?(IX.col==null||d.item===IX.col):true; ta=lit?1:.2 }
    p.a+=(ta-p.a)*k; sxDot(ctx,p.x,p.y,p.r,p.k,null,p.a);
    if(IX.hover===p.id&&t){ ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(6,p.r+4),0,6.2832); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke() } }
  sxLabels(ctx,b.labels,IX.labA); IX.raf=requestAnimationFrame(ixTick) }

/* ===== SDG values as the same kind of chart: one circle per value, in the colour of its goal ===== */
let _gxr=null; const _gxi={};
const CC={soft:'#cfe0f4',mute:'#8db8e3',dim:'#b8c4d9',grey:'#8b98b3',axis:'#5f7199',teal:'#4cc3c9'};
const chSize=tall=>{ const W=Math.max(300,Math.min(1000,window.innerWidth-(window.innerWidth<600?56:72))), H=Math.max(380,Math.min(620,window.innerHeight-290)); return [W,W<560?Math.min(H,tall?520:380):H] };
const TCH=()=>GX.touch||IX.touch?'Tap again':'Select the circle';
const _glt={}; function gLite(g){ if(_glt[g]) return _glt[g]; const lum=c=>{ const f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4) }; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b) }; let c=d3.rgb(SDGC[g]); for(let i=0;i<14&&(lum(c)+.05)/.0635<4.6;i++) c=d3.rgb(d3.interpolateRgb(c,'#ffffff')(.1)); return _glt[g]=c.formatHex() }
const SDGBAD=new Set(['1.2.1','2.1.1','2.1.2','2.2.1','2.2.2','8.5.2','10.3.1','11.1.1','16.1.3']);
let zTab=false;
const zTable=(W,H,head,rows)=>`<div class="ztab" style="width:${W}px;max-height:${H}px" tabindex="0" role="region" aria-label="The chart as a table"><table><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const zOpen=(a,id,t)=>`<button type="button" class="lk" data-act="${a}" data-v="${id}">${esc(t)}</button>`;
function gxTable(W,H){ const R=gxRows().filter(d=>(!gGoal||d.g===gGoal)&&(GX.lay!=='gap'||(d.t==='c'&&d.h!=null)));
  return zTable(W,H,['Goal','Indicator','Country','Value','Comparison group','Source'],R.map(d=>[d.g+' · '+esc(SDGN[d.g]||''),esc(d.code+' '+d.name),zOpen('gxo',d.id,Q.ctry[d.iso].n),d.t==='c'?esc(d.g1)+' '+d.r+'%':esc(d.val+(d.grp?' · '+d.grp:'')),d.t==='c'&&d.h!=null?esc(d.g2||'')+' '+d.h+'%':'',esc(d.from)+(d.t==='c'?' · calculated':' · published report')])) }
function ixTable(W,H){ const R=ixRows();
  return IX.lay==='reasons'?zTable(W,H,['Country','Reason for displacement','People displaced'],R.filter(d=>d.t==='c').sort((a,b)=>a.cz-b.cz||b.n-a.n).map(d=>[zOpen('ixo',d.id,Q.ctry[d.iso].n),esc(CZ[d.cz]),fmt(d.n)]))
    :zTable(W,H,['Questionnaire','EGRISS question','Wording','Question as printed'],R.filter(d=>d.t==='q').sort((a,b)=>a.ord-b.ord||a.s-b.s).map(d=>{ const nm=Q.surveys[d.s][0]+' · '+Q.surveys[d.s][1]; return [d.iso?zOpen('ixo',d.id,nm):esc(nm),(d.ord<Q.model.length?(d.ord+1)+'. ':'Related: ')+esc(d.title),IXAN[d.al],esc(d.text||'')] })) }
function sxTable(W,H){ const R=sxRows().filter(d=>SX.lay==='bars'||SX.yr==='all'||String(d.y)===String(SX.yr));
  return zTable(W,H,['Year','Country','Example','Organisation','Led by','Recommendations'],R.map(d=>[d.y,esc(d.country||'Regional / global'),d.iso&&Q.ctry[d.iso]?zOpen('sxo',d.id,d.title||'Untitled example'):esc(d.title||'Untitled example'),esc(d.org||''),d.lead?'Institution':'Country',d.use?SXFW[d.fw]:'Not used or not known'])) }
function gxImg(g){ if(_gxi[g]) return _gxi[g]; const im=new Image(); im.onload=()=>{ im.ok=1; if(typeof gxThumbs==='function'&&layer==='sdg'&&level==='world') gxThumbs() }; im.src='sdg/'+g+'.png'; return _gxi[g]=im }
function gxRows(){ if(_gxr) return _gxr; Object.keys(SDGC).forEach(g=>{ SXK['g'+g]=[gLite(g),1]; SXK['o'+g]=[gLite(g),0] }); SXK.gen1=[CC.soft,1]; SXK.gen0=[CC.soft,0]; const o=[];
  Q.sdg.forEach(d=>d.rows.forEach(r=>{ if(r.iso&&Q.ctry[r.iso]&&SDGC[goalOf(d.c)]) o.push({t:'c',code:d.c,g:goalOf(d.c),name:d.n,iso:r.iso,r:r.r,h:r.h,g1:r.g1,g2:r.g2,src:r.src,from:r.fam+(r.year?' · '+r.year:''),pri:!!d.pri}) }));
  Object.keys(Q.ctry).forEach(k=>Q.ctry[k].rep.forEach(x=>{ if(SDGC[goalOf(x[0])]) o.push({t:'r',code:x[0],g:goalOf(x[0]),name:(Q.sdg.find(d=>d.c===x[0])||{}).n||SNN[x[0]]||'',iso:k,val:x[1],grp:x[2],from:x[11]||x[3]}) }));
  o.sort((a,b)=>a.g-b.g||a.code.localeCompare(b.code,undefined,{numeric:true})||(a.t<b.t?-1:a.t>b.t?1:0)||Q.ctry[a.iso].n.localeCompare(Q.ctry[b.iso].n)); o.forEach((d,i)=>d.id=i); return _gxr=o }
const gxKey=d=>(d.t==='c'?'g':'o')+d.g, gxBad=d=>SDGBAD.has(d.code);
function gxBuild(lay,W,H,small){
  const rows=gxRows(), pos=new Map(), deco=[], labels=[], put=(id,o)=>pos.set(id,o), lab=(x,y,t,al,col,sz,sans,rot)=>labels.push({x,y,t:String(t),al:al||'center',col:col||'#fff',sz,sans:!!sans,rot:rot||0});
  const nar=!small&&W<560, gs=[...new Set(rows.map(d=>d.g))].sort((a,b)=>a-b), nC=rows.filter(d=>d.t==='c').length, nCtry=new Set(rows.map(d=>d.iso)).size;
  let title='', mode=rows.length+' SDG VALUES · '+gs.length+' GOALS · '+nCtry+' COUNTRIES', legend=[['','Colour = the goal'],['gen1','Calculated from the survey file ('+nC+')'],['gen0','From a published report ('+(rows.length-nC)+')']], note='';
  if(lay==='goals'){ const g=small?{L:4,R:W-4,T:6,B:H-15}:nar?{L:6,R:W-6,T:40,B:H-50}:{L:40,R:W-40,T:46,B:H-74};
    const band=(g.R-g.L)/gs.length, per=small?2:5, cols=gs.map(k=>rows.filter(d=>d.g===k)), maxB=Math.max(1,...cols.map(c=>c.length)), pitch=Math.min(small?4.4:24,band*.8/per,(g.B-g.T-(small?4:26))/(Math.ceil(maxB/per)+per/2));
    cols.forEach((b,i)=>{ const xc=g.L+band*i+band/2, T1=sxTomb(b.length,per,pitch), k=gs[i];
      b.forEach((d,j)=>put(d.id,{x:xc+T1.pts[j][0],y:g.B-T1.pts[j][1],r:pitch*.37,k:gxKey(d)}));
      deco.push({t:'tomb',x:xc,w:per*pitch+4,B:g.B+1,Hb:T1.Hb,fill:0,c:gLite(k)}); deco.push({t:'hitx',reg:k,x0:xc-band/2,x1:xc+band/2});
      if(small) lab(xc,g.B+8,k,'center',gLite(k),8);
      else { lab(xc,g.B-T1.H-12,b.length,'center','#fff',12.5); const s=Math.min(46,band-(nar?3:10)); if(SDGI.has(k)) deco.push({t:'img',g:k,x:xc-s/2,y:g.B+10,s}); else lab(xc,g.B+30,k,'center',gLite(k),20); } });
    title='NUMBER OF VALUES PER GOAL'; note='Point at a goal to pick it out.';
  } else if(lay==='countries'){ const g=small?{L:6,R:W-6,T:5,B:H-5}:nar?{L:4,R:W-4,T:30,B:H-10}:{L:40,R:W-40,T:40,B:H-20};
    const cs=[...new Set(rows.map(d=>d.iso))].map(k=>[k,rows.filter(d=>d.iso===k)]).sort((a,b)=>b[1].length-a[1].length||Q.ctry[a[0]].n.localeCompare(Q.ctry[b[0]].n)), rowH=(g.B-g.T)/cs.length, x0=g.L+(small?0:nar?112:190), maxN=Math.max(1,...cs.map(c=>c[1].length)), pitch=Math.min(17,rowH*.86,(g.R-(small?2:nar?24:44)-x0)/maxN);
    cs.forEach(([k,b],i)=>{ const yc=g.T+rowH*i+rowH/2;
      b.forEach((d,j)=>put(d.id,{x:x0+(j+.5)*pitch,y:yc,r:pitch*.38,k:gxKey(d)}));
      deco.push({t:'pill',x:x0-2,y:yc-pitch/2-1,w:b.length*pitch+4+pitch/2,h:pitch+2,c:'#7aa7e6'}); deco.push({t:'hit',reg:k,x0:0,x1:W,y0:yc-rowH/2,y1:yc+rowH/2});
      if(!small){ lab(x0-(nar?6:12),yc,nar?cut(Q.ctry[k].n,17):Q.ctry[k].n,'right',CC.soft,11,true); lab(x0+b.length*pitch+12,yc,b.length,'left','#fff',11) } });
    title='VALUES IN EACH COUNTRY · IN THE ORDER OF THE GOALS'; note='Point at a row to pick out one country.';
  } else if(lay==='wheel'){ const g=small?{L:6,R:W-6,T:6,B:H-6}:{L:48,R:W-48,T:50,B:H-40};
    const N=rows.length||1, cx=(g.L+g.R)/2, cy=(g.T+g.B)/2, rO=small?Math.min((g.R-g.L)/2,(g.B-g.T)/2)-1:nar?Math.min((W-16)/2,(g.B-g.T)/2-8):Math.max(70,Math.min((g.R-g.L)/2-200,(g.B-g.T)/2-20)), rowsN=3;
    let p=small?9:30, pts=[]; for(let guard=0;guard<200;guard++){ pts=[]; for(let q=0;q<rowsN;q++){ const rk=rO-(q+.5)*p; if(rk<p) continue; const nk=Math.floor(6.2832*rk/p); for(let m=0;m<nk;m++) pts.push([(m+.5+q*.33)/nk*6.2832,rk]) } if(pts.length>=N||p<=1.5) break; p-=.25 }
    pts.sort((a,b)=>a[0]-b[0]); rows.forEach((d,k)=>{ const s=pts[Math.min(pts.length-1,Math.floor((k+.5)*pts.length/N))]; put(d.id,{x:cx+Math.sin(s[0])*s[1],y:cy-Math.cos(s[0])*s[1],r:p*.38,k:gxKey(d)}) });
    const band0=rO-rowsN*p-3, band1=rO+3, rin=band0-(small?6:22); let acc=0; const LB=[];
    gs.forEach(k=>{ const sub=rows.filter(d=>d.g===k), n=sub.length, f0=acc/N, f1=(acc+n)/N, nc=sub.filter(d=>d.t==='c').length; acc+=n;
      deco.push({t:'arc',cx,cy,r:rin,a0:f0,a1:f1,c:gLite(k),w:small?5:18,al:.3}); if(nc) deco.push({t:'arc',cx,cy,r:rin,a0:f0,a1:f0+nc/N,c:gLite(k),w:small?5:18,al:1});
      deco.push({t:'sector',cx,cy,r0:band0,r1:band1,a0:f0+.003,a1:f1-.003,c:gLite(k),reg:k}); if(nar) legend.push(['g'+k,'Goal '+k+' · '+(SDGN[k]||'')+' ('+n+')']); if(small||nar) return;
      const mid=(f0+f1)/2*6.2832, side=Math.sin(mid)>=0?1:-1, bx=cx+Math.sin(mid)*band1, by2=cy-Math.cos(mid)*band1, ex=cx+Math.sin(mid)*(band1+16), ey0=cy-Math.cos(mid)*(band1+16), hx=Math.max(120,Math.min(W-120,side>0?Math.max(ex+14,cx+band1+60):Math.min(ex-14,cx-band1-60))), e0=ey0; LB.push({k,n,side,bx,by2,ex,e0,hx,y:e0}) });
    [1,-1].forEach(sd=>{ const L=LB.filter(l=>l.side===sd).sort((a,b)=>a.y-b.y), gap=34; L.forEach((l,i)=>{ l.y=Math.max(l.y,i?L[i-1].y+gap:16) }); for(let i=L.length-1;i>=0;i--) L[i].y=Math.min(L[i].y,i===L.length-1?H-24:L[i+1].y-gap);
      L.forEach(l=>{ deco.push({t:'leader',pts:[[l.bx,l.by2],[l.ex,l.e0],[l.hx,l.y]],c:gLite(l.k)}); lab(l.hx+sd*8,l.y-6,l.n+'  ·  Goal '+l.k,sd>0?'left':'right',gLite(l.k),15); lab(l.hx+sd*8,l.y+11,SDGN[l.k]||'',sd>0?'left':'right',CC.soft,11,true) }) });
    lab(cx,cy-(small?0:6),rows.length,'center','#fff',small?15:nar?40:60,true); if(!small) lab(cx,cy+(nar?24:34),'values','center',CC.soft,12.5);
    title='VALUES BY GOAL'; legend=legend.concat([['','Inner ring'],['gen1','Bright: calculated · faint: from a published report']]); note='';
  } else if(lay==='gap'){ const pr=rows.filter(d=>d.t==='c'&&d.h!=null), S=small?Math.min(W-12,H-12):nar?Math.min(W-64,H-120):Math.min(W-220,H-110), x0=(W-S)/2+(small?0:nar?18:10), y1=small?(H+S)/2:H-62, X=v=>x0+v/100*S, Y=v=>y1-v/100*S;
    const seen={}; pr.forEach(d=>{ const key=Math.round(d.h/2)+'|'+Math.round(d.r/2), n=seen[key]=(seen[key]||0)+1; put(d.id,{x:X(d.h)+(n-1)*(small?2:5),y:Y(d.r)-(n-1)*(small?2:5),r:small?2.6:nar?5:6.5,k:gxKey(d)+(gxBad(d)?'m':'')}) });
    deco.push({t:'leader',pts:[[X(0),Y(0)],[X(100),Y(0)]],c:CC.axis}); deco.push({t:'leader',pts:[[X(0),Y(0)],[X(0),Y(100)]],c:CC.axis}); deco.push({t:'leader',pts:[[X(0),Y(0)],[X(100),Y(100)]],c:CC.mute,dash:1});
    if(!small){ [25,50,75,100].forEach(v=>{ deco.push({t:'leader',pts:[[X(v),Y(0)],[X(v),Y(100)]],c:'rgba(141,184,227,.22)'}); deco.push({t:'leader',pts:[[X(0),Y(v)],[X(100),Y(v)]],c:'rgba(141,184,227,.22)'}) });
      [0,25,50,75,100].forEach(v=>{ lab(X(v),y1+14,v+'%','center',CC.dim,11); lab(x0-10,Y(v),v+'%','right',CC.dim,11) });
      if(nar){ lab(X(50),y1+34,'Host community (comparison group) →','center',CC.soft,11,true); lab(x0,Y(100)-16,'↑ Displaced people','left',CC.soft,11,true) }
      else { lab(X(50),y1+36,'Host community (comparison group)','center',CC.soft,12.5,true); lab(x0-52,Y(50),'Refugees, IDPs or stateless people','center',CC.soft,12.5,true,-90);
        lab(X(100)+10,Y(100)+2,'Equal','left',CC.mute,11); lab(X(22),Y(90),'Higher among displaced people','center',CC.grey,11,true); lab(X(78),Y(8),'Higher in the host community','center',CC.grey,11,true) } }
    title='DISPLACED PEOPLE COMPARED WITH THE HOST COMMUNITY'; mode=pr.length+' VALUES WITH A COMPARISON GROUP · '+new Set(pr.map(d=>d.iso)).size+' COUNTRIES'; legend=gs.filter(k=>pr.some(d=>d.g===k)).map(k=>['g'+k,'Goal '+k+' · '+(SDGN[k]||'')]).concat([['gen1m','White outline: a higher value is worse ('+[...new Set(pr.filter(gxBad).map(d=>d.name.toLowerCase()))].join(', ')+')']]);
    note='Across is the host community or the survey\'s comparison group; up is the displaced group. For circles with a white outline, being above the line means displaced people are worse off.';
  }
  return {pos,deco,labels,title,legend,mode,note};
}
function gxDeco(ctx,d,al){ if(d.t==='img'){ const im=gxImg(d.g); if(im.ok){ ctx.globalAlpha=al; ctx.drawImage(im,d.x,d.y,d.s,d.s); ctx.globalAlpha=1 } return }
  if(d.t==='leader'&&d.dash){ ctx.save(); ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(d.pts[0][0],d.pts[0][1]); ctx.lineTo(d.pts[1][0],d.pts[1][1]); ctx.globalAlpha=.8*al; ctx.strokeStyle=d.c; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); return }
  sxDeco(ctx,d,al) }
function gxThumbs(){ document.querySelectorAll('canvas[data-gx]').forEach(cv=>{ const W=Math.max(120,cv.parentNode.clientWidth), H=118, ctx=sxCanvas(cv,W,H), b=gxBuild(cv.dataset.gx,W,H,true);
  ctx.clearRect(0,0,W,H); b.deco.forEach(d=>gxDeco(ctx,d,1)); b.pos.forEach((o,id)=>sxDot(ctx,o.x,o.y,o.r,o.k,null,gGoal&&gxRows()[id].g!==gGoal?.2:1)); sxLabels(ctx,b.labels,1) }) }
const GX={lay:'goals',P:null,hover:null,reg:null,raf:0,last:0,labA:0,b:null,W:0,H:0};
function gxShell(){
  const z=$('zoomer'), [W,H]=chSize(GX.lay==='countries'); GX.W=W; GX.H=H;
  const b=gxBuild(GX.lay,W,H,false), seg=(v,t)=>`<button type="button" class="chip" data-act="gxl" data-v="${v}" aria-pressed="${GX.lay===v}">${t}</button>`;
  z.innerHTML=`<div class="zbox sxbox" role="dialog" aria-modal="true" aria-label="SDG values, chart"><div class="zhead"><div><p class="eyebrow" style="color:${LAYER.sdg.col}">${b.mode}</p><h2 style="font-size:15px;font-family:var(--mono);font-weight:500;letter-spacing:.06em;color:#8db8e3">${b.title}</h2></div><span class="zact">${act('ztab','',zTab?'Show as chart':'Show as table','chip',`aria-pressed="${zTab}"`)}<button type="button" class="x" data-act="zclose">Close ✕</button></span></div>
    <div class="sxctl"><span>Show</span>${seg('goals','By goal')}${seg('countries','By country')}${seg('wheel','Goal wheel')}${seg('gap','Displaced and host')}${gGoal?`<span style="margin-left:14px">Goal ${gGoal} picked out</span>${act('goal',gGoal,'Show all goals','chip')}`:''}</div>
    ${zTab?gxTable(W,H):`<div class="sxwrap" style="width:${W}px;height:${H}px"><canvas id="gxcv" role="img" aria-label="${esc(b.title)}"></canvas><div id="sxpv" hidden></div></div>`}
    <div class="zleg">${b.legend.map(l=>l[0]?`<span><i class="d ${SXK[l[0].replace(/m$/,'')][1]?'':'ring'}" style="--c:${SXK[l[0].replace(/m$/,'')][0]};${l[0].endsWith('m')?'outline:1.5px solid #fff':''}"></i>${l[1]}</span>`:`<b>${l[1]}</b>`).join('')}</div>
    <p class="lnote">One circle is one value for one country. Point at a circle to read it. Select it to open the country. ${b.note}</p></div>`;
  z.hidden=false; if(zTab) return; const cv=$('gxcv'); cv.addEventListener('pointerdown',e=>{ GX.touch=e.pointerType!=='mouse' }); GX.ctx=sxCanvas(cv,W,H); GX.b=b; GX.labA=0; GX.hover=null; GX.reg=null;
  if(!GX.P) GX.P=gxRows().map(d=>({id:d.id,x:sxHash(d.id,1)*W,y:-30-sxHash(d.id,2)*H,r:2,a:0,k:gxKey(d),rate:.05+sxHash(d.id,13)*.07}));
  cv.addEventListener('mousemove',gxMove); cv.addEventListener('mouseleave',()=>{ GX.hover=null; GX.reg=null; $('sxpv').hidden=true; cv.style.cursor='default' }); cv.addEventListener('click',gxTap);
  if(!GX.raf){ GX.last=performance.now(); GX.raf=requestAnimationFrame(gxTick) }
}
function gxNearest(e){ const r=e.currentTarget.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; let best=null, bd=1e9; for(const p of GX.P){ if(p.a<.12||!GX.b.pos.has(p.id)) continue; const d=Math.hypot(p.x-x,p.y-y); if(d<Math.max(8,p.r+4)&&d<bd){ bd=d; best=p } } return [best,x,y] }
function gxMove(e){ const [p,x,y]=gxNearest(e), cv=e.currentTarget, pv=$('sxpv'), b=GX.b; let reg=null;
  if(GX.lay==='countries'){ const h=b.deco.find(d=>d.t==='hit'&&y>=d.y0&&y<d.y1); if(h) reg=h.reg } else if(GX.lay==='goals'){ const h=b.deco.find(d=>d.t==='hitx'&&x>=d.x0&&x<d.x1); if(h) reg=h.reg }
  GX.reg=reg; cv.style.cursor=p?'pointer':'default';
  if(!p){ GX.hover=null; pv.hidden=true; return } if(GX.hover===p.id&&!pv.hidden) return; GX.hover=p.id; GX.hkT=performance.now(); const d=gxRows()[p.id], col=gLite(d.g);
  pv.innerHTML=`<span class="exmeta" style="color:${col}">GOAL ${d.g} · ${esc(SDGN[d.g]||'')}</span><b>${esc(Q.ctry[d.iso].n)} · ${esc(d.code)} ${esc(d.name)}</b>`
    +(d.t==='c'?`<div class="chips2"><i class="rc" style="background:${col};color:#0a1430">${esc(d.g1)} ${d.r}%</i>${d.h!=null?`<i>${esc(d.g2||'Comparison group')} ${d.h}%</i>`:''}</div>${gxBad(d)?'<small>For this indicator a higher value is worse.</small>':''}<small>${esc(d.from)} · calculated from the survey file</small>`
      :`<div class="chips2"><i class="rc" style="background:none;box-shadow:inset 0 0 0 1.5px ${col};color:#fff">${esc(d.val)}${d.grp?' · '+esc(d.grp):''}</i></div><small>${esc(d.from)} · from a published report</small>`)
    +`<small class="hint">${TCH()} to open ${esc(Q.ctry[d.iso].n)}</small>`;
  pv.hidden=false; const pw=Math.min(320,GX.W-24), ph=pv.offsetHeight||150; let px=p.x+20; if(px+pw>GX.W-8) px=p.x-20-pw; pv.style.width=pw+'px'; pv.style.left=Math.max(8,px)+'px'; pv.style.top=Math.max(8,Math.min(GX.H-ph-8,p.y-50))+'px' }
function gxTap(e){ const [p]=gxNearest(e); if(!p||(GX.touch&&performance.now()-(GX.hkT||0)<700)) return; gxOpen(p.id) }
function gxOpen(id){ const d=gxRows()[id]; if(!Q.ctry[d.iso]) return;
  zChart=null; layer='sdg'; chosen=true; gSel=d.iso; fEx=fSv=null; czSel=null; mapInd=null; mapG=0; fSrc=d.t==='c'?d.src:null; fInd=d.t==='c'?d.code:null; if(d.t==='c'&&Q.sub.val[d.iso]&&Q.sub.val[d.iso][d.code]) mapInd=d.code; level='country'; setHash(); render(); const rc=d.t==='r'&&document.querySelector('.rcard'); if(rc) rc.scrollIntoView({block:'center'}); else window.scrollTo({top:0,behavior:RM?'auto':'smooth'}) }
function gxTick(now){ GX.raf=0; const z=$('zoomer'); if(z.hidden||zChart!=='gx'||!$('gxcv')) return; const dt=Math.min(64,now-GX.last); GX.last=now;
  const b=GX.b, ctx=GX.ctx, W=GX.W, H=GX.H, rows=gxRows(), dpr=Math.min(2,window.devicePixelRatio||1); GX.labA+=(1-GX.labA)*(RM?1:1-Math.pow(.9,dt/16.7));
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H); b.deco.forEach(d=>gxDeco(ctx,d,GX.labA));
  if(GX.reg!=null){ const h=b.deco.find(d=>(d.t==='hit'||d.t==='hitx')&&d.reg===GX.reg); if(h){ ctx.globalAlpha=.06; ctx.fillStyle='#fff'; if(h.t==='hit') ctx.fillRect(0,h.y0,W,h.y1-h.y0); else ctx.fillRect(h.x0,0,h.x1-h.x0,H); ctx.globalAlpha=1 } }
  for(const p of GX.P){ const t=b.pos.get(p.id), k=RM?1:1-Math.pow(1-p.rate,dt/16.7), d=rows[p.id]; let ta=0;
    if(t){ p.x+=(t.x-p.x)*k; p.y+=(t.y-p.y)*k; p.r+=(t.r-p.r)*k; p.k=t.k; ta=(gGoal&&d.g!==gGoal)||(GX.reg!=null&&(GX.lay==='countries'?d.iso!==GX.reg:d.g!==GX.reg))?.2:1 }
    p.a+=(ta-p.a)*k; sxDot(ctx,p.x,p.y,p.r,p.k,null,p.a);
    if(GX.hover===p.id&&t){ ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(6,p.r+4),0,6.2832); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke() } }
  sxLabels(ctx,b.labels,GX.labA); GX.raf=requestAnimationFrame(gxTick) }

function goalCounts(iso){ const n={}; sdgRows(iso).forEach(([d])=>{const g=goalOf(d.c); n[g]=(n[g]||0)+1}); (Q.ctry[iso].rep||[]).forEach(x=>{const g=goalOf(x[0]); n[g]=(n[g]||0)+1}); return n }
function wheelSvg(n,size,label){ const gs=Object.keys(n).map(Number).filter(g=>SDGC[g]).sort((a,b)=>a-b), tot=gs.reduce((s,g)=>s+n[g],0)||1; let off=25, s='';
  gs.forEach(g=>{ const len=n[g]/tot*100, gap=gs.length>1?1.2:0; s+=`<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${SDGC[g]}" stroke-width="6.5" stroke-dasharray="${Math.max(.5,len-gap).toFixed(2)} ${(100-Math.max(.5,len-gap)).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" opacity="${gGoal&&gGoal!==g?.22:1}"/>`; off-=len });
  return `<svg viewBox="0 0 42 42" width="${size}" height="${size}" aria-hidden="true">${s}<text x="21" y="21" text-anchor="middle" dominant-baseline="central" font-size="${size>70?11:12}" font-weight="600" fill="#fff">${label}</text></svg>` }
function sdgCharts(big){
  const list=Object.keys(Q.ctry).filter(k=>has(k,'sdg')).map(k=>[k,goalCounts(k)]).map(([k,n])=>[k,n,Object.values(n).reduce((a,b)=>a+b,0)]).filter(x=>x[2]).sort((a,b)=>b[2]-a[2]||Q.ctry[a[0]].n.localeCompare(Q.ctry[b[0]].n));
  const all={}; list.forEach(([k,n])=>Object.keys(n).forEach(g=>all[g]=(all[g]||0)+n[g])); const tot=Object.values(all).reduce((a,b)=>a+b,0), gs=Object.keys(all).map(Number).sort((a,b)=>a-b);
  const pv=(lay,t)=>['gx:'+lay,t,'',`<button type="button" class="sxt" data-act="zc" data-v="gx:${lay}" aria-label="Open the interactive chart"><canvas data-gx="${lay}"></canvas></button>`];
  if(big) return [    ['ctry','Goals covered, country by country','One ring per country, split by goal. The number is how many values the country has.',`<div class="wheels">${list.map(([k,n,c])=>`<button type="button" class="whb ${gGoal&&!n[gGoal]?'dim':''}" data-act="pick" data-v="${k}" aria-label="${esc(Q.ctry[k].n)}: ${c} values" ${tipA(Q.ctry[k].n,c+(c===1?' value':' values')+' · '+Object.keys(n).map(Number).sort((a,b)=>a-b).map(g=>'goal '+g+(n[g]>1?' ×'+n[g]:'')).join(', ')+'<br>Select to open the country.')}>${wheelSvg(n,big?62:34,c)}<small>${esc(Q.ctry[k].n)}</small></button>`).join('')}</div>`]
  ];
  return [pv('goals','By goal'),pv('countries','By country'),pv('wheel','Goal wheel'),pv('gap','Displaced and host')].concat([['ctry','Goals covered, country by country','',`<div class="wheels">${list.map(([k,n,c])=>`<button type="button" class="whb ${gGoal&&!n[gGoal]?'dim':''}" data-act="pick" data-v="${k}" aria-label="${esc(Q.ctry[k].n)}: ${c} values" ${tipA(Q.ctry[k].n,c+(c===1?' value':' values')+'<br>Select to open the country.')}>${wheelSvg(n,34,c)}<small>${esc(Q.ctry[k].n)}</small></button>`).join('')}</div>`]]);
}
function stripHtml(){ const pv=(lay)=>`<button type="button" class="sxt" data-act="zc" data-v="ix:${lay}" aria-label="Open the interactive chart"><canvas data-ix="${lay}"></canvas></button>`;
  const cs=layer==='gain'?gainCharts(false):layer==='sdg'?sdgCharts(false):[['ix:routes','Identification routes','',`<button type="button" class="sxt" data-act="zc" data-v="ix:routes" aria-label="Open the identification routes">${routeAgg()}</button>`],['ix:items','By EGRISS question','',pv('items')],['ix:sim','Similarity','',pv('sim')],['ix:surveys','Coverage grid','',pv('surveys')],['ix:match','Wording match','',pv('match')],['ix:reasons','Reasons for displacement','',pv('reasons')]];
  return cs.map(c=>`<div class="gtile t-${c[0].split(':')[0]}"><div class="gth"><h4>${c[1]}</h4><button type="button" class="zbtn" data-act="zc" data-v="${c[0]}" aria-label="Enlarge: ${c[1]}" ${tipA('Enlarge','Open this chart at full size')}>⤢</button></div>${c[3]}</div>`).join('') }
function renderZoom(){ const z=$('zoomer'); if(!zChart||level!=='world'){ z.hidden=true; z.innerHTML=''; return }
  if(zChart==='ix'){ if(layer!=='idq'){ zChart=null; z.hidden=true; return } ixShell(); return }
  if(zChart==='gx'){ if(layer!=='sdg'){ zChart=null; z.hidden=true; return } gxShell(); return }
  if(zChart==='sx'){ if(layer!=='gain'){ zChart=null; z.hidden=true; return } sxShell(); return }
  const c=(layer==='gain'?gainCharts(true):sdgCharts(true)).find(x=>x[0]===zChart); if(!c){ zChart=null; z.hidden=true; return }
  z.innerHTML=`<div class="zbox" role="dialog" aria-modal="true" aria-label="${c[1]}"><div class="zhead"><div><p class="eyebrow" style="color:${LAYER[layer].col}">${LAYER[layer].n}</p><h2>${c[1]}</h2><p class="lnote" style="margin-top:4px">${c[2]}${layer==='gain'&&gfOn()?' Filtered: '+esc(gfText())+'.':''}</p></div><button type="button" class="x" data-act="zclose">Close ✕</button></div><div class="zbody big t-${c[0]}">${c[3]}</div>${layer==='gain'&&c[0]!=='donut'&&c[0]!=='trend'?GLEG:''}${layer==='gain'&&gfOn()?`<p class="lnote">${act('gf','clear','Clear filters','lk')}</p>`:''}</div>`;
  z.hidden=false }
function pWorld(){
  const c=Q.ctry[gSel], L=layer, list=Object.keys(Q.ctry).filter(i=>has(i,L)).sort((a,b)=>Q.ctry[a].n.localeCompare(Q.ctry[b].n));
  const cnt=i=>L==='gain'?Q.ctry[i].ex.length+' ex.':L==='sdg'?(sdgRows(i).length+Q.ctry[i].rep.length)+' values':(Q.ctry[i].sv.length?Q.ctry[i].sv.length+' quest.':'causes');
  let body='';
  if(!has(gSel,L)) body=`<div class="band"><p style="color:var(--soft)">Nothing in ${LAYER[L].n} for ${esc(c.n)} yet.</p>${elsewhere(gSel)}</div>`;
  else if(L==='gain'){ const open=fEx!=null?c.ex.find(e=>e[0]===fEx):null;
    body=`<div class="ccard"><div class="kmapcol"><div class="snmap kmap">${miniMap(gSel)}</div><div class="kleg" id="kleg"></div>${(n=>Object.keys(n).length?`<div class="recsum"><h3>Recommendations used here</h3><div>${['IRRS','IRIS','IROSS'].filter(k=>n[k]).map(k=>`<span ${tipA(k,esc(RECS[k]))}><img src="recs/${k}.jpg" alt=""><b>${n[k]}</b><small>${k}</small></span>`).join('')}</div></div>`:'')(c.ex.reduce((o,e)=>{recSet(e).forEach(k=>o[k]=(o[k]||0)+1); return o},{}))}</div>
      <div class="kex">${open?exOpen(open,gSel):`<div class="lhead"><h2>${c.ex.length} GAIN ${c.ex.length===1?'example':'examples'}</h2></div><p class="lnote">Point at one to see on the map who it covers. Select it to open its card.</p>
        <div class="exrows">${exRows(gSel)}</div>`}</div></div>` }
  else if(L==='sdg'){ const svs=surveysOf(gSel), keys=subKeys(gSel), goals=[...new Set(sdgRows(gSel).map(([d])=>goalOf(d.c)).concat(c.rep.map(x=>goalOf(x[0]))))].sort((a,b)=>a-b);
    body=`<div class="band"><h3>Goals with a value for ${esc(c.n)}</h3><div class="goals">${goals.map(g=>SDGI.has(g)?`<img src="sdg/${g}.png" alt="SDG ${g}" ${tipA('Goal '+g,esc(SDGN[g]||''))}>`:`<span class="gt" style="background:${SDGC[g]}"><b>${g}</b></span>`).join('')}</div></div>`+[...svs].map(([k,rs])=>`<div class="band"><div class="lhead"><h2>${esc(rs[0][1].fam)}${rs[0][1].year?' · '+esc(rs[0][1].year):''}</h2><span class="lnote">calculated from microdata</span></div><div class="rows">${rs.map(([x,y])=>`<div class="ind sg" style="cursor:default;--gc:${gcolOf(x.c)}">${goalTile(x.c,x.pri)}<span class="iname">${esc(x.n)}${y.v&&y.v.st==='fix'?' <i class="pill flag">Corrected</i>':y.v&&y.v.st==='new'?' <i class="pill new">New</i>':''}</span>${y.h!=null?barPair(y.r,y.h):`<div class="bars"><div class="bar"><div class="track"><div class="fill r" style="width:${y.r}%"></div></div><span class="bv">${y.r}%</span></div></div>`}<span></span></div>`).join('')}</div><p class="lnote">First bar: ${esc(rs[0][1].g1.toLowerCase())}. Second: ${rs[0][1].g2?esc(rs[0][1].g2.toLowerCase()):'no comparison group'}. Zoom in for how each was calculated.</p></div>`).join('')
      +(c.rep.length?`<div class="band"><h3>${c.rep.length} from published reports</h3><div>${c.rep.map(x=>`<div class="irow"><div class="itop">${goalTile(x[0])}<span>${esc(x[2])}</span><b>${esc(x[1])}</b></div>${x[10]?`<a class="rlk" href="${esc(x[10])}" target="_blank" rel="noopener">${esc(x[11]||x[3])} ↗</a>`:`<span class="rlk">${esc(x[3])}</span>`}</div>`).join('')}</div></div>`:'')
      +`<div class="fl">${keys.length?`<i class="pill new">New</i><span>Below country level: ${keys.length} ${keys.length===1?'indicator':'indicators'} by ${Q.sub.val[gSel]?Q.sub.meta[gSel].unit:Q.sub.rep[gSel].unit}, on the country map.</span>`:'<i class="pill plain">National</i><span>No values below country level yet.</span>'}</div>` }
  else body=causesBlock(c)+`<div class="band"><h3>${c.sv.length?c.sv.length+' '+(c.sv.length===1?'questionnaire':'questionnaires')+' compared with the EGRISS questions':'No questionnaire compared yet'}</h3><div class="rows">${c.sv.map(s=>`<div class="oex" style="grid-template-columns:minmax(0,1fr) auto"><span style="font:inherit;color:inherit">${esc(Q.surveys[s][1])}</span><span>${itemsAsked(s).length} of 13 items</span></div>`).join('')}</div></div>`;
  return `<div class="chead" style="--lc:${LAYER[L].col}"><div><p class="eyebrow" style="color:var(--lc)">${LAYER[L].n} · country card</p><h2>${esc(c.n)}</h2></div>${dots(gSel)}${act('zoom','',`Open country map →`,'actbtn','style="margin-left:auto;background:var(--lc);border-color:var(--lc);color:var(--night);font-weight:600"')}${wsBtn(L,gSel)}</div>`
   +body
   +(L==='gain'?regBlock():'')
   +`<details class="band"><summary style="cursor:pointer"><h3 style="display:inline">Browse the ${list.length} countries in ${LAYER[L].n}</h3></summary><div class="clist" style="max-height:300px;overflow-y:auto;margin-top:10px">${list.map(i=>`<button class="crow" type="button" data-act="pick" data-v="${i}" aria-pressed="${i===gSel}"><span>${esc(Q.ctry[i].n)}</span><span>${cnt(i)}</span></button>`).join('')}</div>
      ${L==='idq'?'<p class="lnote">EHCVM 2026 covers 10 countries and is not placed on the map yet.</p>':''}</details>`;
}

/* ---- GAIN at country level ---- */
function exLinks(iso,id){const src=Q.exsrc[id], rows=src?surveysOf(iso).get(src):null, rep=Q.sub.rep[iso]&&Q.sub.rep[iso].ex===id?Q.sub.rep[iso]:null; return {src,rows,rep,bs:src!=null?Q.link[src]:undefined,hold:src?HOLD[src]:null}}
function exRows(iso){ const c=Q.ctry[iso], X=exF(iso); return (gfOn()?`<p class="lnote" style="margin:0 0 6px">Showing ${X.length} of ${c.ex.length}: ${esc(gfText())}. ${act('gf','clear','Clear filters','lk')}</p>`:'')+X.map(e=>{const k=exLinks(iso,e[0]); return `<button class="exr" type="button" data-act="ex" data-v="${e[0]}" data-exh="${e[0]}">${e[9]?`<img class="th" src="covers/ex${e[0]}.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<span class="th none"></span>'}<span class="tt"><span class="yr">${e[1]}</span><b>${esc(e[2])}</b><small>${esc(e[3])}</small><small class="gr">${e[7]?esc(e[7]):'groups not recorded'}${recSet(e).length?' · '+recSet(e).join(' + '):''}</small></span><span class="mk"><i class="bd ${e[4]?'f':''}" ${tipA(e[4]?'Uses the Recommendations':'Not using them, or not known','')}></i>${k.bs!=null?`<i class="bd f" style="--c:${LAYER.idq.col}"></i>`:''}</span></button>`}).join('') }
function pGain(){
  const iso=gSel, c=Q.ctry[iso], open=fEx!=null?c.ex.find(e=>e[0]===fEx):null;
  const n=c.ex.reduce((o,e)=>{recSet(e).forEach(k=>o[k]=(o[k]||0)+1); return o},{});
  const A=(c.pop?`<div class="band">${tiles(c)}</div>`:'')+(Object.keys(n).length?`<div class="band"><div class="recsum" style="border:0;padding:0"><h3>Recommendations used in these examples</h3><div>${['IRRS','IRIS','IROSS'].filter(k=>n[k]).map(k=>`<span ${tipA(k,esc(RECS[k]))}><img src="recs/${k}.jpg" alt=""><b>${n[k]}</b><small>${k}</small></span>`).join('')}</div></div></div>`:''), B=(c.ex.length?`<div class="kex">${open?exOpen(open,iso):`<div class="lhead"><h2>${c.ex.length} GAIN ${c.ex.length===1?'example':'examples'}</h2></div><p class="lnote">Point at an example to see on the map who it covers. Select it for the details.</p><div class="exrows" style="max-height:none">${exRows(iso)}</div>`}</div>`
     :`<div class="band"><p style="color:var(--soft)">No GAIN example for ${esc(c.n)} yet.</p>${elsewhere(iso)}</div>`);
  return sits('gain',true,'The country page: map, populations and examples.')+(open?B+A:A+B);
}
function coverBig(id){
  if(level!=='country'||layer!=='gain'||mapInd) return; const root=$('cmap'), P=root.querySelector('#m-pts'); if(!P) return;
  const iso=gSel, c=Q.ctry[iso], m=Q.cm[iso], e=id!=null?c.ex.find(x=>x[0]===+id):null;
  const gs=e?(e[7]?e[7].split(', '):[]):null, idx=gs?new Set(gs.map(g=>GN.indexOf(g)).filter(i=>i>=0)):null, names=e&&e[11]?e[11].toLowerCase().split('|'):[];
  if(idx&&idx.has(0)) idx.add(3);
  root.dataset.cov=1; P.style.opacity=e?1:.85;
  P.querySelectorAll('[data-g]').forEach(p=>{ const on=!idx||idx.has(+p.dataset.g)||(p.dataset.n&&names.includes(p.dataset.n.toLowerCase())); p.style.opacity=on?'':.08 });
  const idp=root.querySelector('#m-idp'); if(idp) idp.style.opacity=!idx||idx.has(2)?1:.1;
  const src=e?Q.exsrc[e[0]]:null, sampled=!!(src&&Q.sub.val[iso]&&surveysOf(iso).has(src));
  root.querySelectorAll('#m-camps circle').forEach(k=>{ k.style.opacity=sampled?1:0; k.style.fill=sampled?'transparent':'' });
  let note=$('covnote'); if(!note){ note=document.createElement('p'); note.id='covnote'; note.className='lnote'; $('stfoot').appendChild(note) }
  note.innerHTML=e?`<b style="font-weight:600;color:var(--soft)">On the map:</b> ${gs.length?'where the groups this example covers are located ('+esc(gs.join(', ').toLowerCase().replace(/\bidps\b/g,'IDPs'))+')':'this example does not record which groups it covers'}${sampled?'; white rings are the camps the survey sampled':''}.`:'';
}

/* ---- SDG at country level ---- */
function pSdg(){
  const iso=gSel, c=Q.ctry[iso], svs=surveysOf(iso), REP=Q.sub.rep[iso];
  if(!svs.size&&!REP&&!c.rep.length) return sits('sdg',true,'Values for this country.')+`<div class="band"><p style="color:var(--soft)">No SDG value for ${esc(c.n)} yet.</p>${elsewhere(iso)}</div>`;
  if(!fSrc||(fSrc!=='__rep'&&!svs.has(fSrc))||(fSrc==='__rep'&&!REP)) fSrc=[...svs.keys()].sort((a,b)=>svs.get(b).length-svs.get(a).length)[0]||(REP?'__rep':null);
  const chips=[...svs].map(([k,rs])=>act('src',k,esc(rs[0][1].fam)+(rs[0][1].year?' · '+esc(rs[0][1].year):''),'chip',`aria-pressed="${k===fSrc}"`)).join('')+(REP?act('src','__rep','Report tables by state','chip',`aria-pressed="${fSrc==='__rep'}"`):'');
  let body='';
  if(fSrc==='__rep'){
    const k=mapInd&&REP.ind[mapInd]?mapInd:Object.keys(REP.ind)[0], R=REP.ind[k];
    body=`<div class="ctl"><h3>Indicator</h3><div class="chips">${Object.keys(REP.ind).map(x=>act('map',x,esc(REP.ind[x].n),'chip',`aria-pressed="${x===k}"`)).join('')}</div></div>
      <div class="eqcard"><div class="eq"><div class="fracv"><div class="n"><small>Numerator</small>${esc(R.num)}</div><div class="d"><small>Denominator</small>${esc(R.den)}</div></div><span class="eqop">× 100 =</span><div class="eqres"><div><div class="bigv" style="color:var(--teal)">${R.all}%</div><div class="bigl">IDPs, seven states</div></div></div></div>
        <div class="fl"><i class="pill plain">Report</i><span>${esc(REP.src)}. ${esc(R.tbl)}. A published table: the variables behind it are not in our files.</span></div></div>
      <div class="band"><div class="lhead"><h3>By state</h3>${mapInd===k?'<i class="pill ok">On the map</i>':act('map',k,'Show on the map')}</div><div class="tw"><table class="snt"><tr><th>State</th><th>Value</th><th>Estimated ${R.nl}</th></tr>${Object.entries(R.vals).map(([s,v])=>`<tr><td>${esc(s)}</td><td class="v">${v[0]}%</td><td class="n">${fmt(v[1])}${v[1]<500?' <i class="pill tbc">small</i>':''}</td></tr>`).join('')}</table></div></div>
      <div class="band" style="border-left:3px solid ${LAYER.idq.col}"><div class="lhead"><h2>Who is counted</h2></div><p style="color:var(--soft)">Displaced households in camps and host communities in the seven states surveyed. The report does not print the identification questions. <i class="pill tbc">To confirm</i></p></div>`;
  } else if(fSrc) {
    const rows=svs.get(fSrc); if(!fInd||!rows.some(([d])=>d.c===fInd)) fInd=(rows.find(([d])=>d.c==='6.1.1')||rows[0])[0].c;
    const [d,r]=rows.find(([x])=>x.c===fInd), hasV=Q.sub.val[iso]&&Q.sub.val[iso][fInd], hold=HOLD[fSrc];
    body=`<div class="band"><h3>${rows.length} ${rows.length===1?'indicator':'indicators'} from this survey</h3><p class="lnote" style="margin:2px 0 8px">Select one to see it on the map and how it was calculated.</p><div class="rows">${rows.map(([x,y])=>`<button class="ind sg" type="button" data-act="ind" data-v="${x.c}" style="--gc:${gcolOf(x.c)};${x.c===fInd?'background:rgba(122,167,230,.16);box-shadow:inset 3px 0 0 '+gcolOf(x.c):''}">${goalTile(x.c,x.pri)}<span class="iname">${esc(x.n)}</span>${y.h!=null?barPair(y.r,y.h):`<div class="bars"><div class="bar"><div class="track"><div class="fill r" style="width:${y.r}%"></div></div><span class="bv">${y.r}%</span></div></div>`}<span class="go">${x.c===fInd?'Shown':'Show →'}</span></button>`).join('')}</div>
        <p class="lnote">Top bar: ${esc(r.g1.toLowerCase())}. ${r.g2?'Bottom bar: '+esc(r.g2.toLowerCase())+'.':'This survey has no comparison group.'} ◆ marks an EGRISS priority indicator.</p></div>
      <div class="eqcard" style="border-top:4px solid ${gcolOf(d.c)}"><div style="display:flex;gap:14px;align-items:center">${goalTile(d.c,d.pri,true)}<div><p class="eyebrow" style="color:${gcolOf(d.c)}">Goal ${goalOf(d.c)} · ${esc(SDGN[goalOf(d.c)]||'')}</p><h2 style="font-size:20px;margin-top:4px">${esc(d.n)}</h2><p class="lnote">${esc(r.fam)}${r.year?' · '+esc(r.year):''}</p></div></div>
        <div class="eq"><div class="fracv"><div class="n"><small>Numerator</small>${esc(d.num)}</div><div class="d"><small>Denominator</small>${esc(d.den)}</div></div><span class="eqop">× 100 =</span>
        <div class="eqres"><div><div class="bigv" style="color:${gcolOf(d.c)}">${r.r}%</div><div class="bigl">${esc(r.g1)}</div></div>${r.h!=null?`<div><div class="bigv" style="color:var(--soft)">${r.h}%</div><div class="bigl">${esc(r.g2||'Host')}</div></div>`:''}</div></div>
        <div class="fl"><i class="pill plain">Official</i><span>${esc(d.offt)}. <a href="https://unstats.un.org/sdgs/metadata/?Text=&Goal=${goalOf(d.c)}&Target=${d.c.split('.').slice(0,2).join('.')}" target="_blank" rel="noopener">UN metadata ↗</a></span></div>
        ${d.off?`<div class="fl"><i class="pill flag">Check</i><span>${esc(d.off)}</span></div>`:''}</div>
      ${howBand(r,d)}
      ${identBand(iso,fSrc,r)}
      <div class="band"><div class="lhead"><h3>Below country level</h3>${mapInd===fInd?'<i class="pill ok">On the map</i>':act('map',fInd,'Show on the map')}</div>${hasV?`<p class="lnote">Point at an area or a camp on the map for its value.</p><details><summary style="cursor:pointer;color:var(--mute);font-size:13px">Table of all areas</summary>${areaTable(iso,fInd)}</details>`:(tabOf(iso,fInd,r)?`<p class="lnote">Calculated by ${esc(Q.sub.tab[iso].unit)} with the same definition. No boundaries for these areas on the map yet, so the map shows the national value.</p>${tabTable(iso,fInd)}`:'<p class="lnote">Not calculated below country level for this indicator and survey. The map shows the national value.</p>')}</div>
      <div class="strip ${hold?'':'off'}" style="--lc:var(--line2)"><span class="sk">Datasets</span><span>${hold?`Microdata at the ${esc(hold[0])}`:'Microdata location not recorded yet'}</span>${act('ds',fSrc,'Where to get it','lkbtn',tipA('Datasets',hold?esc(hold[0])+' · licensed access, requested from the holder':'Holder and link not recorded yet'))}</div>`;
  }
  return sits('sdg',false,'The calculation behind each value is new; the map and values exist.')
   +(chips?`<div class="ctl"><h3>Source</h3><div class="chips">${chips}</div></div>`:'')+body
   +(c.rep.length?`<div class="band"><h3>${c.rep.length} ${c.rep.length===1?'value':'values'} from published reports</h3><div>${c.rep.map(repCard).join('')}</div><p class="lnote">These values were read from the published report, not calculated from the survey file. The highlighted number on each page is the one shown here.</p></div>`:'');
}

/* ---- ID Questions at country level: causes linked to the map, then questionnaires as a list that opens into a card ---- */
let czSel=null;
const bestOf=rs=>rs.length?rs.map(r=>r[3]).sort((a,b)=>(RANK[a]??9)-(RANK[b]??9))[0]:null;
const modDots=s=>`<span class="mdots" ${tipA('Module coverage','One square per module item, in order. Colour = how close the wording is; empty = not asked.')}>${Q.model.map(m=>{const b=bestOf(bankFor(s,m.code)); return `<i class="${b?'a-'+b:''} ${m.core?'core':''}"></i>`}).join('')}</span>`;
/* the question as printed: a crop of the original page, or the rows of the original file */
function printed(r,seen){
  const X=Q.exc, i=r[12], f=X.file[r[0]]; if(!f) return '';
  if(X.row[i]!=null){ const k=X.row[i], g=X.img[k], pg=g[3]?'page '+g[3]:'';
    if(seen){ if(seen.has(k)) return `<p class="prn">As printed: in the excerpt above${pg?' ('+pg+')':''}</p>`; seen.add(k) }
    return `<figure class="prt"><a href="${g[0]}" target="_blank" rel="noopener" ${tipA('As printed','Open the excerpt at full size')}><img loading="lazy" src="${g[0]}" width="${g[1]}" height="${g[2]}" alt="The question as printed in the questionnaire${pg?', '+pg:''}"></a><figcaption>As printed · ${esc(g[4]||f[0])}${pg?' · '+pg:''}</figcaption></figure>` }
  if(X.cell[i]){ const [wh,cs,fn]=X.cell[i];
    return `<figure class="prt"><div class="tw"><table class="snt prc">${cs.map((row,n)=>`<tr>${row.map(c=>n?`<td>${esc(c).replace(/\n/g,'<br>')}</td>`:`<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table></div><figcaption>As written in the file · ${esc(fn||f[0])}${wh?' · '+esc(wh):''}</figcaption></figure>` }
  return '';
}
const qBlock=(r,seen)=>`<div class="bq"><div class="l"><span class="qid">${esc(r[1])}</span><i class="pill a-${r[3]}">${esc(r[3])}</i>${r[4]!=='n.a.'&&r[4]!=='none'?`<span class="qmeta">${esc(r[4])}</span>`:''}</div><div class="t"><div class="o">${esc(r[5])}</div>${r[7]&&r[7]!==r[5]?`<div class="e">${esc(r[7])} ${r[8]?'<i class="pill draft">Draft</i>':''}</div>`:''}${r[11]?`<div class="route">↳ ${esc(r[11])}</div>`:''}${printed(r,seen)}<details><summary>Response options and coding note</summary><p>${esc(r[9])}</p>${r[10]?`<p style="margin-top:6px">${esc(r[10])}</p>`:''}</details></div></div>`;
function qOpen(s,iso,noBack){ const seen=new Set(), nEx=Q.bank.filter(r=>r[0]===s&&r[2]!=='none'&&(Q.exc.row[r[12]]!=null||Q.exc.cell[r[12]])).length;
  const all=Q.bank.filter(r=>r[0]===s), coded=all.filter(r=>r[2]!=='none'), src=Object.keys(Q.link).find(k=>Q.link[k]===s), rows=src?surveysOf(iso).get(src):null, asked=itemsAsked(s), extra=EXTRA.filter(k=>bankFor(s,k).length);
  const langs=[...new Set(all.map(r=>r[6]).filter(Boolean))];
  return `<div class="exopen">${noBack?'':`<div>${act('svclose','','← All questionnaires','lk')}</div>`}
    <div><span class="exmeta">${esc(Q.surveys[s][0]).toUpperCase()} · QUESTIONNAIRE</span><h2 style="margin-top:4px">${esc(Q.surveys[s][1])}</h2></div>
    <div class="ptiles"><div><b>${asked.length} of 13</b><span>EGRISS questions asked</span></div><div><b>${asked.filter(m=>m.core).length} of 5</b><span>core questions asked</span></div><div><b>${coded.length}</b><span>identification questions${langs.length?' · '+esc(langs.join(', ')):''}</span></div></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${modDots(s)}<span class="legend" style="font-size:12px"><span>Wording compared with EGRISS:</span><span><i class="sw" style="background:var(--teal)"></i>same</span><span><i class="sw" style="background:var(--blue)"></i>close</span><span><i class="sw" style="background:var(--gold)"></i>partial</span><span><i class="sw" style="background:var(--red)"></i>different</span></span></div>
    <div><h3 style="margin-bottom:4px">The 13 EGRISS questions in order, and how this questionnaire asks each</h3>
      <div class="mflow2">${Q.model.map((m,i)=>{const rs=bankFor(s,m.code); return `<div class="mf two ${m.core?'core':''} ${rs.length?'':'na'}"><div class="mfk"><b>${i+1}</b></div>
        <div class="mfb"><span class="route">↳ ${esc(m.skip||'Ask all')}</span><b tabindex="0" style="cursor:help" ${tipA('Module wording'+(m.core?' · core':' · optional'),esc(m.stem)+(m.opts.length?'<br><br>'+m.opts.map(o=>esc(o)).join('<br>'):''))}>${esc(m.title)}${m.core?' <i class="pill ok">Core</i>':''}</b>
          ${rs.length?rs.map(r=>qBlock(r,seen)).join(''):'<span class="lnote">Not asked</span>'}</div></div>`}).join('')}</div></div>
    ${extra.length?`<div><h3 style="margin-bottom:6px">Related questions outside the 13 EGRISS questions</h3><div class="stack" style="gap:8px">${extra.map(k=>bankFor(s,k).map(r=>`<div><span class="lnote">${esc(k)} · ${esc(ITEM[k]||k)}</span>${qBlock(r,seen)}</div>`).join('')).join('')}</div></div>`:''}
    <p class="lnote">Only the identification part is shown; ${all.length-coded.length} other questions from this questionnaire are kept in the record. ${nEx?(nEx===coded.length?'Each question is shown as it appears in the original questionnaire.':nEx+' of '+coded.length+' questions are shown as they appear in the original questionnaire; the others could not be located in the file.'):'The original questionnaire is not in our files yet, so the questions are shown as recorded in the question bank.'}</p>
    ${false&&rows?`<div class="also"><span>Used for</span>${act('open-sdg',src,`SDG · ${rows.length} values calculated from this survey`,'mini',`style="--lc:${LAYER.sdg.col}"`)}</div>`:''}</div>`;
}
function pIdq(){
  const iso=gSel, c=Q.ctry[iso], one=c.sv.length===1, open=one?c.sv[0]:(fSv!=null&&c.sv.includes(fSv)?fSv:null);
  return sits('idq',false,'Causes of displacement exist on the live map; the questionnaire view is new.')+causesBlock(c,!!Q.cpts[iso])
   +(c.sv.length?`<div class="kex" style="--lc:${LAYER.idq.col}">${open!=null?qOpen(open,iso,one):`<div class="lhead"><h2>${c.sv.length} questionnaires compared with the EGRISS questions</h2></div><p class="lnote">Select one to see how it asks each question, in order.</p>
        <div class="exrows" style="max-height:none">${c.sv.map(s=>{const src=Object.keys(Q.link).find(k=>Q.link[k]===s); return `<button class="exr" type="button" data-act="sv" data-v="${s}" style="grid-template-columns:minmax(0,1fr) auto"><span class="tt"><b>${esc(Q.surveys[s][1])}</b><small>Asks ${itemsAsked(s).length} of the 13 EGRISS questions · ${Q.bank.filter(r=>r[0]===s&&r[2]!=='none').length} identification questions recorded</small>${modDots(s)}</span><span class="mk"></span></button>`}).join('')}</div>`}</div>`
     :`<div class="band"><p style="color:var(--soft)">No questionnaire from ${esc(c.n)} has been mapped against the module yet.</p></div>`);
}
function causes(c){return c.cz.length?`<div class="band"><h3>Causes the evidence supports in ${esc(c.n)}</h3><div class="flow">${c.cz.filter(z=>z[1]==='RECOMMENDED').map(z=>`<span class="qchip">${z[0]} · ${CZ[z[0]]}</span>`).join('')||'<span class="lnote">None recommended.</span>'}</div><p class="lnote">From the causing events map: where enumerators need local examples for the first module item.</p></div>`:''}

/* ---- Datasets: a side resource ---- */
function renderDrawer(){
  const exOf=src=>Object.keys(Q.exsrc).find(k=>Q.exsrc[k]===src);
  const row=d=>{const k=HOLD[d.src], ex=exOf(d.src), bs=Q.link[d.src]; return `<div class="dsrow ${d.src===hitSrc?'hit':''}" id="ds-${esc(d.src).replace(/[^A-Za-z0-9]/g,'_')}"><b>${esc(d.src)}</b><small>${esc(d.country)}${d.year?' · '+esc(d.year):''}</small>
      <span>${k?`${esc(k[0])} · <a href="${k[1]}" target="_blank" rel="noopener">Request or download ↗</a>`:'<i class="pill tbc">To confirm</i> Holder and link still to add'}</span>
      <small>Used by: ${d.inds.length} SDG ${d.inds.length===1?'value':'values'}${ex?' · GAIN example '+ex:''}${bs!=null?' · questionnaire in ID Questions':''}</small></div>`};
  const A=Q.datasets.filter(d=>HOLD[d.src]), C=Q.datasets.filter(d=>!HOLD[d.src]);
  $('drawer').innerHTML=`<button class="x" type="button" data-act="dsclose">Close ✕</button>
    <div><p class="eyebrow">Datasets</p><h2 style="font-size:24px;margin-top:6px">Where to get the data</h2><p class="lnote" style="margin-top:6px">The datasets behind the values, examples and questionnaires in this portal, and who holds them.</p></div>
    <div class="sech"><h3>Held elsewhere · ${A.length}</h3><span class="lnote">request them from the holder</span></div>${A.map(row).join('')}
    <div class="sech"><h3>Hosted by EGRISS · 0</h3></div><div class="dsrow"><span>None yet.</span><small>EGRISS hosts a file only when no one else does and the producer agrees.</small></div>
    <div class="sech"><h3>Holder still to add · ${C.length}</h3><span class="lnote">we are still recording where these can be requested</span></div>${C.map(row).join('')}`;
  $('drawer').hidden=false;
  if(hitSrc){const e=$('ds-'+hitSrc.replace(/[^A-Za-z0-9]/g,'_')); if(e) e.scrollIntoView({block:'center'})}
}

/* ---- where values can go below country level ---- */
function renderDisagg(){
  const D=Q.disagg||[];
  const rows=[['South Sudan','Forced Displacement Survey 2023','State; camp group','Refugees, host community','done'],['Pakistan','Forced Displacement Survey 2024','Province','Refugees, host community','done'],['Zambia','Forced Displacement Survey 2025','Province (4 sampled)','Refugees, host community, former refugees','done'],['Nigeria','NBS IDP survey 2023 (report tables)','State','IDPs','rep']]
    .concat(D.map(d=>[d.country,d.survey,d.level,d.groups,d.status,d.note]));
  const pill={done:'<i class="pill ok">On the map</i>',rep:'<i class="pill ok">On the map</i> <span class="lnote">from report</span>',calc:'<i class="pill ok">Calculated</i> <span class="lnote">table on the country page</span>',can:'<i class="pill new">Possible</i>',thin:'<i class="pill tbc">Thin cells</i>',no:'<i class="pill plain">National only</i>'};
  $('disagg').innerHTML='<tr><th>Country</th><th>Survey</th><th>Lowest level</th><th>Groups</th><th>Status</th></tr>'+rows.map(r=>`<tr><td><b style="font-weight:600">${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}${r[5]?`<br><small>${esc(r[5])}</small>`:''}</td><td>${esc(r[3])}</td><td>${pill[r[4]]||''}</td></tr>`).join('');
  $('disaggnote').textContent=D.length?'Checked in the survey files: an area variable and a displacement group in the same file. "Calculated" rows were run with the definition that reproduces the national value; "Possible" rows have the variables but were not run.':'The other survey files are being checked for an area variable next to a displacement group.';
}

function renderFlowModule(){
  const n=code=>new Set(Q.bank.filter(r=>r[2]===code).map(r=>r[0])).size;
  $('mflow').innerHTML=Q.model.map((m,i)=>`<div class="mf ${m.core?'core':''}"><div class="mfk"><b>${i+1}</b><span>${esc(m.code)}</span>${m.core?'<i class="pill ok">Core</i>':'<i class="pill plain">Optional</i>'}</div>
    <div class="mfb"><span class="route">↳ ${esc(m.skip||'Ask all')}</span><b>${esc(m.title)}</b><span tabindex="0" ${m.opts.length?tipA('Answer options',m.opts.map(o=>esc(o)).join('<br>')):''}>${esc(m.stem)}${m.opts.length?' <i class="pill plain">'+m.opts.length+' options</i>':''}</span></div>
    ${act('bank',m.code,`Asked in ${n(m.code)} of ${Q.surveys.length} →`,'lkbtn',tipA('Question bank','See how every questionnaire words this item, with its own skip logic.'))}</div>`).join('');
}

document.addEventListener('pointerover',e=>{ if(layer!=='gain') return; const f=level==='world'?coverMap:coverBig, r=e.target.closest&&e.target.closest('[data-exh]'); if(r) f(r.dataset.exh); else if(e.target.closest&&e.target.closest('.kex')) f(fEx) });
document.addEventListener('pointerover',e=>{ if(layer!=='idq'||level!=='country'||mapInd!=='__cause') return; const r=e.target.closest&&e.target.closest('[data-czh]'); czFocus(r?r.dataset.czh:czSel) });
document.addEventListener('focusin',e=>{ const r=e.target.closest&&e.target.closest('[data-exh]'); if(r&&layer==='gain') (level==='world'?coverMap:coverBig)(r.dataset.exh) });

function enterLayer(){ czSel=null; $('drawer').hidden=true; $('tip').hidden=true; delete belowDone['auto'+gSel]; delete belowDone['cz'+gSel]; mapG=0;
  mapInd=layer==='sdg'&&fInd&&fSrc!=='__rep'?fInd:null;
  const y=$('crumb').getBoundingClientRect().top; if(y<0) window.scrollTo({top:window.scrollY+y-10,behavior:RM?'auto':'smooth'}) }

/* ---- render ---- */
function setHash(){ const h=layer+(level==='country'?'/'+gSel:''); if(location.hash.slice(1)!==h) history.replaceState(null,'','#'+h) }
function render(){
  document.documentElement.style.setProperty('--lc',LAYER[layer].col);
  $('ltabs').innerHTML=LK.map(L=>`<button class="ltab" role="tab" type="button" id="lt-${L}" data-act="layer" data-v="${L}" aria-selected="${L===layer}" style="--lc:${LAYER[L].col}"><b>${L==='sdg'?'<img class="whl" src="sdg/wheel.png" alt="">':''}${LAYER[L].n}</b><small>${LAYER[L].sub}</small></button>`).join('');
  const c=Q.ctry[gSel];
  const STORY='https://mitrovif.github.io/GAIN-story/';
  $('crumb').innerHTML=`<a href="${STORY}" target="_blank" rel="noopener" style="font-size:13px" ${tipA('Counted, and counting','The story runs as it is today and ends on its globe. This portal picks up from that globe.')}>← The story</a><span class="sep">|</span>`+(level==='world'
    ?`<b>World</b>${chosen?`<span class="sep">›</span><span>${esc(c.n)}</span>`:''}<span style="margin-left:auto;display:flex;gap:6px;align-items:center">${act('view','3d','Globe','chip',`aria-pressed="${view==='3d'}"`)}${act('view','2d','Flat map','chip',`aria-pressed="${view==='2d'}"`)}</span>`
    :`${act('world','','World','lk')}<span class="sep">›</span><b>${esc(c.n)}</b>${dots(gSel)}<span style="margin-left:auto">${act('world','','← Back to the world','lkbtn')}</span>`);
  initGlobe(); paintGlobe();
  if(hov&&!$('tip').hidden&&level==='world') $('tip').innerHTML=hoverCard(hov);
  const st=$('stage');
  if(level==='country'&&!st.classList.contains('country')&&!busy){ const T=targetFor(gSel); if(T){ Object.assign(G,T); draw() } st.classList.add('country') }
  if(level==='world'&&st.classList.contains('country')&&!busy){ st.classList.remove('country'); Object.assign(G,gBase()); draw() }
  if(level==='world'){ const allG=layer==='sdg'?[...new Set(Object.keys(Q.ctry).flatMap(k=>has(k,'sdg')?goalsOf(k):[]))].sort((a,b)=>a-b):[];
    $('stfoot').innerHTML=(layer==='sdg'?`<div class="goalbar">${allG.map(g=>`<button type="button" class="gbtn" data-act="goal" data-v="${g}" aria-pressed="${g===gGoal}" ${tipA('Goal '+g,esc(SDGN[g]||''))}>${SDGI.has(g)?`<img src="sdg/${g}.png" alt="Goal ${g}">`:`<span style="background:${SDGC[g]}">${g}</span>`}</button>`).join('')}${gGoal?act('goal',gGoal,'Show all goals','lk'):''}</div>`:'')
     +(layer==='gain'?`<div class="gfbar">${GFDEF.slice(0,2).map(d=>`<div><span>${d[1]}</span>${act('gf',d[0]+':','All','chip',`aria-pressed="${GF[d[0]]==null}"`)}${d[2].map(o=>act('gf',d[0]+':'+o[0],o[1],'chip',`aria-pressed="${String(GF[d[0]])===String(o[0])}"`)).join('')}</div>`).join('')}</div><p class="lnote" style="margin:0;text-align:center">${gfOn()?`${Object.keys(Q.ctry).reduce((s,k)=>s+exF(k).length,0)} examples in ${Object.keys(Q.ctry).filter(k=>exF(k).length).length} countries match: ${esc(gfText())}. ${act('gf','clear','Clear filters','lk')}`:'The first four charts are the ones from the story: select one to explore it, circle by circle. The buttons here filter the globe.'}</p>`:'')
     +`<div class="mleg" style="justify-content:center;margin-top:0">${layer==='gain'?'<span>Number = GAIN examples</span><span><i class="d" style="border:2.5px solid #4cc3c9"></i>Bright ring = share that use the Recommendations</span>':layer==='sdg'?(gGoal?`<span>Countries with a value under goal ${gGoal}: ${esc(SDGN[gGoal]||'')}</span>`:'<span>Country colour = the goal with most values</span><span>Number = SDG values</span><span>Select a goal to show only its countries</span>'):'<span>Number = questionnaires</span><span>Circle = people displaced, by main cause:</span>'+[1,2,6,7].map(k=>`<span><i class="d" style="background:${CAUSE_COL[k]}"></i>${CZ[k].toLowerCase()}</span>`).join('')}</div>` }
  else if(layer==='sdg'&&(!mapInd||mapInd==='__cause')&&subKeys(gSel).length&&!belowDone['auto'+gSel]){ mapInd=subKeys(gSel).includes('6.1.1')?'6.1.1':subKeys(gSel)[0]; belowDone['auto'+gSel]=1 }
  else if(layer==='idq'&&!mapInd&&Q.cpts[gSel]&&!belowDone['cz'+gSel]){ mapInd='__cause'; belowDone['cz'+gSel]=1 }
  { const gm=$('gstrip'), on=level==='world'; gm.hidden=!on; gm.className='gstrip '+layer; gm.innerHTML=on?stripHtml():''; $('stage').classList.toggle('joined',on); if(on&&layer==='gain') sxThumbs(); if(on&&layer==='idq') ixThumbs(); if(on&&layer==='sdg') gxThumbs(); if(zChart!=='sx'&&zChart!=='ix'&&(zChart!=='gx'||$('zoomer').hidden||layer!=='sdg')) renderZoom(); else if(zChart==='gx'&&!$('zoomer').hidden) renderZoom() }
  $('panel').style.setProperty('--lc',LAYER[layer].col);
  $('panel').innerHTML=level==='world'?(chosen?pWorld():pOverview()):layer==='gain'?pGain():layer==='sdg'?pSdg():pIdq();
  if(level==='country'){ paintMap(); renderMapFoot() }
  if(level==='world'&&layer==='gain'&&chosen) coverMap(fEx);
  if(level==='country'&&layer==='gain') coverBig(fEx);
  const bs=level==='world'&&layer==='sdg', bi=level==='world'&&layer==='idq';
  $('b-sdg').hidden=!bs; $('b-idq').hidden=!bi;
  if(bs){ renderDisagg(); renderSdg() }
  if(bi){ renderFlowModule(); renderModel(); renderBank() }
  setHash();
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act, v=b.dataset.v;
  if(a==='layer'){ if(v===layer) return; layer=v; enterLayer(); render(); const p=$('panel'); p.classList.remove('fade'); void p.offsetWidth; p.classList.add('fade'); setTimeout(()=>p.classList.remove('fade'),450) }
  else if(a==='pick') pick(v,true);
  else if(a==='zoom') zoomIn();
  else if(a==='zin'||a==='zout'){ if(G&&level==='world'&&view==='3d') G.zoomBy(a==='zin'?1.45:1/1.45) }
  else if(a==='gf'){ if(v==='clear') Object.keys(GF).forEach(k=>GF[k]=null); else { const [k,x]=v.split(':'); GF[k]=x===''?null:x } fEx=null; render() }
  else if(a==='ixl'){ IX.lay=v; renderZoom() }
  else if(a==='gxl'){ GX.lay=v; renderZoom() }
  else if(a==='zc'){ if(v.startsWith('ix:')){ IX.lay=v.slice(3); zChart='ix'; renderZoom(); return } if(v.startsWith('gx:')){ GX.lay=v.slice(3); zChart='gx'; renderZoom(); return } if(v.startsWith('sx:')){ const b=v.split(':'); SX.lay=b[1]; SX.yr=b[2]; SX.by='fw'; zChart='sx' } else zChart=v; renderZoom() }
  else if(a==='sxl'){ SX.lay=v; renderZoom() }
  else if(a==='sxy'){ SX.yr=v; renderZoom() }
  else if(a==='sxb'){ SX.by=v; renderZoom() }
  else if(a==='zclose'){ zChart=null; renderZoom() }
  else if(a==='ztab'){ zTab=!zTab; renderZoom() }
  else if(a==='mpop'){ mPop=v; renderZoom() }
  else if(a==='rno'){ const [s0,c]=v.split('|'), d=ixRows().find(x=>x.t==='q'&&x.s===+s0&&x.item===c); if(d&&d.iso){ $('tip').hidden=true; ixOpen(d.id) } }
  else if(a==='gxo') gxOpen(+v); else if(a==='ixo') ixOpen(+v); else if(a==='sxo') sxOpen(+v);
  else if(a==='goal'){ gGoal=gGoal===+v?null:+v; render() }
  else if(a==='world') zoomOut();
  else if(a==='view') setView(v);
  else if(a==='map'){ mapInd=v||null; if(mapInd&&Q.sub.val[gSel]&&layer==='sdg'&&fSrc!=='__rep'){ const rows=fSrc&&surveysOf(gSel).get(fSrc); if(rows&&rows.some(([d])=>d.c===mapInd)) fInd=mapInd } render() }
  else if(a==='mapg'){ mapG=+v; render() }
  else if(a==='ex'){ fEx=+v; render() }
  else if(a==='exclose'){ fEx=null; render() }
  else if(a==='svclose'){ fSv=null; render() }
  else if(a==='cz'){ czSel=czSel===+v?null:+v; mapInd='__cause'; render() }
  else if(a==='src'){ fSrc=v; fInd=null; if(v==='__rep'&&!(mapInd&&Q.sub.rep[gSel].ind[mapInd])) mapInd=Object.keys(Q.sub.rep[gSel].ind)[0]; render() }
  else if(a==='ind'){ fInd=v; mapInd=v; mapG=0; render() }
  else if(a==='sv'){ fSv=+v; render() }
  else if(a==='open-sdg'){ if(level==='world'){ fSrc=v; layer='sdg'; enterLayer(); render(); zoomIn(); return } layer='sdg'; enterLayer(); fSrc=v; fInd=null; if(v==='__rep') mapInd=Object.keys(Q.sub.rep[gSel].ind)[0]; render() }
  else if(a==='open-idq'){ layer='idq'; enterLayer(); fSv=+v; render(); if(level==='world') zoomIn() }
  else if(a==='ds'){ hitSrc=v||null; renderDrawer() }
  else if(a==='dsclose'){ $('drawer').hidden=true }
  else if(a==='bank'){ bItem=v; bAlign='all'; renderBank(); $('bankhead').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'}) }
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape') $('drawer').hidden=true });
function fromHash(){ const [L,iso]=location.hash.slice(1).split('/'); if(LAYER[L]) layer=L; if(iso&&Q.ctry[iso]){ gSel=iso; level='country'; chosen=true } else level='world' }
/* ===== ID Questions: every questionnaire drawn as its identification route (replaces the questionnaire-by-question table) ===== */
const RT={trunk:[['FrcFl',22],['FrcOth',64],['FleeLoc',106],['LocLiv',148],['CitLoc',190],['FleeCross',232]],ref:[['12Mnths',306],['Apply',348],['IntApply',390],['Outcome',432]],idp:[['IDPLoc',306],['IDPPost',348]],legal:['Legal',500],rel0:548,W:650,yT:30,yR:14,yI:46,cR:'#7df3f7',cI:'#ffd166'};
let mPop='all';
function routeOf(s){ const has=c=>bankFor(s,c).length>0, any=a=>a.some(has), flee=has('FrcFl')||has('FrcOth');
  const idp=flee&&any(['FleeLoc','IDPLoc','IDPPost','FleeCross']), refQ=flee&&any(['FleeLoc','FleeCross'])&&any(['Apply','Outcome','12Mnths','IntApply']), refDoc=!refQ&&(any(['Apply','Outcome'])||(!flee&&has('Legal')));
  return {flee,idp,ref:refQ,refDoc,kind:idp&&refQ?'both':idp?'idp':refQ?'ref':refDoc?'doc':flee?'flee':'none'} }
const RKIND={both:['IDPs and refugees','Asks who fled, separates inside the country from across a border, and asks about a protection application.'],idp:['IDPs','Asks who fled and where, so people displaced inside the country can be identified. No question on a protection application.'],ref:['Refugees','Asks who fled across a border and about a protection application.'],doc:['By document or status question only','No question on having fled leads to a border question. People can only be picked out through a question on documents or on a protection application.'],flee:['Displacement asked, not split','Asks whether people had to flee, without a question that separates inside the country from across a border.'],none:['No identification route','Only related topics are asked, such as citizenship or reason for moving.']};
function routeSvg(s){ const R=RT, ro=routeOf(s), node=(c,x,y,sq)=>{ const rs=bankFor(s,c), m=Q.model.find(q=>q.code===c), nm=m?m.title:(ITEM[c]||c);
    if(!rs.length) return sq?`<rect x="${x-3.5}" y="${y-3.5}" width="7" height="7" rx="1.5" class="rn0"/>`:`<circle cx="${x}" cy="${y}" r="5" class="rn0"/>`;
    const best=rs.map(r=>r[3]).sort((a,b)=>(RANK[a]??9)-(RANK[b]??9))[0], col=IXA[best]||IXA.other, tip=`data-tip="1" data-tipq="${s}|${c}" data-act="rno" data-v="${s}|${c}"`;
    const sv=rs.map(simTot).filter(v=>v!=null), sm=sv.length?Math.max(...sv):null;
    return `<g class="rn" role="button" tabindex="0" data-s="${s}" data-c="${c}" aria-label="${esc(nm)}: ${esc(IXAN[best]||best)}${sm!=null?', estimated similarity '+Math.round(sm/12*100)+' percent':''}" ${tip}>${sq?`<rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2.5" fill="${col}"/>`:sm==null?`<circle cx="${x}" cy="${y}" r="8" fill="${col}"/>`:`<circle cx="${x}" cy="${y}" r="8" fill="#0f1d42" stroke="${col}" class="rnr"/><circle cx="${x}" cy="${y}" r="${(1.5+6.5*sm/12).toFixed(1)}" fill="${col}" class="rni"/>`}${rs.length>1?`<text x="${x+9}" y="${y-6}" class="rnn">${rs.length}</text>`:''}</g>` };
  const xs=R.trunk[R.trunk.length-1][1], lane=(on,col,y,x1)=>`<path d="M${xs} ${R.yT}C${xs+34} ${R.yT} ${xs+30} ${y} ${xs+64} ${y}L${x1} ${y}" class="rl ${on?'on':''}" style="--c:${col}"/>`;
  return `<svg class="rsvg" viewBox="0 0 ${R.W} 60" role="img" aria-label="Identification route of ${esc(Q.surveys[s][0])}, ${esc(Q.surveys[s][1])}: ${RKIND[ro.kind][0]}"><path d="M${R.trunk[0][1]} ${R.yT}L${xs} ${R.yT}" class="rl ${ro.flee?'on':''}" style="--c:#cfe0f4"/>${lane(ro.ref,R.cR,R.yR,R.ref[R.ref.length-1][1]+18)}${lane(ro.idp,R.cI,R.yI,R.idp[R.idp.length-1][1]+18)}`
    +(ro.ref?`<path d="M${R.ref[R.ref.length-1][1]+12} ${R.yR-5}l7 5l-7 5" class="ra" style="--c:${R.cR}"/>`:'')+(ro.idp?`<path d="M${R.idp[R.idp.length-1][1]+12} ${R.yI-5}l7 5l-7 5" class="ra" style="--c:${R.cI}"/>`:'')
    +R.trunk.map(n=>node(n[0],n[1],R.yT)).join('')+R.ref.map(n=>node(n[0],n[1],R.yR)).join('')+R.idp.map(n=>node(n[0],n[1],R.yI)).join('')+node(R.legal[0],R.legal[1],R.yT)
    +EXTRA.map((c,i)=>node(c,R.rel0+i*17,R.yT,true)).join('')+`</svg>` }
const RSH={FrcFl:'Forced to flee',FrcOth:'Other reason',FleeLoc:'Country fled',LocLiv:'Always lived there',CitLoc:'Citizen when fled',FleeCross:'Crossed a border','12Mnths':'Time abroad',Apply:'Applied for protection',IntApply:'Intended to apply',Outcome:'Outcome',Legal:'Document held'};
function routeHead(){ const R=RT, t=(c,x,y)=>{ const m=Q.model.find(q=>q.code===c), i=Q.model.findIndex(q=>q.code===c); return `<text x="${x+3}" y="${y}" transform="rotate(-42 ${x+3} ${y})" class="${m&&m.core?'core':''}" tabindex="0" ${tipA((m?(i+1)+'. '+m.title+(m.core?' · core':''):(ITEM[c]||c)),m?esc(m.stem)+'<br><span style="opacity:.75">'+esc(m.skip)+'</span>':'Related topic, not one of the 13 questions')}>${esc(RSH[c]||(m?m.title:(ITEM[c]||c)))}</text>` };
  return `<svg class="rsvg rhead" viewBox="0 0 ${R.W} 132" aria-hidden="false" role="img" aria-label="The steps of the route, left to right">`+R.trunk.map(n=>t(n[0],n[1],118)).join('')+R.ref.map(n=>t(n[0],n[1],118)).join('')+R.idp.map(n=>'').join('')+t(R.legal[0],R.legal[1],118)
    +`<text x="${R.rel0+40}" y="118" text-anchor="middle" class="lane" style="fill:#8db8e3">Related topics</text><text x="4" y="12" class="lane" style="fill:${R.cR}">Upper line: crossed a border → refugee steps</text><text x="4" y="28" class="lane" style="fill:${R.cI}">Lower line: stayed in the country → place lived before, first place moved to</text></svg>` }
/* word-by-word comparison of a questionnaire's wording with the EGRISS question (on the English text) */
const WSTOP=new Set('a an the of to in on at for and or by is are was were be been do did does you your yours me my i we our us he she they them their his her it its this that these those have has had if as from with not no any'.split(' '));
const wTok=t=>[...String(t||'').matchAll(/(\s*)([\p{L}\p{N}][\p{L}\p{N}'’-]*|[^\p{L}\p{N}\s]+)/gu)].map(x=>{ const w=new String(x[2]); w.sp=x[1]?' ':''; return w });
const wKey=w=>String(w).toLowerCase().replace(/[^\p{L}\p{N}]/gu,''), wStem=k=>k.length>4?k.replace(/(ing|ied|ies|ed|es|s|d)$/,''):k;
function wDiff(a,b){ const A=wTok(a), B=wTok(b), ka=A.map(wKey), kb=B.map(wKey), sa=ka.map(wStem), sb=kb.map(wStem), n=A.length, m=B.length, L=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) L[i][j]=sa[i]&&sa[i]===sb[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const ta=A.map(w=>[String(w),'x',w.sp]), tb=B.map(w=>[String(w),'x',w.sp]); let i=0,j=0; while(i<n&&j<m){ if(sa[i]&&sa[i]===sb[j]){ const c=ka[i]===kb[j]?'s':'n'; ta[i][1]=c; tb[j][1]=c; i++; j++ } else if(L[i+1][j]>=L[i][j+1]) i++; else j++ }
  /* words that appear elsewhere in the other text are not marked as left out or added: only the order differs */
  const inB=new Set(sb), inA=new Set(sa); ta.forEach((t,q)=>{ if(t[1]==='x'&&sa[q]&&inB.has(sa[q])) t[1]='n' }); tb.forEach((t,q)=>{ if(t[1]==='x'&&sb[q]&&inA.has(sb[q])) t[1]='n' });
  ta.forEach((t,q)=>{ if(!ka[q]) t[1]='p' }); tb.forEach((t,q)=>{ if(!kb[q]) t[1]='p' });
  const key=ka.map((k,q)=>k&&!WSTOP.has(k)?q:-1).filter(q=>q>=0), kept=key.filter(q=>ta[q][1]!=='x').length;
  return {a:ta,b:tb,key:key.length,kept,added:kb.filter((k,q)=>k&&!WSTOP.has(k)&&tb[q][1]==='x').length} }
const wLine=(T,side)=>T.map((t,q)=>(q?t[2]:'')+(t[1]==='p'?esc(t[0]):`<span class="w${t[1]}${t[1]==='x'?side:''}">${esc(t[0])}</span>`)).join('');
function wOpts(m,r){ if(!m.opts.length||!r[9]) return ''; if(r[6]!=='en') return '<p class="lnote">Answer options are recorded in the original language, so they are not compared here.</p>';
  const cw=t=>new Set(wTok(t).map(wKey).filter(k=>k&&!WSTOP.has(k)&&!/^\d+$/.test(k)).map(wStem)), Qo=r[9].split(/;\s*/).map(o=>o.replace(/^\s*-?\d+[.)]?\s*/,'').replace(/\s*\(go to[^)]*\)/i,'').trim()).filter(Boolean), used=new Set();
  const rows=m.opts.map(o=>{ const A=cw(o); let best=-1,bs=0; Qo.forEach((q,k)=>{ const B=cw(q); let x=0; A.forEach(w=>{ if(B.has(w)) x++ }); const sc=A.size&&B.size?x/Math.min(A.size,B.size):0; if(sc>bs){ bs=sc; best=k } }); if(bs>=.5) used.add(best); return [o,bs>=.99?'s':bs>=.5?'n':'x',bs>=.5?Qo[best]:''] });
  if(rows.every(x=>x[1]==='x')) return `<div class="wopts"><h4>Answer options</h4><p class="lnote" style="margin:0">None of the ${m.opts.length} EGRISS answer options is offered. This question offers: ${esc(Qo.slice(0,6).join(' · '))}${Qo.length>6?' …':''}.</p></div>`;
  const extra=Qo.filter((q,k)=>!used.has(k)&&!/^(yes|no|don.?t know|refus|prefer not|other)/i.test(q));
  return `<div class="wopts"><h4>Answer options</h4>${rows.map(x=>`<div class="wo"><span class="w${x[1]}${x[1]==='x'?'a':''}">${esc(x[0])}</span><span>${x[1]==='x'?'not offered':x[1]==='s'?'offered':'offered as: '+esc(x[2])}</span></div>`).join('')}${extra.length?`<div class="wo"><span class="wxb">${extra.map(esc).join(' · ')}</span><span>only in this questionnaire</span></div>`:''}</div>` }
const simOf=r=>(Q.sim||{})[r[12]]||null, simTot=r=>{ const v=simOf(r); return v?v[0]+v[1]+v[2]+v[3]:null }, SIMN=['Concept','Who is asked','Answer options','Time and place'];
function simBlock(r){ const v=simOf(r); if(!v) return ''; const t=v[0]+v[1]+v[2]+v[3], pct=Math.round(t/12*100), col=pct>=67?'#4cc3c9':pct>=42?'#e0a93b':'#f06667';
  return `<div class="simb"><div class="simh"><b style="color:${col}">${pct}%</b><span>similar to the EGRISS question</span><i class="simm"><i style="width:${pct}%;background:${col}"></i></i></div>
    <div class="simp">${SIMN.map((n,i)=>`<span><small>${n}</small><i class="sim3">${[0,1,2].map(k=>`<i class="${k<v[i]?'on':''}"></i>`).join('')}</i></span>`).join('')}</div>
    ${v[4]?`<p class="simr">${esc(v[4])}${/[.!?]$/.test(v[4])?'':'…'}</p>`:''}<p class="simn">Estimated by a language model, not reviewed. The label above is the coder's rating.</p></div>` }
function wCompare(m,r){ const txt=r[7]||(r[6]==='en'?r[5]:''); if(!m||!txt) return ''; const sents=m.stem.match(/[^.?!…]+[.?!…]*\s*/g)||[m.stem]; let bi=sents.length-1, bd=null; sents.forEach((t,i)=>{ const x=wDiff(t.trim(),txt), sc=x.key?x.kept/x.key:0, cur=bd&&bd.key?bd.kept/bd.key:-1; if(!bd||sc>cur||(sc===cur&&i>=bi)){ bd=x; bi=i } });
  const d=bd, pct=d.key?Math.round(d.kept/d.key*100):0, pre=sents.slice(0,bi).join('').trim(), post=sents.slice(bi+1).join('').trim();
  return `<div class="wcmp">${simBlock(r)}<div class="wbar" ${tipA('Key words kept','Words of the EGRISS question that also appear in this question, leaving out small words such as “the” and “of”.')}><i style="width:${pct}%"></i><span>${d.kept} of ${d.key} key words of the EGRISS question kept${d.added?' · '+d.added+' added':''}</span></div>${sents.length>1?'<p class="lnote" style="margin:0">Compared with the sentence of the EGRISS question that is closest to this one; the rest is shown in grey.</p>':''}
    <div class="wrow"><small>EGRISS</small><p>${pre?`<span class="wdim">${esc(pre)}</span> `:''}${wLine(d.a,'a')}${post?` <span class="wdim">${esc(post)}</span>`:''}</p></div><div class="wrow"><small>${esc(r[1])}</small><p>${wLine(d.b,'b')}</p></div>
    <div class="wleg"><span><i class="ws">same</i> in both</span><span><i class="wn">close</i> same word in another form or place</span><span><i class="wxa">left out</i> only in the EGRISS question</span><span><i class="wxb">added</i> only in this questionnaire</span>${r[6]!=='en'?`<span>Compared on the English translation${r[8]?' (draft)':''}.</span>`:''}</div>${wOpts(m,r)}</div>` }
function qTip(key){ const [s0,c]=key.split('|'), s=+s0, m=Q.model.find(x=>x.code===c), rs=bankFor(s,c), has=!!Q.ctry[Object.keys(Q.ctry).find(k=>Q.ctry[k].sv.includes(s))||''];
  return `<span class="tn">${esc(Q.surveys[s][0])} · ${esc(Q.surveys[s][1])}</span><span class="tq" style="font-size:13.5px">${m?'EGRISS question '+(Q.model.indexOf(m)+1)+' · '+esc(m.title)+(m.core?' · core':''):esc(ITEM[c]||c)+' · related topic, not one of the 13 questions'}</span>`
    +rs.slice(0,2).map(r=>`<div class="tcmp"><div class="tl"><b>${esc(r[1])}</b><i class="pill a-${r[3]}">${esc(IXAN[r[3]]||r[3])}</i></div>${r[6]!=='en'||!m?`<p class="to">${esc(cut(r[5]||'',220))}</p>`:''}${m?wCompare(m,r):(r[7]?`<p class="to">${esc(cut(r[7],220))}</p>`:'')}${r[11]?`<p class="ts">Asked of: ${esc(cut(r[11],130))}</p>`:''}</div>`).join('')
    +(rs.length>2?`<span class="ts">+ ${rs.length-2} more on this step</span>`:'')+`<span class="ts">${has?'Select the mark to open this questionnaire.':'This questionnaire covers several countries and has no country page.'}</span>` }
function routeAgg(){ const R=RT, N=Q.surveys.length, n=c=>new Set(Q.bank.filter(r=>r[2]===c).map(r=>r[0])).size, nd=(c,x,y,col)=>{ const k=n(c); return `<circle cx="${x}" cy="${y}" r="${(2.5+9*Math.sqrt(k/N)).toFixed(1)}" fill="${k?col:'none'}" stroke="${col}" stroke-opacity="${k?0:.4}"/><text x="${x}" y="${y+(y===R.yR?-13:y===R.yI?21:22)}" text-anchor="middle">${k}</text>` };
  const xs=R.trunk[R.trunk.length-1][1], lane=(col,y,x1)=>`<path d="M${xs} ${R.yT}C${xs+34} ${R.yT} ${xs+30} ${y} ${xs+64} ${y}L${x1} ${y}" class="rl on" style="--c:${col}"/>`, kinds=Q.surveys.map((x,i)=>routeOf(i).kind), k=q=>kinds.filter(x=>x===q).length;
  return `<svg class="rsvg ragg" viewBox="0 -6 ${R.W} 78" aria-hidden="true"><path d="M${R.trunk[0][1]} ${R.yT}L${xs} ${R.yT}" class="rl on" style="--c:#cfe0f4"/>${lane(R.cR,R.yR,R.ref[R.ref.length-1][1]+18)}${lane(R.cI,R.yI,R.idp[R.idp.length-1][1]+18)}`
    +R.trunk.map(q=>nd(q[0],q[1],R.yT,'#cfe0f4')).join('')+R.ref.map(q=>nd(q[0],q[1],R.yR,R.cR)).join('')+R.idp.map(q=>nd(q[0],q[1],R.yI,R.cI)).join('')+nd(R.legal[0],R.legal[1],R.yT,'#8db8e3')
    +`<text x="${R.ref[R.ref.length-1][1]+30}" y="${R.yR+4}" class="rt" style="fill:${R.cR}">refugee steps</text><text x="${R.idp[R.idp.length-1][1]+30}" y="${R.yI+4}" class="rt" style="fill:${R.cI}">IDP steps</text><text x="${R.W-4}" y="${R.yT-6}" text-anchor="end" class="rt" style="fill:#fff">${k('both')} identify both</text><text x="${R.W-4}" y="${R.yT+10}" text-anchor="end" class="rt" style="fill:${R.cI}">${k('idp')} IDPs only</text></svg>` }
function routesHtml(){
  const order=Q.surveys.map((s,i)=>i).sort((a,b)=>(Q.surveys[a][0]+Q.surveys[a][1]).localeCompare(Q.surveys[b][0]+Q.surveys[b][1])), kinds=order.map(s=>routeOf(s).kind), n=k=>kinds.filter(x=>x===k).length;
  const F=[['all','All',order.length],['both','IDPs and refugees',n('both')],['idp','IDPs only',n('idp')],['ref','Refugees only',n('ref')],['doc','By document or status',n('doc')],['flee','Not split',n('flee')],['none','No route',n('none')]];
  return {chips:F.filter(f=>f[2]).map(f=>`<button type="button" class="chip" data-act="mpop" data-v="${f[0]}" aria-pressed="${mPop===f[0]}">${f[1]} <span style="opacity:.7">${f[2]}</span></button>`).join(''),
    mode:`${Q.surveys.length} QUESTIONNAIRES · ${n('both')} IDENTIFY BOTH · ${n('idp')} IDPS ONLY · ${n('ref')} REFUGEES ONLY`,
    rows:`<div class="rrow rh"><span></span>${routeHead()}<span class="rk">Who can be identified</span></div>`+order.filter((s,i)=>mPop==='all'||kinds[i]===mPop).map(s=>{ const ro=routeOf(s), K=RKIND[ro.kind];
      return `<div class="rrow"><span class="rnm"><b>${esc(Q.surveys[s][0])}</b><small>${esc(Q.surveys[s][1])}</small></span>${routeSvg(s)}<span class="rk" tabindex="0" ${tipA(K[0],K[1])}>${ro.kind==='both'?'<i class="rp" style="--c:'+RT.cI+'">IDPs</i><i class="rp" style="--c:'+RT.cR+'">Refugees</i>':ro.kind==='idp'?'<i class="rp" style="--c:'+RT.cI+'">IDPs</i>':ro.kind==='ref'?'<i class="rp" style="--c:'+RT.cR+'">Refugees</i>':ro.kind==='doc'?'<i class="rp dash" style="--c:'+RT.cR+'">By document or status</i>':'<i class="rp off">'+K[0]+'</i>'}</span></div>` }).join('')} }
const ixSegs=()=>[['routes','Identification routes'],['items','By EGRISS question'],['surveys','Coverage grid'],['sim','Similarity'],['match','Wording match'],['reasons','Reasons for displacement']].map(x=>`<button type="button" class="chip" data-act="ixl" data-v="${x[0]}" aria-pressed="${IX.lay===x[0]}">${x[1]}</button>`).join('');
function ixRoutesShell(){ const z=$('zoomer'), [W,H]=chSize(true), R=routesHtml();
  z.innerHTML=`<div class="zbox sxbox" role="dialog" aria-modal="true" aria-label="Identification routes"><div class="zhead"><div><p class="eyebrow" style="color:${LAYER.idq.col}">${R.mode}</p><h2 style="font-size:15px;font-family:var(--mono);font-weight:500;letter-spacing:.06em;color:#8db8e3">HOW EACH QUESTIONNAIRE IDENTIFIES REFUGEES AND IDPS</h2></div><span class="zact"><button type="button" class="x" data-act="zclose">Close ✕</button></span></div>
    <div class="sxctl"><span>Show</span>${ixSegs()}</div><div class="sxctl"><span>Who can be identified</span>${R.chips}</div>
    <div class="ztab rwrap" style="width:${W}px;max-height:${H}px" tabindex="0"><div class="routes">${R.rows}</div></div>
    <div class="zleg"><span><i class="d" style="--c:${IXA.same}"></i>Same wording</span><span><i class="d" style="--c:${IXA.close}"></i>Close</span><span><i class="d" style="--c:${IXA.partial}"></i>Partial</span><span><i class="d" style="--c:${IXA.different}"></i>Different</span><span><i class="d ring" style="--c:rgba(207,224,244,.5)"></i>Not asked</span><span>Fill of a mark = estimated similarity</span><span><i class="d" style="--c:${RT.cR};height:3px;border-radius:0"></i>Refugee route</span><span><i class="d" style="--c:${RT.cI};height:3px;border-radius:0"></i>IDP route</span></div>
    <p class="lnote">Each line is one questionnaire, read left to right: who had to flee, from where, whether a border was crossed, then the refugee steps on the upper line and the IDP steps on the lower line. Point at a filled mark to compare its wording with the EGRISS question. Select it to open that questionnaire. Who can be identified is worked out from the questions asked, not from who the survey sampled.</p></div>`;
  z.hidden=false }
function renderModel(){ const b=$('mx'); if(!b) return; const st=b.closest('.stack')||b.closest('.band'); st.hidden=true; const h=st.previousElementSibling; if(h&&h.classList.contains('sech')) h.hidden=true }
window.addEventListener('hashchange',()=>{fromHash();render()});
fromHash(); render();


document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&zChart){ zChart=null; renderZoom() } });
document.addEventListener('click',e=>{ if(e.target&&e.target.id==='zoomer'){ zChart=null; renderZoom() } });
