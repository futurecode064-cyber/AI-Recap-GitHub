"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=function assetReference(html,page,asset){
 const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]);
 const matches=refs.filter(ref=>ref.split("?")[0].split("/").at(-1)===asset);
 assert.equal(matches.length,1,page+": exactly one "+asset);
 const ref=matches[0];
 assert.match(ref,/\?v=[^\s"&]+/,page+": versioned "+asset);
 assert.ok(fs.existsSync(path.resolve(__dirname,"..",path.dirname(page),ref.split("?")[0])),page+": existing "+asset);
 return ref;
};
