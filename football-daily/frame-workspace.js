"use strict";
(function(){
const $=id=>document.getElementById(id);
const SECTION={odds:"ပေါက်ကြေး",previews:"ပွဲကြိုသုံးသပ်ချက်",specials:"Special Choice",results:"ဂိုးရလဒ်",ai:"AI ခန့်မှန်းချက်",news:"ဘောလုံးသတင်း"},TYPES=Object.keys(SECTION);
const home=$("engineHome"),odds=$("engineOdds"),DB="future-code-professional-frame-studio-v2";
const IDS=["navy","gold","red","green","odds-best","odds-htet","odds-ggoal","odds-hyper-goal","odds-kmm","odds-special-one","odds-the-freedom","odds-bcf","odds-final-goal","odds-ko-chan","odds-team-pmm","odds-thuta","odds-ymc","odds-ko-tut-pi","odds-khin-khin-htar","preview-bcf","preview-daily","preview-final","preview-ggoal","preview-ko","preview-pmm","preview-htet","results-best","results-htet","results-kotwat","ai-best","ai-final","ai-special","news-journal","special-choice"];
let state=null,currentId="",isNew=false,working=false,published=null,oddsData=null,archive=null,news=null,date="",savedURL=null;
const copy=o=>JSON.parse(JSON.stringify(o)),str=x=>String(x??"").trim();
const goodColor=x=>/^#[\da-f]{6}$/i.test(x||"")?x:"#16486c";

const layoutOptions={
 odds:[["two","ပွဲအားလုံး ၂ ပုံခွဲ"],["one","ပွဲအားလုံး ၁ ပုံတည်း"],["league","လိဂ်တစ်ခုလျှင် တစ်ပုံ"]],
 previews:[["one","တစ်ပွဲတစ်ပုံ"],["two","၂ ပွဲ တစ်ပုံ"]],
 specials:[["one","တစ်ပွဲတစ်ပုံ"],["two","၂ ပွဲ တစ်ပုံ"]],
 results:[["one","ပွဲအားလုံး တစ်ပုံ"],["two","ပွဲအားလုံး ၂ ပုံ"],["league","လိဂ်တစ်ခုလျှင် တစ်ပုံ"]],
 ai:[["one","AI ဇယား တစ်ပုံ"],["two","AI ဇယား ၂ ပုံ"],["league","လိဂ်တစ်ခုလျှင် တစ်ပုံ"]],
 news:[["one","တစ်ပုဒ်တစ်ပုံ"],["two","သတင်း ၂ ပုဒ် တစ်ပုံ"]]
};
const layoutDefaults={odds:"two",previews:"one",specials:"one",results:"one",ai:"one",news:"one"};
let sectionLayouts={...layoutDefaults};
try{const from=JSON.parse(localStorage.getItem("fc-frame-section-layout-v1")||"{}");for(const k of TYPES)if(layoutOptions[k].some(opt=>opt[0]===from[k]))sectionLayouts[k]=from[k];}catch(e){console.warn("Frame layouts read",e);}
function initSectionLayouts(){
 const host=$("sectionLayoutSettings");if(!host)return;host.replaceChildren();
 for(const k of TYPES){
  const label=document.createElement("label"),select=document.createElement("select");
  label.textContent=SECTION[k];select.dataset.frameSection=k;
  for(const [value,title] of layoutOptions[k])select.add(new Option(title,value));
  select.value=sectionLayouts[k];
  select.onchange=()=>{sectionLayouts[k]=select.value;localStorage.setItem("fc-frame-section-layout-v1",JSON.stringify(sectionLayouts));status(SECTION[k]+" PNG ပုံခွဲပုံစံ သိမ်းပြီး");};
  label.append(select);host.append(label);
 }
}

const frames=()=>state?.frames||[];
const frame=id=>frames().find(f=>f.id===id);
const assigned=(id,k)=>state.placements[k]?.includes(id);
const used=id=>TYPES.filter(k=>assigned(id,k));
const status=(msg,error=false)=>{const e=$("status");e.textContent=msg;e.dataset.error=error?"1":"0";};
async function waitFor(check,timeout=60000){const start=Date.now();for(;;){try{const x=check();if(x)return x;}catch{}if(Date.now()-start>timeout)throw Error("Frame Export Engine မဖွင့်နိုင်ပါ။ Internet ပြန်စစ်ပြီး Refresh လုပ်ပါ။");await new Promise(r=>setTimeout(r,200));}}
const dbOpen=()=>new Promise((ok,bad)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("config"))r.result.createObjectStore("config");};r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error);});
async function dbRead(){const d=await dbOpen();return new Promise((ok,bad)=>{const t=d.transaction("config"),r=t.objectStore("config").get("main");r.onsuccess=()=>ok(r.result||null);r.onerror=()=>bad(r.error);t.oncomplete=()=>d.close();});}
async function dbWrite(value){const d=await dbOpen();return new Promise((ok,bad)=>{const t=d.transaction("config","readwrite");t.objectStore("config").put(copy(value),"main");t.oncomplete=()=>{d.close();ok();};t.onerror=()=>bad(t.error);});}
function normalize(){
 if(!state||state.version!==2||!Array.isArray(state.frames))state={version:2,frames:[],selected:{},placements:{}};
 const w=home.contentWindow;
 for(const id of IDS)if(!frame(id)){const original=w.FutureCodeProfessionalFrames.getFrame(id);if(original)state.frames.push(original);}
 if(state.frames.length>130)throw Error("Frame အရေအတွက် ၁၃၀ ကျော်ပါသည်။");
 for(const k of TYPES){state.placements[k]=[...new Set((Array.isArray(state.placements[k])?state.placements[k]:[]).filter(id=>!!frame(id)))];
  if(!assigned(state.selected[k],k))state.selected[k]="none";}
}
function migrateAssignments(){
 if(localStorage.getItem("fc-workspace-assignments-v1"))return false;
 let changed=false;
 for(const f of frames()){const k=f.id.startsWith("odds-")?"odds":f.id.startsWith("preview-")?"previews":f.id.startsWith("results-")?"results":f.id.startsWith("ai-")?"ai":f.id==="news-journal"?"news":f.id==="special-choice"?"specials":null;
  if(k&&!assigned(f.id,k)){state.placements[k].push(f.id);changed=true;}}
 localStorage.setItem("fc-workspace-assignments-v1","yes");return changed;
}
async function readyEngines(){
 await waitFor(()=>home.contentWindow?.FutureCodeProfessionalFrames?.ready&&home.contentWindow?.FutureCodeFramePreview?.render&&home.contentWindow?.FutureCodeResultsFrames?.makePng&&home.contentWindow?.FutureCodeAiBulkExport?.renderBlob);
 await home.contentWindow.FutureCodeProfessionalFrames.ready;
 await waitFor(()=>odds.contentWindow?.FutureCodeProfessionalFrames?.ready&&odds.contentWindow?.FutureCodeTableOddsFrames?.draw&&odds.contentWindow?.FutureCodeFrameEditor?.getOddsSheet);
 await odds.contentWindow.FutureCodeProfessionalFrames.ready;
}
function reloadOne(el){return new Promise(ok=>{el.addEventListener("load",ok,{once:true});const u=new URL(el.src,location.href);u.searchParams.set("workspaceReload",String(Date.now()));el.src=u.href;});}
async function save(message){if(working)throw Error("Download ဆောင်ရွက်နေချိန် Frame မပြင်ပါနှင့်။");normalize();await dbWrite(state);
 await Promise.all([reloadOne(home),reloadOne(odds)]);await readyEngines();
 state=await dbRead();normalize();renderList();renderEditor();renderExportControls();status(message||"Frame Settings သိမ်းပြီးပါပြီ။");}
async function dataFetch(url){
 const w=home.contentWindow,reader=w.FootballData?.fetch||w.fetch.bind(w);
 const r=await reader(new URL(url,w.document.baseURI).href,{cache:"no-store"});if(!r.ok)throw Error(url+" HTTP "+r.status);return r.json();
}
async function loadData(){
 const data=await dataFetch("./data/today.json");
 if(!data?.published||!Array.isArray(data.matches))throw Error("Published ပွဲစာရင်း မရှိသေးပါ။");
 published=data;date=data.reportDate;
 await home.contentWindow.FutureCodeTipScores?.load(date,(home.contentWindow.FootballData?home.contentWindow.FootballData.fetch:home.contentWindow.fetch.bind(home.contentWindow)));
 oddsData=odds.contentWindow.FutureCodeFrameEditor.getOddsSheet();
 if(!oddsData?.matches?.length){try{await waitFor(()=>odds.contentWindow.FutureCodeFrameEditor.getOddsSheet()?.matches?.length,15000);oddsData=odds.contentWindow.FutureCodeFrameEditor.getOddsSheet();}catch(e){console.warn("Odds data not ready",e);}}
 const yesterday=home.contentWindow.FutureCodeResultsFrames.yesterdayYangon();
 await Promise.all([
  dataFetch("./data/archive/"+yesterday+".json").then(x=>{archive=x.published?x:{matches:[]};}).catch(()=>{archive={matches:[]};}),
  dataFetch("./data/news/latest.json").then(x=>{news=x;}).catch(()=>{news={items:[]};})
 ]);
 $("reportDate").textContent=date+" · ပွဲ "+data.matches.length;
}
const rawData=k=>k==="odds"?(oddsData?.matches||[]):k==="results"?(archive?.matches||[]).filter(m=>m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(m.finalScore||"")):k==="news"?(news?.items||[]):k==="specials"?(published?.matches||[]).filter(m=>m.specialChoice===true||m.specialAnalysisParagraphs?.length):(published?.matches||[]);
const matchId=m=>m.fixtureId||m.id||m.home+"-"+m.away;
const matchLabel=m=>m.title||((m.homeDisplay||m.home||"")+" VS "+(m.awayDisplay||m.away||""));
function showList(){
 const k=$("librarySection").value,q=str($("search").value).toLowerCase(),host=$("frameList");host.replaceChildren();
 for(const f of frames())if((k==="all"||assigned(f.id,k))&&(!q||(f.name+" "+f.id).toLowerCase().includes(q))){
  const row=document.createElement("button");row.className="frame-row"+(f.id===currentId?" active":"");
  const color=document.createElement("i");color.className="swatch";color.style.background=goodColor(f.color);
  const details=document.createElement("span"),title=document.createElement("strong"),tags=document.createElement("small");
  title.textContent=f.name;tags.textContent=used(f.id).map(s=>SECTION[s]).join(" · ")||"Section မသတ်မှတ်ရသေး";
  details.append(title,tags);row.append(color,details);row.onclick=()=>select(f.id);host.append(row);
 }
 $("frameCount").textContent=String(host.childElementCount);
}
function realPreview(id){
 const w=home.contentWindow,sel=w.document.getElementById("fcpFrame"),c=w.document.getElementById("fcpPreview");
 if(!sel||!c||!id)return;
 sel.value=id;sel.dispatchEvent(new w.Event("change"));
 setTimeout(()=>{if(currentId!==id||isNew)return;try{
  const url=c.toDataURL("image/png");if(url.length<6000)return;
  $("previewImage").src=url;$("previewImage").hidden=false;$("previewMock").hidden=true;
 }catch(e){console.warn("Frame preview fallback",e);}},900);
}
function showEditor(){
 const f=frame(currentId);$("emptyFrame").hidden=!!f||isNew;$("editorForm").hidden=!(f||isNew);
 if(!f&&!isNew)return;
 const v=f||{name:"Frame အသစ်",color:"#194b75",top:110,bottom:75,fit:"contain",topImage:"",bottomImage:""};
 $("frameName").value=v.name;$("frameColor").value=goodColor(v.color);
 $("frameTop").value=v.top;$("frameBottom").value=v.bottom;$("frameFit").value=v.fit;
 $("frameTopFile").value=$("frameBottomFile").value="";
 $("topFileState").textContent=v.topImage?"ကိုယ်ပိုင်ပုံ ရှိသည်":"မူရင်း Banner / အရောင်";
 $("bottomFileState").textContent=v.bottomImage?"ကိုယ်ပိုင်ပုံ ရှိသည်":"မူရင်း Banner / အရောင်";
 $("scopeChecks").replaceChildren();
 for(const k of TYPES){
  const label=document.createElement("label"),input=document.createElement("input");
  label.className="scope";input.type="checkbox";input.value=k;input.checked=!!f&&assigned(f.id,k);
  label.append(input,document.createTextNode(SECTION[k]));$("scopeChecks").append(label);
 }
 $("deleteFrame").hidden=!f||f.builtin;
 $("unassignFrame").hidden=!f;
 $("saveFrame").textContent=isNew?"＋ Frame အသစ် ထည့်သွင်းမယ်":"ပြင်ဆင်ချက် သိမ်းမယ်";
 const p=$("previewMock");p.style.setProperty("--frame-color",goodColor(v.color));p.querySelector(".sample-name").textContent=v.name;
 $("previewImage").hidden=true;p.hidden=false;if(f&&!isNew)realPreview(f.id);
}
function select(id){currentId=id;isNew=false;showList();showEditor();}
function renderList(){showList();}
function renderEditor(){showEditor();}
async function compress(file){
 if(!file)return null;
 if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8000000)throw Error("PNG/JPG/WEBP 8MB အောက်သာ ရွေးပါ။");
 const img=await createImageBitmap(file);
 if(img.width<250||img.height<40){img.close();throw Error("Banner အနည်းဆုံး 250×40 px ဖြစ်ရပါမည်။");}
 const ratio=Math.min(1,1800/img.width,500/img.height);
 const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*ratio));c.height=Math.max(1,Math.round(img.height*ratio));
 c.getContext("2d").drawImage(img,0,0,c.width,c.height);img.close();
 const data=c.toDataURL("image/webp",.77);if(data.length>=1500000)throw Error("ပုံအရွယ်အစား ကြီးလွန်းနေသည်။");return data;
}
async function submit(){
 if(working)return;
 const prior=frame(currentId),fresh=isNew;
 if(!fresh&&!prior)throw Error("Frame ရွေးပါ။");
 const name=str($("frameName").value).slice(0,70),top=Number($("frameTop").value),bottom=Number($("frameBottom").value);
 if(!name)throw Error("Frame နာမည်ထည့်ပါ။");
 if(!Number.isFinite(top)||!Number.isFinite(bottom)||top<0||bottom<0||top>360||bottom>360||top+bottom>650)throw Error("Banner အမြင့် မမှန်ပါ။");
 if(fresh&&frames().length>=130)throw Error("Frame ၁၃၀ မျိုး ပြည့်နေပါပြီ။");
 const topImage=await compress($("frameTopFile").files[0]),bottomImage=await compress($("frameBottomFile").files[0]);
 const id=fresh?"pro-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7):prior.id;
 const item={...(prior||{id,builtin:false,topImage:"",bottomImage:""}),name,color:goodColor($("frameColor").value),fit:$("frameFit").value==="cover"?"cover":"contain",top:Math.round(top),bottom:Math.round(bottom)};
 if(topImage!==null)item.topImage=topImage;if(bottomImage!==null)item.bottomImage=bottomImage;
 const scopes=[...$("scopeChecks").querySelectorAll("input:checked")].map(x=>x.value);
 if(fresh)state.frames.push(item);else Object.assign(prior,item);
 for(const k of TYPES){
  state.placements[k]=state.placements[k].filter(x=>x!==id);
  if(scopes.includes(k))state.placements[k].push(id);
  if(!scopes.includes(k)&&state.selected[k]===id)state.selected[k]="none";
  if(scopes.includes(k)&&state.selected[k]==="none")state.selected[k]=id;
 }
 isNew=false;currentId=id;await save(name+" ပြင်ဆင်ချက် သိမ်းပြီး။ Section Filter နှင့် Download တွေမှာ ပြောင်းလဲပြီး။");
}
function resetBanner(field){const f=frame(currentId);if(!f)return;f[field]="";save("Banner ပုံဖြုတ်ပြီး။").catch(e=>status(e.message,true));}
function exportState(){const text=JSON.stringify(state,null,2),blob=new Blob([text],{type:"application/json"});
 const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download="future-code-frame-editor-backup.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
async function importState(file){
 if(!file||file.size>14000000)throw Error("JSON Backup 14MB အောက်လိုပါသည်။");
 const v=JSON.parse(await file.text());if(v?.version!==2||!Array.isArray(v.frames)||v.frames.length>130||!v.placements||!v.selected)throw Error("Frame Studio Backup v2 မဟုတ်ပါ။");
 const seen=new Set();
 for(const f of v.frames){if(!f||!(/^[a-z0-9-]{2,60}$/.test(f.id))||seen.has(f.id)||!/^#[\da-f]{6}$/i.test(f.color||"")||String(f.topImage||"").length>=1500000||String(f.bottomImage||"").length>=1500000)throw Error("Frame Backup မမှန်ပါ");seen.add(f.id);}
 state=v;normalize();currentId=state.frames[0]?.id||"";await save("Backup Import ပြီးပါပြီ။");
}
function renderExportControls(){
 const section=$("downSection").value,host=$("downFrame"),old=host.value;
 host.replaceChildren(new Option("သတ်မှတ်ထားသော Frame အားလုံး","all"));
 for(const f of frames().filter(x=>section==="all"?used(x.id).length:assigned(x.id,section)))host.add(new Option(f.name,f.id));
 host.value=[...host.options].some(x=>x.value===old)?old:"all";
 const amount=TYPES.reduce((n,k)=>n+state.placements[k].length,0);
 $("assignmentCount").textContent=amount+" Section/Frame တွဲဖက်မှု ရှိပါသည်။";
 renderLeagueFilter();
}
function renderLeagueFilter(){
 const k=$("downSection").value,host=$("leagueFilter"),old=host.value;
 host.replaceChildren(new Option("အားလုံး","all"));
 if(k!=="all")for(const value of new Set(rawData(k).map(m=>m.league||m.category).filter(Boolean)))host.add(new Option(value,value));
 host.value=[...host.options].some(x=>x.value===old)?old:"all";
 renderMatchFilter();
}
function renderMatchFilter(){
 const k=$("downSection").value,host=$("matchFilter"),old=host.value;
 host.replaceChildren(new Option("အားလုံး","all"));
 if(k!=="all")for(const m of rawData(k).filter(m=>$("leagueFilter").value==="all"||(m.league||m.category)===$("leagueFilter").value))host.add(new Option(matchLabel(m),matchId(m)));
 host.value=[...host.options].some(x=>x.value===old)?old:"all";
}
const combos=()=>{
 const k=$("downSection").value,id=$("downFrame").value;
 return (k==="all"?TYPES:[k]).flatMap(section=>state.placements[section].filter(x=>id==="all"||x===id).map(x=>({section,frame:frame(x)})).filter(x=>x.frame));
};
function filtered(k){
 const all=rawData(k);
 // Mixed all-section ZIP has per-section records and no cross-section league filters.
 if($("downSection").value==="all")return all;
 return all.filter(m=>($("leagueFilter").value==="all"||(m.league||m.category)===$("leagueFilter").value)&&($("matchFilter").value==="all"||matchId(m)===$("matchFilter").value));
}
function setWorking(value){working=value;$("progressWrap").hidden=!value;
 document.querySelectorAll("button").forEach(e=>e.disabled=value);}
function publishBlob(blob,filename){
 if(savedURL)URL.revokeObjectURL(savedURL);savedURL=URL.createObjectURL(blob);
 const a=$("downloadLink");a.hidden=false;a.href=savedURL;a.download=filename;a.textContent="⬇ "+filename+" ("+Math.ceil(blob.size/1024)+" KB)";a.click();
}
function tab(which){
 const lib=which==="library";$("navLibrary").classList.toggle("active",lib);$("navDownloads").classList.toggle("active",!lib);
 $("libraryView").hidden=!lib;$("downloadsView").hidden=lib;
 if(!lib)renderExportControls();
}
window.FCStudio=Object.freeze({
 TYPES,SECTION,getState:()=>state,getHome:()=>home.contentWindow,getOdds:()=>odds.contentWindow,
 getReport:()=>published,getOddsData:()=>oddsData,getArchive:()=>archive,getNews:()=>news,getDate:()=>date,
 combos,filtered,status,setWorking,publishBlob,loadData,readyEngines,getSectionLayout:k=>sectionLayouts[k]||"one"
});
$("navLibrary").onclick=()=>tab("library");$("navDownloads").onclick=()=>tab("downloads");$("toDownloads").onclick=()=>tab("downloads");
$("search").oninput=renderList;$("librarySection").onchange=renderList;
 $("frameColor").oninput=()=>{$("previewMock").style.setProperty("--frame-color",goodColor($("frameColor").value));};
 $("frameName").oninput=()=>{$("previewMock").querySelector(".sample-name").textContent=$("frameName").value;};
$("addFrame").onclick=()=>{isNew=true;currentId="";renderList();renderEditor();};
$("saveFrame").onclick=async()=>{try{await submit();}catch(e){status("Save မရပါ — "+e.message,true);}};
$("unassignFrame").onclick=async()=>{if(!currentId)return;try{for(const k of TYPES){state.placements[k]=state.placements[k].filter(x=>x!==currentId);if(state.selected[k]===currentId)state.selected[k]="none";}await save("Frame ကို Section အားလုံးမှ ဖြုတ်ထားပြီး။ မူရင်းပုံ မဖျက်ထားပါ။");}catch(e){status(e.message,true);}};
$("deleteFrame").onclick=async()=>{const f=frame(currentId);if(!f||f.builtin||!confirm(f.name+" ကို အပြီးဖျက်မလား?"))return;
 try{state.frames=state.frames.filter(x=>x.id!==f.id);for(const k of TYPES){state.placements[k]=state.placements[k].filter(x=>x!==f.id);if(state.selected[k]===f.id)state.selected[k]="none";}currentId=state.frames[0]?.id||"";await save("ကိုယ်ပိုင် Frame ဖျက်ပြီး");}catch(e){status(e.message,true);}};
$("removeTop").onclick=()=>resetBanner("topImage");$("removeBottom").onclick=()=>resetBanner("bottomImage");
$("backup").onclick=exportState;$("importBackup").onchange=async e=>{try{await importState(e.target.files[0]);}catch(x){status(x.message,true);}e.target.value="";};
$("downSection").onchange=renderExportControls;$("leagueFilter").onchange=renderMatchFilter;
$("refreshData").onclick=async()=>{try{await loadData();renderExportControls();status("Published Data ပြန်ရယူပြီး။");}catch(e){status(e.message,true);}};
(async()=>{try{
 initSectionLayouts();
 status("မူလ Website Export Engine နှစ်ခု ဖွင့်နေသည်…");await readyEngines();
 state=await dbRead();normalize();if(migrateAssignments())await dbWrite(state);
 await loadData().catch(e=>{status("Data တချို့ မရသေးပါ — "+e.message,true);});
 currentId=state.frames[0]?.id||"";renderList();renderEditor();renderExportControls();status("Frame Editor အဆင်သင့် — မူရင်း Frame နှင့် Data မဖျက်ထားပါ။");
 }catch(e){console.error("Frame Editor",e);status("Frame Editor ဖွင့်မရပါ — "+e.message,true);}})();
const script=document.createElement("script");script.src="./frame-export-engine.js?v=20261028-workspace-v1";document.head.append(script);
})();