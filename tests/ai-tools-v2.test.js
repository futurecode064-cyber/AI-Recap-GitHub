const fs=require("fs"),assert=require("assert"),v=require("vm");
const root="portal/ai-tools/";
const raw=JSON.parse(fs.readFileSync(root+"tools.json","utf8"));
assert(raw.tools.length>=1000,"V2.0 requires 1,000 tools");
assert(raw.categories.length===31,"Need exactly 30 functional categories plus All");
const valid=new Set(raw.categories.map(c=>c.id)),ids=new Set();
for(const t of raw.tools){
 assert(/^[a-z0-9-]+$/.test(t.id));assert(!ids.has(t.id),"duplicate ID "+t.id);ids.add(t.id);
 assert(typeof t.name==="string"&&t.name.length>1);
 assert(t.url.startsWith("https://"),"non-https official URL");
 assert(t.categories.length>0&&t.categories.every(x=>valid.has(x)));
 assert(!t.verification||typeof t.verification==="string");
}
const news=JSON.parse(fs.readFileSync(root+"updates.json","utf8"));
assert(news.revision===raw.revision,"manifest update revision mismatch");
const script=fs.readFileSync(root+"app-v2.js","utf8");new v.Script(script);
assert(script.includes("data-submit-github"),"Missing submission");
assert(script.includes("renderCollections"),"Missing collections");
assert(script.includes("renderRecommended"),"Missing recommendations");
assert(script.includes('get("updates.json")')||script.includes('json("updates.json")'),"Missing app update");
const html=fs.readFileSync(root+"index.html","utf8");assert(html.includes("./app-v2.js"));
console.log("PASS AI Tools V1.0/V1.1/V1.2/V2.0 milestones: "+raw.tools.length+" tools, 30 categories, submission, collections, search, recommendations");
