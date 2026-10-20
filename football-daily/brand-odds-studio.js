"use strict";
(async function(){
 if(document.documentElement.dataset.footballBrandName||!/^\/(?:index\.html)?$/.test(location.pathname))return;
 const frames=[
 ['ggoal','GGOAL','#a77b00','#ffe147'],['kmm','KMM','#790407','#ff384b'],['special','Special One','#003550','#22baff'],
 ['thuta','THUTA','#10432d','#d6cf8d'],['kotwat','ကိုတွတ်ပီ','#68080d','#ff554d'],
 ['colour','Colour Background Change','#153c63','#58beff'],
 // Add the previously uploaded main-site posters; preserve every existing homepage choice.
 ['best-art','Best Your Choice (Frame အသစ်)','#132ab0','#ffffff',{file:'best',split:true}],
 ['htet-art','Htet Ko (Frame အသစ်)','#145800','#ffffff',{file:'htet',split:true}],
 ['bcf-art','BCF (Frame အသစ်)','#073682','#ffffff',{file:'bcf-frame.jpg',top:0.0927734375,bottom:0.072265625}],
 ['final-art','Final Goal (Frame အသစ်)','#876013','#ffffff',{file:'final-goal-frame.jpg',top:0.14857142857142858,bottom:0.037142857142857144}],
 ['hyper-art','Hyper Goal (Frame အသစ်)','#986100','#ffffff',{file:'hyper-goal-frame.jpg',top:0.12950450450450451,bottom:0.10191441441441441}],
 ['pmm-art','Team PMM (Frame အသစ်)','#5e0814','#ffffff',{file:'team-pmm-frame.jpg',top:0.15625,bottom:0.11865234375}],
 ['ymc-art','YMC (Frame အသစ်)','#16113d','#ffffff',{file:'ymc-frame.jpg',top:0.160481444332999,bottom:0.11735205616850551}],
 ['khin-art','ခင်ခင်ထား နှင့် လက်ရုံးလေးများ (Frame အသစ်)','#77005b','#ffffff',{file:'khin-khin-htar-frame.jpg',top:0.1867572156196944,bottom:0.13412563667232597}],
 ['kochan-art','Ko Chan (Frame အသစ်)','#0d1745','#ffffff',{file:'ko-chan-frame.jpg',top:0.13464526152252718,bottom:0}],
 ['ggoal-art','GGOAL (Frame အသစ်)','#b58100','#ffffff',{file:'ggoal-frame.jpg',top:0.166015625,bottom:0.052734375}],
 ['kmm-art','KMM (Frame အသစ်)','#a50918','#ffffff',{file:'kmm-frame.jpg',top:0.10498046875,bottom:0.06494140625}],
 ['special-art','Special One (Frame အသစ်)','#236c87','#ffffff',{file:'special-one-frame.jpg',top:0.07331378299120235,bottom:0.03714565004887586}],
 ['kotwat-art','ကိုတွတ်ပီ (Frame အသစ်)','#9a1114','#ffffff',{file:'ko-tut-pi-frame.jpg',top:0.14316239316239315,bottom:0.14262820512820512}],
 ['thuta-art','THUTA (Frame အသစ်)','#115136','#ffffff',{file:'thuta-frame.jpg',top:0.1318359375,bottom:0.0966796875}]
 ];
 const section=document.createElement('section');section.id='brandOddsStudio';section.className='section container';section.innerHTML=`<h2>Frame အလိုက် ပေါက်ကြေး PNG</h2><p>ဘော်ဒီကြေးကို ကြေးပေးအသင်းဘေး၊ ဂိုးပေါင်းကြေးကို တစ်ဖက်အသင်းဘေးတွင် ပြသပါမည်။</p><div class="bo-controls"><label>Frame <select id="boFrame"></select></label><label id="boColourWrap" hidden>Colour Theme <select id="boColour"><option value="#b51a24">အနီ</option><option value="#16589d">အပြာ</option><option value="#197447">အစိမ်း</option><option value="#976c09">ရွှေ</option><option value="#6d3597">ခရမ်း</option><option value="custom">စိတ်ကြိုက်</option></select><input type="color" id="boCustom" value="#b51a24" aria-label="စိတ်ကြိုက်အရောင်" hidden></label><label>ကြေးအမျိုးအစား <select id="boMarket"><option value="morning">မူလကြေး</option><option value="current">ယခုကြေး</option></select></label><label>ပုံခွဲရန် <select id="boSplit"><option value="auto">ပွဲများလျှင် ၂ ပုံခွဲမည်</option><option value="two">တစ်ဝက်စီ ၂ ပုံ</option><option value="one">တစ်ပုံတည်း</option></select></label></div><fieldset><legend>ပါဝင်စေချင်သည့်လိဂ်များ ရွေးပါ</legend><div id="boLeagues" class="bo-controls"></div></fieldset><div class="bo-controls"><button id="boPreview" type="button">နမူနာကြည့်မယ်</button><button id="boDownload" type="button">ပေါက်ကြေး PNG Download</button><button id="boAllZip" type="button" class="bo-all-zip">⬇ Frame အားလုံး ZIP ဖြင့် Download မည်</button></div><p id="boZipInfo">ရွေးထားသော လိဂ်များကို Frame အမျိုးအစားအားလုံးဖြင့် ZIP တစ်ဖိုင်တည်း Download လုပ်နိုင်ပါသည်။</p><p id="boStatus" role="status" aria-live="polite"></p><div id="boOutput"></div>`;
 const style=document.createElement('style');style.textContent='#brandOddsStudio [hidden],#brandPreviewStudio [hidden]{display:none!important}#brandOddsStudio{padding:28px 20px;border:1px solid #425855;border-radius:16px;margin:30px auto}#brandOddsStudio .bo-controls{display:flex;gap:14px;flex-wrap:wrap;margin:18px 0}#brandOddsStudio select,#brandOddsStudio button{font:inherit;padding:10px;border-radius:8px}#brandOddsStudio button{background:#ffd39b;color:#182426;border:0;cursor:pointer}#brandOddsStudio label{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#brandOddsStudio img{display:block;width:100%;max-width:580px;margin:20px auto}#brandOddsStudio a{display:block;padding:12px}#brandOddsStudio .bo-all-zip{background:#287b53;color:#fff;font-weight:800;flex:1 1 100%;min-height:52px;border:1px solid #80dbab}#brandOddsStudio button:disabled{opacity:.55;cursor:wait}#brandOddsStudio #boZipInfo{color:#b9d4ca;font-size:12px;line-height:2}';document.head.append(style);document.querySelector('main').append(section);
 const el=id=>section.querySelector('#'+id);let rows=[],date='',busy=false;const urls=[];frames.forEach((f,i)=>el('boFrame').add(new Option(f[1],String(i))));
 const frame=()=>frames[Number(el('boFrame').value)];el('boFrame').onchange=()=>{el('boColourWrap').hidden=frame()[0]!=='colour';};el('boColour').onchange=()=>{el('boCustom').hidden=el('boColour').value!=='custom';};
 const leagueNames={"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","Swedish Superettan":"ဆွီဒင် စူပါတန် လိဂ်","German 3. Liga":"ဂျာမန် ဘွန်ဒစ်လီဂါ ၃","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Turkish Super Lig":"တူရကီ စူပါလိဂ်","Italian Serie C":"အီတလီ စီးရီးစီ"};
 const shade=(hex,f)=>'#'+hex.slice(1).match(/../g).map(x=>Math.min(255,Math.round(parseInt(x,16)*f)).toString(16).padStart(2,'0')).join('');
 const imageCache=new Map();const load=src=>{if(!imageCache.has(src))imageCache.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{imageCache.delete(src);reject(Error('Frame Banner ပုံ ရယူမရပါ — '+src));};im.src=src;}));return imageCache.get(src);};
 function write(ctx,text,x,y,size=25,color='#fff',align='left',max=1000){ctx.font='700 '+size+'px "Noto Sans Myanmar",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(String(text??'—'),x,y,max);}
 function badge(ctx,kit,src,x,y,label){kit.crest(ctx,src,x,y,64,label);}
 async function draw(list,part,total,chosen=frame()){const kit=window.FutureCodeCanvasKit;if(!kit)throw Error('PNG module မရသေးပါ');await kit.fonts();await kit.preloadImages(list.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]).filter(Boolean));
 const f=chosen,custom=f[0]==='colour',base=custom?(el('boColour').value==='custom'?el('boCustom').value:el('boColour').value):f[2],accent=custom?'#fff':f[3];
 const artwork=f[4]||null,dir='./assets/table-odds-frames/';
 const full=artwork&&!artwork.split?await load(dir+artwork.file):null;
 const top=custom||full?null:await load(artwork?.split?dir+artwork.file+'-top.jpg':'./assets/odds-frames/'+f[0]+'-top.jpg');
 const bottom=custom||full?null:await load(artwork?.split?dir+artwork.file+'-bottom.jpg':'./assets/odds-frames/'+f[0]+'-bottom.jpg');
 const W=1200,th=full?Math.round(full.height*artwork.top*W/full.width):top?Math.round(top.height*W/top.width):0,bh=full?Math.round(full.height*artwork.bottom*W/full.width):bottom?Math.round(bottom.height*W/bottom.width):0;
 let last=null,body=110;for(const m of list){if(last!==m.league){body+=72;last=m.league;}body+=104;}
 const {canvas,ctx}=kit.create(W,th+body+bh+24);ctx.fillStyle=shade(base,.4);ctx.fillRect(0,0,W,canvas.height);
 if(full&&th)ctx.drawImage(full,0,0,full.width,full.height*artwork.top,0,0,W,th);else if(top)ctx.drawImage(top,0,0,W,th);let y=th+52;write(ctx,date+' · '+(el('boMarket').value==='current'?'ယခုကြေး':'မူလကြေး')+(total>1?' · '+part+'/'+total:''),W/2,y,27,accent,'center');y+=58;last=null;
 for(const m of list){if(last!==m.league){ctx.fillStyle=shade(base,.65);ctx.fillRect(25,y,1150,60);write(ctx,(leagueNames[m.league]||m.league),W/2,y+30,27,'#fff','center');y+=72;last=m.league;}
 ctx.fillStyle='#f6f4ea';ctx.beginPath();ctx.moveTo(24,y);ctx.lineTo(1176,y);ctx.lineTo(1158,y+86);ctx.lineTo(42,y+86);ctx.closePath();ctx.fill();
 const normalize=s=>String(s||'').normalize('NFC').replace(/\s/g,'');const awayUpper=normalize(m.upperTeam)===normalize(m.away)||normalize(m.upperTeam)===normalize(m.canonicalAway);const known=awayUpper||normalize(m.upperTeam)===normalize(m.home)||normalize(m.upperTeam)===normalize(m.canonicalHome);const current=el('boMarket').value==='current',bodyOdds=current?m.currentBodyOdds:m.bodyOdds,goals=current?m.currentGoalTotalOdds:m.goalTotalOdds;
 badge(ctx,kit,m.homeCrestUrl,42,y+10,m.home);badge(ctx,kit,m.awayCrestUrl,1094,y+10,m.away);
 write(ctx,m.home,252,y+42,25,'#12202a','center',280);write(ctx,m.away,948,y+42,25,'#12202a','center',280);
 // Every quote carries its own Myanmar market name, including when the upper team is away.
 const quote=(kind,value,x)=>{ctx.fillStyle=base;ctx.fillRect(x-83,y+8,166,70);
  write(ctx,kind==='body'?'ဘော်ဒီကြေး':'ဂိုးပေါင်းကြေး',x,y+24,20,accent,'center',162);
  write(ctx,value||'—',x,y+57,27,'#fff','center',158);};
 if(known&&awayUpper){quote('goals',goals,468);quote('body',bodyOdds,732);}
 else if(known){quote('body',bodyOdds,468);quote('goals',goals,732);}
 else{quote('body','—',468);quote('goals','—',732);}
 write(ctx,m.kickoff||'VS',600,y+42,23,'#12202a','center',90);y+=104;}
 if(full&&bh)ctx.drawImage(full,0,full.height*(1-artwork.bottom),full.width,full.height*artwork.bottom,0,canvas.height-bh,W,bh);else if(bottom)ctx.drawImage(bottom,0,canvas.height-bh,W,bh);return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG ဖန်တီးမရပါ')),'image/png'));}
 async function run(download){if(busy)return;const leagues=new Set([...el('boLeagues').querySelectorAll('input:checked')].map(x=>x.value));const list=rows.filter(m=>leagues.has(m.league));if(!list.length){el('boStatus').textContent='လိဂ် အနည်းဆုံးတစ်ခု ရွေးပါ။';return;}busy=true;section.querySelectorAll('button,select,input').forEach(x=>x.disabled=true);try{urls.forEach(URL.revokeObjectURL);urls.length=0;el('boOutput').replaceChildren();const split=el('boSplit').value;const cut=Math.ceil(list.length/2);const groups=list.length>1&&(split==='two'||split==='auto'&&list.length>12)?[list.slice(0,cut),list.slice(cut)]:[list];for(let i=0;i<groups.length;i++){el('boStatus').textContent=`ပုံ ${i+1}/${groups.length} ဖန်တီးနေသည်…`;const blob=await draw(groups[i],i+1,groups.length);const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=frame()[0]+'-odds-'+date+'-'+(i+1)+'.png';a.textContent=`⬇ ပုံ ${i+1} Download · ${groups[i].length} ပွဲ`;const im=document.createElement('img');im.src=url;im.alt=frame()[1]+' ပေါက်ကြေး ပုံ '+(i+1);el('boOutput').append(a,im);if(download){a.click();await new Promise(r=>setTimeout(r,500));}}el('boStatus').textContent=`${list.length} ပွဲ · ${groups.map(g=>g.length+' ပွဲ').join(' / ')} · ${groups.length} ပုံ အဆင်သင့်ဖြစ်ပါပြီ။`;}catch(e){el('boStatus').textContent=e.message;}finally{busy=false;section.querySelectorAll('button,select,input').forEach(x=>x.disabled=false);}}
 async function runAllZip(){
  if(busy)return;
  const leagues=new Set([...el('boLeagues').querySelectorAll('input:checked')].map(x=>x.value));
  const list=rows.filter(m=>leagues.has(m.league));
  if(!list.length){el('boStatus').textContent='ZIP Download အတွက် လိဂ် အနည်းဆုံးတစ်ခု ရွေးပါ။';return;}
  if(!window.FutureCodeFrameZip?.Archive){el('boStatus').textContent='ZIP module မရသေးပါ။ Refresh လုပ်ပြီး ပြန်စမ်းပါ။';return;}
  busy=true;section.querySelectorAll('button,select,input').forEach(x=>x.disabled=true);
  try{
   urls.forEach(URL.revokeObjectURL);urls.length=0;el('boOutput').replaceChildren();
   const mode=el('boSplit').value,cut=Math.ceil(list.length/2);
   const groups=list.length>1&&(mode==='two'||mode==='auto'&&list.length>12)?[list.slice(0,cut),list.slice(cut)]:[list];
   const archive=new window.FutureCodeFrameZip.Archive(),total=frames.length*groups.length;let count=0;
   for(const f of frames){
    for(let i=0;i<groups.length;i++){
     el('boStatus').textContent='Frame '+f[1]+' · ပုံ '+(i+1)+'/'+groups.length+' · '+(count+1)+'/'+total+' PNG ဖန်တီးနေသည်…';
     const blob=await draw(groups[i],i+1,groups.length,f);
     if(!blob?.size)throw Error('PNG ဖန်တီးမရပါ');
     await archive.add('all-odds-frames-'+date+'/'+f[0]+'-odds-'+date+'-'+String(i+1).padStart(2,'0')+'.png',blob);
     count++;await new Promise(resolve=>setTimeout(resolve,0));
    }
   }
   const url=URL.createObjectURL(archive.finish());urls.push(url);
   const link=document.createElement('a');link.href=url;link.download='main-all-odds-frames-'+date+'.zip';
   link.textContent='⬇ Frame အားလုံး ZIP Download · '+count+' PNG';
   el('boOutput').append(link);link.click();
   el('boStatus').textContent='Frame '+frames.length+' မျိုး · PNG '+count+' ပုံပါသော ZIP အဆင်သင့်ဖြစ်ပါပြီ။ Download မစခဲ့လျှင် အောက်က ZIP လင့်ခ်ကို နှိပ်ပါ။';
  }catch(e){console.error('Main homepage odds ZIP failed',e);el('boStatus').textContent='ZIP Download မရပါ — '+(e?.message||String(e));}
  finally{busy=false;section.querySelectorAll('button,select,input').forEach(x=>x.disabled=false);}
 }
 el('boPreview').onclick=()=>run(false);el('boDownload').onclick=()=>run(true);el('boAllZip').onclick=runAllZip;
 try{const today=await fetch('./data/today.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('ပွဲစာရင်း ရယူမရပါ');return r.json();});date=today.reportDate;const data=await fetch('./data/odds/'+date+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('ပေါက်ကြေး ရယူမရပါ');return r.json();});rows=data.matches||[];for(const league of new Set(rows.map(m=>m.league))){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=league;input.checked=true;label.append(input,document.createTextNode(leagueNames[league]||league));el('boLeagues').append(label);}el('boStatus').textContent=rows.length+' ပွဲ အသင့်ရှိပါသည်။';}catch(e){el('boStatus').textContent=e.message;}
})();
