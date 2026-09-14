import {NO_INPUT,type Player,type Input,type MapData,type Platform,type Rules} from './types.js';
export const DT=1/60, SPEED=260, GRAVITY=1800, JUMP=660, HALF=15, HEIGHT=48;
export function platformAt(p:Platform,t:number){const offset=p.move?Math.sin(t*Math.PI*2/p.move.period+p.move.phase)*p.move.range:0;return {...p,x:p.x+(p.move?.axis==='x'?offset:0),y:p.y+(p.move?.axis==='y'?offset:0)};}
export function gateState(h:MapData['hazards'][number],t:number){const phase=((t+h.phase)%h.period+h.period)%h.period;return phase<h.active?'active':phase>h.period-h.warning?'warning':'safe';}
export function makePlayer(id:string,name:string,lives=0,bot=false):Player{return {id,name,x:100,y:430,vx:0,vy:0,boost:0,ground:'p0',coyote:.1,buffer:0,jumpHeld:false,checkpoint:0,progress:100,lives,status:'active',finishTick:null,eliminationTick:null,respawn:0,hit:0,land:0,connected:true,ready:false,bot,ack:0};}
export function chaseAt(t:number){return Math.max(-240,t*190-650);}
export function damage(p:Player,m:MapData,r:Rules,tick:number){
 if(p.respawn>0||p.status!=='active')return;
 p.hit=.5;p.vx=0;p.vy=0;p.boost=0;p.ground=null;
 if(r.lives!==0){p.lives--;if(p.lives<=0){p.status='eliminated';p.eliminationTick=tick;return;}}
 p.respawn=.8;
}
export function stepPlayer(p:Player,input:Input,m:MapData,r:Rules,tick:number,practice=false){
 const t=tick*DT;p.hit=Math.max(0,p.hit-DT);p.land=Math.max(0,p.land-DT);
 if(p.status==='finished'){
  // Crossing the finish in midair still lands naturally, without moving the player to a fake finish pose.
  if(!p.ground){const oldY=p.y;p.vy+=GRAVITY*DT;p.y+=p.vy*DT;for(const base of m.platforms){const b=platformAt(base,t);if(p.x+HALF>b.x&&p.x-HALF<b.x+b.w&&oldY<=b.y&&p.y>=b.y){p.y=b.y;p.vy=0;p.ground=b.id;p.land=.14;break;}}}
  return;
 }
 if(p.status!=='active')return;
 if(p.respawn>0){p.respawn-=DT;if(p.respawn<=0){const cp=m.checkpoints[p.checkpoint];p.x=cp.x;p.y=cp.y;p.vx=0;p.vy=0;p.coyote=0;p.buffer=0;p.ground=null;}return;}
 if(!p.connected)input=NO_INPUT;
 if(input.jump&&!p.jumpHeld)p.buffer=.13;else p.buffer=Math.max(0,p.buffer-DT);p.jumpHeld=input.jump;
 const previousGround=p.ground;
 if(p.ground){const base=m.platforms.find(v=>v.id===p.ground);if(base){const a=platformAt(base,t-DT),b=platformAt(base,t);p.x+=b.x-a.x;p.y+=b.y-a.y;p.boost=base.belt||0;}p.coyote=.11;}else p.coyote=Math.max(0,p.coyote-DT);
 const direction=Number(input.right)-Number(input.left);const target=direction*SPEED+(direction>=0?p.boost:0);
 p.vx+=Math.max(-2200*DT,Math.min(2200*DT,target-p.vx));
 if(p.buffer>0&&p.coyote>0){p.vy=-JUMP;p.ground=null;p.coyote=0;p.buffer=0;}
 const oldY=p.y,oldX=p.x;
 p.x=Math.max(24,Math.min(m.length-40,p.x+p.vx*DT));p.vy=Math.min(1000,p.vy+GRAVITY*DT);p.y+=p.vy*DT;p.ground=null;
 for(const base of m.platforms){if(base.x+base.w+100<p.x-HALF||base.x-100>p.x+HALF)continue;const a=platformAt(base,t-DT),b=platformAt(base,t);
  if(p.x+HALF<=b.x||p.x-HALF>=b.x+b.w)continue;
  if(p.vy>=0&&oldY<=a.y+2&&p.y>=b.y){p.y=b.y;p.vy=0;p.ground=b.id;if(!previousGround)p.land=.14;}
  else if(p.y>b.y+4&&p.y-HEIGHT<b.y+b.h&&oldY>b.y+4){if(oldX+HALF<=a.x+2){p.x=b.x-HALF;p.vx=0;}else if(oldX-HALF>=a.x+a.w-2){p.x=b.x+b.w+HALF;p.vx=0;}else if(oldY-HEIGHT>=a.y+a.h&&p.vy<0){p.y=b.y+b.h+HEIGHT;p.vy=0;}}
 }
 const supported=p.ground!==null;
 if(supported){for(let i=p.checkpoint+1;i<m.checkpoints.length;i++){const cp=m.checkpoints[i];if(p.x>=cp.x&&Math.abs(p.y-cp.y)<4)p.checkpoint=i;}}
 if(p.y>720){damage(p,m,practice?{...r,lives:0}:r,tick);return;}
 for(const h of m.hazards){if(p.x+HALF>h.x&&p.x-HALF<h.x+h.w&&p.y>h.y&&p.y-HEIGHT<h.y+h.h&&gateState(h,t)==='active'){damage(p,m,practice?{...r,lives:0}:r,tick);return;}}
 if(p.y<560)p.progress=Math.max(p.progress,p.x);
 if(p.x>=m.finish&&p.y<560){p.status='finished';p.finishTick=tick;p.vx=0;}
}
