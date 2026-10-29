'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../main-professional-frame-studio.js'),'utf8');
const fn=source.slice(source.indexOf('async function composite('),source.indexOf('/* The optional third argument'));
function setup(originalArtwork,assets){
 const calls=[],ctx={fillRect(){},createLinearGradient(){return {addColorStop(){}}},drawImage(...args){calls.push(args)},strokeRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){}};
 const context={originalArtwork,image:async url=>assets[url],shade:()=> '#000',band(){},artwork(c,im,w,h,y){if(im)c.drawImage(im,0,y,w,h)},document:{createElement(){return {getContext:()=>ctx}}}};
 vm.createContext(context);vm.runInContext(fn,context);return {run:context.composite,calls};
}
test('paired original banners retain aspect ratios for short and tall daily content',async()=>{
 const top={width:1200,height:240},bottom={width:1200,height:120};
 const h=setup({sample:{top:'top',bottom:'bottom'}},{top,bottom});
 for(const height of [400,4000]){
 const out=await h.run({width:2400,height},{id:'sample',top:160,bottom:110,color:'#123456'});
 assert.equal(out.height,480+height+240+58);
 }
 assert.equal(h.calls[0][4],480);assert.equal(h.calls[1][4],240);
});
test('full-frame cropped ribbons retain the original crop ratio',async()=>{
 const full={width:1000,height:2000};const h=setup({sample:{full:'frame',t:.15,b:.05}},{frame:full});
 const out=await h.run({width:2000,height:1000},{id:'sample',top:110,bottom:75,color:'#123456'});
 assert.equal(out.height,600+1000+200+48);
 assert.equal(h.calls[0][8],600);assert.equal(h.calls[1][8],200);
});
