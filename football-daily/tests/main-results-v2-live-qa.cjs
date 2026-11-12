"use strict";
// Manual browser QA: SITE and RESULT_DATE may target a preview deployment / archived day.
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs/promises");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000},acceptDownloads:true});
  await page.goto(process.env.SITE||"https://future-code-football-daily.pages.dev/",{waitUntil:"domcontentloaded"});
  await page.locator(".fc-main-results-v2-tab").click();
  await page.waitForSelector("#fcR2Date");
  if(process.env.RESULT_DATE){await page.locator("#fcR2Date").fill(process.env.RESULT_DATE);await page.locator("#fcR2Date").dispatchEvent("change");}
  const date=await page.locator("#fcR2Date").inputValue();
  const games=await page.evaluate(async date=>(await(await fetch("./data/archive/"+date+".json")).json()).matches.filter(m=>m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(m.finalScore||"")),date);
  assert(games.length>0,"A completed archive is required");
  await page.waitForFunction(n=>document.querySelectorAll("#fcR2List .fc-r2-card canvas").length===n,games.length,{timeout:90000});
  const first=page.locator("#fcR2List .fc-r2-card").first();
  const size=await first.locator("canvas").evaluate(c=>({width:c.width,height:c.height,label:c.getAttribute("aria-label")}));
  assert.equal(size.width,1080);assert.equal(size.height,1080);assert(size.label.includes(games[0].finalScore));
  assert(size.label.includes(games[0].previewV2Selection));
  const check=await page.evaluate(async m=>{
   const old=m.previewV2Summary,choice=m.previewV2Selection;
   const c=await FutureCodeResultsV2.renderCanvas(m,{includeUploadedBanners:false});
   return {same:old===m.previewV2Summary&&choice===m.previewV2Selection,width:c.width,height:c.height};
  },games[0]);
  assert(check.same);assert.equal(check.width,1080);assert.equal(check.height,1080);
  const pending=page.waitForEvent("download");await first.locator(".fc-r2-download").click();
  const file=await pending,bytes=await fs.readFile(await file.path());
  assert.equal(bytes.subarray(1,4).toString(),"PNG");assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1080);assert(bytes.length>60000);
  console.log(JSON.stringify({ok:true,date,matches:games.length,width:1080,height:1080}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
