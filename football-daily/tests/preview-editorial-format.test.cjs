"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"data","today.json"),"utf8"));
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const nativeDigits=(n)=>String(n).replace(/[0-9]/g,d=>"၀၁၂၃၄၅၆၇၈၉"[Number(d)]);
const domestic=new Set(["Premier League","Championship","League One","League One (England)","La Liga","La Liga 2","Serie A","Serie B","Bundesliga","2. Bundesliga","Ligue 1","Ligue 2"]);
const hasRank=(text,n)=>new RegExp("အဆင့်\\s*"+nativeDigits(n)+"(?![၀-၉])").test(text)||new RegExp("အဆင့်\\s*"+n+"(?![0-9])").test(text);
function assertStanding(s,label){
 assert.ok(s,label+" requires a verified standing");
 for(const key of ["played","wins","draws","losses","points","position"]){
  assert.ok(Number.isInteger(s[key]),label+" missing "+key);
  assert.ok(s[key]>=0,label+" invalid "+key);
 }
 assert.equal(s.wins+s.draws+s.losses,s.played,label+" W/D/L total differs from P");
 assert.ok(s.points<=s.wins*3+s.draws,label+" points cannot exceed performance points; verified disciplinary point deductions may apply");
 assert.ok(s.position>=1,label+" invalid table rank");
}
test("normal website articles always use one flowing Burmese paragraph, bold verdict and exactly two bold score options",()=>{
 assert.ok(Array.isArray(data.matches),"daily matches array required (empty dates are valid)");
 for(const [i,m] of data.matches.entries()){
  const desc="#"+(i+1)+" "+(m.homeDisplay||m.home)+" vs "+(m.awayDisplay||m.away);
  const t=m.dailyPreviewText;
  assert.ok(typeof t==="string"&&t.trim().length>=250,desc+": dailyPreviewText must be a substantial article");
  assert.equal(t,t.trim(),desc+": no edge whitespace");
  assert.ok(!/\n\s*\n/.test(t),desc+": one narrative paragraph only");
  assert.ok(!/^\s*(?:\d+[.)]|[-*])\s/m.test(t),desc+": no enumerated checklist");
  assert.ok(!/အချက်အလက် မရှိလို့|Source မရသေး|Data မရသေး|မအတည်ပြုရသေးတဲ့ Data|AI ပွဲကြိုသုံးသပ်ချက်ကို မထုတ်ဝေ/.test(t),desc+": no reader-facing research disclaimer");
  const emph=[...t.matchAll(/\*\*([^*\n]+)\*\*/g)].map(x=>x[1]);
  assert.equal(emph.length,2,desc+": use exactly two bold spans (verdict and scores)");
  assert.match(emph[0],/ရွေး|ပိုမြင်|နှစ်သက်|ယုံကြည်|အားသာ|အနိုင်|မရှုံး/,desc+": first bold span is the reasoned match verdict");
  assert.match(emph[1],/^\s*[0-9၀-၉]+\s*[-–:]\s*[0-9၀-၉]+\s*သို့မဟုတ်\s*[0-9၀-၉]+\s*[-–:]\s*[0-9၀-၉]+\s*$/,desc+": second bold span contains exactly two predictions");
  assert.ok(t.indexOf("**"+emph[0]+"**")<t.indexOf("**"+emph[1]+"**"),desc+": verdict must precede scores");
  assert.ok(m.homeDisplay&&m.awayDisplay,desc+": use source PDF Burmese display names");
  // UEFA first-round standings are optional until verified; never manufacture a rank.
  if(domestic.has(m.league)||(m.league==="UEFA Champions League"&&m.homeStanding&&m.awayStanding)){
   assertStanding(m.homeStanding,desc+" home");
   assertStanding(m.awayStanding,desc+" away");
   assert.ok(/^https?:\/\//.test(m.standingsSourceUrl||""),desc+": standings require a source URL");
   assert.ok(t.includes(nativeDigits(m.homeStanding.played)+" ပွဲ")&&t.includes(nativeDigits(m.awayStanding.played)+" ပွဲ"),desc+": include BOTH teams' played matches");
   for(const field of [["wins"," နိုင်"],["draws"," သရေ"],["losses"," ရှုံး"]]){
    assert.ok(t.includes(nativeDigits(m.homeStanding[field[0]])+field[1])&&t.includes(nativeDigits(m.awayStanding[field[0]])+field[1]),desc+": include both teams' "+field[0]);
   }
   assert.ok(hasRank(t,m.homeStanding.position),desc+": home table position not in prose");
   assert.ok(hasRank(t,m.awayStanding.position),desc+": away table position not in prose");
   assert.ok(t.includes(nativeDigits(m.homeStanding.points))&&t.includes(nativeDigits(m.awayStanding.points)),desc+": include both clubs' points");
  }
 }
});
test("HTML match cards use Myanmar team names and never render disconnected legacy multi-paragraph verdicts",()=>{
 assert.ok(app.includes('document.createTextNode(teamLabel(match,"home"))'));
 assert.ok(app.includes('document.createTextNode(teamLabel(match,"away"))'));
 assert.ok(app.includes('const original=textOrEmpty(match.dailyPreviewText);'));
 assert.ok(!app.includes("splitAnalysis(match)"));
 assert.ok(!app.includes("if(!original&&(match.verdict ||"));
 assert.ok(app.includes('const NO_PREVIEW_TEXT="ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ";'));
});
