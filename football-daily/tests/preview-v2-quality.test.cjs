"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"data","today.json"),"utf8"));
const master=fs.readFileSync(path.join(root,"PROFESSIONAL_MYANMAR_FOOTBALL_JOURNALIST_MASTER_PROMPT.md"),"utf8");
const validUrl=x=>typeof x==="string"&&/^https:\/\/[^/\s]+\.[^/\s]+(?:\/[^\s]*)?$/.test(x);
const forbidden=[
 "နောက်ဆုံးစစ်ဆေးရလဒ်အရ",
 "အိမ်ရှင်ရဲ့ အိမ်ကွင်းအားသာချက်နဲ့ ဧည့်သည်ရဲ့ နောက်ဆုံးအခြေအနေကို နှိုင်းယှဉ်ကြည့်ရာမှာ",
 "ကွင်းလယ်ထိန်းချုပ်မှုနဲ့ တိုက်စစ်အဆုံးသတ်စွမ်းရည်က အဆုံးအဖြတ်ဖြစ်နိုင်ပါတယ်",
 "ပြိုင်ဘက်နောက်တန်း","ပြိုင်ဘက်တိုက်စစ်",
 "အချက်အလက် မရရှိ","Data မရသေး","AI ပွဲကြိုသုံးသပ်ချက်ကို မထုတ်ဝေ"
];
const normalized=x=>x.replace(/\*\*/g,"").replace(/\s+/g," ").trim();
function repeatedLongReason(a,b){
 a=normalized(a);b=normalized(b);
 for(let i=0;i+120<=a.length;i+=20){
  const bit=a.slice(i,i+120);
  if(/တိုက်စစ်|ခံစစ်|ခြေစွမ်း|ပွဲမှာ/.test(bit)&&b.includes(bit))return bit;
 }
 return null;
}
test("Permanent author-uploaded journalist master supersedes the old numerical V2 template",()=>{
 assert.match(master,/PROFESSIONAL MYANMAR FOOTBALL JOURNALIST/);
 assert.match(master,/WEBSITE PUBLICATION RULE/);
 assert.match(master,/စာကြောင်းအဆက်အစပ်/);
 assert.match(master,/တစ်ပိုဒ်/);
});
test("Published journalist previews have natural unique one-paragraph factual football reasons",()=>{
 if(data.reportDate<"2026-10-17")return;
 assert.ok(Array.isArray(data.matches)&&data.matches.length>0);
 if(data.reportDate==="2026-10-17")assert.equal(data.matches.length,32);
 const articles=[];
 for(const [i,m] of data.matches.entries()){
  const name="#"+(i+1)+" "+m.home+" vs "+m.away,t=m.dailyPreviewText||"",v=m.previewJournalist;
  assert.ok(v&&v.status==="owner_approved_published",name+": owner journal review marker required");
  assert.ok(validUrl(v.sourceUrl),name+": contemporary match research URL required");
  assert.equal(v.masterPrompt,"PROFESSIONAL_MYANMAR_FOOTBALL_JOURNALIST_MASTER_PROMPT.md");
  assert.equal(v.reportDate,data.reportDate,name+": source and article date must match");
  assert.ok(t.length>=300&&t.length<=2400,name+": reasoned but not bloated narrative");
  assert.equal(t,t.trim(),name+": whitespace around paragraph");
  assert.ok(!t.includes("\n"),name+": only one flowing paragraph");
  assert.ok(t.includes(m.homeDisplay)&&t.includes(m.awayDisplay),name+": source-approved Burmese names for both sides");
  assert.ok(!/^(\s*(\d+[.)]|[-*]))\s/m.test(t),name+": no listicle style");
  assert.ok(!/https?:\/\/|www\.|source:|\.pdf|\bPDF\b|1X2|ဘော်ဒီကြေး|အင်တာနက်ခန့်မှန်းချက်/.test(t),name+": remove URLs, source and betting prices from prose");
  assert.ok(!/ခန့်မှန်း(?:ဂိုး|ရလဒ်)|သေချာပေါက်နိုင်/.test(t),name+": no score predictions or certainty promise");
  for(const expression of forbidden)assert.ok(!t.includes(expression),name+": repeated generic wording "+expression);
  const bold=[...t.matchAll(/\*\*([^*\n]+)\*\*/g)].map(x=>x[1]);
  assert.ok(bold.length>=2,name+": clear highlighted actors and final recommendation");
  assert.ok(t.endsWith("။**"),name+": bold natural closing selection");
  assert.match(bold.at(-1),/ရွေးချယ်|ယုံကြည်|အလေးပေး|အသာစီး|အနိုင်/,name+": final sentence selects a team with reasoning");
  assert.ok(bold.at(-1).length>=30,name+": final reasoning must be match-specific");
  assert.ok(/တိုက်စစ်|ဂိုးသွင်း|ဂိုးပေါက်/.test(t),name+": discuss actual attacking force");
  assert.ok(/ခံစစ်|နောက်တန်း|ပေးဂိုး/.test(t),name+": discuss defensive implications");
  for(const [side,s] of [["home",m.homeStanding],["away",m.awayStanding]]){
   if(s&&["played","wins","draws","losses"].every(k=>Number.isInteger(s[k])))
    assert.equal(s.played,s.wins+s.draws+s.losses,name+": checked "+side+" season record mismatch");
  }
  articles.push(t);
 }
 for(let i=0;i<articles.length;i++)for(let j=i+1;j<articles.length;j++){
  assert.ok(!repeatedLongReason(articles[i],articles[j]),"generic duplicate 120-char formula across "+(i+1)+"/"+(j+1));
 }
});
