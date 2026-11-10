"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const SITE="https://future-code-football-daily.pages.dev/";
async function run(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const context=await browser.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
 const page=await context.newPage();
 try{
  await page.goto(SITE,{waitUntil:"domcontentloaded",timeout:60000});
  const archive=await page.evaluate(async()=>{
   const r=await fetch("./data/archive/2026-11-09.json",{cache:"no-store"});
   if(!r.ok)throw Error("Archive not available: "+r.status);
   return r.json();
  });
  const games=archive.matches.filter(x=>x.status==="finished"&&/^\d+[-:]\d+$/.test(x.finalScore||""));
  assert.equal(games.length,8,"Eight source-backed Nov 9 finished games required");
  await page.locator(".fc-main-results-v2-tab").click();
  await page.waitForFunction(count=>document.querySelectorAll("#fcR2List .fc-r2-card").length===count,games.length,{timeout:50000});
  assert.equal(await page.locator("body").getAttribute("data-fc-main-view"),"resultsV2");
  const first=page.locator("#fcR2List .fc-r2-card").first();
  assert.equal(await page.locator("#fcR2List .fc-r2-card").count(),games.length);
  assert.equal(await first.locator(".fc-r2-original .match-hero").count(),1,"V1 original match hero missing");
  assert.equal(await first.locator(".fc-r2-original .myanmar-market").count(),1,"V1 original Myanmar prices missing");
  assert.equal(await first.locator(".fc-r2-original .market-center .odds-grid").count(),1,"V1 1X2 triplet missing");
  assert.equal(await first.locator(".fc-r2-original .wdl-strip").count(),2,"V1 home/away last-five strips missing");
  assert.equal(await first.locator(".fc-r2-original .analysis-body .daily-preview-verbatim").count(),1,"Original full preview missing");
  assert.equal(await first.locator(".fc-r2-original .fc-editorial-selection").count(),1,"Original pick missing");
  const original=await first.locator(".fc-r2-original .daily-preview-verbatim").innerText();
  assert(original.includes(games[0].dailyPreviewText.slice(0,35)), "Preview was rewritten or abbreviated");
  const text=await first.innerText();
  assert(text.includes(games[0].homeOdds)&&text.includes(games[0].drawOdds)&&text.includes(games[0].awayOdds),"Archived original 1X2 missing");
  assert(text.includes(games[0].myanmarOdds.bodyOdds)&&text.includes(games[0].myanmarOdds.goalTotalOdds),"Archived Myanmar markets missing");
  assert(text.includes(games[0].previewV2Selection),"Original selected team missing");
  assert(text.includes(games[0].finalScore.replace("-", " - ")),"Verified result missing");
  assert(text.includes("မိနစ် ၉၀")&&text.includes(games[0].regulationScore),"Extra time result incorrectly reported");
  const border=await page.evaluate(()=>{
   const first=document.querySelector("#fcR2List .fc-r2-card");
   return {score:getComputedStyle(first.querySelector(".fc-r2-score")).borderTopColor,choice:getComputedStyle(first.querySelector(".fc-r2-original .fc-editorial-selection")).borderTopColor};
  });
  for(const key of ["score","choice"])assert(/rgb\(2[0-5]\d,\s*[0-8]\d,\s*[0-8]\d\)/.test(border[key]),key+" red ring missing: "+border[key]);
  const originalCanvas=await page.evaluate(async()=>{const m=(await (await fetch("./data/archive/2026-11-09.json")).json()).matches[0];const c=await window.FutureCodeFramePreview.render(m);return {width:c.width,height:c.height,selected:c.__fcEditorialChoiceAdded===true};});
  assert(originalCanvas.selected&&originalCanvas.width===1200&&originalCanvas.height>650,"Original Canvas preview incomplete");
  const pending=page.waitForEvent("download",{timeout:110000});
  await first.locator(".fc-r2-download").click();
  const result=await pending;
  const bytes=await fs.readFile(await result.path());
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  assert(result.suggestedFilename().startsWith("results-v2-2026-11-09-"));
  assert.equal(bytes.subarray(1,4).toString(),"PNG");
  assert(width===1200&&height>=originalCanvas.height+295,"PNG cropped or not full original V1 preview: "+JSON.stringify({width,height,originalCanvas}));
  assert(bytes.length>60000,"Unexpectedly empty downloaded poster");
  await first.screenshot({path:"results-v2-live-first-match.png",timeout:30000});
  console.log(JSON.stringify({ok:true,date:archive.reportDate,games:games.length,first:games[0].home+" vs "+games[0].away,score:games[0].finalScore,originalCanvas,resultPng:{width,height,bytes:bytes.length},redRings:border}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
