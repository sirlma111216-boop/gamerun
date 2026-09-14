import type {Player,Snapshot} from './types.js';
// Running frames omit unchanged room/rule metadata and encode repeated player keys once.
const keys: (keyof Player)[]=['id','name','x','y','vx','vy','boost','ground','coyote','buffer','jumpHeld','checkpoint','progress','lives','status','finishTick','eliminationTick','respawn','hit','land','connected','ready','bot','ack'];
export function encodeState(state:Snapshot){
 if(state.phase!=='running')return {type:'state',state};
 return {type:'frame',tick:state.tick,matchId:state.matchId,hostConnected:state.hostConnected,players:state.players.map(p=>keys.map(k=>typeof p[k]==='number'?Math.round((p[k] as number)*1000)/1000:p[k]))};
}
export function decodeFrame(message:any,previous:Snapshot|null):Snapshot|null {
 if(message.type==='state')return message.state;
 if(message.type!=='frame'||!previous||message.matchId!==previous.matchId)return null;
 return {...previous,phase:'running',tick:message.tick,hostConnected:message.hostConnected,players:message.players.map((row:unknown[])=>Object.fromEntries(keys.map((k,i)=>[k,row[i]])) as Player)};
}
