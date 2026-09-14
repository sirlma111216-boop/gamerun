import {VERSION,type Player,type Rules,type GameResult,type ResultRow} from './types.js';
export function finalize(players:Player[],rules:Rules,meta:{matchId:string;activityId:string;map:number;endReason:GameResult['endReason']},randomInt:(max:number)=>number=(max)=>Math.floor(Math.random()*max)):GameResult {
 const eligible=players.filter(p=>!p.bot&&p.status!=='spectator'&&p.connected);
 const score=(p:Player)=>p.finishTick!==null?[0,p.finishTick]:[1,-Math.floor(p.progress)];
 const compare=(a:Player,b:Player)=>{const x=score(a),y=score(b);return x[0]-y[0]||x[1]-y[1];};
 const sorted=[...eligible].sort(compare),ranks=new Map<string,number>();let rank=1;
 sorted.forEach((p,i)=>{if(i>0&&compare(p,sorted[i-1])!==0)rank=i+1;ranks.set(p.id,rank);});
 const bottomScore=(p:Player)=>p.status==='eliminated'?[0,p.eliminationTick??0]:p.finishTick!==null?[2,-p.finishTick]:[1,Math.floor(p.x)];
 const bottomCompare=(a:Player,b:Player)=>{const x=bottomScore(a),y=bottomScore(b);return x[0]-y[0]||x[1]-y[1];};
 // Last mode freezes at the first finisher or the Nth elimination. Same tick/position ties are included.
 let chosen:Player[],reason:string,tieHandling='경계의 같은 도착 틱·탈락 틱·현재 위치는 공동 선정';
 if(rules.mode==='ranks'){
  /*
   * 등수 방식 — 발표할 등수(완주 순서)를 미리 정해 두고, 결과 때만 공개한다.
   *   · r 등 완주자가 있으면 그 사람. 같은 틱에 도착한 사람은 공동 선정.
   *   · r 등까지 완주가 안 됐으면(제한 시간 종료·강제 종료) 접속 중인 미완주자 중 무작위 한 명. 끊긴 사람은 제외.
   *   · 미완주자도 없으면(참가자가 r 명보다 적어 전원 완주) 아직 안 뽑힌 완주자 중 무작위. 그래도 없으면 비워 둔다 — 꾸며내지 않는다.
   */
  const ranks=rules.ranks??[];const finishers=sorted.filter(p=>p.finishTick!==null);const waiting=eligible.filter(p=>p.finishTick===null);
  chosen=[];const notes:string[]=[];
  for(const r of ranks){
   const at=finishers[r-1];
   if(at){const group=finishers.filter(p=>p.finishTick===at.finishTick&&!chosen.includes(p));chosen.push(...group);notes.push(`${r}등 ${group.map(p=>p.name).join('·')||'(이미 선정)'}`);continue;}
   if(waiting.length){const pick=waiting.splice(randomInt(waiting.length),1)[0];chosen.push(pick);notes.push(`${r}등 완주자 없음 → 미완주자 중 무작위 ${pick.name}`);continue;}
   const rest=finishers.filter(p=>!chosen.includes(p));
   if(rest.length){const pick=rest[randomInt(rest.length)];chosen.push(pick);notes.push(`${r}등 없음(참가 ${eligible.length}명) → 완주자 중 무작위 ${pick.name}`);}
   else notes.push(`${r}등 없음 → 지정할 사람 없음`);
  }
  reason=`${ranks.map(r=>r+'등').join('·')} 발표 — ${notes.join(' / ')}`;
  tieHandling='같은 도착 틱은 공동 선정 · 그 등수까지 완주가 안 됐으면 접속 중인 미완주자 중 무작위';
 }else{
  const pool=rules.mode==='race'?sorted.filter(p=>p.finishTick!==null):[...eligible].sort(bottomCompare);
  const cmp=rules.mode==='race'?compare:bottomCompare;
  const boundary=pool[Math.min(rules.count,pool.length)-1];
  chosen=boundary?pool.filter(p=>cmp(p,boundary)<=0):[];
  reason=rules.mode==='race'?`완주 순서 상위 ${rules.count}명`:eligible.filter(p=>p.status==='eliminated').length>=rules.count?`먼저 목숨을 모두 잃은 ${rules.count}명`:`첫 완주 시점 · 탈락자 우선, 현재 가장 뒤쪽 ${rules.count}명`;
 }
 const rows:ResultRow[]=players.map(p=>({id:p.id,name:p.name,status:!p.connected?'disconnected':p.status,rank:ranks.get(p.id)??null,finishTime:p.finishTick===null?null:Number((p.finishTick/60).toFixed(3)),progress:Math.floor(p.progress),connected:p.connected,bot:p.bot})).sort((a,b)=>(a.rank??999)-(b.rank??999));
 return {gameVersion:VERSION,moduleVersion:VERSION,resultVersion:'2.0',...meta,rules:structuredClone(rules),players:rows,selectedIds:chosen.map(p=>p.id),selectionReason:meta.endReason==='teacher'?`교사가 강제 종료 · ${reason}`:meta.endReason==='timeout'?`제한 시간 종료 · ${reason}`:reason,tieHandling,endedAt:new Date().toISOString()};
}
