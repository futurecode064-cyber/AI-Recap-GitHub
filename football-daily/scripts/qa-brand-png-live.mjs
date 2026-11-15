import { chromium } from 'playwright';
import { readFile, stat } from 'node:fs/promises';
const ROOT='https://future-code-football-daily.pages.dev';
const brands=['ykz-family','kmm-sport-hub','ko-thet-family'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const issues=[];
const results=[];
try {
 for (const brand of brands) for (const pageName of ['index.html','odds.html']) {
  const ctx=await browser.newContext({viewport:{width:460,height:900},acceptDownloads:true});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  const url=ROOT+'/'+brand+'/'+pageName+'?pngqa='+Date.now();
  try {
   let response;
   for (let attempt=0;attempt<3;attempt++){
    try {response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});if(response?.ok())break;}
    catch(e){if(attempt===2)throw e;}
    await page.waitForTimeout(2000);
   }
   if(!response?.ok())throw Error('HTML HTTP '+response?.status());
   await page.waitForFunction(()=>Boolean(window.FutureCodeBrandExportData&&window.FutureCodeImageSave&&window.FutureCodeCanvasKit),null,{timeout:30000});
   const scriptHealth=await page.evaluate(()=>({
    id:window.FutureCodeBrandConfig?.id,
    logos:typeof window.FutureCodeBrandExportData?.leagueCrest==='function',
    native:typeof window.FutureCodeImageSave?.saveBlob==='function',
    canvas:typeof window.FutureCodeCanvasKit?.download==='function'
   }));
   if(scriptHealth.id!==brand||!scriptHealth.logos||!scriptHealth.native||!scriptHealth.canvas)
    throw Error('Missing common PNG pipeline: '+JSON.stringify(scriptHealth));
   const odds=pageName==='odds.html';
   const selector=odds?'#oddsPngPages button.odds-part-download':'button.match-download';
   const targets=page.locator(selector);
   await targets.first().waitFor({state:'visible',timeout:50000});
   const partCount=odds?await targets.count():1;
   if(partCount<1||partCount>2)throw Error('Unexpected PNG part count '+partCount);
   for(let part=0;part<partCount;part++){
    const target=targets.nth(part);
    if(await target.isDisabled())throw Error('PNG download disabled for part '+(part+1));
    // Verify *each* default odds image; the second half may contain different crests.
    const started=page.waitForEvent('download',{timeout:90000});
    await target.click({timeout:30000});
    const download=await started;
    if(download.failure&&await download.failure())throw Error('Download cancelled: '+await download.failure());
    const filename=download.suggestedFilename();
    if(!/\\.png$/i.test(filename))throw Error('Non-PNG file '+filename);
    const filepath=await download.path();
    if(!filepath)throw Error('No saved file path');
    const info=await stat(filepath),bytes=await readFile(filepath);
    const isPNG=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if(!isPNG||bytes.length<12000)throw Error('PNG content missing or too small: '+info.size);
    const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
    if(w<500||h<300)throw Error('PNG dimensions '+w+'x'+h);
    const result={brand,page:pageName,part:part+1,parts:partCount,filename,bytes:info.size,width:w,height:h};
    results.push(result);
    console.log('BRAND PNG DOWNLOAD PASS '+JSON.stringify(result));
   }
  }catch(e){
   const status=await page.evaluate(()=>document.querySelector('#oddsExportStatus')?.textContent||document.querySelector('.match-download')?.textContent||'').catch(()=>null);
   const message=brand+'/'+pageName+': '+String(e?.message||e)+'; status='+status+'; JS='+errors.slice(0,3).join(' | ');
   issues.push(message);console.error('BRAND PNG DOWNLOAD FAIL '+message);
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
if(issues.length)throw Error(issues.join('\n'));
if(results.length!==brands.length*2)throw Error('Incomplete test coverage');
console.log('ALL YKZ, KMM, KO THET PREVIEW AND ODDS PNG DOWNLOADS PASSED');
