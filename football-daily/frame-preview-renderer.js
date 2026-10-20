"use strict";
/* Main frame studio only: native Canvas layout matching the publication's card. */
(function(){
 const leagues={'Premier League':'ပရီးမီးယားလိဂ်','Serie A':'စီးရီးအေ','La Liga':'လာလီဂါ','Bundesliga':'ဘွန်ဒက်စ်လီဂါ','Ligue 1':'လီဂူးဝမ်း'};
 const safe=v=>v===undefined||v===null||String(v).trim()===''?'—':String(v);
 function result(g){if(!g)return '–';if(Number.isInteger(g.teamGoals)&&Number.isInteger(g.opponentGoals))return g.teamGoals>g.opponentGoals?'W':g.teamGoals<g.opponentGoals?'L':'D';return /^[WDL]$/.test(g.result||'')?g.result:'–';}
 function wrap(ctx,value,width,size){
  const words=typeof Intl.Segmenter==='function'?new Intl.Segmenter('my',{granularity:'word'}):null;
  const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('my',{granularity:'grapheme'}):null;
  const rows=[[]];let used=0;
  for(const chunk of String(value||'').split(/(\*\*[^*\n]+\*\*)/g)){
   const bold=chunk.startsWith('**')&&chunk.endsWith('**'),str=bold?chunk.slice(2,-2):chunk;
   const tokens=words?[...words.segment(str)].map(s=>s.segment):str.split(/(\s+)/u);
   ctx.font=(bold?'800 ':'500 ')+size+'px "Noto Sans Myanmar",sans-serif';
   const push=token=>{if(token.includes('\n')){const parts=token.split('\n');for(let i=0;i<parts.length;i++){if(i){rows.push([]);used=0;}if(parts[i])push(parts[i]);}return;}const w=ctx.measureText(token).width;if(used+w>width&&used){rows.push([]);used=0;}const row=rows[rows.length-1];if(row.length&&row[row.length-1].bold===bold)row[row.length-1].str+=token;else row.push({str:token,bold});used+=w;};
   for(const token of tokens){if(ctx.measureText(token).width>width){for(const g of graphemes?[...graphemes.segment(token)].map(x=>x.segment):Array.from(token))push(g);}else push(token);}
  }return rows;
 }
 function highlight(value,m){
  const names=[m.homeDisplay,m.awayDisplay,m.home,m.away].filter(Boolean).sort((a,b)=>b.length-a.length);
  return String(value||'').split(/(\*\*[^*]+\*\*)/g).map(part=>{if(part.startsWith('**'))return part;for(const name of new Set(names))part=part.split(/(\*\*[^*]+\*\*)/g).map(run=>run.startsWith('**')?run:run.split(name).join('**'+name+'**')).join('');return part;}).join('');
 }
 const defaultTheme={bg:'#030d19',head:'#082c54',panel:'#061726',alt:'#12518a',accent:'#43b9f0'};
 async function render(m,theme=defaultTheme,options={}){
  const k=window.FutureCodeCanvasKit;if(!k)throw Error('Canvas module မရသေးပါ');await k.fonts();
  const leagueLogo=window.FutureCodeMainLogoAssets?.leagueCrest(m.league);await k.preloadImages([m.homeCrestUrl,m.awayCrestUrl,leagueLogo].filter(Boolean));
  const W=1200,M=26,px=28,gap=49,t={...defaultTheme,...theme},gold='#edc45b';
  const special=options.special===true;
  const source=special?(m.specialAnalysisParagraphs||[]).filter(Boolean).join('\n\n'):m.dailyPreviewText;
  const article=String(source||'ပွဲကြိုသုံးသပ်ချက် မရသေးပါ').replace(/\s*(?:ဖြစ်နိုင်တဲ့|ဖြစ်နိုင်သည့်|ခန့်မှန်း)\s*ဂိုးရလဒ်[^။\n]*[။]?/gu,'').trim();
  const measure=k.create(W,10).ctx,rows=wrap(measure,highlight(article,m),W-2*M-48,px);
  const articleY=650,H=articleY+50+Math.max(1,rows.length)*gap+26;
  const {canvas,ctx}=k.create(W,H);
  const text=(s,x,y,size=24,color='#fff',bold=false,align='left',max)=>k.text(ctx,s,x,y,size,color,bold,align,max);
  const fill=(x,y,w,h,c,r=0)=>k.fill(ctx,x,y,w,h,c,r);
  const gradient=(x,y,w,h,a,b)=>{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);fill(x,y,w,h,g);};
  const box=(x,y,w,h,c=t.panel,r=16)=>{fill(x,y,w,h,c,r);ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,h-2,r);ctx.stroke();};
  gradient(0,0,W,H,t.head,t.bg);
  // Stadium-like light beams remain vector sharp at PNG resolution.
  ctx.save();ctx.strokeStyle=t.accent+'24';ctx.lineWidth=2;
  for(let i=0;i<11;i++){ctx.beginPath();ctx.moveTo(i*120,0);ctx.lineTo(W-i*95,380);ctx.stroke();}
  ctx.restore();
  for(const x of [35,110,1090,1165]){fill(x-28,28,56,4,t.accent,2);fill(x-13,19,26,22,'#effaff',10);}
  k.crest(ctx,m.homeCrestUrl,125,36,210,m.homeDisplay||m.home,true);
  k.crest(ctx,m.awayCrestUrl,865,36,210,m.awayDisplay||m.away,true);
  box(498,0,204,128,'#dcebf6',15);if(leagueLogo)k.crest(ctx,leagueLogo,556,8,88,'',true);
  text(leagues[m.league]||m.league||'FOOTBALL',600,113,17,'#061726',true,'center',190);
  box(426,138,348,83,t.bg,14);
  text(m.kickoffYangon||m.kickoff||'ပွဲချိန် မရသေးပါ',600,169,23,'#fff',true,'center',325);
  text('မြန်မာစံတော်ချိန် (MMT)',600,201,16,'#dce9f5',false,'center');
  box(M,256,476,90,t.head);box(698,256,476,90,t.head);
  const home=m.homeDisplay||m.home,away=m.awayDisplay||m.away;
  text(home,264,302,k.fit(ctx,home,435,37,21),'#fff',true,'center',435);
  text(away,936,302,k.fit(ctx,away,435,37,21),'#fff',true,'center',435);
  text('VS',600,297,83,gold,true,'center');
  const Y=373,w=366,h=153,xs=[M,417,808];
  for(const x of xs)box(x,Y,w,h);
  const form=(x,games)=>{text('နောက်ဆုံး ၅ ပွဲရလဒ်',x+w/2,Y+29,25,'#fff',true,'center');for(let i=0;i<5;i++){const letter=result(games?.[i]),cx=x+55+i*64,cy=Y+98;fill(cx-24,cy-24,48,48,letter==='W'?'#00ad62':letter==='D'?'#467caf':letter==='L'?'#e82c47':'#536363',24);text(letter,cx,cy+1,27,'#fff',true,'center');}};
  form(xs[0],m.homeLastFive);form(xs[2],m.awayLastFive);
  text('ပွဲပြီး 1X2 ကြေး',600,Y+29,25,'#fff',true,'center');
  const markets=[['အိမ်ရှင် (1)',m.homeOdds],['သရေ (X)',m.drawOdds],['ဧည့်သည် (2)',m.awayOdds]];
  for(let i=0;i<3;i++){const x=xs[1]+w*(i+.5)/3;text(markets[i][0],x,Y+77,18,'#fff',true,'center',115);text(safe(markets[i][1]),x,Y+119,32,'#fff2b3',true,'center',115);}
  const odds=m.myanmarOdds||{};box(M,548,W-2*M,81,t.panel,14);
  text(special?'★ အထူးသုံးသပ်ချက်':'ပွဲကြိုသုံးသပ်ချက်',M+18,579,28,gold,true,'left',365);
  text('အပေါ်အသင်း: '+safe(odds.upperTeam)+' · ဘော်ဒီ: '+safe(odds.bodyOdds)+' · ဂိုးပေါင်း: '+safe(odds.goalTotalOdds),M+18,610,20,'#fff',false,'left',W-2*M-36);
  box(M,articleY,W-2*M,H-articleY,t.panel,20);
  let y=articleY+43;for(const row of rows){let x=M+24;for(const run of row){text(run.str,x,y,px,run.bold?t.accent:'#f7faff',run.bold);ctx.font=(run.bold?'800 ':'500 ')+px+'px "Noto Sans Myanmar",sans-serif';x+=ctx.measureText(run.str).width;}y+=gap;}
  return canvas;
 }
 window.FutureCodeFramePreview={render,result,wrap,defaultTheme,highlight};
})();
