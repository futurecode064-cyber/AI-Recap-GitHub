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
  if(!m?.fixtureId||!clean(m.previewV2Summary)||!m.previewV2Selection)throw Error("Preview V2 match/editorial missing");
  await window.FutureCodeCanvasKit?.fonts?.();
  await document.fonts?.ready;
  await document.fonts?.load('500 18px "FCMyanmar"');
  await document.fonts?.load('800 22px "FCMyanmar"');
  const W=1200,photoX=22,photoW=416,textX=451,textW=727,contentTop=72;
  const analysis=summary(m);
  // The picture's height follows the actual analysis height; never leave giant white gaps.
  const metric=document.createElement("canvas").getContext("2d");
  let lines=[],fontSize=0,leading=0,contentH=0;
  for(const size of [20,19,18,17,16]){
   metric.font='550 '+size+'px "FCMyanmar",sans-serif';
   const wrapped=wrapMyanmar(analysis,680,t=>metric.measureText(t).width);
   const lh=Math.ceil(size*1.48),body=wrapped.reduce((v,line)=>v+(line?lh:8),0);
   const desired=50+body+12+42+10;
   if(desired<=365||size===16){
    lines=wrapped;fontSize=size;leading=lh;contentH=Math.max(260,desired);
    break;
   }
  }
  if(contentH>440)throw Error("ပွဲကြိုစာသား မပြည့်စုံဘဲ ထုတ်၍မရပါ — "+(m.homeDisplay||m.home));
  const marketTop=contentTop+contentH+8,cardH=marketTop+123;
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=cardH;
  const c=canvas.getContext("2d");if(!c)throw Error("PNG Canvas မရပါ");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  const col=/^#[\da-f]{6}$/i.test(options.color||"")?options.color:"#18553d";
  const dark=shade(col,.61),ink="#143b2c",gold="#dfbb61";
  const box=(x,y,w,h,r,fill,stroke,sw=2)=>{
   c.beginPath();c.roundRect(x,y,w,h,r);
   if(fill){c.fillStyle=fill;c.fill();}
   if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke();}
  };
  const centered=(value,x,y,width,size,weight=800,color="#fff")=>{
   c.fillStyle=color;c.textAlign="center";c.textBaseline="middle";
   fitMyanmar(c,value,x,y,width,size,weight,12);
  };
  const photoInfo=m.previewV2Media||{};
  const [home,away,league,photo,photoOther]=await Promise.all([
   image(m.homeCrestUrl),image(m.awayCrestUrl),
   image(window.FutureCodeMainLogoAssets?.leagueCrest(m.league)||window.FutureCodeBrandExportData?.leagueCrest?.(m.league)||""),
   image(photoInfo.url||""),image(photoInfo.secondaryUrl||"")
  ]);
  if(!home||!away||!league)throw Error("အသင်း/လိဂ်လိုဂို မပြည့်စုံပါ — "+(m.homeDisplay||m.home)+" / "+(m.awayDisplay||m.away));
  // A verified photograph must actually load before exporting. Never mask a missing
  // player picture with a generic stadium or misleading fake matchup.
  if(photoInfo.url&&!photo)throw Error("ပွဲဓာတ်ပုံ ဖတ်မရပါ — "+(m.homeDisplay||m.home)+" / "+(m.awayDisplay||m.away));
  if(photoInfo.secondaryUrl&&!photoOther)throw Error("ဒုတိယအသင်း ကစားသမားပုံ မရပါ — "+(m.awayDisplay||m.away));

  c.fillStyle=dark;c.fillRect(0,0,W,cardH);
  c.strokeStyle=gold;c.lineWidth=3;c.beginPath();c.moveTo(13,29);c.lineTo(1187,29);c.stroke();
  box(272,5,660,56,14,dark,gold,3);
  box(24,6,176,52,10,"#ffffff",gold,2);contain(c,league,34,9,156,45);
  centered(m.leagueDisplay||m.league,601,33,615,26,900);

  // Exact shared top/bottom axes for the photo and analysis: zero mismatched blank areas.
  box(12,67,1176,contentH+11,13,"#fbfdfa",gold,4);
  box(photoX,contentTop,photoW,contentH,8,"#1b3330",null);
  c.save();c.beginPath();c.roundRect(photoX,contentTop,photoW,contentH,8);c.clip();
  if(photo&&photoOther){
   // Authentic historical club-player photos side by side (NOT a synthetic
   // claim that the two players met in the pictured moment).
   cover(c,photo,photoX,contentTop,photoW/2,contentH);
   cover(c,photoOther,photoX+photoW/2,contentTop,photoW/2,contentH);
   c.fillStyle=gold;c.fillRect(photoX+photoW/2-2,contentTop,4,contentH);
  }else if(photo){
   cover(c,photo,photoX,contentTop,photoW,contentH);
  }else{
   // Honest fallback, no unrelated player photograph and no club logos replacing players.
   const grad=c.createLinearGradient(photoX,contentTop,photoX+photoW,contentTop+contentH);
   grad.addColorStop(0,"#113f37");grad.addColorStop(1,"#061d24");
   c.fillStyle=grad;c.fillRect(photoX,contentTop,photoW,contentH);
   centered("ပွဲဓာတ်ပုံ",photoX+photoW/2,contentTop+contentH*.42,350,26,800);
   centered("အတည်ပြုနေဆဲ",photoX+photoW/2,contentTop+contentH*.58,350,19,650);
  }
  if(photo){
   const gy=contentTop+contentH-43;
   const grad=c.createLinearGradient(0,gy,0,gy+43);grad.addColorStop(0,"rgba(0,0,0,0)");
   grad.addColorStop(1,"rgba(0,0,0,.85)");
   c.fillStyle=grad;c.fillRect(photoX,gy,photoW,43);
   centered(photoInfo.historical?"ယခင်ပွဲ/ကစားသမားပုံ · Wikimedia Commons":"သက်ဆိုင်ရာပွဲဓာတ်ပုံ",
    photoX+photoW/2,contentTop+contentH-16,photoW-16,13,700);
  }
  c.restore();box(photoX,contentTop,photoW,contentH,8,null,"#d9e6df",2);
  box(textX,contentTop,textW,contentH,8,"#ffffff","#c4d8cd",2);
  centered((m.homeDisplay||m.home)+" နှင့် "+(m.awayDisplay||m.away),textX+textW/2,contentTop+30,textW-30,24,900,ink);
  c.fillStyle="#203d30";c.textAlign="left";c.textBaseline="top";
  c.font='550 '+fontSize+'px "FCMyanmar",sans-serif';
  let y=contentTop+57;
  const cutoff=contentTop+contentH-53;
  for(const line of lines){
   if(!line){y+=8;continue;}
   if(y+leading>cutoff)throw Error("ပွဲကြိုသုံးသပ်ချက် စာသားထပ်နေပါသည် — "+(m.homeDisplay||m.home));
   c.fillText(line,textX+18,y,680);y+=leading;
  }
  const pickY=contentTop+contentH-44;
  box(textX+9,pickY,textW-18,37,5,dark,gold,2);
  c.strokeStyle=gold;c.lineWidth=3;c.beginPath();
  c.moveTo(textX+193,pickY+1);c.lineTo(textX+179,pickY+36);c.stroke();
  centered("ရွေးချယ်မှု -",textX+100,pickY+19,175,17,900,gold);
  centered(choice(m),textX+447,pickY+19,490,21,900,"#fff");

  // No seams or floating boxes: the five columns share one continuous border.
  const o=market(m),rowY=marketTop+5,rowH=101;
  box(12,marketTop,1176,115,10,"#fff",gold,4);
  const cols=[
   {x:19,w:280,side:"home"},
   {x:299,w:191,kind:"goal",label:"ဂိုးပေါင်းကြေး",value:o.goal,current:o.currentGoal},
   {x:490,w:219,kind:"time"},
   {x:709,w:191,kind:"body",label:"ဘော်ဒီကြေး",value:o.body,current:o.currentBody},
   {x:900,w:281,side:"away"}
  ];
  for(const s of cols){
   c.fillStyle=s.side?"#f0f6f1":s.kind==="time"?"#fff":dark;
   c.fillRect(s.x,rowY,s.w,rowH);
   c.strokeStyle="#c0d3c5";c.lineWidth=1;
   c.strokeRect(s.x+.5,rowY+.5,s.w-1,rowH-1);
   const center=s.x+s.w/2;
   if(s.side){
    const im=s.side==="home"?home:away,label=s.side==="home"?(m.homeDisplay||m.home):(m.awayDisplay||m.away);
    const ix=s.side==="home"?s.x+8:s.x+s.w-80;
    contain(c,im,ix,rowY+11,72,80);
    centered(label,s.side==="home"?s.x+187:s.x+92,rowY+53,175,20,900,ink);
   }else if(s.kind==="time"){
    centered("ပွဲစတင်ချိန်",center,rowY+24,s.w-18,15,800,ink);
    c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d3139";
    c.font="900 27px Arial,sans-serif";c.fillText(clock(m),center,rowY+69,s.w-16);
   }else{
    centered(s.label,center,rowY+21,s.w-12,15,800);
    centered(s.value,center,rowY+52,s.w-12,27,900);
    centered(s.current!=="—"?"ယခု "+s.current:"မူလကြေး",center,rowY+82,s.w-12,12,650);
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
    const width=Math.max(...canvases.map(x=>x.width)),height=canvases.reduce((v,x)=>v+x.height,0)+(canvases.length-1)*4;
    if(height>32767||height*width>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်");
    const out=document.createElement("canvas");out.width=width;out.height=height;
    const cx=out.getContext("2d");cx.fillStyle="#e3ecf2";cx.fillRect(0,0,width,height);
    let y=0;for(const c of canvases){cx.drawImage(c,(width-c.width)/2,y);y+=c.height+4;}
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