import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Room} from '../server/room.js';
import {encodeState,decodeFrame} from '../shared/wire.js';
import {createMap} from '../shared/maps.js';
import {DEFAULT_RULES} from '../shared/types.js';
import {makePlayer,stepPlayer} from '../shared/physics.js';
test('압축 프레임은 참가자 닉네임·목숨·판정과 방 설정을 보존',()=>{const r=new Room('123456');for(let i=0;i<30;i++)r.join(`닉네임${i}`,String(i));const lobby=r.snapshot();r.start();for(let i=0;i<190;i++)r.advance();const s=r.snapshot(),encoded=encodeState(s);const restored=decodeFrame(encoded,lobby)!;assert.deepEqual(restored.players,s.players);assert.deepEqual(restored.rules,s.rules);assert.equal(restored.phase,'running');assert.equal(restored.tick,s.tick);assert.ok(JSON.stringify(encoded).length<JSON.stringify({type:'state',state:s}).length*.6);assert.equal(decodeFrame(encoded,{...lobby,matchId:'stale'}),null);});
test('급가속 운반로는 달리기를 가속하고 점프 중에도 관성을 유지',()=>{const m=createMap(5),belt=m.platforms.find(p=>(p.belt||0)>=200)!,p=makePlayer('p','루미');p.x=belt.x+40;p.y=belt.y;p.ground=belt.id;for(let tick=1;tick<=15;tick++)stepPlayer(p,{left:false,right:true,jump:false},m,DEFAULT_RULES,tick);assert.ok(p.vx>450);stepPlayer(p,{left:false,right:true,jump:true},m,DEFAULT_RULES,16);assert.ok(p.vy<0);assert.ok(p.vx>450);assert.equal(p.boost,210);});
