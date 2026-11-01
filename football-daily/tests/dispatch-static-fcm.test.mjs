import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {preparePayload,notifyStaticSite} from "../scripts/dispatch-static-fcm.mjs";
const sha="c".repeat(40),token="x".repeat(50),url="https://football-test.example.workers.dev";
function fixture(){
 const root=mkdtempSync(join(tmpdir(),"fc-fcm-"));
 const data=join(root,"football-daily","data");
 mkdirSync(join(data,"odds"),{recursive:true});
 mkdirSync(join(data,"archive"),{recursive:true});
 writeFileSync(join(data,"today.json"),JSON.stringify({reportDate:"2026-10-29",published:true,matches:[]}));
 writeFileSync(join(data,"odds","2026-10-29.json"),JSON.stringify({reportDate:"2026-10-29",matches:[]}));
 writeFileSync(join(data,"archive","2026-10-28.json"),JSON.stringify({reportDate:"2026-10-28",published:true,matches:[]}));
 return root;
}
test("Only complete paths from current publication are included",()=>{
 const root=fixture();
 try{
  const p=preparePayload(root,sha);
  assert.equal(p.editorialDate,"2026-10-29");
  assert.deepEqual(Object.keys(p.resources).sort(),["data/archive/2026-10-28.json","data/odds/2026-10-29.json","data/today.json"].sort());
  assert.equal(p.version,sha);
  assert.throws(()=>preparePayload(root,"not-a-git-commit"),/40-character/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test("No notification request without authorization and trusted Worker",async()=>{
 const root=fixture();
 try{
  await assert.rejects(notifyStaticSite({root,sha,token:"",url}),/FC_WORKER_ADMIN_TOKEN/);
  await assert.rejects(notifyStaticSite({root,sha,token,url:"https://attacker.example.com"}),/Trusted Cloudflare/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test("Valid static data reaches authenticated D1/FCM bridge exactly once per invocation",async()=>{
 const root=fixture();let sent=0;
 try{
  const result=await notifyStaticSite({root,sha,token,url},async(u,req)=>{
   sent++;
   assert.equal(u,url+"/api/admin/push-static");
   assert.equal(req.headers.Authorization,"Bearer "+token);
   assert.equal(req.headers["Content-Type"],"application/json");
   const body=JSON.parse(req.body);
   assert.equal(body.version,sha);
   assert.equal(body.editorialDate,"2026-10-29");
   return {ok:true,async json(){return {status:"not-ready",sent:0,failed:0}}};
  });
  assert.equal(result.status,"not-ready");
  assert.equal(sent,1);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test("Worker rejections and ambiguous partial sends are never called success",async()=>{
 const root=fixture();
 try{
  await assert.rejects(notifyStaticSite({root,sha,token,url},async()=>({ok:false,status:503,async json(){return {error:"Firebase unconfigured"}}})),/FCM Worker refused/);
  await assert.rejects(notifyStaticSite({root,sha,token,url},async()=>({ok:true,async json(){return {status:"partial",sent:2,failed:4}}})),/not completely sent/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
