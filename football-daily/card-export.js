"use strict";
(function(){
 const W=1200,M=54,C={bg:"#111d22",panel:"#1c2d31",line:"#45605c",orange:"#ffa96c",cream:"#f4f1e9",muted:"#b6cbc3"};
 const font=(s,b)=>String(b?800:500)+" "+s+'px "Noto Sans Myanmar", sans-serif';
 function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
 function text(ctx,t,x,y,size=23,color=C.cream,bold=false,align="left",maxWidth=null){
   ctx.textAlign=align;ctx.textBaseline="top";ctx.font=font(size,bold);
   ctx.fillStyle=color;
   if(maxWidth)ctx.fillText(String(t||""),x,y,maxWidth);
   else ctx.fillText(String(t||""),x,y);
 }
 function rounded(ctx,x,y,w,h,r,color,border){
   ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
   if(border){ctx.strokeStyle=border;ctx.lineWidth=2;ctx.stroke()}
 }
 function segmentWords(value){
   const chunks=String(value||"").split(/(\*\*[^*]+\*\*)/g);
   const out=[];
   for(const part of chunks){
     if(!part)continue;
     const bold=part.startsWith("**")&&part.endsWith("**");
     const content=bold?part.slice(2,-2):part;
     for(const w of content.split(/(\s+)/u))if(w)out.push({w,bold,space:/^\s+$/u.test(w)});
   }
   return out;
 }
 function lines(ctx,value,width,size){
   const result=[];let line=[],used=0;
   function flush(){if(line.length){result.push(line);line=[];used=0}}
   function push(word,bold){
     ctx.font=font(size,bold);let mw=ctx.measureText(word).width;
     if(used+mw>width&&line.length)flush();
     if(mw>width){
       const chars=typeof Intl.Segmenter==="function"
       ?[...new Intl.Segmenter("my",{granularity:"grapheme"}).segment(word)].map(x=>x.segment):Array.from(word);
       for(const ch of chars){
         const cw=ctx.measureText(ch).width;
         if(used+cw>width&&line.length)flush();
         line.push({w:ch,bold,width:cw});used+=cw;
       }
     }else{line.push({w:word,bold,width:mw});used+=mw}
   }
   for(const tok of segmentWords(value)){
     if(tok.space){
       if(tok.w.includes("\n")){flush();continue}
       if(!line.length)continue;
       ctx.font=font(size,tok.bold);const sw=ctx.measureText(" ").width;
       if(used+sw>width)flush();
       else{line.push({w:" ",bold:tok.bold,width:sw});used+=sw}
     }else push(tok.w,tok.bold);
   }
   flush();return result;
 }
 function drawLines(ctx,rows,y,size,lh){
   for(const row of rows){let x=M;for(const p of row){text(ctx,p.w,x,y,size,p.bold?C.orange:C.cream,p.bold);x+=p.width}y+=lh}
   return y;
 }
 function odds(v){return v===null||v===undefined||v===""?"—":String(v)}
 const amount=o=>[o?.handicap?.line,o?.handicap?.home,o?.handicap?.away,o?.goals?.line,o?.goals?.over,o?.goals?.under].some(v=>v!==null&&v!==undefined&&String(v)!=="");
 function logo(url){
   return new Promise(resolve=>{
     if(!/^https:\/\//.test(String(url||""))){resolve(null);return}
     const image=new Image();let finished=false;
     function done(v){if(!finished){finished=true;clearTimeout(id);resolve(v)}}
     const id=setTimeout(()=>done(null),7500);
     image.crossOrigin="anonymous";image.onload=()=>done(image);image.onerror=()=>done(null);image.src=url;
   });
 }
 function crest(ctx,img,name,x){
   if(img?.naturalWidth&&img?.naturalHeight){
     const scale=Math.min(205/img.naturalWidth,205/img.naturalHeight);
     const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
     ctx.drawImage(img,x-w/2,218-h/2,w,h);
   }else{
     rounded(ctx,x-86,136,172,172,86,"#3d5a50","#839c8b");
     const abbr=String(name).split(/\s+/).map(s=>s.charAt(0)).slice(0,3).join("").toUpperCase();
     text(ctx,abbr,x,177,52,C.cream,true,"center");
   }
   text(ctx,name,x,326,20,C.cream,true,"center");
 }
 async function save(match,opts={}){
   if(!match||!match.home||!match.away)throw new Error("Invalid match");
   if(document.fonts?.load)await Promise.allSettled([document.fonts.load(font(28,false)),document.fonts.load(font(28,true))]);
   const meter=document.createElement("canvas").getContext("2d");
   const preview=lines(meter,match.dailyPreviewText||"",W-M*2,28);
   const extras=opts.special&&Array.isArray(match.specialAnalysisParagraphs)?match.specialAnalysisParagraphs: [];
   const detailed=extras.map(p=>lines(meter,p,W-M*2,26));
   const extraHeight=extras.length?90+detailed.reduce((sum,l)=>sum+l.length*49+26,0):0;
   const homeFive=Array.isArray(match.homeLastFive)?match.homeLastFive.slice(0,5):[];
   const awayFive=Array.isArray(match.awayLastFive)?match.awayLastFive.slice(0,5):[];
   const h2h=Array.isArray(match.headToHead)?match.headToHead.slice(0,5):[];
   const rowCount=Math.max(homeFive.length,awayFive.length,1);
   // Three horizontal history panels shorten the full-length article PNG.
   const historyHeight=140+Math.max(rowCount,h2h.length,1)*52;
   const H=1160+preview.length*53+extraHeight+historyHeight;
   const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
   const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Browser cannot export PNG");
   rect(ctx,0,0,W,H,C.bg);rounded(ctx,15,15,W-30,H-30,20,C.panel,C.line);
   rect(ctx,18,18,W-36,73,"#17292e");
   text(ctx,"◆ "+(opts.leagueLabel||match.league),M,42,22,C.orange,true);
   text(ctx,match.kickoffYangon||"",W-M,42,19,C.muted,false,"right");
   const grad=ctx.createLinearGradient(0,90,W,370);
   grad.addColorStop(0,"#273335");grad.addColorStop(.5,"#2b4b43");grad.addColorStop(1,"#273335");
   rect(ctx,18,92,W-36,292,grad);
   const imgs=await Promise.all([logo(match.homeCrestUrl),logo(match.awayCrestUrl)]);
   crest(ctx,imgs[0],match.home,260);crest(ctx,imgs[1],match.away,940);
   // Align the VS glyph around the exact geometric centre of the PNG badge.
   const vsLeft=538,vsTop=167,vsWidth=124,vsHeight=100;
   rounded(ctx,vsLeft,vsTop,vsWidth,vsHeight,48,"#142529",C.orange);
   ctx.save();
   ctx.font=font(48,true);
   ctx.fillStyle="#ffe0b5";
   ctx.textAlign="center";
   ctx.textBaseline="middle";
   ctx.fillText("VS",vsLeft+vsWidth/2,vsTop+vsHeight/2);
   ctx.restore();
   text(ctx,match.home+"  vs  "+match.away,600,417,34,C.cream,true,"center");
   text(ctx,match.venue||"",600,466,18,C.muted,false,"center");
   const boxW=(W-M*2)/3;
   rounded(ctx,M,519,W-M*2,142,10,"#263b36",C.line);
   [[match.home+" နိုင် (1)",match.homeOdds],["သရေ (X)",match.drawOdds],[match.away+" နိုင် (2)",match.awayOdds]].forEach((pair,i)=>{
     const cx=M+boxW*(i+.5);
     text(ctx,pair[0],cx,540,17,C.muted,false,"center");
     text(ctx,odds(pair[1]),cx,589,30,C.cream,true,"center");
     if(i<2)rect(ctx,M+boxW*(i+1),519,1,142,C.line);
   });
   text(ctx,"1X2 · Decimal Odds",W-M,668,17,C.muted,false,"right");
   rounded(ctx,M,707,W-M*2,142,12,"#293d35","#6a795b");
   text(ctx,"မြန်မာကြေး",M+20,725,21,C.orange,true);
   const a=match.myanmarOdds||{},h=a.handicap||{},g=a.goals||{};
   const present=v=>v!==null&&v!==undefined&&String(v).trim()!=="";
   const body=present(a.bodyOdds)?String(a.bodyOdds):
     [present(h.line)?"အကျော "+h.line:"",present(h.home)?match.home+" "+h.home:"",present(h.away)?match.away+" "+h.away:""].filter(Boolean).join(" · ")||"—";
   const goals=present(a.goalTotalOdds)?String(a.goalTotalOdds):
     [present(g.line)?"ဂိုးပေါင်း "+g.line:"",present(g.over)?"Over "+g.over:"",present(g.under)?"Under "+g.under:""].filter(Boolean).join(" · ")||"—";
   text(ctx,"ဘော်ဒီကြေး = "+body,M+20,766,20,C.cream);
   text(ctx,"ဂိုးပေါင်းကြေး = "+goals,M+20,809,20,C.cream);
   // The same Home Last 5 | H2H | Away Last 5 layout as the website.
   const formY=867,panelGap=12,colWidth=(W-M*2-panelGap*2)/3;
   const hx=M,mx=M+colWidth+panelGap,ax=mx+colWidth+panelGap;
   const panelHeight=historyHeight-20;
   for(const x of [hx,mx,ax])rounded(ctx,x,formY,colWidth,panelHeight,11,"#243935",C.line);
   text(ctx,"အိမ်ရှင် နောက်ဆုံး ၅ ပွဲ",hx+13,formY+15,20,C.orange,true,"left",colWidth-26);
   text(ctx,"ထိပ်တိုက်တွေ့ဆုံမှု (H2H)",mx+13,formY+15,19,C.orange,true,"left",colWidth-26);
   text(ctx,"ဧည့်သည် နောက်ဆုံး ၅ ပွဲ",ax+13,formY+15,20,C.orange,true,"left",colWidth-26);
   text(ctx,match.home,hx+13,formY+49,18,C.cream,true,"left",colWidth-24);
   text(ctx,match.away,ax+13,formY+49,18,C.cream,true,"left",colWidth-24);
   function compactFive(games,x){
     if(!games.length){text(ctx,"အတည်ပြုစာရင်း မရရှိသေး",x+13,formY+92,16,C.muted,false,"left",colWidth-26);return;}
     games.forEach((game,i)=>{
       const score=Number.isInteger(game.teamGoals)&&Number.isInteger(game.opponentGoals)
         ?game.teamGoals+" – "+game.opponentGoals:"—";
       const ground=game.venueSide==="home"?"H":game.venueSide==="away"?"A":"";
       const lineY=formY+90+i*52;
       rect(ctx,x+12,lineY-6,colWidth-24,1,C.line);
       text(ctx,ground+" "+String(game.opponent||""),x+13,lineY+5,16,C.cream,false,"left",colWidth-104);
       text(ctx,score,x+colWidth-13,lineY+5,17,C.muted,true,"right",75);
     });
   }
   compactFive(homeFive,hx);compactFive(awayFive,ax);
   if(!h2h.length)text(ctx,"အတည်ပြုစာရင်း မရရှိသေး",mx+13,formY+92,16,C.muted,false,"left",colWidth-26);
   for(const [i,g] of h2h.entries()){
     const score=Number.isInteger(g.homeGoals)&&Number.isInteger(g.awayGoals)
      ?g.homeGoals+" – "+g.awayGoals:"—";
     const yRow=formY+90+i*52;
     rect(ctx,mx+12,yRow-6,colWidth-24,1,C.line);
     text(ctx,g.date||"",mx+13,yRow,14,C.muted,false,"left",colWidth-105);
     text(ctx,score,mx+colWidth-13,yRow,17,C.orange,true,"right",95);
     text(ctx,(g.home||"")+" – "+(g.away||""),mx+13,yRow+23,14,C.cream,false,"left",colWidth-26);
   }
   text(ctx,"ပွဲကြိုသုံးသပ်ချက်",M,887+historyHeight,28,C.orange,true);
   let y=957+historyHeight;y=drawLines(ctx,preview,y,28,53);
   if(extras.length){
     y+=38;text(ctx,"★ SPECIAL CHOICE — အသေးစိတ်သုံးသပ်ချက်",M,y,27,C.orange,true);y+=64;
     for(const l of detailed)y=drawLines(ctx,l,y,26,49)+26;
   }
   rect(ctx,M,H-109,W-M*2,2,C.line);
   text(ctx,opts.brandName||"FUTURE CODE FOOTBALL",M,H-86,26,C.orange,true);
   text(ctx,"DAILY FOOTBALL MATCH PREVIEW",W-M,H-81,19,C.muted,false,"right");
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG failed")),"image/png"));
   const url=URL.createObjectURL(blob),aLink=document.createElement("a");
   const safe=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
   aLink.href=url;aLink.download=safe(opts.brandName||"FUTURE CODE FOOTBALL")+"-"+safe(match.home)+"-vs-"+safe(match.away)+".png";
   document.body.append(aLink);aLink.click();aLink.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 window.FutureCodeCardExport={save};
})();
