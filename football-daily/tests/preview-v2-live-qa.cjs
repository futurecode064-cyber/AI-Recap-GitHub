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
  const daily=await page.evaluate(async()=>{const res=await fetch("./data/today.json",{cache:"no-store"});if(!res.ok)throw Error("Published daily report unavailable");return res.json();});
  const expectedCount=daily.matches.filter(m=>m.fixtureId&&m.dailyPreviewText&&m.myanmarOdds).length;
  const expectedPhotos=daily.matches.filter(m=>/^https:\/\//.test(m.previewV2Media?.url||"")).length;
  assert(expectedCount>=3,"At least three eligible fixtures required for 2/3-match export smoke tests");
  await page.locator(".fc-main-preview-v2-tab").waitFor({timeout:25000});
  await page.locator(".fc-main-preview-v2-tab").click();
  const cards=page.locator("#fcV2Cards .fc-v2-card");
  await page.waitForFunction(expected=>document.querySelectorAll("#fcV2Cards .fc-v2-card").length===expected,expectedCount,{timeout:45000});
  assert.equal(await cards.count(),expectedCount);
  assert.equal(await page.locator("body").getAttribute("data-fc-main-view"),"previewV2");
  assert.equal(await page.locator("#fcV2Cards .fc-v2-ribbon").count(),expectedCount);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-quote").count(),expectedCount*2);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-time").count(),expectedCount);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-odds-team").count(),expectedCount*2);
  assert.equal(await page.locator("#fcV2Cards .fc-v2-market").count(),0);
  const content=await cards.first().innerText();
  assert(content.includes("ရွေးချယ်မှု")&&content.includes("ဂိုးပေါင်းကြေး")&&content.includes("ဘော်ဒီကြေး")&&content.includes(daily.matches[0].homeDisplay),content.slice(0,500));
  assert.equal(await page.locator("#fcV2Cards .fc-v2-logo").count(),expectedCount*4);
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
  assert.equal(editorial.count,expectedCount,JSON.stringify(editorial));
  assert(editorial.matches&&!editorial.stale,"Version 2 must render the manually edited short summaries, not mechanical excerpts");
  const checkedPhoto=await page.evaluate(()=>({withPhoto:document.querySelectorAll(".fc-v2-photo").length,blankChoices:[...document.querySelectorAll(".fc-v2-pick strong")].filter(x=>x.textContent.includes("အတည်မပြုရသေး")).length,accent:getComputedStyle(document.querySelector(".fc-v2-section")).getPropertyValue("--fc-v2-accent").trim()}));
  assert.equal(checkedPhoto.withPhoto,expectedPhotos);
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
  assert(width(twoBytes)===1200&&height(twoBytes)>950&&height(twoBytes)<2200,"2-match PNG height invalid");
  const threeEvent=page.waitForEvent("download",{timeout:90000});
  await page.locator("#fcV2Three").click();const three=await threeEvent;
  const threeBytes=await readFile(await three.path());
  const geometry=await page.evaluate(async()=>{
   const src=await (await fetch("./data/today.json",{cache:"no-store"})).json();
   const canvases=[];
   for(const m of src.matches.slice(0,3))canvases.push(await window.FutureCodePreviewV2.render(m,{color:"#18553d"}));
   const sample=canvases[0],ctx=sample.getContext("2d");
   const pick=(x,y)=>[...ctx.getImageData(x,y,1,1).data].slice(0,3);
   return {
    heights:canvases.map(c=>c.height),widths:canvases.map(c=>c.width),
    articlePanel:pick(1163,115),timePanel:pick(600,sample.height-70),photoPixel:pick(70,160),
    mediaCount:src.matches.filter(m=>m.previewV2Media?.url).length
   };
  });
  assert(geometry.widths.every(n=>n===1200),JSON.stringify(geometry));
  assert(geometry.heights.every(n=>n>=410&&n<=680),JSON.stringify(geometry));
  const bannerOffset=height(twoBytes)-(geometry.heights[0]+geometry.heights[1]+4);
  assert(bannerOffset>=0&&bannerOffset<850,JSON.stringify(geometry));
  assert.equal(height(threeBytes)-height(twoBytes),geometry.heights[2]+4,"Three card height / repeated banner mismatch");
  assert(geometry.articlePanel.every(n=>n>=190),"Right-hand text panel not white");
  assert(geometry.timePanel.every(n=>n>=185),"Central time panel not aligned");
  assert(geometry.mediaCount>=2,"No real historic game/player photographs were published");
  assert.equal(geometry.photoPixel.length,3);
  assert(textLayout.lines.every(n=>n>=1),"Every source summary must be visible");
  assert(width(threeBytes)===1200&&height(threeBytes)>1400);
  const editor=await context.newPage();editor.on("pageerror",err=>browserErrors.push(err.message));
  await editor.goto(origin+"frame-editor.html",{waitUntil:"domcontentloaded",timeout:45000});
  await editor.waitForFunction(()=>window.FCStudio?.getState()?.frames?.length>30,null,{timeout:70000});
  await editor.waitForFunction(count=>window.FCStudio?.getRows("previewsV2")?.length===count,expectedCount,{timeout:70000});
  const editorState=await editor.evaluate(()=>({
   scopes:window.FCStudio.TYPES,
   frame:(window.FCStudio.getState().placements.previewsV2||[]).length,
   matches:window.FCStudio.getRows("previewsV2").length,
   canRender:typeof document.querySelector("#engineHome").contentWindow.FutureCodePreviewV2?.render==="function"
  }));
  assert(editorState.scopes.includes("previewsV2"),JSON.stringify(editorState));
  assert(editorState.frame>=1&&editorState.matches===expectedCount&&editorState.canRender,JSON.stringify(editorState));
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
  assert(dimensions.w===1200&&dimensions.h>=1400,JSON.stringify(dimensions));
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
  console.log("PREVIEW V2 LIVE BROWSER PNG/ZIP PASS "+JSON.stringify({cards:await cards.count(),marketStrips:expectedCount*2,wordWrapped:textLayout.lines.length,localFont:textLayout.fontLoaded,historicPhotos:checkedPhoto.withPhoto,theme:checkedPhoto.accent,twoPng:[width(twoBytes),height(twoBytes)],threePng:[width(threeBytes),height(threeBytes)],editorTriple:dimensions,zipBytes:zipped.length}));
 }finally{await context.close();await browser.close();}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
