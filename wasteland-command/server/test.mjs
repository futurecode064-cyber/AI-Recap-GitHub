import {test} from 'node:test';import assert from 'node:assert/strict';import {createGameServer} from './server.mjs';import {newGame,command,step} from './simulation.mjs';
test('10 real HTTP clients: rooms, auth, readiness, commands, idempotency, reconnect and victory',async()=>{
 const {server,rooms}=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,body,token)=>{const r=await fetch(base+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 try{
 assert.equal((await fetch(base+'/')).status,200);assert.match(await (await fetch(base+'/config.js')).text(),/location.origin/);
 assert.equal((await call('create',{name:'host',capacity:11})).status,400);
 const host=await call('create',{name:'host',capacity:10}),code=host.room.code;assert.equal(host.status,200);
 assert.equal((await call('start',{},host.token)).status,400);
 const players=[host,...await Promise.all(Array.from({length:9},(_,i)=>call('join',{name:'p'+i,code})))];assert(players.every(p=>p.status===200));assert.equal(new Set(players.map(p=>p.playerId)).size,10);
 assert.equal((await call('join',{name:'extra',code})).status,400);
 assert.equal((await call('state')).status,401);
 assert.equal((await call('start',{},players[1].token)).status,400);
 await Promise.all(players.map(p=>call('ready',{ready:true},p.token)));
 const started=await call('start',{},host.token);assert.equal(started.room.state.players.length,10);assert.equal(started.room.phase,'playing');
 const snapshots=await Promise.all(players.map(p=>call('state',undefined,p.token)));assert(snapshots.every(s=>s.room.code===code&&s.room.state.entities.length===80));
 const state=rooms.get(code).state,unit=state.entities.find(e=>e.team===0&&e.kind==='infantry');
 assert.equal((await call('command',{seq:1,command:{type:'move',ids:[unit.id],x:1000,y:1000}},players[1].token)).status,400);
 const before=state.players[0].oil;assert.equal((await call('command',{seq:1,command:{type:'train',kind:'infantry'}},host.token)).status,200);
 const after=state.players[0].oil;assert(before-after>=119&&before-after<=120);await call('command',{seq:1,command:{type:'train',kind:'infantry'}},host.token);assert(state.players[0].oil-after<2);
 const hq=state.entities.find(e=>e.team===0&&e.kind==='hq');assert.equal((await call('command',{seq:2,command:{type:'build',kind:'factory',x:hq.x+240,y:hq.y}},host.token)).status,200);
 assert.equal((await call('command',{seq:3,command:{type:'move',ids:[unit.id],x:-99,y:100}},host.token)).status,400);
 assert.equal((await call('command',{seq:4,command:{type:'move',ids:[unit.id],x:1500,y:1500}},host.token)).status,200);
 const oldX=unit.x,oldY=unit.y;for(let i=0;i<40;i++)step(state);assert(Math.hypot(unit.x-oldX,unit.y-oldY)>100);assert(state.entities.filter(e=>e.team===0&&e.kind==='infantry').length===5);
 assert.equal((await call('state',undefined,host.token)).playerId,host.playerId);
 for(const e of state.entities)if(e.kind==='hq'&&e.team!==0)e.hp=0;step(state);assert.equal(state.winner,0);assert(state.ended);
 const forbidden=await fetch(base+'/health',{headers:{Origin:'https://untrusted.invalid'}});assert.equal(forbidden.status,403);assert.equal((await fetch(base+'/health',{headers:{Origin:'invalid'}})).status,403);assert.equal((await fetch(base+'/health')).status,200);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('economy, bounds, combat and simultaneous destruction',()=>{const s=newGame([{id:'a',name:'A'},{id:'b',name:'B'}]);assert.throws(()=>command(s,0,{type:'build',kind:'tank',x:100,y:100}));s.players[0].oil=0;assert.throws(()=>command(s,0,{type:'train',kind:'tank'}));const own=s.entities.find(e=>e.team===0&&e.kind==='infantry'),enemy=s.entities.find(e=>e.team===1&&e.kind==='infantry');enemy.x=own.x+30;enemy.y=own.y;command(s,0,{type:'attack',ids:[own.id],target:enemy.id});step(s);assert(enemy.hp<enemy.maxHp);for(const e of s.entities)if(e.kind==='hq')e.hp=0;step(s);assert(s.ended);assert.equal(s.winner,null);});
