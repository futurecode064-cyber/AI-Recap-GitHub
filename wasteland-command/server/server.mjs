import http from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname,dirname} from 'node:path';import {randomBytes} from 'node:crypto';import {fileURLToPath} from 'node:url';import {newGame,command,step} from './simulation.mjs';
export function createGameServer({origin='http://localhost:4173',maxRooms=50}={}){
 const publicRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../dist/online');
 const rooms=new Map(),sessions=new Map(),rates=new Map();let clock;
 const token=()=>randomBytes(24).toString('hex');
 function roomView(r){return {code:r.code,phase:r.phase,capacity:r.capacity,host:r.host,players:r.players.map(p=>({id:p.id,name:p.name,ready:p.ready,connected:Date.now()-p.seen<15000})),state:r.state};}
 const server=http.createServer(async(req,res)=>{const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};let sameOrigin=false;try{sameOrigin=Boolean(req.headers.origin&&new URL(req.headers.origin).host===req.headers.host);}catch{res.writeHead(403,headers);return res.end(JSON.stringify({error:'Invalid origin'}));}if(req.headers.origin===origin||sameOrigin){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin';headers['Access-Control-Allow-Headers']='Content-Type,Authorization';headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';}const send=(code,data)=>{res.writeHead(code,headers);res.end(JSON.stringify(data));};
 if(req.headers.origin&&req.headers.origin!==origin&&!sameOrigin)return send(403,{error:'Origin not allowed'});if(req.method==='OPTIONS')return send(204,{});
 const path=new URL(req.url,'http://localhost').pathname;
 if(req.method==='GET'&&!path.startsWith('/api/')&&path!=='/health'){
  if(path==='/config.js'){res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});return res.end('window.RTS_SERVER_URL = location.origin;');}
  const file=resolve(publicRoot,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(publicRoot+'/'))return send(403,{error:'Forbidden'});
  try{const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png'})[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});return res.end(data);}catch{return send(404,{error:'Not found'});}
 }
 if(path==='/health')return send(200,{ok:true,protocol:1,maxPlayers:10});
 const ip=req.socket.remoteAddress;const now=Date.now();let rate=rates.get(ip);if(!rate||now-rate.t>1000){rate={t:now,n:0};rates.set(ip,rate);}if(++rate.n>150)return send(429,{error:'Too many requests'});
 try{let body={};if(req.method==='POST'){let n=0,parts=[];for await(const chunk of req){n+=chunk.length;if(n>8192)throw Error('Request too large');parts.push(chunk);}body=JSON.parse(Buffer.concat(parts).toString()||'{}');}
 const key=req.headers.authorization?.replace(/^Bearer /,'');const session=key?sessions.get(key):null;
 if(path==='/api/create'||path==='/api/join'){
 if(req.method!=='POST')throw Error('POST required');if(typeof body.name!=='string'||!body.name.trim()||body.name.length>24)throw Error('Enter a name of 1–24 characters');
 let r;if(path==='/api/create'){if(rooms.size>=maxRooms)throw Error('Server is full');if(!Number.isInteger(body.capacity)||body.capacity<2||body.capacity>10)throw Error('Choose 2–10 players');let code;do{code=randomBytes(4).toString('hex').toUpperCase();}while(rooms.has(code));r={code,capacity:body.capacity,players:[],phase:'lobby',state:null,host:null,updated:now};rooms.set(code,r);}else{r=rooms.get(String(body.code).toUpperCase());if(!r)throw Error('Room not found');if(r.phase!=='lobby'||r.players.length>=r.capacity)throw Error('Room full or match already started');}
 const p={id:randomBytes(8).toString('hex'),name:body.name.trim(),ready:false,seen:now,seq:0};r.players.push(p);r.host??=p.id;r.updated=now;const auth=token();sessions.set(auth,{room:r.code,player:p.id});return send(200,{token:auth,playerId:p.id,room:roomView(r)});
 }
 if(!session)return send(401,{error:'Session expired; join a room again'});const r=rooms.get(session.room),p=r?.players.find(p=>p.id===session.player);if(!r||!p)return send(401,{error:'Room expired'});p.seen=now;r.updated=now;
 if(path==='/api/state'&&req.method==='GET')return send(200,{room:roomView(r),playerId:p.id});
 if(req.method!=='POST')throw Error('POST required');
 if(path==='/api/ready'){if(r.phase!=='lobby')throw Error('Match already started');p.ready=Boolean(body.ready);}
 else if(path==='/api/start'){if(p.id!==r.host)throw Error('Only host may start');if(r.phase!=='lobby'||r.players.length<2||r.players.some(p=>!p.ready||now-p.seen>15000))throw Error('At least two connected, ready players required');r.state=newGame(r.players);r.phase='playing';}
 else if(path==='/api/command'){if(r.phase!=='playing')throw Error('No active match');if(!Number.isSafeInteger(body.seq)||body.seq<1)throw Error('Invalid sequence');if(body.seq>p.seq){command(r.state,r.players.indexOf(p),body.command);p.seq=body.seq;}return send(200,{accepted:p.seq});}
 else if(path==='/api/leave'){if(r.phase==='lobby'){r.players=r.players.filter(v=>v!==p);if(r.host===p.id)r.host=r.players[0]?.id;}else{const team=r.players.indexOf(p);r.state.entities=r.state.entities.filter(e=>e.team!==team);r.state.players[team].alive=false;}sessions.delete(key);if(!r.players.length)rooms.delete(r.code);return send(200,{ok:true});}
 else throw Error('Unknown endpoint');send(200,{room:roomView(r),playerId:p.id});
 }catch(e){send(400,{error:e.message});}});
 clock=setInterval(()=>{const now=Date.now();for(const [code,r]of rooms){if(now-r.updated>30*60*1000){rooms.delete(code);for(const [k,s]of sessions)if(s.room===code)sessions.delete(k);continue;}if(r.phase==='playing'){step(r.state,.1);if(r.state.ended)r.phase='ended';}}for(const [ip,r]of rates)if(now-r.t>60000)rates.delete(ip);},100);
 server.on('close',()=>clearInterval(clock));return {server,rooms};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {server}=createGameServer({origin:process.env.ALLOWED_ORIGIN||'http://localhost:4173'});server.listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log('RTS server listening'));}
