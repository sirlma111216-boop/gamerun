import {randomInt,randomUUID} from 'node:crypto';
import {createMap} from '../shared/maps.js';
import {chaseAt,makePlayer,stepPlayer} from '../shared/physics.js';
import {finalize} from '../shared/results.js';
import {DEFAULT_RULES,NO_INPUT,validateRules,type Input,type Player,type Rules,type Snapshot,type GameResult} from '../shared/types.js';
export class Room {
 testOnly=false;
 code:string;hostToken=randomUUID();hostConnected=true;hostLastSeen=Date.now();activityId:string;mapId:number;rules:Rules;map;phase:Snapshot['phase']='lobby';tick=0;countdown=0;matchId=randomUUID();result:GameResult|null=null;players=new Map<string,Player>();tokens=new Map<string,string>();inputs=new Map<string,{value:Input;at:number}>();created=Date.now();updated=Date.now();firstFinish:number|null=null;
 constructor(code:string,activityId='',mapId=1,rules:unknown=DEFAULT_RULES){this.code=code;this.activityId=activityId;this.mapId=mapId;this.rules=validateRules(rules);this.map=createMap(mapId,this.rules.duration);}
 join(name:string,id:string,token?:string){
  if(this.players.has(id)){if(!token||this.tokens.get(id)!==token)throw Error('같은 참가자 ID가 이미 사용 중입니다. 다른 ID로 참가해 주세요.');const p=this.players.get(id)!;p.connected=true;return {player:p,token};}
  if(this.players.size>=30)throw Error('방이 가득 찼습니다 (최대 30명).');
  const p=makePlayer(id,name,this.rules.lives);if(this.phase!=='lobby')p.status='spectator';this.players.set(id,p);const secret=randomUUID();this.tokens.set(id,secret);return {player:p,token:secret};
 }
 settings(map:number,rules:unknown){if(this.phase!=='lobby')throw Error('시작한 경기의 설정은 바꿀 수 없어요. 재경기 버튼을 눌러 주세요.');const next=validateRules(rules);const nextMap=createMap(map,next.duration);this.rules=next;this.mapId=map;this.map=nextMap;for(const p of this.players.values())p.ready=false;}
 start(){if(this.phase!=='lobby')throw Error('이미 시작했거나 종료된 경기입니다.');const all=[...this.players.values()].filter(p=>p.connected&&(!p.bot||this.testOnly));if(!all.length)throw Error('학생이 먼저 참가해야 해요. 혼자 하려면 연습을 선택해 주세요.');if(this.rules.count>all.length)throw Error('선정 인원보다 참가 인원이 적어요. 인원을 바꾸거나 친구를 기다려 주세요.');
  for(const [id,p] of this.players){const fresh=makePlayer(id,p.name,this.rules.lives,p.bot);fresh.connected=p.connected;fresh.ready=p.ready;if(!p.connected)fresh.status='spectator';this.players.set(id,fresh);}this.inputs.clear();this.tick=0;this.phase='countdown';this.countdown=180;this.updated=Date.now();
 }
 input(id:string,value:Input,seq:number){const p=this.players.get(id);if(!p||!Number.isSafeInteger(seq)||seq<=p.ack)return;p.ack=seq;this.inputs.set(id,{value,at:this.tick});}
 advance(){
  if(this.phase==='countdown'){this.countdown--;if(this.countdown<=0){this.phase='running';this.tick=0;}return;}
  if(this.phase!=='running')return;this.tick++;
  for(const p of this.players.values()){const cmd=this.inputs.get(p.id);const input=cmd&&this.tick-cmd.at<24?cmd.value:NO_INPUT;stepPlayer(p,input,this.map,this.rules,this.tick);}
  const all=[...this.players.values()].filter(p=>p.status!=='spectator'&&p.connected&&(!p.bot||this.testOnly));
  const finished=all.filter(p=>p.finishTick!==null),eliminated=all.filter(p=>p.status==='eliminated');
  if(finished.length&&this.firstFinish===null)this.firstFinish=this.tick;
  if(this.rules.mode==='last'&&(finished.length>0||eliminated.length>=this.rules.count))this.end('normal');
  else if(this.rules.mode==='race'&&finished.length>0&&(finished.length>=this.rules.count||all.every(p=>p.status!=='active')))this.end('normal');
 }
 end(reason:GameResult['endReason']){if(this.phase!=='running'&&this.phase!=='countdown')return;this.result=finalize([...this.players.values()],this.rules,{matchId:this.matchId,activityId:this.activityId,map:this.mapId,endReason:reason},randomInt);this.phase='results';this.updated=Date.now();}
 restart(){if(this.phase!=='results')throw Error('경기가 끝난 뒤 재경기를 할 수 있어요.');this.phase='lobby';this.tick=0;this.result=null;this.firstFinish=null;this.matchId=randomUUID();this.inputs.clear();for(const [id,p] of this.players){if(!p.connected){this.players.delete(id);this.tokens.delete(id);continue;}this.players.set(id,makePlayer(id,p.name,this.rules.lives,p.bot));}this.updated=Date.now();}
 snapshot():Snapshot{return {code:this.code,phase:this.phase,matchId:this.matchId,activityId:this.activityId,map:this.mapId,rules:this.rules,tick:this.tick,countdown:this.countdown,players:[...this.players.values()],result:this.result,chase:-500,hostConnected:this.hostConnected};}
}
