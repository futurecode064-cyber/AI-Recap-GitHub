"use strict";
(function(){
  // Shared by Future Code, YKZ, BW Sport and Ko Thet odds pages.
  const me=document.currentScript;
  const rootUrl=new URL("./",me&&me.src?me.src:document.baseURI);
  const style=document.createElement("link");
  style.rel="stylesheet";style.href=new URL("evening-odds.css?v=20261014-1",rootUrl).href;
  document.head.appendChild(style);

  const leagueLabels={
    "UEFA Champions League":"ချန်ပီယံလိဂ်",
    "Championship":"အင်္ဂလန် ချန်ပီယံရှစ်"
  };
  function el(tag,cls,value){
    const e=document.createElement(tag);if(cls)e.className=cls;
    if(value!==undefined)e.textContent=String(value);return e;
  }
  function parseQuote(value){
    const s=String(value||"").trim();
    const m=/^(\d*)([+-])(\d+)$/.exec(s);
    if(m)return {line:m[1],value:(m[2]==="-"?-1:1)*Number(m[3]),valid:true};
    if(/^(\d+)=$/.test(s))return {line:s.slice(0,-1),value:0,valid:true};
    return {valid:false};
  }
  function difference(morning,evening){
    morning=String(morning);evening=String(evening);
    if(morning===evening)return {text:"မပြောင်း",kind:"same"};
    const a=parseQuote(morning),b=parseQuote(evening);
    if(!a.valid||!b.valid)return {text:morning+" → "+evening,kind:"changed"};
    if(a.line!==b.line){
      return {text:"လိုင်း "+(a.line||"—")+" → "+(b.line||"—")+" · ကြေး "+(a.value>=0?"+":"")+a.value+" → "+(b.value>=0?"+":"")+b.value,kind:"line"};
    }
    const d=b.value-a.value;
    if(!d)return {text:"မပြောင်း",kind:"same"};
    return {text:(d>0?"+":"")+d+" မှတ်",kind:d>0?"up":"down"};
  }
  function tableFor(league,matches){
    const section=el("section","evening-league");
    section.appendChild(el("h3","evening-league-title",leagueLabels[league]||league));
    const scroll=el("div","evening-table-scroll"),table=el("table","evening-table");
    const thead=el("thead"),group=el("tr"),titles=el("tr");
    for(const name of ["ပွဲချိန်","တွေ့ဆုံမည့်အသင်း","ကြေးပေးအသင်း"]){
      const th=el("th","",name);th.rowSpan=2;group.appendChild(th);
    }
    for(const name of ["ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး"]){
      const th=el("th","",name);th.colSpan=3;group.appendChild(th);
    }
    for(const name of ["မနက် (မူလ)","ညနေ (ယခု)","ကွာခြားချက်","မနက် (မူလ)","ညနေ (ယခု)","ကွာခြားချက်"])
      titles.appendChild(el("th","",name));
    thead.appendChild(group);thead.appendChild(titles);table.appendChild(thead);
    const body=el("tbody");
    for(const m of matches){
      const tr=el("tr");
      tr.appendChild(el("td","evening-time",m.kickoffDisplay));
      const pair=el("td","evening-pair");
      const a=el("span","",m.home),b=el("span","",m.away);
      pair.appendChild(a);pair.appendChild(el("span","evening-vs","VS"));pair.appendChild(b);
      tr.appendChild(pair);
      tr.appendChild(el("td","evening-upper",m.upperTeam));
      const fields=[
        ["morningBodyOdds","eveningBodyOdds"],
        ["morningGoalTotalOdds","eveningGoalTotalOdds"]
      ];
      for(const [oldKey,newKey] of fields){
        tr.appendChild(el("td","evening-quote",m[oldKey]));
        tr.appendChild(el("td","evening-quote latest",m[newKey]));
        const delta=difference(m[oldKey],m[newKey]);
        tr.appendChild(el("td","evening-difference is-"+delta.kind,delta.text));
      }
      body.appendChild(tr);
    }
    table.appendChild(body);scroll.appendChild(table);section.appendChild(scroll);
    return section;
  }
  function groupMatches(matches){
    const groups=new Map();
    for(const m of matches){if(!groups.has(m.league))groups.set(m.league,[]);groups.get(m.league).push(m);}
    return [...groups];
  }
  function brandPalette(){
    const id=window.FutureCodeBrandConfig?.id||"future-code";
    return id==="ykz-family"?{header:"#aa111b",deep:"#650409",accent:"#ffd36b"}:
           id==="bw-sport"?{header:"#0856c4",deep:"#072d77",accent:"#d9eefe"}:
           id==="ko-thet-family"?{header:"#830b15",deep:"#45060c",accent:"#ffdc78"}:
           {header:"#215c55",deep:"#163e3b",accent:"#ffcb92"};
  }
  async function png(data,onlyLeague){
    const groups=groupMatches(onlyLeague?data.matches.filter(m=>m.league===onlyLeague):data.matches);
    const included=groups.flatMap(g=>g[1]);
    if(!included.length)throw Error("No comparison data");
    const kit=window.FutureCodeCanvasKit;
    if(!kit)throw Error("PNG exporter unavailable");
    const {create,fill,text,fit,fonts,download}=kit;
    const M=24, widths=[145,330,180,132,132,230,132,132,230],W=widths.reduce((a,b)=>a+b,0)+2*M;
    const H=230+groups.reduce((s,g)=>s+113+g[1].length*82,s)+65;
    const xs=[M];for(const w of widths)xs.push(xs[xs.length-1]+w);
    const {canvas,ctx}=create(W,H),p=brandPalette();
    await fonts();
    fill(ctx,0,0,W,H,"#ffffff");fill(ctx,0,0,W,205,p.deep);fill(ctx,0,0,W,12,p.accent);
    text(ctx,document.documentElement.dataset.footballBrandName||"FUTURE CODE FOOTBALL",M+12,52,24,p.accent,true);
    text(ctx,"ညနေခင်းကြေးပြောင်း",M+12,115,39,"#ffffff",true);
    text(ctx,"မနက် (မူလ) · ညနေ (ယခု) · ကွာခြားချက် | "+data.reportDate,M+12,164,17,"#ffffff");
    let y=220;
    for(const [league,items] of groups){
      fill(ctx,M,y,W-M*2,56,p.header);
      text(ctx,leagueLabels[league]||league,M+16,y+30,24,"#ffffff",true);
      y+=60;fill(ctx,M,y,W-M*2,46,p.deep);
      const heads=["ပွဲချိန်","တွေ့ဆုံမည့်အသင်း","ကြေးပေးအသင်း","ဘော်ဒီ မူလ","ဘော်ဒီ ယခု","ဘော်ဒီ ကွာ","ဂိုး မူလ","ဂိုး ယခု","ဂိုး ကွာ"];
      for(let j=0;j<heads.length;j++)
        text(ctx,heads[j],xs[j]+widths[j]/2,y+24,fit(ctx,heads[j],widths[j]-10,17,11),"#ffffff",true,"center",widths[j]-10);
      y+=46;
      for(const [i,m] of items.entries()){
        fill(ctx,M,y,W-M*2,82,i%2?"#f2f4f7":"#ffffff");
        fill(ctx,xs[2],y,widths[2],82,"#e5e7eb");
        for(const x of xs)fill(ctx,x,y,1,82,"#c9d0d8");
        fill(ctx,M,y+81,W-M*2,1,"#c9d0d8");
        const bodyDiff=difference(m.morningBodyOdds,m.eveningBodyOdds);
        const goalsDiff=difference(m.morningGoalTotalOdds,m.eveningGoalTotalOdds);
        const vals=[m.kickoffDisplay,m.home+" VS "+m.away,m.upperTeam,m.morningBodyOdds,m.eveningBodyOdds,bodyDiff.text,m.morningGoalTotalOdds,m.eveningGoalTotalOdds,goalsDiff.text];
        vals.forEach((v,j)=>text(ctx,v,xs[j]+widths[j]/2,y+44,fit(ctx,v,widths[j]-18,j===1?16:19,j===1?10:11),"#1a2430",true,"center",widths[j]-18));
        y+=82;
      }
      y+=7;
    }
    const brand=window.FutureCodeBrandConfig?.id||"future-code";
    await download(canvas,brand+"-evening-odds-"+data.reportDate+(onlyLeague?"-"+onlyLeague.replace(/[^a-z0-9]+/ig,"-"):"")+".png");
  }
  function boot(){
    const main=document.querySelector(".odds-content");
    if(!main)return;
    const section=el("section","evening-odds-section");
    section.id="eveningOddsSection";section.hidden=true;
    const header=el("div","evening-head");
    const heading=el("h2","", "ညနေခင်းကြေးပြောင်း");
    header.appendChild(heading);section.appendChild(header);
    const line=el("p","evening-summary","");section.appendChild(line);
    const actions=el("div","evening-actions"),allButton=el("button","evening-png-btn","⬇ ညနေခင်းကြေးပြောင်း PNG Download");
    allButton.type="button";allButton.disabled=true;
    actions.appendChild(allButton);section.appendChild(actions);
    const root=el("div","evening-group-list");section.appendChild(root);
    main.appendChild(section);
    const link=el("a","evening-nav-link","ညနေခင်းကြေးပြောင်း");
    link.href="#eveningOddsSection";
    document.querySelector(".odds-nav")?.appendChild(link);
    const params=new URLSearchParams(location.search);
    const day=/^\d{4}-\d{2}-\d{2}$/.test(params.get("date")||"")?params.get("date"):
       (()=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+"-"+p.month+"-"+p.day;})();
    fetch(new URL("data/odds/evening/"+day+".json",rootUrl),{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No evening update");return r.json();}).then(data=>{
      if(!Array.isArray(data.matches)||data.reportDate!==day)throw Error("Invalid evening data");
      section.hidden=false;link.hidden=false;
      line.textContent=data.reportDate.split("-").reverse().join("/")+" · "+data.matches.length+" ပွဲ";
      const groups=groupMatches(data.matches);
      for(const [league,items] of groups){
        const holder=el("div","evening-competition");
        const leagueActions=el("div","evening-league-actions"),button=el("button","evening-league-png","⬇ ဒီလိဂ် PNG");
        button.type="button";
        button.addEventListener("click",async()=>{button.disabled=true;try{await png(data,league);}catch(e){console.error(e);}finally{button.disabled=false;}});
        leagueActions.appendChild(button);holder.appendChild(leagueActions);holder.appendChild(tableFor(league,items));root.appendChild(holder);
      }
      allButton.disabled=false;
      allButton.addEventListener("click",async()=>{allButton.disabled=true;try{await png(data);}catch(e){console.error(e);}finally{allButton.disabled=false;}});
    }).catch(e=>{console.info("Evening odds not available for this date",e);section.remove();link.remove();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
  window.FutureCodeEveningOdds={parseQuote,difference};
})();
