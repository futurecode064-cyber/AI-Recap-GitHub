/* Pure draft operations shared by the owner console and its tests. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.FootballDraftModel=api;})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const sections=[['overview','နေ့စဉ်အကျဉ်း'],['sources','PDF / Source Ledger'],['fixtures','ပွဲစဉ် / အမည် / အချိန်'],['opening','မနက် မူလကြေး'],['current','ယခုကြေး'],['previews','ပွဲကြိုစာမူ'],['forms','နောက်ဆုံး ၅ ပွဲ / 1X2'],['special','Special Choice'],['results','ယမန်နေ့ရလဒ် / Archive'],['ai','AI Predictions'],['news','ဘောလုံးသတင်း'],['preview','Website ငါးခု Preview'],['validation','Validation / Publish'],['history','History / Rollback'],['usage','အသုံးပြုမှု']];
 function normalize(value){
  if(!value||typeof value!=='object'||!value.resources||Array.isArray(value.resources))throw Error('resources object ပါသော Import/Export JSON လိုအပ်သည်');
  const version=typeof value.version==='object'?value.version:null;
  let sources=value.sourceManifest||version?.source_manifest||{files:[]};if(typeof sources==='string')sources=JSON.parse(sources);
  return {editorialDate:value.editorialDate||version?.editorial_date||value.resources['data/today.json']?.reportDate,sourceManifest:copy(sources),resources:copy(value.resources)};
 }
 function rows(draft,section){
  const d=draft.editorialDate,report='data/today.json',odds='data/odds/'+d+'.json';
  let paths=section==='news'?Object.keys(draft.resources).filter(p=>p.includes('/news/')):section==='results'?Object.keys(draft.resources).filter(p=>p.startsWith('data/archive/')):[['opening','current'].includes(section)?odds:report];
  return paths.flatMap(path=>{
   const resource=draft.resources[path];if(!resource)return [];
   const key=section==='news'?'items':'matches';
   return (resource[key]||[]).map((value,index)=>({path,key,index,value,id:value.fixtureId||value.id||path+':'+index}));
  });
 }
 function update(draft,row,value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON object လိုအပ်သည်');
  const original=draft.resources[row.path]?.[row.key]?.[row.index];if(!original)throw Error('Row မတွေ့ပါ');
  if(original.fixtureId&&value.fixtureId!==original.fixtureId)throw Error('Stable fixtureId မပြောင်းရ');
  draft.resources[row.path][row.key][row.index]=copy(value);
 }
 const editable={
  fixtures:['pdfRow','home','away','homeDisplay','awayDisplay','league','leagueDisplay','kickoffUtc','kickoffYangon','kickoffCalendarDate','nightEditorialDate','homeCrestUrl','awayCrestUrl','fixtureSourceUrl'],
  opening:['home','away','canonicalHome','canonicalAway','league','pdfRow','upperTeam','bodyOdds','goalTotalOdds','pdfLastColumn'],
  current:['currentBodyOdds','currentGoalTotalOdds'],previews:['dailyPreviewText','previewJournalist','researchSources'],
  forms:['homeLastFive','awayLastFive','homeStanding','awayStanding','standingsSourceUrl','homeOdds','drawOdds','awayOdds','oddsProvider','oddsSourceUrl','oddsVerifiedDate','formDefinition','formCheckedAt','homeFormVerification','awayFormVerification'],
  special:['specialChoice','specialChoiceRank','specialAnalysisParagraphs'],
  results:['status','finalScore','resultSourceUrl','resultVerifiedDate','kickoffCalendarDate'],
  ai:['homeOdds','drawOdds','awayOdds','oddsProvider','oddsSourceUrl','oddsVerificationStatus','oddsVerifiedDate']
 };
 function sectionValue(row,section){const fields=editable[section];return fields?Object.fromEntries(fields.filter(k=>row.value[k]!==undefined||section==='current').map(k=>[k,row.value[k]??''])):copy(row.value);}
 function updateSection(draft,row,section,value){
  const fields=editable[section];if(fields&&Object.keys(value).some(k=>!fields.includes(k)))throw Error('ဤ section တွင် ခွင့်ပြုထားသော field မဟုတ်ပါ');
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON object လိုအပ်သည်');
  update(draft,row,{...row.value,...value});
  if(['current','opening'].includes(section)){
   const id=row.value.fixtureId,m=draft.resources['data/today.json']?.matches?.find(x=>x.fixtureId===id);
   if(m){m.myanmarOdds={...m.myanmarOdds};for(const k of section==='current'?editable.current:['upperTeam','bodyOdds','goalTotalOdds'])if(Object.prototype.hasOwnProperty.call(value,k))m.myanmarOdds[k]=value[k];}
  }
 }
 function changes(before,after){return [...new Set([...Object.keys(before.resources),...Object.keys(after.resources)])].filter(p=>!equal(before.resources[p],after.resources[p])).map(path=>({path,before:before.resources[path],after:after.resources[path]}));}
 function summary(draft){
  const report=draft.resources['data/today.json'],odds=draft.resources['data/odds/'+draft.editorialDate+'.json'];
  const matches=report?.matches||[],prices=odds?.matches||[];
  return {date:draft.editorialDate,fixtures:matches.length,odds:prices.length,previews:matches.filter(m=>m.dailyPreviewText).length,forms:matches.filter(m=>m.homeLastFive?.length===5&&m.awayLastFive?.length===5).length,news:draft.resources['data/news/latest.json']?.items?.length||0,sourceFiles:draft.sourceManifest.files?.length||0,resources:Object.keys(draft.resources).length};
 }
 function batches(draft,generation,baseDraft){
  if(!Number.isInteger(generation)||generation<0)throw Error('Generation မမှန်ပါ');
  if(!draft.sourceManifest?.files?.length)throw Error('Source filename / SHA-256 မရှိသေးပါ');
  const result=[];let resources={};const bytes=o=>new TextEncoder().encode(JSON.stringify(o)).length;
  const body=r=>({editorialDate:draft.editorialDate,expectedGeneration:generation,sourceManifest:draft.sourceManifest,...(baseDraft?{baseDraft}:{}),resources:r});
  for(const [path,value] of Object.entries(draft.resources)){
   if(bytes(body({[path]:value}))>400000)throw Error(path+': Resource တစ်ခု၏ ဖိုင်အရွယ်အစား ကြီးလွန်းသည်');
   if(Object.keys(resources).length>=20||bytes(body({...resources,[path]:value}))>400000){result.push(body(resources));resources={};}
   resources[path]=value;
  }
  if(Object.keys(resources).length)result.push(body(resources));return result;
 }
 return {sections,copy,normalize,rows,update,sectionValue,updateSection,changes,summary,batches};
});
