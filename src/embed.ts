import {LESSON_CAPABILITIES,mountLumiRun,type LumiAPI,type LumiConfig} from './game/module.js';
import {VERSION} from '../shared/types.js';
let game:LumiAPI|null=null;let parentOrigin:string|null=null;
// An explicit parent origin is required; never broadcast student results using '*'.
const allowed=new URLSearchParams(location.search).get('parentOrigin');
window.addEventListener('message',e=>{if(e.source!==parent||!allowed||e.origin!==allowed)return;parentOrigin=e.origin;const m=e.data;
 if(m?.type==='lumi:mount'){game?.destroy();const c=(m.config||{}) as LumiConfig;const emit=(type:string,value:unknown)=>parent.postMessage({type,value},parentOrigin!);game=mountLumiRun(document.getElementById('app')!,{...c,onReady:s=>emit('lumi:ready',s),onStart:s=>emit('lumi:start',s),onEnd:r=>emit('lumi:end',r),onResult:r=>emit('lumi:result',r),onLobby:s=>emit('lumi:lobby',s),onError:m=>emit('lumi:error',m)});}
 if(m?.type==='lumi:start')game?.start();if(m?.type==='lumi:stop')game?.stop();if(m?.type==='lumi:restart')game?.restart();if(m?.type==='lumi:create')game?.createRoom();if(m?.type==='lumi:join')game?.joinRoom(typeof m.code==='string'?m.code:undefined);if(m?.type==='lumi:destroy'){game?.destroy();game=null;}
});
/* 버전은 게임 상수 하나에서. 새 연동 기능의 지원 여부는 capabilities 로 알린다 — 부모가 옵션 유무를 추측하지 않게. */
if(allowed)parent.postMessage({type:'lumi:available',version:VERSION,capabilities:[...LESSON_CAPABILITIES]},allowed);
