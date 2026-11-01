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
  assert.equal(await page.locator("#fcV2Cards .fc-v2-ribbon").count(),16);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-quote").count(),32);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-time").count(),16);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-odds-team").count(),32);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-market").count(),0);
  const content=await cards.first().innerText();
  assert(content.includes("ရွေးချယ်မှု")&&content.includes("ဂိုးပေါင်းကြေး")&&content.includes("ဘော်ဒီကြေး")&&content.includes("လီဗာပူးလ်"),content.slice(0,500));
  assert.equal(await page.locator("#fcV2Cards .fc-v2-logo").count(),64);
  const textLayout=await page.evaluate(()=>{
   const ps=[...document.querySelectorAll("#fcV2Cards .fc-v2-desc p")];
   const badStarts=ps.flatMap(p=>p.textContent.split("\n")).filter(line=>/^[\u102B-\u103E\u1056-\u1059\u1060-\u109D]/u.test(line));
   const ctx=document.createElement("canvas").getContext("2d");
   const overwide=ps.flatMap(p=>{const s=getComputedStyle(p);ctx.font=s.fontWeight+" "+s.fontSize+" "+s.fontFamily;return p.textContent.split("\n").filter(x=>x&&ctx.measureText(x).width>p.clientWidth+3);});
   return {font:ps[0]&&getComputedStyle(ps[0]).fontFamily,fontLoaded:document.fonts.check('16px "FCMyanmar"'),lines:ps.map(p=>p.textContent.split("\n").length),badStarts,overwide};
  });
  assert(textLayout.font.includes("FCMyanmar")&&textLayout.fontLoaded,JSON.stringify(textLayout));
  assert.equal(textLayout.badStarts.length,0,JSON.stringify(textLayout.badStarts));
  assert.equal(textLayout.overwide.length,0,JSON.stringify(textLayout.overwide));
  assert(textLayout.lines.some(n=>n>1),"Myanmar summary must wrap into deliberate lines");
  const editorial=await page.evaluate(async()=>{
   const source=await (await fetch("./data/today.json",{cache:"no-store"})).json();
   const rendered=[...document.querySelectorAll("#fcV2Cards .fc-v2-desc p")].map(p=>(p.dataset.rawText||p.textContent).trim());
   return {count:source.matches.filter(m=>m.previewV2Summary).length,matches:source.matches.every((m,i)=>m.previewV2Summary?.trim()===rendered[i]),stale:source.matches.some(m=>!m.previewV2EditorialStatus)};
  });
  assert.equal(editorial.count,16,JSON.stringify(editorial));
  assert(editorial.matches&&!editorial.stale,"Version 2 must render the manually edited short summaries, not mechanical excerpts");
  const checkedPhoto=await page.evaluate(()=>({withPhoto:document.querySelectorAll(".fc-v2-photo").length,blankChoices:[...document.querySelectorAll(".fc-v2-pick strong")].filter(x=>x.textContent.includes("အတည်မပြုရသေး")).length,accent:getComputedStyle(document.querySelector(".fc-v2-section")).getPropertyValue("--fc-v2-accent").trim()}));
  assert.equal(checkedPhoto.withPhoto,6);
  assert.equal(checkedPhoto.blankChoices,0);
  assert(/^#[0-9a-f]{6}$/i.test(checkedPhoto.accent));
  const frameMeta=await page.evaluate(async()=>{
   const p=window.FutureCodeProfessionalFrames;
   await p.ready;
   const id=await p.getSelected("previewsV2");
   const selected=p.getFrame(id);
   return {id,top:selected?.top||0,bottom:selected?.bottom||0};
  });
  const twoEvent=page.waitForEvent("download",{timeout:90000});
  await page.locator("#fcV2Two").click();const two=await twoEvent;
  const twoBytes=await readFile(await two.path());
  assert(two.suggestedFilename().endsWith(".png"));
  assert(width(twoBytes)>=1200&&height(twoBytes)>1600&&height(twoBytes)<2500);
  const threeEvent=page.waitForEvent("download",{timeout:90000});
  await page.locator("#fcV2Three").click();const three=await threeEvent;
  const threeBytes=await readFile(await three.path());
  const expectedTwo=2*850+12+Math.round(frameMeta.top*1200/1200)+Math.round(frameMeta.bottom*1200/1200)+2*Math.max(10,Math.round(1200*.012));
  const expectedThree=3*850+24+frameMeta.top+frameMeta.bottom+2*Math.max(10,Math.round(1200*.012));
  // If frame is the browser's selected V2 design, there may be original built-in art with natural height.
  // Assert the delta between two/three exports is ONE 850px card + ONE 12px gap, not an extra banner.
  assert.equal(height(threeBytes)-height(twoBytes),862,"Repeated banner between cards");

  assert(width(threeBytes)>=1200&&height(threeBytes)>2500);
  const editor=await context.newPage();editor.on("pageerror",err=>browserErrors.push(err.message));
  await editor.goto(origin+"frame-editor.html",{waitUntil:"domcontentloaded",timeout:45000});
  await editor.waitForFunction(()=>window.FCStudio?.getState()?.frames?.length>30,null,{timeout:70000});
  await editor.waitForFunction(()=>window.FCStudio?.getRows("previewsV2")?.length===16,null,{timeout:70000});
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
  // Editor's group image must have one outer frame, identical height to the 3-row main export.
  assert.equal(dimensions.h,height(threeBytes),JSON.stringify({editor:dimensions.h,main:height(threeBytes)}));

  const zipEvent=editor.waitForEvent("download",{timeout:90000});
  await editor.locator("#downZip").click();const zip=await zipEvent;
  const zipped=await readFile(await zip.path());
  assert(zip.suggestedFilename().endsWith(".zip"));
  assert(zipped.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04])));
  assert(zipped.includes(Buffer.from("Version 2")),"ZIP missing Version 2 folder");
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await page.screenshot({path:"preview-v2-live.png",fullPage:true});
  console.log("PREVIEW V2 LIVE BROWSER PNG/ZIP PASS "+JSON.stringify({cards:await cards.count(),marketStrips:32,wordWrapped:textLayout.lines.length,localFont:textLayout.fontLoaded,historicPhotos:checkedPhoto.withPhoto,theme:checkedPhoto.accent,twoPng:[width(twoBytes),height(twoBytes)],threePng:[width(threeBytes),height(threeBytes)],editorTriple:dimensions,zipBytes:zipped.length}));
 }finally{await context.close();await browser.close();}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
