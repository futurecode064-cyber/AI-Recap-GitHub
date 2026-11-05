"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const {indexedDB,IDBKeyRange}=require("fake-indexeddb");
const source=fs.readFileSync(path.join(__dirname,"../project/app/src/main/assets/index.html"),"utf8");
let backupSaved="";
const dom=new JSDOM(source,{
 url:"https://appassets.androidplatform.net/assets/index.html",
 runScripts:"dangerously",pretendToBeVisual:true,
 beforeParse(w){
   w.indexedDB=indexedDB;w.IDBKeyRange=IDBKeyRange;
   w.confirm=()=>true;
   w.Android={beep(){},shareText(){},printPage(){},saveFile(name,body){backupSaved=body},openBackup(){}};
 }
});
const w=dom.window,id=s=>w.document.getElementById(s);
async function until(test,description){
 const start=Date.now();while(Date.now()-start<4500){if(test())return;await new Promise(r=>setTimeout(r,20));}
 throw Error("Timed out: "+description);
}
(async()=>{
 await until(()=>id("day").textContent!=="—","boot IndexedDB");
 assert.equal(id("total").textContent,"0");
 id("new").click();await until(()=>id("total").textContent==="1","issue token");
 assert.ok(id("ticket").textContent.includes("Q001"));
 assert.equal(id("ticket").closest(".panel").classList.contains("printable"),true,"receipt print format");
 id("next").click();await until(()=>id("current").textContent==="Q001","call Q001");
 assert.equal(id("next").disabled,true,"prevent concurrent active token");
 id("complete").click();await until(()=>id("done").textContent==="1","complete ticket");
 id("new").click();await until(()=>id("total").textContent==="2","issue second token");
 id("next").click();await until(()=>id("current").textContent==="Q002","call Q002");
 id("skip").click();await until(()=>id("current").textContent==="—","skip token");
 id("new").click();id("new").click();await until(()=>id("total").textContent==="4","two rapid tickets issued without duplicates");
 id("backup").click();await until(()=>backupSaved.includes('"app":"QueuePro"'),"export backup");
 const b=JSON.parse(backupSaved);assert.equal(b.tickets.length,4);
 assert.deepEqual(b.tickets.map(x=>x.n),[1,2,3,4],"atomic sequential numbers");
 await w.receiveBackup(backupSaved);await until(()=>id("total").textContent==="4","restore backup");
 assert.equal(id("done").textContent,"1");
 id("name").value="Future Code Service";id("prefix").value="A";id("save-settings").click();
 await until(()=>id("shop-caption").textContent==="Future Code Service","save settings");
 console.log("PASS QueuePro browser engine: atomic issue, call, prevent conflict, complete, skip, report, backup restore and settings");
 dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
