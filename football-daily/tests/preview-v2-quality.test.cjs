"use strict";
const test=require("node:test"), assert=require("node:assert/strict"), fs=require("node:fs"), path=require("node:path");
const root=path.resolve(__dirname,".."), data=JSON.parse(fs.readFileSync(path.join(root,"data","today.json"),"utf8"));
const active=(data.reportDate||"")>="2026-10-17";
const digits=n=>String(n).replace(/[0-9]/g,x=>"၀၁၂၃၄၅၆၇၈၉"[+x]);
const validUrl=s=>/^https:\/\/[^/\s]+\.[^/\s]+(?:\/[^\s]*)?$/.test(s||"");
const banned=["နောက်ဆုံးစစ်ဆေးရလဒ်အရ","အိမ်ရှင်ရဲ့ အိမ်ကွင်းအားသာချက်နဲ့ ဧည့်သည်ရဲ့ နောက်ဆုံးအခြေအနေကို နှိုင်းယှဉ်ကြည့်ရာမှာ","ကွင်းလယ်ထိန်းချုပ်မှုနဲ့ တိုက်စစ်အဆုံးသတ်စွမ်းရည်က အဆုံးအဖြတ်ဖြစ်နိုင်ပါတယ်","လက်ရှိနှစ်သင်းရဲ့ ရမှတ်၊ ဂိုးကွာခြားချက်နဲ့ ခြေစွမ်းကို အခြေခံပြီး"];
function playerEvidence(p,t,label){
 assert.ok(p&&typeof p==="object",label+": missing verified player evidence");
 assert.ok(typeof p.name==="string"&&p.name.trim().length>3,label+": missing player name");
 assert.ok(t.includes(p.name),label+": verified player must appear in the published article");
 assert.ok(validUrl(p.sourceUrl),label+": specific source URL required");
 assert.ok(/^2026-\d\d-\d\d$/.test(p.verifiedDate||"")&&p.verifiedDate<=data.reportDate,label+": valid contemporary checked date required");
 assert.ok(typeof p.evidence==="string"&&p.evidence.length>=20,label+": write a concrete player contribution, not only a name");
}
function similarTemplate(a,b){
 a=a.replace(/\*\*/g,"").replace(/\s+/g," ");b=b.replace(/\*\*/g,"").replace(/\s+/g," ");
 for(let i=0;i+120<=a.length;i+=20){
  const fragment=a.slice(i,i+120);
  if(/တိုက်စစ်|ခံစစ်|ကစား|ခြေစွမ်း|ပွဲမှာ/.test(fragment)&&b.includes(fragment))return fragment;
 }
 return null;
}
test("V2 requires 32 complete evidence-led distinct previews before release",()=>{
 if(!active)return;
 const previews=[];
 assert.ok(data.matches.length>0,"nonempty dated report");
 for(const [i,m] of data.matches.entries()){
  const label="#"+(i+1)+" "+m.homeDisplay+" vs "+m.awayDisplay,t=m.dailyPreviewText||"",v=m.previewV2;
  assert.ok(v&&v.version==="2"&&v.status==="verified",label+": V2 source-reviewed status required");
  assert.ok(validUrl(v.fixtureSourceUrl)&&validUrl(v.standingsSourceUrl),label+": specific source links required");
  assert.ok(/^2026-\d\d-\d\d/.test(v.reviewedAt||""),label+": review timestamp required");
  assert.ok(t.length>=540&&t===t.trim()&&!t.includes("\n"),label+": one comprehensive journal paragraph (min 540 chars)");
  assert.ok(t.includes(m.homeDisplay)&&t.includes(m.awayDisplay),label+": include both Burmese names");
  for(const p of banned)assert.ok(!t.includes(p),label+": repeated formula is prohibited: "+p);
  assert.ok(!/PDF|Source မရသေး|Data မရသေး|မအတည်ပြု|ခန့်မှန်းဂိုးရလဒ်|သေချာပေါက်နိုင်/.test(t),label+": research disclaimer/unsourced promises forbidden");
  const bold=[...t.matchAll(/\*\*([^*\n]+)\*\*/g)].map(x=>x[1]);
  assert.ok(bold.length>=3,label+": bold named figures and a final selection");
  assert.ok(/ရွေးချယ်ပါတယ်။\*\*$/.test(t),label+": last sentence must be a bold football selection");
  assert.ok(bold.at(-1).length>=20,label+": final selection must include a match-specific reason");
  assert.ok(/တိုက်စစ်|သွင်းဂိုး/.test(t)&&/ခံစစ်|ပေးဂိုး/.test(t),label+": attack and defense must be discussed");
  for(const [team,side] of [[m.homeStanding,"home"],[m.awayStanding,"away"]]){
   if(!team)continue;
   for(const f of ["points","position"])assert.ok(t.includes(digits(team[f])),label+": "+side+" missing "+f);
   assert.ok(t.includes(digits(team.played)+" ပွဲ"),label+": "+side+" matches played missing");
  }
  playerEvidence(v.homeKeyPlayer,t,label+" home");
  playerEvidence(v.awayKeyPlayer,t,label+" away");
  assert.ok(v.homeRecentResultVerified===true&&v.awayRecentResultVerified===true,label+": manual record of checked recent completed results required");
  previews.push(t);
 }
 for(let i=0;i<previews.length;i++)for(let j=i+1;j<previews.length;j++){
  assert.ok(!similarTemplate(previews[i],previews[j]),"copy-and-replace 120-character formula found in match "+(i+1)+" and "+(j+1));
 }
});
