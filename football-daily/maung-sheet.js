"use strict";
(()=>{
const $=id=>document.getElementById(id);
const firstDate="2026-11-13";
const sample=[
["7:30 PM","1+70","ကိုမိုရိုစ်","ကွန်ဂို","2=","Africa Cup",false],
["7:30 PM","1+30","ဆီနီဂေါ","ဘူရွန်ဒီ","CLOSE","〃",false],
["7:30 PM","1+30","မိုဇမ်ဘစ်","အီသီယိုးပီးယား","2-50","〃",false],
["10:30 PM","-30","တူရကီ U21","ချက် U21","2-50","EURO U21",false],
["10:30 PM","2+60","ဂါဘွန်","လီဆိုသို","3+90","Africa Cup",false],
["10:30 PM","2+90","တောင်အာဖရိက","ကင်ညာ","CLOSE","〃",false],
["10:30 PM","1+20","ဘာကီနာဖာဆို","မော်ရီတေးနီးယား","CLOSE","〃",false],
["10:30 PM","1-60","တူနီးရှား","လစ်ဗျား","CLOSE","〃",false],
["10:30 PM","2+80","ကာပိုဗာဒီ","လိုင်ဘေးရီးယား","2-100","〃",false],
["10:30 PM","2+30","နိုင်ဂျီးရီးယား","တန်ဇန်းနီးယား","3+40","〃",false],
["10:45 PM","L-100","ပိုလန် U21","အိုင်ယာလန် U21","2-70","〃",false],
["11:30 PM","-20","မော်ဒိုဗာ","ကာဇက်စတန်","CLOSE","Nations LG",false],
["12:00 AM","-60","နယ်သာလန် U21 *","ဒိန်းမတ် U21","3+70","EURO U21",true],
["12:30 AM","-70","ပွန်ဖာရာဒီနာ","ကာစီရို","CLOSE","Spain RFEF",false],
["1:30 AM","1-10","ဒီဂျွန်","အော်လန်း","CLOSE","France Cup",false],
["1:30 AM","1-80","မာလီ","ရဝမ်ဒါ","2-50","Africa Cup",false],
["2:00 AM","-30","လီဂါနက်","ဘာဂို့စ်","2-40","La Liga 2",false],
["2:15 AM","1+20","နယ်သာလန် *","ဂရိ","3+10","Nations LG",false],
["2:15 AM","2+80","ဂျာမနီ","ဆားဘီးယား","3-50","〃",true],
["2:15 AM","2+30","စကော့တလန်","မြောက်မက်ဆီဒိုးနီးယား","3+60","〃",false],
["2:15 AM","1+60","ဆွစ်ဇာလန်","ဆလိုဗေးနီးယား","2-10","〃",true],
["2:15 AM","1-70","ဆလိုဗက်ကီးယား","ဖာရိုးကျွန်းစု","3+90","〃",false],
["2:15 AM","-30","လူဇင်ဘတ်","အက်စ်တိုးနီးယား","CLOSE","〃",false],
["2:15 AM","1+80","အိုက်စ်လန်","ဘူဂေးရီးယား","2-70","〃",true],
["2:15 AM","1+50","အန်ဒိုရာ","ဂျီဘရော်တာ","2+60","〃",false],
["2:15 AM","1-100","အဇာဘိုင်ဂျန်","လက်ချင်စတိန်း","2-60","〃",true],
["2:30 AM","1+90","မွန်တီဗီဒီယို","ရေးဆင်းကလပ်","2-100","Uruguaya",false],
["2:30 AM","2+40","ဆယ်တာဗီဂို","ဆယ်မန်ကာ","CLOSE","Spain Cup",true],
["2:45 AM","-40","ကတ်တလယ်လာ","တာရာဂိုနာ","2-100","Spain RFEF",true]
].map((r,i)=>({id:"sample-"+(i+1),time:r[0],body:r[1],upper:r[2],lower:r[3],total:r[4],league:r[5],upperIsAway:r[6],result:""}));
let rows=[],canEdit=false,editing=false,loadedDate="",savedRows=[],showingDraft=false;
const clone=a=>JSON.parse(JSON.stringify(a));
const day=()=>{const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const o=Object.fromEntries(p.map(v=>[v.type,v.value]));return o.year+"-"+o.month+"-"+o.day;};
const dd=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(Date.UTC(y,m-1,d));};
const weekdays=["တနင်္ဂနွေ","တနင်္လာ","အင်္ဂါ","ဗုဒ္ဓဟူး","ကြာသပတေး","သောကြာ","စနေ"];
const titleDate=s=>{let d=dd(s);return "( "+String(d.getUTCDate()).padStart(2,"0")+"."+String(d.getUTCMonth()+1).padStart(2,"0")+"."+String(d.getUTCFullYear()).slice(-2)+" ) "+weekdays[d.getUTCDay()]+"နေ့ပွဲစဉ်များ";};
const clockToMin=s=>{let m=String(s||"").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);if(!m)return 999999;let h=Number(m[1])%12+(m[3].toUpperCase()==="PM"?12:0);return (h<12?h+24:h)*60+Number(m[2]);};
function timeFrom24(s){let m=String(s||"").match(/^(\d{1,2}):(\d{2})/);if(!m)return "—";let h=Number(m[1]);return String(h%12||12)+":"+m[2]+" "+(h>=12?"PM":"AM");}
const sortRows=rs=>rs.slice().sort((a,b)=>clockToMin(a.time)-clockToMin(b.time));
const draftKey=date=>"fc-main-maung-draft-v1:"+date;
const isDitto=x=>x==="〃"||x==="Ⅱ"||x==="II";
function options(){
 const leagues=[...new Set(rows.map(r=>r.league).filter(x=>x&&!isDitto(x)))].sort();
 const val=$("msLeague").value;$("msLeague").replaceChildren(new Option("လိဂ်အားလုံး",""),...leagues.map(x=>new Option(x,x)));
 if(leagues.includes(val))$("msLeague").value=val;
}
function visible(){
 const q=$("msSearch").value.trim().toLowerCase(),league=$("msLeague").value,market=$("msMarket").value;
 // The sample uses ditto marks for repeated league labels. Filtering must include every row in the same league.
 const actualLeague=new Map();let previousLeague="";
 for(const r of rows){if(r.league&&!isDitto(r.league))previousLeague=r.league;actualLeague.set(r,previousLeague);}
 return sortRows(rows).filter(r=>(!league||actualLeague.get(r)===league)&&(!q||[r.upper,r.lower,r.body,r.total,r.league,actualLeague.get(r)].some(x=>String(x||"").toLowerCase().includes(q)))&&(market==="all"||(market==="close")===(/^CLOSE$/i.test(r.total))));
}
function make(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;}
function draft(){if(!editing)return;try{localStorage.setItem(draftKey(loadedDate),JSON.stringify({date:loadedDate,rows,savedAt:new Date().toISOString()}));}catch{}}
function updateField(r,key,value){r[key]=value;draft();}
function addEditorCell(tr,r,key,type){const td=make("td"),inp=make(type==="select"?"select":"input");if(type==="checkbox"){inp.type="checkbox";inp.checked=Boolean(r[key]);inp.addEventListener("change",()=>updateField(r,key,inp.checked));}
 else{if(type==="select"){for(const x of ["", "CLOSE"])inp.add(new Option(x||"—",x));if(!["","CLOSE"].includes(r[key]))inp.add(new Option(r[key],r[key]));}
 inp.value=r[key]||"";inp.addEventListener("change",()=>updateField(r,key,inp.value));inp.addEventListener("input",()=>updateField(r,key,inp.value));}
 td.append(inp);tr.append(td);return td;}
function render(){
 document.getElementById("msExport").classList.toggle("ms-editing",editing);
 $("msTitle").textContent=titleDate(loadedDate);
 const view=visible();$("msCount").textContent=view.length+" ပွဲ";$("msRows").replaceChildren();
 if(!view.length){const tr=make("tr"),td=make("td","ms-empty","ရွေးထားသည့် Filter နှင့် ကိုက်ညီသော ပွဲမရှိပါ");td.colSpan=8;tr.append(td);$("msRows").append(tr);}
 for(let i=0;i<view.length;i++){
  const r=view[i],tr=make("tr",editing?"ms-edit-row":"");tr.append(make("td","",i+1));
  if(editing){
   for(const field of ["time","body","upper","result","lower","total","league"])addEditorCell(tr,r,field);
   const side=tr.children[5],lab=make("label","", "(H) → ညာဘက်");const check=make("input");check.type="checkbox";check.checked=r.upperIsAway;check.addEventListener("change",()=>{updateField(r,"upperIsAway",check.checked);});lab.prepend(check);side.append(lab);
   const btn=make("button","ms-delete","×");btn.type="button";btn.title="ဤပွဲကို ဖယ်ရန်";btn.addEventListener("click",()=>{if(confirm("ဤပွဲကို ဖယ်မည်လား?")){rows=rows.filter(x=>x!==r);draft();options();render();}});tr.children[0].append(btn);
  }else{
   const ordered=[r.time,r.body,r.upper,r.result,r.lower,r.total,r.league];
   ordered.forEach((v,k)=>{
    let display=v;if(k===0&&i&&r.time===view[i-1].time)display="〃";
    if(k===4&&r.upperIsAway)display=v+" ( H )";
    const td=make("td",k===5&&/^CLOSE$/i.test(v)?"closed":"");
    if(k===2||k===4||k===6){
      const span=make("span","ms-fit-label",display);
      td.append(span);td.title=String(display||"");
    }else td.textContent=String(display||"");
    tr.append(td);
   });
  }
  $("msRows").append(tr);
 }
 $("msEdit").hidden=editing;$("msLogin").hidden=canEdit;$("msAdd").hidden=!editing;$("msSave").hidden=!editing;$("msCancel").hidden=!editing;
 if(!editing)requestAnimationFrame(fitSheetText);
}
function fitSheetText(){
 // Adjust only genuinely long labels; keep Myanmar text bold and highly legible.
 const cells=Array.from(document.querySelectorAll("#msRows td:nth-child(4),#msRows td:nth-child(6),#msRows td:nth-child(8)"));
 for(const td of cells){
   const span=td.querySelector(".ms-fit-label");if(!span)continue;
   td.classList.remove("ms-wrap-team");span.style.fontSize="";
   const isLeague=td.cellIndex===7,isTeam=!isLeague;
   const minimum=isLeague?14:16,maxWidth=td.clientWidth-12;
   let current=parseFloat(getComputedStyle(td).fontSize)||20;
   while(current>minimum&&span.getBoundingClientRect().width>maxWidth){
     current--;span.style.fontSize=current+"px";
   }
   if(isTeam&&span.getBoundingClientRect().width>maxWidth)td.classList.add("ms-wrap-team");
 }
}
document.fonts?.ready.then(()=>requestAnimationFrame(fitSheetText)).catch(()=>{});
function status(msg,isError=false){$("msStatus").textContent=msg;$("msStatus").style.color=isError?"#ffac91":"#d2e1ff";}
function importOdds(data){return (Array.isArray(data.matches)?data.matches:[]).map((m,i)=>{
 const home=String(m.homeDisplay||m.home||""),away=String(m.awayDisplay||m.away||""),upper=String(m.upperTeam||home);
 const upperIsAway=upper===away||upper!==home&&upper.toLowerCase()===String(m.away||"").toLowerCase();
 return {id:"odds-"+i,time:timeFrom24(m.kickoff||m.sourceKickoff||m.kickoffDisplay),body:String(m.bodyOdds||""),upper:upperIsAway?away:home,lower:upperIsAway?home:away,total:String(m.goalTotalOdds||""),result:"",league:String(m.leagueDisplay||m.league||""),upperIsAway};
 });}
async function load(){
 const date=$("msDate").value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
 loadedDate=date;editing=false;canEdit=false;status("စာရင်းဖွင့်နေသည်…");
 let server=null,warning="";
 try{const r=await fetch("/api/maung-sheet?date="+encodeURIComponent(date),{cache:"no-store",credentials:"same-origin"});const j=await r.json();if(!r.ok)throw Error(j.error||"Server မရပါ");server=j.sheet;canEdit=Boolean(j.canEdit);}
 catch(e){warning=e.message;}
 if(server?.rows){rows=clone(server.rows);status("Website ပေါ်တွင် သိမ်းထားသော မောင်းစာရွက်ကို ဖွင့်ပြီးပါပြီ။");}
 else if(date===firstDate){rows=clone(sample);status("၁၃.၁၁.၂၀၂၆ နမူနာ ၂၉ ပွဲ ဖွင့်ပြီးပါပြီ။"+(warning?" Database: "+warning:""));}
 else{
  try{const res=await fetch("./data/odds/"+date+".json",{cache:"no-store"});if(!res.ok)throw Error("စာရင်းမရှိ");rows=importOdds(await res.json());status("လက်ရှိ ပေါက်ကြေးဖိုင်မှ စတင်ဖွင့်ထားပါသည်။ သိမ်းပြီးမှ သီးခြား မောင်းစာရွက် ဖြစ်ပါမည်။"+(warning?" Server: "+warning:""));}
  catch{rows=[];status("ဤရက်စွဲအတွက် မောင်းစာရွက် မရှိသေးပါ။"+(warning?" "+warning:""));}
 }
 savedRows=clone(rows);showingDraft=false;
 const local=localStorage.getItem(draftKey(date));if(local){try{let d=JSON.parse(local);if(Array.isArray(d.rows)&&confirm("ဤစက်တွင် သိမ်းထားသော မောင်းစာရွက် Draft ကို ဆက်ပြင်မည်လား?")){rows=d.rows;editing=true;showingDraft=true;status("မထုတ်ဝေရသေးသော Draft ကို ဖွင့်ထားပါသည်။");}}catch{}}
 $("msLeague").value="";$("msSearch").value="";$("msMarket").value="all";options();render();
 if(!canEdit&&!warning)status($("msStatus").textContent+" · Owner ပြင်ဆင်ရန် Login ဝင်ပါ။");
}
const requestedDate=new URLSearchParams(location.search).get("date");
$("msDate").value=/^\d{4}-\d{2}-\d{2}$/.test(requestedDate||"")?requestedDate:day();
$("msDate").addEventListener("change",load);
["msLeague","msMarket","msSearch"].forEach(id=>$(id).addEventListener(id==="msSearch"?"input":"change",render));
$("msEdit").addEventListener("click",()=>{editing=true;render();status(canEdit?"အသင်း၊ အချိန်၊ ဘော်ဒီ၊ ဂိုးပေါင်း၊ လိဂ်၊ (H) ကို ပြင်ပြီး Website ပေါ် သိမ်းပါ။":"Draft အနေနဲ့ ပြင်နိုင်ပါပြီ။ Website ပေါ် အတည်သိမ်းရန် Owner Login လိုအပ်ပါသည်။");});
$("msAdd").addEventListener("click",()=>{$("msLeague").value="";$("msMarket").value="all";$("msSearch").value="";rows.push({id:"new-"+Date.now(),time:"11:30 PM",body:"",upper:"",lower:"",total:"",result:"",league:"",upperIsAway:false});options();render();draft();});
$("msCancel").addEventListener("click",()=>{if(!confirm("မထုတ်ဝေရသေးသော ပြင်ဆင်မှုများကို ပယ်ဖျက်မည်လား?"))return;rows=clone(savedRows);editing=false;localStorage.removeItem(draftKey(loadedDate));options();render();status("ပြင်ဆင်မှု မသိမ်းဘဲ မူလစာရင်းသို့ ပြန်ထားပါသည်။");});
$("msSave").addEventListener("click",async()=>{
 if(!canEdit){draft();$("msLogin").hidden=false;return status("Draft ကို ယခု Browser ထဲ သိမ်းထားပြီးပါပြီ။ Website ပေါ် အတည်သိမ်းရန် Owner Login ဝင်ပါ။",true);}
 if(rows.some(r=>!r.time||!r.upper||!r.lower))return status("အချိန်နှင့် အသင်းနှစ်သင်းအမည် ဖြည့်ပါ။",true);
 const btn=$("msSave");btn.disabled=true;status("Website ပေါ် သိမ်းနေသည်…");
 try{
  const r=await fetch("/api/maung-sheet?date="+encodeURIComponent(loadedDate),{method:"POST",headers:{"Content-Type":"application/json","X-Football-Editor":"1"},credentials:"same-origin",body:JSON.stringify({date:loadedDate,rows})});
  const j=await r.json();if(!r.ok)throw Error(j.error||"သိမ်းမရပါ");
  localStorage.removeItem(draftKey(loadedDate));savedRows=clone(rows);editing=false;options();render();status("✓ Website ပေါ် အတည်တကျ သိမ်းပြီးပါပြီ။ "+rows.length+" ပွဲ");
 }catch(e){draft();status("မသိမ်းနိုင်သေးပါ။ Draft ကို ဒီစက်တွင် ထိန်းထားပါတယ်။ "+e.message,true);}finally{btn.disabled=false;}
});

const bannerStorageKey="fc-main-maung-artwork-v1";
let bannerState={top:"",bottom:""};
try{
 const stored=JSON.parse(localStorage.getItem(bannerStorageKey)||"{}");
 for(const p of ["top","bottom"])if(typeof stored[p]==="string"&&/^data:image\/(png|jpeg|webp);base64,/i.test(stored[p])&&stored[p].length<3500000)bannerState[p]=stored[p];
}catch{}
function renderBanners(){
 for(const [place,id] of [["top","msTopBanner"],["bottom","msBottomBanner"]]){
  const img=$(id);img.hidden=!bannerState[place];if(bannerState[place])img.src=bannerState[place];else img.removeAttribute("src");
 }
}
async function setBanner(place,file){
 if(!file)return;
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>2000000){status("PNG/JPG/WebP ပုံ (2MB အောက်) ရွေးပါ။",true);return;}
 try{
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Banner file read failed"));reader.readAsDataURL(file);});
  bannerState[place]=data;localStorage.setItem(bannerStorageKey,JSON.stringify(bannerState));renderBanners();status((place==="top"?"အပေါ်":"အောက်")+" Banner ထည့်ပြီးပါပြီ။ Download တွင် မူရင်းအချိုးအစားအတိုင်း ပါမည်။");
 }catch(e){status("Banner သိမ်းမရပါ။ 2MB အောက်ပုံရွေးပြီး ပြန်လုပ်ပါ။",true);}
}
for(const [place,id,removeId] of [["top","msTopUpload","msTopRemove"],["bottom","msBottomUpload","msBottomRemove"]]){
 $(id).addEventListener("change",()=>setBanner(place,$(id).files[0]));
 $(removeId).addEventListener("click",()=>{bannerState[place]="";try{localStorage.setItem(bannerStorageKey,JSON.stringify(bannerState));}catch{}renderBanners();status("Banner ဖြုတ်ပြီးပါပြီ။");});
}
renderBanners();
if(new URLSearchParams(location.search).has("download-center"))document.body.classList.add("ms-embedded");

$("msPrint").addEventListener("click",()=>window.print());

async function exportSheet(part="all"){
 const buttonId=part==="first"?"msPart1":part==="second"?"msPart2":"msDownload";
 const btn=$(buttonId),original=btn.textContent,wasEditing=editing;
 btn.disabled=true;btn.textContent="HD PNG ပြုလုပ်နေသည်…";
 try{
  if(typeof html2canvas!=="function")throw Error("PNG Engine မရနိုင်ပါ");
  if(wasEditing){editing=false;render();}
  await document.fonts?.ready;
  await document.fonts?.load('850 22px "FC Myanmar"');
  fitSheetText();
  await Promise.all(["msTopBanner","msBottomBanner"].map(id=>{const img=$(id);return img.hidden?Promise.resolve():img.decode?.().catch(()=>{})||Promise.resolve();}));
  const selected=visible(),split=Math.ceil(selected.length/2);
  const start=part==="second"?split:0,end=part==="first"?split:selected.length;
  if(!selected.length||end<=start)throw Error("ရွေးထားသော ပွဲမရှိပါ");
  const paper=$("msExport");if(paper.getBoundingClientRect().height>12000)throw Error("စာရွက် အလွန်ရှည်နေပါသည်");
  const canvas=await html2canvas(paper,{
   backgroundColor:"#ffffff",scale:part==="all"?2.5:3,useCORS:false,logging:false,
   windowWidth:Math.max(1440,document.documentElement.clientWidth),
   onclone:doc=>{
    const p=doc.getElementById("msExport");
    p.style.width="1280px";p.style.maxWidth="none";p.style.overflow="visible";
    const scroll=p.querySelector(".ms-scroll");scroll.style.overflow="visible";scroll.style.width="1240px";
    p.querySelector(".ms-table").style.minWidth="1240px";
    if(part!=="all"){
     const trs=Array.from(doc.querySelectorAll("#msRows tr"));
     trs.forEach((tr,i)=>{if(i<start||i>=end)tr.remove();});
     const first=doc.querySelector("#msRows tr");
     if(first&&first.children[1])first.children[1].textContent=selected[start].time;
    }
   }
  });
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  if(!blob||blob.size===0)throw Error("HD PNG ဖိုင်မရပါ");
  const a=document.createElement("a"),url=URL.createObjectURL(blob);
  a.href=url;a.download="Future-Code-Maung-Sheet-"+loadedDate+(part==="all"?"":part==="first"?"-Part-1":"-Part-2")+".png";
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status("✓ "+(part==="all"?"ဇယားအပြည့်":part==="first"?"အပေါ်ပိုင်း":"အောက်ပိုင်း")+" HD PNG ပြုလုပ်ပြီးပါပြီ။");
 }catch(e){status("HD PNG ထုတ်မရပါ။ "+e.message,true);}
 finally{if(wasEditing){editing=true;render();}btn.disabled=false;btn.textContent=original;}
}
$("msDownload").addEventListener("click",()=>exportSheet("all"));
$("msPart1").addEventListener("click",()=>exportSheet("first"));
$("msPart2").addEventListener("click",()=>exportSheet("second"));

load();
})();
