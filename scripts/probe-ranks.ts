/**
 * npx tsx scripts/probe-ranks.ts <wss://게임/ws> <secret>
 * 배포된 게임 서버가 등수 방식을 아는지 본다 — 방을 만들지 않는다.
 * 교사 티켓으로 일부러 틀린 등수([0])를 보내면: 새 서버는 「발표 등수는 …」, 옛 서버는 「도착·꼴찌 방식과 …」로 거절한다.
 */
import WebSocket from 'ws';
import {signLessonTicket} from '../server/lesson-ticket.js';
const [url,secret]=process.argv.slice(2);
if(!url||!secret){console.error('사용: probe-ranks.ts <wss://…/ws> <secret>');process.exit(1);}
const now=Math.floor(Date.now()/1000);
const ticket=signLessonTicket({cid:'probe',lid:'00',act:'probe-ranks',sub:'probe-teacher',name:'probe',role:'teacher',iat:now,exp:now+60},secret);
const origin=url.replace(/^ws/,'http').replace(/\/ws$/,'');
const ws=new WebSocket(url,{headers:{origin}});
ws.on('open',()=>ws.send(JSON.stringify({type:'create',ticket,map:2,rules:{mode:'ranks',ranks:[0],timeLimit:60,duration:30,lives:0,count:1,text:'x'}})));
ws.on('message',d=>{const m=JSON.parse(d.toString());const msg=String(m.message||'');console.log(m.type,msg);if(/발표 등수/.test(msg))console.log('→ 등수 방식을 아는 서버 (2.2)');else if(/도착·꼴찌/.test(msg))console.log('→ 옛 서버 — 등수 방식 없음');else if(m.type==='joined')console.log('!! 방이 만들어졌다 — 검증 실패(틀린 규칙을 받았다)');ws.close();process.exit(0);});
ws.on('error',e=>{console.log('연결 실패',e.message);process.exit(1);});
setTimeout(()=>{console.log('timeout');process.exit(1);},20000);
