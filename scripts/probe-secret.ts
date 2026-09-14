/**
 * npx tsx scripts/probe-secret.ts <wss://게임/ws> <secret>
 * 배포된 게임 서버의 LESSON_SHARED_SECRET 이 이 비밀과 같은지 본다 — 방을 만들지 않는다.
 * 없는 방 코드에 학생 티켓으로 join 하면: 서명이 맞을 때 「참가 코드를 확인해…」, 틀릴 때 「수업 인증이 … 맞지 않아요」.
 */
import WebSocket from 'ws';
import {signLessonTicket} from '../server/lesson-ticket.js';
const [url,secret]=process.argv.slice(2);
if(!url||!secret){console.error('사용: probe-secret.ts <wss://…/ws> <secret>');process.exit(1);}
const now=Math.floor(Date.now()/1000);
const ticket=signLessonTicket({cid:'probe',lid:'00',act:'probe',sub:'probe',name:'probe',role:'student',iat:now,exp:now+60},secret);
const origin=url.replace(/^ws/,'http').replace(/\/ws$/,'');
const ws=new WebSocket(url,{headers:{origin}});
ws.on('open',()=>ws.send(JSON.stringify({type:'join',code:'000000',ticket})));
ws.on('message',d=>{const m=JSON.parse(d.toString());const msg=String(m.message||'');console.log(m.type,msg);if(/참가 코드/.test(msg))console.log('→ 비밀 일치 (티켓 서명 통과, 방만 없음)');else if(/맞지 않아요/.test(msg))console.log('→ 비밀 불일치');ws.close();process.exit(0);});
ws.on('error',e=>{console.log('연결 실패',e.message);process.exit(1);});
setTimeout(()=>{console.log('timeout');process.exit(1);},20000);
