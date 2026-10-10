'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
async function main(){
 const keys=new Map(),storage=new Map(),calls=[];let responseError=0,registered=null;
 const db={close(){},transaction(){const tx={};const store={get(name){const q={result:keys.get(name)};setImmediate(()=>q.onsuccess?.());return q},put(pair,name){keys.set(name,pair);setImmediate(()=>tx.oncomplete?.())}};tx.objectStore=()=>store;return tx}};
 const c={crypto:webcrypto,TextEncoder,Uint8Array,AbortController,setTimeout,clearTimeout,btoa,console,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},indexedDB:{open(){const q={result:db};setImmediate(()=>q.onsuccess?.());return q}},fetch:async(url,options)=>{
  const body=JSON.parse(options.body);calls.push(body.action);let data={};
  if(responseError)return {ok:false,status:responseError,json:async()=>({error:'Session expired'})};
  if(body.action==='challenge')data={nonce:'fixture-nonce'};
  if(body.action==='student_login'){
   assert.equal(body.username,'fixture');assert.equal(body.password,'fixture-pass');
   registered=await webcrypto.subtle.importKey('spki',Buffer.from(body.spki,'base64'),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
   assert.equal(await webcrypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},registered,Buffer.from(body.signature,'base64'),new TextEncoder().encode('fixture|fixture-nonce')),true);
   data={token:'fixture-token',sections:[]};
  }
  if(body.action==='student_me'){
   assert.equal(body.token,'fixture-token');
   assert.equal(await webcrypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},registered,Buffer.from(body.signature,'base64'),new TextEncoder().encode('me|fixture-token|'+body.timestamp)),true);
   data={username:'fixture',sections:[]};
  }
  return {ok:true,status:200,json:async()=>data};
 }};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../portal/student/access.js'),'utf8'),c);
 const a=c.FCStudentAccess;await a.login(' Fixture ','fixture-pass');assert.equal(keys.size,1);assert.equal(a.session().username,'fixture');await a.me();await a.login('fixture','fixture-pass');assert.equal(keys.size,1);responseError=401;await assert.rejects(a.me(),e=>e.status===401);assert.equal(a.session().token,'fixture-token');responseError=0;await a.logout();assert.equal(a.session().token,'');assert.equal(calls.at(-1),'logout');assert.equal(keys.size,1);
 console.log('PASS Web Crypto P-256 login/session proofs, existing IndexedDB key reuse, typed HTTP failure and logout revocation.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
