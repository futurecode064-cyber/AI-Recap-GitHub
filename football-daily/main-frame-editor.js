"use strict";
/* Main-only Frame Studio. Nothing here writes to public odds JSON or the server. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!/^\/odds(?:\.html)?\/?$/.test(location.pathname))return;
 const designs=window.FutureCodeTableOddsFrames?.designs;if(!Array.isArray(designs))return;
 const originals=designs.map(d=>JSON.parse(JSON.stringify(d))),ids=new Set(originals.map(d=>d[0]));
 const blank=()=>({version:1,hidden:[],edited:{},custom:[],names:{}});
 let state=blank(),panel=null,selected="",pendingImage="",dateRendered="";
 const node=id=>panel?.querySelector("#"+id);
 const text=s=>String(s||"").trim().slice(0,95);
 const color=s=>/^#[0-9a-f]{6}$/i.test(s||"")?s:"#244c75";
 const numeric=(v,base=10)=>Number.isFinite(Number(v))?Math.max(0,Math.min(40,Number(v))):base;
 const say=(s,bad=false)=>{if(node("fcfeStatus")){node("fcfeStatus").textContent=s;node("fcfeStatus").style.color=bad?"#a52332":"#15593e";}};
 const storage="future-code-main-frame-studio-v1";
 function db(){return new Promise((ok,bad)=>{const r=indexedDB.open(storage,1);r.onupgradeneeded=()=>r.result.createObjectStore("frames");r.onerror=()=>bad(r.error);r.onsuccess=()=>ok(r.result);});}
 async function read(){const d=await db();return new Promise((ok,bad)=>{const t=d.transaction("frames"),r=t.objectStore("frames").get("settings");r.onsuccess=()=>ok(r.result||null);r.onerror=()=>bad(r.error);t.oncomplete=()=>d.close();});}
 async function save(){const d=await db();return new Promise((ok,bad)=>{const t=d.transaction("frames","readwrite");t.objectStore("frames").put(state,"settings");t.oncomplete=()=>{d.close();ok();};t.onerror=()=>bad(t.error);});}
 function sanitize(x){
  if(!x||typeof x!=="object")throw Error("Frame Backup မမှန်ပါ");
  const image=typeof x.image==="string"&&/^data:image\/(webp|png|jpeg);base64,/.test(x.image)&&x.image.length<1800000?x.image:"";
  return {name:text(x.name)||"New Frame",color:color(x.color),top:numeric(x.top,14),bottom:numeric(x.bottom,10),image};
 }
 function validImport(v){
  if(!v||v.version!==1||!Array.isArray(v.hidden)||!Array.isArray(v.custom)||!v.edited||!v.names||v.custom.length>40)throw Error("Frame Studio Backup v1 ဖိုင်မဟုတ်ပါ");
  const s=blank();s.hidden=v.hidden.filter(x=>typeof x==="string"&&x.length<100);
  for(const [id,edit] of Object.entries(v.edited))if(ids.has(id))s.edited[id]=sanitize(edit);
  s.custom=v.custom.filter(x=>/^custom-[a-z0-9-]{5,45}$/.test(x?.id||"")).map(x=>({id:x.id,...sanitize(x)}));
  for(const [dt,info] of Object.entries(v.names)){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(dt))continue;
   const n={leagues:{},rows:{}};
   for(const [key,val] of Object.entries(info.leagues||{}))if(key.length<150)n.leagues[key]=text(val);
   for(const [key,val] of Object.entries(info.rows||{}))if(key.length<150&&val&&typeof val==="object")n.rows[key]={home:text(val.home),away:text(val.away)};
   s.names[dt]=n;
  }
  return s;
 }
 function settingsFor(id){
  const original=originals.find(x=>x[0]===id);
  if(original)return state.edited[id]||{name:original[1],color:original[2],top:Math.round((original[3]?.top||0)*100),bottom:Math.round((original[3]?.bottom||0)*100),image:""};
  return state.custom.find(x=>x.id===id)||{name:"",color:"#244c75",top:14,bottom:10,image:""};
 }
 function designFor(id){
  const edit=state.edited[id],origin=originals.find(x=>x[0]===id),p=settingsFor(id);
  if(!origin&&!state.custom.some(x=>x.id===id))return null;
  if(origin&&!edit)return [...origin];
  const custom=!!p.image;
  const frame=custom||(!origin?false:!!origin[3]);
  return [id,p.name,p.color,frame?{top:p.top/100,bottom:p.bottom/100}:undefined,
    (p.image||!origin)?{image:p.image||""}:undefined];
 }
 function currentId(){return designs[Number(document.getElementById("tofDesign")?.value||0)]?.[0]||"";}
 function apply(want){
  const control=document.getElementById("tofDesign");
  const next=[...originals.map(d=>d[0]),...state.custom.map(p=>p.id)]
    .filter(id=>!state.hidden.includes(id)).map(designFor).filter(Boolean);
  if(!next.length){state.hidden=state.hidden.filter(x=>!ids.has(x));next.push([...originals[0]]);}
  designs.splice(0,designs.length,...next);
  control.replaceChildren();
  designs.forEach((d,i)=>control.add(new Option(d[1],String(i))));
  const pos=Math.max(0,designs.findIndex(d=>d[0]===(want||selected)));
  control.value=String(pos);selected=designs[pos][0];
  control.dispatchEvent(new Event("change"));
  if(node("fcfeCount"))node("fcfeCount").textContent="Frame "+designs.length+" မျိုး ရွေးနိုင်ပါသည်။";
  fill();
 }
 function fill(){
  if(!panel)return;
  selected=currentId();const p=settingsFor(selected);
  node("fcfeName").value=p.name;node("fcfeColor").value=color(p.color);
  node("fcfeTop").value=p.top;node("fcfeBottom").value=p.bottom;
  node("fcfeFile").value="";pendingImage="";
  if(selected==="colour"&&state.edited.colour){
    const theme=document.getElementById("tofColour"),picker=document.getElementById("tofCustom");
    if(theme&&picker){theme.value="custom";picker.value=p.color;theme.dispatchEvent(new Event("change"));}
  }
  node("fcfePicture").textContent=p.image?"Uploaded Frame ပုံ ရှိသည်":(originals.find(d=>d[0]===selected)?.[3]?"မူရင်း Frame ပုံ":"အရောင် Frame");
  node("fcfeRemove").textContent=ids.has(selected)?"Frame ကို ရွေးစရာထဲမှ ဖြုတ်မယ်":"ကိုယ်ပိုင် Frame ဖျက်မယ်";
  node("fcfeOriginal").hidden=!ids.has(selected);
 }
 function form(){
  const current=settingsFor(selected);
  const p={name:text(node("fcfeName").value),color:color(node("fcfeColor").value),top:numeric(node("fcfeTop").value,14),bottom:numeric(node("fcfeBottom").value,10),image:pendingImage||current.image||""};
  if(!p.name)throw Error("Frame နာမည် ထည့်ပါ။");
  if(p.top+p.bottom>70)throw Error("အပေါ်/အောက် ပုံအပိုင်း စုစုပေါင်း 70% ထက် မကျော်ရပါ။");
  return p;
 }
 async function finish(id,message){try{await save();apply(id);say(message);}catch(e){say("Browser မှာ မသိမ်းနိုင်ပါ: "+e.message,true);}}
 async function upload(file){
  if(!file)return "";
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8000000)throw Error("JPG/PNG/WEBP 8MB အောက်ကိုသာ ထည့်ပါ။");
  const url=URL.createObjectURL(file);
  try{
   const img=await new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(Error("Frame ပုံဖတ်မရပါ"));i.src=url;});
   if(img.naturalWidth<200||img.naturalHeight<100)throw Error("Frame ပုံ 200×100 px ထက်ကြီးပါစေ။");
   const r=Math.min(1,1600/img.naturalWidth,2400/img.naturalHeight),c=document.createElement("canvas");
   c.width=Math.round(img.naturalWidth*r);c.height=Math.round(img.naturalHeight*r);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
   let data=c.toDataURL("image/webp",.82);if(!data.startsWith("data:image/webp"))data=c.toDataURL("image/jpeg",.75);
   if(data.length>1800000)throw Error("ပုံအရွယ်အစား ကြီးလွန်းသည်။ အရွယ်လျှော့ပါ။");
   return data;
  }finally{URL.revokeObjectURL(url);}
 }
 function dataset(){return typeof loadedSheet!=="undefined"?loadedSheet:null;}
 function namesFor(date){const n=state.names[date]||{leagues:{},rows:{}};return {leagues:{...n.leagues},rows:{...n.rows}};}
 window.FutureCodeFrameEditor=Object.freeze({exportNames:namesFor,getFrames:()=>designs.map(x=>x[0])});
 function names(){
  const sheet=dataset(),host=node("fcfeNames");
  if(!sheet?.matches?.length||!host)return;
  if(dateRendered===sheet.reportDate&&host.childElementCount)return;
  dateRendered=sheet.reportDate;host.replaceChildren();
  const n=state.names[sheet.reportDate] ||= {leagues:{},rows:{}};
  for(const league of new Set(sheet.matches.map(x=>x.league))){
   const item=document.createElement("label"),input=document.createElement("input");
   item.className="fcfe-league";input.type="text";input.maxLength=95;
   input.value=n.leagues[league]||sheet.matches.find(x=>x.league===league).leagueDisplay||league;
   const heading=document.createElement("b");heading.textContent="လိဂ် — "+league;
   input.setAttribute("aria-label",league+" PNG လိဂ်အမည်");
   input.addEventListener("change",async()=>{const val=text(input.value);if(val)n.leagues[league]=val;else delete n.leagues[league];try{await save();say("လိဂ်နာမည် သိမ်းပြီး");}catch(e){say(e.message,true);}});
   item.append(heading,input);host.appendChild(item);
  }
  for(const m of sheet.matches){
   const id=m.fixtureId||m.league+"|"+m.home+"|"+m.away;
   const row=document.createElement("div");row.className="fcfe-row";
   const label=document.createElement("span");label.textContent=(m.number||m.pdfRow||"")+" · "+(m.kickoff||"")+" · "+m.league;
   const inputA=document.createElement("input"),inputB=document.createElement("input");
   inputA.type=inputB.type="text";inputA.maxLength=inputB.maxLength=95;
   inputA.value=n.rows[id]?.home||m.home;inputB.value=n.rows[id]?.away||m.away;
   inputA.setAttribute("aria-label",m.home+" PNG အမည်");inputB.setAttribute("aria-label",m.away+" PNG အမည်");
   const commit=async()=>{
    const home=text(inputA.value)||m.home,away=text(inputB.value)||m.away;
    if(home===m.home&&away===m.away)delete n.rows[id];else n.rows[id]={home,away};
    try{await save();say("အသင်းနာမည် သိမ်းပြီး");}catch(e){say(e.message,true);}
   };
   inputA.addEventListener("change",commit);inputB.addEventListener("change",commit);
   row.append(label,inputA,inputB);host.appendChild(row);
  }
 }
 function downloadBackup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="future-code-frame-studio-backup.json";
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 }
 function init(){
  const target=document.getElementById("mainTableOddsFrames");if(!target)return;
  panel=document.createElement("section");panel.id="futureCodeFrameEditor";
  panel.innerHTML=`<h3>Frame Manager — Frame အသစ်ထည့် / ပြင် / ဖြုတ်</h3>
  <p>JPG/PNG Frame ပုံတင်နိုင်ပြီး အရောင်၊ Frame အပေါ်/အောက် ပုံအပိုင်းကို စိတ်ကြိုက်သတ်မှတ်နိုင်ပါတယ်။ ပြင်ထားတာတွေက ဒီ Browser ထဲမှာပဲ သိမ်းပါတယ်။ တခြားဖုန်း/ကွန်ပျူတာသို့ ပြောင်းဖို့ Backup Download / Import သုံးပါ။</p>
  <div class="fcfe-grid">
   <label>Frame နာမည်<input id="fcfeName" maxlength="70" type="text"></label>
   <label>Frame အရောင်<input id="fcfeColor" type="color"></label>
   <label>Frame ပုံအသစ် <input id="fcfeFile" type="file" accept="image/jpeg,image/png,image/webp"><small id="fcfePicture"></small></label>
   <label>အပေါ် Frame ပုံနေရာ (%)<input id="fcfeTop" type="number" min="0" max="40"></label>
   <label>အောက် Frame ပုံနေရာ (%)<input id="fcfeBottom" type="number" min="0" max="40"></label>
  </div>
  <div class="fcfe-actions">
   <button id="fcfeAdd">+ Frame အသစ်ထည့်</button><button id="fcfeSave">ရွေးထားတဲ့ Frame ပြင်သိမ်း</button>
   <button id="fcfeRemove">Frame ဖြုတ်</button><button id="fcfeOriginal">မူရင်း Frame ပြန်ထား</button>
   <button id="fcfeUnhide">ဖြုတ်ထားတဲ့ မူရင်း Frame များ ပြန်ဖော်</button>
  </div><p id="fcfeCount"></p>
  <div class="fcfe-actions"><button id="fcfeBackup">Frame Settings Backup Download</button><label>Backup Import<input id="fcfeImport" type="file" accept=".json,application/json"></label></div>
  <details><summary><b>Download ပုံထဲ လိဂ်နာမည် / အသင်းနာမည် ပြင်မယ်</b></summary>
   <p>စာပြင်ပြီး အကွက်အပြင်ကို နှိပ်ပါ။ Preview/Download PNG/ZIP ထဲမှာသာ ပြောင်းပါမယ်။ မူရင်း Website ပေါက်ကြေး Data မပြောင်းပါ။</p>
   <div id="fcfeNames"></div><button id="fcfeResetNames">ယနေ့ PNG နာမည်များ မူရင်းပြန်ထား</button>
  </details><p id="fcfeStatus" role="status" aria-live="polite"></p>`;
  const style=document.createElement("style");style.textContent=`
   #futureCodeFrameEditor{margin:18px 0;padding:20px;border:1px solid #abc1d0;border-radius:12px;background:#fff;color:#142c43}
   #futureCodeFrameEditor h3{font-size:20px}#futureCodeFrameEditor p{font-size:13px;line-height:1.8}
   #futureCodeFrameEditor .fcfe-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:13px}
   #futureCodeFrameEditor label{font-size:13px;font-weight:700;display:flex;flex-direction:column;gap:7px}
   #futureCodeFrameEditor input[type=text],#futureCodeFrameEditor input[type=number],#futureCodeFrameEditor input[type=file]{width:100%;box-sizing:border-box;padding:8px;border:1px solid #a9bac6;border-radius:7px;color:#1c3448;font:inherit}
   #futureCodeFrameEditor input[type=color]{height:42px;width:100%}
   #futureCodeFrameEditor button{border:0;border-radius:8px;background:#17457e;color:#fff;font:700 12px/1.8 "Noto Sans Myanmar",sans-serif;cursor:pointer;padding:11px 13px}
   #futureCodeFrameEditor #fcfeRemove{background:#a12632}
   #futureCodeFrameEditor .fcfe-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:12px 0}
   #futureCodeFrameEditor .fcfe-actions label{padding:7px;border:1px solid #aac0ce;border-radius:8px}
   #futureCodeFrameEditor details{border-top:1px solid #c4d1da;margin-top:18px;padding:16px 0}
   #futureCodeFrameEditor summary{cursor:pointer}
   #futureCodeFrameEditor .fcfe-league{background:#ecf3f8;padding:8px;margin:7px 0}
   #futureCodeFrameEditor .fcfe-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #e6edf2}
   #futureCodeFrameEditor .fcfe-row span{font-size:12px}
   @media(max-width:620px){#futureCodeFrameEditor .fcfe-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  target.querySelector("#tofOutput")?.before(panel);
  document.getElementById("tofDesign").addEventListener("change",fill);
  node("fcfeFile").addEventListener("change",async e=>{
   try{pendingImage=await upload(e.target.files[0]);node("fcfePicture").textContent="Frame ပုံအသစ် ရွေးပြီး။ သိမ်းရန် ခလုတ်နှိပ်ပါ။";}
   catch(err){pendingImage="";say(err.message,true);}
  });
  node("fcfeAdd").onclick=async()=>{
   try{if(state.custom.length>=40)throw Error("Frame အများဆုံး ၄၀ မျိုး");const p={...form(),image:pendingImage||""};
    const id="custom-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
    state.custom.push({id,...p});await finish(id,"Frame အသစ် ထည့်သွင်းပြီးပါပြီ။");
   }catch(e){say(e.message,true);}
  };
  node("fcfeSave").onclick=async()=>{try{const id=currentId(),p=form();if(ids.has(id))state.edited[id]=p;else Object.assign(state.custom.find(x=>x.id===id),p);await finish(id,"Frame ပြင်ဆင်ပြီးပါပြီ။");}catch(e){say(e.message,true);}};
  node("fcfeRemove").onclick=async()=>{const id=currentId();if(ids.has(id))state.hidden.push(id);else state.custom=state.custom.filter(x=>x.id!==id);await finish("","Frame ရွေးစရာထဲမှ ဖြုတ်ပြီးပါပြီ။");};
  node("fcfeOriginal").onclick=async()=>{const id=currentId();delete state.edited[id];await finish(id,"မူရင်း Frame ပြန်ထားပြီးပါပြီ။");};
  node("fcfeUnhide").onclick=async()=>{state.hidden=[];await finish(currentId(),"မူရင်း Frame များ ပြန်ပေါ်ပါပြီ။");};
  node("fcfeBackup").onclick=downloadBackup;
  node("fcfeImport").onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>12000000)throw Error("Backup ဖိုင် ကြီးလွန်းပါသည်");state=validImport(JSON.parse(await file.text()));await finish("","Backup Import ပြီးပါပြီ။");dateRendered="";names();}catch(err){say(err.message,true);}e.target.value="";};
  node("fcfeResetNames").onclick=async()=>{const dt=dataset()?.reportDate;if(!dt)return;delete state.names[dt];dateRendered="";node("fcfeNames").replaceChildren();await save();names();say("ယနေ့ PNG နာမည်တွေ ပြန်ထားပြီး။");};
  apply();const watch=setInterval(()=>{if(dataset()?.matches?.length){clearInterval(watch);names();}},250);setTimeout(()=>clearInterval(watch),30000);
 }
 async function boot(){
  try{const previous=await read();if(previous)state=validImport(previous);}catch(e){console.warn("Frame Studio browser storage blocked",e);}
  init();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();