"use strict";
/* Only the main odds page loads this script; reuse its verified sheet and filters. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!/^\/odds(?:\.html)?\/?$/.test(location.pathname))return;
 const W=1600,M=25,ROW=68,HEADER=108;
 const widths=[125,570,220,125,125,125,125,135],edges=[M];for(const w of widths)edges.push(edges.at(-1)+w);
 const designs=[['best','Best Your Choice','#1300a8'],['htet','Htet Ko','#145800'],["ggoal", "GGOAL", "#b58100", {"top": 0.166015625, "bottom": 0.052734375}],["hyper-goal", "Hyper Goal", "#986100", {"top": 0.12950450450450451, "bottom": 0.10191441441441441}],["kmm", "KMM", "#a50918", {"top": 0.10498046875, "bottom": 0.06494140625}],["special-one", "Special One", "#236c87", {"top": 0.07331378299120235, "bottom": 0.03714565004887586}],["the-freedom", "The Freedom", "#8b6d24", {"top": 0.0, "bottom": 0.0}],["bcf", "BCF", "#073682", {"top": 0.0927734375, "bottom": 0.072265625}],["final-goal", "Final Goal", "#876013", {"top": 0.14857142857142858, "bottom": 0.037142857142857144}],["ko-chan", "Ko Chan", "#0d1745", {"top": 0.13464526152252718, "bottom": 0.0}],["team-pmm", "Team PMM", "#5e0814", {"top": 0.15625, "bottom": 0.11865234375}],["thuta", "THUTA", "#115136", {"top": 0.1318359375, "bottom": 0.0966796875}],["ymc", "YMC", "#16113d", {"top": 0.160481444332999, "bottom": 0.11735205616850551}],["ko-tut-pi", "ကိုတွတ်ပီ", "#9a1114", {"top": 0.14316239316239315, "bottom": 0.14262820512820512}],["khin-khin-htar", "ခင်ခင်ထား နှင့် လက်ရုံးလေးများ", "#77005b", {"top": 0.1867572156196944, "bottom": 0.13412563667232597}],['colour','Colour Background Change','#a41625']];
 const names={'Premier League':'အင်္ဂလန် ပရီးမီးယားလိဂ်','Serie A':'အီတလီ စီးရီးအေ','La Liga':'စပိန် လာလီဂါ','Bundesliga':'ဂျာမနီ ဘွန်ဒက်စ်လီဂါ','Ligue 1':'ပြင်သစ် လီဂူးဝမ်း'};
 const logos={'Premier League':'https://crests.football-data.org/PL.png','Serie A':'https://crests.football-data.org/SA.png','La Liga':'https://crests.football-data.org/PD.png','Bundesliga':'https://crests.football-data.org/BL1.png','Ligue 1':'https://crests.football-data.org/FL1.png'};
 const localLeagues={'Premier League':'pl','Serie A':'sa','La Liga':'pd','Bundesliga':'bl','Ligue 1':'fl'};
 const split=(rows,mode)=>rows.length>1&&(mode==='two'||mode==='auto'&&rows.length>12)?[rows.slice(0,Math.ceil(rows.length/2)),rows.slice(Math.ceil(rows.length/2))]:[rows];
 const assetCache=new Map();function asset(src){if(!assetCache.has(src))assetCache.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Frame banner ပုံ ရယူမရပါ'));im.src=src;}));return assetCache.get(src);}
 function dark(hex,f){return '#'+hex.slice(1).match(/../g).map(s=>Math.round(parseInt(s,16)*f).toString(16).padStart(2,'0')).join('');}
 function grouped(rows){const map=new Map();for(const row of rows){if(!map.has(row.league))map.set(row.league,[]);map.get(row.league).push(row);}return [...map];}
 async function draw(rows,settings,part,total){
  const kit=window.FutureCodeCanvasKit;if(!kit)throw Error('PNG module မရသေးပါ');await kit.fonts();await kit.preloadImages(rows.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl,localLeagues[m.league]?null:logos[m.league]]).filter(Boolean));const leagueImages=new Map();await Promise.all([...new Set(rows.map(m=>m.league))].filter(l=>localLeagues[l]).map(async l=>leagueImages.set(l,await asset('./assets/table-odds-frames/league-'+localLeagues[l]+'.png'))));
  const {design,colour,date}=settings,custom=design[0]==='colour',theme=custom?colour:design[2];
  const artwork=design[3]?await asset('./assets/table-odds-frames/'+design[0]+'-frame.jpg'):null;
  const top=custom||artwork?null:await asset('./assets/table-odds-frames/'+design[0]+'-top.jpg'),bottom=custom||artwork?null:await asset('./assets/table-odds-frames/'+design[0]+'-bottom.jpg');
  const th=artwork?Math.round(artwork.height*design[3].top*W/artwork.width):top?Math.round(top.height*W/top.width):0,bh=artwork?Math.round(artwork.height*design[3].bottom*W/artwork.width):bottom?Math.round(bottom.height*W/bottom.width):0;const leagues=grouped(rows);const H=th+76+leagues.length*(HEADER+16)+rows.length*ROW+bh+24;
  const {canvas,ctx}=kit.create(W,H);const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,dark(theme,.48));bg.addColorStop(.5,theme);bg.addColorStop(1,dark(theme,.7));kit.fill(ctx,0,0,W,H,bg);
  if(artwork){const st=artwork.height*design[3].top,sb=artwork.height*design[3].bottom;ctx.drawImage(artwork,0,st,artwork.width,artwork.height-st-sb,0,th,W,H-th-bh);if(th)ctx.drawImage(artwork,0,0,artwork.width,st,0,0,W,th);if(bh)ctx.drawImage(artwork,0,artwork.height-sb,artwork.width,sb,0,H-bh,W,bh);}
  const text=(s,x,y,size=26,c='#fff',bold=true,align='center',max)=>kit.text(ctx,s??'',x,y,size,c,bold,align,max);
  if(top){ctx.drawImage(top,0,0,W,th);if(design[0]==='best'){kit.fill(ctx,680/1200*W,207/1200*W,165/1200*W,41/1200*W,'#fff',24);text(date,762.5/1200*W,228/1200*W,25,'#061347');}}
  let y=th+38;if(artwork)kit.fill(ctx,W/2-320,th+8,640,60,dark(theme,.7),12);text(date,W/2,y,27,'#ffffff');y=th+76;
  for(const [league,items] of leagues){
   const grad=ctx.createLinearGradient(M,y,W-M,y+HEADER);grad.addColorStop(0,theme);grad.addColorStop(1,dark(theme,.65));kit.fill(ctx,M,y,W-2*M,HEADER,grad,14);
   kit.fill(ctx,M,y,125,HEADER,'#fff',14);if(leagueImages.has(league))ctx.drawImage(leagueImages.get(league),M+12,y+12,100,76);else kit.crest(ctx,logos[league],M+27,y+16,72,league);
   text(names[league]||league,edges[1]+widths[1]/2,y+HEADER/2,29,'#fff',true,'center',widths[1]-20);text('ကြေးပေးအသင်း',edges[2]+widths[2]/2,y+HEADER/2,26,'#fff',true,'center',widths[2]-12);
   for(const [col,label] of [[3,'ဘော်ဒီကြေး'],[5,'ဂိုးပေါင်းကြေး']]){text(label,edges[col]+125,y+33,28);for(let j=0;j<2;j++){if(j===0)kit.fill(ctx,edges[col+j]+5,y+65,widths[col+j]-10,32,'#eeeeed',16);text(j===0?'မူလ':'ယခု',edges[col+j]+widths[col+j]/2,y+81,23,j===0?'#151515':'#fff');}}
   text('အင်တာနက်',edges[7]+widths[7]/2,y+HEADER/2,23,'#fff',true,'center',widths[7]-8);y+=HEADER;
   for(const m of items){
    kit.fill(ctx,M,y,W-2*M,ROW,'#fff');kit.fill(ctx,edges[2],y,widths[2],ROW,'#e4e4e4');ctx.strokeStyle='#c8c8c8';ctx.lineWidth=1;ctx.strokeRect(M,y,W-2*M,ROW);for(const x of edges.slice(1,-1)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+ROW);ctx.stroke();}
    text(m.kickoff||m.kickoffDisplay||'',edges[0]+widths[0]/2,y+ROW/2,23,'#111',true,'center',widths[0]-10);
    const x=edges[1];text(m.home,x+217,y+ROW/2,26,'#111',true,'right',200);kit.crest(ctx,m.homeCrestUrl,x+228,y+13,42,m.home);text('နှင့်',x+291,y+ROW/2,22,'#111');kit.crest(ctx,m.awayCrestUrl,x+311,y+13,42,m.away);text(m.away,x+364,y+ROW/2,26,'#111',true,'left',195);
    text(m.upperTeam||'',edges[2]+widths[2]/2,y+ROW/2,25,'#111',true,'center',widths[2]-14);
    const quotes=[m.bodyOdds,m.currentBodyOdds,m.goalTotalOdds,m.currentGoalTotalOdds,m.pdfLastColumn];for(let i=0;i<quotes.length;i++)text(quotes[i]??'',edges[i+3]+widths[i+3]/2,y+ROW/2,i===4?28:31,'#111',true,'center',widths[i+3]-12);y+=ROW;
   }y+=16;
  }
  if(bottom)ctx.drawImage(bottom,0,H-bh,W,bh);return canvas;
 }

 // Frame ZIP is main-only and intentionally contains PNGs, not an extra merged image.
 // Encode and append each canvas before drawing the next to limit peak memory.
 async function zipFrames(rows,{date,colour,mode='auto'},onProgress){
  if(!Array.isArray(rows)||!rows.length)throw Error('ZIP အတွက် ပေါက်ကြေးပွဲစာရင်း မရှိပါ။');
  if(!window.FutureCodeFrameZip?.Archive)throw Error('ZIP module မရသေးပါ။ စာမျက်နှာကို Refresh လုပ်ပါ။');
  const parts=split(rows,mode),archive=new window.FutureCodeFrameZip.Archive();
  const total=designs.length*parts.length;let done=0;
  for(const design of designs){
   for(let i=0;i<parts.length;i++){
    if(onProgress)onProgress({done,total,frame:design[1],part:i+1,parts:parts.length});
    const canvas=await draw(parts[i],{design,colour,date},i+1,parts.length);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?.size?resolve(b):reject(Error('PNG ဖန်တီးမရပါ')),'image/png'));
    await archive.add(design[0]+'/'+design[0]+'-odds-'+date+'-'+String(i+1).padStart(2,'0')+'.png',blob);
    done++;
  }
  }
  if(onProgress)onProgress({done,total,finished:true});
  return {blob:archive.finish(),fileCount:done,partCount:parts.length};
 }

 window.FutureCodeTableOddsFrames={split,draw,designs,zipFrames};
 function init(){const actions=document.querySelector('.odds-export-actions');if(!actions)return;
 const section=document.createElement('section');section.id='mainTableOddsFrames';section.innerHTML=`<h2>Frame အလိုက် ပေါက်ကြေးဇယား PNG Download</h2><p>အပေါ်က လိဂ်ရွေးချယ်မှုအတိုင်း ထုတ်ပေးပါမည်။ မူလကြေးနှင့် ယခုကြေးကို တစ်ဇယားတည်းတွင် ပြပါမည်။</p><div class="tof-controls"><label>Frame <select id="tofDesign"></select></label><label id="tofColourWrap" hidden>Colour Theme <select id="tofColour"><option value="#a41625">အနီ</option><option value="#132ab0">အပြာ</option><option value="#196514">အစိမ်း</option><option value="#8b6415">ရွှေရောင်</option><option value="#6a2b97">ခရမ်း</option><option value="custom">စိတ်ကြိုက်</option></select><input type="color" id="tofCustom" value="#a41625" aria-label="စိတ်ကြိုက်အရောင်" hidden></label><label>ပုံခွဲရန် <select id="tofSplit"><option value="auto">ပွဲများလျှင် တစ်ဝက်စီ ၂ ပုံ</option><option value="two">တစ်ဝက်စီ ၂ ပုံ</option><option value="one">တစ်ပုံတည်း</option></select></label></div><div class="tof-controls"><button id="tofPreview" type="button">နမူနာကြည့်မယ်</button><button id="tofSave" type="button">Frame PNG Download</button><button id="tofZip" type="button" class="tof-zip">⬇ Frame အားလုံး PNG ZIP Download</button></div><p>ZIP ထဲမှာ Frame ၁၆ မျိုးလုံး ပါဝင်ပြီး ရွေးထားသည့် လိဂ်နှင့် ပုံခွဲပုံအတိုင်း PNG တစ်ပုံချင်း ပါဝင်ပါမည်။</p><p id="tofStatus" role="status" aria-live="polite">လိဂ်ရွေးပြီး Frame ကို ရွေးပါ။</p><div id="tofOutput"></div>`;actions.after(section);
 const style=document.createElement('style');style.textContent='#mainTableOddsFrames{margin:22px 0;padding:24px;background:#f2f4f8;border:1px solid #aebac8;border-radius:14px;color:#142338}#mainTableOddsFrames h2{font-size:20px}#mainTableOddsFrames .tof-controls{display:flex;gap:15px;flex-wrap:wrap;margin:16px 0}#mainTableOddsFrames label{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#mainTableOddsFrames select,#mainTableOddsFrames button{font:inherit;padding:10px;border-radius:8px}#mainTableOddsFrames button{background:#173f79;color:white;border:0;cursor:pointer}#mainTableOddsFrames button.tof-zip{background:#245d42}#mainTableOddsFrames button:disabled{opacity:.55;cursor:wait}#mainTableOddsFrames [hidden]{display:none!important}#mainTableOddsFrames img{display:block;width:100%;max-width:640px;margin:16px auto}#mainTableOddsFrames a{display:block;padding:12px;color:#17438c}';document.head.append(style);
 const el=id=>section.querySelector('#'+id);designs.forEach((d,i)=>el('tofDesign').add(new Option(d[1],String(i))));let busy=false;const urls=[];
 el('tofDesign').onchange=()=>{el('tofColourWrap').hidden=designs[Number(el('tofDesign').value)][0]!=='colour';};el('tofColour').onchange=()=>{el('tofCustom').hidden=el('tofColour').value!=='custom';};
 async function run(download){if(busy)return;const sheet=typeof loadedSheet!=='undefined'?loadedSheet:null;if(!sheet?.matches?.length){el('tofStatus').textContent='ပေါက်ကြေးစာရင်း မရသေးပါ။';return;}const checks=[...document.querySelectorAll('#oddsLeagueFilter input:checked')];const leagues=new Set(checks.map(c=>c.value));const list=sheet.matches.filter(m=>leagues.has(m.league));if(!list.length){el('tofStatus').textContent='အနည်းဆုံး လိဂ်တစ်ခု ရွေးပါ။';return;}const settings={design:designs[Number(el('tofDesign').value)],colour:el('tofColour').value==='custom'?el('tofCustom').value:el('tofColour').value,date:sheet.reportDate};const parts=split(list,el('tofSplit').value);busy=true;section.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);urls.forEach(URL.revokeObjectURL);urls.length=0;el('tofOutput').replaceChildren();try{for(let i=0;i<parts.length;i++){el('tofStatus').textContent=`ပုံ ${i+1}/${parts.length} ဖန်တီးနေသည်…`;const canvas=await draw(parts[i],settings,i+1,parts.length);const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG ဖန်တီးမရပါ')),'image/png'));const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=settings.design[0]+'-odds-table-'+sheet.reportDate+'-'+(i+1)+'.png';a.textContent=`⬇ ပုံ ${i+1} Download · ${parts[i].length} ပွဲ`;const im=document.createElement('img');im.src=url;im.alt=settings.design[1]+' ပေါက်ကြေးဇယား ပုံ '+(i+1);el('tofOutput').append(a,im);if(download){if(parts.length===1)a.click();}}el('tofStatus').textContent=`${list.length} ပွဲ · ${parts.map(p=>p.length+' ပွဲ').join(' / ')} · ${parts.length} ပုံ အဆင်သင့်ဖြစ်ပါပြီ။${parts.length>1?' PNG Download ကို တစ်ပုံချင်း နှိပ်ယူပါ။':''}`;}catch(e){el('tofStatus').textContent=e.message;}finally{busy=false;section.querySelectorAll('button,input,select').forEach(x=>x.disabled=false);}}

 async function runAllZip(){
  if(busy)return;
  const sheet=typeof loadedSheet!=='undefined'?loadedSheet:null;
  if(!sheet?.matches?.length){el('tofStatus').textContent='ပေါက်ကြေးစာရင်း မရသေးပါ။';return;}
  const leagues=new Set([...document.querySelectorAll('#oddsLeagueFilter input:checked')].map(c=>c.value));
  const rows=sheet.matches.filter(m=>leagues.has(m.league));
  if(!rows.length){el('tofStatus').textContent='အနည်းဆုံး လိဂ်တစ်ခု ရွေးပါ။';return;}
  const colour=el('tofColour').value==='custom'?el('tofCustom').value:el('tofColour').value;
  busy=true;section.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);
  try{
   const result=await zipFrames(rows,{date:sheet.reportDate,colour,mode:el('tofSplit').value},p=>{
    el('tofStatus').textContent=p.finished?'ZIP ဖိုင် အပြီးသတ်နေပါပြီ…':`Frame ${p.frame} · ပုံ ${p.part}/${p.parts} · ${p.done+1}/${p.total} PNG ဖန်တီးနေသည်…`;
   });
   const url=URL.createObjectURL(result.blob),link=document.createElement('a');
   link.href=url;link.download='all-odds-frames-'+sheet.reportDate+'.zip';
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   el('tofStatus').textContent=`Frame ${designs.length} မျိုး၊ PNG ${result.fileCount} ပုံ ပါတဲ့ ZIP Download စတင်ပါပြီ။`;
  }catch(e){console.error('Frame ZIP export failed',e);el('tofStatus').textContent='ZIP ဖန်တီးမရပါ — '+(e?.message||'ပြန်စမ်းကြည့်ပါ');}
  finally{busy=false;section.querySelectorAll('button,input,select').forEach(x=>x.disabled=false);}
 }
 el('tofPreview').onclick=()=>run(false);el('tofSave').onclick=()=>run(true);el('tofZip').onclick=runAllZip;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
