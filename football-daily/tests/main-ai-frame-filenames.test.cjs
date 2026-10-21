"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const exporter=require("../main-ai-bulk-export.js");
test("Brand AI PNG names use the exact requested internet names",()=>{
 const names={final:"final-goal-internet",special:"special-one-internet",best:"best-your-choice-internet"};
 for(const [frame,name] of Object.entries(names)){
   assert.equal(exporter.frameFileName(frame,"2026-10-21"),name+"-2026-10-21.png");
   assert.equal(exporter.frameFileName(frame,"2026-10-21","match-42"),name+"-2026-10-21-match-42.png");
 }
 assert.equal(exporter.frameFileName("standard","2026-10-21"),"ai-standard-2026-10-21.png");
});
test("AI ZIP entry reuses the same filename helper as PNG and standard download remains untouched",()=>{
 const main=read("main-ai-score.js"),bulk=read("main-ai-bulk-export.js"),html=read("index.html");
 assert.match(main,/archive\.add\("ai-predictions-"\+date\+"\/"\+exporter\.frameFileName\(frame,date\),png\)/);
 assert.match(main,/fileSuffix:match\.fixtureId\|\|match\.home\+"-"\+match\.away/);
 assert.match(bulk,/FRAME_DOWNLOAD_NAMES\[frame\]/);
 assert.match(bulk,/frameFileName\(frame,date,distinguishing\)/);
 assert.match(bulk,/return downloadBlob\(blob,"future-code-ai-"\+date\+"-"\+slug\(scope\)\+"-"\+part\+"-of-"\+total\+"\.png"\)/);
 assert.match(html,/main-ai-bulk-export\.js\?v=20261021-ai-frame-download-names/);
 assert.match(html,/main-ai-score\.js\?v=20261021-ai-frame-download-names/);
});
