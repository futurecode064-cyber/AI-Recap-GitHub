"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const base=path.join(__dirname,"..");
const analysis="future-code-journal/assets/goal-zone-preview-special-analysis.png";
const correct="future-code-journal/assets/goal-zone-results-v2-correct-predictions.png";
function source(file){return fs.readFileSync(path.join(base,file),"utf8");}
function fingerprint(file){return crypto.createHash("sha256").update(fs.readFileSync(path.join(base,file))).digest("hex");}
test("both banner assets are the exact original approved image files",()=>{
 assert.equal(fingerprint(analysis),"49740324cb048ed6779618c4735b1cd2f3d9efccca45e571640609fb4908dbf8");
 assert.equal(fingerprint(correct),"f2d4a28afde12c2623b82ba1eb7e6e7ee422fb75150a2f722de8c2df349873f7");
});
test("the regular pre-match image saver uses the approved special-analysis banner",()=>{
 const js=source("future-code-journal/goal-zone-downloads.js");
 assert(js.includes('previewArtwork = new URL("./assets/goal-zone-preview-special-analysis.png"'));
 assert(js.includes('bannerCanvas(canvas,isPreview?"preview":"default")'));
 assert(js.includes('".png","preview")'));
});
test("Goal Zone Download Center uses distinct pre-match and Results V2 images",()=>{
 const js=source("future-code-journal/goal-zone-download-center.js");
 assert(js.includes("goal-zone-preview-special-analysis.png"));
 assert(js.includes("goal-zone-results-v2-correct-predictions.png"));
 assert(js.includes('type==="preview"||type==="previewV4"'));
 assert(js.includes('type==="resultsV2"?resultsV2BannerUrl:bannerUrl'));
 assert(js.includes("const branded=await withBanner(art,type)"));
});
test("Goal Zone V4 single, paired and Results V2 exports use the original PNG pixels, not a repainted headline",()=>{
 const js=source("main-preview-v4.js");
 assert(js.includes('selectedGoalBanner(canvas,"./assets/goal-zone-preview-special-analysis.png")'));
 assert(js.includes('selectedGoalBanner(canvas,"./assets/goal-zone-results-v2-correct-predictions.png")'));
 assert(js.includes("c.drawImage(banner,0,0,out.width,h)"));
 assert(js.includes("if(isGoal)return brandCanvas(out)"));
});
