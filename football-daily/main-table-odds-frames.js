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
  if(!window.FutureCodeOddsDomFrame?.draw)throw Error('Website PNG renderer မရသေးပါ။ Refresh လုပ်ပါ။');
  return window.FutureCodeOddsDomFrame.draw(rows,settings,part,total);
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
 const style=document.createElement('style');style.textContent='#mainTableOddsFrames{margin:22px 0;padding:24px;background:#f2f4f8;border:1px solid #aebac8;border-radius:14px;color:#142338}#mainTableOddsFrames h2{font-size:20px}#mainTableOddsFrames .tof-controls{display:flex;gap:15px;flex-wrap:wrap;margin:16px 0}#mainTableOddsFrames label{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#mainTableOddsFrames select,#mainTableOddsFrames button{font:inherit;padding:10px;border-radius:8px}#mainTableOddsFrames button{background:#173f79;color:white;border:0;cursor:pointer}#mainTableOddsFrames button.tof-zip{background:#245d42}#mainTableOddsFrames button:disabled{opacity:.55;cursor:wait}#mainTableOddsFrames [hidden]{display:none!important}#mainTableOddsFrames img{display:block;width:100%;max-width:1140px;margin:16px auto}#mainTableOddsFrames a{display:block;padding:12px;color:#17438c}';document.head.append(style);
 const el=id=>section.querySelector('#'+id);designs.forEach((d,i)=>el('tofDesign').add(new Option(d[1],String(i))));let busy=false;const urls=[];
 el('tofDesign').onchange=()=>{el('tofColourWrap').hidden=designs[Number(el('tofDesign').value)][0]!=='colour';};el('tofColour').onchange=()=>{el('tofCustom').hidden=el('tofColour').value!=='custom';};
 async function run(download){
  if(busy)return;
  const sheet=typeof loadedSheet!=='undefined'?loadedSheet:null;
  if(!sheet?.matches?.length){el('tofStatus').textContent='ပေါက်ကြေးစာရင်း မရသေးပါ။';return;}
  const leagues=new Set([...document.querySelectorAll('#oddsLeagueFilter input:checked')].map(c=>c.value));
  const list=sheet.matches.filter(m=>leagues.has(m.league));
  if(!list.length){el('tofStatus').textContent='အနည်းဆုံး လိဂ်တစ်ခု ရွေးပါ။';return;}
  const settings={design:designs[Number(el('tofDesign').value)],
    colour:el('tofColour').value==='custom'?el('tofCustom').value:el('tofColour').value,
    date:sheet.reportDate};
  const parts=split(list,el('tofSplit').value);
  busy=true;
  section.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);
  urls.forEach(URL.revokeObjectURL);urls.length=0;
  el('tofOutput').replaceChildren();
  const archive=download&&parts.length>1&&window.FutureCodeFrameZip?.Archive?
    new window.FutureCodeFrameZip.Archive():null;
  try{
    for(let i=0;i<parts.length;i++){
      el('tofStatus').textContent='PNG ပုံ '+(i+1)+'/'+parts.length+' ပြင်ဆင်နေသည်…';
      const canvas=await draw(parts[i],settings,i+1,parts.length);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(
        b=>b?.size?resolve(b):reject(Error('PNG ဖန်တီးမရပါ')),'image/png'));
      const url=URL.createObjectURL(blob);urls.push(url);
      const filename=settings.design[0]+'-odds-table-'+sheet.reportDate+'-'+(i+1)+'.png';
      const a=document.createElement('a');
      a.href=url;a.download=filename;
      a.textContent='⬇ PNG ပုံ '+(i+1)+' Download · '+parts[i].length+' ပွဲ';
      const im=document.createElement('img');
      im.src=url;im.alt=settings.design[1]+' ပေါက်ကြေးဇယား ပုံ '+(i+1);
      el('tofOutput').append(a,im);
      if(archive)await archive.add(filename,blob);
      else if(download){
        document.body.appendChild(a);a.click();el('tofOutput').prepend(a);
      }
    }
    if(archive){
      const url=URL.createObjectURL(archive.finish()),a=document.createElement('a');
      a.href=url;a.download=settings.design[0]+'-odds-table-'+sheet.reportDate+'.zip';
      a.textContent='⬇ ပုံ '+parts.length+' ပုံ PNG ZIP Download';
      el('tofOutput').prepend(a);urls.push(url);a.click();
    }
    el('tofStatus').textContent=download
      ?parts.length>1?'PNG '+parts.length+' ပုံပါ ZIP Download စတင်ပါပြီ။ ပုံတစ်ပုံချင်း Download လင့်ခ်တွေလည်း အောက်မှာရှိပါတယ်။':'PNG Download စတင်ပါပြီ။ မရောက်သေးရင် အောက်က PNG Download လင့်ခ်ကို နှိပ်ပါ။'
      :parts.length+' ပုံ ပြင်ဆင်ပြီးပါပြီ။ Download လင့်ခ်ကို နှိပ်ပါ။';
    if(!download)el('tofOutput').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    console.error('Main odds frame PNG failed',e);
    el('tofStatus').textContent='PNG မထွက်ပါ — '+(e?.message||e?.reason||e?.type||e?.name||String(e)||'Screenshot Error');
  }finally{
    busy=false;
    section.querySelectorAll('button,input,select').forEach(x=>x.disabled=false);
  }
 }

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
