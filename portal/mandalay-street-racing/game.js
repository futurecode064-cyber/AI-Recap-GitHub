/* Future Code AI Studio — Mandalay Street Racing. Original arcade web race edition. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const cars = [
 {id:"hatch",name:"CITY HATCH",tag:"Swift urban hatchback",cost:0,speed:188,accel:16,grip:67,nitro:62,color:"#f1b34e",shape:0},
 {id:"gt",name:"MANDALAY GT",tag:"Aerodynamic street coupe",cost:9000,speed:211,accel:19,grip:73,nitro:68,color:"#38bdd3",shape:1},
 {id:"road",name:"ROADSTER R",tag:"Lightweight touring roadster",cost:18000,speed:226,accel:22,grip:82,nitro:76,color:"#e95e65",shape:2},
 {id:"ev",name:"E-VOLT RS",tag:"Instant-torque electric sports car",cost:28000,speed:244,accel:26,grip:86,nitro:72,color:"#c2b5ff",shape:3},
 {id:"turbo",name:"TURBO X",tag:"Elite street prototype",cost:46000,speed:272,accel:28,grip:91,nitro:92,color:"#f9f7ed",shape:4}
];
const tracks = [
 {name:"WEST MOAT SPRINT",my:"ကျုံးအနောက်ဘက် · ၈၀ လမ်း",desc:"မန္တလေးကျုံးဘေးက သစ်ပင်များ၊ ရေပြင်နဲ့ မြို့ရိုးရိပ်အောက်မှာ ပြိုင်ပါ။",length:1150,laps:2,day:"sunset",curve:.68,road:"80TH ST",theme:0},
 {name:"SOUTH PALACE CIRCUIT",my:"ကျုံးတောင်ဘက် · ၂၆ လမ်း",desc:"ကျုံးတောင်ဘက် နန်းမြို့ရိုး၊ ဂိတ်မုခ်တွေကို ဖြတ်သန်းတဲ့ Circuit။",length:1280,laps:2,day:"noon",curve:.83,road:"26TH ST",theme:1},
 {name:"78TH AVENUE DASH",my:"၇၈ လမ်း · မြို့လယ်",desc:"လမ်းမကျယ်နဲ့ အဆောက်အအုံများကြား ဆီမီးအလင်းရောင်အောက်က အမြန်ဆုံး Race။",length:1380,laps:2,day:"night",curve:1.06,road:"78TH ST",theme:2},
 {name:"35TH MARKET RUN",my:"၃၅ လမ်း · ဈေးတန်း",desc:"ဆိုင်းဘုတ်တွေ၊ လမ်းမီးတွေ ရှိတဲ့ Urban Challenge။",length:1560,laps:2,day:"dusk",curve:1.26,road:"35TH ST",theme:3}
];
const palette=["#f1b34e","#38bdd3","#e95e65","#c2b5ff","#f9f7ed","#66d39a"];
const savedKey="fc_mandalay_racing_2026_01";
let save={coins:2000,owned:[0],selected:0,track:0,color:0,upgrades:cars.map(()=>({engine:0,grip:0,nitro:0})),wins:0,races:0};
try {const v=JSON.parse(localStorage.getItem(savedKey)||"null");if(v&&Array.isArray(v.owned)&&v.upgrades?.length===cars.length)save={...save,...v};} catch(_){}
save.coins=Math.max(0,Number(save.coins)||0);save.selected=Math.min(cars.length-1,Math.max(0,save.selected|0));save.track=Math.min(tracks.length-1,Math.max(0,save.track|0));save.owned=save.owned.filter(i=>Number.isInteger(i)&&i>=0&&i<cars.length);if(!save.owned.includes(0))save.owned.unshift(0);save.color=Math.max(0,Math.min(palette.length-1,save.color|0));
const money=n=>Math.floor(n).toLocaleString("en-US");
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
const ctx=$("raceCanvas").getContext("2d",{alpha:false});
let view={screen:"garage"},race=null,frameAt=0,hudClock=0,networkClock=0,toastHandle=null;
const keys={left:false,right:false,gas:false,brake:false,nitro:false};
const net={peer:null,room:"",host:false,connections:new Map(),remotes:new Map(),localName:"Mandalay Racer",connected:false,joining:false};
function persist(){try{localStorage.setItem(savedKey,JSON.stringify(save));}catch(_){}}
function toast(text){$("toast").textContent=text;$("toast").classList.add("show");clearTimeout(toastHandle);toastHandle=setTimeout(()=>$("toast").classList.remove("show"),2500);}
function calcCar(index){const c=cars[index],u=save.upgrades[index];return {...c,top:c.speed+u.engine*13,accelRate:c.accel+u.engine*2.6,traction:c.grip+u.grip*6,boostPower:c.nitro+u.nitro*9};}
function svgCar(car,color,mini=false){const wide=car.shape===4?1.1:car.shape===0?.89:car.shape===3?1.05:1;let h=mini?50:250;return '<svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stylized '+car.name+' car graphic"><defs><linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+color+'" offset="0"/><stop stop-color="#111d2a" offset="1"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#7ed0da" offset="0"/><stop stop-color="#122735" offset="1"/></linearGradient><linearGradient id="roadlight" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff3ba" offset="0"/><stop stop-color="#fff" offset="1"/></linearGradient></defs><ellipse cx="316" cy="223" rx="255" ry="23" fill="#000" opacity=".42"/><g transform="translate(320 0) scale('+wide+' 1) translate(-320 0)"><ellipse cx="151" cy="192" rx="41" ry="50" fill="#10141c"/><ellipse cx="480" cy="192" rx="42" ry="50" fill="#10141c"/><ellipse cx="148" cy="192" rx="20" ry="29" fill="#8e9da8"/><ellipse cx="483" cy="192" rx="20" ry="29" fill="#8e9da8"/><path d="M61 176 L86 143 L150 113 L235 96 L367 99 L448 119 L545 143 L578 165 L570 207 L529 217 Q518 173 482 173 Q441 176 440 219 L202 219 Q195 170 154 174 Q115 181 110 219 L69 210Z" fill="url(#body)" stroke="#f4ffff" stroke-opacity=".36" stroke-width="3"/><path d="M216 107 L280 66 L397 72 L456 120Z" fill="#192f40" stroke="#b3e5ec" stroke-width="2"/><path d="M233 109 L286 76 L351 76 L347 119Z" fill="url(#glass)" opacity=".9"/><path d="M363 77 L394 79 L439 116 L360 120Z" fill="url(#glass)" opacity=".86"/><path d="M84 158 Q151 132 219 135 L430 142 L555 156" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4"/><path d="M86 185 Q126 173 130 175 M497 176 L568 187" stroke="#0d2630" stroke-width="8"/><path d="M80 161 L132 145 L134 157 L83 177Z" fill="url(#roadlight)"/><path d="M548 154 L573 166 L574 187 L533 173Z" fill="#ff7777"/><path d="M230 190 L432 190" stroke="#ffffff" stroke-opacity=".34" stroke-width="3"/><path d="M236 201 L423 201" stroke="#15212c" stroke-width="5"/><path d="M245 135 L281 132" stroke="#101a24" stroke-width="3"/><path d="M421 143 L455 148" stroke="#101a24" stroke-width="3"/><path d="M73 208 L105 208 L104 220 L70 221 Z" fill="#151b22"/></g></svg>';}
function show(screen){
 document.querySelectorAll(".screen").forEach(el=>el.classList.toggle("hidden",el.id!==screen));
 document.querySelectorAll(".tab").forEach(el=>el.classList.toggle("active",el.dataset.screen===screen));
 view.screen=screen;if(screen==="garage")drawGarage();if(screen==="tracks")drawTracks();if(screen==="online")drawNetUI();
}
function drawGarage(){
 const c=cars[save.selected],owned=save.owned.includes(save.selected),col=palette[save.color];
 $("coins").textContent=money(save.coins);$("heroName").textContent=c.name;$("heroDesc").textContent=c.tag;
 $("heroCar").innerHTML=svgCar(c,col);
 $("colors").innerHTML=palette.map((v,i)=>'<button class="swatch '+(i===save.color?"active":"")+'" style="background:'+v+'" data-color="'+i+'" aria-label="Car color '+(i+1)+'"></button>').join("");
 document.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>{save.color=+b.dataset.color;persist();drawGarage();});
 $("carList").innerHTML=cars.map((x,i)=>'<button class="car-item '+(i===save.selected?"active":"")+'" data-car="'+i+'"><div class="mini-car">'+svgCar(x,x.color,true)+'</div><div><h4>'+x.name+'</h4><span>'+x.tag+'</span></div><div class="right">'+(save.owned.includes(i)?"OWNED":money(x.cost)+" C")+'</div></button>').join("");
 document.querySelectorAll("[data-car]").forEach(b=>b.onclick=()=>{save.selected=+b.dataset.car;save.color=palette.indexOf(cars[save.selected].color);if(save.color<0)save.color=0;persist();drawGarage();});
 const perf=calcCar(save.selected);$("performanceTotal").textContent=perf.top+" KM/H MAX";
 $("statBars").innerHTML=[["TOP SPEED",Math.round(perf.top/300*100)],["ACCEL",Math.round(perf.accelRate/44*100)],["GRIP",Math.round(perf.traction/115*100)],["BOOST",Math.round(perf.boostPower/140*100)]].map(([n,v])=>'<div class="stat-row"><span>'+n+'</span><div><i style="width:'+Math.min(100,v)+'%"></i></div><b>'+Math.min(100,v)+'</b></div>').join("");
 $("selectOrBuy").textContent=owned?"✓ ဒီကားရွေးပြီးပါပြီ":"🔓 ကားဝယ်မယ် · "+money(c.cost)+" Coins";
 $("selectOrBuy").disabled=owned||save.coins<c.cost;
 $("quickRace").disabled=!owned;
 const names=[["⚙️","ENGINE","အရှိန်နှင့် အမြင့်ဆုံး Speed"],["🛞","TYRES & GRIP","လမ်းကွေ့မှာ ထိန်းချုပ်မှု"],["⚡","NITRO KIT","Boost အမြန်နှုန်း"]];
 $("upgradeList").innerHTML=names.map(([icon,title,desc],i)=>{let key=["engine","grip","nitro"][i],lvl=save.upgrades[save.selected][key],cost=(lvl+1)*(lvl+1)*850;
 return '<div class="upgrade-card"><div class="upicon">'+icon+'</div><div class="upgrade-copy"><b>'+title+'</b><small>LEVEL '+lvl+'/5 · '+desc+'</small></div><button data-upgrade="'+key+'" '+(!owned||lvl>=5||save.coins<cost?"disabled":"")+'>'+(lvl>=5?"MAX":money(cost)+" C +")+'</button></div>';}).join("");
 document.querySelectorAll("[data-upgrade]").forEach(b=>b.onclick=()=>upgrade(b.dataset.upgrade));
}
function buyCar(){let c=cars[save.selected];if(save.owned.includes(save.selected)||save.coins<c.cost)return;save.coins-=c.cost;save.owned.push(save.selected);persist();toast("🏆 "+c.name+" ကို ဝယ်ယူပြီးပါပြီ!");drawGarage();}
function upgrade(key){if(!save.owned.includes(save.selected))return;let up=save.upgrades[save.selected],lvl=up[key],cost=(lvl+1)*(lvl+1)*850;if(lvl>=5||save.coins<cost)return;save.coins-=cost;up[key]++;persist();toast("🚀 "+key.toUpperCase()+" LEVEL "+up[key]+" UPGRADED");drawGarage();}
function drawTracks(){
 $("trackList").innerHTML=tracks.map((t,i)=>'<button class="track-card '+(i===save.track?"active":"")+'" data-track="'+i+'"><span class="track-idx">0'+(i+1)+'</span><h3>'+t.name+'</h3><p>'+t.my+'<br>'+t.desc+'</p><span class="track-info">'+t.length/1000+' KM/LAP · '+t.laps+' LAPS · '+(i===save.track?"✓ SELECTED":"CHOOSE TRACK")+'</span></button>').join("");
 document.querySelectorAll("[data-track]").forEach(b=>b.onclick=()=>{save.track=+b.dataset.track;persist();drawTracks();toast(tracks[save.track].name+" ရွေးချယ်ပြီးပါပြီ။");});
}
function showFinish(title,detail,reward,canRetry=true){
 $("modalEyebrow").textContent="RACE RESULT";$("modalTitle").textContent=title;$("modalDetail").textContent=detail;$("modalReward").textContent=reward;$("modalPrimary").textContent=canRetry?"↻ ထပ်ပြိုင်မယ်":"🏁 ပြန်စမယ်";$("modal").classList.remove("hidden");
}
$("modalPrimary").onclick=()=>{$("modal").classList.add("hidden");startRace(race?.online||false,race?.trackIndex??save.track);};
$("modalSecondary").onclick=()=>{$("modal").classList.add("hidden");leaveRace();};
function carStats(i){return calcCar(i);}
function opponents(count){
 const list=[];for(let i=0;i<count;i++)list.push({id:"bot"+i,progress:12+i*13,speed:117+i*10+Math.random()*15,lane:[-.45,.25,.55,-.18][i%4],car:i%cars.length,color:cars[(i+1)%cars.length].color,finished:false});
 return list;
}
function startRace(online=false,trackIndex=save.track,at=null){
 if(!save.owned.includes(save.selected)){toast("ကားကို အရင်ဝယ်ယူပါ။");return;}
 if(!online&&net.connected){toast("Online Room မှာရှိနေပါတယ်။ Room ပိတ်ပြီးမှ Single Race စပါ။");return;}
 document.activeElement?.blur?.();
 const t=tracks[trackIndex];
 race={online,trackIndex,track:t,progress:0,speed:0,lane:0,nitro:3,boostTime:0,fuel:100,elapsed:0,started:false,finished:false,countTo:at||Date.now()+3100,ai:online?[]:opponents(4),collisionCooldown:0,car:save.selected,damage:0,finishRank:0};
 for(let k in keys)keys[k]=false;
 $("modal").classList.add("hidden");$("raceTrackName").textContent=t.name+" · "+t.road;$("raceMsg").classList.add("hidden");
 show("race");$("countdown").classList.remove("hidden");$("countNum").textContent="3";setRaceHud(true);
 toast(online?"🌐 Online Race ချိတ်ဆက်ပြီး စတင်နေပါပြီ":"🏁 ပြိုင်ပွဲစတင်နေပါပြီ");
}
function leaveRace(){race=null;for(let k in keys)keys[k]=false;show("garage");}
function firstRace(){if(!save.owned.includes(save.selected)){toast("ဒီကားကို အရင်ဝယ်ယူပါ။");return;}startRace(false,save.track);}
function useNitro(){if(!race||race.finished||!race.started||race.nitro<=0||race.boostTime>0||race.speed<10)return;race.nitro--;race.boostTime=3.3;toast("⚡ NITRO BOOST!");}
function update(dt,now){
 if(!race||race.finished)return;
 if(!race.started){const left=(race.countTo-Date.now())/1000;if(left>0){$("countdown").classList.remove("hidden");$("countNum").textContent=String(Math.ceil(left));}else{race.started=true;$("countdown").classList.add("hidden");toast("🏁 GO!");}return;}
 race.elapsed+=dt;
 const stat=carStats(race.car),t=race.track;
 if(keys.nitro){useNitro();keys.nitro=false;}
 if(race.boostTime>0)race.boostTime=Math.max(0,race.boostTime-dt);
 const engine=stat.accelRate*0.61, top=stat.top*(race.boostTime>0?1+stat.boostPower/320:1);
 if(keys.gas){race.speed+=dt*engine*2.7;}else race.speed-=dt*(8+race.speed*.024);
 if(keys.brake)race.speed-=dt*95;
 race.speed=clamp(race.speed,0,top);
 const roadBend=Math.sin(race.progress/255)*.62*t.curve + Math.cos(race.progress/515)*.3*t.curve;
 const hand=clamp(stat.traction/95,.6,1.45);
 race.lane+=((Number(keys.right)-Number(keys.left))*dt*(.72+race.speed/240)*hand) - roadBend*(race.speed/205)*dt*.32;
 race.lane=clamp(race.lane,-1.6,1.6);
 if(Math.abs(race.lane)>1){race.speed-=dt*65;if(Math.abs(race.lane)>1.3)race.speed-=dt*45;}
 race.fuel=Math.max(0,race.fuel-dt*(.19+race.speed*.0026));
 if(race.fuel<=0)race.speed=Math.min(race.speed,35);
 race.progress+=race.speed/3.6*dt;
 if(race.collisionCooldown>0)race.collisionCooldown-=dt;
 if(!race.online){
  for(const bot of race.ai){if(bot.finished)continue;
   const pace=bot.speed+Math.sin(race.elapsed*.45+Number(bot.id.slice(3)))*9;bot.progress=Math.min(t.length*t.laps,bot.progress+Math.max(82,pace)/3.6*dt);bot.lane+=Math.sin(race.elapsed+Number(bot.id.slice(3)))*.0009;
   if(bot.progress>=t.length*t.laps)bot.finished=true;
   if(race.collisionCooldown<=0 && Math.abs(bot.progress-race.progress)<7.5 && Math.abs(bot.lane-race.lane)<.28){race.collisionCooldown=2.2;race.speed*=.68;race.damage++;toast("⚠️ ကားချင်းတိုက်မိ!");}
  }
 }
 if(now-hudClock>90){hudClock=now;setRaceHud();}
 if(race.progress>=t.length*t.laps){race.progress=t.length*t.laps;finishRace();}
 if(race.online&&net.connected &&now-networkClock>130){networkClock=now;sendState();}
}
function currentPosition(){if(!race)return 1;const others=race.online?[...net.remotes.values()]:race.ai;return 1+others.filter(x=>x.progress>race.progress).length;}
function setRaceHud(force=false){
 if(!race)return;let t=race.track,dist=race.progress,rk=currentPosition(),lap=Math.min(t.laps,Math.floor(dist/t.length)+1),inLap=dist%t.length;
 $("racePosition").innerHTML=rk+'<span>'+(rk===1?"ST":rk===2?"ND":rk===3?"RD":"TH")+"</span>";
 $("lapLabel").textContent="LAP "+lap+" / "+t.laps;
 $("progressBar").style.width=clamp(100*dist/(t.length*t.laps),0,100)+"%";
 $("timeLabel").textContent=String(Math.floor(race.elapsed/60)).padStart(2,"0")+":"+String(Math.floor(race.elapsed%60)).padStart(2,"0")+"."+String(Math.floor(race.elapsed%1*100)).padStart(2,"0");
 $("raceCoins").textContent=money(save.coins);$("speedValue").textContent=String(Math.floor(race.speed));$("nitroCount").textContent="x"+race.nitro;
 $("nitroFill").style.width=race.boostTime>0?100*Math.min(1,race.boostTime/3.3)+"%":100*race.nitro/3+"%";
 $("fuelFill").style.width=race.fuel+"%";
 $("livePeers").textContent=race.online?"🌐 "+(net.remotes.size+1)+" LIVE RACERS":"AI RACE · "+t.road;
}
function finishRace(){
 if(!race||race.finished)return;
 race.finished=true;
 const rank=currentPosition();
 const prize=[8000,5000,3000,1000][Math.min(rank,4)-1];
 race.finishRank=rank;
 if(race.online){
   netSend({type:"finish",rank,progress:race.progress});
   showFinish("P"+rank+" · ONLINE FINISH","Online Beta ပြိုင်ပွဲပြီးပါပြီ။ Peer-to-peer ဖြစ်ပြီး Server အတည်ပြုမှု မရှိသေးသောကြောင့် Online ဆုကြေးကို Wallet ထဲ မထည့်သေးပါ။","ONLINE BETA — NO COINS");
 }else{
  save.coins+=prize;save.races++;if(rank===1)save.wins++;persist();drawGarage();
  showFinish("P"+rank+" · FINISHED",race.track.name+" — "+race.elapsed.toFixed(1)+" seconds အတွင်း ပန်းဝင်ခဲ့ပါတယ်။","+"+money(prize)+" COINS");
 }
}
function poly(points,color,stroke=null,w=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}}
function box(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function circ(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();}
function stroke(x1,y1,x2,y2,color,w=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();}
function txt(s,x,y,sz,color="#fff",align="center",family="Barlow Condensed, Arial"){ctx.textAlign=align;ctx.fillStyle=color;ctx.font="900 "+sz+"px "+family;ctx.fillText(s,x,y);}
function drawSky(){
 const t=race?.track||tracks[0],dark=t.day==="night"||t.day==="dusk",top=t.day==="noon"?"#48a6cf":t.day==="night"?"#06142b":t.day==="dusk"?"#3d547b":"#3e668f";
 const sky=ctx.createLinearGradient(0,0,0,420);sky.addColorStop(0,top);sky.addColorStop(.65,dark?"#b36e6b":"#f7ae79");sky.addColorStop(1,dark?"#dfa475":"#ffdc9d");box(0,0,1280,720,sky);
 circ(1040,164,49,49,dark?"#ffdca488":"#ffe4abdd");
 for(let i=0;i<15;i++){let x=i*112-70;const h=85+(i*49)%90;box(x,315-h,65+(i%3)*12,h,dark?"#172d42":"#577a83");for(let j=0;j<4;j++)for(let k=0;k<3;k++)if((i+j+k)%3!==0)box(x+12+j*14,328-h+k*20,5,9,dark?"#eab979":"#d9c398");}
 poly([[0,330],[170,252],[350,333],[600,265],[801,323],[1060,232],[1280,319],[1280,420],[0,420]],dark?"#203448":"#628082");
 if(t.theme<2){ // stylized palace walls and moat
 box(0,327,1280,54,"#885847");for(let i=0;i<21;i++)box(i*67,321,45,12,"#9f654f");
 poly([[248,331],[285,267],[330,330]],"#ba6d4f");poly([[276,267],[287,249],[300,267]],"#efc676");
 circ(293,263,4,4,"#ffdf99");
 }
 if(t.day==="night")for(let i=0;i<45;i++){let x=(i*229)%1280,y=16+(i*53)%220;box(x,y,2,2,"#eafaffbb");}
 // atmospheric haze at horizon
 const haze=ctx.createLinearGradient(0,290,0,440);haze.addColorStop(0,"#f4c18a00");haze.addColorStop(1,"#9fc0aa99");box(0,289,1280,160,haze);
}
function roadAt(d){const t=race?.track||tracks[0];d=clamp(d,0,1);const pr=race?.progress||0,l=race?.lane||0;return {y:730-460*Math.pow(d,.72),h:535*Math.pow(1-d,1.62)+18,cx:640-l*245+(Math.sin((pr+500*d)/340)*175+Math.sin((pr+830*d)/740)*115)*d*d*t.curve};}
function roadside(z,d,sx,side){
 const r=roadAt(d),k=Math.pow(1-d,1.65),size=clamp(k*1.28,.018,1.25),x=r.cx+side*(r.h+30+90*k),y=r.y;
 if(size<.085)return;
 const theme=race.track.theme,tag=Math.floor((race.progress+z)/90);
 if((tag+side*3)%4===0){ // neon sign
 const h=165*size,w=90*size;
 box(x-w/2,y-h,w,h,theme===2?"#132b43":"#52685c");
 box(x-w*.4,y-h*.87,w*.78,h*.46,theme===2?"#2b4758":"#a47862");
 txt(["MANDALAY","80 STREET","FC RACING","လမ်း ၂၆"][Math.abs(tag)%4],x,y-h*.52,12*size+3,theme===2?"#ffd6a4":"#ebedd8");
 for(let i=0;i<3;i++)box(x-w*.34+i*24*size,y-h*.18,9*size,11*size,theme===2?"#e7b672":"#dae6d1");
 }else if((tag+side*7)%3===0){
 stroke(x,y-100*size,x,y,"#6b6659",5*size);
 circ(x,y-129*size,31*size,29*size,"#205f4c");
 circ(x+19*size,y-112*size,30*size,32*size,"#287956");
 circ(x-16*size,y-114*size,27*size,32*size,"#368a58");
 }else {
 stroke(x,y-145*size,x,y,"#626a66",5*size);
 stroke(x,y-145*size,x+side*37*size,y-145*size,"#626a66",3*size);
 circ(x+side*38*size,y-145*size,8*size,8*size,race.track.day==="night"?"#ffe1a5":"#dbebdf");
 }
}
function drawRoad(){
 const t=race.track,dist=race.progress;
 box(0,410,1280,310,t.theme===2?"#243948":"#476a55");
 for(let i=71;i>=1;i--){
  const z1=(i-1)/71*735,z2=i/71*735,near=roadAt((i-1)/71),far=roadAt(i/71);
  const stripe=(Math.floor((dist+z1)/40)%2===0),grnd=t.theme===2?"#344853":"#537c60";
  const y1=near.y,y2=far.y;
  poly([[0,y2],[1280,y2],[1280,y1],[0,y1]],t.theme===2?(stripe?"#30464c":"#344851"):(stripe?"#597e5e":"#527456"));
  // water on west moat edge, arcade visual
  if(t.theme<2){poly([[0,y2],[far.cx-far.h-75*Math.pow(1-i/71,1.2),y2],[near.cx-near.h-75*Math.pow(1-(i-1)/71,1.2),y1],[0,y1]],stripe?"#367e8a":"#367786");}
  poly([[far.cx-far.h-32*(1-i/71),y2],[far.cx+far.h+32*(1-i/71),y2],[near.cx+near.h+32*(1-(i-1)/71),y1],[near.cx-near.h-32*(1-(i-1)/71),y1]],stripe?"#908d80":"#767f7b");
  poly([[far.cx-far.h,y2],[far.cx+far.h,y2],[near.cx+near.h,y1],[near.cx-near.h,y1]],stripe?"#303b44":"#343f49");
  const edge=8+12*Math.pow(1-i/71,2);
  poly([[far.cx-far.h,y2],[far.cx-far.h+edge,y2],[near.cx-near.h+edge,y1],[near.cx-near.h,y1]],stripe?"#fff2d3":"#b3544a");
  poly([[far.cx+far.h-edge,y2],[far.cx+far.h,y2],[near.cx+near.h,y1],[near.cx+near.h-edge,y1]],stripe?"#fff2d3":"#b3544a");
  if(Math.floor((dist+z1)/31)%2===0){for(const f of [-.33,.33]){
   const w=2+4*Math.pow(1-i/71,1.6);
   poly([[far.cx+far.h*f-w,y2],[far.cx+far.h*f+w,y2],[near.cx+near.h*f+w,y1],[near.cx+near.h*f-w,y1]],"#c7dce1ba");
  }}
  if(Math.floor((dist+z1)/90)!==Math.floor((dist+z2)/90)){
   roadside(z1,i/71,0,-1);roadside(z1,i/71,0,1);
  }
 }
 // overhead route signs / street labels
 const n=Math.floor((dist+260)/600),z=n*600-dist+440;
 if(z>70&&z<735){
  const d=z/735,r=roadAt(d),k=Math.pow(1-d,1.45);
  const w=230*k+28,h=54*k+12;
  box(r.cx-w/2,r.y-h-130*k,w,h,"#174c5c");ctx.strokeStyle="#a2d6d6";ctx.lineWidth=2;ctx.strokeRect(r.cx-w/2,r.y-h-130*k,w,h);
  txt(t.road,r.cx,r.y-130*k-h*.3,Math.max(9,28*k),"#e6fff7");
 }
}
function vehicle(x,y,s,color,variant,player=false){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 circ(0,3,82,22,"#08121db9");
 // rear tyres
 poly([[-69,-38],[-84,-36],[-87,3],[-69,13]],"#10161b");poly([[69,-38],[84,-36],[87,3],[69,13]],"#10161b");
 const grad=ctx.createLinearGradient(-60,-150,55,-15);grad.addColorStop(0,"#e9f3ff");grad.addColorStop(.18,color);grad.addColorStop(.62,color);grad.addColorStop(1,"#182734");
 const roof=variant===4?36:variant===0?32:43;
 poly([[-58,-14],[-65,-70],[-48,-134],[-roof,-173],[roof,-173],[48,-134],[65,-70],[58,-14],[49,5],[-49,5]],grad,"#c2dce2aa",2);
 poly([[-39,-145],[39,-145],[46,-87],[-46,-87]],"#152b3d","#7eb2c7",2);
 poly([[-33,-143],[33,-143],[38,-103],[-38,-103]],"#2d6077");
 poly([[-39,-83],[39,-83],[52,-57],[-52,-57]],"#173445");
 poly([[-57,-37],[57,-37],[57,-14],[-57,-14]],"#273848");
 poly([[-56,-36],[-26,-36],[-26,-17],[-56,-17]],"#ff444e");
 poly([[26,-36],[56,-36],[56,-17],[26,-17]],"#ff444e");
 poly([[-21,-19],[21,-19],[21,-4],[-21,-4]],"#ebeadb");
 txt("FC 064",0,-9,11,"#1e2b35");
 poly([[-62,-55],[62,-55],[73,-48],[-73,-48]],"#0b1e2b");
 if(variant===4||variant===1)poly([[-72,-118],[-82,-112],[-82,-106],[-61,-109],[61,-109],[82,-106],[82,-112],[72,-118]],"#182b35","#dbe9e966",1);
 stroke(-41,-139,-25,-152,"#e8f7f6b0",3);
 if(player){circ(-45,1,13,4,"#7cdded77");circ(45,1,13,4,"#7cdded77");}
 ctx.restore();
}
function renderCars(){
 const other=race.online?[...net.remotes.values()]:race.ai;
 const within=other.map(e=>({e,delta:e.progress-race.progress})).filter(x=>x.delta>=-12&&x.delta<715).sort((a,b)=>b.delta-a.delta);
 for(const {e,delta} of within){
  const d=clamp(delta/735,0,1),r=roadAt(d),scale=.18+Math.pow(1-d,1.48)*.78;
  vehicle(r.cx+e.lane*r.h*.65,r.y,scale,e.color||"#dce6ef",e.car??0,false);
 }
 // player's car fixed foreground in lane center of viewport, road moves around it
 vehicle(640,711,1.34,palette[save.color],cars[race.car].shape,true);
}
function drawWorld(now){
 if(!race)return;
 drawSky();drawRoad();renderCars();
 // simulated speed-tunnel motion
 if(race.speed>180){ctx.globalAlpha=clamp((race.speed-170)/350,0,.20);for(let i=0;i<12;i++){let x=i*127+Math.sin(now*.01+i)*53;stroke(x,700,x-130,355,"#ecf9ee",2);}ctx.globalAlpha=1;}
 if(race.boostTime>0){ctx.strokeStyle="#9ef3f2a1";ctx.lineWidth=12;ctx.strokeRect(4,4,1272,712);}
 // label for visual/geographic honesty
 box(472,10,336,25,"#081824ae");txt("MANDALAY-INSPIRED VIRTUAL CIRCUIT",640,28,15,"#f1f6f5");
 if(race.fuel<18){txt("LOW FUEL",640,124,42,"#ff9c74");}
}
function loop(now){
 const dt=Math.min((now-frameAt)/1000||.016,.046);frameAt=now;
 if(race){update(dt,now);drawWorld(now);}
 requestAnimationFrame(loop);
}
function touchBind(id,key){const b=$(id);let down=e=>{e.preventDefault();keys[key]=true;try{b.setPointerCapture(e.pointerId);}catch(_){}};let up=e=>{e.preventDefault();keys[key]=false;};b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);b.addEventListener("lostpointercapture",()=>{keys[key]=false;});}
["left","right","gas","brake"].forEach(k=>touchBind(k==="left"?"leftTouch":k==="right"?"rightTouch":k==="brake"?"brakeTouch":"gasTouch",k));
$("nitroTouch").addEventListener("pointerdown",e=>{e.preventDefault();useNitro();});
function keyHandler(e,down){
 if(["INPUT","TEXTAREA"].includes(e.target?.tagName))return;
 let k=e.key.toLowerCase(),c={"arrowleft":"left","a":"left","arrowright":"right","d":"right","arrowup":"gas","w":"gas","arrowdown":"brake","s":"brake"," ":"brake","shift":"nitro"}[k];
 if(c){e.preventDefault();if(c==="nitro"&&down&&!e.repeat)useNitro();else if(c!=="nitro")keys[c]=down;}
}
window.addEventListener("keydown",e=>keyHandler(e,true));window.addEventListener("keyup",e=>keyHandler(e,false));
window.addEventListener("blur",()=>{for(const k in keys)keys[k]=false;});
document.addEventListener("visibilitychange",()=>{if(document.hidden)for(const k in keys)keys[k]=false;});
document.querySelectorAll("[data-screen]").forEach(b=>b.onclick=()=>show(b.dataset.screen));
$("selectOrBuy").onclick=buyCar;$("quickRace").onclick=firstRace;$("exitRace").onclick=()=>{if(race?.online){toast("Online Race မှ ထွက်ပါပြီ။");}leaveRace();};
$("playerName").value=localStorage.getItem("fc_mdr_name")||"Mandalay Racer";
function cleanName(x){return String(x||"Racer").replace(/[<>]/g,"").slice(0,18)||"Racer";}
function nameNow(){const s=cleanName($("playerName").value);localStorage.setItem("fc_mdr_name",s);return s;}
function roomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s;}
function drawNetUI(){
 $("roomCode").textContent=net.room||"------";
 $("onlineBadge").textContent=net.connected?(net.host?"HOST READY":"CONNECTED"):net.joining?"CONNECTING":"OFFLINE";
 $("networkDot").style.background=net.connected?"#63d5bb":"#cdac70";
 $("netMini").textContent=net.connected?"Online Room · "+net.room:"Single-player ready";
 $("roster").innerHTML="";
 const all=[{name:net.localName||"You",id:"self"},...net.remotes.values()];
 for(const p of all){let d=document.createElement("div");d.textContent="🏎️ "+p.name+(p.id==="self"?" (YOU)":"");$("roster").append(d);}
 $("startOnline").disabled=!net.connected||!net.host||net.remotes.size===0;
}
function netStatus(s){$("roomStatus").textContent=s;drawNetUI();}
function netSend(obj,except=""){
 for(const [id,c] of net.connections)if(id!==except&&c.open){try{c.send(obj);}catch(_){}}
}
function packRoster(){return [{id:net.peer?.id,name:net.localName,color:palette[save.color],car:save.selected,progress:0,lane:0},...net.remotes.values()].map(p=>({id:p.id,name:p.name,color:p.color,car:p.car,progress:p.progress||0,lane:p.lane||0}));}
function applyRoster(people){const myid=net.peer?.id;net.remotes.clear();for(const p of people){if(p.id&&p.id!==myid){net.remotes.set(p.id,{...p,progress:p.progress||0,lane:p.lane||0});}}drawNetUI();}
function closeOnline(){for(const c of net.connections.values())try{c.close();}catch(_){};net.connections.clear();if(net.peer)try{net.peer.destroy();}catch(_){};net.peer=null;net.room="";net.connected=false;net.host=false;net.joining=false;net.remotes.clear();netStatus("Room ပိတ်ပြီးပါပြီ။");}
function onNet(conn){
 net.connections.set(conn.peer,conn);
 conn.on("open",()=>{
  if(net.host){net.remotes.set(conn.peer,{id:conn.peer,name:"Racer",progress:0,lane:0,color:"#ffc46d",car:0});netSend({type:"roster",players:packRoster()});netStatus("Connected "+(net.remotes.size+1)+" racers");}
  else {net.connected=true;netStatus("Room ချိတ်ဆက်အောင်မြင်ပါပြီ။ Host စတင်မည့်အချိန်ကို စောင့်ပါ။");conn.send({type:"hello",name:net.localName,color:palette[save.color],car:save.selected});}
 });
 conn.on("data",msg=>{
  if(!msg||typeof msg!=="object")return;
  if(msg.type==="hello"&&net.host){const p=net.remotes.get(conn.peer);if(p){p.name=cleanName(msg.name);p.car=clamp(Number(msg.car)||0,0,cars.length-1);p.color=palette.includes(msg.color)?msg.color:palette[0];}netSend({type:"roster",players:packRoster()});drawNetUI();}
  else if(msg.type==="roster"&&!net.host&&Array.isArray(msg.players))applyRoster(msg.players);
  else if(msg.type==="start"){save.track=clamp(msg.track|0,0,tracks.length-1);persist();startRace(true,save.track,msg.at);}
  else if(msg.type==="state"&&msg.id&&msg.id!==net.peer?.id){const p=net.remotes.get(msg.id);if(p){p.progress=clamp(Number(msg.progress)||0,0,10000);p.lane=clamp(Number(msg.lane)||0,-1.6,1.6);p.speed=clamp(Number(msg.speed)||0,0,400);p.car=clamp(msg.car|0,0,4);p.color=palette.includes(msg.color)?msg.color:palette[0];}if(net.host)netSend(msg,conn.peer);}
  else if(msg.type==="finish"){if(net.host)netSend({...msg,id:conn.peer},conn.peer);toast("🏁 ပြိုင်ဘက်တစ်ယောက် ပန်းဝင်ပါပြီ။");}
 });
 conn.on("close",()=>{net.connections.delete(conn.peer);net.remotes.delete(conn.peer);if(net.host){netSend({type:"roster",players:packRoster()});netStatus("Racer left · "+net.remotes.size+" guests");}else{netStatus("Host connection disconnected");net.connected=false;net.remotes.clear();}});
 conn.on("error",e=>netStatus("Network error: "+(e.message||e.type||"connection")));
}
function initPeer(onOpen,id){
 if(typeof window.Peer!=="function"){netStatus("PeerJS library မရပါ။ Internet / Network ကိုစစ်ပါ။");return;}
 net.joining=true;netStatus("WebRTC Signaling Server ချိတ်ဆက်နေပါပြီ...");
 try{net.peer=new window.Peer(id);net.peer.on("open",pid=>{net.joining=false;onOpen(pid);});net.peer.on("connection",c=>{if(net.host){if(net.connections.size>=4){c.on("open",()=>c.close());return;}onNet(c);}});net.peer.on("error",e=>{netStatus("PeerJS: "+(e.message||e.type||"unknown error"));toast("Online ချိတ်ဆက်မှု မအောင်မြင်ပါ။");});net.peer.on("disconnected",()=>netStatus("Signaling connection interrupted"));}
 catch(e){netStatus("WebRTC unsupported: "+e.message);}
}
$("hostBtn").onclick=()=>{closeOnline();net.host=true;net.localName=nameNow();net.room=roomCode();initPeer(()=>{net.connected=true;netStatus("Room "+net.room+" ဖွင့်ပြီးပါပြီ။ Code မျှဝေပါ။");}, "fc-mdr-"+net.room.toLowerCase());};
$("joinBtn").onclick=()=>{const code=$("roomInput").value.trim().toUpperCase().replace(/[^A-Z2-9]/g,"");if(code.length!==6){toast("၆ လုံး Room Code ထည့်ပါ။");return;}closeOnline();net.host=false;net.room=code;net.localName=nameNow();initPeer(()=>{const c=net.peer.connect("fc-mdr-"+net.room.toLowerCase(),{reliable:true});onNet(c);netStatus("Host ကို Join လုပ်နေပါပြီ...");},undefined);};
$("startOnline").onclick=()=>{if(!net.host||!net.connected||!net.remotes.size){toast("အနည်းဆုံး လူ ၂ ယောက် လိုပါတယ်။");return;}const at=Date.now()+3700;netSend({type:"start",track:save.track,at});startRace(true,save.track,at);};
$("leaveRoom").onclick=()=>{closeOnline();if(race?.online)leaveRace();};
$("roomInput").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,""));
function sendState(){if(!race?.online||!net.connected)return;const msg={type:"state",id:net.peer?.id,progress:race.progress,lane:race.lane,speed:race.speed,car:race.car,color:palette[save.color]};netSend(msg);}
window.__FC_RACING_DEBUG__={getState:()=>({screen:view.screen,save:JSON.parse(JSON.stringify(save)),race:race&&{progress:race.progress,speed:race.speed,lane:race.lane,started:race.started,finished:race.finished,elapsed:race.elapsed,position:currentPosition()},network:{room:net.room,connected:net.connected,peers:net.remotes.size}}),startSolo:()=>startRace(false,save.track),setKeys:obj=>Object.assign(keys,obj),forceRaceProgress:dist=>{if(race)race.progress=dist}};
drawGarage();drawTracks();drawNetUI();requestAnimationFrame(loop);
})();