"use strict";
(function(){
const s=()=>window.FCStudio;
const $=id=>document.getElementById(id),slug=x=>String(x||"frame").toLowerCase().normalize("NFKD").replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"frame";
const blobCanvas=canvas=>new Promise((ok,bad)=>canvas.toBlob(b=>b&&b.size?ok(b):bad(Error("PNG Blob မထွက်ပါ")),"image/png"));
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
const splitRows=(rows,mode)=>{
 if(mode==="pair")return Array.from({length:Math.ceil(rows.length/2)},(_,i)=>rows.slice(i*2,i*2+2));
 if(mode==="league"){const grouped=new Map();for(const row of rows){const key=row.league||"Other";if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}return [...grouped.values()];}
 if(mode==="two"&&rows.length>1){const n=Math.ceil(rows.length/2);return [rows.slice(0,n),rows.slice(n)];}
 return [rows];
};
async function stackCanvases(list){
 if(list.length===1)return list[0];
 const W=s().getHome(),width=Math.max(...list.map(c=>c.width)),height=list.reduce((n,c)=>n+c.height,0)+12*(list.length-1);
 if(height>32767||height*width>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်။ တစ်ပွဲတစ်ပုံ ပြောင်းပါ");
 const out=W.document.createElement("canvas");out.width=width;out.height=height;const ctx=out.getContext("2d");ctx.fillStyle="#f0f4f8";ctx.fillRect(0,0,width,height);
 let y=0;for(const c of list){ctx.drawImage(c,Math.floor((width-c.width)/2),y);y+=c.height+12;}return out;
}
async function stackBlobs(blobs){
 if(blobs.length===1)return blobs[0];
 const imgs=await Promise.all(blobs.map(b=>createImageBitmap(b)));
 try{
  const W=s().getHome(),width=Math.max(...imgs.map(c=>c.width)),height=imgs.reduce((n,c)=>n+c.height,0)+12*(imgs.length-1);
  if(height>32767||height*width>108000000)throw Error("News PNG အမြင့်များလွန်းပါသည်။");
  const out=W.document.createElement("canvas");out.width=width;out.height=height;const ctx=out.getContext("2d");ctx.fillStyle="#f8f8f8";ctx.fillRect(0,0,width,height);
  let y=0;for(const c of imgs){ctx.drawImage(c,(width-c.width)/2,y);y+=c.height+12;}return blobCanvas(out);
 }finally{for(const img of imgs)img.close();}
}
async function* forSection(k,f,rows,mode){
 const W=s().getHome(),p=W.FutureCodeProfessionalFrames,color=f.color||"#16486c";
 if(k==="previews"||k==="specials"){
  const theme={bg:"#071a2b",head:color,panel:"#102c3d",alt:color,accent:"#f5c86e"};
  const chunks=mode==="two"?Array.from({length:Math.ceil(rows.length/2)},(_,i)=>rows.slice(i*2,i*2+2)):rows.map(m=>[m]);
  for(let i=0;i<chunks.length;i++){
   const canvases=[];
   for(const m of chunks[i]){
    const src=await W.FutureCodeFramePreview.render(m,theme,{special:k==="specials"});
    canvases.push(await p.wrap(src,k,"pro:"+f.id));
   }
   const out=await stackCanvases(canvases),name=mode==="two"?"pair-"+String(i+1).padStart(2,"0"):chunks[i][0].fixtureId||slug(chunks[i][0].home+"-"+chunks[i][0].away);
   yield {name:name+".png",blob:await blobCanvas(out)};
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
   const dark="#"+color.slice(1).match(/../g).map(h=>Math.round(parseInt(h,16)*.30).toString(16).padStart(2,"0")).join("");
   const native=await R.makePng(parts[i],{id:"plain",title:"Plain",color,dark,plain:true,scoreInk:"#ffffff"},archive.reportDate||s().getDate());
   const out=await p.wrap(native,k,"pro:"+f.id);
   yield {name:"results-"+String(i+1).padStart(2,"0")+".png",blob:await blobCanvas(out)};
  }
 }else if(k==="ai"){
  const api=W.FutureCodeAiBulkExport,model=W.FutureCodeAiScoreModel;
  if(!api?.renderBlob||typeof model?.predict!=="function")throw Error("AI Prediction / PNG Engine မရပါ။");
  const pages=splitRows(rows,mode).map(chunk=>api.planSinglePage(chunk)).filter(Boolean);
  for(let i=0;i<pages.length;i++){
   const nativeStyle=({"ai-best":"best","ai-final":"final","ai-special":"special"})[f.id];
   let b=await api.renderBlob(pages[i],{
    date:s().getDate(),part:i+1,total:pages.length,scope:"all",frame:nativeStyle||"pro:"+f.id,
    predict:W.FutureCodeTipScores?.predict||model.predict,leagueLabel:l=>l,
    leagueLogo:l=>W.FutureCodeMainLogoAssets?.leagueCrest(l),
    teamName:(m,side)=>m[side+"Display"]||m[side],
    teamLogo:(m,side)=>m[side+"CrestUrl"],
    displayTime:m=>m.sourceKickoff||m.kickoff||m.kickoffYangon
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
  const chunks=mode==="two"?Array.from({length:Math.ceil(rows.length/2)},(_,i)=>rows.slice(i*2,i*2+2)):rows.map(m=>[m]);
  for(let i=0;i<chunks.length;i++){
   const posters=[];
   for(const story of chunks[i])posters.push((await W.FutureCodeNewsFrameExport.render(story,"pro:"+f.id)).blob);
   const filename=mode==="two"?"news-pair-"+String(i+1).padStart(2,"0"):slug(chunks[i][0].id);
   yield {name:filename+".png",blob:await stackBlobs(posters)};
  }
 }
}
async function exportAll(previewOnly){
 const studio=s();if(!studio?.getState()){studio?.status("Frame Library မဖွင့်ရသေးပါ။",true);return;}
 const assignments=studio.combos();
 if(!assignments.length){studio.status("Section အတွက် Frame မသတ်မှတ်ရသေးပါ။ Library မှ အမှန်ခြစ်၍ Save လုပ်ပါ။",true);return;}
 studio.setWorking(true);
 studio.clearExportPreview();$("progressBar").style.width="0";
 let outputURL=null,files=0;const warnings=[];
 try{
  await studio.loadData();
  const W=studio.getHome();
   if(!W.FutureCodeFrameZip?.Archive)throw Error("ZIP Engine မတင်နိုင်ပါ။ Browser Refresh လုပ်ပြီး ပြန်စမ်းပါ။");
   const zip=previewOnly?null:new W.FutureCodeFrameZip.Archive();
  for(let i=0;i<assignments.length;i++){
   const {section,frame:f}=assignments[i];
   const rows=studio.filtered(section),label=studio.SECTION[section]+" · "+f.name;
   $("progressBar").style.width=Math.round((i/assignments.length)*100)+"%";
   studio.status("Frame "+(i+1)+"/"+assignments.length+" — "+label+" PNG ထုတ်နေသည်…");
   if(!rows.length){warnings.push(label+" (ပွဲ/သတင်း မရှိ)");continue;}
   try{
    for await(const result of forSection(section,f,rows,studio.getSectionLayout(section))){
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
  studio.status(warnings.length?"ZIP ကို တစ်စိတ်တစ်ပိုင်းသာ ဖန်တီးနိုင်ခဲ့သည်။ PNG "+files+" ပုံ၊ မပါဝင်ခဲ့သည့်အပိုင်း: "+warnings.join(" | "):"PNG "+files+" ပုံပါသော ZIP အပြည့်အစုံ အဆင်သင့်ဖြစ်ပါပြီ။",warnings.length>0);
 }catch(err){console.error("Frame workspace export failed",err);studio.status("Export မအောင်မြင်ပါ — "+err.message,true);}
 finally{studio.setWorking(false);}
}
$("downPreview").onclick=()=>exportAll(true);
$("downZip").onclick=()=>exportAll(false);
})();