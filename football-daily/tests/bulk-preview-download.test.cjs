"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("all four football homepages have no bulk/ZIP download section",()=>{
 const app=read("app.js"),exporter=read("card-export.js");
 for(const forbidden of ["allPreviewsDownloadBtn","allPreviewsDownloadBar","bulkPreviewBar","saveAll(",".zip"]){
  assert.ok(!app.includes(forbidden),"App still exposes "+forbidden);
 }
 for(const forbidden of ["saveAll","bundleZip","composePair","application/zip",".zip"]){
  assert.ok(!exporter.includes(forbidden),"Card exporter still exposes "+forbidden);
 }
 assert.ok(app.includes('"match-download"'),"Keep per-match PNG download");
 assert.ok(exporter.includes("async function save(match,opts={})"));
 assert.ok(exporter.includes("window.FutureCodeCardExport={save}"));
 for(const page of ["index.html","ykz-family/index.html","bw-sport/index.html","ko-thet-family/index.html"]){
  const html=read(page);
  assert.ok(html.includes("card-export.js?v=20261016-png-only"),page);
  assert.ok(html.includes("app.js?v=20261016-png-only"),page);
 }
});
