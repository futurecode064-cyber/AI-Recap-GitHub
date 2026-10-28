"use strict";
/* Main-site reference layout: Burmese league + stacked maroon/cream odds rows.
   Never fabricates fixture data; draws only rows from the live published odds sheet. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!/^\/odds(?:\.html)?\/?$/.test(location.pathname))return;
 const names={"EFL Cup":"အင်္ဂလန် ကာရာဘောင်းဖလား","DFB-Pokal":"ဂျာမနီ ပိုကယ်ဖလား","Copa del Rey":"စပိန် ဘုရင့်ဖလား","Serie A":"အီတလီ စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ","Italian Serie C":"အီတလီ စီးရီးစီ","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","League One":"အင်္ဂလန် လိဂ်ဝမ်း","Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ","German 3. Liga":"ဂျာမနီ လိဂ် ၃","La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 1":"ပြင်သစ် လီဂူးဝမ်း","Ligue 2":"ပြင်သစ် လိဂ် ၂","UEFA Champions League":"ဥရောပ ချန်ပီယံလိဂ်","UEFA Europa League":"ယူရိုပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Danish Cup":"ဒိန်းမတ် ဖလား","Allsvenskan":"ဆွီဒင် အော်လ်ဆွန်းစကန်","Swedish Superettan":"ဆွီဒင် စူပါအက်တန်လိဂ်","Turkish Super Lig":"တူရကီ စူပါလိဂ်","Norwegian 1. Division":"နော်ဝေး လိဂ် ၁","Eliteserien":"နော်ဝေး အယ်လီတီစီးရီးယန်း","Veikkausliiga":"ဖင်လန် ဗေးကာ့စ်လိဂ်","Veikkausliiga Playoffs":"ဖင်လန် လိဂ် ပလေးအော့"};
 const colorOK=x=>/^#[0-9a-f]{6}$/i.test(x||"");
 const clean=x=>String(x??"").normalize("NFC").trim();
 const cache=new Map();
 function src(url){const mapped=window.FutureCodeMainLogoAssets?.imageUrl?.(url)||window.FutureCodeBrandExportData?.imageUrl?.(url)||url;
  try{const u=new URL(mapped,document.baseURI);return /^(https?:)$/.test(u.protocol)?u.href:"";}catch{return "";}
 }
 function load(url,label){
  const path=src(url);if(!path)return Promise.reject(Error(label+" လိုဂိုမရှိပါ"));
  if(!cache.has(path))cache.set(path,new Promise((resolve,reject)=>{
    const img=new Image();img.crossOrigin="anonymous";img.decoding="sync";
    const t=setTimeout(()=>{cache.delete(path);reject(Error(label+" လိုဂို Timeout"));},12000);
    img.onload=()=>{clearTimeout(t);resolve(img);};img.onerror=()=>{clearTimeout(t);cache.delete(path);reject(Error(label+" လိုဂို ဖတ်မရပါ"));};img.src=path;
  }));return cache.get(path);
 }
 function label(ctx,t,x,y,base,ink,max){
  t=clean(t)||"—";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=ink;
  for(let n=base;n>=15;n--){ctx.font='900 '+n+'px "Noto Sans Myanmar",sans-serif';if(ctx.measureText(t).width<=max||n===15)break;}
  ctx.fillText(t,x,y,max);
 }
 function badge(ctx,img,x,y){
  ctx.fillStyle="#eef3f1";ctx.beginPath();ctx.arc(x,y,33,0,2*Math.PI);ctx.fill();
  if(!img){label(ctx,"—",x,y,24,"#829198",42);return;}
  let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,ratio=Math.min(57/w,57/h);
  ctx.drawImage(img,x-w*ratio/2,y-h*ratio/2,w*ratio,h*ratio);
 }
 function block(ctx,x,y,name,price,red){
  ctx.fillStyle=red;ctx.fillRect(x,y,166,70);
  label(ctx,name,x+83,y+18,18,"white",158);
  label(ctx,price||"—",x+83,y+49,29,"white",158);
 }
 function time(m){return window.FutureCodeOddsClock?.short?.(m)||clean(m.sourceKickoff||m.kickoff).match(/\d\d:\d\d/)?.[0]||"—";}
 function league(m){const v=clean(m.leagueDisplay);return /[\u1000-\u109f]/.test(v)&&!/[A-Za-z]/.test(v)?v:names[m.league]||"မြန်မာလို လိဂ်အမည် မသတ်မှတ်ရသေး";}
 function market(m,mode){return mode==="current"?{body:m.currentBodyOdds,goal:m.currentGoalTotalOdds}:{body:m.bodyOdds,goal:m.goalTotalOdds};}
 async function draw(rows,settings={}){
  if(!Array.isArray(rows)||!rows.length)throw Error("မြန်မာကြေး ပွဲစာရင်း မရှိပါ");
  const date=clean(settings.date),mode=settings.mode==="current"?"current":"original",red=colorOK(settings.color)?settings.color:"#b71624";
  const grouped=new Map();for(const m of rows){if(!grouped.has(m.league))grouped.set(m.league,[]);grouped.get(m.league).push(m);}
  for(const m of rows)if(m.upperTeam!==m.home&&m.upperTeam!==m.away)throw Error("ကြေးပေးအသင်း စစ်ဆေးပါ — "+m.home+"/"+m.away);
  // A blocked third-party crest must not cancel every fixture's PNG export.
  // Preserve verified crests that load; show an honest neutral mark otherwise.
  const settled=await Promise.all(rows.map(m=>Promise.allSettled([load(m.homeCrestUrl,m.home),load(m.awayCrestUrl,m.away)])));
  const missing=[];const icons=settled.map((pair,i)=>pair.map((r,j)=>{
   if(r.status==="fulfilled")return r.value;
   missing.push((j===0?rows[i].home:rows[i].away)+": "+r.reason?.message);
   return null;
  }));
  if(missing.length)console.warn("Reference red poster: unavailable verified club crests",missing);
  await document.fonts?.ready;
  const W=1200,H=100+[...grouped.values()].reduce((n,a)=>n+72+a.length*104+10,0)+24;
  const c=document.createElement("canvas");c.width=W*2;c.height=H*2;
  if(c.height>32767)throw Error("ပွဲများလွန်းပါသည်။ PNG ခွဲထုတ်ပါ");
  const g=c.getContext("2d");if(!g)throw Error("Canvas မရပါ");g.scale(2,2);
  g.fillStyle="#410b10";g.fillRect(0,0,W,H);
  label(g,date+" · "+(mode==="current"?"ယခုကြေး":"မူလကြေး")+" · "+(settings.part||1)+"/"+(settings.total||1),W/2,53,30,"#fff",W-50);
  let y=104,i=0;
  for(const [key,group] of grouped){
   g.fillStyle="#800e19";g.fillRect(24,y,W-48,60);
   label(g,league(group[0]),W/2,y+30,28,"#fff",W-65);
   y+=72;
   for(const m of group){
    const mid=y+42,p=market(m,mode),upperAway=m.upperTeam===m.away;
    // Trapezoidal cream strip, like the supplied sample poster.
    g.fillStyle="#f6f3ed";g.beginPath();g.moveTo(24,y);g.lineTo(W-24,y);
    g.lineTo(W-42,y+86);g.lineTo(42,y+86);g.closePath();g.fill();
    badge(g,icons[i][0],75,mid);badge(g,icons[i][1],1125,mid);
    label(g,m.home,244,mid,30,"#10222b",244);
    label(g,m.away,956,mid,30,"#10222b",242);
    block(g,385,y+8,upperAway?"ဂိုးပေါင်းကြေး":"ဘော်ဒီကြေး",upperAway?p.goal:p.body,red);
    label(g,time(m),600,mid,24,"#10222b",85);
    block(g,649,y+8,upperAway?"ဘော်ဒီကြေး":"ဂိုးပေါင်းကြေး",upperAway?p.body:p.goal,red);
    i++;y+=104;
   }
   y+=10;
  }
  return c;
 }
 window.FutureCodeBurmeseRedOddsFrame=Object.freeze({draw,leagueName:league});
})();