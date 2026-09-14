import {VERSION,type Player,type Rules,type GameResult,type ResultRow} from './types.js';
export function finalize(players:Player[],rules:Rules,meta:{matchId:string;activityId:string;map:number;endReason:GameResult['endReason']},_randomInt?:(max:number)=>number):GameResult {
 const eligible=players.filter(p=>!p.bot&&p.status!=='spectator'&&p.connected);
 const score=(p:Player)=>p.finishTick!==null?[0,p.finishTick]:[1,-Math.floor(p.progress)];
 const compare=(a:Player,b:Player)=>{const x=score(a),y=score(b);return x[0]-y[0]||x[1]-y[1];};
 const sorted=[...eligible].sort(compare),ranks=new Map<string,number>();let rank=1;
 sorted.forEach((p,i)=>{if(i>0&&compare(p,sorted[i-1])!==0)rank=i+1;ranks.set(p.id,rank);});
 const bottomScore=(p:Player)=>p.status==='eliminated'?[0,p.eliminationTick??0]:p.finishTick!==null?[2,-p.finishTick]:[1,Math.floor(p.x)];
 const bottomCompare=(a:Player,b:Player)=>{const x=bottomScore(a),y=bottomScore(b);return x[0]-y[0]||x[1]-y[1];};
 // Last mode freezes at the first finisher or the Nth elimination. Same tick/position ties are included.
 const pool=rules.mode==='race'?sorted.filter(p=>p.finishTick!==null):[...eligible].sort(bottomCompare);
 const cmp=rules.mode==='race'?compare:bottomCompare;
 const boundary=pool[Math.min(rules.count,pool.length)-1];
 const chosen=boundary?pool.filter(p=>cmp(p,boundary)<=0):[];
 const reason=rules.mode==='race'?`완주 순서 상위 ${rules.count}명`:eligible.filter(p=>p.status==='eliminated').length>=rules.count?`먼저 목숨을 모두 잃은 ${rules.count}명`:`첫 완주 시점 · 탈락자 우선, 현재 가장 뒤쪽 ${rules.count}명`;
 const rows:ResultRow[]=players.map(p=>({id:p.id,name:p.name,status:!p.connected?'disconnected':p.status,rank:ranks.get(p.id)??null,finishTime:p.finishTick===null?null:Number((p.finishTick/60).toFixed(3)),progress:Math.floor(p.progress),connected:p.connected,bot:p.bot})).sort((a,b)=>(a.rank??999)-(b.rank??999));
 return {gameVersion:VERSION,moduleVersion:VERSION,resultVersion:'2.0',...meta,rules:structuredClone(rules),players:rows,selectedIds:chosen.map(p=>p.id),selectionReason:meta.endReason==='teacher'?`교사가 강제 종료 · ${reason}`:reason,tieHandling:'경계의 같은 도착 틱·탈락 틱·현재 위치는 공동 선정',endedAt:new Date().toISOString()};
}
