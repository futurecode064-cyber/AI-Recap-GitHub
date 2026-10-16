"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const txt=p=>fs.readFileSync(path.join(root,p),"utf8");
const day=JSON.parse(txt("data/archive/2026-10-15.json"));
const ledger=JSON.parse(txt("data/odds/2026-10-15.json"));
const europa=txt("data/editorial/2026-10-15-europa-user-verbatim.md");
const conference=txt("data/editorial/2026-10-15-conference-user-verbatim.md");
const digits=Object.fromEntries(Array.from("၀၁၂၃၄၅၆၇၈၉",(d,i)=>[d,String(i)]));
const sections=s=>s.replace(/^\uFEFF/,"").split(/(?=^### [၀-၉]+။ )/m).filter(x=>x.trim());
const sourceParts=s=>sections(s).map(part=>{
 const lines=part.split(/\r?\n/),h=lines[0].match(/^### ([၀-၉]+)။ (.*?) နှင့် (.+)$/u);
 assert.ok(h,"Expected original markdown heading "+lines[0]);
 return {num:Number([...h[1]].map(d=>digits[d]).join("")),heading:h[2]+" နှင့် "+h[3],text:lines.slice(1).join("\n").trim()};
});
const pairs=[
 [19,"Lugano","Crvena Zvezda","လူဂါနို နှင့် ရက်စတားဘဲလ်ဂရိတ်"],
 [20,"Hajduk Split","Ajax","ဟာဒက်စပလစ် နှင့် အေဂျက်စ်"],
 [21,"Gent","Aarhus","ဂန့် နှင့် အာဟုစ်"],
 [22,"Egnatia","Midtjylland","အက်ဂနာတီယာ နှင့် မစ်ဂျီလန်း"],
 [23,"KuPS Kuopio","Trabzonspor","ကူပီအက်စ် နှင့် ထရပ်ဇွန်စပေါ"],
 [24,"Mjällby","Inter Escaldes","မြဲလ်ဘီ နှင့် အင်တာအက်စ်ကယ်ဒက်စ်"],
 [25,"Panathinaikos","Borac Banja Luka","ပန်နာသီနာအီကော့စ် နှင့် ဘိုရက်စ်"],
 [26,"CSKA Sofia","Monaco","စီအက်စ်ကေအေဆိုဖီယာ နှင့် မိုနာကို"],
 [27,"Riga","Kairat Almaty","ရီဂါ နှင့် ကိုင်းရတ်အယ်လ်မာတီ"],
 [28,"Universitatea Craiova","Getafe","ယူနီဗာစီတာတီယာကရာယိုဗာ နှင့် ဂီတာဖေး"],
 [29,"Atalanta","Pafos","အတ္တလန်တာ နှင့် ပါဖော့စ်"],
 [30,"Brighton","Kauno Žalgiris","ဘရိုက်တန် နှင့် ကောင်းနပ်စ်ဇာလ်ဂီရစ်စ်"],
 [31,"Copenhagen","Braga","ကိုပင်ဟေဂင် နှင့် ဘရာဂါ"],
 [32,"Twente","Thun","တွမ်တီ နှင့် သွန်း"],
 [33,"Hearts","Nordsjælland","ဟတ်စ် နှင့် နော်ဒ်ရှယ်လန်း"],
 [34,"Sint-Truidense","Iberia Tbilisi","စင့်ထရွိုင်ဒန် နှင့် အီဘေးရီးယားတဘီလီစီ"],
 [35,"Freiburg","Jablonec","ဖရိုင်းဘတ် နှင့် ယာဘလိုနက်"],
 [36,"Brann","Lincoln Red Imps","ဘရန် နှင့် လင်ကွန်းရက်ဒ်အင်ပ်စ်"]
];
test("all eighteen Europa League previews remain exact unedited owner submissions",()=>{
 assert.equal(day.reportDate,"2026-10-15");assert.equal(day.matches.length,36);
 const parts=sourceParts(europa);assert.equal(parts.length,18);
 for(const [i,s] of parts.entries()){
  const m=day.matches[i];
  assert.equal(s.num,i+1);assert.equal(s.heading,m.homeDisplay+" နှင့် "+m.awayDisplay);
  assert.equal(m.league,"UEFA Europa League");
  assert.equal(m.dailyPreviewText,s.text,"Europa text must not be changed at row "+(i+1));
  assert.equal((s.text.match(/\*\*/g)||[]).length,2);
 }
});
test("all eighteen Conference previews match ORIGINAL user paragraphs without any edits, in correct fixture slots",()=>{
 const parts=sourceParts(conference);
 assert.equal(parts.length,19,"Submission contains 18 Conference games plus unrelated League One no.37");
 assert.equal(parts[18].num,37);
 assert.match(parts[18].heading,/မန်စ်ဖီးလ်တောင်း နှင့် အောက်စ်ဖို့ဒ်ယူနိုက်တက်/);
 const seen=new Set();
 for(const [i,tuple] of pairs.entries()){
  const [num,home,away,expectedHeading]=tuple;
  const src=parts[i];
  assert.equal(src.num,num,"Source section identity");
  assert.equal(src.heading,expectedHeading,"Do not confuse PDF spellings with user-uploaded original labels");
  const pos=day.matches.findIndex(m=>m.home===home&&m.away===away&&m.league==="UEFA Conference League");
  assert.ok(pos>=18,"Conference match not found: "+home+" v "+away);
  assert.ok(!seen.has(pos),"User source accidentally mapped to two fixtures");
  seen.add(pos);
  const match=day.matches[pos];
  assert.equal(match.dailyPreviewText,src.text,"User-original Conference article must stay exact for no."+num);
  assert.equal(src.text.includes("\n"),false);
  assert.equal((src.text.match(/\*\*/g)||[]).length,4,"Owner submitted bold verdict and bold score forecast");
  assert.match(src.text,/ခန့်မှန်းရလဒ်ကတော့ \*\*[^*]+\*\* ဖြစ်ပါတယ်။$/u);
 }
 assert.equal(seen.size,18);
 assert.ok(!day.matches.some(m=>m.home==="Mansfield Town"||m.away==="Oxford United"),"League One paragraph no.37 not a Conference match");
});
test("Other website fixtures, five independently composed Special Choices, original odds and archived final results preserved",()=>{
 const specials=day.matches.filter(m=>m.specialChoice);
 assert.equal(specials.length,5);
 for(const m of specials){assert.equal(m.specialAnalysisParagraphs.length,4);assert.match(m.specialAnalysisParagraphs.at(-1),/\*\*[^*]+ကို ရွေးချယ်ပါတယ်။\*\*$/u);}
 for(const m of day.matches){assert.equal(m.homeLastFive?.length,5);assert.equal(m.awayLastFive?.length,5);assert.ok(m.homeCrestUrl&&m.awayCrestUrl);assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(v=>Number(v)>1));}
 assert.equal(ledger.matches.length,36);
 assert.ok(ledger.matches.every(m=>/^\d+-\d+$/.test(m.pdfLastColumn)));
 const archive=JSON.parse(txt("data/archive/2026-10-14.json"));
 assert.equal(archive.matches.filter(m=>m.finalScoreIsVerified===true).length,13);
});
