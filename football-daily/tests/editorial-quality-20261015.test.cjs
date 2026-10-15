"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const day=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const ledger=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-15.json"),"utf8"));
const original=fs.readFileSync(path.join(root,"data/editorial/2026-10-15-europa-user-verbatim.md"),"utf8");
const digits=Object.fromEntries(Array.from("၀၁၂၃၄၅၆၇၈၉", (d,i)=>[d,String(i)]));
test("all eighteen Europa League previews are EXACT unedited user-provided paragraphs",()=>{
 assert.equal(day.reportDate,"2026-10-15");
 assert.equal(day.matches.length,36);
 const parts=original.replace(/^\uFEFF/,"").split(/(?=^### [၀-၉]+။ )/m).filter(x=>x.trim());
 assert.equal(parts.length,18);
 const headlines=[];
 for(const [i,part] of parts.entries()){
  const lines=part.split(/\r?\n/);
  const heading=lines[0].match(/^### ([၀-၉]+)။ (.*?) နှင့် (.+)$/u);
  assert.ok(heading,"expected source heading #"+(i+1));
  assert.equal(Number([...heading[1]].map(d=>digits[d]).join("")),i+1);
  const m=day.matches[i],article=lines.slice(1).join("\n").trim();
  assert.equal(m.league,"UEFA Europa League");
  assert.equal(m.homeDisplay,heading[2]);assert.equal(m.awayDisplay,heading[3]);
  assert.equal(m.dailyPreviewText,article,"NO rewriting, corrections, omissions or extra warnings allowed for row "+(i+1));
  assert.equal((article.match(/\*\*/g)||[]).length,2);
  assert.match(article,/\*\*[^*]+ကို ရွေးချယ်ပါတယ်။\*\*$/u);
  assert.equal(article.includes("\n"),false);
  headlines.push(heading[2]+" / "+heading[3]);
 }
 assert.equal(new Set(headlines).size,18);
});
test("remaining eighteen Conference League narratives stay grounded and other data preserved",()=>{
 const conf=day.matches.slice(18);
 assert.equal(conf.length,18);
 const mm=x=>String(x).replace(/[0-9]/g,d=>"၀၁၂၃၄၅၆၇၈၉"[+d]);
 for(const m of conf){
  const p=m.dailyPreviewText,desc=m.home+" v "+m.away;
  assert.equal(m.league,"UEFA Conference League",desc);
  assert.ok(p.length>=700,desc);
  assert.ok(p.includes(m.homeDisplay)&&p.includes(m.awayDisplay),desc);
  assert.ok(!p.includes("\n"),desc);
  assert.equal([...p.matchAll(/\*\*[^*\n]+\*\*/g)].length,1,desc);
  assert.match(p,/\*\*[^*]+ကို ရွေးချယ်ပါတယ်။\*\*$/u,desc);
  const h=m.homeLastFive[0],a=m.awayLastFive[0];
  assert.ok(p.includes(mm(h.teamGoals)+"-"+mm(h.opponentGoals)+" ဂိုး"),desc);
  assert.ok(p.includes(mm(a.teamGoals)+"-"+mm(a.opponentGoals)+" ဂိုး"),desc);
 }
 for(const m of day.matches){
  assert.equal(m.homeLastFive?.length,5);assert.equal(m.awayLastFive?.length,5);
  assert.ok(m.homeCrestUrl&&m.awayCrestUrl);
  assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(z=>Number(z)>1));
 }
 const specials=day.matches.filter(m=>m.specialChoice);
 assert.equal(specials.length,5);
 for(const m of specials){assert.equal(m.specialAnalysisParagraphs.length,4);assert.match(m.specialAnalysisParagraphs.at(-1),/\*\*[^*]+ကို ရွေးချယ်ပါတယ်။\*\*$/u);}
 assert.equal(ledger.matches.length,36);
 assert.ok(ledger.matches.every(m=>/^\d+-\d+$/.test(m.pdfLastColumn)));
 const archive=JSON.parse(fs.readFileSync(path.join(root,"data/archive/2026-10-14.json"),"utf8"));
 assert.equal(archive.matches.filter(m=>m.finalScoreIsVerified===true).length,13);
});
