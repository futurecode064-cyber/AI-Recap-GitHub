"use strict";
/* Preview V2 permanent publication contract. This checks metadata and consistency,
 * not the independent truth of external football facts. */
const fs=require("node:fs");
const path=require("node:path");
const CONFIG=require("../config/preview-v2-format.json");
const myanmar=s=>typeof s==="string"&&(/[\u1000-\u109f]/u.test(s)||s==="KuPS");
const clean=s=>String(s??"").replace(/\*\*/g,"").normalize("NFC").replace(/\s+/gu," ").trim();
function sourcePicks(match){
 const tail=clean(match.dailyPreviewText).slice(-330);
 const names=[match.homeDisplay,match.awayDisplay].filter(Boolean);
 return names.filter(name=>{
  const short=name.split(/\s+/u).at(-1);
  const variants=[name,short].filter(v=>v&&!/^\d+$/u.test(v));
  return variants.some(n=>tail.includes(n+"ကို ရွေး")||tail.includes(n+"အား ရွေး")||tail.includes(n+"ကို ရွေးချယ်"));
 });
}
function validateReport(report){
 const errors=[],warnings=[],matches=Array.isArray(report?.matches)?report.matches:[];
 const date=report?.reportDate;
 const error=(who,message)=>errors.push(who+": "+message);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||""))error("reportDate","ISO date missing");
 if(report?.published!==true)error("report","unpublished data cannot be marked complete");
 if(!Array.isArray(report?.matches)||!matches.length)error("matches","missing eligible fixtures");
 const seenIds=new Set(),seenSummaries=new Set();
 for(const [i,m] of matches.entries()){
  const id=m?.fixtureId||"row-"+(i+1),who=id;
  if(!m?.fixtureId||seenIds.has(m.fixtureId))error(who,"missing/duplicate fixtureId");
  seenIds.add(m?.fixtureId);
  for(const field of ["homeDisplay","awayDisplay","leagueDisplay"]){
   if(!myanmar(m?.[field]))error(who,field+" must use verified Myanmar text");
  }
  if(!m?.dailyPreviewText||clean(m.dailyPreviewText).length<200)error(who,"original full preview missing");
  const short=clean(m?.previewV2Summary),long=clean(m?.dailyPreviewText);
  if(short.length<CONFIG.content.summaryMinLength||short.length>CONFIG.content.summaryMaxLength)error(who,"V2 summary length outside readable card bounds");
  if((short.match(/။/gu)||[]).length<CONFIG.content.minSentences)error(who,"V2 summary lacks cohesive complete sentences");
  if(!short.includes(m.homeDisplay)||!short.includes(m.awayDisplay))error(who,"V2 summary must cover both Myanmar teams");
  if(!short.endsWith(m.previewV2Selection+"ကို ရွေးချယ်ပါတယ်။"))error(who,"V2 summary must end with the approved team choice");
  if((short.match(/။/gu)||[]).length>6)warnings.push(who+": V2 summary may be too long for a readable four-point card");
  if(short&&long.startsWith(short.slice(0,Math.min(110,short.length))))error(who,"mechanically copied opening of full preview");
  if(seenSummaries.has(short))error(who,"duplicate generic summary");
  if(short)seenSummaries.add(short);
  if(/(?:ပြိုင်ဘက်|ဒီပွဲကို ရွေးချယ်ပါတယ်|အတိုချုပ်စာကို အတည်ပြုနေဆဲ)/u.test(short))error(who,"banned generic or non-editorial wording");
  if(m?.previewV2FormatVersion!==CONFIG.version)error(who,"missing canonical V2 format version "+CONFIG.version);
  if(m?.previewV2EditorialDate!==date||m?.previewV2SourcePreviewDate!==date)error(who,"stale editorial/source date");
  if(!String(m?.previewV2EditorialStatus||"").includes("reviewed"))error(who,"reviewed editorial provenance missing");
  const chosen=m?.previewV2Selection;
  if(!chosen||![m.homeDisplay,m.awayDisplay].includes(chosen))error(who,"V2 choice must name one of the two PDF Myanmar teams");
  const source=sourcePicks(m);
  if(source.length!==1||source[0]!==chosen)error(who,"V2 choice mismatches original approved preview");
  for(const field of ["homeCrestUrl","awayCrestUrl"]){
   const value=m?.[field];
   if(typeof value!=="string"||!value.trim())error(who,field+" missing");
  }
  if(!m?.myanmarOdds||!String(m.myanmarOdds.bodyOdds??"").trim()||!String(m.myanmarOdds.goalTotalOdds??"").trim())
   error(who,"verified morning body/goal odds missing");
  const photo=m?.previewV2Media;
  if(photo){
   for(const field of ["url","caption","sourceUrl","credit","license"]){
    if(!photo[field])error(who,"historical photograph missing "+field);
   }
   if(photo.historical!==true)warnings.push(who+": photo historical metadata not explicitly true");
  }else warnings.push(who+": no verified fixture photograph; correct team crests fallback");
 }
 return {ok:errors.length===0,formatVersion:CONFIG.version,date,checked:matches.length,errors,warnings};
}
if(require.main===module){
 const file=process.argv[2]||path.resolve(__dirname,"..","data","today.json");
 try{
  const report=JSON.parse(fs.readFileSync(file,"utf8")),result=validateReport(report);
  console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
 }catch(e){console.error(e.stack||String(e));process.exitCode=2;}
}
module.exports={validateReport,sourcePicks,CONFIG};
