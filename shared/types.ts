export const VERSION = '2.1.0';
export type Mode = 'race' | 'last';
/** duration selects course length only; lives=0 means unlimited. */
export type Rules = {mode:Mode;duration:30|45|60|90;lives:0|1|3|5;count:number;text:string};
export const DEFAULT_RULES:Rules={mode:'race',duration:60,lives:0,count:1,text:'이번 모험의 선정자'};
export type Input={left:boolean;right:boolean;jump:boolean};
export const NO_INPUT:Input={left:false,right:false,jump:false};
export type Platform={id:string;x:number;y:number;w:number;h:number;move?:{axis:'x'|'y';range:number;period:number;phase:number};belt?:number};
export type Hazard={x:number;y:number;w:number;h:number;period:number;phase:number;active:number;warning:number};
export type MapData={id:number;name:string;theme:number;description:string;difficulty:string;platforms:Platform[];hazards:Hazard[];checkpoints:{x:number;y:number}[];finish:number;length:number};
export type Player={id:string;name:string;x:number;y:number;vx:number;vy:number;boost:number;ground:string|null;coyote:number;buffer:number;jumpHeld:boolean;checkpoint:number;progress:number;lives:number;status:'active'|'finished'|'eliminated'|'spectator';finishTick:number|null;eliminationTick:number|null;respawn:number;hit:number;land:number;connected:boolean;ready:boolean;bot:boolean;ack:number};
export type ResultRow={id:string;name:string;status:string;rank:number|null;finishTime:number|null;progress:number;connected:boolean;bot:boolean};
export type GameResult={gameVersion:string;moduleVersion:string;resultVersion:string;matchId:string;activityId:string;map:number;rules:Rules;players:ResultRow[];selectedIds:string[];selectionReason:string;tieHandling:string;endReason:'normal'|'timeout'|'teacher';endedAt:string};
export type Snapshot={code:string;phase:'lobby'|'countdown'|'running'|'results';matchId:string;activityId:string;map:number;rules:Rules;tick:number;countdown:number;players:Player[];result:GameResult|null;chase:number;hostConnected:boolean};
export function validateRules(value:unknown):Rules {
 const r={...DEFAULT_RULES,...(value&&typeof value==='object'?value:{})} as Rules;
 if(!['race','last'].includes(r.mode)||![30,45,60,90].includes(r.duration))throw Error('도착·꼴찌 방식과 30·45·60·90초 코스 중 선택해 주세요.');
 if(![0,1,3,5].includes(r.lives)||!Number.isInteger(r.count)||r.count<1||r.count>30)throw Error('목숨은 무한·1·3·5, 선정 인원은 1~30명으로 입력해 주세요.');
 if(typeof r.text!=='string'||r.text.length>80)throw Error('결과 문구는 80자 이내로 입력해 주세요.');
 return {mode:r.mode,duration:r.duration,lives:r.lives,count:r.count,text:r.text};
}
