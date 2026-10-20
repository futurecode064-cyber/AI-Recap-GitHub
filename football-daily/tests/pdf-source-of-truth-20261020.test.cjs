"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.resolve(__dirname,"..");
const odds=JSON.parse(fs.readFileSync(path.join(base,"data/odds/2026-10-20.json"),"utf8"));
const daily=JSON.parse(fs.readFileSync(path.join(base,"data/today.json"),"utf8"));
const exact=[
["ဖီနာဘာချီ","စလားဗီးယား","ဖီနာဘာချီ","1+10","3-5","2-1"],
["ဆားဘတ်","ဒေါ့မွန်","ဒေါ့မွန်","2+70","3-80","0-3"],
["ရိုးမား","စလိုဗန်","ရိုးမား","2-80","4+35","3-1"],
["လီဗာပူးလ်","ဗီလာရီးရဲလ်","လီဗာပူးလ်","1-15","3-50","2-1"],
["မန်စီးတီး","အေအီးကေ","မန်စီးတီး","3+90","4+40","4-1"],
["နာပိုလီ","ဘိုဒိုဂလင့်","နာပိုလီ","1+10","3-50","2-1"],
["ပီအက်စ်ဂျီ","ဘာစီလိုနာ","ပီအက်စ်ဂျီ","-5","4-55","3-2"],
["ပေါ်တို","ပီအက်စ်ဗွီ","ပေါ်တို","1-10","3-45","3-0"],
["စတုဂတ်","အေတီကို","အေတီကို","-70","3-50","2-2"],
["ဝုဗ်","ပိုစ့်မောက်","ဝုဗ်","1+20","3+60","2-1"],
["ဝင်ဘလက်ဒန်","မန်ဖီးလ်","မန်ဖီးလ်","-65","3+75","1-2"],
["ဘလက်ဘန်း","မီတန်","ဘလက်ဘန်း","-20","3+15","2-1"],
["ဘရွန်းလေ","လက်စတာ","လက်စတာ","1+45","3-15","1-2"],
["ဘာတန်","ဘရတ်ဖိုဒ့်","ဘရတ်ဖိုဒ့်","-90","2-90","1-2"],
["ကမ်းဘရိုက်","ဝိုင်ကမ်ဘီ","ကမ်းဘရိုက်","-45","3+40","2-1"],
["ဒွန်ကတ်စတာ","စတော့ပေါ့","စတော့ပေါ့","1+85","3+40","1-2"],
["ဟက်ဒါဖီးလ်","ပီတာဘရောက်","ဟက်ဒါဖီးလ်","1-10","3-55","2-2"],
["လေတန်တောင်း","ဘန်စလေ","လူတန်တောင်း","1-20","3-75","3-1"],
["နော့ကောင်တီ","ရှက်ဖီးဝက်စ်","ရှက်ဖီးဝက်စ်","-60","3+70","1-2"],
["အောက်ဖိုဒ့်","ဝီဂန်","အောက်ဖိုဒ့်","1+95","3+80","2-1"],
["စတီဗန်နော့","ပလိုင်းမောက်","ပလိုင်းမောက်","-10","3+90","1-2"]
];
test("20.pdf literal Unicode team labels and price signs remain immutable and aligned across site modules",()=>{
 assert.equal(odds.reportDate,"2026-10-20");assert.equal(daily.reportDate,"2026-10-20");
 assert.equal(odds.matches.length,21);assert.equal(daily.matches.length,21);
 for(let i=0;i<exact.length;i++){
  const [home,away,upper,body,goals,pred]=exact[i],o=odds.matches[i],m=daily.matches[i];
  assert.deepEqual([o.home,o.away,o.upperTeam,o.bodyOdds,o.goalTotalOdds,o.pdfLastColumn],
   [home,away,upper,body,goals,pred],"Odds row "+(i+1)+" differs from original PDF");
  assert.deepEqual([m.homeDisplay,m.awayDisplay,m.myanmarOdds.upperTeam,m.myanmarOdds.bodyOdds,m.myanmarOdds.goalTotalOdds],
   [home,away,upper,body,goals],"Preview row "+(i+1)+" differs from original PDF");
  assert.equal(o.pdfRow,i+1);assert.equal(m.pdfRow,i+1);
 }
 assert.equal(daily.matches[3].home,"Liverpool");
 assert.equal(daily.matches[4].home,"Manchester City");
 assert.equal(daily.matches[5].home,"Napoli");
 assert.equal(daily.matches[7].home,"Porto");
 assert.equal(daily.matches[3].specialChoice,true);
 assert.equal(odds.matches[11].eligibleForPreview,false,"PDF mismatch row 12 cannot receive fabricated preview");
});
