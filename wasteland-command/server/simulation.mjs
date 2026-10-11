export const W=3000,H=3000;
export const TYPES={hq:{hp:2400,cost:0},barracks:{hp:1000,cost:500},factory:{hp:1400,cost:800},rig:{hp:700,cost:600},turret:{hp:850,cost:500,damage:24,range:260},infantry:{hp:110,cost:120,speed:90,damage:12,range:150,build:3},buggy:{hp:240,cost:300,speed:155,damage:18,range:180,build:5},tank:{hp:650,cost:700,speed:65,damage:50,range:240,build:9}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function entity(s,kind,team,x,y){const d=TYPES[kind]; const e={id:s.nextId++,kind,team,x,y,hp:d.hp,maxHp:d.hp,cooldown:0,queue:[],order:null};s.entities.push(e);return e;}
export function newGame(players){const s={tick:0,time:0,nextId:1,entities:[],players:players.map((p,i)=>({id:p.id,name:p.name,team:i,oil:2200,alive:true})),winner:null,ended:false};s.players.forEach((p,i)=>{const a=2*Math.PI*i/players.length-Math.PI/2,x=1500+1120*Math.cos(a),y=1500+1120*Math.sin(a);entity(s,'hq',i,x,y);entity(s,'barracks',i,x+90,y+80);entity(s,'rig',i,x-85,y+50);for(let j=0;j<4;j++)entity(s,'infantry',i,x+(j-1.5)*30,y+150);entity(s,'buggy',i,x+100,y+150);});return s;}
export function command(s,team,c){const p=s.players[team];if(!p?.alive||s.ended)throw Error('Player cannot issue orders');if(!c||typeof c!=='object')throw Error('Invalid command');
 if(c.type==='move'||c.type==='attack'||c.type==='hold'){
 if(!Array.isArray(c.ids)||c.ids.length>60)throw Error('Invalid selection');
 const selected=c.ids.map(id=>s.entities.find(e=>e.id===id));if(!selected.length||selected.some(e=>!e||e.team!==team||!TYPES[e.kind].speed))throw Error('Select your own units');
 if(c.type==='move'&&(!Number.isFinite(c.x)||!Number.isFinite(c.y)||c.x<30||c.y<30||c.x>W-30||c.y>H-30))throw Error('Invalid destination');
 const target=c.type==='attack'?s.entities.find(e=>e.id===c.target):null;if(c.type==='attack'&&(!target||target.team===team))throw Error('Invalid target');
 selected.forEach((e,i)=>e.order=c.type==='hold'?{type:'hold'}:c.type==='attack'?{type:'attack',target:target.id}:{type:'move',x:Math.max(30,Math.min(W-30,c.x+(i%5-2)*22)),y:Math.max(30,Math.min(H-30,c.y+Math.floor(i/5)*22))});return;
 }
 if(c.type==='build'){
 if(!['barracks','factory','rig','turret'].includes(c.kind))throw Error('Invalid building');
 if(!Number.isFinite(c.x)||!Number.isFinite(c.y)||c.x<80||c.y<80||c.x>W-80||c.y>H-80)throw Error('Invalid site');
 const site={x:c.x,y:c.y};if(!s.entities.some(e=>e.team===team&&!TYPES[e.kind].speed&&dist(e,site)<400))throw Error('Build near your base');
 if(s.entities.some(e=>!TYPES[e.kind].speed&&dist(e,site)<105))throw Error('Site occupied');
 if(s.entities.filter(e=>e.team===team&&!TYPES[e.kind].speed).length>=20)throw Error('Building limit reached');
 if(p.oil<TYPES[c.kind].cost)throw Error('Insufficient oil');p.oil-=TYPES[c.kind].cost;entity(s,c.kind,team,c.x,c.y);return;
 }
 if(c.type==='train'){
 if(!['infantry','buggy','tank'].includes(c.kind))throw Error('Invalid unit');
 const producer=s.entities.find(e=>e.team===team&&e.kind===(c.kind==='infantry'?'barracks':'factory')&&e.queue.length<5);if(!producer)throw Error('Build a production building or wait for queue space');
 const count=s.entities.filter(e=>e.team===team&&TYPES[e.kind].speed).length+s.entities.filter(e=>e.team===team).reduce((n,e)=>n+e.queue.length,0);if(count>=50)throw Error('50 unit limit reached');
 if(p.oil<TYPES[c.kind].cost)throw Error('Insufficient oil');p.oil-=TYPES[c.kind].cost;producer.queue.push({kind:c.kind,left:TYPES[c.kind].build});return;
 }throw Error('Unknown command');
}
export function step(s,dt=.1){if(s.ended)return;s.tick++;s.time+=dt;
 const living=s.entities.filter(e=>e.hp>0);for(const e of living){if(!s.players[e.team].alive)continue;const d=TYPES[e.kind];e.cooldown=Math.max(0,e.cooldown-dt);
 if(e.kind==='rig')s.players[e.team].oil+=12*dt;
 if(e.queue.length){e.queue[0].left-=dt;if(e.queue[0].left<=0){entity(s,e.queue.shift().kind,e.team,e.x,e.y+90);}}
 if(!d.damage)continue;let target=e.order?.type==='attack'?living.find(v=>v.id===e.order.target&&v.hp>0):null;
 if(!target&&e.order?.type!=='move'){let near=d.range;for(const other of living)if(other.team!==e.team&&other.hp>0&&s.players[other.team].alive){const n=dist(e,other);if(n<near){near=n;target=other;}}}
 if(target&&dist(e,target)<=d.range){if(e.cooldown<=0){target.hp-=d.damage;e.cooldown=.8;}continue;}
 let goal=target|| (e.order?.type==='move'?e.order:null);if(d.speed&&goal){const n=dist(e,goal);if(n>8){const v=Math.min(n,d.speed*dt);e.x+=(goal.x-e.x)*v/n;e.y+=(goal.y-e.y)*v/n;}else if(!target)e.order=null;}
 }
 s.entities=s.entities.filter(e=>e.hp>0);for(const p of s.players)if(p.alive&&!s.entities.some(e=>e.team===p.team&&e.kind==='hq')){p.alive=false;s.entities=s.entities.filter(e=>e.team!==p.team);}
 const alive=s.players.filter(p=>p.alive);if(alive.length<=1){s.ended=true;s.winner=alive.length?alive[0].team:null;}
}
