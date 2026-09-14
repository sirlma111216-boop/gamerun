import {robot,SceneRenderer} from '../src/game/art.js';
import {FinishNotice} from '../src/game/finish-notice.js';
import {styles} from '../src/game/styles.js';
import {createMap} from '../shared/maps.js';
import {makePlayer,stepPlayer} from '../shared/physics.js';
import {DEFAULT_RULES} from '../shared/types.js';
import {botInput} from './bot.js';
const poses=document.querySelector<HTMLCanvasElement>('#poses')!,ctx=poses.getContext('2d')!;
const style=document.createElement('style');style.textContent=styles;document.head.append(style);
const renderer=new SceneRenderer(document.querySelector<HTMLCanvasElement>('#scene')!);const map=createMap(1);let p=makePlayer('practice','루미'),tick=0,run=false,hits=0,previous=0;
const notice=new FinishNotice(document.querySelector('#stage')!,{retry:()=>start(),next:()=>{document.querySelector('#state')!.textContent='다음 맵 버튼 이벤트 확인';},exit:()=>{notice.reset();run=false;}});
function start(){p=makePlayer('practice','루미');tick=0;hits=0;previous=0;run=true;notice.reset();renderer.camera=0;}
document.querySelector('#run')!.addEventListener('click',start);
function frame(now:number){
 ctx.clearRect(0,0,1200,230);const labels=['서 있기','달리기 (오른쪽)','달리기 (왼쪽)','점프','낙하','완주'];
 for(let i=0;i<6;i++){const q=makePlayer(String(i),'');q.x=i===1?now*.26:i===2?-now*.26:0;q.y=0;q.vx=i===1?260:i===2?-260:0;if(i===3||i===4){q.ground=null;q.vy=i===3?-300:300;}if(i===5)q.status='finished';ctx.save();ctx.translate(95+i*200-q.x,184);robot(ctx,q,now/1000,2);ctx.restore();ctx.fillStyle='#204844';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(labels[i],95+i*200,218);}
 if(run){for(let i=0;i<240;i++){tick++;stepPlayer(p,botInput(p,map,tick),map,DEFAULT_RULES,tick,true);if(p.respawn>previous)hits++;previous=p.respawn;if(tick>3900||p.status==='finished'){run=false;break;}}}
 if(p.status==='finished')stepPlayer(p,{left:false,right:false,jump:false},map,DEFAULT_RULES,tick,true);
 notice.update(p,true,'review',map.name,now,true);renderer.render(map,[p],p.id,p.status==='finished'?now/1000:tick/60,{celebration:notice.age(now)});
 document.querySelector('#state')!.textContent=p.status==='finished'?`완주 ${(p.finishTick!/60).toFixed(2)}초 · 실패 ${hits}회 · 위치 ${p.x.toFixed(0)}`:run?`${(tick/60).toFixed(1)}초 · ${(p.x/10).toFixed(0)}m`:document.querySelector('#state')!.textContent;
 requestAnimationFrame(frame);
}requestAnimationFrame(frame);
