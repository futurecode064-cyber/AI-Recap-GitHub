"use strict";
/* Main website only: clean Myanmar word-wrapped Preview V2 + Myanmar odds strip. */
(function(){
 if(!/^\/(?:index\.html)?$/.test(location.pathname))return;
 const root=document.getElementById("fcPreviewV2");if(!root)return;
 const el=id=>document.getElementById(id);
 const create=(tag,klass,content)=>{const n=document.createElement(tag);if(klass)n.className=klass;if(content!==undefined)n.textContent=content;return n;};
 let items=[],date="",selected=new Set(),busy=false,wrapFrame=0;
 const clean=s=>String(s??"").replace(/\*\*|&#x20;|&nbsp;/g,"").normalize("NFC").replace(/\r\n?/g,"\n").replace(/[ \t]+/g," ").replace(/\n[ \t]+/g,"\n").trim();
 const clock=m=>window.FutureCodeTime?.clock?.(m)||m.kickoff||m.sourceKickoff||"—";
 function summary(m){return clean(m.previewV2Summary)||(m.previewV2EditorialStatus?"":"ဤပွဲအတွက် အတိုချုပ်စာကို အတည်ပြုနေဆဲ ဖြစ်ပါသည်။");}
 function choice(m){
  if(m.previewV2Selection && [m.homeDisplay,m.awayDisplay].includes(m.previewV2Selection))return m.previewV2Selection;
  const last=clean(m.dailyPreviewText).slice(-260);
  for(const side of ["home","away"]){
   const name=m[side+"Display"]||m[side];
   if(name&&(last.includes(name+"ကို ရွေး")||last.includes(name+"အား ရွေး")||last.includes(name+"ကို ရွေးချယ်")))return name;
   const short=name?.split(/\s+/u).at(-1);
   if(short&&short.length>=4&&(last.includes(short+"ကို ရွေး")||last.includes(short+"အား ရွေး")))return name;
  }
  return "အတည်မပြုရသေး";
 }
 function market(m){
  const p=m.myanmarOdds||{},v=x=>String(x??"").normalize("NFC").trim()||"—";
  return {upper:v(p.upperTeam),body:v(p.bodyOdds),goal:v(p.goalTotalOdds),currentBody:v(p.currentBodyOdds),currentGoal:v(p.currentGoalTotalOdds)};
 }
 const media=m=>m.previewV2Media?.url||"",caption=m=>m.previewV2Media?.caption||"အသင်းလိုဂိုဖြင့် ပွဲကြိုမြင်ကွင်း";
 function crest(m,side){
  const i=create("img","fc-v2-logo");i.src=m[side+"CrestUrl"]||"";i.alt=m[side+"Display"]||m[side];i.loading="lazy";i.onerror=()=>i.style.visibility="hidden";return i;
 }
 function quoteBox(kind,label,value,current){
  const box=create("div","fc-v2-quote fc-v2-"+kind);
  box.append(create("small","",label),create("strong","",value));
  if(current!=="—")box.append(create("span","","ယခု "+current));
  else box.append(create("span","","မူလကြေး"));
  return box;
 }
 function card(m,i){
  const c=create("article","fc-v2-card"),head=create("header","fc-v2-head"),grid=create("div","fc-v2-grid");
  head.append(create("strong","",String(i+1).padStart(2,"0")+" · "+(m.leagueDisplay||m.league)),create("span","",clock(m)));
  const photo=create("div","fc-v2-media"),url=media(m);
  if(/^https:\/\//.test(url)){
   const img=create("img","fc-v2-photo");img.src=url;img.loading="lazy";img.crossOrigin="anonymous";img.alt=caption(m);img.onerror=()=>img.remove();photo.append(img);
  }
  const logos=create("div","fc-v2-team-photos");logos.append(crest(m,"home"),create("b","","VS"),crest(m,"away"));photo.append(logos,create("small","",caption(m)));
  const desc=create("div","fc-v2-desc"),p=create("p","",summary(m));p.dataset.rawText=summary(m);
  desc.append(create("h3","",(m.homeDisplay||m.home)+" နှင့် "+(m.awayDisplay||m.away)),p);
  const selectedTeam=create("div","fc-v2-pick");selectedTeam.append(create("span","","ရွေးချယ်မှု"),create("strong","",choice(m)));desc.append(selectedTeam);
  grid.append(photo,desc);
  const odd=market(m),ribbon=create("div","fc-v2-ribbon");
  const home=create("div","fc-v2-odds-team fc-v2-home");home.append(crest(m,"home"),create("strong","",m.homeDisplay||m.home));
  const away=create("div","fc-v2-odds-team fc-v2-away");away.append(crest(m,"away"),create("strong","",m.awayDisplay||m.away));
  const time=create("div","fc-v2-time");time.append(create("strong","",clock(m)));
  ribbon.append(home,quoteBox("goal","ဂိုးပေါင်းကြေး",odd.goal,odd.currentGoal),time,quoteBox("body","ဘော်ဒီကြေး",odd.body,odd.currentBody),away);
  const pick=create("label","fc-v2-check"),input=document.createElement("input");input.type="checkbox";input.checked=selected.has(m.fixtureId);
  input.onchange=()=>{if(input.checked)selected.add(m.fixtureId);else selected.delete(m.fixtureId);el("fcV2Selected").textContent=selected.size+" ပွဲ ရွေးထားသည်";};
  pick.append(input,create("span","","Download အတွက် ရွေးရန်"));
  c.append(head,grid,ribbon,pick);return c;
 }
 const measureCanvas=document.createElement("canvas"),measureCtx=measureCanvas.getContext("2d");
 function graphemes(value){
  if(typeof Intl.Segmenter==="function")return Array.from(new Intl.Segmenter("my",{granularity:"grapheme"}).segment(value),x=>x.segment);
  return Array.from(value);
 }
 function wordTokens(value){
  if(typeof Intl.Segmenter==="function")return Array.from(new Intl.Segmenter("my",{granularity:"word"}).segment(value),x=>x.segment);
  return graphemes(value);
 }
 function wrapMyanmar(value,maxWidth,measure){
  const output=[];
  for(const paragraph of String(value||"").split(/\n+/u).map(x=>x.trim()).filter(Boolean)){
   let line="";
   const push=()=>{if(line.trim())output.push(line.trimEnd());line="";};
   for(const token of wordTokens(paragraph)){
    if(/^\s+$/u.test(token)){if(line)line+=token;continue;}
    const punctuation=/^[၊။!?….,;:၊၊]+$/u.test(token);
    if(line&&measure(line+token)>maxWidth&& !punctuation){push();line=token.trimStart();}
    else line+=token;
    if(measure(line)>maxWidth&&line){
     const gs=graphemes(line);line="";
     for(const g of gs){if(line&&measure(line+g)>maxWidth)push();line+=g;}
    }
   }
   push();output.push("");
  }
  if(output.at(-1)==="")output.pop();
  return output;
 }
 function wrapDescription(p){
  const width=p.clientWidth;if(width<80)return;
  const style=getComputedStyle(p);
  measureCtx.font=style.fontWeight+" "+style.fontSize+" "+style.fontFamily;
  p.textContent=wrapMyanmar(p.dataset.rawText||p.textContent,width-2,s=>measureCtx.measureText(s).width).join("\n");
 }
 function scheduleTextWrap(){
  if(wrapFrame)cancelAnimationFrame(wrapFrame);
  wrapFrame=requestAnimationFrame(()=>{
   wrapFrame=0;
   if(document.body.dataset.fcMainView!=="previewV2")return;
   root.querySelectorAll(".fc-v2-desc p[data-raw-text]").forEach(wrapDescription);
  });
 }
 function applyFrameTheme(){
  const select=el("fcV2Frame"),api=window.FutureCodeProfessionalFrames;
  const frame=select?.value&&select.value!=="none"?api?.getFrame?.(select.value):null;
  root.style.setProperty("--fc-v2-accent",/^#[\da-f]{6}$/i.test(frame?.color||"")?frame.color:"#07527a");
  scheduleTextWrap();
 }
 function cards(){
  const list=el("fcV2Cards"),league=el("fcV2League").value;list.replaceChildren();
  items.forEach((m,i)=>{if(league==="all"||m.league===league)list.append(card(m,i));});
  el("fcV2Count").textContent=items.length+" ပွဲ";
  el("fcV2Selected").textContent=selected.size+" ပွဲ ရွေးထားသည်";
  scheduleTextWrap();
 }
 async function load(){
  const f=window.FootballData?.fetch||fetch,res=await f(new URL("./data/today.json",document.baseURI),{cache:"no-store"});
  if(!res.ok)throw Error("Published data မရပါ");
  const j=await res.json();if(!j.published||!Array.isArray(j.matches))throw Error("ပွဲကြိုဒေတာ မရပါ");
  const eligible=j.matches.filter(m=>m.fixtureId&&m.dailyPreviewText&&m.myanmarOdds);
  const missing=eligible.filter(m=>!clean(m.previewV2Summary)||m.previewV2EditorialDate!==j.reportDate||m.previewV2SourcePreviewDate!==j.reportDate||m.previewV2FormatVersion!=="2.1"||![m.homeDisplay,m.awayDisplay].includes(m.previewV2Selection));
  if(missing.length)throw Error("Version 2 အတိုချုပ်/ရွေးချယ်မှု အတည်မပြုရသေးသောပွဲ "+missing.length+" ပွဲရှိပါတယ်။ အချက်အလက်ကို ပြန်စစ်ရန် လိုအပ်ပါတယ်။");
  items=eligible;date=j.reportDate;
  const selector=el("fcV2League"),prior=selector.value;selector.replaceChildren(new Option("လိဂ်အားလုံး","all"));
  [...new Set(items.map(m=>m.league))].forEach(k=>selector.add(new Option(items.find(m=>m.league===k)?.leagueDisplay||k,k)));
  selector.value=[...selector.options].some(x=>x.value===prior)?prior:"all";el("fcV2Date").textContent=date;cards();
 }
 const cache=new Map();
 function image(src){
  if(!src)return Promise.resolve(null);
  let resolvedUrl;
  try{
   const mapped=window.FutureCodeMainLogoAssets?.imageUrl(src)||window.FutureCodeBrandExportData?.imageUrl(src)||src;
   const parsed=new URL(mapped,document.baseURI);
   if(parsed.protocol!=="https:"&&parsed.origin!==location.origin)return Promise.resolve(null);
   resolvedUrl=parsed.href;
  }catch(_){return Promise.resolve(null)}
  if(cache.has(resolvedUrl))return cache.get(resolvedUrl);
  const p=new Promise(resolve=>{const im=new Image();let done=false;const doneOnce=v=>{if(done)return;done=true;clearTimeout(timeout);resolve(v);};
   const timeout=setTimeout(()=>doneOnce(null),6500);
   if(resolvedUrl.startsWith("https://"))im.crossOrigin="anonymous";
   im.onload=()=>doneOnce(im);im.onerror=()=>doneOnce(null);im.src=resolvedUrl;
  });cache.set(resolvedUrl,p);return p;
 }
 function cover(ctx,img,x,y,w,h){const s=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/s,sh=h/s;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h);}
 function contain(ctx,img,x,y,w,h){const s=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*s,dh=img.naturalHeight*s;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
 function fitMyanmar(ctx,value,x,y,maxWidth,size,weight=800,min=13){
  const v=String(value??"").normalize("NFC")||"—";
  for(let n=size;n>=min;n--){ctx.font=weight+" "+n+"px \"FCMyanmar\",sans-serif";if(ctx.measureText(v).width<=maxWidth||n===min)break;}
  ctx.fillText(v,x,y,maxWidth);
 }
 function shade(hex,factor){
  const rgb=hex.slice(1).match(/../g).map(x=>Math.max(0,Math.min(255,Math.round(parseInt(x,16)*factor))));
  return "#"+rgb.map(x=>x.toString(16).padStart(2,"0")).join("");
 }
 async function render(m,options={}){
  if(!m?.fixtureId)throw Error("Match not found");
  if(!clean(m.previewV2Summary)||!m.previewV2Selection)throw Error("Version 2 editorial missing for "+m.fixtureId);
  await window.FutureCodeCanvasKit?.fonts?.();
  await document.fonts?.load('500 18px "FCMyanmar"');
  const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=850;
  const c=canvas.getContext("2d");if(!c)throw Error("Canvas မရပါ");
  const col=/^#[\da-f]{6}$/i.test(options.color||"")?options.color:"#07527a",deep=shade(col,.78);
  c.fillStyle="#e8f0f5";c.fillRect(0,0,1200,850);
  c.fillStyle=col;c.fillRect(0,0,1200,67);c.textAlign="center";c.textBaseline="middle";c.fillStyle="#fff";
  fitMyanmar(c,m.leagueDisplay||m.league,600,35,1010,25,800,15);
  const leagueUrl=window.FutureCodeMainLogoAssets?.leagueCrest(m.league)||window.FutureCodeBrandExportData?.leagueCrest?.(m.league)||"";
  const [h,a,l,p,stadium]=await Promise.all([image(m.homeCrestUrl),image(m.awayCrestUrl),image(leagueUrl),image(media(m)),image(new URL("./assets/preview-stadium-night.jpg",document.baseURI).href)]);
  if(!h||!a)throw Error("အသင်း Logo မပြည့်စုံပါ — "+(m.homeDisplay||m.home)+" / "+(m.awayDisplay||m.away)+"။ Logo မပြည့်ဘဲ Download မထုတ်ပါ။");
  if(!l)throw Error("လိဂ် Logo မရရှိပါ — "+(m.leagueDisplay||m.league)+"။ လိဂ် Logo မပြည့်ဘဲ Download မထုတ်ပါ။");
  contain(c,l,24,10,48,48);
  c.save();c.beginPath();c.roundRect(20,84,435,492,18);c.clip();
  if(stadium)cover(c,stadium,20,84,435,492);else{c.fillStyle="#18415f";c.fillRect(20,84,435,492);}
  if(p)cover(c,p,20,84,435,492);
  c.fillStyle="rgba(4,18,34,.67)";c.fillRect(20,409,435,167);
  if(h)contain(c,h,48,422,145,133);if(a)contain(c,a,277,422,145,133);
  c.fillStyle="white";c.font="900 29px Arial";c.fillText("VS",235,493);c.restore();
  c.fillStyle="#486176";c.font='500 14px "FCMyanmar",sans-serif';c.fillText(caption(m),238,600,435);
  c.textAlign="left";c.textBaseline="alphabetic";c.fillStyle="#174061";
  fitMyanmar(c,(m.homeDisplay||m.home)+" နှင့် "+(m.awayDisplay||m.away),482,126,690,25,800,15);
  // Four editorial sentences: both clubs, decisive matchup, then selection.
  // Never silently cut off a downloaded Burmese paragraph.
  c.fillStyle="#293e4b";c.textBaseline="middle";
  const upperY=181,lowerY=492,descriptionWidth=683;
  let bodyLines=[],lineHeight=0,descriptionHeight=Infinity;
  for(const fontSize of [18,17,16,15,14]){
   c.font='500 '+fontSize+'px "FCMyanmar",sans-serif';
   const candidate=wrapMyanmar(summary(m),descriptionWidth,s=>c.measureText(s).width);
   const candidateHeight=candidate.reduce((height,line)=>height+(line?Math.round(fontSize*1.72):8),0);
   if(candidateHeight<=lowerY-upperY){bodyLines=candidate;lineHeight=Math.round(fontSize*1.72);descriptionHeight=candidateHeight;break;}
  }
  if(!bodyLines.length||descriptionHeight>lowerY-upperY)
   throw Error("ပွဲကြိုစာသား အပြည့်အစုံကို PNG ထဲ ထည့်မရပါ — "+(m.homeDisplay||m.home)+" / "+(m.awayDisplay||m.away));
  let y=upperY;
  for(const line of bodyLines){
   if(!line){y+=8;continue;}
   c.fillText(line,482,y,descriptionWidth);y+=lineHeight;
  }
  c.fillStyle=col;c.fillRect(475,522,705,74);c.fillStyle="#fff";c.textAlign="left";c.textBaseline="middle";
  fitMyanmar(c,"ရွေးချယ်မှု",495,551,140,18,800,13);
  c.textAlign="center";fitMyanmar(c,choice(m),830,560,500,24,900,14);
  const odd=market(m),rowY=625,rowH=200;
  c.fillStyle="#f8fbfd";c.fillRect(15,rowY,1170,rowH);c.strokeStyle=col;c.lineWidth=6;c.strokeRect(18,rowY+3,1164,rowH-6);
  c.fillStyle="#f1f5f8";c.fillRect(28,rowY+13,294,rowH-26);c.fillRect(878,rowY+13,294,rowH-26);
  if(h)contain(c,h,48,rowY+51,84,92);
  if(a)contain(c,a,1068,rowY+51,84,92);
  c.fillStyle="#153c5d";c.textAlign="center";c.textBaseline="middle";
  fitMyanmar(c,m.homeDisplay||m.home,220,rowY+100,160,22,900,12);
  fitMyanmar(c,m.awayDisplay||m.away,978,rowY+100,160,22,900,12);
  function quote(x,label,value,current){
   c.fillStyle=col;c.fillRect(x,rowY+28,174,144);
   c.fillStyle="#fff";c.textAlign="center";c.textBaseline="middle";
   fitMyanmar(c,label,x+87,rowY+53,160,16,800,12);
   c.font='900 26px "FCMyanmar",sans-serif';c.fillText(value,x+87,rowY+98,160);
   c.font='650 12px "FCMyanmar",sans-serif';c.fillText(current!=="—"?"ယခု "+current:"မူလကြေး",x+87,rowY+145,160);
  }
  quote(340,"ဂိုးပေါင်းကြေး",odd.goal,odd.currentGoal);
  quote(686,"ဘော်ဒီကြေး",odd.body,odd.currentBody);
  c.fillStyle="#fff";c.strokeStyle="#cbd6de";c.lineWidth=2;c.fillRect(522,rowY+28,156,144);c.strokeRect(522,rowY+28,156,144);
  c.fillStyle="#153c5d";c.textAlign="center";c.textBaseline="middle";c.font="900 21px Arial,sans-serif";c.fillText(clock(m),600,rowY+100,145);
  return canvas;
 }
 const canvasBlob=canvas=>new Promise((ok,bad)=>canvas.toBlob(b=>b?.size?ok(b):bad(Error("PNG မထွက်ပါ")),"image/png"));
 function save(blob,name){const url=URL.createObjectURL(blob),a=create("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 async function exportRows(amount,zip=false){
  if(busy)return;busy=true;const status=el("fcV2Status");
  try{
   const checked=items.filter(m=>selected.has(m.fixtureId)),rows=(checked.length?checked:items).slice(0,amount||items.length);
   if(!rows.length)throw Error("ပွဲရွေးထားခြင်းမရှိပါ");status.textContent=rows.length+" ပွဲ PNG ပြင်ဆင်နေပါသည်";
   const chosen=el("fcV2Frame")?.value||"none",api=window.FutureCodeProfessionalFrames,frame=chosen!=="none"?api?.getFrame?.(chosen):null;
   const makeCombined=async chunk=>{
    const canvases=[];
    for(const m of chunk)canvases.push(await render(m,{color:frame?.color}));
    const width=Math.max(...canvases.map(x=>x.width)),height=canvases.reduce((v,x)=>v+x.height,0)+(canvases.length-1)*12;
    if(height>32767||height*width>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်");
    const out=document.createElement("canvas");out.width=width;out.height=height;
    const cx=out.getContext("2d");cx.fillStyle="#e3ecf2";cx.fillRect(0,0,width,height);
    let y=0;for(const c of canvases){cx.drawImage(c,(width-c.width)/2,y);y+=c.height+12;}
    // Group cards first, then apply the chosen frame exactly once.
    return chosen!=="none"&&api?.wrap?api.wrap(out,"previewsV2","pro:"+chosen):out;
   };
   if(zip){
    const Archive=window.FutureCodeFrameZip?.Archive;if(!Archive)throw Error("ZIP engine မရပါ");
    const archive=new Archive(),groupSize=amount===2||amount===3?amount:3;
    for(let i=0;i<rows.length;i+=groupSize){
     await archive.add("ပွဲကြိုသုံးသပ်ချက် Version 2/Preview-V2-"+String(Math.floor(i/groupSize)+1).padStart(2,"0")+".png",await canvasBlob(await makeCombined(rows.slice(i,i+groupSize))));
    }
    save(archive.finish(),"Preview-V2-"+date+"-"+rows.length+"-matches.zip");
   }else save(await canvasBlob(await makeCombined(rows)),"Preview-V2-"+date+"-"+rows.length+"-matches.png");
   status.textContent=rows.length+" ပွဲ Download အဆင်သင့်";
  }catch(e){status.textContent="Download မရပါ — "+e.message;}finally{busy=false;}
 }
 async function initFrames(){
  const select=el("fcV2Frame"),p=window.FutureCodeProfessionalFrames;if(!select||!p)return;await p.ready;
  select.replaceChildren(new Option("မူရင်း Version 2","none"));
  for(const f of await p.list("previewsV2"))select.add(new Option(f.name,f.id));
  const chosen=await p.getSelected("previewsV2");
  if([...select.options].some(x=>x.value===chosen))select.value=chosen;
  select.addEventListener("change",applyFrameTheme);applyFrameTheme();
 }
 window.FutureCodePreviewV2=Object.freeze({render,summary,choice,market,load,exportRows,wrapMyanmar});
 el("fcV2League").onchange=cards;el("fcV2Two").onclick=()=>exportRows(2);el("fcV2Three").onclick=()=>exportRows(3);el("fcV2Zip").onclick=()=>exportRows(null,true);
 el("fcV2Reload").onclick=()=>load().catch(e=>el("fcV2Status").textContent=e.message);
 const viewObserver=new MutationObserver(()=>{if(document.body.dataset.fcMainView==="previewV2")scheduleTextWrap();});
 viewObserver.observe(document.body,{attributes:true,attributeFilter:["data-fc-main-view"]});
 window.addEventListener("resize",scheduleTextWrap,{passive:true});
 document.fonts?.ready?.then(scheduleTextWrap);
 const start=()=>{load().catch(e=>el("fcV2Status").textContent=e.message);initFrames().catch(console.warn);};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();