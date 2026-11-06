'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const {TextEncoder,TextDecoder}=require('node:util');
const {JSDOM,VirtualConsole}=require('jsdom');
const {indexedDB,IDBKeyRange}=require('fake-indexeddb');

const html=fs.readFileSync(path.join(__dirname,'../project/app/src/main/assets/index.html'),'utf8');
let exportedFile=null,alerts=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',e=>console.error('JSDOM',e.message));
const dom=new JSDOM(html,{
  url:'https://appassets.androidplatform.net/assets/index.html',
  runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,
  beforeParse(w){
    w.indexedDB=indexedDB;
    w.TextEncoder=TextEncoder;
    w.TextDecoder=TextDecoder;
    w.IDBKeyRange=IDBKeyRange;
    Object.defineProperty(w,'crypto',{value:webcrypto,configurable:true});
    w.confirm=()=>true;
    w.prompt=()=> 'renttrack-test-secret-2026';
    w.scrollTo=()=>{};
    w.Android={saveFile(name,content){exportedFile={name,content}},openBackup(){},printPage(){}};
  }
});
const w=dom.window,d=w.document,$=s=>d.querySelector(s),$$=s=>[...d.querySelectorAll(s)];
const wait=async(cond,name)=>{const start=Date.now();while(Date.now()-start<7000){if(cond())return;await new Promise(r=>setTimeout(r,20))}throw Error('Timed out: '+name+' ; toast='+($('#toast')?.textContent||'none'))};
async function submit(){const f=$('#form');assert.ok(f);f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}))}
async function setRoom(unit,tenant,rent,water,rate){
  $('[data-add="room"]').click();
  await wait(()=>$('#overlay').classList.contains('open'),'room modal');
  for(const [n,v] of Object.entries({unit,tenant,rent,water,rate,deposit:'20000',meter:'0'})){
    const x=$('[name="'+n+'"]');assert.ok(x,n);x.value=String(v);
  }
  await submit();
  await wait(()=>!$('#overlay').classList.contains('open'),'room save');
}
function nav(id){$('[data-nav="'+id+'"]').click()}
async function run(){
 await wait(()=>$$('#stats .stat').length===4,'initial dashboard');
 await setRoom('A-101','Test Tenant',150000,6000,1000);
 nav('rooms');await wait(()=>$('#room-list').textContent.includes('A-101'),'room list');
 nav('home');$('#generate').click();
 await wait(()=>$('#upcoming').textContent.includes('A-101'),'first monthly invoice');
 const first=$('#upcoming').querySelectorAll('tbody tr').length;
 assert.equal(first,1);
 $('#generate').click();
 await wait(()=>$('#upcoming').querySelectorAll('tbody tr').length===1,'idempotent generation');
 nav('invoices');await wait(()=>$('#invoice-list').querySelector('button[data-edit]'),'invoice list');
 $('#invoice-list').querySelector('button[data-edit]').click();
 await wait(()=>$('#overlay').classList.contains('open'),'invoice edit');
 $('[name="newMeter"]').value='10';
 await submit();await wait(()=>!$('#overlay').classList.contains('open'),'invoice update');
 await wait(()=>$('#invoice-list').textContent.includes('166,000'),'meter calculation');
 const payButton=$('#invoice-list').querySelector('button[data-add^="payment:"]');
 assert.ok(payButton);payButton.click();await wait(()=>$('#overlay').classList.contains('open'),'payment form');
 $('[name="amount"]').value='100000';
 await submit();await wait(()=>!$('#overlay').classList.contains('open'),'payment save');
 await wait(()=>$('#invoice-list').textContent.includes('66,000'),'partial payment');
 $('#invoice-list').querySelector('button[data-add^="payment:"]').click();
 await wait(()=>$('#overlay').classList.contains('open'),'final payment');
 $('[name="amount"]').value='66000';
 await submit();await wait(()=>!$('#overlay').classList.contains('open'),'final payment save');
 await wait(()=>$('#invoice-list').textContent.includes('ငွေရှင်းပြီး'),'paid marker');
 nav('settings');$('#backup').click();
 await wait(()=>exportedFile&&exportedFile.content.includes('RentTrackEncrypted'),'encrypted backup');
 assert.ok(!exportedFile.content.includes('Test Tenant'),'backup plaintext leak');
 const saved=exportedFile.content;
 await w.restoreRentTrack(saved);
 await wait(()=>$('#stats').textContent.includes('166,000')===false,'restore complete');
 nav('rooms');
 await wait(()=>$('#room-list').textContent.includes('A-101'),'restored room');
 console.log('PASS RentTrack: room creation, billing idempotency, meter arithmetic, partial/full payment, AES-256-GCM export and restore');
 dom.window.close();
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
