import {gateState,platformAt,SPEED,stepPlayer} from '../shared/physics.js';
import {DEFAULT_RULES,type Input,type MapData,type Player} from '../shared/types.js';
// Real button inputs only. Forecasts use the same physics, never modify the actual player.
export function botInput(p:Player,m:MapData,tick:number):Input {
 const t=tick/60;let right=true,jump=false;
 const ground=m.platforms.find(v=>v.id===p.ground);
 if(ground){const g=platformAt(ground,t),edge=g.x+g.w;
  const obstacles=m.platforms.map(v=>platformAt(v,t)).filter(v=>v.id!==g.id&&v.x>p.x&&v.x-p.x<68&&v.y<g.y-5&&v.y>g.y-123);
  const continuation=m.platforms.map(v=>platformAt(v,t)).some(v=>v.id!==g.id&&v.x<=edge+1&&v.x+v.w>edge&&Math.abs(v.y-g.y)<6);
  jump=obstacles.length>0||(!continuation&&edge-p.x<37+Math.max(0,p.boost)*.09);
 }
 for(const h of m.hazards){const distance=h.x-p.x;if(ground&&distance>=-16&&distance<100&&p.y>h.y&&p.y-48<h.y+h.h){
  if(h.h<=25&&distance>30){jump=true;continue;}
  const enter=Math.max(0,(distance-15)/SPEED-.1),exit=(distance+h.w+18)/SPEED+.25;let unsafe=false;
  for(let dt=enter;dt<=exit;dt+=.03)if(gateState(h,t+dt)==='active')unsafe=true;
  if(unsafe){right=false;jump=false;}
 }}
 if(jump&&ground&&!p.jumpHeld){
  const q={...p};let landed=false;
  for(let k=0;k<65;k++){stepPlayer(q,{left:false,right:true,jump:k===0},m,DEFAULT_RULES,tick+k,true);if(q.respawn>0)break;if(k>4&&q.ground&&q.x>p.x+30){landed=true;break;}}
  if(!landed){right=false;jump=false;}
 }
 return {left:false,right,jump:jump&&!p.jumpHeld};
}
