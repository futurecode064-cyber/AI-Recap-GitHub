"use strict";
(function(){
 const W=1080;
 const C={bg:"#101c20",surface:"#1f3335",surface2:"#29403e",accent:"#ffb077",text:"#f9f5e9",muted:"#bad0c8",line:"#47605a"};
 const font=(px,bold=false)=>`${bold?800:500} ${px}px "Noto Sans Myanmar",sans-serif`;
 function box(c,x,y,w,h,color,r=0){
  c.fillStyle=color;c.beginPath();
  if(r&&typeof c.roundRect==="function")c.roundRect(x,y,w,h,r);
  else c.rect(x,y,w,h);
  c.fill();
 }
 function txt(c,value,x,y,px=23,color=C.text,bold=false,align="left",maxWidth){
  c.font=font(px,bold);c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";
  if(maxWidth)c.fillText(String(value??""),x,y,maxWidth);
  else c.fillText(String(value??""),x,y);
 }
 function narrow(c,value,max,from=24,min=15){
  let px=from;
  do{c.font=font(px,true);if(c.measureText(String(value)).width<=max)break;px--;}while(px>min);
  return px;
 }
 function brandHeader(c,title,date,count,label){
  box(c,0,0,W,c.canvas.height,C.bg);
  box(c,0,0,W,16,C.accent);
  txt(c,"FUTURE CODE · FOOTBALL DAILY",44,59,23,C.accent,true);
  txt(c,title,44,117,48,C.text,true);
  txt(c,(`မြန်မာစံတော်ချိန်  ${date}`),44,169,22,C.muted,false);
  txt(c,`${count} ${label}`,W-44,169,22,C.accent,true,"right");
 }
 const logos=new Map();
 function loadLogo(raw){
  if(!raw||typeof raw!=="string"||!/^https:\/\//.test(raw))return Promise.resolve(null);
  if(logos.has(raw))return logos.get(raw);
  const promise=new Promise(resolve=>{
   const img=new Image();img.crossOrigin="anonymous";let complete=false;
   const done=value=>{if(complete)return;complete=true;clearTimeout(timer);resolve(value)};
   const timer=setTimeout(()=>done(null),3500);
   img.onload=()=>done(img);img.onerror=()=>done(null);img.src=raw;
  });
  logos.set(raw,promise);return promise;
 }
 function crest(c,img,x,y,size){
  box(c,x,y,size,size,"#eaf2ed",size/2);
  if(img)try{
   const scale=Math.min((size-8)/img.naturalWidth,(size-8)/img.naturalHeight);
   const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
   c.drawImage(img,x+(size-w)/2,y+(size-h)/2,w,h);
  }catch(e){/* Browser unavailable/CORS logo: fallback circle stays visible */}
 }
 function group(c,name,y){
  box(c,30,y,W-60,59,C.surface2,13);
  box(c,30,y,8,59,C.accent,4);
  txt(c,name,54,y+30,26,C.accent,true);
 }
 function underline(c,y){box(c,45,y,W-90,1,C.line)}
 function getGroups(matches){
  const groups=new Map();
  for(const m of matches){const k=m.league||"အခြားပွဲစဉ်များ";if(!groups.has(k))groups.set(k,[]);groups.get(k).push(m)}
  return [...groups.entries()];
 }
 function canvas(height){
  const el=document.createElement("canvas");el.width=W;el.height=height;
  if(el.width!==W||el.height!==height)throw Error("Image canvas allocation failed");
  return el;
 }
 async function output(el,filename){
  const blob=await new Promise((resolve,reject)=>{
   try{el.toBlob(x=>x?resolve(x):reject(Error("PNG creation failed")),"image/png")}catch(e){reject(e)}
  });
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 async function waitFonts(){if(document.fonts?.ready)await document.fonts.ready;}
 async function saveOdds(data){
  if(!data||!Array.isArray(data.matches)||!data.matches.length)throw Error("No daily odds to export");
  await waitFonts();
  const groups=getGroups(data.matches), height=235+groups.length*76+data.matches.length*110+87;
  const el=canvas(height),c=el.getContext("2d");
  if(!c)throw Error("Canvas not supported");
  brandHeader(c,"ယနေ့ ပေါက်ကြေးများ",data.reportDate,data.matches.length,"ပွဲ");
  const urls=[...new Set(data.matches.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]).filter(Boolean))];
  await Promise.all(urls.map(loadLogo));
  let y=223;
  for(const [league,matches] of groups){
   group(c,league,y);y+=70;
   for(const m of matches){
    box(c,30,y,W-60,103,C.surface,9);
    const kickoff=(m.kickoffDate!==data.reportDate?"နောက်နေ့ ":"")+(m.kickoff||"");
    txt(c,kickoff,47,y+27,19,C.accent,true);
    const home=m.home||"",away=m.away||"";
    const homeLogo=await loadLogo(m.homeCrestUrl),awayLogo=await loadLogo(m.awayCrestUrl);
    crest(c,homeLogo,240,y+10,38);crest(c,awayLogo,605,y+10,38);
    txt(c,home,286,y+31,narrow(c,home,230,24,16),C.text,true,"left",230);
    txt(c,"VS",574,y+31,22,C.accent,true,"center");
    txt(c,away,652,y+31,narrow(c,away,390,24,16),C.text,true,"left",350);
    underline(c,y+57);
    txt(c,"အပေါ်အသင်း  "+(m.upperTeam||"—"),47,y+81,19,C.muted,false,"left",330);
    txt(c,"ဘော်ဒီ  "+(m.bodyOdds??"—"),460,y+81,20,C.text,true);
    txt(c,"ဂိုးပေါင်း  "+(m.goalTotalOdds??"—"),648,y+81,20,C.text,true);
    txt(c,"ခန့်မှန်း  "+(m.pdfLastColumn??"—"),1008,y+81,20,C.accent,true,"right");
    y+=110;
   }
   y+=6;
  }
  txt(c,"အာရှ စျေးကွက် မြန်မာကြေး မနက်ပိုင်း ဖွင့်လှစ်မှုများ",W/2,height-57,22,C.accent,true,"center");
  await output(el,`future-code-odds-${data.reportDate}.png`);
 }
 function verified(m){return m&&m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))}
 async function saveResults({matches,date,brand}){
  const finals=Array.isArray(matches)?matches.filter(verified):[];
  if(!finals.length)throw Error("ပွဲပြီးအတည်ပြုထားသော ရလဒ်များ မရှိသေးပါ");
  await waitFonts();
  const groups=getGroups(finals),height=235+groups.length*76+finals.length*103+95;
  const el=canvas(height),c=el.getContext("2d");if(!c)throw Error("Canvas not supported");
  brandHeader(c,"ဂိုးရလဒ်များ",date,finals.length,"ပွဲပြီး");
  const urls=[...new Set(finals.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]).filter(Boolean))];
  await Promise.all(urls.map(loadLogo));
  let y=223;
  for(const [league,matches] of groups){
   group(c,league,y);y+=70;
   for(const m of matches){
    box(c,30,y,W-60,97,C.surface,10);
    const home=m.homeDisplay||m.home||"",away=m.awayDisplay||m.away||"";
    crest(c,await loadLogo(m.homeCrestUrl),42,y+18,58);
    crest(c,await loadLogo(m.awayCrestUrl),W-100,y+18,58);
    txt(c,home,115,y+35,narrow(c,home,320,27,17),C.text,true,"left",320);
    box(c,448,y+13,185,70,C.surface2,12);
    txt(c,String(m.finalScore).replace(":", "-"),540,y+49,37,C.accent,true,"center");
    txt(c,away,W-117,y+35,narrow(c,away,320,27,17),C.text,true,"right",320);
    txt(c,"ပွဲပြီး · "+(m.kickoffYangon||""),W/2,y+87,16,C.muted,false,"center",430);
    y+=103;
   }
   y+=6;
  }
  txt(c,"အတည်ပြုပွဲပြီးရလဒ်များသာ ပါဝင်သည်",W/2,height-60,21,C.muted,false,"center");
  await output(el,`football-goal-results-${date}.png`);
 }
 window.FutureCodeDailyExport={saveOdds,saveResults};
})();
