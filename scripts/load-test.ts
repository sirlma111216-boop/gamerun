import {decodeFrame} from '../shared/wire.js';
import {WebSocket} from 'ws';
import {performance} from 'node:perf_hooks';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {DEFAULT_RULES,type Snapshot} from '../shared/types.js';
import {createMap} from '../shared/maps.js';
import {botInput} from './bot.js';
const url=process.env.TEST_WS||'ws://localhost:3000/ws';const clients:WebSocket[]=[];const errors:string[]=[];let hostState:Snapshot|null=null;let states=0;let bytes=0;let code='';const rtts:number[]=[];
async function client(message:object,onMessage:(m:any,ws:WebSocket)=>void=()=>{}){return await new Promise<WebSocket>((resolve,reject)=>{let previous:Snapshot|null=null;const ws=new WebSocket(url);clients.push(ws);ws.on('open',()=>ws.send(JSON.stringify(message)));ws.on('error',reject);ws.on('message',raw=>{bytes+=Buffer.byteLength(raw.toString());let m=JSON.parse(raw.toString());if(m.type==='state'||m.type==='frame'){const decoded=decodeFrame(m,previous);if(decoded){previous=decoded;m={type:'state',state:decoded};}}if(m.type==='error'){errors.push(m.message);reject(Error(m.message));}if(m.type==='joined'){if(m.role==='host')code=m.code;resolve(ws);}if(m.type==='state')states++;if(m.type==='pong')rtts.push(performance.now()-m.at);onMessage(m,ws);});});}
const host=await client({type:'create',map:5,activityId:'load-test-only',testOnly:true,rules:{...DEFAULT_RULES,duration:30,count:30}},m=>{if(m.type==='state')hostState=m.state;});
const map=createMap(5,30);let timers:ReturnType<typeof setInterval>[]=[];
for(let i=0;i<30;i++){const id=`load-bot-${i}`;let state:Snapshot|null=null;let seq=0;const ws=await client({type:'join',code,id,name:`개발용 봇 ${i+1}`,bot:true},m=>{if(m.type==='state')state=m.state;});ws.send(JSON.stringify({type:'ready',ready:true}));timers.push(setInterval(()=>{const s=state as Snapshot|null;const p=s?.players.find(p=>p.id===id);if(p&&s?.phase==='running')ws.send(JSON.stringify({type:'input',...botInput(p,map,s.tick+1),seq:++seq}));},33));}
await new Promise(r=>setTimeout(r,300));host.send(JSON.stringify({type:'start'}));const started=performance.now();
const ping=setInterval(()=>host.send(JSON.stringify({type:'ping',at:performance.now()})),1000);
try{
 for(let sec=0;sec<160;sec++){await new Promise(r=>setTimeout(r,1000));const s=hostState as Snapshot|null;if(sec%10===0)console.log(`30개 실제 WebSocket 접속 · ${sec}초 · 서버 틱 ${s?.tick}`);if(s?.phase==='results')break;}
 const state=hostState as Snapshot|null;assert.equal(state?.phase,'results');assert.equal(state?.players.length,30);assert.equal(state?.result?.selectedIds.length,0);assert.ok(state?.result?.players.every(p=>p.bot));assert.equal(errors.length,0);assert.equal(state?.players.filter(p=>p.status==='finished').length,30);rtts.sort((a,b)=>a-b);
 const health=await fetch(url.replace('ws:','http:').replace('/ws','/health')).then(r=>r.json());const result={clientType:'30 labelled development bots over real WebSocket connections; not 30 human devices',durationMs:performance.now()-started,states,bytes,rttMedianMs:rtts[Math.floor(rtts.length*.5)],rttP95Ms:rtts[Math.floor(rtts.length*.95)],finished:state?.players.filter(p=>p.status==='finished').length,errors,server:health};mkdirSync('test-results',{recursive:true});writeFileSync('test-results/load.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{timers.forEach(clearInterval);clearInterval(ping);clients.forEach(ws=>ws.close());}
