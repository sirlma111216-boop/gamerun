import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {MAP_INFO,createMap} from '../shared/maps.js';
import {makePlayer,stepPlayer} from '../shared/physics.js';
import {DEFAULT_RULES} from '../shared/types.js';
import {botInput} from './bot.js';
const rows=[];let failures=0;
for(const duration of [30,45,60,90] as const)for(const info of MAP_INFO){
 const m=createMap(info.id,duration),p=makePlayer('test-driver','개발용 물리 테스트',0,true);let hits=0;let previous=0;
 for(let tick=1;tick<=duration*60*4;tick++){stepPlayer(p,botInput(p,m,tick),m,{...DEFAULT_RULES,duration},tick);if(p.respawn>previous)hits++;previous=p.respawn;if(p.status==='finished')break;}
 const row={map:info.id,name:info.name,duration,finish:p.finishTick?Number((p.finishTick/60).toFixed(2)):null,falls:hits,progress:Math.round(p.progress),complete:p.status==='finished'};rows.push(row);if(!row.complete)failures++;console.log(JSON.stringify(row));

}
mkdirSync('test-results',{recursive:true});writeFileSync('test-results/maps.json',JSON.stringify(rows,null,2));assert.equal(failures,0,`${failures}개 맵/시간 검증 실패`);
