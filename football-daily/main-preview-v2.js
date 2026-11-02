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
  await document.fonts?.ready;
  await document.fonts?.load('500 19px "FCMyanmar"');
  await document.fonts?.load('800 24px "FCMyanmar"');
  const W=1200,H=690,canvas=document.createElement("canvas");
  canvas.width=W;canvas.height=H;
  const c=canvas.getContext("2d");if(!c)throw Error("PNG Canvas မရပါ");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  const col=/^#[\da-f]{6}$/i.test(options.color||"")?options.color:"#11613b";
  const dark=shade(col,.58),ink="#12382b",gold="#e1be66",cream="#fffdf7";
  const rounded=(x,y,w,h,r,fill,stroke,line=2)=>{
   c.beginPath();c.roundRect(x,y,w,h,r);
   if(fill){c.fillStyle=fill;c.fill();}
   if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
  };
  const text=(value,x,y,sz,color,weight=700,maxWidth)=>{
   c.fillStyle=color;c.textAlign="center";c.textBaseline="middle";
   fitMyanmar(c,value,x,y,maxWidth??1100,sz,weight,12);
  };
  const [home,away,league,photo,stadium]=await Promise.all([
   image(m.homeCrestUrl),image(m.awayCrestUrl),
   image(window.FutureCodeMainLogoAssets?.leagueCrest(m.league)||window.FutureCodeBrandExportData?.leagueCrest?.(m.league)||""),
   image(media(m)),image(new URL("./assets/preview-stadium-night.jpg",document.baseURI).href)
  ]);
  // No partial or incorrect team/league branding in downloads.
  if(!home||!away)throw Error("အသင်းလိုဂို မပြည့်စုံပါ — "+(m.homeDisplay||m.home)+" / "+(m.awayDisplay||m.away));
  if(!league)throw Error("လိဂ်လိုဂို မပြည့်စုံပါ — "+(m.leagueDisplay||m.league));
  c.fillStyle=dark;c.fillRect(0,0,W,H);
  // Gold-rimmed league title, matching the compact professional journal example.
  c.fillStyle=gold;c.fillRect(14,27,1172,3);
  rounded(275,5,650,57,17,dark,gold,3);
  rounded(25,7,170,53,13,"#ffffff",gold,2);
  contain(c,league,38,11,143,44);
  text(m.leagueDisplay||m.league,600,34,27,"#ffffff",900,610);

  // Single tightly framed match card: image left, full analysis right, pick underneath.
  rounded(12,70,1176,470,18,"#fffdf9",dark,5);
  rounded(18,76,1164,458,14,cream,gold,2);
  c.save();c.beginPath();c.roundRect(28,86,417,436,14);c.clip();
  if(stadium)cover(c,stadium,28,86,417,436);
  else{c.fillStyle="#123a49";c.fillRect(28,86,417,436);}
  if(photo)cover(c,photo,28,86,417,436);
  const vignette=c.createLinearGradient(0,328,0,522);
  vignette.addColorStop(0,"rgba(3,18,21,0)");
  vignette.addColorStop(1,"rgba(2,12,16,.94)");
  c.fillStyle=vignette;c.fillRect(28,310,417,212);
  contain(c,home,43,370,150,132);
  contain(c,away,282,370,150,132);
  c.fillStyle="#ffffff";c.font="900 33px Arial,sans-serif";
  c.textAlign="center";c.textBaseline="middle";c.fillText("VS",238,456);
  c.restore();
  rounded(28,86,417,436,14,null,"#d7dfda",2);
  rounded(455,86,720,436,11,"#ffffff","#cad9d0",2);
  text((m.homeDisplay||m.home)+" နှင့် "+(m.awayDisplay||m.away),813,122,27,ink,900,680);

  // Measure every Burmese line; choose the largest readable size that fits.
  // No fixed character slicing, ellipsis, unrendered lines or off-card text.
  const paragraph=summary(m),left=474,available=684,top=164,bottom=469;
  let lines=[],fontSize=0,lineHeight=0;
  for(const size of [21,20,19,18,17,16,15]){
   c.font='550 '+size+'px "FCMyanmar",sans-serif';
   const candidate=wrapMyanmar(paragraph,available,s=>c.measureText(s).width);
   const leading=Math.round(size*1.52);
   const height=candidate.reduce((n,line)=>n+(line?leading:8),0);
   if(height<=bottom-top){lines=candidate;fontSize=size;lineHeight=leading;break;}
  }
  if(!lines.length)throw Error("စာပိုဒ်အပြည့်အစုံကို ဂျာနယ်ပုံထဲ ထည့်ရန် နေရာမလုံလောက်ပါ — "+(m.homeDisplay||m.home)+" / "+(m.awayDisplay||m.away));
  c.font='550 '+fontSize+'px "FCMyanmar",sans-serif';
  c.fillStyle="#253830";c.textAlign="left";c.textBaseline="top";
  let y=top;
  for(const line of lines){
   if(!line){y+=8;continue;}
   c.fillText(line,left,y,available);y+=lineHeight;
  }
  // Journal-style green selection bar with its own gold-accented label.
  rounded(465,483,700,40,7,dark,gold,2);
  c.beginPath();c.moveTo(654,484);c.lineTo(636,522);
  c.strokeStyle=gold;c.lineWidth=4;c.stroke();
  text("ရွေးချယ်မှု -",557,503,18,gold,900,170);
  text(choice(m),909,503,22,"#ffffff",900,485);

  // Symmetric one-row Myanmar odds panel: club/crest → goal → time → body → club/crest.
  rounded(12,548,1176,130,16,"#ffffff",dark,5);
  rounded(19,555,1162,116,12,"#f7faf7",gold,2);
  const odd=market(m),rowTop=562,rowH=102;
  const segments=[
   {x:28,w:273,side:"home"},
   {x:308,w:183,kind:"goal",label:"ဂိုးပေါင်းကြေး",value:odd.goal,current:odd.currentGoal},
   {x:498,w:204,kind:"time"},
   {x:709,w:183,kind:"body",label:"ဘော်ဒီကြေး",value:odd.body,current:odd.currentBody},
   {x:899,w:273,side:"away"}
  ];
  for(const s of segments){
   if(s.side){
    rounded(s.x,rowTop,s.w,rowH,6,"#f1f5f2","#dee7df",1);
    const crest=s.side==="home"?home:away;
    const label=s.side==="home"?(m.homeDisplay||m.home):(m.awayDisplay||m.away);
    const ix=s.side==="home"?s.x+9:s.x+s.w-83;
    contain(c,crest,ix,rowTop+13,74,76);
    text(label,s.side==="home"?s.x+183:s.x+90,rowTop+52,21,ink,900,176);
   }else if(s.kind==="time"){
    rounded(s.x,rowTop,s.w,rowH,5,"#ffffff","#b8d2c2",2);
    text("ပွဲစတင်ချိန်",s.x+s.w/2,rowTop+23,16,ink,750,185);
    c.fillStyle="#152b30";c.textAlign="center";c.textBaseline="middle";
    c.font="900 28px Arial,sans-serif";
    c.fillText(clock(m),s.x+s.w/2,rowTop+65,s.w-14);
   }else{
    rounded(s.x,rowTop,s.w,rowH,5,dark,null);
    text(s.label,s.x+s.w/2,rowTop+20,15,"#ffffff",850,174);
    text(s.value,s.x+s.w/2,rowTop+54,28,"#ffffff",900,170);
    text(s.current!=="—"?"ယခု "+s.current:"မူလကြေး",s.x+s.w/2,rowTop+84,12,"#e7f0e4",650,168);
   }
  }
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