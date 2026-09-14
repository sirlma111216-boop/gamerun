import {mountLumiRun,type LumiAPI,type LumiConfig} from './game/module.js';
let game:LumiAPI|null=null;let parentOrigin:string|null=null;
// An explicit parent origin is required; never broadcast student results using '*'.
const allowed=new URLSearchParams(location.search).get('parentOrigin');
window.addEventListener('message',e=>{if(e.source!==parent||!allowed||e.origin!==allowed)return;parentOrigin=e.origin;const m=e.data;
 if(m?.type==='lumi:mount'){game?.destroy();const c=(m.config||{}) as LumiConfig;const emit=(type:string,value:unknown)=>parent.postMessage({type,value},parentOrigin!);game=mountLumiRun(document.getElementById('app')!,{...c,onReady:s=>emit('lumi:ready',s),onStart:s=>emit('lumi:start',s),onEnd:r=>emit('lumi:end',r),onResult:r=>emit('lumi:result',r)});}
 if(m?.type==='lumi:start')game?.start();if(m?.type==='lumi:stop')game?.stop();if(m?.type==='lumi:restart')game?.restart();if(m?.type==='lumi:destroy'){game?.destroy();game=null;}
});
if(allowed)parent.postMessage({type:'lumi:available',version:'1.0.0'},allowed);
