/**
 * npx tsx scripts/lesson-check.ts
 *
 * 강의 앱 연동을 실제 서버로 검증한다 — 서버를 따로 띄우고(PORT 3111) WebSocket 으로 교사·학생·침입자 역할을 흉내 낸다.
 *   1 교사 티켓으로 방 생성 → 같은 티켓으로 다시 생성하면 새 방이 아니라 재접속(reused)
 *   2 학생 티켓으로 참가 → id·name 은 티켓 값 (브라우저가 보낸 값은 무시)
 *   3 티켓 없이 / 다른 활동 티켓으로 / 만료 티켓으로 참가 → 거절
 *   4 학생이 start → 거절(교사만 시작) · 학생이 end → 거절
 *   5 교사 start → 교사 end → 결과 webhook 이 서명과 함께 수신되고 서명이 맞는다 · 같은 경기는 한 번만
 *   6 단독 방(티켓 없음)은 예전처럼 만들고 들어간다 · 학생 티켓으로 단독 방 참가는 거절
 */
import {spawn} from 'node:child_process';
import http from 'node:http';
import {createHmac} from 'node:crypto';
import WebSocket from 'ws';
import {signLessonTicket} from '../server/lesson-ticket.js';
const SECRET='check-secret';const PORT=3111;const HOOK=3999;
const now=Math.floor(Date.now()/1000);
const ticket=(o:Partial<Parameters<typeof signLessonTicket>[0]>)=>signLessonTicket({cid:'cls-1',lid:'03',act:'cls-1:03:run1',sub:'stu-1',name:'민준',role:'student',iat:now,exp:now+300,...o},SECRET);
const received:Array<{body:string;sig:string}>=[];
const hook=http.createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{received.push({body,sig:String(req.headers['x-lumi-signature']||'')});res.end('ok');});});
await new Promise<void>(r=>hook.listen(HOOK,r));
const server=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:String(PORT),LESSON_SHARED_SECRET:SECRET,LESSON_RESULT_URL:`http://127.0.0.1:${HOOK}/result`,NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<40;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}/health`);if(r.ok)break;}catch{}await wait(250);}
type Msg=Record<string,unknown>;
function client(){const ws=new WebSocket(`ws://127.0.0.1:${PORT}/ws`,{headers:{origin:`http://127.0.0.1:${PORT}`}});const queue:Msg[]=[];const waiters:Array<(m:Msg)=>void>[]=[];ws.on('message',d=>{const m=JSON.parse(d.toString());if(m.type==='frame'||m.type==='state')return;const w=waiters.shift();if(w)w[0](m);else queue.push(m);});
 return {ws,open:()=>new Promise<void>(r=>ws.once('open',()=>r())),send:(m:Msg)=>ws.send(JSON.stringify(m)),next:()=>new Promise<Msg>(r=>{const q=queue.shift();if(q)r(q);else waiters.push([r]);}),close:()=>ws.close()};}
let failures=0;const ok=(cond:unknown,label:string)=>{console.log(`${cond?'✓':'✗'} ${label}`);if(!cond)failures++;};
try{
 const teacher=client();await teacher.open();teacher.send({type:'create',ticket:ticket({role:'teacher',sub:'teacher-1',name:'교사'}),map:1,rules:{mode:'race',duration:30,lives:0,count:1,text:'이번 발표자'}});
 const created=await teacher.next();ok(created.type==='joined'&&created.role==='host'&&/^\d{6}$/.test(String(created.code)),`교사 티켓으로 방 생성 (코드 ${created.code})`);const code=String(created.code);
 const teacher2=client();await teacher2.open();teacher2.send({type:'create',ticket:ticket({role:'teacher',sub:'teacher-1',name:'교사'})});const again=await teacher2.next();ok(again.type==='joined'&&again.code===code&&again.reused===true,'같은 활동으로 다시 만들면 새 방이 아니라 재접속(reused)');
 const s1=client();await s1.open();s1.send({type:'join',code,ticket:ticket({}),id:'hacker',name:'가짜'});const j1=await s1.next();ok(j1.type==='joined'&&j1.id==='stu-1','학생 티켓 참가 — id 는 티켓의 값(브라우저가 보낸 id·name 무시)');
 const noTicket=client();await noTicket.open();noTicket.send({type:'join',code,name:'침입자',id:'x'});const e1=await noTicket.next();ok(e1.type==='error'&&/강의 앱에서만/.test(String(e1.message)),`티켓 없이 참가 → 거절 (${e1.message})`);noTicket.close();
 const other=client();await other.open();other.send({type:'join',code,ticket:ticket({act:'cls-9:03:run7',sub:'stu-9'})});const e2=await other.next();ok(e2.type==='error'&&/다른 수업/.test(String(e2.message)),`다른 활동 티켓 → 거절 (${e2.message})`);other.close();
 const expired=client();await expired.open();expired.send({type:'join',code,ticket:ticket({exp:now-10})});const e3=await expired.next();ok(e3.type==='error'&&/만료|맞지/.test(String(e3.message)),`만료 티켓 → 거절 (${e3.message})`);expired.close();
 const s2=client();await s2.open();s2.send({type:'join',code,ticket:ticket({sub:'stu-2',name:'민준'})});const j2=await s2.next();ok(j2.type==='joined'&&j2.id==='stu-2','이름이 같은 두 번째 학생도 다른 id 로 구별');
 s1.send({type:'start'});const e4=await s1.next();ok(e4.type==='error'&&/교사가 시작/.test(String(e4.message)),`학생이 start → 거절 (${e4.message})`);
 s1.send({type:'end'});const e5=await s1.next();ok(e5.type==='error'&&/교사만/.test(String(e5.message)),`학생이 end → 거절 (${e5.message})`);
 teacher2.send({type:'start'});await wait(300);teacher2.send({type:'end'});
 for(let i=0;i<40&&received.length===0;i++)await wait(100);
 ok(received.length===1,`결과 webhook 수신 ${received.length}건`);
 if(received[0]){const body=received[0].body;const expect='sha256='+createHmac('sha256',SECRET).update(body).digest('hex');ok(received[0].sig===expect,'webhook 서명이 본문·비밀과 맞는다');const env=JSON.parse(body);ok(env.type==='lumi.result'&&env.room.activityId==='cls-1:03:run1'&&env.room.cid==='cls-1'&&env.room.lid==='03'&&env.result.endReason==='teacher','봉투에 활동·수업·차시 id 와 종료 사유가 있다');
  const health=await (await fetch(`http://127.0.0.1:${PORT}/health`)).json() as {lesson:{pendingResults:number}};ok(health.lesson.pendingResults===0,'재시도 대기 0 (한 번에 전달)');}
 await wait(500);ok(received.length===1,'같은 경기 결과는 한 번만 보낸다');
 const solo=client();await solo.open();solo.send({type:'create',activityId:'solo',map:1});const sc=await solo.next();ok(sc.type==='joined'&&sc.role==='host','단독 방(티켓 없음)은 예전처럼 만들어진다');
 const soloStudent=client();await soloStudent.open();soloStudent.send({type:'join',code:String(sc.code),ticket:ticket({})});const e6=await soloStudent.next();ok(e6.type==='error'&&/활동 방이 아니/.test(String(e6.message)),`학생 티켓으로 단독 방 참가 → 거절 (${e6.message})`);
 const soloPlain=client();await soloPlain.open();soloPlain.send({type:'join',code:String(sc.code),name:'루미',id:'p1'});const sp=await soloPlain.next();ok(sp.type==='joined','단독 방은 이름·코드로 들어간다');
 for(const c of [teacher,teacher2,s1,s2,solo,soloStudent,soloPlain])c.close();
}catch(e){console.error('검사 중단:',e);failures++;}
finally{server.kill();hook.close();}
console.log(failures?`\n실패 ${failures}건\n--- 서버 로그 ---\n${log}`:'\n연동 검사 통과');
process.exit(failures?1:0);
