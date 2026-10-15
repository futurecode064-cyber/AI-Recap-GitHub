"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const day=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const ledger=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-15.json"),"utf8"));
const mm=x=>String(x).replace(/[0-9]/g,d=>"၀၁၂၃၄၅၆၇၈၉"[+d]);
test("all 36 match previews have original detailed evidence-driven editorial paragraphs, not repeated generic templates",()=>{
  assert.equal(day.reportDate,"2026-10-15");
  assert.equal(day.matches.length,36);
  const openings=[];
  for(const [i,m] of day.matches.entries()){
    const p=m.dailyPreviewText;
    const head="row "+(i+1)+": "+m.home+" v "+m.away;
    assert.ok(p.length>=700,head+" needs genuinely detailed original reporting");
    assert.equal(p,p.trim(),head);
    assert.ok(!p.includes("\n"),head+" must be ONE paragraph");
    assert.ok(p.includes(m.homeDisplay)&&p.includes(m.awayDisplay),head+" must mention BOTH user-PDF Myanmar names");
    assert.equal([...p.matchAll(/\*\*[^*\n]+\*\*/g)].length,1,head+" must have exactly ONE bold reasoned selection");
    assert.match(p,/\*\*[^*]{30,}ကို ရွေးချယ်ပါတယ်။\*\*$/u,head+" verdict needs its own reason and must end article");
    assert.ok(!/ဖြစ်နိုင်တဲ့\s*ဂိုးရလဒ်|ခန့်မှန်း\s*ဂိုးရလဒ်|မရှုံးတဲ့ရွေးချယ်မှု/u.test(p),head);
    assert.ok(!/1X2|bookmaker|PDF|14\.pdf|ပြင်ပ(?:ဒေတာ|အရင်းအမြစ်)/i.test(p),head+" user-disallowed source boilerplate");
    assert.equal(m.homeLastFive?.length,5,head);assert.equal(m.awayLastFive?.length,5,head);
    const h=m.homeLastFive[0],a=m.awayLastFive[0];
    assert.ok(p.includes(mm(h.teamGoals)+"-"+mm(h.opponentGoals)+" ဂိုး"),head+" actual latest home-side score must be present");
    assert.ok(p.includes(mm(a.teamGoals)+"-"+mm(a.opponentGoals)+" ဂိုး"),head+" actual latest away-side score must be present");
    assert.ok(m.editorialFactBasis?.lastFiveSource?.startsWith("https://"),head+" recent results require a source");
    assert.ok(m.editorialFactBasis?.externalPreviewSource?.startsWith("https://"),head+" fixture research requires a source");
    assert.ok(m.homeCrestUrl&&m.awayCrestUrl,head+" crests must be retained");
    assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(z=>Number(z)>1),head+" 1X2 must be retained");
    const firstSentence=p.split("။")[0].trim();
    assert.ok(firstSentence.length>90,head+" opener must have concrete meaningful substance");
    openings.push(firstSentence);
  }
  assert.equal(new Set(openings).size,36,"Every match article needs an ORIGINAL opening, not a recycled template");
});
test("special editorials, market snapshots and archived finals are untouched",()=>{
  const specials=day.matches.filter(m=>m.specialChoice);
  assert.equal(specials.length,5);
  for(const m of specials){
    assert.equal(m.specialAnalysisParagraphs.length,4);
    assert.match(m.specialAnalysisParagraphs.at(-1),/\*\*[^*]+ကို ရွေးချယ်ပါတယ်။\*\*$/u);
  }
  assert.equal(ledger.matches.length,36);
  assert.ok(ledger.matches.every(m=>/^\d+-\d+$/.test(m.pdfLastColumn)));
  const archive=JSON.parse(fs.readFileSync(path.join(root,"data/archive/2026-10-14.json"),"utf8"));
  assert.equal(archive.matches.filter(m=>m.finalScoreIsVerified===true).length,13);
});
