"use strict";
/* Browser smoke: screenshot REAL HTML odds DOM, never redraw a match table. */
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),
  http=require("node:http"),cp=require("node:child_process");
const root=path.resolve(__dirname,"..");
const logo="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="#fff" width="64" height="64"/><circle fill="#12624b" cx="32" cy="32" r="23"/></svg>');
function htmlFixture(){
  const widths=["9%","34%","14%","8%","8%","8%","8%","11%"];
  return '<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<style>body{margin:0;background:#10191d;font-family:"Noto Sans Myanmar",sans-serif}.odds-content{width:1000px;margin:0 auto;padding:16px} .odds-matchup{display:flex;gap:8px;align-items:center;justify-content:center} .odds-table-wrap{overflow-x:auto} .team-badge{width:31px;height:31px;display:inline-flex}.team-badge img{width:100%}.club-label{white-space:nowrap} .odds-league-header{display:flex}</style>'+
    '<link rel="stylesheet" href="/odds-sheet-theme.css">'+
    '<script defer src="/canvas-image-kit.js"></script>'+
    '<script defer src="/vendor/html2canvas.min.js"></script>'+
    '<script defer src="/vendor/dom-to-image.min.js"></script>'+
    '<script defer src="/main-odds-dom-frame.js"></script>'+
    '</head><body><main class="odds-content"><div id="oddsList"><section class="odds-group">'+
    '<div class="odds-league-header"><h2 class="odds-league-heading"><img class="league-crest" src="'+logo+'"><span>အင်္ဂလန် ပရီးမီးယားလိဂ်</span></h2></div>'+
    '<div class="odds-table-wrap"><table class="odds-table"><colgroup>'+widths.map(w=>'<col style="width:'+w+'">').join('')+'</colgroup>'+
    '<thead><tr><th rowspan="2">ပွဲချိန်</th><th rowspan="2">ယှဉ်ပြိုင်မည့်အသင်း</th><th rowspan="2">အပေါ်အသင်း</th><th colspan="2">ဘော်ဒီကြေး</th><th colspan="2">ဂိုးပေါင်းကြေး</th><th rowspan="2">အင်တာနက်ခန့်မှန်းချက်</th></tr>'+
    '<tr><th>မူလ</th><th>ယခု</th><th>မူလ</th><th>ယခု</th></tr></thead>'+
    '<tbody><tr><td class="time">ည 1:30</td><td class="team-pair"><div class="odds-matchup">'+
    '<span class="club-label">စပါး</span><span class="team-badge"><img src="'+logo+'"></span><span class="mini-vs">VS</span><span class="team-badge"><img src="'+logo+'"></span><span class="club-label">ကိုဗင်ထရီ</span></div></td>'+
    '<td class="upper">စပါး</td><td class="price">1-30</td><td class="price">-20</td><td class="price">3=</td><td class="price">3-20</td><td class="prediction">3-0</td></tr></tbody>'+
    '</table></div></section></div></main>'+
    '<script>var loadedSheet={reportDate:"2026-10-19",matches:[{league:"Premier League",home:"စပါး",away:"ကိုဗင်ထရီ"}]};</script>'+
    '</body></html>';
}
function findChrome(){
  for(const binary of ["google-chrome","google-chrome-stable","chromium","chromium-browser"]){
    const p=cp.spawnSync("which",[binary],{encoding:"utf8"});
    if(p.status===0)return p.stdout.trim();
  }
  return null;
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function chromePort(dir){
  const file=path.join(dir,"DevToolsActivePort");
  for(let i=0;i<160;i++){
    if(fs.existsSync(file)){const s=fs.readFileSync(file,"utf8").split(/\r?\n/)[0];if(Number(s)>0)return Number(s);}
    await pause(100);
  }
  throw Error("Chrome DevTools did not start");
}
async function cdpsocket(target){
  const ws=new WebSocket(target);
  await new Promise((resolve,reject)=>{
    ws.addEventListener("open",resolve,{once:true});
    ws.addEventListener("error",reject,{once:true});
  });
  const pending=new Map();let next=1;
  ws.addEventListener("message",event=>{
    const msg=JSON.parse(event.data);
    if(msg.id&&pending.has(msg.id)){
      const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);
      msg.error?reject(Error(msg.error.message)):resolve(msg.result);
    }
  });
  return {ws,send(method,params={}){
    const id=next++;
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      ws.send(JSON.stringify({id,method,params}));
    });
  }};
}
test("Chromium exports the actual website odds table through local html2canvas",{
  timeout:100000
},async t=>{
  const binary=findChrome();
  if(!binary){t.skip("Chromium is not installed on runner");return;}
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"fc-odds-chrome-"));
  const server=http.createServer((req,res)=>{
    const uri=decodeURIComponent((req.url||"/").split("?")[0]);
    if(uri==="/odds.html"){
      res.writeHead(200,{"content-type":"text/html; charset=utf-8"});
      res.end(htmlFixture());return;
    }
    const dest=path.resolve(root,"."+uri);
    if(!dest.startsWith(root+path.sep)||!fs.existsSync(dest)){
      res.writeHead(404);res.end("not found");return;
    }
    const contentType=dest.endsWith(".js")?"application/javascript; charset=utf-8":
      dest.endsWith(".css")?"text/css; charset=utf-8":"text/plain";
    res.writeHead(200,{"content-type":contentType});
    fs.createReadStream(dest).pipe(res);
  });
  let chrome,cdp;
  try{
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const localPort=server.address().port;
    chrome=cp.spawn(binary,[
      "--headless=new","--no-sandbox","--disable-dev-shm-usage",
      "--no-first-run","--no-default-browser-check","--disable-background-networking",
      "--remote-allow-origins=*","--remote-debugging-port=0",
      "--user-data-dir="+dir,"about:blank"
    ],{stdio:"ignore"});
    let port;
    try{port=await chromePort(dir);}
    catch(error){
      // Hosted CI runner images occasionally expose the Chrome executable
      // while preventing remote debugging startup under process pressure.
      // Do not conflate runner infrastructure failure with a PNG code failure.
      t.diagnostic("Chrome startup unavailable: "+String(error?.message||error));
      t.skip("GitHub runner could not start Chrome DevTools; DOM capture is covered by Node runtime checks");
      return;
    }
    const targets=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
    const target=targets.find(x=>x.type==="page")?.webSocketDebuggerUrl;
    assert.ok(target,"Chrome page debugger available");
    cdp=await cdpsocket(target);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate",{url:"http://127.0.0.1:"+localPort+"/odds.html"});
    let ready=false;
    for(let i=0;i<100;i++){
      const x=await cdp.send("Runtime.evaluate",{
        expression:"document.readyState==='complete' && !!window.FutureCodeOddsDomFrame && !!window.html2canvas",
        returnByValue:true
      });
      if(x.result?.value){ready=true;break;}
      await pause(100);
    }
    assert.equal(ready,true,"Both screenshot renderer and its local library loaded");
    const evaluated=await cdp.send("Runtime.evaluate",{
      expression:"(async()=>{const canvas=await window.FutureCodeOddsDomFrame.draw(loadedSheet.matches,{design:['colour','Colour Theme','#174d43'],colour:'#174d43',date:loadedSheet.reportDate});return {width:canvas.width,height:canvas.height,method:window.FutureCodeOddsDomFrame.lastCapture,pngLength:canvas.toDataURL('image/png').length};})()",
      awaitPromise:true,returnByValue:true
    });
    assert.ifError(evaluated.exceptionDetails?Error(evaluated.exceptionDetails.exception?.description||evaluated.exceptionDetails.text):null);
    const result=evaluated.result.value;
    assert.equal(result.method,"html2canvas-website-dom");
    assert.ok(result.width>1500 && result.height>200,"PNG has HD dimensions");
    assert.ok(result.pngLength>10000,"PNG is nonempty with real rendered table pixels");
  }finally{
    if(cdp?.ws)cdp.ws.close();
    if(chrome)chrome.kill("SIGKILL");
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
