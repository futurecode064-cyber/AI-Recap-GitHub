"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const {readFile}=require("node:fs/promises");
const origin="https://future-code-football-daily.pages.dev/";
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const width=buf=>buf.readUInt32BE(16);
const height=buf=>buf.readUInt32BE(20);
async function run(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const browserErrors=[];
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage();page.on("pageerror",err=>browserErrors.push(err.message));
 try{
  await page.goto(origin,{waitUntil:"domcontentloaded",timeout:50000});
  await page.locator(".fc-main-preview-v2-tab").waitFor({timeout:25000});
  await page.locator(".fc-main-preview-v2-tab").click();
  const cards=page.locator("#fcV2Cards .fc-v2-card");
  await page.waitForFunction(()=>document.querySelectorAll("#fcV2Cards .fc-v2-card").length===16,null,{timeout:45000});
  assert.equal(await cards.count(),16);
  assert.equal(await page.locator("body").getAttribute("data-fc-main-view"),"previewV2");
  assert(await page.locator("#fcV2Cards .fc-v2-ribbon").count()===16);
  const content=await cards.first().innerText();
  assert(content.includes("ရွေးချယ်မှု")&&content.includes("မူလ")&&content.includes("လီဗာပူးလ်"),content.slice(0,300));
  assert.equal(await page.locator("#fcV2Cards .fc-v2-logo").count(),64);
  const checkedPhoto=await page.evaluate(()=>({withPhoto:document.querySelectorAll(".fc-v2-photo").length,blankChoices:[...document.querySelectorAll(".fc-v2-pick strong")].filter(x=>x.textContent.includes("အတည်မပြုရသေး")).length}));
  assert.equal(checkedPhoto.withPhoto,6);
  assert.equal(checkedPhoto.blankChoices,0);
  const twoEvent=page.waitForEvent("download",{timeout:90000});
  await page.locator("#fcV2Two").click();const two=await twoEvent;
  const twoBytes=await readFile(await two.path());
  assert(two.suggestedFilename().endsWith(".png"));
  assert(width(twoBytes)>=1200&&height(twoBytes)>1600&&height(twoBytes)<2500);
  const threeEvent=page.waitForEvent("download",{timeout:90000});
  await page.locator("#fcV2Three").click();const three=await threeEvent;
  const threeBytes=await readFile(await three.path());
  assert(width(threeBytes)>=1200&&height(threeBytes)>2500);
  const editor=await context.newPage();editor.on("pageerror",err=>browserErrors.push(err.message));
  await editor.goto(origin+"frame-editor.html",{waitUntil:"domcontentloaded",timeout:45000});
  await editor.waitForFunction(()=>window.FCStudio?.getState()?.frames?.length>30,null,{timeout:70000});
  const editorState=await editor.evaluate(()=>({
   scopes:window.FCStudio.TYPES,
   frame:(window.FCStudio.getState().placements.previewsV2||[]).length,
   matches:window.FCStudio.getRows("previewsV2").length,
   canRender:typeof document.querySelector("#engineHome").contentWindow.FutureCodePreviewV2?.render==="function"
  }));
  assert(editorState.scopes.includes("previewsV2"),JSON.stringify(editorState));
  assert(editorState.frame>=1&&editorState.matches===16&&editorState.canRender,JSON.stringify(editorState));
  assert.equal(await editor.locator('#librarySection option[value="previewsV2"]').count(),1);
  assert.equal(await editor.locator('#downSection option[value="previewsV2"]').count(),1);
  await editor.locator("#navDownloads").click();
  for(const section of ["odds","oddsCards","previews","specials","results","ai","news"]){
   const box=editor.locator('details[data-section="'+section+'"] input[data-enable-section="'+section+'"]');
   if(await box.isChecked())await box.uncheck();
  }
  const detail=editor.locator('details[data-section="previewsV2"]');
  const enable=detail.locator('input[data-enable-section="previewsV2"]');
  if(!(await enable.isChecked()))await enable.check();
  await detail.evaluate(e=>e.open=true);
  await detail.locator('select[data-layout="previewsV2"]').selectOption("triple");
  const png=editor.locator("#downPreviewImage");
  await editor.locator("#downPreview").click();
  await png.waitFor({state:"visible",timeout:90000});
  const dimensions=await png.evaluate(im=>({w:im.naturalWidth,h:im.naturalHeight}));
  assert(dimensions.w>=1200&&dimensions.h>=2500,JSON.stringify(dimensions));
  const zipEvent=editor.waitForEvent("download",{timeout:90000});
  await editor.locator("#downZip").click();const zip=await zipEvent;
  const zipped=await readFile(await zip.path());
  assert(zip.suggestedFilename().endsWith(".zip"));
  assert(zipped.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04])));
  assert(zipped.includes(Buffer.from("Version 2")),"ZIP missing Version 2 folder");
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  console.log("PREVIEW V2 LIVE BROWSER PNG/ZIP PASS "+JSON.stringify({cards:await cards.count(),historicPhotos:checkedPhoto.withPhoto,selectedAll:16,twoPng:[width(twoBytes),height(twoBytes)],threePng:[width(threeBytes),height(threeBytes)],editorTriple:dimensions,zipBytes:zipped.length,head:"776eb95c"}));
 }finally{await context.close();await browser.close();}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
