/**
 * npx tsx scripts/peek-room.ts <code> [secret] [port]
 * 강의 앱 연동 방에 학생 티켓으로 잠깐 들어가 지금 방에 누가 있는지 본다 (로컬 검증용).
 */
import WebSocket from 'ws';
import {signLessonTicket} from '../server/lesson-ticket.js';
const [code,secret='local-dev',port='3210']=process.argv.slice(2);
if(!code){console.error('방 코드를 주세요');process.exit(1);}
const now=Math.floor(Date.now()/1000);
const ticket=signLessonTicket({cid:'cls-l',lid:'03',act:process.env.ACT||'',sub:'peek',name:'peek',role:'student',iat:now,exp:now+300},secret);
const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`,{headers:{origin:`http://localhost:${port}`}});
ws.on('open',()=>ws.send(JSON.stringify({type:'join',code,ticket})));
ws.on('message',d=>{const m=JSON.parse(d.toString());if(m.type==='error'){console.log('error:',m.message);ws.close();process.exit(0);}if(m.type==='state'){const s=m.state;console.log(JSON.stringify({code:s.code,phase:s.phase,activityId:s.activityId,host:s.hostConnected,players:s.players.map((p:{id:string;name:string;connected:boolean;status:string})=>`${p.name}(${p.id})${p.connected?'':' 끊김'}`)}));ws.close();process.exit(0);}});
setTimeout(()=>{console.log('timeout');process.exit(1);},5000);
