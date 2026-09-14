import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Room} from '../server/room.js';
import {DEFAULT_RULES,validateRules} from '../shared/types.js';
import {makePlayer} from '../shared/physics.js';
import {finalize} from '../shared/results.js';

/**
 * 등수 방식(ranks) — 3강은 6·9등, 4강은 1·3등이 발표한다. 등수는 결과 때까지 비밀이고, 제한 시간이 있다.
 */
const meta={matchId:'r1',activityId:'test',map:2,endReason:'normal' as const};
const RULES={...DEFAULT_RULES,mode:'ranks' as const,ranks:[6,9],timeLimit:60,duration:30 as const};
/** n 명 중 finished 명이 순서대로 완주(틱 10·20·30…), 나머지는 미완주 */
function field(n:number,finished:number,opts:{disconnected?:string[];tie?:[number,number]}={}){
 const players=Array.from({length:n},(_,i)=>makePlayer(`p${i+1}`,`학생${i+1}`));
 players.forEach((p,i)=>{if(i<finished){p.status='finished';p.finishTick=(i+1)*10;}else p.progress=100*(n-i);});
 if(opts.tie){const [a,b]=opts.tie;players[b-1].finishTick=players[a-1].finishTick;}
 for(const id of opts.disconnected??[])players.find(p=>p.id===id)!.connected=false;
 return players;
}
const first=()=>0;

test('규칙 검증 — ranks 는 정렬·중복 없음·count 는 개수, 제한 시간 범위',()=>{
 const r=validateRules({mode:'ranks',ranks:[9,6],timeLimit:60});
 assert.deepEqual(r.ranks,[6,9]);assert.equal(r.count,2);assert.equal(r.timeLimit,60);
 assert.throws(()=>validateRules({mode:'ranks'}),/발표 등수/);
 assert.throws(()=>validateRules({mode:'ranks',ranks:[1,1]}),/발표 등수/);
 assert.throws(()=>validateRules({mode:'ranks',ranks:[0]}),/발표 등수/);
 assert.throws(()=>validateRules({timeLimit:5}),/제한 시간/);
 assert.equal(validateRules({}).timeLimit,0);
});

test('6등·9등이 모두 완주했으면 그 두 사람',()=>{
 const r=finalize(field(12,10),RULES,meta,first);
 assert.deepEqual(r.selectedIds,['p6','p9']);
 assert.match(r.selectionReason,/6등·9등 발표/);assert.match(r.selectionReason,/6등 학생6/);assert.match(r.selectionReason,/9등 학생9/);
});

test('9등이 없으면 접속 중인 미완주자 중 한 명, 끊긴 사람은 제외',()=>{
 /* 12명 중 7명 완주 · p8 은 끊김 → 미완주 후보 p9~p12 */
 const r=finalize(field(12,7,{disconnected:['p8']}),RULES,{...meta,endReason:'timeout'},first);
 assert.equal(r.selectedIds[0],'p6');
 assert.ok(['p9','p10','p11','p12'].includes(r.selectedIds[1]));assert.equal(r.selectedIds.length,2);
 assert.match(r.selectionReason,/^제한 시간 종료/);assert.match(r.selectionReason,/9등 완주자 없음 → 미완주자 중 무작위/);
 /* 무작위가 실제로 미완주자 전체를 고르는가 — 마지막 후보를 고르는 randomInt 로 */
 const last=finalize(field(12,7,{disconnected:['p8']}),RULES,meta,(max)=>max-1);
 assert.equal(last.selectedIds[1],'p12');
});

test('6등도 없으면 미완주자 중 두 명 — 같은 사람을 두 번 뽑지 않는다',()=>{
 const r=finalize(field(12,3),RULES,{...meta,endReason:'timeout'},first);
 assert.deepEqual(r.selectedIds,['p4','p5']);
 assert.match(r.selectionReason,/6등 완주자 없음/);assert.match(r.selectionReason,/9등 완주자 없음/);
});

test('아무도 완주하지 못하면 미완주자 두 명 · 전원 끊겼으면 아무도 없다',()=>{
 const r=finalize(field(10,0),RULES,{...meta,endReason:'timeout'},first);
 assert.deepEqual(r.selectedIds,['p1','p2']);
 const none=finalize(field(3,0,{disconnected:['p1','p2','p3']}),RULES,{...meta,endReason:'timeout'},first);
 assert.deepEqual(none.selectedIds,[]);assert.match(none.selectionReason,/지정할 사람 없음/);
});

test('참가자가 등수보다 적어 전원 완주했으면 완주자 중 무작위 (수강생 3명 검증 수업)',()=>{
 const r=finalize(field(3,3),RULES,meta,first);
 assert.equal(r.selectedIds.length,2);assert.match(r.selectionReason,/참가 3명/);
 assert.equal(new Set(r.selectedIds).size,2);
});

test('같은 틱 도착은 공동 선정 · 4강 1·3등',()=>{
 const r=finalize(field(6,5,{tie:[3,4]}),{...RULES,ranks:[1,3]},meta,first);
 assert.deepEqual(r.selectedIds,['p1','p3','p4']);
});

test('방 — 제한 시간이 지나면 timeout 으로 끝나고, 그 전에 전원 완주하면 normal',()=>{
 const r=new Room('111111','act',2,RULES);r.join('a','a');r.join('b','b');r.start();
 for(let i=0;i<180;i++)r.advance();assert.equal(r.phase,'running');
 const a=r.players.get('a')!;a.status='finished';a.finishTick=30;
 for(let i=0;i<60*60-1;i++)r.advance();assert.equal(r.phase,'running','9등이 안 찼어도 시간 전에는 끝내지 않는다');
 r.advance();assert.equal(r.phase,'results');assert.equal(r.result?.endReason,'timeout');
 assert.deepEqual([...r.result!.selectedIds].sort(),['a','b'],'6등은 미완주자 b, 9등은 남은 완주자 a');
 const q=new Room('222222','act',2,RULES);q.join('a','a');q.join('b','b');q.start();for(let i=0;i<180;i++)q.advance();
 for(const p of q.players.values()){p.status='finished';p.finishTick=20;}q.advance();
 assert.equal(q.phase,'results');assert.equal(q.result?.endReason,'normal');
});

test('스냅숏은 결과 전까지 ranks 를 싣지 않는다 (개발자 도구로도 못 본다)',()=>{
 const r=new Room('333333','act',2,RULES);r.join('a','a');
 assert.equal(r.snapshot().rules.ranks,undefined);assert.equal(r.snapshot().rules.mode,'ranks');
 r.start();assert.equal(r.snapshot().rules.ranks,undefined);
 r.end('teacher');assert.deepEqual(r.snapshot().rules.ranks,[6,9]);assert.deepEqual(r.snapshot().result?.rules.ranks,[6,9]);
});

test('race·last 는 timeLimit 0 이면 예전처럼 시간 종료가 없다',()=>{
 const r=new Room('444444','act',1,{mode:'race',count:1});r.join('a','a');r.start();for(let i=0;i<180+6000;i++)r.advance();assert.equal(r.phase,'running');
});
