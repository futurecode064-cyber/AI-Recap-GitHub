/* Owner-only editor. All content is rendered with textContent; no HTML injection. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yangon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const leagues=['Premier League','Championship','League One','La Liga','La Liga 2','Serie A','Serie B','Bundesliga','2. Bundesliga','Ligue 1','Ligue 2','FA Cup','EFL Cup','Coppa Italia','Copa del Rey','DFB-Pokal','Coupe de France','UEFA Champions League','UEFA Europa League','UEFA Conference League','UEFA Nations League','FIFA World Cup','FIFA World Cup Qualifying','UEFA Euro','UEFA Euro Qualifying'];
 let state=null, editing=[], results=[], dirty=false, busy=false, publication=null, poll=null;
 const draftKey=day=>'fc-owner-draft-v1:'+day;
 function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 function message(text,error=false){$('message').textContent=text;$('message').style.background=error?'#fff0ed':'#e7f3f0';}
 function changed(){dirty=true;saveDraft();}
 function saveDraft(){try{localStorage.setItem(draftKey($('day').value),JSON.stringify({version:1,date:$('day').value,expectedHead:state?.head,report:state?.report,odds:state?.odds,editing,results,resultReport:state?.results,source:$('source').value,savedAt:new Date().toISOString()}));}catch{message('Draft အလိုအလျောက်မသိမ်းနိုင်ပါ။ Draft ဖိုင်သိမ်းရန်ကို နှိပ်ပါ။',true);}}
 function field(host,label,value,set,options={}){
  const lab=el('label',label,options.wide?'wide':'');let input;
  if(options.values){input=el('select');for(const item of options.values){const option=el('option',typeof item==='string'?item:item.label);option.value=typeof item==='string'?item:item.value;input.append(option);}}
  else input=el(options.area?'textarea':'input');
  if(!options.values&&!options.area)input.type=options.type||'text';
  if(options.min!==undefined)input.min=options.min;
  input.value=value??'';input.maxLength=options.area?20000:1200;
  input.addEventListener('input',()=>{set(input.value);changed();});lab.append(input);host.append(lab);return input;
 }
 function fromMatch(m,odds={}){
  const f=clone(m);f._odds=clone(odds);f._pick='';f._specialPick='';f._formHome=(m.homeLastFive||[]).map(x=>x.result||((x.teamGoals>x.opponentGoals)?'W':x.teamGoals===x.opponentGoals?'D':'L')).join('');f._formAway=(m.awayLastFive||[]).map(x=>x.result||((x.teamGoals>x.opponentGoals)?'W':x.teamGoals===x.opponentGoals?'D':'L')).join('');
  f._specialText=(m.specialAnalysisParagraphs||[]).join('\n\n');return f;
 }
 function key(m){return [m.league,m.home,m.away].join('|');}
 function drawMatches(){
  $('cards').replaceChildren();$('empty').hidden=editing.length>0;
  editing.forEach((m,i)=>{
   const card=el('article',undefined,'card'),head=el('div',undefined,'section-head');head.append(el('h3',`${i+1} · ${m.homeDisplay||m.home||'အိမ်ရှင်'} — ${m.awayDisplay||m.away||'ဧည့်သည်'}`));
   const remove=el('button','ပွဲဖယ်ရန်','danger');remove.type='button';remove.onclick=()=>{if(confirm('ဤပွဲကို Draft မှ ဖယ်မည်လား။')){editing.splice(i,1);changed();drawMatches();}};head.append(remove);card.append(head);
   const grid=el('div',undefined,'grid');card.append(grid);
   const f=(label,k,opts={})=>field(grid,label,m[k],v=>m[k]=v,opts);
   f('ပြိုင်ပွဲ','league',{values:[...new Set([...leagues,m.league].filter(Boolean))]});f('အချိန်ပြစာသား (မြန်မာ)','kickoffYangon');
   f('အိမ်ရှင် English','home');f('ဧည့်သည် English','away');f('အိမ်ရှင် မြန်မာ','homeDisplay');f('ဧည့်သည် မြန်မာ','awayDisplay');
   f('အမှန်တကယ် ကန်မည့်ရက်','kickoffCalendarDate',{type:'date'});f('ညစာရင်း သတ်မှတ်ရက်','nightEditorialDate',{type:'date'});
   f('အိမ်ရှင် Logo URL','homeCrestUrl',{type:'url'});f('ဧည့်သည် Logo URL','awayCrestUrl',{type:'url'});
   f('ပွဲကြိုသုံးသပ်ချက် (အနည်းဆုံး စာလုံး ၃၀၀)','dailyPreviewText',{area:true,wide:true});
   field(grid,'ရွေးချယ်အသင်း — နောက်ဆုံး bold ရွေးချယ်စာသား အလိုလိုပေါင်းရန်',m._pick,v=>m._pick=v,{values:[{value:'',label:'လက်ရှိစာမူအဆုံးသတ်ကို ထိန်းထားမည်'},{value:'home',label:'အိမ်ရှင်'},{value:'away',label:'ဧည့်သည်'}],wide:true});
   f('ပွဲ/စာမူ အချက်အလက်ရင်းမြစ် URL','fixtureSourceUrl',{type:'url',wide:true});
   const prices=el('details'),ps=el('summary','မူလ / ယခုကြေး နှင့် 1X2');prices.append(ps);const pg=el('div',undefined,'grid');prices.append(pg);card.append(prices);
   for(const [label,k] of [['ကြေးပေးအသင်း (မြန်မာ)','upperTeam'],['မူလ ဘော်ဒီကြေး','bodyOdds'],['မူလ ဂိုးပေါင်းကြေး','goalTotalOdds'],['ယခု ဘော်ဒီကြေး (မရသေးလျှင် ကွက်လပ်)','currentBodyOdds'],['ယခု ဂိုးပေါင်းကြေး','currentGoalTotalOdds'],['အင်တာနက်ခန့်မှန်းဂိုး (FT မဟုတ်)','pdfLastColumn'],['ကန်မည့်အချိန် HH:MM','kickoff']])field(pg,label,m._odds[k]??m.myanmarOdds?.[k],v=>m._odds[k]=v);
   for(const [label,k] of [['အိမ်ရှင် 1X2','homeOdds'],['သရေ 1X2','drawOdds'],['ဧည့်သည် 1X2','awayOdds'],['1X2 ပေးသည့် Bookmaker','oddsProvider'],['1X2 ရင်းမြစ် URL','oddsSourceUrl']])field(pg,label,m[k],v=>m[k]=v);
   const form=el('details');form.append(el('summary','နောက်ဆုံး ၅ ပွဲ၊ ရပ်တည်မှုနှင့် အထောက်အထား'));const fg=el('div',undefined,'grid');form.append(fg);card.append(form);
   for(const side of ['home','away']){
    field(fg,(side==='home'?'အိမ်ရှင်':'ဧည့်သည်')+' Last 5 (အသစ်ဆုံးမှ အဟောင်းဆုံး၊ ဥပမာ WDLWW)',side==='home'?m._formHome:m._formAway,v=>m[side==='home'?'_formHome':'_formAway']=v.toUpperCase());
    const rec=el('div',undefined,'record');fg.append(rec);m[side+'Standing']??={};
    for(const [label,k] of [['ကစားပြီး','played'],['နိုင်','wins'],['သရေ','draws'],['ရှုံး','losses'],['ရမှတ်','points'],['အဆင့်','position'],['သွင်းဂိုး','goalsFor'],['ပေးဂိုး','goalsAgainst']])field(rec,label,m[side+'Standing'][k],v=>m[side+'Standing'][k]=v===''?null:Number(v),{type:'number',min:0});
   }
   field(fg,'Standings ရင်းမြစ် URL',m.standingsSourceUrl,v=>m.standingsSourceUrl=v,{wide:true,type:'url'});
   field(fg,'Last 5 ရင်းမြစ် URL',m.formSourceUrl||m.homeLastFive?.[0]?.sourceUrl||m.researchSources?.[0],v=>m.formSourceUrl=v,{wide:true,type:'url'});
   const special=el('details');special.append(el('summary','Special Choice သတ်မှတ်ရန်'));const sg=el('div',undefined,'grid');special.append(sg);card.append(special);
   field(sg,'Special Choice',m.specialChoice?'yes':'no',v=>m.specialChoice=v==='yes',{values:[{value:'no',label:'ပုံမှန်ပွဲ'},{value:'yes',label:'Special Choice'}]});
   field(sg,'ဦးစားပေးနံပါတ်',m.specialChoiceRank||1,v=>m.specialChoiceRank=Number(v),{type:'number',min:1});
   field(sg,'အထူးသုံးသပ်ချက် (အပိုဒ်ကြား ကွက်လပ်တစ်ကြောင်း)',m._specialText,v=>m._specialText=v,{area:true,wide:true});
   field(sg,'Special ရွေးချယ်အသင်း — နောက်ဆုံးစာသား အလိုလိုပေါင်းရန်',m._specialPick,v=>m._specialPick=v,{values:[{value:'',label:'လက်ရှိအဆုံးသတ် ထိန်းထားမည်'},{value:'home',label:'အိမ်ရှင်'},{value:'away',label:'ဧည့်သည်'}],wide:true});
   $('cards').append(card);
  });
 }
 function drawResults(){
  $('resultCards').replaceChildren();if(!results.length)$('resultCards').append(el('p','မနေ့က archive ပွဲစာရင်း မရှိသေးပါ။'));
  results.forEach((m,i)=>{const card=el('div',undefined,'card');card.append(el('h3',`${m.homeDisplay||m.home} — ${m.awayDisplay||m.away}`));const grid=el('div',undefined,'grid');card.append(grid);
   field(grid,'ပွဲအခြေအနေ',m.status,v=>{m.status=v;m._edited=true;},{values:[{value:'scheduled',label:'မပြီးသေး / မသေချာ'},{value:'finished',label:'FT အတည်ပြုပြီး'},{value:'postponed',label:'ရွှေ့ဆိုင်း'},{value:'cancelled',label:'ဖျက်သိမ်း'},{value:'live',label:'ကစားနေဆဲ'}]});
   field(grid,'အိမ်ရှင်–ဧည့်သည် ဂိုး (ဥပမာ 2-1)',m.finalScore,v=>{m.finalScore=v;m._edited=true;});field(grid,'FT အတည်ပြုရင်းမြစ် URL',m.resultSourceUrl,v=>{m.resultSourceUrl=v;m._edited=true;},{wide:true,type:'url'});$('resultCards').append(card);
  });
 }
 function pickText(m,side){return '**'+(m[side+'Display']||m[side])+' ကို ရွေးချယ်ပါတယ်။**';}
 function bundle(){
  const day=$('day').value, report=clone(state?.report||{}), odds=clone(state?.odds||{});
  Object.assign(report,{reportDate:day,published:true,matchDateTimezone:'Asia/Yangon',sourcePDF:$('source').value,sourceVerificationDate:day,oddsSheetPath:'data/odds/'+day+'.json',noFixturesLeagues:report.noFixturesLeagues||[]});
  const rows=[];
  report.matches=editing.map((raw,i)=>{
   const m=clone(raw),o={...m._odds};for(const k of Object.keys(m))if(k.startsWith('_'))delete m[k];
   m.dailyPreviewText=(m.dailyPreviewText||'').trim();if(raw._pick)m.dailyPreviewText+=' '+pickText(m,raw._pick);
   m.fixtureSourceUrl=m.fixtureSourceUrl||m.previewV2?.fixtureSourceUrl||m.researchSources?.[0]||'';
   m.previewJournalist={...(m.previewJournalist||{}),status:'owner_approved_published',reportDate:day,reviewedAt:day};
   // These metadata describe owner entry, never automatic factual verification.
   m.ownerEditor={version:1,enteredAt:new Date().toISOString()};
   for(const k of ['userPreviewVerbatim','previewV2','editorialFactBasis','oddsVerificationStatus'])delete m[k];
   for(const side of ['home','away']){
    const text=raw[side==='home'?'_formHome':'_formAway'].replace(/\s/g,''),previous=m[side+'LastFive']||[];
    if(text!==previous.map(x=>x.result||((x.teamGoals>x.opponentGoals)?'W':x.teamGoals===x.opponentGoals?'D':'L')).join(''))m[side+'LastFive']=[...text].map(result=>({result,sourceUrl:m.formSourceUrl||'',sourceType:'owner_entered_league_results'}));
   }
   for(const k of ['homeOdds','drawOdds','awayOdds'])if(m[k]==='')m[k]=null;
   if(m.specialChoice){m.specialAnalysisParagraphs=raw._specialText.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);if(raw._specialPick)m.specialAnalysisParagraphs.push(pickText(m,raw._specialPick));}
   else for(const k of ['specialAnalysisParagraphs','specialChoiceRank','specialChoiceSourceHeading','specialChoiceSourceSubtitle','specialRiskNote','specialPickLabel'])delete m[k];
   Object.assign(o,{number:i+1,league:m.league,home:m.homeDisplay||m.home,away:m.awayDisplay||m.away,canonicalHome:m.home,canonicalAway:m.away,homeCrestUrl:m.homeCrestUrl,awayCrestUrl:m.awayCrestUrl,kickoffDate:m.kickoffCalendarDate,nightEditorialDate:m.nightEditorialDate,kickoffDisplay:m.kickoffYangon});
   for(const k of ['bodyOdds','goalTotalOdds','upperTeam'])o[k]=o[k]??m.myanmarOdds?.[k]??'';
   o.currentBodyOdds??='';o.currentGoalTotalOdds??='';o.pdfLastColumn??='';rows.push(o);
   m.myanmarOdds={...(m.myanmarOdds||{}),upperTeam:o.upperTeam,bodyOdds:o.bodyOdds,goalTotalOdds:o.goalTotalOdds,checkedAt:day,provider:$('source').value};
   return m;
  });
  delete odds.pdfOddsVerification;
  Object.assign(odds,{reportDate:day,sourceFile:$('source').value,priceStatus:'Owner-entered morning/latest quotes',matches:rows});
  let resultReport=null;
  if(results.some(m=>m._edited)&&state?.results){resultReport=clone(state.results);resultReport.matches=results.map(raw=>{const m=clone(raw);delete m._edited;if(raw._edited){if(m.status==='finished')m.resultVerifiedDate=today();else delete m.finalScore;}return m;});delete resultReport.resultReview;}
  return {expectedHead:state?.head,report,odds,results:resultReport,confirmed:$('confirmed').checked};
 }
 async function api(path,data){const response=await fetch('/api/editor/'+path,{method:data?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json','X-Football-Editor':'1'}:{},body:data?JSON.stringify(data):undefined});if(response.status===401){location.href='/login?next=/editor/';throw Error('Owner login လိုအပ်သည်');}const result=await response.json();if(!response.ok){if(result.errors)showErrors(result.errors);throw Error(result.error||'ဝန်ဆောင်မှု မရနိုင်ပါ');}return result;}
 function showErrors(errors){$('errors').replaceChildren(...errors.map(x=>el('li',x)));}
 function review(){const b=bundle();$('summary').textContent=`${b.report.reportDate} · ပွဲ ${b.report.matches.length} · Special Choice ${b.report.matches.filter(x=>x.specialChoice).length} · ရလဒ်ပြင်ထားသောပွဲ ${results.filter(x=>x._edited).length}`;$('previews').replaceChildren();for(const m of b.report.matches){const p=el('div',undefined,'preview');p.append(el('h3',(m.homeDisplay||m.home)+' — '+(m.awayDisplay||m.away)),el('p',m.dailyPreviewText));$('previews').append(p);}}
 async function load(){if(dirty&&!confirm('လက်ရှိ Draft ကို သိမ်းထားပြီး Server data အသစ်ပြန်ဖွင့်မည်လား။'))return;setBusy(true);try{const data=await api('state?date='+encodeURIComponent($('day').value));state=data;editing=(data.report?.matches||[]).map(m=>fromMatch(m,(data.odds?.matches||[]).find(o=>o.canonicalHome===m.home&&o.canonicalAway===m.away||o.home===(m.homeDisplay||m.home)&&o.away===(m.awayDisplay||m.away))||{}));results=clone(data.results?.matches||[]);$('source').value=data.odds?.sourceFile||data.report?.sourcePDF||'';dirty=false;$('confirmed').checked=false;drawMatches();drawResults();showErrors([]);$('setup').hidden=data.configured;if(!data.configured)$('setup').textContent='Form နှင့် Draft ကို သုံးနိုင်ပါသည်။ Website သို့ Publish ချိတ်ဆက်ရန် Cloudflare Settings → Variables and Secrets တွင် FCD_EDITOR_GITHUB_TOKEN ကို တစ်ကြိမ်သာ ချိတ်ရန်လိုသည်။ အသေးစိတ်: /editor/setup.html';message('Data ဖွင့်ပြီးပါပြီ။ စတင်ပြင်နိုင်ပါသည်။');}catch(e){message(e.message,true);}finally{setBusy(false);}}
 function setBusy(value){busy=value;for(const id of ['load','publish','validate','retry','add','restore','backup','status'])$(id).disabled=value;}
 async function status(){if(!publication)return;try{const data=await api('status?commit='+publication);$('deliveryStatus').textContent=data.message;$('workflowLink').href=data.workflowUrl;$('workflowLink').textContent='GitHub workflow အသေးစိတ် ↗';if(data.phase==='failed'||data.phase==='live'||data.phase==='superseded'){clearInterval(poll);poll=null;}}catch(e){$('deliveryStatus').textContent=e.message;}}
 document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b===button));for(const id of ['matches','results','review'])$(id).hidden=id!==button.dataset.tab;if(button.dataset.tab==='review')review();});
 $('day').value=today();$('load').onclick=load;$('source').oninput=changed;
 $('add').onclick=()=>{editing.push(fromMatch({league:'Premier League',home:'',away:'',homeDisplay:'',awayDisplay:'',kickoffCalendarDate:$('day').value,nightEditorialDate:$('day').value,status:'scheduled',homeLastFive:[],awayLastFive:[],dailyPreviewText:'',specialChoice:false}));changed();drawMatches();$('cards').lastElementChild?.scrollIntoView({behavior:'smooth'});};
 function restoreDraft(d){if(d.version!==1||!Array.isArray(d.editing)||d.editing.length>120||!Array.isArray(d.results))throw Error('Draft format မမှန်ပါ');if(d.date!==$('day').value)throw Error('အရင်ဆုံး Draft ရက်စွဲကို ရွေးပြီး ဖွင့်ပါ');if(!state)throw Error('Server data ကို အရင်ဖွင့်ပါ');if(d.expectedHead!==state.head)message('Draft သိမ်းပြီးနောက် GitHub ပြောင်းထားပါသည်။ အချက်အလက်နှိုင်းယှဉ်ပြီး ပြန်စစ်ရန်လိုသည်။',true);state.report=d.report;state.odds=d.odds;state.results=d.resultReport;state.head=d.expectedHead;editing=d.editing;results=d.results;$('source').value=d.source||'';dirty=true;$('confirmed').checked=false;drawMatches();drawResults();}
 $('restore').onclick=()=>{try{const raw=localStorage.getItem(draftKey($('day').value));if(!raw)throw Error('ဤရက်စွဲအတွက် Draft မရှိသေးပါ');restoreDraft(JSON.parse(raw));}catch(e){message(e.message,true);}};
 $('backup').onclick=()=>{saveDraft();const raw=localStorage.getItem(draftKey($('day').value));if(!raw)return;const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=el('a');a.href=url;a.download='football-draft-'+$('day').value+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>2000000)throw Error('Draft ဖိုင်ကြီးလွန်းသည်');restoreDraft(JSON.parse(await file.text()));message('Draft ဖိုင်ပြန်ဖွင့်ပြီးပါပြီ။');}catch(e){message(e.message,true);}event.target.value='';};
 $('validate').onclick=async()=>{setBusy(true);try{const data=await api('validate',bundle());showErrors([]);message(data.message);}catch(e){message(e.message,true);}finally{setBusy(false);}};
 $('publish').onclick=async()=>{if(!$('confirmed').checked){message('ပြန်စစ်ပြီး အတည်ပြုသည့်အကွက်ကို အမှန်ခြစ်ပါ။',true);return;}setBusy(true);try{saveDraft();const data=await api('publish',bundle());publication=data.commit;dirty=false;state.head=data.commit;$('delivery').hidden=false;message(data.message);$('deliveryStatus').textContent=data.message;clearInterval(poll);status();poll=setInterval(status,20000);}catch(e){message(e.message,true);}finally{setBusy(false);}};
 $('status').onclick=status;$('retry').onclick=async()=>{if(!publication)return;setBusy(true);try{const data=await api('deliver',{commit:publication});message(data.message);status();}catch(e){message(e.message,true);}finally{setBusy(false);}};
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});load();
})();
