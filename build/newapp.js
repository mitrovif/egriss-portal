/* ---- verified definitions: every value recalculated from the survey file ---- */
const VST={ok:['ok','Reproduced','The recalculation from the survey file gives the published value.'],near:['tbc','Within 1 point','The recalculation is within one percentage point of the published value.'],
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
  $('indchips').innerHTML = Q.sdg.map(d=>`<button class="chip" type="button" aria-pressed="${d.c===curInd}" data-c="${d.c}">${d.c}${d.pri?' ◆':''} · ${esc(d.n)}</button>`).join('');
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
  $('svlist').innerHTML = d.rows.map(r=>`<article class="svc ${r.old?'old':''}">
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
let layer='gain', level='world', view='3d', gSel='SSD';
let fSrc=null, fInd=null, fEx=null, fSv=null, mapInd=null, mapG=0, hitSrc=null, belowDone={};
const fmt=n=>Number(n).toLocaleString('en');
const sdgRows=iso=>{const o=[];Q.sdg.forEach(d=>d.rows.forEach(r=>{if(r.iso===iso)o.push([d,r])}));return o};
function surveysOf(iso){const m=new Map(); sdgRows(iso).forEach(([d,r])=>{if(!m.has(r.src))m.set(r.src,[]);m.get(r.src).push([d,r])}); return m}
function has(iso,L){const c=Q.ctry[iso]; if(!c) return 0; return L==='gain'?c.ex.length:L==='sdg'?(sdgRows(iso).length+c.rep.length+(Q.sub.rep[iso]?1:0)):(c.sv.length||(c.cz.some(z=>z[3]>0)?1:0))}
const any=iso=>LK.some(L=>has(iso,L));
const subKeys=iso=>Q.sub.val[iso]?Object.keys(Q.sub.val[iso]):Q.sub.rep[iso]?Object.keys(Q.sub.rep[iso].ind):[];
const SNS={'6.1.1':'Drinking water','6.2.1':'Sanitation','7.1.1':'Electricity','2.1.2':'Food insecurity','4.1.2':'School attendance','16.9.1':'Birth registration'};
const subName=(iso,k)=>Q.sub.val[iso]?(k+' '+SNS[k]):Q.sub.rep[iso].ind[k].n;
function ramp(v){const st=[[0,[39,55,95]],[45,[47,111,143]],[80,[76,195,201]],[100,[201,244,246]]]; for(let i=1;i<st.length;i++){ if(v<=st[i][0]){const a=st[i-1],b=st[i],t=(v-a[0])/(b[0]-a[0]); return 'rgb('+a[1].map((x,j)=>Math.round(x+(b[1][j]-x)*t)).join(',')+')'} } return 'rgb(201,244,246)'}
function idpCol(v,mx){const t=Math.sqrt(v/mx), a=[40,50,79], b=[224,169,59]; return 'rgb('+a.map((x,j)=>Math.round(x+(b[j]-x)*t)).join(',')+')'}
const dots=iso=>`<span class="dots" title="In: ${LK.filter(L=>has(iso,L)).map(L=>LAYER[L].n).join(', ')||'no layer'}">${LK.map(L=>`<i style="${has(iso,L)?'background:'+LAYER[L].col:''}"></i>`).join('')}</span>`;
const act=(a,v,label,cls,extra)=>`<button class="${cls||'lkbtn'}" type="button" data-act="${a}" data-v="${esc(v==null?'':v)}" ${extra||''}>${label}</button>`;

/* ---- hover cards for anything carrying data-tip ---- */
const tipA=(title,body)=>`data-tip="${esc(`<span class="tn">${esc(title)}</span>${body?`<span class="tq" style="font-size:13.5px">${body}</span>`:''}`)}"`;
(function(){
  const tip=$('tip'); let cur=null;
  function at(x,y){ const w=tip.offsetWidth,h=tip.offsetHeight,vw=window.innerWidth,vh=window.innerHeight; tip.style.left=Math.max(12,Math.min(x+14,vw-w-12))+'px'; tip.style.top=(y+16+h>vh&&y-12-h>0?y-12-h:y+16)+'px' }
  document.addEventListener('pointerover',e=>{ const el=e.target.closest&&e.target.closest('[data-tip]'); if(el){ cur=el; tip.innerHTML=el.dataset.tip; tip.hidden=false; at(e.clientX,e.clientY) } else if(cur){ cur=null; tip.hidden=true } });
  document.addEventListener('pointermove',e=>{ if(cur) at(e.clientX,e.clientY) });
  document.addEventListener('focusin',e=>{ const el=e.target.closest&&e.target.closest('[data-tip]'); if(el){ cur=el; tip.innerHTML=el.dataset.tip; tip.hidden=false; const r=el.getBoundingClientRect(); at(r.left,r.bottom-8) } });
  document.addEventListener('focusout',()=>{ if(cur){ cur=null; tip.hidden=true } });
})();

/* ---- the fixed start: a globe drawn the way the story draws its own (lit ocean, glow, examples rising from each country) ---- */
const RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const CAUSE_COL=['','#f06667','#f29d52','#b48ef0','#e77fb3','#8b98b3','#4cc3c9','#7aa7e6','#cfe0f4'];
let G=null, busy=false, hov=null, grow=1;
const czTot=iso=>{const c=Q.ctry[iso]; return c?c.cz.reduce((s,z)=>s+(z[3]||0),0):0};
const czTop=iso=>{const c=Q.ctry[iso]; return c&&c.cz.length?[...c.cz].sort((a,b)=>(b[3]||0)-(a[3]||0))[0]:null};
function beads(iso){ const c=Q.ctry[iso]; if(!c) return null;
  if(layer==='gain') return c.ex.length?c.ex.map(e=>e[4]):null;
  if(layer==='sdg'){ const a=sdgRows(iso).map(()=>1).concat(Q.sub.rep[iso]?[1]:[]).concat(c.rep.map(()=>0)); return a.length?a:null }
  return c.sv.length?c.sv.map(()=>1):null }
function mainGeom(iso){ const f=Q.geo.find(x=>x.properties.i===iso); if(!f) return null;
  const P=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates], ar=P.map(p=>d3.geoArea({type:'Polygon',coordinates:p})), mx=Math.max(...ar);
  return {type:'MultiPolygon',coordinates:P.filter((p,i)=>ar[i]>=mx*.15)} }
function tween(dur,fn,done){
  let fin=false; const end=()=>{ if(fin) return; fin=true; fn(1); done&&done() };
  if(RM||document.hidden||typeof requestAnimationFrame==='undefined'){ end(); return }
  const t0=performance.now(); setTimeout(end,dur+400);
  requestAnimationFrame(function step(now){ if(fin) return; const t=Math.min(1,(now-t0)/dur); if(t>=1){ end(); return } fn(d3.easeCubicInOut(t)); requestAnimationFrame(step) });
}
const lerp=(a,b,t)=>a+(b-a)*t;
function lerpLon(a,b,t){ let d=((b-a+540)%360)-180; return a+d*t }
function gBase(){ const kO=Math.min(G.W,G.H)/2.45, kE=Math.min((G.W-24)/5.42,(G.H-60)/2.64); return view==='2d'?{rot:[0,0],k:kE,tr:[G.W/2,G.H/2+8],alpha:1,fade:0,m:0}:{rot:[G.rot[0],Math.max(-40,Math.min(40,G.rot[1]))],k:kO,tr:[G.W/2,G.H/2+14],alpha:0,fade:0,m:0} }
function gProj(){ const a=G.alpha; G.mut(a); G.proj.scale(G.k).translate(G.tr).rotate([G.rot[0],G.rot[1]]).clipAngle(a>=.999?null:90+89.9*a) }
function rgba(hex,al){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${al})` }
function draw(){
  if(!G) return; gProj();
  const ctx=G.ctx, W=G.W, H=G.H, a=G.alpha, f=G.fade, P=G.path, cx=G.tr[0], cy=G.tr[1], R=G.k, glob=1-a, col=LAYER[layer].col, TAU=6.2832;
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
    for(const c of G.cs){ if(!c.w||c.iso===gSel) continue; ctx.beginPath(); P(c.f); ctx.fillStyle=rgba(col,.26+.5*c.w); ctx.fill(); ctx.strokeStyle=c.iso===hov?'rgba(255,255,255,.9)':rgba(col,.8); ctx.lineWidth=c.iso===hov?1.4:.8; ctx.stroke() }
    if(hov&&hov!==gSel){ const c=G.by[hov]; if(c&&!c.w){ ctx.beginPath(); P(c.f); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1; ctx.stroke() } }
  }
  const s=G.by[gSel];
  if(s){ ctx.globalAlpha=1; ctx.beginPath(); if(G.m>.002&&G.M&&a<.01) selPath(ctx,s.f); else P(s.f);
    ctx.fillStyle=d3.interpolateRgb(s.w?d3.interpolateRgb('#2a3f78',col)(.3+.55*s.w):'#3a4f8a','#16264f')(f); ctx.fill('evenodd');
    ctx.save(); ctx.shadowColor='rgba(255,255,255,.75)'; ctx.shadowBlur=10*(1-f); ctx.strokeStyle=d3.interpolateRgb('#ffffff','rgba(207,224,244,0.45)')(f); ctx.lineWidth=lerp(1.8,1,f); ctx.stroke(); ctx.restore() }
  if(vis>.01){
    ctx.globalAlpha=vis;
    if(glob>.02){ ctx.save(); ctx.globalAlpha=vis*glob; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.clip(); const sh=ctx.createRadialGradient(cx-R*.3,cy-R*.35,R*.2,cx,cy,R*1.02); sh.addColorStop(0,'rgba(255,255,255,0.06)'); sh.addColorStop(.6,'rgba(5,10,30,0)'); sh.addColorStop(1,'rgba(5,10,30,0.55)'); ctx.fillStyle=sh; ctx.fillRect(cx-R,cy-R,2*R,2*R); ctx.restore() }
    // marks: one bead per example, value or questionnaire, rising from the country
    const ctr=[-G.rot[0],-G.rot[1]], list=[];
    for(const c of G.cs){ if(!c.cen) continue; const b=beads(c.iso), tot=layer==='idq'?czTot(c.iso):0; if(!b&&!tot) continue;
      const dist=d3.geoDistance(c.cen,ctr); if(a<.999&&dist>1.45) continue; const p=G.proj(c.cen); if(!p) continue; list.push([c,b,tot,p,dist]) }
    // marks: one badge per country. Number = examples, values or questionnaires; ring = the filled share
    list.sort((x,y)=>(y[0].iso===gSel||y[0].iso===hov?-1:0)-(x[0].iso===gSel||x[0].iso===hov?-1:0)||(y[1]?y[1].length:0)-(x[1]?x[1].length:0)); G.hit=[]; const placed=[], later=[];
    for(const it of list){ const [c,b,tot,p,dist]=it, edge=a<.999?Math.max(0,Math.min(1,(1.45-dist)/.25)):1, on=c.iso===hov||c.iso===gSel;
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
function gTo(T,dur,done){
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
    G.m=lerp(S.m,Tm,unf?sstep((e-.45)/.55):sstep(e/.5)); draw() },()=>{ busy=false; done&&done() }) }
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
const _gl={}; function goalsOf(iso){ return _gl[iso]||(_gl[iso]=[...new Set(sdgRows(iso).map(([d])=>goalOf(d.c)).concat((Q.ctry[iso]||{rep:[]}).rep.map(x=>goalOf(x[0]))))].filter(g=>SDGC[g]).sort((a,b)=>a-b)) }
function weights(){ const v=G.cs.map(c=>{const b=beads(c.iso); return b?b.length:0}), mx=Math.max(2,...v); G.cs.forEach((c,i)=>c.w=v[i]?Math.max(.12,Math.min(1,v[i]/Math.min(mx,12))):0); G.maxTot=Math.max(1,...G.cs.map(c=>czTot(c.iso))) }
function hoverCard(iso){
  const c=Q.ctry[iso], nm=(G.by[iso]||{f:{properties:{n:iso}}}).f.properties.n; let h=`<span class="tn">${esc(c?c.n:nm)}</span>`;
  if(!c||!any(iso)) return h+'<span class="ts">Nothing in any layer yet</span>';
  if(!has(iso,layer)) return h+`<span class="ts">Not in ${LAYER[layer].n}. It is in ${LK.filter(L=>has(iso,L)).map(L=>LAYER[L].n).join(' and ')}.</span>`;
  const more=(n,cap)=>n>cap?`<span class="ts">and ${n-cap} more · select to open the country card</span>`:'<span class="ts">Select to open the country card</span>';
  if(layer==='gain') h+=`<span class="tq" style="font-size:13.5px">${c.ex.length} GAIN ${c.ex.length===1?'example':'examples'}</span><ul class="tc">${c.ex.slice(0,12).map(e=>`<b>${e[1]}</b><span>${e[4]?'●':'○'} ${esc(e[2].length>64?e[2].slice(0,62)+'…':e[2])}</span>`).join('')}</ul>${more(c.ex.length,12)}<span class="ts">● uses the Recommendations · ○ does not or not known</span>`;
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
    if(G.alpha<.999&&Math.hypot(x-G.tr[0],y-G.tr[1])>G.k) return null; const ll=G.proj.invert([x,y]); if(!ll||isNaN(ll[0])) return null;
    for(const c of G.cs){ const b=c.bb; if(ll[1]<b[0][1]||ll[1]>b[1][1]) continue; if(b[0][0]<=b[1][0]&&(ll[0]<b[0][0]||ll[0]>b[1][0])) continue; if(d3.geoContains(c.f,ll)) return c.iso } return null };
  let dn=null, moved=0;
  cv.addEventListener('pointerdown',e=>{ if(level!=='world'||busy) return; G.spin=false; dn=[e.clientX,e.clientY]; moved=0 });
  window.addEventListener('pointermove',e=>{ if(!dn||view!=='3d'||level!=='world') return; const dx=e.clientX-dn[0], dy=e.clientY-dn[1]; moved+=Math.abs(dx)+Math.abs(dy); dn=[e.clientX,e.clientY]; const s=57.3/G.k; G.rot=[G.rot[0]+dx*s,Math.max(-70,Math.min(70,G.rot[1]-dy*s))]; draw() });
  window.addEventListener('pointerup',()=>{ dn=null });
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
function pick(iso,move){ if(!Q.ctry[iso]||!any(iso)||busy) return; gSel=iso; fSrc=fInd=fEx=fSv=mapInd=null; czSel=null; mapG=0; G.spin=false; render(); const p=$('panel'); p.classList.remove('slide'); void p.offsetWidth; p.classList.add('slide'); setTimeout(()=>p.classList.remove('slide'),600);
  if(move&&view==='3d'&&level==='world'){ const g=mainGeom(iso); { const go=layer==='sdg'&&has(iso,'sdg'); if(g&&!go){ const c=d3.geoCentroid(g); gTo({rot:[-c[0],Math.max(-40,Math.min(40,-c[1]))],k:G.k,tr:G.tr,alpha:0},[750,1500,1.8]) } } }
  if(level==='world'&&layer==='sdg'&&has(iso,'sdg')) zoomIn() }
function setView(v){ if(v===view||busy) return; view=v; G.spin=false; render(); gTo(gBase(),950) }
function zoomIn(){
  if(level==='country') return; if(busy){ setTimeout(zoomIn,160); return } const T=targetFor(gSel), st=$('stage'); $('tip').hidden=true; hov=null;
  const land=()=>{ level='country'; setHash(); render(); st.classList.add('country','landing'); setTimeout(()=>st.classList.remove('landing'),1500) };
  if(!T){ land(); return } gTo(T,[1450,2600],land);
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
function buildCountryMap(iso){
  const m=Q.cm[iso], adm=Q.sub.map[iso]; mapIso=iso;
  if(!m){ $('cmap').innerHTML=outlineSvg(iso); return }
  const pc=g=>g===0||g===3?'pr':g===2?'pi':'po', pn=g=>g===0||g===3?'Refugee or asylum-seeker location':g===2?'IDP location':'Other location';
  let s=`<svg viewBox="0 0 ${m.w} ${m.h}" role="img" aria-label="Map of ${esc(Q.ctry[iso].n)}"><path class="land" d="${m.land}"/><g id="m-idp">`;
  if(m.areas){ const mx=Math.max(1,...m.areas.map(a=>a[3])); s+=m.areas.map(a=>a[3]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[3],mx)}" ${tipA(a[1]+', '+a[2],fmt(a[3])+' internally displaced people')}/>`:'').join('') }
  else if(m.states){ const mx=Math.max(1,...m.states.map(a=>a[4])); s+=m.states.map(a=>a[4]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[4],mx)}" ${tipA(a[1],fmt(a[4])+' internally displaced people')}/>`:'').join('') }
  s+='</g><g id="m-adm">'+(adm?adm.areas.map(a=>`<path class="ar" data-k="${esc(a.n)}" d="${a.d}"/>`).join(''):'')+(m.states?m.states.map(a=>`<path class="ar" data-k="${esc(a[1])}" d="${a[0]}"/>`).join(''):'')+'</g>';
  s+='<g id="m-pts">'+m.pts.map(p=>`<circle class="${pc(p[2])}" data-g="${p[2]}" data-n="${esc(p[4]||'')}" cx="${p[0]}" cy="${p[1]}" r="${m.pts.length>800?1.3:2.2}" ${p[4]?tipA(p[4],pn(p[2])):''}/>`).join('')+'</g>';
  s+='<g id="m-cz">'+(Q.cpts[iso]?(mx=>Q.cpts[iso].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${(2+Math.sqrt(p[3]/mx)*15).toFixed(1)}" data-c="${p[2]}" fill="${CAUSE_COL[p[2]]}" fill-opacity=".5" stroke="${CAUSE_COL[p[2]]}" ${tipA(p[4],fmt(p[3])+' people displaced<br>'+CZ[p[2]]+(p[5]?' · '+esc(p[5]):''))}/>`).join(''))(Math.max(1,...Q.cpts[iso].map(p=>p[3]))):'')+'</g>';
  s+='<g id="m-camps">'+(adm?adm.camps.map(c=>`<circle data-k="${esc(c.k)}" data-n="${esc(c.n)}" cx="${c.x}" cy="${c.y}" r="5.5" stroke="#ffffff" stroke-width="1.5"/>`).join(''):'')+'</g><g id="m-lab">';
  const lab=(k,x,y,an,nm)=>`<text class="lv" data-k="${esc(k)}" x="${x}" y="${y}" text-anchor="${an}" font-size="15" font-weight="600"></text><text class="ln" data-k="${esc(k)}" x="${x}" y="${y+13}" text-anchor="${an}" font-size="10">${esc(nm)}</text>`;
  if(adm) s+=adm.areas.map(a=>{const isl=a.n.startsWith('Islamabad'); return lab(a.n,isl?a.cx+12:a.cx,isl?a.cy+12:a.cy,isl?'start':'middle',isl?'Islamabad':a.n)}).join('');
  if(m.states) s+=m.states.map(a=>lab(a[1],a[2],a[3],'middle',a[1])).join('');
  s+=`</g><g id="m-nat" style="opacity:0"><text class="a" x="${(m.bb[0]+m.bb[1])/2}" y="${(m.bb[2]+m.bb[3])/2}" text-anchor="middle" font-size="44" font-weight="600"></text><text class="b" x="${(m.bb[0]+m.bb[1])/2}" y="${(m.bb[2]+m.bb[3])/2+22}" text-anchor="middle" font-size="13"></text>`;
  $('cmap').innerHTML=s+'</g></svg>';
}
function paintMap(){
  const iso=gSel; if(mapIso!==iso) buildCountryMap(iso);
  const m=Q.cm[iso]; if(!m) return;
  if($('cmap').dataset.cov){ $('cmap').querySelectorAll('#m-pts circle').forEach(p=>p.style.opacity=''); $('cmap').querySelectorAll('#m-camps circle').forEach(k=>k.style.fill=''); delete $('cmap').dataset.cov }
  const S=Q.sub, M=S.meta[iso], V=mapInd&&S.val[iso]?S.val[iso][mapInd]:null, R=mapInd&&S.rep[iso]?S.rep[iso].ind[mapInd]:null, cause=mapInd==='__cause', NR=(!V&&!R&&!cause&&mapInd&&fSrc&&surveysOf(iso).get(fSrc)||[]).find(([d])=>d.c===mapInd), NV=NR?[NR[1].r,NR[1].h][mapG]:null, base=!V&&!R&&!cause&&NV==null, root=$('cmap');
  const land=root.querySelector('.land'), nt=q0=>root.querySelector(q0); land.style.fill=NV!=null?ramp(NV):''; const natT=nt('#m-nat'); if(natT){ natT.style.opacity=NV!=null?1:0; if(NV!=null){ natT.querySelector('.a').textContent=NV+'%'; natT.querySelector('.b').textContent=[NR[1].g1,NR[1].g2||'Host'][mapG]+' · national value only' } }
  const val=k=>V?V.areas[((M.alias||{})[k]||k)+'|'+M.g[mapG]]:R?R.vals[k]:null;
  const top=m.states?new Set([...m.states].sort((a,b)=>b[4]-a[4]).slice(0,6).filter(a=>a[4]).map(a=>a[1])):null;
  const q=id=>root.querySelector('#'+id);
  q('m-idp').style.opacity=base?1:0; q('m-cz').style.opacity=cause?1:0; q('m-cz').style.pointerEvents=cause?'auto':'none'; czFocus(czSel); q('m-pts').style.opacity=base?.85:.28;
  q('m-adm').style.pointerEvents=base&&m.states?'none':'auto';
  q('m-adm').querySelectorAll('.ar').forEach(p=>{ const k=p.dataset.k, c=val(k); p.classList.toggle('on',!!c); if(c) p.style.fill=ramp(c[0]);
    p.setAttribute('data-tip',`<span class="tn">${esc(k)}</span>`+(c?`<span class="tq">${c[0]}%</span><span class="ts">${V?esc(SNN[mapInd])+' · '+esc(M.g[mapG])+' · '+c[1]+' households in the sample'+(c[1]<50?' (small)':''):esc(R.n)+' · '+fmt(c[1])+' '+R.nl}</span>`:`<span class="ts">${base?'No value shown: switch the map to an indicator':'No value for this area'}</span>`)) });
  q('m-camps').querySelectorAll('circle').forEach(c=>{ const v0=V&&mapG===0&&V.camps?V.camps[c.dataset.k]:null, v=v0&&v0[1]>=10?v0:null; c.style.opacity=v?1:0; c.style.pointerEvents=v?'auto':'none'; if(v){ c.style.fill=ramp(v[0]); c.setAttribute('data-tip',`<span class="tn">${esc(c.dataset.n)}</span><span class="tq">${v[0]}%</span><span class="ts">${esc(SNN[mapInd])} · refugees · ${v[1]} households in the sample</span>`) } });
  q('m-lab').querySelectorAll('.lv').forEach(t=>{ const c=val(t.dataset.k); t.textContent=c?Math.round(c[0])+'%':''; });
  q('m-lab').querySelectorAll('.ln').forEach(t=>{ const k=t.dataset.k, c=val(k), show=c||(base&&(top?top.has(k):!k.startsWith('Islamabad'))); t.style.opacity=show?(c?.9:.75):0; t.setAttribute('y',+t.previousSibling.getAttribute('y')+(c?13:0)) });
}
function czFocus(k){ const g=$('cmap').querySelector('#m-cz'); if(g) g.querySelectorAll('circle').forEach(c=>c.style.opacity=!k||+c.dataset.c===+k?'':.05) }
function renderMapFoot(){
  const iso=gSel, m=Q.cm[iso], S=Q.sub, M=S.meta[iso], keys=subKeys(iso), V=mapInd&&S.val[iso]?S.val[iso][mapInd]:null, R=mapInd&&S.rep[iso]?S.rep[iso].ind[mapInd]:null;
  const g=m?m.pts.reduce((o,p)=>{const k=p[2]===0||p[2]===3?'r':p[2]===2?'i':'o'; o[k]++; return o},{r:0,i:0,o:0}):{r:0,i:0,o:0};
  const pill=(cls,txt,title,body)=>`<i class="pill ${cls}" tabindex="0" ${tipA(title,body)}>${txt}</i>`;
  const NR=(!V&&!R&&mapInd&&mapInd!=='__cause'&&fSrc&&surveysOf(iso).get(fSrc)||[]).find(([d])=>d.c===mapInd);
  let leg='', notes='';
  if(NR){ leg=`<span style="flex:1 1 200px"><span>0%</span><i style="flex:1;height:8px;border-radius:1px;background:linear-gradient(90deg,#27375f,#2f6f8f,#4cc3c9,#c9f4f6)"></i><span>100%</span></span>`; notes=pill('plain','National','One value for the whole country','This indicator has not been calculated below country level for this survey yet, so the map shows the national value.') }
  else if(mapInd==='__cause'){ const cs=[...new Set(Q.cpts[iso].map(p=>p[2]))].sort(); leg=cs.map(k=>`<span><i class="d" style="background:${CAUSE_COL[k]}"></i>${CZ[k]}</span>`).join('')+'<span>larger circle = more people</span>'; notes=pill('ok','Exists','Displacement by cause','Places where people were displaced, by cause, from the causing events analysis in the ID Questions repository. The '+Q.cpts[iso].length+' largest records are shown.') }
  else if(!mapInd){
    leg=(g.r?`<span><i class="d" style="background:#8fe0e4"></i>${fmt(g.r)} refugee locations</span>`:'')+(g.i?`<span><i class="d" style="background:#f3cf7e"></i>${fmt(g.i)} IDP locations</span>`:'')+(g.o?`<span><i class="d" style="background:#8b98b3"></i>${fmt(g.o)} other</span>`:'')+(m&&m.states?`<span><i class="g"></i>IDPs by ${esc(m.areas?m.lay.unit:m.lay.parent)}</span>`:'')||'<span>No locations recorded.</span>';
    notes=pill('ok','Exists','Population base','As on the GAIN country page. Locations from UNHCR.'+(m&&m.lay?' IDPs by '+esc(m.lay.unit)+' from '+esc(m.lay.who)+'. '+esc(m.lay.cover):''))+(m&&m.src?pill('plain','Source','Source of the IDP counts',esc(m.src)):'');
  } else {
    leg=`<span style="flex:1 1 200px"><span>0%</span><i style="flex:1;height:8px;border-radius:1px;background:linear-gradient(90deg,#27375f,#2f6f8f,#4cc3c9,#c9f4f6)"></i><span>100%</span></span>${V&&V.camps&&mapG===0?'<span><i class="d" style="background:#4cc3c9;outline:1.5px solid #fff"></i>camp</span>':''}`;
    notes=V?pill('new','New','Calculated from microdata',esc(M.survey)+', by '+M.unit+(V.camps?' and by camp':'')+'. '+esc(M.wl)+'.')+pill('tbc','To confirm','Read with care','The survey was designed for national or stratum estimates. Small cells are marked; confidence intervals are not calculated yet.')
      :pill('new','New','From a published table','Share of '+esc(R.of)+'. '+esc(R.tbl)+'. Not calculated from microdata.')+(m&&m.areas?pill('plain','Levels','Two levels on one map','Population is counted by '+esc(m.lay.unit)+'; these values exist only by '+esc(m.lay.parent)+'.'):'')+pill('flag','Check','Not an SDG indicator','It is what the report tabulates by state. Katsina rests on very few households.');
  }
  $('stfoot').innerHTML=`<div class="chips" id="mapchips">${act('map','','Population','chip',`aria-pressed="${!mapInd}"`)}${Q.cpts[iso]?act('map','__cause','Displaced by cause','chip',`aria-pressed="${mapInd==='__cause'}"`):''}${keys.map(k=>act('map',k,esc(subName(iso,k)),'chip',`aria-pressed="${k===mapInd}"`)).join('')}${NR?act('map',mapInd,esc(mapInd+' '+NR[0].n),'chip','aria-pressed="true"'):''}${V||NR&&NR[1].h!=null?`<span class="lnote" style="align-self:center;margin:0 2px 0 8px">for</span>`+(V?M.g:[NR[1].g1,NR[1].g2||'Host']).map((x,i)=>act('mapg',i,esc(x),'chip',`aria-pressed="${i===mapG}"`)).join(''):''}</div>
    <div class="mleg">${leg}<span style="margin-left:auto;gap:5px">${notes}</span></div>`;
}

/* ---- shared pieces used by more than one layer ---- */
function identList(bs){
  const order=Q.model.map(m=>m.code).concat(EXTRA), rs=Q.bank.filter(r=>r[0]===bs&&r[2]!=='none').sort((a,b)=>order.indexOf(a[2])-order.indexOf(b[2]));
  return rs.map(r=>`<div class="idr"><div class="c"><span tabindex="0" ${(m=>m?tipA(m.code+' · '+m.title+(m.core?' · core':''),esc(m.stem)):tipA(r[2],esc(ITEM[r[2]]||'')+' · outside the 13 module items'))(Q.model.find(x=>x.code===r[2]))}>${esc(r[2])}</span><i class="pill a-${r[3]}">${esc(r[3])}</i></div><div><span style="color:var(--dim);font:500 12px var(--mono)">${esc(r[1])}</span> ${esc(r[5])}${r[7]&&r[7]!==r[5]?`<div class="e">${esc(r[7])} ${r[8]?'<i class="pill draft">Draft</i>':''}</div>`:''}</div></div>`).join('');
}
const itemsAsked=bs=>Q.model.filter(m=>bankFor(bs,m.code).length);
function identBand(iso,src,r0){
  const bs=Q.link[src];
  return `<div class="band" style="border-left:3px solid ${LAYER.idq.col}"><div class="lhead"><h2>Who is counted</h2><span class="lnote">how the groups were identified · shared with ID Questions</span></div>
    <div class="how"><div class="howr"><span class="hk">Groups from</span><div class="hv">${r0.gv?`<div class="vars">${vchip(r0.country,r0.gv)}</div>`:'<span>The survey\'s sample <i class="pill tbc">To confirm</i></span>'}<span>${esc(r0.g1)}${r0.g2?' compared with '+esc(r0.g2.toLowerCase()):', no comparison group'}</span></div></div></div>
    ${bs!=null?`<h3>Identification questions in this survey's questionnaire</h3><div class="idq">${identList(bs)}</div>
      <p class="lnote">${itemsAsked(bs).length} of 13 module items asked, ${itemsAsked(bs).filter(m=>m.core).length} of 5 core. ${Q.idcmp[src]?'':'Whether these questions give the same groups as the group variable has not been compared in this file.'}</p>
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
function sits(L,exists,what){return `<div class="sits" style="--lc:${LAYER[L].col}"><span>Layer</span><b style="font:600 16px var(--head)">${LAYER[L].n}</b>${exists?'<i class="pill ok">Exists</i>':'<i class="pill new">New</i>'}<span style="text-transform:none;letter-spacing:0;font:400 13px var(--body);color:var(--soft)">${what}</span><a href="${LAYER[L].live}" target="_blank" rel="noopener" style="font-size:13px;margin-left:auto">Live site ↗</a></div>`}
function elsewhere(iso){const o=LK.filter(L=>L!==layer&&has(iso,L)); return o.length?`<p class="lnote">It is in: ${o.map(L=>act('layer',L,LAYER[L].n,'lkbtn',`style="--lc:${LAYER[L].col}"`)).join(' ')}</p>`:''}

/* ---- right panel at world level: the country card ---- */
const tiles=c=>c.pop?`<div class="ptiles">${[['Refugees and asylum-seekers',c.pop[1]],['Internally displaced',c.pop[2]],['Stateless',c.pop[3]]].map(([l,v])=>`<div><b>${fmt(v)}</b><span>${l}</span></div>`).join('')}</div><p class="lnote">End of ${c.pop[0]} · UNHCR and IDMC</p>`:'';
function exCard(e,iso,btn){ const k=exLinks(iso,e[0]);
  return `<article class="exc ${btn&&e[0]===fEx?'cur':''}" ${e[10]?tipA('What it is',esc(e[10])+(e[10].length>=260?'…':'')):''}>${e[9]?`<img src="covers/ex${e[0]}.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<div class="noc">no cover</div>'}
    <div class="exb"><span class="exmeta">${e[1]} · ${e[5]==='C'?'COUNTRY-LED':'INSTITUTION-LED'} · EXAMPLE ${e[0]}</span><b>${esc(e[2])}</b><span class="org">${esc(e[3])}</span>
    <div class="tags">${e[4]?'<i class="pill ok">Uses the Recommendations</i>':'<i class="pill plain">Not using or not known</i>'}${(e[6]?e[6].split(', '):[]).concat(e[7]?e[7].split(', '):[]).map(t=>`<i class="pill plain">${esc(t)}</i>`).join('')}${k.rows||k.rep?`<i class="pill" style="background:${LAYER.sdg.col};color:var(--night)">SDG values</i>`:''}${k.bs!=null?`<i class="pill" style="background:${LAYER.idq.col};color:var(--night)">Questionnaire</i>`:''}</div>
    <div class="exl">${e[8]?`<a href="${esc(e[8])}" target="_blank" rel="noopener">Open the source ↗</a>`:''}${btn?act('ex',e[0],e[0]===fEx?'Card open below ↓':'Open its card'):''}</div></div></article>` }
const GN=['Refugees','Returnees','IDPs','Asylum-seekers','Stateless people','Others of concern'], GCOL=['#8fe0e4','#8b98b3','#f3cf7e','#8fe0e4','#b48ef0','#8b98b3'];
function miniMap(iso){
  const m=Q.cm[iso], adm=Q.sub.map[iso]; if(!m) return outlineSvg(iso);
  let s=`<svg viewBox="0 0 ${m.w} ${m.h}" role="img" aria-label="Map of ${esc(Q.ctry[iso].n)}"><path class="land" d="${m.land}"/><g class="kidp">`;
  if(m.areas){ const mx=Math.max(1,...m.areas.map(a=>a[3])); s+=m.areas.map(a=>a[3]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[3],mx)}" ${tipA(a[1]+', '+a[2],fmt(a[3])+' internally displaced people')}/>`:'').join('') }
  else if(m.states){ const mx=Math.max(1,...m.states.map(a=>a[4])); s+=m.states.map(a=>a[4]?`<path class="ia" d="${a[0]}" fill="${idpCol(a[4],mx)}" ${tipA(a[1],fmt(a[4])+' internally displaced people')}/>`:'').join('') }
  s+='</g><g>'+(adm?adm.areas.map(a=>`<path class="so ka" data-n="${esc(a.n)}" d="${a.d}"/>`).join(''):'')+(m.states?m.states.map(a=>`<path class="so ka" data-n="${esc(a[1])}" d="${a[0]}"/>`).join(''):'')+(m.areas?m.areas.map(a=>`<path class="so ka fine" data-n="${esc(a[1])}" d="${a[0]}"/>`).join(''):'')+'</g>';
  const big=m.pts.length>800;
  s+='<g>'+m.pts.map(p=>`<circle class="kp" data-g="${p[2]}" data-n="${esc(p[4]||'')}" data-r="${big?1.6:3}" cx="${p[0]}" cy="${p[1]}" r="${big?1.6:3}" fill="${GCOL[p[2]]}" ${p[4]?tipA(p[4],GN[p[2]]+' location'):''}/>`).join('')+'</g>';
  s+='<g>'+(adm?adm.camps.map(c=>`<circle class="kc" cx="${c.x}" cy="${c.y}" r="9" ${tipA(c.n,'Sampled by this survey')}/>`).join(''):'')+'</g>';
  return s+'</svg>';
}
function coverMap(id){
  const root=document.querySelector('.kmap'), leg=$('kleg'); if(!root||!leg) return;
  const iso=gSel, c=Q.ctry[iso], m=Q.cm[iso], e=id!=null?c.ex.find(x=>x[0]===+id):null;
  const gs=e?(e[7]?e[7].split(', '):[]):null, idx=gs?new Set(gs.map(g=>GN.indexOf(g)).filter(i=>i>=0)):null, names=e&&e[11]?e[11].toLowerCase().split('|'):[];
  if(idx&&idx.has(0)) idx.add(3);
  const cnt=[0,0,0,0,0,0]; let lit=0;
  root.querySelectorAll('.kp').forEach(p=>{ const g=+p.dataset.g; cnt[g]++; const on=!idx||idx.has(g)||(p.dataset.n&&names.includes(p.dataset.n.toLowerCase())); if(on&&idx) lit++; p.style.opacity=on?(idx?1:.8):.07; p.setAttribute('r',on&&idx?+p.dataset.r*1.35:p.dataset.r) });
  const idp=root.querySelector('.kidp'); if(idp) idp.style.opacity=!idx?1:idx.has(2)?1:.1;
  let named=0; root.querySelectorAll('.ka').forEach(p=>{ const on=names.includes(p.dataset.n.toLowerCase()); if(on) named++; p.classList.toggle('hit',on) });
  const src=e?Q.exsrc[e[0]]:null, sampled=!!(src&&Q.sub.val[iso]&&surveysOf(iso).has(src)); root.querySelectorAll('.kc').forEach(k=>k.style.opacity=sampled?1:0);
  const row=(col,txt)=>`<span><i class="d" style="background:${col}"></i>${txt}</span>`;
  if(!e){ leg.innerHTML=`<div class="mleg" style="margin-top:0">${cnt[0]+cnt[3]?row(GCOL[0],fmt(cnt[0]+cnt[3])+' refugee locations'):''}${cnt[2]?row(GCOL[2],fmt(cnt[2])+' IDP locations'):''}${cnt[4]?row(GCOL[4],fmt(cnt[4])+' stateless'):''}${m&&m.states?`<span><i class="g"></i>IDPs by ${esc(m.areas?m.lay.unit:m.lay.parent)}</span>`:''}</div>`
      +(c.pop?`<p class="lnote">${fmt(c.pop[1])} refugees and asylum-seekers · ${fmt(c.pop[2])} internally displaced · ${fmt(c.pop[3])} stateless, end of ${c.pop[0]}</p>`:''); return }
  const miss=gs.filter(g=>{const i=GN.indexOf(g); return i<0||(!cnt[i]&&!(i===0&&cnt[3])&&!(i===2&&m&&m.states))});
  leg.innerHTML=`<p style="font-size:13px"><b style="font-weight:600">On the map:</b> ${gs.length?'where the groups this example covers are located':'this example does not record which groups it covers'}.</p>
    <div class="mleg" style="margin-top:0">${gs.map(g=>{const i=GN.indexOf(g); return `<span><i class="d" style="background:${i>=0?GCOL[i]:'#8b98b3'}"></i>${esc(g)}</span>`}).join('')}${sampled?'<span><i class="d" style="border:2px solid #fff"></i>camps the survey sampled</span>':''}${named?`<span><i class="d" style="border:2px solid var(--gold)"></i>${esc(e[11].replace(/\|/g,', '))}</span>`:''}</div>
    ${miss.length?`<p class="lnote">No mapped locations for: ${esc(miss.join(', ').toLowerCase())}.</p>`:''}`;
}
function recSet(e){ const x=Q.gx[e[0]]; if(x&&x.rc) return x.rc; const r=e[12]; if(r==='IRRS'||r==='IRIS'||r==='IROSS') return [r]; if(!e[4]) return []; const g=e[7]||''; const o=[]; if(/Refugees|Asylum/.test(g)) o.push('IRRS'); if(/IDPs/.test(g)) o.push('IRIS'); if(/Stateless/.test(g)) o.push('IROSS'); return r==='Mixed use'?o:[] }
const RECS={IRRS:'International Recommendations on Refugee Statistics (IRRS)',IRIS:'International Recommendations on IDP Statistics (IRIS)',IROSS:'International Recommendations on Statelessness Statistics (IROSS)','Mixed use':'More than one set of Recommendations',Undetermined:'Not determined'};
function exOpen(e,iso,noBack){ const k=exLinks(iso,e[0]), c=Q.ctry[iso], x=Q.gx[e[0]]||{}, pills=a=>a.map(t=>`<i class="pill plain">${esc(t)}</i>`).join(' ');
  const row=(k_,v,tip)=>v?`<tr><th>${k_}</th><td ${tip?tipA(k_,tip)+' tabindex="0" style="cursor:help"':''}>${v}</td></tr>`:'';
  const basis=b=>b==='title'?'Read from the title of the example.':b==='none'?'':b?'Assigned from: '+esc(b)+'.':'';
  const also=[k.rows?act('open-sdg',k.src,`SDG · ${k.rows.length} values`,'mini',`style="--lc:${LAYER.sdg.col}"`):k.rep?act('open-sdg','__rep','SDG · values by state','mini',`style="--lc:${LAYER.sdg.col}"`):'',
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
  const st={RECOMMENDED:['ok','Give local examples'],LOW_SALIENCE:['plain','Little evidence'],RESIDUAL:['plain','Always kept'],UNEVIDENCED:['tbc','No evidence source']};
  return `<div class="band"><div class="lhead"><h2>Why people were displaced</h2><span class="lnote">the eight answers to the first module question, with the evidence for ${esc(c.n)}</span></div>
    ${c.dp?`<div class="ptiles"><div><b>${fmt(tot)}</b><span>People displaced with a recorded cause</span></div><div><b>${fmt(c.dp[0])}</b><span>IDPs in the country</span></div><div><b>${fmt(c.dp[1])}</b><span>Refugees hosted</span></div></div>`:''}
    <div>${cz.map(z=>{const sub=Q.subr[z[0]]||[]; return `<${inter?`button type="button" data-act="cz" data-v="${z[0]}" data-czh="${z[0]}" aria-pressed="${czSel===z[0]}"`:'div tabindex="0"'} class="czr" ${tipA(z[0]+' · '+CZ[z[0]],(z[2]?'<b>In the sources:</b> '+esc(z[2])+'<br>':'')+(sub.length?'<b>How people say it:</b><br>'+sub.slice(0,4).map(x=>'“'+esc(x[2])+'”').join('<br>'):''))}><span class="czn"><i class="sw" style="background:${CAUSE_COL[z[0]]}"></i>${z[0]} · ${CZ[z[0]]}</span><span class="czb"><i style="width:${z[3]?Math.max(2,z[3]/mx*100):0}%;background:${CAUSE_COL[z[0]]}"></i></span><span class="czv">${z[3]?fmt(z[3]):'–'}</span><i class="pill ${st[z[1]][0]}">${st[z[1]][1]}</i></${inter?'button':'div'}>`}).join('')}</div>
    <p class="lnote">From the causing events analysis (IDMC, UCDP, ACLED and others). Point at a cause for local examples and the ways respondents phrase it${inter?'; select it to show only that cause on the map':''}. The answer options stay the same in every country; the evidence guides enumerator examples.</p></div>`;
}
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
      +(c.rep.length?`<div class="band"><h3>${c.rep.length} from published reports</h3><div>${c.rep.map(x=>`<div class="irow" tabindex="0" ${tipA(x[3]+(x[4]?', page '+x[4]:''),esc(x[5]))}><div class="itop">${goalTile(x[0])}<span>${esc(x[2])}</span><b>${esc(x[1])}</b></div></div>`).join('')}</div></div>`:'')
      +`<div class="fl">${keys.length?`<i class="pill new">New</i><span>Below country level: ${keys.length} ${keys.length===1?'indicator':'indicators'} by ${Q.sub.val[gSel]?Q.sub.meta[gSel].unit:Q.sub.rep[gSel].unit}, on the country map.</span>`:'<i class="pill plain">National</i><span>No values below country level yet.</span>'}</div>` }
  else body=causesBlock(c)+`<div class="band"><h3>${c.sv.length?c.sv.length+' '+(c.sv.length===1?'questionnaire':'questionnaires')+' mapped against the module':'No questionnaire mapped yet'}</h3><div class="rows">${c.sv.map(s=>`<div class="oex" style="grid-template-columns:minmax(0,1fr) auto"><span style="font:inherit;color:inherit">${esc(Q.surveys[s][1])}</span><span>${itemsAsked(s).length} of 13 items</span></div>`).join('')}</div></div>`;
  return `<div class="chead" style="--lc:${LAYER[L].col}"><div><p class="eyebrow" style="color:var(--lc)">${LAYER[L].n} · country card</p><h2>${esc(c.n)}</h2></div>${dots(gSel)}${act('zoom','',`Zoom in →`,'actbtn','style="margin-left:auto;background:var(--lc);border-color:var(--lc);color:var(--night);font-weight:600"')}</div>`
   +body
   +`<details class="band"><summary style="cursor:pointer"><h3 style="display:inline">Browse the ${list.length} countries in ${LAYER[L].n}</h3></summary><div class="clist" style="max-height:300px;overflow-y:auto;margin-top:10px">${list.map(i=>`<button class="crow" type="button" data-act="pick" data-v="${i}" aria-pressed="${i===gSel}"><span>${esc(Q.ctry[i].n)}</span><span>${cnt(i)}</span></button>`).join('')}</div>
      ${L==='idq'?'<p class="lnote">EHCVM 2026 covers 10 countries and is not placed on the map yet.</p>':''}</details>`;
}

/* ---- GAIN at country level ---- */
function exLinks(iso,id){const src=Q.exsrc[id], rows=src?surveysOf(iso).get(src):null, rep=Q.sub.rep[iso]&&Q.sub.rep[iso].ex===id?Q.sub.rep[iso]:null; return {src,rows,rep,bs:src!=null?Q.link[src]:undefined,hold:src?HOLD[src]:null}}
function exRows(iso){ const c=Q.ctry[iso]; return c.ex.map(e=>{const k=exLinks(iso,e[0]); return `<button class="exr" type="button" data-act="ex" data-v="${e[0]}" data-exh="${e[0]}">${e[9]?`<img class="th" src="covers/ex${e[0]}.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<span class="th none"></span>'}<span class="tt"><span class="yr">${e[1]}</span><b>${esc(e[2])}</b><small>${esc(e[3])}</small><small class="gr">${e[7]?esc(e[7]):'groups not recorded'}${recSet(e).length?' · '+recSet(e).join(' + '):''}</small></span><span class="mk"><i class="bd ${e[4]?'f':''}" ${tipA(e[4]?'Uses the Recommendations':'Not using them, or not known','')}></i>${k.rows||k.rep?`<i class="bd f" style="--c:${LAYER.sdg.col}"></i>`:''}${k.bs!=null?`<i class="bd f" style="--c:${LAYER.idq.col}"></i>`:''}</span></button>`}).join('') }
function pGain(){
  const iso=gSel, c=Q.ctry[iso], open=fEx!=null?c.ex.find(e=>e[0]===fEx):null;
  const n=c.ex.reduce((o,e)=>{recSet(e).forEach(k=>o[k]=(o[k]||0)+1); return o},{});
  return sits('gain',true,'The country page: map, populations and examples.')
   +(c.ex.length?`<div class="kex">${open?exOpen(open,iso):`<div class="lhead"><h2>${c.ex.length} GAIN ${c.ex.length===1?'example':'examples'}</h2></div><p class="lnote">Point at one to see on the map who it covers. Select it to open its card.</p><div class="exrows" style="max-height:none">${exRows(iso)}</div>`}</div>`
     :`<div class="band"><p style="color:var(--soft)">No GAIN example for ${esc(c.n)} yet.</p>${elsewhere(iso)}</div>`)
   +(Object.keys(n).length?`<div class="band"><div class="recsum" style="border:0;padding:0"><h3>Recommendations used here</h3><div>${['IRRS','IRIS','IROSS'].filter(k=>n[k]).map(k=>`<span ${tipA(k,esc(RECS[k]))}><img src="recs/${k}.jpg" alt=""><b>${n[k]}</b><small>${k}</small></span>`).join('')}</div></div></div>`:'')
   +(c.pop?`<div class="band">${tiles(c)}</div>`:'');
}
function coverBig(id){
  if(level!=='country'||layer!=='gain'||mapInd) return; const root=$('cmap'), P=root.querySelector('#m-pts'); if(!P) return;
  const iso=gSel, c=Q.ctry[iso], m=Q.cm[iso], e=id!=null?c.ex.find(x=>x[0]===+id):null;
  const gs=e?(e[7]?e[7].split(', '):[]):null, idx=gs?new Set(gs.map(g=>GN.indexOf(g)).filter(i=>i>=0)):null, names=e&&e[11]?e[11].toLowerCase().split('|'):[];
  if(idx&&idx.has(0)) idx.add(3);
  root.dataset.cov=1; P.style.opacity=e?1:.85;
  P.querySelectorAll('circle').forEach(p=>{ const on=!idx||idx.has(+p.dataset.g)||(p.dataset.n&&names.includes(p.dataset.n.toLowerCase())); p.style.opacity=on?'':.08 });
  const idp=root.querySelector('#m-idp'); if(idp) idp.style.opacity=!idx||idx.has(2)?1:.1;
  const src=e?Q.exsrc[e[0]]:null, sampled=!!(src&&Q.sub.val[iso]&&surveysOf(iso).has(src));
  root.querySelectorAll('#m-camps circle').forEach(k=>{ k.style.opacity=sampled?1:0; k.style.fill=sampled?'transparent':'' });
  let note=$('covnote'); if(!note){ note=document.createElement('p'); note.id='covnote'; note.className='lnote'; $('stfoot').appendChild(note) }
  note.innerHTML=e?`<b style="font-weight:600;color:var(--soft)">On the map:</b> ${gs.length?'where the groups this example covers are located ('+esc(gs.join(', ').toLowerCase())+')':'this example does not record which groups it covers'}${sampled?'; white rings are the camps the survey sampled':''}.`:'';
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
    body=`<div class="band"><h3>${rows.length} ${rows.length===1?'value':'values'} from this survey · select one</h3><div class="rows">${rows.map(([x,y])=>`<button class="ind sg" type="button" data-act="ind" data-v="${x.c}" style="--gc:${gcolOf(x.c)};${x.c===fInd?'background:rgba(122,167,230,.16);box-shadow:inset 3px 0 0 '+gcolOf(x.c):''}">${goalTile(x.c,x.pri)}<span class="iname">${esc(x.n)}</span>${y.h!=null?barPair(y.r,y.h):`<div class="bars"><div class="bar"><div class="track"><div class="fill r" style="width:${y.r}%"></div></div><span class="bv">${y.r}%</span></div></div>`}<span class="go">${x.c===fInd?'on the map':'show →'}</span></button>`).join('')}</div>
        <p class="lnote">First bar: ${esc(r.g1.toLowerCase())}. Second: ${r.g2?esc(r.g2.toLowerCase()):'no comparison group'}. ◆ EGRISS priority indicator.</p></div>
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
   +(c.rep.length?`<div class="band"><h3>National values from published reports · ${c.rep.length}</h3><div>${c.rep.map(x=>`<div class="irow" tabindex="0" ${tipA(x[3]+(x[4]?', page '+x[4]:''),esc(x[5]))}><div class="itop">${goalTile(x[0])}<span>${esc(x[2])}</span><b>${esc(x[1])}</b></div></div>`).join('')}</div><p class="lnote">Point at a row for its source and page.</p></div>`:'');
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
    <div class="ptiles"><div><b>${asked.length} of 13</b><span>module items asked</span></div><div><b>${asked.filter(m=>m.core).length} of 5</b><span>core items asked</span></div><div><b>${coded.length}</b><span>identification questions${langs.length?' · '+esc(langs.join(', ')):''}</span></div></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${modDots(s)}<span class="legend" style="font-size:12px"><span><i class="sw" style="background:var(--teal)"></i>same</span><span><i class="sw" style="background:var(--blue)"></i>close</span><span><i class="sw" style="background:var(--gold)"></i>partial</span><span><i class="sw" style="background:var(--red)"></i>different</span></span></div>
    <div><h3 style="margin-bottom:4px">The module, step by step, with this questionnaire's questions</h3>
      <div class="mflow2">${Q.model.map((m,i)=>{const rs=bankFor(s,m.code); return `<div class="mf two ${m.core?'core':''} ${rs.length?'':'na'}"><div class="mfk"><b>${i+1}</b><span>${esc(m.code)}</span></div>
        <div class="mfb"><span class="route">↳ ${esc(m.skip||'Ask all')}</span><b tabindex="0" style="cursor:help" ${tipA('Module wording'+(m.core?' · core':' · optional'),esc(m.stem)+(m.opts.length?'<br><br>'+m.opts.map(o=>esc(o)).join('<br>'):''))}>${esc(m.title)}${m.core?' <i class="pill ok">Core</i>':''}</b>
          ${rs.length?rs.map(r=>qBlock(r,seen)).join(''):'<span class="lnote">Not asked in this questionnaire.</span>'}</div></div>`}).join('')}</div></div>
    ${extra.length?`<div><h3 style="margin-bottom:6px">Related questions outside the 13 module items</h3><div class="stack" style="gap:8px">${extra.map(k=>bankFor(s,k).map(r=>`<div><span class="lnote">${esc(k)} · ${esc(ITEM[k]||k)}</span>${qBlock(r,seen)}</div>`).join('')).join('')}</div></div>`:''}
    <p class="lnote">Only the identification part is shown; ${all.length-coded.length} other questions from this questionnaire are kept in the record. ${nEx?(nEx===coded.length?'Each question is shown as it appears in the original questionnaire.':nEx+' of '+coded.length+' questions are shown as they appear in the original questionnaire; the others could not be located in the file.'):'The original questionnaire is not in our files yet, so the questions are shown as recorded in the question bank.'}</p>
    ${rows?`<div class="also"><span>Used for</span>${act('open-sdg',src,`SDG · ${rows.length} values calculated from this survey`,'mini',`style="--lc:${LAYER.sdg.col}"`)}</div>`:''}</div>`;
}
function pIdq(){
  const iso=gSel, c=Q.ctry[iso], one=c.sv.length===1, open=one?c.sv[0]:(fSv!=null&&c.sv.includes(fSv)?fSv:null);
  return sits('idq',false,'Causes of displacement exist on the live map; the questionnaire view is new.')+causesBlock(c,!!Q.cpts[iso])
   +(c.sv.length?`<div class="kex" style="--lc:${LAYER.idq.col}">${open!=null?qOpen(open,iso,one):`<div class="lhead"><h2>${c.sv.length} questionnaires mapped against the module</h2></div><p class="lnote">Select one to see its identification questions and skip logic, step by step.</p>
        <div class="exrows" style="max-height:none">${c.sv.map(s=>{const src=Object.keys(Q.link).find(k=>Q.link[k]===s); return `<button class="exr" type="button" data-act="sv" data-v="${s}" style="grid-template-columns:minmax(0,1fr) auto"><span class="tt"><b>${esc(Q.surveys[s][1])}</b><small>${itemsAsked(s).length} of 13 module items · ${Q.bank.filter(r=>r[0]===s&&r[2]!=='none').length} identification questions</small>${modDots(s)}</span><span class="mk">${src?`<i class="bd f" style="--c:${LAYER.sdg.col}" ${tipA('SDG','Values were calculated from this survey')}></i>`:''}</span></button>`}).join('')}</div>`}</div>`
     :`<div class="band"><p style="color:var(--soft)">No questionnaire from ${esc(c.n)} has been mapped against the module yet.</p></div>`);
}
function causes(c){return c.cz.length?`<div class="band"><h3>Causes the evidence supports in ${esc(c.n)}</h3><div class="flow">${c.cz.filter(z=>z[1]==='RECOMMENDED').map(z=>`<span class="qchip">${z[0]} · ${CZ[z[0]]}</span>`).join('')||'<span class="lnote">None recommended.</span>'}</div><p class="lnote">From the causing events map: where enumerators need local examples for the first module item.</p></div>`:''}

/* ---- Datasets: a side resource ---- */
function renderDrawer(){
  const exOf=src=>Object.keys(Q.exsrc).find(k=>Q.exsrc[k]===src);
  const row=d=>{const k=HOLD[d.src], ex=exOf(d.src), bs=Q.link[d.src]; return `<div class="dsrow ${d.src===hitSrc?'hit':''}" id="ds-${esc(d.src).replace(/[^A-Za-z0-9]/g,'_')}"><b>${esc(d.src)}</b><small>${esc(d.country)}${d.year?' · '+esc(d.year):''}</small>
      <span>${k?`${esc(k[0])} · <a href="${k[1]}" target="_blank" rel="noopener">request or download there ↗</a>`:'<i class="pill tbc">To confirm</i> holder and link not recorded yet'}</span>
      <small>Used by: ${d.inds.length} SDG ${d.inds.length===1?'value':'values'}${ex?' · GAIN example '+ex:''}${bs!=null?' · questionnaire in ID Questions':''}</small></div>`};
  const A=Q.datasets.filter(d=>HOLD[d.src]), C=Q.datasets.filter(d=>!HOLD[d.src]);
  $('drawer').innerHTML=`<button class="x" type="button" data-act="dsclose">Close ✕</button>
    <div><p class="eyebrow">Side resource, not a layer</p><h2 style="font-size:24px;margin-top:6px">Datasets</h2><p class="lnote" style="margin-top:6px">Every dataset behind a value, an example or a questionnaire, and where to get it. Reached from all three layers.</p></div>
    <div class="sech"><h3>Available elsewhere · ${A.length}</h3><span class="lnote">we point to the holder</span></div>${A.map(row).join('')}
    <div class="sech"><h3>Hosted by EGRISS · 0</h3></div><div class="dsrow"><span>Nothing yet.</span><small>A file appears here only when no one else hosts it and the producer has agreed.</small></div>
    <div class="sech"><h3>Location not recorded yet · ${C.length}</h3><span class="lnote">to fill in, then move up</span></div>${C.map(row).join('')}`;
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
    ?`<b>World</b><span class="sep">›</span><span>${esc(c.n)} selected</span><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${act('view','3d','Globe','chip',`aria-pressed="${view==='3d'}"`)}${act('view','2d','Flat map','chip',`aria-pressed="${view==='2d'}"`)}</span>`
    :`${act('world','','World','lk')}<span class="sep">›</span><b>${esc(c.n)}</b>${dots(gSel)}<span style="margin-left:auto">${act('world','','← Back to the world','lkbtn')}</span>`);
  initGlobe(); paintGlobe();
  if(hov&&!$('tip').hidden&&level==='world') $('tip').innerHTML=hoverCard(hov);
  const st=$('stage');
  if(level==='country'&&!st.classList.contains('country')&&!busy){ const T=targetFor(gSel); if(T){ Object.assign(G,T); draw() } st.classList.add('country') }
  if(level==='world'&&st.classList.contains('country')&&!busy){ st.classList.remove('country'); Object.assign(G,gBase()); draw() }
  if(level==='world') $('stfoot').innerHTML=`<div class="mleg" style="justify-content:center;margin-top:0">${layer==='gain'?'<span>number = GAIN examples in the country</span><span><i class="d" style="border:2.5px solid #4cc3c9"></i>bright part of the ring = share that use the Recommendations</span>':layer==='sdg'?'<span>number = SDG values for the country</span><span>ring colours = the goals those values belong to</span>':'<span>number = questionnaires mapped</span><span>circle = people displaced, coloured by main cause:</span>'+[1,2,6,7].map(k=>`<span><i class="d" style="background:${CAUSE_COL[k]}"></i>${CZ[k].toLowerCase()}</span>`).join('')}</div><p class="lnote" style="text-align:center">${view==='3d'?'Drag to turn. ':''}Point at a country to list everything it has; ${layer==='sdg'?'select it to go straight to its values':'select it to open its card'}.</p>`;
  else if(layer==='sdg'&&(!mapInd||mapInd==='__cause')&&subKeys(gSel).length&&!belowDone['auto'+gSel]){ mapInd=subKeys(gSel).includes('6.1.1')?'6.1.1':subKeys(gSel)[0]; belowDone['auto'+gSel]=1 }
  else if(layer==='idq'&&!mapInd&&Q.cpts[gSel]&&!belowDone['cz'+gSel]){ mapInd='__cause'; belowDone['cz'+gSel]=1 }
  $('panel').style.setProperty('--lc',LAYER[layer].col);
  $('panel').innerHTML=level==='world'?pWorld():layer==='gain'?pGain():layer==='sdg'?pSdg():pIdq();
  if(level==='country'){ paintMap(); renderMapFoot() }
  if(level==='world'&&layer==='gain') coverMap(fEx);
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
function fromHash(){ const [L,iso]=location.hash.slice(1).split('/'); if(LAYER[L]) layer=L; if(iso&&Q.ctry[iso]){ gSel=iso; level='country' } else level='world' }
window.addEventListener('hashchange',()=>{fromHash();render()});
fromHash(); render();

