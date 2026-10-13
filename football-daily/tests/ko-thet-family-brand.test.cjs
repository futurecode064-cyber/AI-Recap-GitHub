"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const name="Ko Thet Family ဘောလုံးဂျာနယ်";
test("Ko Thet Family site and odds pages share the canonical football dataset and working scripts",()=>{
 const home=read("ko-thet-family/index.html");
 const odds=read("ko-thet-family/odds.html");
 for(const html of [home,odds]){
  assert.ok(html.includes(name));
  assert.ok(html.includes("./brand.css?v=gold-burgundy-20261013"));
  assert.ok(html.includes("./brand.js?v=gold-burgundy-20261013"));
  assert.ok(html.includes("./assets/logo.webp?v=ktf-20261013"));
  assert.ok(html.includes("../canvas-image-kit.js"));
  assert.ok(html.includes("../daily-image-export.js"));
  assert.ok(!html.includes("YKZ FAMILY GROUP"));
  assert.ok(!html.includes("အတူရှေ့ဆက် YKZ"));
 }
 assert.ok(home.includes('data-football-data-url="../data/today.json"'));
 assert.ok(odds.includes('data-football-odds-data-url="../data/odds/"'));
 assert.ok(home.includes("../app.js")&&home.includes("../card-export.js"));
 assert.ok(odds.includes("../odds.js"));
 assert.ok(!fs.existsSync(path.join(root,"ko-thet-family/data")));
 assert.ok(home.includes('id="matchList"')&&home.includes('id="filters"')&&home.includes('id="resultsPngBtn"'));
 assert.ok(odds.includes('id="oddsList"')&&odds.includes('id="oddsPngBtn"'));
});
test("Ko Thet Family site carries exact original club logo as a real webp and supports its own palette",()=>{
 const logo=fs.readFileSync(path.join(root,"ko-thet-family/assets/logo.webp"));
 assert.ok(logo.length>=4000,"Uploaded Ko Thet original crest must exist");
 assert.equal(logo.toString("ascii",0,4),"RIFF");
 assert.equal(logo.toString("ascii",8,12),"WEBP");
 assert.equal(logo.readUInt32LE(4)+8,logo.length);
 const css=read("ko-thet-family/brand.css"),config=read("ko-thet-family/brand.js");
 assert.ok(css.includes(":root.ktf-theme")&&css.includes("#ffdb70"));
 assert.ok(css.includes(".ktf-theme .match-card")&&css.includes(".ktf-theme .odds-hero"));
 assert.ok(css.includes(".ktf-theme .special-analysis")&&css.includes(".ktf-theme .match-hero-art"));
 assert.ok(css.includes("@media(max-width:620px)"));
 assert.ok(config.includes('root.classList.add("ktf-theme")'));
 assert.ok(config.includes('root.dataset.footballBrandName="'+name+'"'));
 assert.ok(config.includes('dataRoot:new URL("../data/",document.baseURI).href'));
});
test("Shared canvas assets select KTF identity without changing YKZ/BW branding",()=>{
 const kit=read("canvas-image-kit.js"),exporter=read("card-export.js");
 assert.ok(kit.includes("const ktfBranded="));
 assert.ok(kit.includes('"KO THET FAMILY ဘောလုံးဂျာနယ်"'));
 assert.ok(kit.includes('crest(ctx,document.documentElement?.dataset?.footballBrandLogoUrl,W-113,22,78,"KTF")'));
 assert.ok(exporter.includes("const isKTF="));
 assert.ok(exporter.includes('text(ctx,"KO THET FAMILY",W/2,44'));
 assert.ok(exporter.includes('crest(ctx,opts.brandLogoUrl||document.documentElement?.dataset?.footballBrandLogoUrl,W-107,20,48,"KTF")'));
 assert.ok(exporter.includes("isYKZ")&&exporter.includes("isBW"));
 assert.ok(kit.includes("bwBranded")&&kit.includes("branded?"));
});
test("Existing daily 7–8 AM homepage notice and price-source footer copied exactly",()=>{
 const home=read("ko-thet-family/index.html"),odds=read("ko-thet-family/odds.html");
 assert.ok(home.includes("နေ့စဥ် မနက် ၇ နာရီ နှင့် ၈ နာရီကြားတွင်"));
 assert.ok(home.includes("နေ့စဥ် ကန်မည့် ပွဲများ အားလုံး ကို update ကြည့်ရှူ နိုင်ပါပြီ"));
 assert.ok(odds.includes("ပေါက်ကြေးများသည် အိုင်ဘတ် ခွန်ရှစ်ကိုး ဆိုဒ်မှာ မနက်ပိုင်း ဖွင့် ထားသော မြန်မာကြေး များဖြစ်ပါသည်။"));
});
