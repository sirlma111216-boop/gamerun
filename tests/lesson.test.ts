import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signLessonTicket,verifyLessonTicket,signBody} from '../server/lesson-ticket.js';
import {Room} from '../server/room.js';
const SECRET='test-secret';
const now=Math.floor(Date.now()/1000);
const base={cid:'cls-1',lid:'03',act:'cls-1:03:run1',sub:'stu-1',name:'민준',role:'student' as const,iat:now,exp:now+600};
test('티켓 — 서명이 맞고 만료 전이면 통과, 필드가 정규화된다',()=>{
 const t=signLessonTicket(base,SECRET);const v=verifyLessonTicket(t,SECRET);
 assert.ok(v);assert.equal(v.sub,'stu-1');assert.equal(v.role,'student');assert.equal(v.act,'cls-1:03:run1');assert.equal(v.iss,'scienced');
});
test('티켓 — 서명 위조·다른 비밀·만료·발급자 불일치는 전부 거절',()=>{
 const t=signLessonTicket(base,SECRET);
 assert.equal(verifyLessonTicket(t,'other'),null);
 assert.equal(verifyLessonTicket(t.slice(0,-2)+'zz',SECRET),null);
 assert.equal(verifyLessonTicket(signLessonTicket({...base,exp:now-1},SECRET),SECRET),null);
 const tampered=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(t.split('.')[0].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()),role:'teacher'})).toString('base64url')+'.'+t.split('.')[1];
 assert.equal(verifyLessonTicket(tampered,SECRET),null);
 assert.equal(verifyLessonTicket(t,''),null);
 assert.equal(verifyLessonTicket(undefined,SECRET),null);
});
test('티켓 — 이름은 18자로 자르고 비면 역할 이름으로',()=>{
 const long=verifyLessonTicket(signLessonTicket({...base,name:'가'.repeat(30)},SECRET),SECRET)!;assert.equal(long.name.length,18);
 const empty=verifyLessonTicket(signLessonTicket({...base,name:''},SECRET),SECRET)!;assert.equal(empty.name,'학생');
});
test('연동 방 — 같은 학생 ID 의 재접속은 토큰 없이(trusted) 허용, 단독 방은 여전히 토큰 필요',()=>{
 const room=new Room('123456','act',1);room.integration={cid:'c',lid:'03',teacherUid:'t',iss:'scienced'};
 const first=room.join('민준','stu-1',undefined,true);assert.equal(room.players.size,1);
 const again=room.join('민준','stu-1',undefined,true);assert.equal(again.token,first.token);assert.equal(room.players.size,1);
 const plain=new Room('654321','x',1);plain.join('a','id-1');assert.throws(()=>plain.join('a','id-1'));
});
test('결과 서명 — 본문 그대로에 HMAC, 헤더 형식 sha256=hex',()=>{
 const sig=signBody('{"a":1}',SECRET);assert.match(sig,/^sha256=[0-9a-f]{64}$/);assert.notEqual(sig,signBody('{"a":2}',SECRET));
});
