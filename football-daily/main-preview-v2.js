"use strict";
/* Main website only: current-published-data Preview Version 2. */
(function(){
 if(!/^\/(?:index\.html)?$/.test(location.pathname))return;
 const root=document.getElementById("fcPreviewV2");if(!root)return;
 const el=id=>document.getElementById(id),create=(tag,klass,content)=>{const n=document.createElement(tag);if(klass)n.className=klass;if(content!==undefined)n.textContent=content;return n;};
 let items=[],date="",selected=new Set(),busy=false;
 const text=s=>String(s||"").replace(/\*\*|&#x20;|&nbsp;/g,"").replace(/\s+/gu," ").trim();
 const clock=m=>window.FutureCodeTime?.clock?.(m)||m.kickoff||m.sourceKickoff||"—";
 function summary(m){const sentences=(text(m.dailyPreviewText).match(/[^။!?]+[။!?]?/gu)||[]);let out="";for(const sentence of sentences){if(out.length>350||out.length+sentence.length>580&&out)break;out+=sentence.trim()+" ";}return out.trim()||text(m.dailyPreviewText).slice(0,440);}
 function choice(m){const last=text(m.dailyPreviewText).slice(-230);for(const side of ["home","away"]){const name=m[side+"Display"]||m[side];if(name&&(last.includes(name+"ကို ရွေး")||last.includes(name+"အား ရွေး")))return name;const short=name?.split(/\s+/u).at(-1);if(short&&short.length>=4&&(last.includes(short+"ကို ရွေး")||last.includes(short+"အား ရွေး")))return name;}return "အတည်မပြုရသေး";}
 function market(m){const p=m.myanmarOdds||{},normalize=v=>String(v??"").trim()||"—";return {upper:p.upperTeam||"—",initial:[normalize(p.bodyOdds),normalize(p.goalTotalOdds)],current:[normalize(p.currentBodyOdds),normalize(p.currentGoalTotalOdds)]};}
 const media=m=>m.previewV2Media?.url||"",caption=m=>m.previewV2Media?.caption||"အသင်းလိုဂိုဖြင့် ပွဲကြိုမြင်ကွင်း";
 function crest(m,side){const i=create("img","fc-v2-logo");i.src=m[side+"CrestUrl"]||"";i.alt=m[side+"Display"]||m[side];i.loading="lazy";i.onerror=()=>i.style.visibility="hidden";return i;}
 function card(m,i){
  const c=create("article","fc-v2-card"),head=create("header","fc-v2-head"),grid=create("div","fc-v2-grid");
  head.append(create("strong","",String(i+1).padStart(2,"0")+" · "+(m.leagueDisplay||m.league)),create("span","",clock(m)));
  const photo=create("div","fc-v2-media"),url=media(m);
  if(/^https:\/\//.test(url)){const img=create("img","fc-v2-photo");img.src=url;img.loading="lazy";img.crossOrigin="anonymous";img.alt=caption(m);img.onerror=()=>img.remove();photo.append(img);}
  const logos=create("div","fc-v2-team-photos");logos.append(crest(m,"home"),create("b","","VS"),crest(m,"away"));photo.append(logos,create("small","",caption(m)));
  const desc=create("div","fc-v2-desc");desc.append(create("h3","",(m.homeDisplay||m.home)+" နှင့် "+(m.awayDisplay||m.away)),create("p","",summary(m)));
  const selectedTeam=create("div","fc-v2-pick");selectedTeam.append(create("span","","ရွေးချယ်မှု"),create("strong","",choice(m)));desc.append(selectedTeam);
  grid.append(photo,desc);
  const odd=market(m),ribbon=create("div","fc-v2-ribbon");
  const team=side=>{const n=create("div","fc-v2-side");n.append(crest(m,side),create("strong","",m[side+"Display"]||m[side]));return n;};
  const mid=create("div","fc-v2-market");mid.append(create("small","",odd.upper+" · အပေါ်အသင်း"),create("strong","","မူလ  "+odd.initial.join("   |   ")),create("small","","ယခု  "+(odd.current.every(x=>x==="—")?"မရရှိသေး":odd.current.join("   |   "))));ribbon.append(team("home"),mid,team("away"));
  const pick=create("label","fc-v2-check"),input=document.createElement("input");input.type="checkbox";input.checked=selected.has(m.fixtureId);input.onchange=()=>{if(input.checked)selected.add(m.fixtureId);else selected.delete(m.fixtureId);el("fcV2Selected").textContent=selected.size+" ပွဲ ရွေးထားသည်";};pick.append(input,create("span","","Download အတွက် ရွေးရန်"));
  c.append(head,grid,ribbon,pick);return c;
 }
 function cards(){const list=el("fcV2Cards"),league=el("fcV2League").value;list.replaceChildren();items.forEach((m,i)=>{if(league==="all"||m.league===league)list.append(card(m,i));});el("fcV2Count").textContent=items.length+" ပွဲ";el("fcV2Selected").textContent=selected.size+" ပွဲ ရွေးထားသည်";}
 async function load(){
  const f=window.FootballData?.fetch||fetch,res=await f(new URL("./data/today.json",document.baseURI),{cache:"no-store"});if(!res.ok)throw Error("Published data မရပါ");
  const j=await res.json();if(!j.published||!Array.isArray(j.matches))throw Error("ပွဲကြိုဒေတာ မရပါ");
  items=j.matches.filter(m=>m.fixtureId&&m.dailyPreviewText&&m.myanmarOdds);date=j.reportDate;
  const selector=el("fcV2League"),prior=selector.value;selector.replaceChildren(new Option("လိဂ်အားလုံး","all"));
  [...new Set(items.map(m=>m.league))].forEach(k=>selector.add(new Option(items.find(m=>m.league===k)?.leagueDisplay||k,k)));
  selector.value=[...selector.options].some(x=>x.value===prior)?prior:"all";el("fcV2Date").textContent=date;cards();
 }
 const cache=new Map();
 function image(src){
  if(!src||!/^https:\/\//.test(src))return Promise.resolve(null);
  if(cache.has(src))return cache.get(src);
  const p=new Promise(resolve=>{const im=new Image();let done=false;const doneOnce=v=>{if(done)return;done=true;clearTimeout(timeout);resolve(v);};
   const timeout=setTimeout(()=>doneOnce(null),3000);im.crossOrigin="anonymous";im.onload=()=>doneOnce(im);im.onerror=()=>doneOnce(null);im.src=src;
  });cache.set(src,p);return p;
 }
 function cover(ctx,img,x,y,w,h){const s=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/s,sh=h/s;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h);}
 function contain(ctx,img,x,y,w,h){const s=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*s,dh=img.naturalHeight*s;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
 function lines(ctx,value,width,limit){
  const seg=typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"grapheme"}).segment(value),x=>x.segment):Array.from(value);
  const arr=[];let line="";for(const ch of seg){if(ctx.measureText(line+ch).width>width&&line){arr.push(line);line="";if(arr.length>=limit)break;}line+=ch;}
  if(line&&arr.length<limit)arr.push(line);return arr;
 }
 async function render(m,options={}){
  if(!m?.fixtureId)throw Error("Match not found");
  await window.FutureCodeCanvasKit?.fonts?.();
  const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=850;const c=canvas.getContext("2d");
  const col=/^#[\da-f]{6}$/i.test(options.color||"")?options.color:"#07527a";
  c.fillStyle="#e8f0f5";c.fillRect(0,0,1200,850);
  c.fillStyle=col;c.fillRect(0,0,1200,67);c.textAlign="center";c.fillStyle="#fff";c.font='800 26px "Noto Sans Myanmar",sans-serif';c.fillText(m.leagueDisplay||m.league,600,44,1110);
  const [h,a,p,stadium]=await Promise.all([image(m.homeCrestUrl),image(m.awayCrestUrl),image(media(m)),image(new URL("./assets/preview-stadium-night.jpg",document.baseURI).href)]);
  c.save();c.beginPath();c.roundRect(20,84,435,492,18);c.clip();
  if(stadium)cover(c,stadium,20,84,435,492);else{c.fillStyle="#18415f";c.fillRect(20,84,435,492);}
  if(p)cover(c,p,20,84,435,492);
  c.fillStyle="rgba(4,18,34,.67)";c.fillRect(20,409,435,167);
  if(h)contain(c,h,48,422,145,133);if(a)contain(c,a,277,422,145,133);
  c.fillStyle="white";c.font="900 29px Arial";c.fillText("VS",235,493);c.restore();
  c.fillStyle="#486176";c.font='500 15px "Noto Sans Myanmar",sans-serif';c.fillText(caption(m),238,600,435);
  c.textAlign="left";c.fillStyle="#174061";c.font='800 28px "Noto Sans Myanmar",sans-serif';c.fillText((m.homeDisplay||m.home)+" နှင့် "+(m.awayDisplay||m.away),482,126,690);
  c.fillStyle="#293e4b";c.font='500 23px "Noto Sans Myanmar",sans-serif';let y=180;
  for(const line of lines(c,summary(m),683,12)){if(y>488)break;c.fillText(line,482,y,683);y+=34;}
  c.fillStyle=col;c.fillRect(475,522,705,74);c.fillStyle="#fff";c.font='700 19px "Noto Sans Myanmar",sans-serif';c.fillText("ရွေးချယ်မှု",495,551);c.font='800 27px "Noto Sans Myanmar",sans-serif';c.fillText(choice(m),650,570,490);
  const odd=market(m);c.fillStyle="#0c4d7d";c.fillRect(15,625,1170,200);c.fillStyle="#f8fbfd";c.fillRect(22,631,1156,185);
  c.fillStyle="#123a61";c.textAlign="center";c.font='800 28px "Noto Sans Myanmar",sans-serif';c.fillText(m.homeDisplay||m.home,173,678,260);c.fillText(m.awayDisplay||m.away,1030,678,260);
  if(h)contain(c,h,109,693,120,112);if(a)contain(c,a,973,693,120,112);
  c.fillStyle=col;c.fillRect(328,648,552,150);c.fillStyle="white";c.font='800 24px "Noto Sans Myanmar",sans-serif';c.fillText("မူလကြေး "+odd.initial.join("   |   "),604,688,528);
  c.font='700 20px "Noto Sans Myanmar",sans-serif';c.fillText("ယခုကြေး "+(odd.current.every(x=>x==="—")?"မရရှိသေး":odd.current.join(" | ")),604,733,528);
  c.font='500 17px "Noto Sans Myanmar",sans-serif';c.fillText("အပေါ်အသင်း "+odd.upper+" • "+clock(m),604,773,535);
  return canvas;
 }
 const canvasBlob=canvas=>new Promise((ok,bad)=>canvas.toBlob(b=>b?.size?ok(b):bad(Error("PNG မထွက်ပါ")),"image/png"));
 function save(blob,name){const url=URL.createObjectURL(blob),a=create("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 async function exportRows(amount,zip=false){
  if(busy)return;busy=true;const status=el("fcV2Status");try{
   const checked=items.filter(m=>selected.has(m.fixtureId)),rows=(checked.length?checked:items).slice(0,amount||items.length);
   if(!rows.length)throw Error("ပွဲရွေးထားခြင်းမရှိပါ");status.textContent=rows.length+" ပွဲ PNG ပြင်ဆင်နေပါသည်";
   const chosen=el("fcV2Frame")?.value||"none",api=window.FutureCodeProfessionalFrames,canvases=[];
   for(const m of rows){let x=await render(m);if(chosen!=="none"&&api?.wrap)x=await api.wrap(x,"previewsV2","pro:"+chosen);canvases.push(x);}
   if(zip){const Archive=window.FutureCodeFrameZip?.Archive;if(!Archive)throw Error("ZIP engine မရပါ");const archive=new Archive();
    for(let i=0;i<canvases.length;i++)await archive.add("Preview-V2-"+String(i+1).padStart(2,"0")+".png",await canvasBlob(canvases[i]));
    save(archive.finish(),"Preview-V2-"+date+"-"+rows.length+"-matches.zip");
   }else{
    const width=Math.max(...canvases.map(x=>x.width)),height=canvases.reduce((v,x)=>v+x.height,0)+(canvases.length-1)*12;
    if(height>32767||height*width>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်");
    const out=document.createElement("canvas");out.width=width;out.height=height;const cx=out.getContext("2d");cx.fillStyle="#e3ecf2";cx.fillRect(0,0,width,height);
    let y=0;for(const x of canvases){cx.drawImage(x,(width-x.width)/2,y);y+=x.height+12;}
    save(await canvasBlob(out),"Preview-V2-"+date+"-"+rows.length+"-matches.png");
   }
   status.textContent=rows.length+" ပွဲ Download အဆင်သင့်";
  }catch(e){status.textContent="Download မရပါ — "+e.message;}finally{busy=false;}
 }
 async function initFrames(){const select=el("fcV2Frame"),p=window.FutureCodeProfessionalFrames;if(!select||!p)return;await p.ready;select.replaceChildren(new Option("မူရင်း Version 2","none"));for(const f of await p.list("previewsV2"))select.add(new Option(f.name,f.id));}
 window.FutureCodePreviewV2=Object.freeze({render,summary,choice,market,load,exportRows});
 el("fcV2League").onchange=cards;el("fcV2Two").onclick=()=>exportRows(2);el("fcV2Three").onclick=()=>exportRows(3);el("fcV2Zip").onclick=()=>exportRows(null,true);
 el("fcV2Reload").onclick=()=>load().catch(e=>el("fcV2Status").textContent=e.message);
 const start=()=>{load().catch(e=>el("fcV2Status").textContent=e.message);initFrames().catch(console.warn);};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();