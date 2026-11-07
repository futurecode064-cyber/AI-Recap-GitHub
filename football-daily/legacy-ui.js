(function(){
"use strict";
const el=document.documentElement, brand=el.dataset.brand==="goal"?"goal":"main";
const root=el.dataset.root||"../", title=brand==="goal"?"ဂိုးဇုံ အားကစားဂျာနယ်":"FUTURE CODE FOOTBALL";
const color=brand==="goal"?"#f2c66c":"#58c1e0", secondary=brand==="goal"?"#e42f2f":"#db9b5b";
const app=document.getElementById("legacyApp"), escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let index=[], current=null;
const manifestUrl=root+"data/legacy/index.json";
const param=new URLSearchParams(location.search).get("article");
function formatDate(date){return date+" · Asia/Yangon"}
function mk(tag,attrs={},content){const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(content!==undefined)n.textContent=content;return n}
function linkTo(id){return "?article="+encodeURIComponent(id)}
function downloadText(a){
 const full=[a.title,a.subtitle,a.date,"ဂိုးဇုံ / FUTURE CODE | THE LEGACY",...a.intro,...a.sections.flatMap(s=>["",s.heading,...s.paragraphs]),"",...a.sources.map(s=>s.title+" — "+s.url)].join("\n\n");
 const blob=new Blob(["\uFEFF"+full],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),x=mk("a",{href:url,download:a.date+"-"+a.id+".txt"});document.body.append(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function words(context,str,maxWidth,x,y,lineHeight,maxLines=5){
 let line="",count=0;const tokens=Array.from(str).reduce((arr,c)=>{if(c===" "){arr.push(" ");}else if(c==="\n")arr.push("\n");else arr.push(c);return arr},[]);
 for(const ch of tokens){const attempt=line+ch;if(context.measureText(attempt).width>maxWidth&&line){context.fillText(line.trim(),x,y);y+=lineHeight;count++;line=ch;if(count>=maxLines-1)break}else if(ch==="\n"){context.fillText(line.trim(),x,y);y+=lineHeight;count++;line=""}else line=attempt}
 if(line)context.fillText(line.trim(),x,y);
}
async function poster(a,idx=-1){
 const name=idx<0?"THE LEGACY":String(idx+1).padStart(2,"0")+" / THE LEGACY";
 const heading=idx<0?a.title:a.sections[idx].heading;
 const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1080;
 const c=canvas.getContext("2d");const grd=c.createLinearGradient(0,0,1080,1080);grd.addColorStop(0,"#090b0d");grd.addColorStop(1,brand==="goal"?"#302112":"#173546");c.fillStyle=grd;c.fillRect(0,0,1080,1080);
 let loaded=false;try{const pic=new Image();pic.crossOrigin="anonymous";pic.src=a.photo;await Promise.race([new Promise((res,rej)=>{pic.onload=res;pic.onerror=rej}),new Promise((_,rej)=>setTimeout(()=>rej(Error("Image timeout")),8000))]);const w=540,h=850;const scale=Math.max(w/pic.width,h/pic.height);const dw=pic.width*scale,dh=pic.height*scale;c.drawImage(pic,690+(w-dw)/2,140+(h-dh)/2,dw,dh);loaded=true;}catch(e){}
 const overlay=c.createLinearGradient(0,0,1050,0);overlay.addColorStop(0,"#080b0dfa");overlay.addColorStop(.65,"#080b0df4");overlay.addColorStop(1,loaded?"#080b0d12":"#080b0d90");c.fillStyle=overlay;c.fillRect(0,0,1080,1080);
 c.fillStyle=secondary;c.fillRect(0,0,1080,12);c.fillRect(0,1048,1080,32);c.fillStyle=color;c.fillRect(50,160,150,5);
 c.textBaseline="top";c.fillStyle="#fff";c.font="800 45px Barlow Condensed, Arial";c.fillText(brand==="goal"?"GOAL ZONE":"FUTURE CODE",48,48);c.fillStyle=color;c.font="800 27px Arial";c.fillText("THE LEGACY • FOOTBALL HISTORY",48,110);
 c.fillStyle=color;c.font="800 35px Arial";c.fillText(name,48,218);
 c.fillStyle="#fff";c.font="800 58px 'Noto Sans Myanmar',sans-serif";words(c,heading,580,47,335,86,6);
 c.fillStyle="#fff";c.font="700 25px Arial";c.fillText("CRISTIANO RONALDO · CR7",48,855);
 c.fillStyle=color;c.font="700 24px Arial";c.fillText(a.date+" | "+a.category,48,920);
 c.fillStyle="#fff";c.font="600 19px Arial";c.fillText("Goal Zone / Future Code Football | Source photo: CC BY-SA 3.0",50,1052);
 const blob=await new Promise(res=>canvas.toBlob(res,"image/png"));if(!blob)throw Error("PNG unavailable");
 const url=URL.createObjectURL(blob),b=mk("a",{href:url,download:a.date+"-"+a.id+(idx<0?"-cover":"-chapter-"+(idx+1))+".png"});document.body.append(b);b.click();b.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function button(label,fn,secondaryButton){const b=mk("button",{type:"button",class:"btn"+(secondaryButton?" secondary":"")},label);b.onclick=async()=>{b.disabled=true;const text=b.textContent;b.textContent="ဖန်တီးနေသည်…";try{await fn()}catch(e){alert("Download မအောင်မြင်ပါ: "+e.message)}finally{b.disabled=false;b.textContent=text}};return b}
function renderArticle(a){
 current=a;document.title=a.title+" | THE LEGACY";
 app.innerHTML="";
 const wrap=mk("article",{class:"reader"}),crumb=mk("a",{class:"crumb",href:"./"},"← THE LEGACY · ဆောင်းပါးအားလုံး");wrap.append(crumb);
 wrap.append(mk("div",{class:"article-kicker"},a.category+" · "+formatDate(a.date)),mk("h1",{},a.title),mk("div",{class:"sub"},a.subtitle));
 const figure=mk("figure",{class:"photo"});figure.append(mk("img",{src:a.photo,alt:"Cristiano Ronaldo in Portugal colours, 2018",loading:"eager"}),mk("div",{class:"stamp"},"THE LEGACY · CR7"));wrap.append(figure);
 const credit=mk("p",{class:"credit"},a.photoAttribution+" — Historical 2018 photo; not a photograph of the 2026 announcement. ");const src=mk("a",{href:a.photoSource,target:"_blank",rel:"noopener noreferrer"},"ဓာတ်ပုံအရင်းအမြစ်");credit.append(src);wrap.append(credit);
 const actions=mk("div",{class:"actions"});actions.append(button("⬇ စာသားအပြည့်အစုံ .TXT",()=>downloadText(a)),button("⬇ Cover ပုံ .PNG",()=>poster(a),true));wrap.append(actions);
 a.intro.forEach(p=>wrap.append(mk("p",{},p)));
 a.sections.forEach((s,i)=>{const chap=mk("section",{class:"chapter"});chap.append(mk("h2",{},String(i+1).padStart(2,"0")+" · "+s.heading));s.paragraphs.forEach(p=>chap.append(mk("p",{},p)));const tools=mk("div",{class:"chapter-actions"});tools.append(button("⬇ အခန်း "+(i+1)+" ပုံ .PNG",()=>poster(a,i),true));chap.append(tools);wrap.append(chap)});
 const sources=mk("section",{class:"sources"});sources.append(mk("h3",{},"သတင်းအချက်အလက် စစ်ဆေးရန်"));a.sources.forEach(s=>{const p=mk("p",{});p.append(mk("a",{href:s.url,target:"_blank",rel:"noopener noreferrer"},s.title));sources.append(p)});wrap.append(sources);app.append(wrap);
}
function renderArchive(){
 document.title="THE LEGACY | ဘောလုံးသမိုင်း";
 app.innerHTML='<div class="container"><div class="archive-top"><h2>ဆောင်းပါးမှတ်တမ်း</h2><span id="legacyCount" class="count"></span></div><div class="filters"><input id="legacySearch" aria-label="ခေါင်းစဉ်ရှာရန်" placeholder="ခေါင်းစဉ်၊ ကစားသမား၊ အသင်း ရှာရန်"><select id="legacyCategory" aria-label="အမျိုးအစား"><option value="">အမျိုးအစားအားလုံး</option></select><select id="legacyDate" aria-label="နေ့စွဲ"><option value="">နေ့စွဲအားလုံး</option></select></div><div class="grid" id="legacyGrid"></div></div>';
 const cat=document.getElementById("legacyCategory"),dates=document.getElementById("legacyDate");[...new Set(index.map(a=>a.category))].forEach(s=>cat.append(mk("option",{value:s},s)));[...new Set(index.map(a=>a.date))].sort().reverse().forEach(s=>dates.append(mk("option",{value:s},s)));
 const draw=()=>{const term=document.getElementById("legacySearch").value.trim().toLowerCase(),category=cat.value,date=dates.value;const hits=index.filter(a=>(!term||(a.title+a.subtitle+a.summary+a.category).toLowerCase().includes(term))&&(!category||a.category===category)&&(!date||a.date===date)).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
 document.getElementById("legacyCount").textContent=hits.length+" ဆောင်းပါး";
 const grid=document.getElementById("legacyGrid");grid.innerHTML="";hits.forEach(a=>{const card=mk("article",{class:"article-card"}),link=mk("a",{href:linkTo(a.id)}),thumbnail=mk("div",{class:"thumb"});thumbnail.append(mk("img",{src:a.photo,loading:"lazy",alt:a.subtitle}));link.append(thumbnail);card.append(link);const info=mk("div",{class:"info"});info.append(mk("div",{class:"meta"},formatDate(a.date)+" · "+a.category),mk("h3",{},a.title),mk("p",{},a.summary),mk("a",{class:"link",href:linkTo(a.id)},"ဆောင်းပါးအပြည့်အစုံ ဖတ်ရန် →"));card.append(info);grid.append(card)});if(!hits.length)grid.append(mk("p",{class:"message"},"ဤအမျိုးအစားနှင့် ကိုက်ညီသည့် ဆောင်းပါး မရှိသေးပါ။"));};
 document.querySelectorAll("#legacySearch,#legacyCategory,#legacyDate").forEach(e=>e.addEventListener("input",draw));draw();
}
async function start(){try{const r=await fetch(manifestUrl,{cache:"no-cache"});if(!r.ok)throw Error("Archive HTTP "+r.status);const data=await r.json();index=Array.isArray(data.articles)?data.articles:[];if(param){const match=index.find(a=>a.id===param);if(!match){app.textContent="ဆောင်းပါး မတွေ့ပါ။";return;}if(!/^articles\/[a-z0-9-]+\.json$/.test(match.path))throw Error("Invalid archive path");const page=await fetch(root+"data/legacy/"+match.path,{cache:"no-cache"});if(!page.ok)throw Error("Article HTTP "+page.status);renderArticle(await page.json());}else renderArchive();}catch(e){app.innerHTML="";app.append(mk("p",{class:"container message"},"ဆောင်းပါးမှတ်တမ်း ရယူမရပါ။ ပြန်လည်ဖွင့်ကြည့်ပါ။ ("+e.message+")"));}}
start();
})();