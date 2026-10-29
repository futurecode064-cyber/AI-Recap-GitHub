'use strict';
// A stalled optional font stylesheet must never prevent football data from booting.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const routes=['kmm-sport-hub','ykz-family','bw-sport','ko-thet-family','future-code-journal','bet-city-family',''];
(async()=>{
 const server=http.createServer((req,res)=>{
  let file=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'text/html');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote']}:{})});
 const report=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
 try{
  for(const width of [390,1280])for(const brand of routes){
   const ctx=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
   // Deliberately keep Google's stylesheet request pending throughout the check.
   await ctx.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,()=>new Promise(()=>{}));
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin||/fonts\.(?:googleapis|gstatic)\.com/.test(u.hostname))return route.fallback();
    return route.abort();
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const url=origin+'/'+(brand?brand+'/':'');
   await page.goto(url,{waitUntil:'commit'});
   await page.waitForFunction(()=>document.getElementById('statusText')?.textContent==='ထုတ်ဝေပြီး',null,{timeout:6000});
   assert.equal(await page.locator('#matchCount').textContent(),String(report.matches.length),brand);
   assert.equal(await page.locator('.match-card').count(),report.matches.length,brand);
   if(brand==='kmm-sport-hub'){
    await page.locator('[data-league="special"]').click();
    assert.equal(await page.locator('.match-card').count(),2);
    await page.locator('[data-day="-1"]').click();
    await page.waitForFunction(()=>document.getElementById('matchList')?.getAttribute('aria-busy')==='false');
    assert.ok(await page.locator('.match-card').count()>0,'KMM yesterday results');
    await page.locator('[data-day="0"]').click();
    await page.waitForFunction(n=>document.getElementById('matchCount')?.textContent===String(n),report.matches.length);
    if(width===390){
     const downloaded=page.waitForEvent('download',{timeout:30000});
     await page.locator('.match-download').first().click();
     const file=await (await downloaded).path();
     const png=fs.readFileSync(file);
     assert.equal(png.subarray(1,4).toString(),'PNG');assert.ok(png.length>12000);
     console.log('KMM preview PNG PASS '+png.length+' bytes');
    }
   }
   await page.goto(url+'odds.html',{waitUntil:'commit'});
   await page.waitForFunction(()=>document.querySelectorAll('.odds-table tbody tr').length>0,null,{timeout:6000});
   assert.equal(await page.locator('.odds-table tbody tr').count(),report.matches.length,brand+' odds');
   if(brand==='kmm-sport-hub'&&width===390){
    const downloaded=page.waitForEvent('download',{timeout:30000});
    await page.locator('#brandSingleAll').click();
    const file=await (await downloaded).path();const png=fs.readFileSync(file);
    assert.equal(png.subarray(1,4).toString(),'PNG');assert.ok(png.length>12000);
    console.log('KMM odds PNG PASS '+png.length+' bytes');
   }
   assert.deepEqual(errors,[],brand+' runtime errors');
   console.log(JSON.stringify({brand:brand||'main',width,matches:report.matches.length,odds:report.matches.length,blockedGoogleFonts:'PASS'}));
   await ctx.close();
  }
  const ctx=await browser.newContext();
  await ctx.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:'/* optional font loaded */'}));
  const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/kmm-sport-hub/',{waitUntil:'domcontentloaded'});
  assert.equal(await p.locator('link[href*="fonts.googleapis.com/css2"]').getAttribute('media'),'all');
  assert.deepEqual(errors,[]);await ctx.close();
  console.log('KMM optional-font success handler PASS');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
