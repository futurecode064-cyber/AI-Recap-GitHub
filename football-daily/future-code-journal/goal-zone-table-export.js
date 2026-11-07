"use strict";
/* Goal Zone's own native-canvas table export, matching the main site's row/
   league/column structure. Shared prediction and probability models only:
   NO fabricated VIP scorelines, percentages, or external image services. */
(function(root){
  const W=1280,TOP=124,LEAGUE=78,COLUMN=62,ROW=98,FOOT=56;
  const gold="#e9c276",ink="#fff6e6",muted="#d0c5b1",border="#67522e";
  const name=m=>String(m?.leagueDisplay||root.FutureCodeBrandExportData?.leagueName(m?.league)||m?.league||"Football");
  const team=(m,side)=>String(m?.[side+"Display"]||m?.[side]||"—").trim();
  const clock=m=>root.FutureCodeTime?.clock?.(m)||"—";
  const logo=league=>root.FutureCodeBrandExportData?.leagueCrest?.(league)||"";
  let tipsDate="",tipsPromise=null;
  async function ensureTips(day){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day||""))return;
    if(tipsDate===day&&tipsPromise)return tipsPromise;
    tipsDate=day;
    const tips=root.FutureCodeTipScores;
    tipsPromise=tips?.load
      ?tips.load(day,(_unused,options)=>{
        const url=new URL("../data/tips/"+day+".json",document.baseURI);
        const loader=root.FootballData?.fetch||root.fetch.bind(root);
        return loader(url.href,options);
       })
      :Promise.resolve(0);
    return tipsPromise;
  }
  function groups(matches){
    const map=new Map();
    for(const match of matches){
      const key=match.league||"Other";
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(match);
    }
    return [...map].map(([league,rows])=>({league,rows}));
  }
  function box(ctx,x,y,w,h,fill){
    ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=border;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  }
  function cell(k,ctx,value,x,y,w,h,opts={}){
    const text=String(value??"—");
    const font=k.fit(ctx,text,w-18,opts.size||25,opts.min||15);
    k.text(ctx,text,opts.align==="left"?x+12:x+w/2,y+h/2,font,opts.color||ink,
      opts.bold!==false,opts.align||"center",w-20);
  }
  function valueOrDash(p){
    return Number.isInteger(p)&&p>=0&&p<=100?p+"%":"—";
  }
  function marketFor(m,options){
    return options.oddsById?.get(m.fixtureId)
      ||options.oddsByKey?.get(m.fixtureId?"fixture:"+m.fixtureId:[m.league||"",m.home||"",m.away||""].join("|"))
      ||null;
  }
  function drawTeams(k,ctx,m,y,xMax){
    const h=team(m,"home"),a=team(m,"away"),center=505;
    cell(k,ctx,clock(m),20,y+10,125,ROW-20,{size:23,color:gold});
    // Native canvas names remain selectable from the exact published PDF fields.
    const available=Math.max(140,xMax-575);
    k.text(ctx,h,423,y+ROW/2,k.fit(ctx,h,235,23,15),ink,true,"right",235);
    if(m.homeCrestUrl)k.crest(ctx,m.homeCrestUrl,437,y+26,46,h);
    k.text(ctx,"နှင့်",center,y+ROW/2,17,muted,true,"center");
    if(m.awayCrestUrl)k.crest(ctx,m.awayCrestUrl,533,y+26,46,a);
    k.text(ctx,a,594,y+ROW/2,k.fit(ctx,a,available,23,15),ink,true,"left",available);
  }
  async function render(type,matches,options={}){
    if(!["ai","probability"].includes(type))throw Error("Unsupported Goal Zone table type");
    if(!Array.isArray(matches)||!matches.length)throw Error("ဇယားထုတ်ရန် ပွဲစဉ်မရှိပါ");
    const kit=root.FutureCodeCanvasKit;
    if(!kit?.create||!kit?.fonts||!kit?.preloadImages)throw Error("Goal Zone table renderer unavailable");
    const day=String(options.day||"");
    if(type==="ai")await ensureTips(day);
    const ordered=groups(matches);
    const height=TOP+FOOT+ordered.length*(LEAGUE+COLUMN)+matches.length*ROW;
    if(height>16384)throw Error("PNG ပွဲစဉ်များလွန်းပါသည် — ၂ ပုံခွဲရန် ရွေးပါ");
    const {canvas,ctx}=kit.create(W,height);
    const assets=[...ordered.map(g=>logo(g.league)),...matches.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl])].filter(Boolean);
    await Promise.all([kit.fonts(),kit.preloadImages(assets)]);
    box(ctx,0,0,W,height,"#0e0c09");
    box(ctx,0,0,W,TOP,"#1e180f");
    ctx.fillStyle=gold;ctx.fillRect(0,0,W,7);
    kit.text(ctx,"GOAL ZONE  ·  ဂိုးဇုံ အားကစား ဂျာနယ်",28,35,24,gold,true);
    kit.text(ctx,type==="ai"?"AI ခန့်မှန်းချက်":"ပွဲစဉ် ဖြစ်နိုင်ခြေ (%)",28,84,32,ink,true);
    kit.text(ctx,day,W-28,77,23,muted,true,"right");
    let y=TOP;
    const columns=type==="ai"
      ?[{title:"VIP Internet",x:800,w:150},{title:"Bookies",x:950,w:150},{title:"AI Tips",x:1100,w:180}]
      :[{title:"အိမ်ရှင်",x:740,w:135},{title:"ဧည့်သည်",x:875,w:135},{title:"ဂိုးပေါ်",x:1010,w:135},{title:"ဂိုးအောက်",x:1145,w:135}];
    for(const group of ordered){
      box(ctx,0,y,W,LEAGUE,"#4a3619");
      const crest=logo(group.league);
      if(crest)kit.crest(ctx,crest,28,y+13,51,"⚽");
      kit.text(ctx,name(group.rows[0]),crest?96:35,y+LEAGUE/2,
        kit.fit(ctx,name(group.rows[0]),950,27,19),ink,true,"left",950);
      y+=LEAGUE;
      box(ctx,0,y,W,COLUMN,"#261e12");
      cell(kit,ctx,"အချိန်",18,y,128,COLUMN,{size:22,color:gold});
      cell(kit,ctx,"ပွဲစဉ် / အသင်းများ",146,y,columns[0].x-146,COLUMN,{size:24,color:gold});
      for(const c of columns){
        box(ctx,c.x,y,c.w,COLUMN,"#513b1d");
        cell(kit,ctx,c.title,c.x,y,c.w,COLUMN,{size:22,color:"#fff3cd"});
      }
      y+=COLUMN;
      for(const [idx,m] of group.rows.entries()){
        box(ctx,0,y,W,ROW,idx%2?"#201d18":"#15130f");
        // Column walls are laid out on a single grid; no per-match card stacking.
        ctx.strokeStyle=border;ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(146,y);ctx.lineTo(146,y+ROW);ctx.stroke();
        drawTeams(kit,ctx,m,y,columns[0].x);
        let vals;
        if(type==="ai"){
          vals=root.FutureCodeTipScores?.predict?.(m);
          if(!Array.isArray(vals)||vals.length!==3)
            vals=["—","—",root.FutureCodeAiScoreModel?.predict?.(m)?.[0]||"—"];
        }else{
          const p=root.FutureCodeProbabilityModel?.analyze?.(m,marketFor(m,options),day)||{};
          vals=[p.win?.home,p.win?.away,p.goals?.over,p.goals?.under].map(valueOrDash);
        }
        for(let i=0;i<columns.length;i++){
          const c=columns[i],v=String(vals[i]??"—");
          box(ctx,c.x,y,c.w,ROW,idx%2?"#302719":"#282217");
          cell(kit,ctx,v,c.x,y,c.w,ROW,{size:32,min:20,color:i===0?gold:ink});
        }
        y+=ROW;
      }
    }
    box(ctx,0,height-FOOT,W,FOOT,"#1b150c");
    kit.text(ctx,type==="ai"?"VIP Internet · Bookies · AI Tips":"အိမ်ရှင် · ဧည့်သည် · ဂိုးပေါ် · ဂိုးအောက်",22,height-FOOT/2,21,gold,true);
    kit.text(ctx,matches.length+" ပွဲ  ·  "+day,W-22,height-FOOT/2,19,muted,true,"right");
    return canvas;
  }
  root.GoalZoneTableExport=Object.freeze({render});
})(window);
