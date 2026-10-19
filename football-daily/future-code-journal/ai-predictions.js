"use strict";
(function(){
  const section=document.getElementById("fcj-ai");
  if(!section)return;
  const model=window.FutureCodeAiScoreModel;
  const cards=document.getElementById("fcjAiCards"),filter=document.getElementById("fcjAiLeague"),
    date=document.getElementById("fcjAiDate"),status=document.getElementById("fcjAiStatus");
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);return el;};
  const text=(m,side)=>m[side+"Display"]||m[side]||"";
  let current=[],reportDate="";
  function render(){
    cards.replaceChildren();
    const matchList=current.filter(m=>filter.value==="all"||m.league===filter.value);
    let ready=0;
    for(const m of matchList){
      const card=make("article","fcj-ai-card");
      card.append(make("div","fcj-ai-league",m.league||"Football"));
      const teams=make("div","fcj-ai-teams");
      for(const side of ["home","away"]){
        const group=make("div","fcj-ai-team");
        const crest=m[side+"CrestUrl"];
        if(typeof crest==="string"&&/^https:\/\//.test(crest)){
          const img=make("img");img.src=crest;img.alt=text(m,side)+" လိုဂို";img.loading="lazy";
          img.onerror=()=>img.remove();group.append(img);
        }
        group.append(make("span","",text(m,side)));teams.append(group);
        if(side==="home")teams.append(make("b","fcj-ai-vs","VS"));
      }
      card.append(teams);
      if(model&&typeof model.predict==="function"){
        const scores=model.predict(m);
        const row=make("div","fcj-ai-scores");
        scores.forEach((score,index)=>row.append(make("span",index===0?"fcj-ai-score lead":"fcj-ai-score",score)));
        card.append(make("div","fcj-ai-key","ဖြစ်နိုင်ခြေမြင့်သော ဂိုးရလဒ် ၃ မျိုး"));
        card.append(row);ready++;
      }else{
        card.append(make("p","fcj-ai-unavailable","အတည်ပြုနိုင်သော စာရင်းအချက်အလက် မလုံလောက်သေးပါ။"));
      }
      const button=make("button","gz-ai-download","⬇ AI ခန့်မှန်းချက် PNG Download");
      button.type="button";
      button.addEventListener("click",async()=>{
        if(button.disabled)return;
        button.disabled=true;
        const before=button.textContent;
        button.textContent="PNG ပြင်ဆင်နေသည်…";
        try{
          if(!window.GoalZoneDownloads?.downloadAI)throw Error("AI PNG exporter missing");
          await window.GoalZoneDownloads.downloadAI(m,reportDate);
          button.textContent="✓ PNG Download စတင်ပြီး";
        }catch(err){
          console.error("Goal Zone AI PNG",err);
          button.textContent="Download မအောင်မြင်ပါ — ပြန်စမ်းပါ";
        }finally{
          setTimeout(()=>{button.disabled=false;button.textContent=before;},2000);
        }
      });
      card.append(button);
      cards.append(card);
    }
    status.textContent="ပြသထားသော ပွဲ "+matchList.length+" ပွဲ • မော်ဒယ်တွက်ချက်နိုင်သော ပွဲ "+ready+" ပွဲ";
  }
  fetch(new URL("../data/today.json",document.baseURI),{cache:"no-store"})
    .then(r=>{if(!r.ok)throw Error("Data unavailable");return r.json();})
    .then(data=>{
      if(data.published!==true||!Array.isArray(data.matches))throw Error("Unpublished or invalid data");
      reportDate=data.reportDate||"";
      date.textContent=reportDate+" · မြန်မာစံတော်ချိန်";
      current=data.matches.filter(m=>m.status!=="finished"&&m.home&&m.away);
      const names=[...new Set(current.map(m=>m.league).filter(Boolean))].sort();
      for(const name of names){const opt=document.createElement("option");opt.value=name;opt.textContent=name;filter.append(opt)}
      filter.addEventListener("change",render);render();
    }).catch(()=>{status.textContent="အတည်ပြုထားသော AI ခန့်မှန်းချက်ဒေတာ မရရှိသေးပါ။"});
})();