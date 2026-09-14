/**
 * npx tsx scripts/hold-student.ts <code> <sub> <name> [secs] [secret] [port]
 * 강의 앱 연동 방에 학생 티켓으로 들어가 경기가 시작되면 오른쪽으로 달리며 점프한다 (로컬 검증용 봇).
 * 환경변수 ACT=활동 id · CID · LID · DELAY=출발을 미루는 ms · IDLE=1 이면 움직이지 않는다(미완주자)
 */
import WebSocket from 'ws';
import {signLessonTicket} from '../server/lesson-ticket.js';
const [code,sub,name,secs='120',secret='local-dev',port='3210']=process.argv.slice(2);
if(!code||!sub){console.error('사용: hold-student.ts <code> <sub> <name>');process.exit(1);}
const delay=Number(process.env.DELAY||0),idle=process.env.IDLE==='1';
const now=Math.floor(Date.now()/1000);
const ticket=signLessonTicket({cid:process.env.CID||'cls-l',lid:process.env.LID||'03',act:process.env.ACT||'',sub,name:name||sub,role:'student',iat:now,exp:now+3600},secret);
const ws=new WebSocket(`ws://localhost:${port}/ws`,{headers:{origin:`http://localhost:${port}`}});
let seq=0,phase='',timer:NodeJS.Timeout|null=null;
ws.on('open',()=>ws.send(JSON.stringify({type:'join',code,ticket})));
ws.on('message',d=>{let m=JSON.parse(d.toString());
 if(m.type==='joined')console.log(`${name}(${m.id}) 참가 · 방 ${m.code}`);
 if(m.type==='error')console.log('error:',m.message);
 /* 경기 중 방송은 압축 프레임(type:'frame')으로 온다 — running 으로 친다 */
 if(m.type==='frame')m={type:'state',state:{phase:'running'}};
 if(m.type==='state'){const s=m.state;if(s.phase!==phase){phase=s.phase;console.log(`${name}: ${phase}`);
  if(phase==='running'&&!timer&&!idle)setTimeout(()=>{timer=setInterval(()=>{seq++;ws.send(JSON.stringify({type:'input',left:false,right:true,jump:seq%6===0,seq}));},50);},delay);
  if(phase==='results'){if(timer)clearInterval(timer);const me=s.result?.players.find((p:{id:string})=>p.id===sub);console.log(`${name}: 결과 rank=${me?.rank} status=${me?.status} · selected=${JSON.stringify(s.result?.selectedIds)} · ${s.result?.selectionReason} · ${s.result?.endReason}`);setTimeout(()=>process.exit(0),500);}}}
});
setTimeout(()=>{console.log(`${name}: ${secs}초 지나 나감`);process.exit(0);},Number(secs)*1000);
