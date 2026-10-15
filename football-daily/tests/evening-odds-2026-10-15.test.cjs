"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const morning=read("data/odds/2026-10-15.json");
const evening=read("data/odds/evening/2026-10-15.json");
const newQuotes=[
["2+85","3-40"],["1+10","3-60"],["-10","3+90"],["-35","3+5"],["-80","3+10"],["1-80","3+15"],
["2+95","3-50"],["-5","3+30"],["2-10","4+90"],["2+40","3-90"],["-55","2-40"],["-90","3+70"],
["1-50","3+5"],["-95","3+70"],["-80","3+50"],["-30","3+70"],["2+20","3-55"],["-85","3-20"],
["-25","2-15"],["1-25","3+25"],["1=","3+60"],["1+30","3-20"],["1+40","3+90"],["1-25","3+45"],
["-30","3+45"],["1-90","3+30"],["2+10","3-10"],["-90","2-70"],["1-90","3-20"],["2-40","3-90"],
["4+80","4-70"],["-25","2-60"],["-35","3-20"],["2+25","3-25"],["2+45","3-45"],["2-5","4+45"]
];
test("15 Oct 36 evening PDF quotes map one-to-one to the original Myanmar odds fixture list",()=>{
 assert.equal(evening.reportDate,"2026-10-15");
 assert.equal(evening.title,"ညနေခင်းကြေးပြောင်း");
 assert.equal(evening.matches.length,36);assert.equal(morning.matches.length,36);assert.equal(newQuotes.length,36);
 for(const [i,item]of evening.matches.entries()){
  const m=morning.matches[i],key="PDF row "+(i+1)+" "+m.home+" v "+m.away;
  assert.equal(item.row,i+1,key);
  assert.equal(item.league,m.league,key);
  for(const field of ["home","away","upperTeam","kickoffDisplay","homeCrestUrl","awayCrestUrl"]){assert.equal(item[field],m[field],key+" "+field);}
  assert.equal(item.morningBodyOdds,m.bodyOdds,key);
  assert.equal(item.morningGoalTotalOdds,m.goalTotalOdds,key);
  assert.deepEqual([item.eveningBodyOdds,item.eveningGoalTotalOdds],newQuotes[i],key+" original uploaded PDF current quotes");
  for(const f of ["morningBodyOdds","eveningBodyOdds","morningGoalTotalOdds","eveningGoalTotalOdds"]){
   assert.match(item[f],/^(?:-\d+|\d+[+-]\d+|\d+=)$/,key+" "+f);
  }
 }
 for(const league of ["UEFA Europa League","UEFA Conference League"]){
  assert.equal(evening.matches.filter(m=>m.league===league).length,18);
 }
 assert.equal(evening.matches[20].eveningBodyOdds,"1=","Preserve equal (=) market quote, not guessed decimal");
 assert.equal(evening.matches[35].morningBodyOdds,"2=");
 assert.equal(evening.matches[6].eveningBodyOdds,"2+95","Preserve line shift exactly as supplied");
});
test("real directly downloadable 15 Oct branded PNGs exist for all and per league",()=>{
 const brands=["future-code","ykz-family","bw-sport","ko-thet-family"];
 const slugs=["all","uefa-europa-league","uefa-conference-league"];
 let count=0;
 for(const brand of brands)for(const slug of slugs){
  const file=path.join(root,"data/odds/evening/png/2026-10-15",brand+"-"+slug+".png");
  assert.ok(fs.existsSync(file),file);
  const bytes=fs.readFileSync(file);
  assert.ok(bytes.length>10000,file);
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a",file);
  count++;
 }
 assert.equal(count,12);
});
test("15 Oct evening odds are published on all four sites through the shared module",()=>{
 const code=fs.readFileSync(path.join(root,"evening-odds.js"),"utf8");
 const pngCode=fs.readFileSync(path.join(root,"scripts/generate_evening_png.py"),"utf8");
 for(const l of ["ယူရိုပါလိဂ်","ယူရိုပါကွန်ဖရန့်လိဂ်"])assert.ok(code.includes(l)&&pngCode.includes(l));
 assert.match(code,/data\/odds\/evening\//);
 assert.ok(code.includes("data/odds/evening/png/"));
 for(const site of ["odds.html","ykz-family/odds.html","bw-sport/odds.html","ko-thet-family/odds.html"]){
  const html=fs.readFileSync(path.join(root,site),"utf8");
  assert.ok(html.includes("odds.js"),site);
 }
});
