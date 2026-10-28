"use strict";
(function(){
const s=()=>window.FCStudio;
const $=id=>document.getElementById(id),slug=x=>String(x||"frame").toLowerCase().normalize("NFKD").replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"frame";
const blobCanvas=canvas=>new Promise((ok,bad)=>canvas.toBlob(b=>b&&b.size?ok(b):bad(Error("PNG Blob မထွက်ပါ")),"image/png"));
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
const splitRows=(rows,mode)=>mode==="two"&&rows.length>1?[rows.slice(0,Math.ceil(rows.length/2)),rows.slice(Math.ceil(rows.length/2))]:[rows];
async function* forSection(k,f,rows,mode){
 const W=s().getHome(),p=W.FutureCodeProfessionalFrames,color=f.color||"#16486c";
 if(k==="previews"||k==="specials"){
  const theme={bg:"#071a2b",head:color,panel:"#102c3d",alt:color,accent:"#f5c86e"};
  for(const m of rows){
   const src=await W.FutureCodeFramePreview.render(m,theme,{special:k==="specials"});
   const output=await p.wrap(src,k,"pro:"+f.id);
   yield {name:(m.fixtureId||slug(m.home+"-"+m.away))+".png",blob:await blobCanvas(output)};
  }
 }else if(k==="odds"){
  const O=s().getOdds(),sheet=s().getOddsData();
  if(!sheet?.reportDate||!O.FutureCodeTableOddsFrames?.draw)throw Error("ပေါက်ကြေး Data / PNG Engine မရရှိပါ။");
  const parts=splitRows(rows,mode);
  for(let i=0;i<parts.length;i++){
   const options={design:["colour","Colour",color],colour:color,date:sheet.reportDate,professionalFrame:"pro:"+f.id};
   const src=await O.FutureCodeTableOddsFrames.draw(parts[i],options,i+1,parts.length);
   yield {name:"odds-"+String(i+1).padStart(2,"0")+".png",blob:await blobCanvas(src)};
  }
 }else if(k==="results"){
  const R=W.FutureCodeResultsFrames,archive=s().getArchive(),parts=splitRows(rows,mode);
  if(!R?.makePng)throw Error("Result PNG Engine မရှိပါ");
  for(let i=0;i<parts.length;i++){
   const native=await R.makePng(parts[i],{id:"plain",title:"Plain",color:color,plain:true},archive.reportDate||s().getDate());
   const out=await p.wrap(native,k,"pro:"+f.id);
   yield {name:"results-"+String(i+1).padStart(2,"0")+".png",blob:await blobCanvas(out)};
  }
 }else if(k==="ai"){
  const api=W.FutureCodeAiBulkExport,model=W.FutureCodeAiScoreModel;
  if(!api?.renderBlob||typeof model?.predict!=="function")throw Error("AI Prediction / PNG Engine မရပါ။");
  const pages=mode==="two"?api.planPages(rows):[api.planSinglePage(rows)].filter(Boolean);
  for(let i=0;i<pages.length;i++){
   const nativeStyle=({"ai-best":"best","ai-final":"final","ai-special":"special"})[f.id];
   let b=await api.renderBlob(pages[i],{
    date:s().getDate(),part:i+1,total:pages.length,scope:"all",frame:nativeStyle||"pro:"+f.id,
    predict:model.predict,leagueLabel:l=>l,
    leagueLogo:l=>W.FutureCodeMainLogoAssets?.leagueCrest(l),
    teamName:(m,side)=>m[side+"Display"]||m[side],
    teamLogo:(m,side)=>m[side+"CrestUrl"],
    displayTime:m=>m.kickoffYangon||m.kickoff
   });
   if(nativeStyle){
    const img=await createImageBitmap(b),cv=W.document.createElement("canvas");cv.width=img.width;cv.height=img.height;
    cv.getContext("2d").drawImage(img,0,0);img.close();
    b=await blobCanvas(await p.wrap(cv,"ai","pro:"+f.id));
   }
   yield {name:"ai-"+String(i+1).padStart(2,"0")+".png",blob:b};
  }
 }else if(k==="news"){
  if(!W.FutureCodeNewsFrameExport?.render)throw Error("News Poster Module မရပါ");
  for(const story of rows){
   const poster=await W.FutureCodeNewsFrameExport.render(story,"pro:"+f.id);
   yield {name:slug(story.id)+".png",blob:poster.blob};
  }
 }
}
async function exportAll(previewOnly){
 const studio=s();if(!studio?.getState()){studio?.status("Frame Library မဖွင့်ရသေးပါ။",true);return;}
 const assignments=studio.combos();
 if(!assignments.length){studio.status("Section အတွက် Frame မသတ်မှတ်ရသေးပါ။ Library မှ အမှန်ခြစ်၍ Save လုပ်ပါ။",true);return;}
 studio.setWorking(true);
 $("downloadLink").hidden=true;$("progressBar").style.width="0";
 let outputURL=null,files=0;const warnings=[];
 try{
  await studio.loadData();
  const W=studio.getHome(),zip=new W.FutureCodeFrameZip.Archive(),mode=$("splitFilter").value;
  for(let i=0;i<assignments.length;i++){
   const {section,frame:f}=assignments[i];
   const rows=studio.filtered(section),label=studio.SECTION[section]+" · "+f.name;
   $("progressBar").style.width=Math.round((i/assignments.length)*100)+"%";
   studio.status("Frame "+(i+1)+"/"+assignments.length+" — "+label+" PNG ထုတ်နေသည်…");
   if(!rows.length){warnings.push(label+" (ပွဲ/သတင်း မရှိ)");continue;}
   try{
    for await(const result of forSection(section,f,rows,mode)){
     if(previewOnly){
      const prev=$("downPreviewImage");
      if(prev.dataset.url)URL.revokeObjectURL(prev.dataset.url);
      const url=URL.createObjectURL(result.blob);
      prev.dataset.url=url;prev.src=url;prev.hidden=false;$("previewExportPlaceholder").hidden=true;
      // The sample is also downloadable, but preview does not trigger a download.
      const a=$("downloadLink");a.hidden=false;a.href=url;a.download=slug(f.name)+"-"+result.name;a.textContent="⬇ Preview PNG Download";
      $("progressBar").style.width="100%";
      studio.status(label+" — PNG Preview ဖန်တီးပြီး။");return;
     }
     const path=section+"/"+slug(f.name)+"-"+f.id+"/"+result.name;
     await zip.add(path,result.blob);files++;
     if(files%4===0)await wait(0);
    }
   }catch(err){warnings.push(label+" — "+err.message);console.warn("Section PNG failed",section,f.id,err);}
  }
  if(!files)throw Error("PNG ထုတ်နိုင်သော Data မရှိပါ။ "+warnings.join(" | "));
  $("progressBar").style.width="100%";
  const suffix=$("downSection").value==="all"?"all-sections":$("downSection").value;
  studio.publishBlob(zip.finish(),"future-code-"+suffix+"-frames-"+studio.getDate()+".zip");
  studio.status("PNG "+files+" ပုံပါသော ZIP အဆင်သင့်ဖြစ်ပါပြီ။"+(warnings.length?" မထုတ်နိုင်သောအပိုင်းများ — "+warnings.join(" | "):""));
 }catch(err){console.error("Frame workspace export failed",err);studio.status("Export မအောင်မြင်ပါ — "+err.message,true);}
 finally{studio.setWorking(false);}
}
$("downPreview").onclick=()=>exportAll(true);
$("downZip").onclick=()=>exportAll(false);
})();