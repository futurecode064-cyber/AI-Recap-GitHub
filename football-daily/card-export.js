"use strict";
(function(){
 const W=1200,M=54,C={bg:"#111d22",panel:"#1c2d31",line:"#45605c",orange:"#ffa96c",cream:"#f4f1e9",muted:"#b6cbc3"};
 const font=(s,b)=>String(b?800:500)+" "+s+'px "Noto Sans Myanmar", sans-serif';
 function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
 function text(ctx,t,x,y,size=23,color=C.cream,bold=false,align="left"){
   ctx.textAlign=align;ctx.textBaseline="top";ctx.font=font(size,bold);
   ctx.fillStyle=color;ctx.fillText(String(t||""),x,y);
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
   const H=1160+preview.length*53+extraHeight;
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
   rounded(ctx,538,167,124,100,48,"#142529",C.orange);text(ctx,"VS",600,182,48,"#ffe0b5",true,"center");
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
   text(ctx,match.oddsProvider?"1X2 · "+match.oddsProvider:"1X2 · Decimal Odds",W-M,668,17,C.muted,false,"right");
   rounded(ctx,M,707,W-M*2,142,12,"#293d35","#6a795b");
   text(ctx,"IBET789 · Myanmar ကြေး",M+20,725,21,C.orange,true);
   const a=match.myanmarOdds||{}, h=a.handicap||{},g=a.goals||{};
   if(amount(a)){
     text(ctx,"ဘော်ဒီ  "+odds(h.line)+"   "+match.home+": "+odds(h.home)+"   "+match.away+": "+odds(h.away),M+20,770,19,C.cream);
     text(ctx,"ဂိုးပေါင်း  "+odds(g.line)+"    Over: "+odds(g.over)+"    Under: "+odds(g.under),M+20,807,19,C.cream);
   }else text(ctx,"ပွဲလိုက် Myanmar ကြေး မရရှိသေးပါ",M+20,786,20,C.muted);
   text(ctx,"ပွဲကြိုသုံးသပ်ချက်",M,887,28,C.orange,true);
   let y=957;y=drawLines(ctx,preview,y,28,53);
   if(extras.length){
     y+=38;text(ctx,"★ SPECIAL CHOICE — အသေးစိတ်သုံးသပ်ချက်",M,y,27,C.orange,true);y+=64;
     for(const l of detailed)y=drawLines(ctx,l,y,26,49)+26;
   }
   rect(ctx,M,H-109,W-M*2,2,C.line);
   text(ctx,"FUTURE CODE FOOTBALL",M,H-86,26,C.orange,true);
   text(ctx,"DAILY FOOTBALL MATCH PREVIEW",W-M,H-81,19,C.muted,false,"right");
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG failed")),"image/png"));
   const url=URL.createObjectURL(blob),aLink=document.createElement("a");
   const safe=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
   aLink.href=url;aLink.download="future-code-"+safe(match.home)+"-vs-"+safe(match.away)+".png";
   document.body.append(aLink);aLink.click();aLink.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 window.FutureCodeCardExport={save};
})();
