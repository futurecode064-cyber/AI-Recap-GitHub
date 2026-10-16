"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const pages=["index.html","odds.html","ykz-family/index.html","ykz-family/odds.html","bw-sport/index.html","bw-sport/odds.html","ko-thet-family/index.html","ko-thet-family/odds.html"];
const text=f=>fs.readFileSync(path.join(root,f),"utf8");
test("main website allows copying; branded publications retain original content guard and all downloads",()=>{
 for(const p of pages){
   const html=text(p),nested=p.includes("/");
   const script=(nested?"../":"./")+"content-protection.js?v=copy-guard-20261013";
   const css=(nested?"../":"./")+"styles.css?v=copy-guard-20261013";
   if(nested){
     assert.equal(html.split(script).length-1,1,p+": branded content protection must stay enabled");
   }else{
     assert.ok(!html.includes("content-protection.js"),p+": main site must permit selection, Ctrl+C and mobile long press");
     assert.ok(!html.includes('class="football-copy-guard"'),p+": main site must not be copy-guarded");
   }
   assert.ok(html.includes(css),p+": refreshed shared stylesheet");
   assert.ok(html.includes("daily-image-export.js"),p+": PNG exporter preserved");
   assert.ok(html.includes("odds.js")||html.includes("app.js"),p+": functioning match page");
   assert.ok(!html.includes("Copyright Notice"),p+": user requested no notice");
 }
});
test("selection/press-and-hold are blocked without disabling editable controls",()=>{
 const css=text("styles.css"),code=text("content-protection.js");
 assert.ok(css.includes("-webkit-user-select:none !important"));
 assert.ok(css.includes("-webkit-touch-callout:none !important"));
 assert.ok(css.includes("user-select:text !important"));
 assert.ok(css.includes("[role=\"textbox\"]"));
 const callbacks={};
 const rootClass={contains:()=>false,add:()=>{}};
 const doc={documentElement:{classList:rootClass},addEventListener:(name,fn)=>{callbacks[name]=fn}};
 vm.runInNewContext(code,{document:doc});
 for(const evt of ["copy","cut","selectstart","contextmenu","keydown"])assert.equal(typeof callbacks[evt],"function");
 const ordinary={nodeType:1,isContentEditable:false,closest:()=>null};
 const editor={nodeType:1,isContentEditable:true,closest:()=>({})};
 for(const kind of ["copy","cut","selectstart","contextmenu"]){
   let stopped=false;
   callbacks[kind]({target:ordinary,preventDefault:()=>{stopped=true},cancelable:true});
   assert.ok(stopped,kind+" should be deterred on reader text");
   stopped=false;
   callbacks[kind]({target:editor,preventDefault:()=>{stopped=true},cancelable:true});
   assert.ok(!stopped,kind+" should work in forms");
 }
 let stopped=false;
 callbacks.keydown({target:ordinary,key:"c",ctrlKey:true,metaKey:false,preventDefault:()=>{stopped=true}});
 assert.ok(stopped,"Ctrl+C should be blocked");
 stopped=false;
 callbacks.keydown({target:ordinary,key:"p",ctrlKey:true,metaKey:false,preventDefault:()=>{stopped=true}});
 assert.ok(!stopped,"Unrelated shortcuts remain usable");
 stopped=false;
 callbacks.keydown({target:editor,key:"c",ctrlKey:true,metaKey:false,preventDefault:()=>{stopped=true}});
 assert.ok(!stopped,"Input text copy must remain usable");
});
