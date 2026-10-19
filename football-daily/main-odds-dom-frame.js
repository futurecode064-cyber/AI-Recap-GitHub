"use strict";
/* Main-only odds PNG. Preserve the actual website's league/table DOM geometry;
   a measured-DOM canvas backup prevents "new layout" PNGs on restricted phones. */
(function(){
  if(document.documentElement.dataset.footballBrandName ||
     !/^\/odds(?:\.html)?\/?$/.test(location.pathname))return;
  const WIDTH=1040,SCALE=2;
  const cache=new Map();
  const localLeagueLogos={
    "Premier League":"pl","Serie A":"sa","La Liga":"pd",
    "Bundesliga":"bl","Ligue 1":"fl"
  };
  let browserCaptureFailed=false;
  const rect=(el,base)=>{
    const r=el.getBoundingClientRect(),b=base.getBoundingClientRect();
    return {x:r.left-b.left,y:r.top-b.top,w:r.width,h:r.height};
  };
  function colour(hex,f){
    return "#"+hex.slice(1).match(/../g).map(v=>
      Math.max(0,Math.min(255,Math.round(parseInt(v,16)*f))).toString(16).padStart(2,"0")
    ).join("");
  }
  function image(url){
    if(!url)return Promise.resolve(null);
    if(!cache.has(url))cache.set(url,new Promise(resolve=>{
      const img=new Image();
      let settled=false;
      const finish=val=>{if(settled)return;settled=true;clearTimeout(timer);resolve(val);};
      const timer=setTimeout(()=>finish(null),5500);
      img.crossOrigin="anonymous";
      img.onload=()=>finish(img);
      img.onerror=()=>finish(null);
      img.src=url;
    }));
    return cache.get(url);
  }
  async function asImage(blob){
    const src=URL.createObjectURL(blob);
    try{
      return await new Promise((resolve,reject)=>{
        const img=new Image();img.onload=()=>resolve(img);
        img.onerror=()=>reject(Error("PNG ဖွင့်မရပါ"));img.src=src;
      });
    }finally{URL.revokeObjectURL(src);}
  }
  function fill(ctx,r,color){
    if(!r||r.w<=0||r.h<=0)return;
    ctx.fillStyle=color;ctx.fillRect(r.x,r.y,r.w,r.h);
  }
  function bg(ctx,el,root,fallback){
    const style=getComputedStyle(el),color=style.backgroundColor;
    fill(ctx,rect(el,root),color&&color!=="rgba(0, 0, 0, 0)"&&color!=="transparent"?color:fallback);
  }
  function print(ctx,el,root,{min=16,max=25,color,align="center",value}={}){
    if(!el)return;
    const r=rect(el,root),cs=getComputedStyle(el);
    if(r.w<3||r.h<3)return;
    const str=String(value===undefined?el.textContent:value).trim().replace(/\s+/gu," ");
    if(!str)return;
    const size=Math.max(min,Math.min(max,parseFloat(cs.fontSize)||min));
    const weight=(parseInt(cs.fontWeight,10)||800)>=700?800:700;
    const ink=color||cs.color||"#172126";
    const family='"Noto Sans Myanmar",sans-serif';
    ctx.font=weight+" "+size+"px "+family;
    ctx.fillStyle=ink;ctx.textAlign=align;ctx.textBaseline="middle";
    const limit=Math.max(10,r.w-6);
    const segmenter=typeof Intl.Segmenter==="function"?
      new Intl.Segmenter("my",{granularity:"word"}):null;
    const parts=segmenter?[...segmenter.segment(str)].map(v=>v.segment):
      str.split(/(\s+)/u);
    const lines=[];let line="";
    for(const token of parts){
      const next=line+token;
      if(line&&ctx.measureText(next).width>limit){lines.push(line.trim());line=token.trimStart();}
      else line=next;
    }
    if(line.trim())lines.push(line.trim());
    const output=[];
    for(const entry of lines.length?lines:[str]){
      if(ctx.measureText(entry).width<=limit){output.push(entry);continue;}
      let chunk="";
      for(const letter of Array.from(entry)){
        if(chunk&&ctx.measureText(chunk+letter).width>limit){
          output.push(chunk);chunk=letter;
        }else chunk+=letter;
      }
      if(chunk)output.push(chunk);
    }
    const count=Math.min(output.length,3),lineHeight=Math.min(size*1.42,r.h/Math.max(1,count));
    const start=r.y+r.h/2-(count-1)*lineHeight/2;
    for(let i=0;i<count;i++){
      const x=align==="right"?r.x+r.w-3:align==="left"?r.x+3:r.x+r.w/2;
      ctx.fillText(output[i],x,start+i*lineHeight,limit);
    }
  }
  async function drawCrest(ctx,imgEl,root,label,local){
    if(!imgEl&&!local)return;
    const r=imgEl?rect(imgEl,root):local.r;
    const url=local?.src||imgEl?.currentSrc||imgEl?.src;
    const img=await image(url);
    ctx.fillStyle="#fff";ctx.fillRect(r.x,r.y,r.w,r.h);
    if(img&&img.naturalWidth){
      const k=Math.min((r.w-4)/img.naturalWidth,(r.h-4)/img.naturalHeight);
      const w=img.naturalWidth*k,h=img.naturalHeight*k;
      ctx.drawImage(img,r.x+(r.w-w)/2,r.y+(r.h-h)/2,w,h);
    }else{
      ctx.fillStyle="#24363d";ctx.font='800 '+Math.max(13,Math.min(18,r.h/2))+'px sans-serif';
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(String(label||"⚽").slice(0,2),r.x+r.w/2,r.y+r.h/2,r.w-3);
    }
  }
  async function measuredCapture(root,theme){
    // Unlike the obsolete generic fallback, all positions and row heights
    // are measured from the cloned, CSS-styled WEBSITE DOM itself.
    const width=Math.ceil(root.getBoundingClientRect().width);
    const height=Math.ceil(root.scrollHeight);
    const canvas=document.createElement("canvas");
    canvas.width=width*SCALE;canvas.height=height*SCALE;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw Error("PNG Canvas ဖန်တီးမရပါ");
    ctx.scale(SCALE,SCALE);
    fill(ctx,{x:0,y:0,w:width,h:height},"#10191d");
    const date=root.querySelector(".fc-odds-export-date");
    if(date){bg(ctx,date,root,colour(theme,.7));print(ctx,date,root,{min:24,color:"#fff"});}
    for(const group of root.querySelectorAll(".odds-group")){
      bg(ctx,group,root,"#fff");
      const header=group.querySelector(".odds-league-header");
      if(header){
        bg(ctx,header,root,theme);
        const h=header.querySelector("h2.odds-league-heading");
        if(h){
          const hr=rect(h,root);
          const badge=h.querySelector(".league-crest,.league-mark");
          const label=h.querySelector("span:last-child");
          if(badge){
            const b=rect(badge,root);
            if(badge.tagName==="IMG"){
              const lg=h.textContent.trim();
              const localKey=group.dataset.oddsLeague;
              const local=localKey?{src:"./assets/table-odds-frames/league-"+localLeagueLogos[localKey]+".png",r:b}:null;
              await drawCrest(ctx,badge,root,lg,local);
            }else{
              fill(ctx,b,"#fff");print(ctx,badge,root,{min:19,color:"#172a37"});
            }
          }
          if(label)print(ctx,label,root,{min:24,max:27,color:"#fff",align:"left"});
          else print(ctx,h,root,{min:23,color:"#fff",align:"left"});
          ctx.strokeStyle="#ffffff55";
          ctx.strokeRect(hr.x,hr.y,hr.w,hr.h);
        }
      }
      const table=group.querySelector("table.odds-table");
      if(!table)continue;
      for(const th of table.querySelectorAll("thead th")){
        bg(ctx,th,root,theme);
        const r=rect(th,root);
        ctx.strokeStyle="#ffffff66";ctx.lineWidth=1;ctx.strokeRect(r.x,r.y,r.w,r.h);
        print(ctx,th,root,{min:17,max:20,color:"#fff"});
      }
      for(const tr of table.querySelectorAll("tbody tr")){
        for(const td of tr.querySelectorAll("td")){
          const r=rect(td,root);
          const css=getComputedStyle(td);
          const fallback=td.classList.contains("upper")?"#e8eaed":
            td.classList.contains("odds-current")?"#edf7f3":"#fff";
          const ink=css.backgroundColor;
          fill(ctx,r,ink&&ink!=="rgba(0, 0, 0, 0)"?ink:fallback);
          ctx.strokeStyle="#cfd3d8";ctx.lineWidth=.85;
          ctx.strokeRect(r.x+.3,r.y+.3,r.w-.6,r.h-.6);
          if(td.classList.contains("team-pair")){
            const labels=td.querySelectorAll(".club-label");
            for(const label of labels)print(ctx,label,root,{min:19,max:22,color:"#111820",align:
              label===labels[0]?"right":"left"});
            const versus=td.querySelector(".mini-vs");
            print(ctx,versus,root,{min:15,max:17,color:"#a42b35"});
            for(const badge of td.querySelectorAll(".team-badge")){
              const img=badge.querySelector("img");
              if(img)await drawCrest(ctx,img,root,img.alt||badge.title);
              else {fill(ctx,rect(badge,root),"#fff");print(ctx,badge,root,{min:14,color:"#14242a"});}
            }
          }else{
            print(ctx,td,root,{min:td.classList.contains("price")?23:td.classList.contains("prediction")?22:18,
              max:td.classList.contains("price")?25:22,color:"#111820"});
          }
        }
      }
    }
    return {image:canvas,height:canvas.height};
  }
  async function capture(rows,theme,date){
    if(typeof loadedSheet==="undefined"||!loadedSheet?.matches?.length)
      throw Error("ပေါက်ကြေးဒေတာ မရသေးပါ။");
    const original=[...document.querySelectorAll("#oddsList .odds-group")];
    const leagueOrder=[...new Set(loadedSheet.matches.map(m=>m.league))];
    if(original.length!==leagueOrder.length)throw Error("Website လိဂ်ဇယား မပြည့်စုံပါ။ Refresh လုပ်ပါ။");
    const source=new Map(leagueOrder.map((l,i)=>[l,original[i]]));
    const sections=new Map();
    for(const m of rows){if(!sections.has(m.league))sections.set(m.league,[]);sections.get(m.league).push(m);}
    const stage=document.createElement("div");
    stage.style.cssText="position:fixed;top:0;left:-24000px;width:"+WIDTH+"px;pointer-events:none;z-index:-1000;overflow:visible;";
    const root=document.createElement("div");
    root.className="odds-content fc-odds-export-capture";
    root.style.cssText="box-sizing:border-box;width:"+WIDTH+"px;max-width:none;margin:0;padding:10px;background:#10191d;";
    root.style.setProperty("--sheet-brand",theme);
    root.style.setProperty("--sheet-deep",colour(theme,.70));
    root.style.setProperty("--sheet-title","#fff");
    const dateEl=document.createElement("div");
    dateEl.className="fc-odds-export-date";
    dateEl.textContent=date||"";
    dateEl.style.cssText="margin:0 0 12px;text-align:center;border-radius:7px;background:"+
      colour(theme,.7)+";color:#fff;font:800 24px/1.6 'Noto Sans Myanmar',sans-serif;padding:7px 0;";
    root.append(dateEl);
    for(const [league,matches] of sections){
      const live=source.get(league);
      if(!live)throw Error("လိဂ်ဇယား ရှာမတွေ့ပါ — "+league);
      const all=loadedSheet.matches.filter(x=>x.league===league);
      const selected=new Set(matches.map(x=>all.indexOf(x)));
      if(selected.has(-1))throw Error("Website ပွဲဒေတာ မကိုက်ညီပါ");
      const group=live.cloneNode(true);
      group.dataset.oddsLeague=league;
      group.querySelectorAll("button,.odds-league-png-parts").forEach(el=>el.remove());
      [...group.querySelectorAll("tbody tr")].forEach((tr,i)=>{if(!selected.has(i))tr.remove();});
      group.style.setProperty("width","100%","important");
      group.style.setProperty("max-width","none","important");
      group.style.setProperty("margin","0 0 13px","important");
      const head=group.querySelector("h2.odds-league-heading");
      if(head){head.style.setProperty("font-size","23px","important");
        const logo=head.querySelector("img,.league-mark");
        if(logo){logo.style.setProperty("width","43px","important");
          logo.style.setProperty("height","43px","important");}}
      for(const th of group.querySelectorAll("th")){
        th.style.setProperty("font-size",th.classList.contains("odds-sub-current")||
          th.classList.contains("odds-sub-original")?"17px":"18px","important");
        th.style.setProperty("line-height","1.65","important");
        th.style.setProperty("padding","8px 3px","important");
      }
      for(const td of group.querySelectorAll("td")){
        const size=td.classList.contains("price")?"23px":
          td.classList.contains("prediction")?"22px":
          td.classList.contains("team-pair")?"20px":"19px";
        td.style.setProperty("font-size",size,"important");
        td.style.setProperty("padding","11px 3px","important");
        td.style.setProperty("line-height","1.65","important");
      }
      for(const label of group.querySelectorAll(".odds-matchup .club-label")){
        label.style.setProperty("font-size","20px","important");
        label.style.setProperty("line-height","1.5","important");
      }
      for(const logo of group.querySelectorAll(".odds-matchup .team-badge")){
        logo.style.setProperty("width","34px","important");
        logo.style.setProperty("height","34px","important");
        logo.style.setProperty("flex","0 0 34px","important");
      }
      for(const mark of group.querySelectorAll(".odds-matchup .mini-vs"))
        mark.style.setProperty("font-size","15px","important");
      const table=group.querySelector("table");
      if(table){table.style.setProperty("width","100%","important");
        table.style.setProperty("min-width","0","important");
        table.style.setProperty("max-width","none","important");
      }
      root.append(group);
    }
    stage.append(root);document.body.append(stage);
    try{
      if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1300))]);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const height=Math.ceil(root.scrollHeight);
      if(height<70||height>13000)throw Error("ပုံအရွယ်အစား ကြီးလွန်းပါသည်။ ပုံခွဲပါ။");
      if(!browserCaptureFailed&&window.domtoimage?.toBlob){
        let timer;
        try{
          const blob=await Promise.race([
            window.domtoimage.toBlob(root,{
              bgcolor:"#10191d",width:WIDTH*SCALE,height:height*SCALE,
              style:{transform:"scale("+SCALE+")",transformOrigin:"top left",
                width:WIDTH+"px",height:height+"px"},
              imagePlaceholder:"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
            }),
            new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error("Screenshot timeout")),5500);})
          ]);
          if(!blob?.size)throw Error("Empty screenshot PNG");
          const result={image:await asImage(blob),height:height*SCALE};
          window.FutureCodeOddsDomFrame.lastCapture="website";
          return result;
        }catch(error){
          console.warn("Odds DOM screenshot unavailable; using measured website geometry.",error);
          browserCaptureFailed=true;
        }finally{clearTimeout(timer);}
      }
      const result=await measuredCapture(root,theme);
      window.FutureCodeOddsDomFrame.lastCapture="measured-website";
      return result;
    }finally{stage.remove();}
  }
  async function draw(rows,settings){
    const kit=window.FutureCodeCanvasKit;
    if(!kit)throw Error("PNG module မရပါ");
    const design=settings.design,theme=design[0]==="colour"?settings.colour:design[2];
    const frame=design[3]?await image("./assets/table-odds-frames/"+design[0]+"-frame.jpg"):null;
    const top=design[0]==="colour"||frame?null:
      await image("./assets/table-odds-frames/"+design[0]+"-top.jpg");
    const bottom=design[0]==="colour"||frame?null:
      await image("./assets/table-odds-frames/"+design[0]+"-bottom.jpg");
    const shot=await capture(rows,theme,settings.date);
    const W=WIDTH*SCALE;
    const fractionTop=frame?design[3].top:0,fractionBottom=frame?design[3].bottom:0;
    const topH=frame?Math.round(frame.height*fractionTop*W/frame.width):
      top?Math.round(top.height*W/top.width):0;
    const bottomH=frame?Math.round(frame.height*fractionBottom*W/frame.width):
      bottom?Math.round(bottom.height*W/bottom.width):0;
    const {canvas,ctx}=kit.create(W,topH+shot.height+bottomH);
    ctx.fillStyle=colour(theme,.55);ctx.fillRect(0,0,canvas.width,canvas.height);
    if(frame&&topH)ctx.drawImage(frame,0,0,frame.width,frame.height*fractionTop,0,0,W,topH);
    else if(top)ctx.drawImage(top,0,0,W,topH);
    ctx.drawImage(shot.image,0,topH,W,shot.height);
    if(frame&&bottomH)ctx.drawImage(frame,0,frame.height*(1-fractionBottom),frame.width,
      frame.height*fractionBottom,0,canvas.height-bottomH,W,bottomH);
    else if(bottom)ctx.drawImage(bottom,0,canvas.height-bottomH,W,bottomH);
    return canvas;
  }
  window.FutureCodeOddsDomFrame={draw};
})();
