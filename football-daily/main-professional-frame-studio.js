"use strict";
/* Shared main-only frame decorations; does not change source publishing data. */
(function(){
if(document.documentElement.dataset.footballBrandName||!(/^\/(?:index\.html)?$/.test(location.pathname)||/^\/odds(?:\.html)?\/?$/.test(location.pathname)))return;
const labels={results:"ဂိုးရလဒ်",previews:"ပွဲကြိုသုံးသပ်ချက်",specials:"Special Choice",odds:"ပေါက်ကြေး",ai:"AI ခန့်မှန်းချက်",news:"ဘောလုံးသတင်း"},types=Object.keys(labels);
const templates=[["navy","Professional Navy","#16486c"],["gold","Premium Gold","#856119"],["red","Editorial Red","#842630"],["green","Sports Green","#18553d"]].map(a=>({id:a[0],name:a[1],color:a[2],top:110,bottom:75,fit:"contain",topImage:"",bottomImage:"",builtin:true}));
const empty=()=>({version:2,frames:templates.map(x=>({...x})),selected:Object.fromEntries(types.map(x=>[x,"none"])),placements:Object.fromEntries(types.map(x=>[x,[]]))});
let state=empty(),panel=null,active="navy",queue=Promise.resolve();
const get=id=>state.frames.find(f=>f.id===id);
const color=s=>/^#[\da-f]{6}$/i.test(s||"")?s:"#16486c";
const number=(v,d)=>Number.isFinite(+v)?Math.max(0,Math.min(360,Math.round(+v))):d;
const trim=(s,max=70)=>String(s||"").trim().slice(0,max);
const pic=x=>typeof x==="string"&&/^data:image\/(png|webp|jpeg);base64,/.test(x)&&x.length<1500000?x:"";
function validate(v){
if(!v||v.version!==2||!Array.isArray(v.frames)||v.frames.length>44)throw Error("Frame Backup v2 မမှန်ပါ");
const out=empty(),used=new Set();
out.frames=v.frames.filter(x=>x&&/^[a-z0-9-]{2,60}$/.test(x.id)&&!used.has(x.id)&&used.add(x.id)).map(x=>({
id:x.id,name:trim(x.name)||"My Frame",color:color(x.color),top:number(x.top,110),bottom:number(x.bottom,75),
fit:x.fit==="cover"?"cover":"contain",topImage:pic(x.topImage),bottomImage:pic(x.bottomImage),builtin:templates.some(t=>t.id===x.id)}));
for(const f of templates)if(!out.frames.some(x=>x.id===f.id))out.frames.unshift({...f});
for(const k of types){
 const id=v.selected?.[k];out.selected[k]=getId(id,out.frames)?id:"none";
 const listed=Array.isArray(v.placements?.[k])?v.placements[k]:id&&id!=="none"?[id]:[];
 out.placements[k]=[...new Set(listed.filter(x=>out.frames.some(f=>f.id===x)))];
 if(out.selected[k]!=="none"&&!out.placements[k].includes(out.selected[k]))out.placements[k].push(out.selected[k]);
}
return out;
}
function getId(id,frames){return id==="none"||frames.some(f=>f.id===id);}
function openDB(){return new Promise((resolve,reject)=>{
const r=indexedDB.open("future-code-professional-frame-studio-v2",1);
r.onupgradeneeded=()=>r.result.createObjectStore("config");
r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});}
async function load(){const d=await openDB();return new Promise((res,rej)=>{const t=d.transaction("config"),r=t.objectStore("config").get("main");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);t.oncomplete=()=>d.close();});}
async function persist(){const snapshot=JSON.parse(JSON.stringify(state)),d=await openDB();return new Promise((res,rej)=>{const t=d.transaction("config","readwrite");t.objectStore("config").put(snapshot,"main");t.oncomplete=()=>{d.close();res();};t.onerror=()=>rej(t.error);});}
function save(){window.__fcFrameRevision=(window.__fcFrameRevision||0)+1;queue=queue.catch(()=>{}).then(persist);return queue;}
const ready=load().then(v=>{if(v)state=validate(v);}).catch(e=>console.warn("Professional frames: browser storage",e));
function shade(hex,scale){return "#"+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*scale).toString(16).padStart(2,"0")).join("");}
function image(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(Error("Banner ပုံ ဖတ်မရပါ"));im.src=src;});}
function artwork(ctx,img,w,h,y,fit){
if(!img||h<=0)return;
const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
ctx.save();ctx.beginPath();ctx.rect(0,y,w,h);ctx.clip();
if(fit==="cover"){const s=Math.max(w/iw,h/ih),cw=w/s,ch=h/s;ctx.drawImage(img,(iw-cw)/2,(ih-ch)/2,cw,ch,0,y,w,h);}
else{const s=Math.min(w/iw,h/ih),dw=iw*s,dh=ih*s;ctx.drawImage(img,(w-dw)/2,y+(h-dh)/2,dw,dh);}
ctx.restore();
}
function band(ctx,w,y,h,hex){
if(!h)return;
const g=ctx.createLinearGradient(0,y,w,y+h);g.addColorStop(0,shade(hex,.35));g.addColorStop(.5,hex);g.addColorStop(1,shade(hex,.4));
ctx.fillStyle=g;ctx.fillRect(0,y,w,h);ctx.fillStyle="rgba(255,255,255,.34)";ctx.fillRect(18,y+h-3,w-36,2);
}
async function composite(source,f){
const w=source.width,top=Math.round(f.top*w/1200),bottom=Math.round(f.bottom*w/1200),pad=Math.max(10,Math.round(w*.012)),h=top+source.height+bottom+pad*2;
if(h>32767||h*w>110000000)throw Error("PNG ပုံအမြင့်များလွန်းပါသည်။ Banner အမြင့်လျှော့ပါ။");
const out=document.createElement("canvas");out.width=w;out.height=h;
const c=out.getContext("2d");if(!c)throw Error("Canvas မရနိုင်ပါ");
c.fillStyle=shade(f.color,.33);c.fillRect(0,0,w,h);band(c,w,0,top,f.color);band(c,w,h-bottom,bottom,f.color);
const [a,b]=await Promise.all([f.topImage?image(f.topImage):null,f.bottomImage?image(f.bottomImage):null]);
artwork(c,a,w,top,0,f.fit);artwork(c,b,w,bottom,h-bottom,f.fit);
c.drawImage(source,0,top+pad);
c.strokeStyle=f.color;c.lineWidth=Math.max(3,Math.floor(pad/2));c.strokeRect(c.lineWidth/2,top+pad+c.lineWidth/2,w-c.lineWidth,source.height-c.lineWidth);
return out;
}
/* The optional third argument gives a specific download design. "none" disables
   extra artwork so all-frames ZIPs keep their original unmodified designs. */
async function wrap(canvas,section,frameId){
 if(!canvas||!types.includes(section))return canvas;
 await ready;
 let id=frameId===undefined?state.selected[section]:frameId;
 if(typeof id==="string"&&id.startsWith("pro:"))id=id.slice(4);
 if(!id||id==="none")return canvas;
 const f=get(id);
 if(frameId!==undefined&&typeof frameId==="string"&&frameId.startsWith("pro:")&&!state.placements[section].includes(id))return canvas;
 return f?composite(canvas,f):canvas;
}
const available=section=>(state.placements[section]||[]).map(get).filter(Boolean);
const attached=new Map();
let refreshing=false;
function nativeId(sel){return sel.value.startsWith("pro:")?sel.value.slice(4):"";}
function syncNative(){
 if(refreshing)return;
 refreshing=true;
 try{
  for(const [select,sections] of attached){
   if(!select.isConnected){attached.delete(select);continue;}
   const matches=[...new Map([...sections].flatMap(k=>available(k)).map(f=>[f.id,f])).values()];
   const expected=matches.map(f=>f.id+"|"+f.name+" · Professional").join(";");
   const current=[...select.options].filter(o=>o.dataset.fcProfessional).map(o=>o.dataset.fcProfessional+"|"+o.text).join(";");
   if(expected!==current){
    const oldValue=select.value;
    for(const option of [...select.options])if(option.dataset.fcProfessional)option.remove();
    matches.forEach(f=>{const opt=new Option(f.name+" · Professional","pro:"+f.id);opt.dataset.fcProfessional=f.id;select.add(opt);});
    if([...select.options].some(o=>o.value===oldValue))select.value=oldValue;
   }
   const selected=[...sections].map(k=>state.selected[k]).find(id=>id&&matches.some(f=>f.id===id));
   if(selected&&select.value.startsWith("pro:")===false)select.value="pro:"+selected;
  }
 }finally{refreshing=false;}
}
function attach(section,select){
 if(!types.includes(section)||!select)return;
 if(attached.has(select)){attached.get(select).add(section);syncNative();return;}
 attached.set(select,new Set([section]));
 select.addEventListener("change",event=>{
  if(!event.isTrusted)return;
  const chosen=nativeId(select),scopes=attached.get(select);
  for(const key of scopes)state.selected[key]=chosen&&state.placements[key].includes(chosen)?chosen:"none";
  save().then(()=>{syncMini();status("Download Frame ရွေးပြီးပါပြီ");}).catch(e=>status(e.message,true));
 });
 const watcher=new MutationObserver(()=>{if(!refreshing)syncNative();});
 watcher.observe(select,{childList:true});
 ready.then(syncNative);
}
function refresh(){syncNative();syncMini();}
const getFrame=id=>{const f=get(String(id||"").replace(/^pro:/,""));return f?{...f}:null;};
window.FutureCodeProfessionalFrames=Object.freeze({
 wrap,ready,attach,refresh,getFrame,
 list:async section=>(await ready,available(section).map(f=>({...f}))),
 getSelected:async name=>(await ready,state.selected[name]||"none"),sections:labels
});
const el=id=>panel?.querySelector("#"+id);
function status(msg,error){const n=el("fcpStatus");if(n){n.textContent=msg;n.style.color=error?"#ff9c9c":"#aef3ca";}}
function preview(){
const f=get(active),canvas=el("fcpPreview");if(!f||!canvas)return;
const src=document.createElement("canvas");src.width=500;src.height=225;const c=src.getContext("2d");
c.fillStyle="#f0f5f8";c.fillRect(0,0,500,225);c.fillStyle="#13283b";c.fillRect(16,18,468,52);
c.fillStyle="#fff";c.font="bold 24px sans-serif";c.fillText("MATCH PREVIEW",30,51);
c.fillStyle="#122a3c";c.font="bold 22px sans-serif";c.fillText("HOME  1 - 1  AWAY",35,124);
c.fillStyle="#6a8491";for(let i=0;i<4;i++)c.fillRect(35,151+i*15,420,6);
composite(src,{...f,topImage:"",bottomImage:""}).then(async base=>{
 const out=canvas.getContext("2d");canvas.width=base.width;canvas.height=base.height;out.drawImage(base,0,0);
 const top=Math.round(f.top*500/1200),bottom=Math.round(f.bottom*500/1200),[a,b]=await Promise.all([f.topImage?image(f.topImage):null,f.bottomImage?image(f.bottomImage):null]);
 if(active!==f.id)return;artwork(out,a,500,top,0,f.fit);artwork(out,b,500,bottom,canvas.height-bottom,f.fit);
}).catch(e=>status(e.message,true));
}
function fill(){
const f=get(active);if(!f)return;
el("fcpFrame").value=f.id;el("fcpName").value=f.name;el("fcpColor").value=f.color;el("fcpTop").value=f.top;el("fcpBottom").value=f.bottom;el("fcpFit").value=f.fit;
el("fcpTopFile").value="";el("fcpBottomFile").value="";
el("fcpTopState").textContent=f.topImage?"အပေါ် Banner ပုံ ထည့်ထားသည်":"အပေါ် Banner မရှိပါ";
el("fcpBottomState").textContent=f.bottomImage?"အောက် Banner ပုံ ထည့်ထားသည်":"အောက် Banner မရှိပါ";
el("fcpDelete").disabled=f.builtin;
 panel.querySelectorAll('#fcpPlacement input[type="checkbox"]').forEach(input=>{input.checked=state.placements[input.value].includes(f.id);});
 preview();
}
function syncControls(){
if(!panel)return;
const sel=el("fcpFrame");sel.replaceChildren(...state.frames.map(f=>new Option(f.name,f.id)));
if(!get(active))active=state.frames[0].id;sel.value=active;
const host=el("fcpAssignments");host.replaceChildren();
for(const key of types){
const label=document.createElement("label"),select=document.createElement("select");
label.textContent=labels[key];select.dataset.section=key;
select.add(new Option("မူရင်းအတိုင်း (Frame မထည့်)","none"));
available(key).forEach(f=>select.add(new Option(f.name,f.id)));
select.value=state.selected[key];
select.onchange=async()=>{
 const previous=state.selected[key];state.selected[key]=select.value;
 try{await save();refresh();status(labels[key]+" Download Frame ရွေးပြီး");}
 catch(e){state.selected[key]=previous;status(e.message,true);}
};
label.append(select);host.append(label);
}
fill();refresh();
}
function syncMini(){
document.querySelectorAll(".fcp-mini select[data-section]").forEach(select=>{
const key=select.dataset.section;select.replaceChildren(new Option("မူရင်းပုံ","none"),...available(key).map(f=>new Option(f.name,f.id)));
select.value=state.selected[key]||"none";
});
}
function mini(){let created=false;
const targets={results:"#mainResultsFrameStudio",previews:"#brandPreviewStudio",odds:/^\/odds/.test(location.pathname)?"#mainTableOddsFrames":"#brandOddsStudio",ai:"#fcAiExportPanel",news:"#fcNewsSection"};
for(const [key,selector] of Object.entries(targets)){
const target=document.querySelector(selector);if(!target||target.querySelector(".fcp-mini"))continue;
const row=document.createElement("div");row.className="fcp-mini";
const label=document.createElement("label"),select=document.createElement("select"),link=document.createElement("a");
label.textContent="Professional Frame";select.dataset.section=key;label.append(select);
link.href="#fcProfessionalFrameStudio";link.textContent="Frame / Banner ပြင်မယ်";
select.onchange=async()=>{state.selected[key]=select.value;
 try{await save();const master=el("fcpAssignments")?.querySelector('select[data-section="'+key+'"]');if(master)master.value=select.value;syncNative();status(labels[key]+" Frame သိမ်းပြီး");}
 catch(e){status(e.message,true);}};

row.append(label,link);target.prepend(row);created=true;
}if(created)syncMini();
}
async function compress(file){
if(!file)return null;
if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8000000)throw Error("PNG/JPG/WEBP 8MB အောက် ပုံရွေးပါ။");
const url=URL.createObjectURL(file);
try{
 const im=await image(url);if(im.naturalWidth<250||im.naturalHeight<40)throw Error("Banner အနည်းဆုံး 250×40 px လိုအပ်ပါသည်။");
 const s=Math.min(1,1800/im.naturalWidth,500/im.naturalHeight),c=document.createElement("canvas");
 c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
 const data=c.toDataURL("image/webp",.78);if(data.length>=1500000)throw Error("Banner ပုံအရွယ်အစား လျှော့ပါ။");return data;
}finally{URL.revokeObjectURL(url);}
}
function downloadJson(){const b=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(b),a=document.createElement("a");a.href=url;a.download="future-code-pro-frame-settings-v2.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function init(){
panel=document.createElement("section");panel.id="fcProfessionalFrameStudio";
panel.innerHTML='<div class="fcp-head"><div><small>FUTURE CODE · MAIN WEBSITE</small><h2>Professional Frame & Banner Studio</h2><p>Section အားလုံးအတွက် Frame၊ အပေါ် Banner နှင့် အောက် Banner ကို သီးခြား စိတ်ကြိုက်သတ်မှတ်နိုင်ပါသည်။</p></div><a href="./odds.html">ပေါက်ကြေးစာမျက်နှာ</a></div>'+
'<div class="fcp-grid"><div class="fcp-card"><label>Frame ရွေးရန်<select id="fcpFrame"></select></label><label>Frame နာမည်<input id="fcpName" type="text" maxlength="70"></label>'+
'<div class="fcp-pair"><label>Frame အရောင်<input id="fcpColor" type="color"></label><label>Banner Fit<select id="fcpFit"><option value="contain">အပြည့်ပေါ် (မဖြတ်)</option><option value="cover">အပြည့်ဖြည့် (အနားဖြတ်)</option></select></label></div>'+
'<div class="fcp-pair"><label>အပေါ် Banner အမြင့်<input id="fcpTop" type="number" min="0" max="360"></label><label>အောက် Banner အမြင့်<input id="fcpBottom" type="number" min="0" max="360"></label></div>'+
'<div class="fcp-upload"><b>အပေါ် Banner ပုံ (Top)</b><input type="file" id="fcpTopFile" accept="image/png,image/jpeg,image/webp"><small id="fcpTopState"></small><button id="fcpRemoveTop">Top Banner ဖြုတ်</button></div>'+
'<div class="fcp-upload"><b>အောက် Banner ပုံ (Bottom)</b><input type="file" id="fcpBottomFile" accept="image/png,image/jpeg,image/webp"><small id="fcpBottomState"></small><button id="fcpRemoveBottom">Bottom Banner ဖြုတ်</button></div>'+
'<fieldset class="fcp-upload"><legend><b>ဒီ Frame ထည့်မည့် Download Section များ ရွေးပါ</b></legend><div id="fcpPlacement"></div><small>ရွေးထားသော Section များ၏ မူရင်း Frame dropdown ထဲသို့ Add နှိပ်ပြီးချင်း ပေါင်းထည့်ပါမည်။</small></fieldset>'+ 
'<div class="fcp-buttons"><button id="fcpAdd">＋ Frame အသစ် Add to Sections</button><button id="fcpSave">ပြင်ဆင်ချက် သိမ်းမယ်</button><button id="fcpDelete">Frame ဖျက်မယ်</button><button id="fcpReset">မူရင်း Frame ပြန်ထား</button></div></div>'+
'<div class="fcp-card"><h3>Frame Preview</h3><canvas id="fcpPreview" width="500" height="300"></canvas><p>Download ပုံထဲမှာ စာ/ဇယားကို မဖုံးဘဲ Banner များကို အပေါ်နှင့်အောက် သီးခြားထည့်ပေးပါမည်။</p><h3>Section အလိုက် Frame ချိတ်ဆက်ရန်</h3><div id="fcpAssignments"></div></div></div>'+
'<div class="fcp-buttons"><button id="fcpBackup">Settings Backup Download</button><label>Backup Import<input id="fcpImport" type="file" accept=".json,application/json"></label><span id="fcpStatus" role="status" aria-live="polite"></span></div>'+
'<p>Settings ကို ဒီ Browser ၏ IndexedDB တွင် သိမ်းထားပါသည်။ အခြား Device သို့ ပြောင်းရန် Backup/Import လုပ်ပါ။ Original data မပြောင်းပါ။</p>';
if(/^\/odds/.test(location.pathname))document.querySelector("main")?.prepend(panel);else document.querySelector("main>.hero")?.after(panel);
 for(const [key,name] of Object.entries(labels)){
  const holder=document.createElement("label"),checkbox=document.createElement("input");
  holder.className="fcp-check";checkbox.type="checkbox";checkbox.value=key;
  holder.append(checkbox,document.createTextNode(name));el("fcpPlacement").append(holder);
 }
const css=document.createElement("style");css.textContent='#fcProfessionalFrameStudio{max-width:1180px;box-sizing:border-box;margin:20px auto;padding:24px;background:#102937;color:#ecf5fc;border:1px solid #527b8f;border-radius:17px;font:14px/1.8 "Noto Sans Myanmar",sans-serif}#fcProfessionalFrameStudio *{box-sizing:border-box}#fcProfessionalFrameStudio h2{font-size:25px;margin:0;color:#ffe1ad}#fcProfessionalFrameStudio h3{color:#ffe1ad}#fcProfessionalFrameStudio p,#fcProfessionalFrameStudio small{color:#c9dde6}#fcProfessionalFrameStudio .fcp-head{display:flex;justify-content:space-between;gap:20px}#fcProfessionalFrameStudio a{color:#ffdb9f}#fcProfessionalFrameStudio .fcp-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:20px 0}#fcProfessionalFrameStudio .fcp-card{padding:18px;background:#1a3848;border:1px solid #446a7c;border-radius:12px}#fcProfessionalFrameStudio label{display:flex;flex-direction:column;gap:5px;margin:8px 0;font-weight:700;color:#fff}#fcProfessionalFrameStudio .fcp-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}#fcProfessionalFrameStudio select,#fcProfessionalFrameStudio input:not([type=color]){width:100%;min-height:39px;padding:8px;background:#fff;color:#172e3a;border:1px solid #a2bdc8;border-radius:7px;font:inherit}#fcProfessionalFrameStudio input[type=color]{width:100%;height:43px}#fcProfessionalFrameStudio .fcp-upload{border:1px dashed #6f94a6;border-radius:9px;padding:12px;margin:12px 0;display:grid;gap:6px}#fcProfessionalFrameStudio button{background:#f1bf78;color:#203443;padding:9px 12px;border:0;border-radius:8px;font:700 13px "Noto Sans Myanmar",sans-serif;cursor:pointer}#fcProfessionalFrameStudio button:disabled{opacity:.4}#fcProfessionalFrameStudio .fcp-buttons{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:15px 0}#fcProfessionalFrameStudio #fcpDelete{background:#ec9292}#fcProfessionalFrameStudio canvas{display:block;width:100%;height:auto;border-radius:6px}#fcProfessionalFrameStudio #fcpAssignments{display:grid;grid-template-columns:1fr 1fr;gap:8px}#fcProfessionalFrameStudio #fcpStatus{flex:1 1 100%}.fcp-mini{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:10px 0;padding:10px;background:#183d4b;border:1px solid #508095;border-radius:10px;color:#fff}.fcp-mini label{display:flex;align-items:center;gap:8px;color:#fff!important}.fcp-mini select{max-width:260px;min-height:34px;background:#fff;color:#163345;border-radius:6px;padding:5px}.fcp-mini a{color:#ffdda2;text-decoration:underline}@media(max-width:760px){#fcProfessionalFrameStudio .fcp-grid{grid-template-columns:1fr}#fcProfessionalFrameStudio #fcpAssignments{grid-template-columns:1fr}}';css.textContent+='#fcProfessionalFrameStudio #fcpPlacement{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#fcProfessionalFrameStudio #fcpPlacement .fcp-check{display:flex;flex-direction:row;gap:9px;align-items:center;margin:4px 0;background:#234556;padding:8px;border-radius:7px}#fcProfessionalFrameStudio #fcpPlacement input{width:18px;height:18px;min-height:auto;accent-color:#f2bf77}';
document.head.append(css);
el("fcpFrame").onchange=e=>{active=e.target.value;fill();};
function chosenSections(){return [...panel.querySelectorAll('#fcpPlacement input:checked')].map(x=>x.value);}
async function formFrame(existing){
 const name=trim(el("fcpName").value);
 if(!name)throw Error("Frame နာမည် ထည့်ပါ။");
 const top=number(el("fcpTop").value,110),bottom=number(el("fcpBottom").value,75);
 if(top+bottom>650)throw Error("Banner နှစ်ခု အမြင့်များနေသည်။");
 const out={...existing,name,color:color(el("fcpColor").value),top,bottom,fit:el("fcpFit").value};
 if(el("fcpTopFile").files[0])out.topImage=await compress(el("fcpTopFile").files[0]);
 if(el("fcpBottomFile").files[0])out.bottomImage=await compress(el("fcpBottomFile").files[0]);
 return out;
}
function assignFrame(id,sections){
 for(const key of types){
  const had=state.placements[key].includes(id),need=sections.includes(key);
  state.placements[key]=state.placements[key].filter(x=>x!==id);
  if(need)state.placements[key].push(id);
  if(need&&!had)state.selected[key]=id;
  if(!need&&state.selected[key]===id)state.selected[key]="none";
 }
}
el("fcpAdd").onclick=async()=>{
 try{
  if(state.frames.length>=44)throw Error("Frame အများဆုံး ၄၄ မျိုးသာ ဖန်တီးနိုင်သည်");
  const sections=chosenSections();if(!sections.length)throw Error("ထည့်မည့် Section အနည်းဆုံးတစ်ခု ရွေးပါ။");
  const id="pro-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
  const template={id,name:"Frame အသစ်",color:"#244c75",top:110,bottom:75,fit:"contain",topImage:"",bottomImage:"",builtin:false};
  const frame=await formFrame(template);
  state.frames.push(frame);assignFrame(id,sections);
  for(const key of sections)state.selected[key]=id;
  await save();active=id;syncControls();
  status("Frame အသစ်ကို "+sections.map(x=>labels[x]).join("၊ ")+" Download ရွေးချယ်စာရင်းထဲ ထည့်ပြီးပါပြီ။");
 }catch(e){status(e.message,true);}
};
el("fcpSave").onclick=async()=>{const f=get(active);if(!f)return;try{
 const next=await formFrame(f);
 Object.assign(f,next);assignFrame(f.id,chosenSections());
 await save();syncControls();status("Frame ပြင်ဆင်ချက်နှင့် Section Download စာရင်းများ သိမ်းပြီးပါပြီ။");
}catch(e){status(e.message,true);}};
el("fcpRemoveTop").onclick=async()=>{get(active).topImage="";await save();fill();status("အပေါ် Banner ဖြုတ်ပြီး");};
el("fcpRemoveBottom").onclick=async()=>{get(active).bottomImage="";await save();fill();status("အောက် Banner ဖြုတ်ပြီး");};
el("fcpDelete").onclick=async()=>{const f=get(active);if(f.builtin||!confirm("ဤ Frame ဖျက်မလား?"))return;state.frames=state.frames.filter(x=>x.id!==active);for(const k of types){state.placements[k]=state.placements[k].filter(id=>id!==active);if(state.selected[k]===active)state.selected[k]="none";}await save();active="navy";syncControls();status("Frame ကို Download စာရင်းအားလုံးမှ ဖယ်ရှားပြီး");};
el("fcpReset").onclick=async()=>{const f=get(active),t=templates.find(x=>x.id===active);if(!t)return status("မူရင်း Template မဟုတ်ပါ",true);Object.assign(f,{...t});await save();syncControls();status("မူရင်း Frame ပြန်ထားပြီး");};
el("fcpBackup").onclick=downloadJson;
el("fcpImport").onchange=async e=>{try{const file=e.target.files[0];if(!file||file.size>100000000)throw Error("Backup ဖိုင် ကြီးလွန်းသည်");state=validate(JSON.parse(await file.text()));await save();active=state.frames[0].id;syncControls();status("Backup Import ပြီးပါပြီ");}catch(err){status(err.message,true);}finally{e.target.value="";}};
syncControls();mini();syncNative();
 for(const [section,selector] of [["previews","#fcMatchCustomFrame"],["specials","#fcSpecialCustomFrame"],["ai","#fcAiFrameStyle"],["news","#fcNewsCustomFrame"]]){
  attach(section,document.querySelector(selector));
 }
const obs=new MutationObserver(()=>mini());obs.observe(document.body,{childList:true,subtree:false});
const main=document.querySelector("main");if(main)obs.observe(main,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>ready.then(init),{once:true});else ready.then(init);
})();