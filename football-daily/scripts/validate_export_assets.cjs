'use strict';
// Daily release gate: use the candidate's actual dates and identities, not a fixed day.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function validate(root,date){
 root=path.resolve(root);const errors=[],read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 const report=read('data/today.json'),odds=read('data/odds/'+date+'.json');
 const loaded=[];
 for(const [file,api,brand]of [['main-export-logos.js','FutureCodeMainLogoAssets',false],['brand-export-data.js','FutureCodeBrandExportData',true]]){
  const window={},document={baseURI:'https://future-code-football-daily.pages.dev/'+(brand?'future-code-journal/odds.html':'odds.html'),documentElement:{dataset:{}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window,document,URL});loaded.push([file,window[api]]);
 }
 const assets=new Set();
 function png(url,label){
  try{const u=new URL(url,'https://future-code-football-daily.pages.dev/');if(u.origin!=='https://future-code-football-daily.pages.dev')throw Error('must be a bundled same-origin crest');const p=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!p.startsWith(root+path.sep))throw Error('path outside candidate');const b=fs.readFileSync(p);if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.length<24||!b.readUInt32BE(16)||!b.readUInt32BE(20))throw Error('not a valid PNG');assets.add(p)}catch(e){errors.push(label+': '+e.message)}
 }
 for(const [name,data]of [['report',report],['odds',odds]]){
  if(data.reportDate!==date)errors.push(name+': edition date mismatch');
  for(const m of data.matches||[]){
   for(const side of ['home','away'])png(m[side+'CrestUrl'],m.fixtureId+' '+side+' crest');
   png(m.leagueLogoUrl,m.fixtureId+' source league crest');
   for(const [file,api]of loaded)for(const label of [m.league,m.leagueDisplay]){const url=api.leagueCrest(label);if(!url)errors.push(file+': missing league alias '+label);else png(url,file+' '+label)}
  }
 }
 // A date hold must resolve to an existing matching report; changing the HTML date alone is insufficient.
 for(const brand of ['future-code-journal','goal-zone-english','ykz-family','bw-sport','ko-thet-family','kmm-sport-hub','bet-city-family'])for(const file of ['index.html','odds.html']){
  const p=path.join(root,brand,file);if(!fs.existsSync(p))continue;
  const hold=fs.readFileSync(p,'utf8').match(/data-football-hold-date="([^"]+)"/);
  if(hold&&hold[1]===date){try{const snapshot=read('data/brand-hold/'+date+'-today.json');if(snapshot.reportDate!==date||JSON.stringify(snapshot.matches.map(m=>m.fixtureId))!==JSON.stringify(report.matches.map(m=>m.fixtureId)))throw Error('report identity differs')}catch(e){errors.push(brand+'/'+file+': date hold has no matching daily snapshot: '+e.message)}}
 }
 return {ok:errors.length===0,date,fixtures:odds.matches?.length||0,leagues:new Set((odds.matches||[]).map(m=>m.league)).size,localCrests:assets.size,errors};
}
if(require.main===module){try{const result=validate(process.argv[2],process.argv[3]);console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={validate};
