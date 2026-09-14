import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMap,MAP_INFO,COURSE_PLANS} from '../shared/maps.js';
import {makePlayer,stepPlayer} from '../shared/physics.js';
import {DEFAULT_RULES,NO_INPUT} from '../shared/types.js';
import {runFoot,kneeBetween} from '../src/game/robot-pose.js';
import {botInput} from '../scripts/bot.js';
test('연습도 실제 코스 완주 후 기록 확정, 결승을 지나 계속 달리지 않음',()=>{
 const m=createMap(1),p=makePlayer('practice','루미');let tick=0;
 while(p.status==='active'&&tick<3600){tick++;stepPlayer(p,botInput(p,m,tick),m,DEFAULT_RULES,tick,true);}
 assert.equal(p.status,'finished');assert.ok(p.finishTick!>1800&&p.finishTick!<5400);
 const x=p.x,finish=p.finishTick;for(let i=0;i<180;i++)stepPlayer(p,{...NO_INPUT,right:true,jump:true},m,DEFAULT_RULES,++tick,true);
 assert.equal(p.x,x);assert.equal(p.finishTick,finish);assert.ok(p.ground);assert.equal(p.vy,0);
});
test('달리기 다리: 접지 구간 높이 고정, 발 회수 시 들기, 관절 길이 유지',()=>{
 for(let phase=0;phase<.6;phase+=.05)assert.equal(runFoot(phase).y,-4);
 assert.ok(runFoot(.8).y<-14);assert.ok(runFoot(.1).x>runFoot(.5).x);
 for(let phase=0;phase<1;phase+=.01){const hip={x:-2,y:-24},foot=runFoot(phase),knee=kneeBetween(hip,foot);assert.ok(Math.abs(Math.hypot(knee.x-hip.x,knee.y-hip.y)-16)<.001);assert.ok(Math.abs(Math.hypot(knee.x-foot.x,knee.y-foot.y)-17)<.001);}
});
