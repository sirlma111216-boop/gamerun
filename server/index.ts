import {encodeState} from '../shared/wire.js';
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {networkInterfaces} from 'node:os';
import {performance} from 'node:perf_hooks';
import {randomInt,randomUUID} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {Room} from './room.js';
import {DT} from '../shared/physics.js';
const production=process.env.NODE_ENV==='production'||process.argv[1].endsWith('.js');
const port=Number(process.env.PORT||3000);const rooms=new Map<string,Room>();
const vite=production?null:await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const addresses=Object.values(networkInterfaces()).flat().filter(v=>v&&v.family==='IPv4'&&!v.internal).map(v=>`http://${v!.address}:${port}`);
const metrics={ticks:0,totalMs:0,maxMs:0,maxPlayers:0};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/',`http://${req.headers.host}`);
 if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,rooms:rooms.size,metrics}));return;}
 if(url.pathname==='/api/local'){const localRequest=['localhost','127.0.0.1','[::1]'].includes(url.hostname)||addresses.some(a=>new URL(a).hostname===url.hostname);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({addresses:localRequest?addresses:[]}));return;}
 if(vite){vite.middlewares(req,res);return;}
 try {const base=path.resolve('dist');const target=path.resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!target.startsWith(base+path.sep))throw Error('path');const info=await stat(target);if(!info.isFile())throw Error('file');res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.end(await readFile(target));}catch{res.statusCode=404;res.end('Not found');}
});
const wss=new WebSocketServer({noServer:true,maxPayload:8192});
server.on('upgrade',(req,socket,head)=>{if(new URL(req.url||'/',`http://${req.headers.host}`).pathname!=='/ws')return;const origin=req.headers.origin;const allowed=process.env.ALLOWED_ORIGINS?.split(',');if(origin&&(allowed?!allowed.includes(origin):new URL(origin).host!==req.headers.host)){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
type Session={room:Room;role:'host'|'player';id:string};const sessions=new Map<WebSocket,Session>();
function send(ws:WebSocket,data:unknown){if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<500000)ws.send(typeof data==='string'?data:JSON.stringify(data));}
function textValue(v:unknown,max:number){return typeof v==='string'?v.trim().slice(0,max):'';}
const alive=new WeakSet<WebSocket>();
wss.on('connection',ws=>{
 alive.add(ws);ws.on('pong',()=>alive.add(ws));let bucket=0;let bucketAt=Date.now();
 ws.on('message',raw=>{try{
  if(Date.now()-bucketAt>1000){bucket=0;bucketAt=Date.now();}if(++bucket>100)throw Error('입력이 너무 많아요. 잠시 후 다시 시도해 주세요.');
  const m=JSON.parse(raw.toString());if(!m||typeof m!=='object')throw Error('잘못된 메시지입니다.');
  let s=sessions.get(ws);
  if(m.type==='create'){
   if(s)throw Error('이미 방에 연결되어 있어요.');if(rooms.size>=100)throw Error('서버의 방이 가득 찼습니다.');let code;do{code=String(randomInt(100000,1000000));}while(rooms.has(code));const room=new Room(code,textValue(m.activityId,100),Number(m.map||1),m.rules);room.testOnly=m.testOnly===true&&(!production||process.env.ENABLE_TEST_ROOMS==='true');rooms.set(code,room);s={room,role:'host',id:'host'};sessions.set(ws,s);send(ws,{type:'joined',role:'host',id:'host',token:room.hostToken,code});
  }else if(m.type==='join'){
   if(s)throw Error('이미 연결되어 있어요.');const room=rooms.get(textValue(m.code,6));if(!room)throw Error('참가 코드를 확인해 주세요. 서버를 다시 켰다면 새 방을 만들어야 해요.');
   if(m.role==='host'){if(m.token!==room.hostToken)throw Error('교사 권한이 없습니다.');s={room,role:'host',id:'host'};room.hostConnected=true;}
   else {const name=textValue(m.name,18);if(!name)throw Error('이름을 입력해 주세요.');const id=textValue(m.id,100)||randomUUID();const joined=room.join(name,id,m.token);if(m.bot===true&&room.testOnly)joined.player.bot=true;s={room,role:'player',id};send(ws,{type:'joined',role:'player',id,token:joined.token,code:room.code});}
   for(const [old,session] of sessions)if(session.room===room&&session.id===s.id&&session.role===s.role){sessions.delete(old);old.close(4001,'다른 화면에서 재접속했습니다.');}
   sessions.set(ws,s);if(s.role==='host')send(ws,{type:'joined',role:'host',id:'host',token:room.hostToken,code:room.code});
  }else {
   if(!s)throw Error('먼저 방에 참가해 주세요.');const room=s.room;
   if(m.type==='input'&&s.role==='player'){if(typeof m.left!=='boolean'||typeof m.right!=='boolean'||typeof m.jump!=='boolean')throw Error('잘못된 입력입니다.');room.input(s.id,{left:m.left,right:m.right,jump:m.jump},m.seq);}
   else if(m.type==='ready'&&s.role==='player'&&room.phase==='lobby')room.players.get(s.id)!.ready=m.ready===true;
   else if(m.type==='start'&&s.role==='player'){room.start();}
   else if(['settings','start','end','restart'].includes(m.type)){if(s.role!=='host')throw Error('교사만 조작할 수 있어요.');if(m.type==='settings')room.settings(Number(m.map),m.rules);if(m.type==='start')room.start();if(m.type==='end')room.end('teacher');if(m.type==='restart')room.restart();}
   else if(m.type==='ping')send(ws,{type:'pong',at:m.at});
  }
  if(s){s.room.updated=Date.now();if(m.type!=='input'&&m.type!=='ping')send(ws,{type:'state',state:s.room.snapshot()});}
 }catch(e){send(ws,{type:'error',message:e instanceof Error?e.message:'요청을 처리하지 못했어요.'});}});
 ws.on('error',()=>{});ws.on('close',()=>{const s=sessions.get(ws);sessions.delete(ws);if(!s)return;if(s.role==='host'){s.room.hostConnected=false;s.room.hostLastSeen=Date.now();}else {const p=s.room.players.get(s.id);if(p){p.connected=false;s.room.inputs.delete(s.id);}}});
});
let last=performance.now(),acc=0,frame=0;
setInterval(()=>{const now=performance.now();acc+=Math.min(now-last,250);last=now;const started=performance.now();while(acc>=1000*DT){for(const room of rooms.values())room.advance();acc-=1000*DT;frame++;if(frame%3===0){const snapshots=new Map<Room,unknown>();for(const [ws,s] of sessions){if(!snapshots.has(s.room))snapshots.set(s.room,JSON.stringify(encodeState(s.room.snapshot())));send(ws,snapshots.get(s.room));}}}const ms=performance.now()-started;metrics.ticks++;metrics.totalMs+=ms;metrics.maxMs=Math.max(metrics.maxMs,ms);metrics.maxPlayers=Math.max(metrics.maxPlayers,[...rooms.values()].reduce((n,r)=>n+r.players.size,0));},8);
setInterval(()=>{for(const ws of wss.clients){if(!alive.has(ws)){ws.terminate();continue;}alive.delete(ws);ws.ping();}for(const [code,r] of rooms)if((!r.hostConnected&&Date.now()-r.updated>2*60*60*1000)||Date.now()-r.created>12*60*60*1000){for(const [ws,s] of sessions)if(s.room===r)ws.close(4000,'방 보관 시간이 지났어요.');rooms.delete(code);}},30000);
server.listen(port,'0.0.0.0',()=>console.log(`루미 런: http://localhost:${port}\n같은 Wi-Fi: ${addresses.join(', ')}\n게임 화면과 WebSocket 서버가 함께 실행 중입니다.`));
