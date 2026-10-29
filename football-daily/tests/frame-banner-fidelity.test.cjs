'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const studio=fs.readFileSync(path.join(root,'main-professional-frame-studio.js'),'utf8');
const workspace=fs.readFileSync(path.join(root,'frame-workspace.js'),'utf8');
const html=fs.readFileSync(path.join(root,'frame-editor.html'),'utf8');

test('both editors preserve uploaded original PNG/JPEG/WebP binary and resolution',()=>{
 assert.match(workspace,/reader\.readAsDataURL\(file\)/);
 assert.match(studio,/reader\.readAsDataURL\(file\)/);
 assert.doesNotMatch(workspace,/toDataURL\(["']image\/webp/);
 assert.doesNotMatch(studio,/toDataURL\(["']image\/webp/);
 assert.match(studio,/x\.length<12000000/);
 assert.match(workspace,/String\(f\.topImage\|\|""\)\.length>=12000000/);
});
test('full resolution PNG renderer places user banners at top and bottom edges without stretch',async()=>{
 const code=studio.slice(studio.indexOf('async function composite('),studio.indexOf('// Render the same frame layout'));
 assert(code.length>500&&code.length<6000);
 const calls=[],fills=[];
 const ctx={
  createLinearGradient:()=>({addColorStop(){}}),
  fillRect(...a){fills.push({a,color:this.fillStyle})},
  drawImage(...a){calls.push(a)},strokeRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},
  fillStyle:'#000'
 };
 const images={top:{width:2400,height:300,naturalWidth:2400,naturalHeight:300},bottom:{width:2400,height:150,naturalWidth:2400,naturalHeight:150}};
 const env={originalArtwork:{},image:async id=>images[id],shade:()=>"#222",band(){},artwork:(c,im,w,h,y)=>{if(im)c.drawImage(im,0,y,w,h);},document:{createElement:()=>({getContext:()=>ctx})}};
 vm.createContext(env);vm.runInContext(code,env);
 const out=await env.composite({width:1200,height:620},{id:'custom',top:150,bottom:75,color:'#abc123',fit:'contain',topImage:'top',bottomImage:'bottom'});
 assert.equal(out.width,1200);
 assert.equal(out.height,150+620+75+28);
 assert.equal(calls[0][0],images.top);
 assert.equal(calls[0][2],0,'top image starts at y=0');
 assert.equal(calls[1][0],images.bottom);
 assert.equal(calls[1][2],out.height-75,'bottom image aligns to final canvas edge');
 assert(fills.some(v=>v.color==='#abc123'&&v.a[1]===150),'theme stripe visible under top banner');
 assert(fills.some(v=>v.color==='#abc123'&&v.a[1]===out.height-75-7),'theme stripe visible above bottom banner');
});
test('editing color, height, fit and new files changes live frame sample before save',()=>{
 assert.match(studio,/renderSample,.*list:/s);
 assert.match(workspace,/schedulePreview\(\)/);
 assert.match(workspace,/api\.renderSample\(config\)/);
 assert.match(workspace,/\$\("frameColor"\)\.oninput=/);
 assert.match(workspace,/\$\("frameTopFile"\)\.onchange=/);
 assert.match(workspace,/\$\("frameBottomFile"\)\.onchange=/);
 assert.match(html,/မူရင်း PNG\/JPG\/WEBP ကို resolution မလျှော့ဘဲ/);
});
