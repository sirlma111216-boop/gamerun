import {platformAt,gateState} from '../../shared/physics.js';
import type {MapData,Player} from '../../shared/types.js';
import {runFoot,kneeBetween,type Point} from './robot-pose.js';
export const PALETTES=[
 {sky:'#d7ece2',haze:'#eef1d6',far:'#a6cbbb',hill:'#73aaa0',front:'#387a70',top:'#9dcc89',edge:'#497c59',earth:'#496d60',accent:'#efb860'},
 {sky:'#dce9ed',haze:'#f4efdd',far:'#b6c9d0',hill:'#8caeae',front:'#507e7b',top:'#b9cfa1',edge:'#618878',earth:'#667e79',accent:'#e9af84'},
 {sky:'#f4dec1',haze:'#fff0ce',far:'#dec09d',hill:'#caa181',front:'#a7785d',top:'#efc184',edge:'#bf8e64',earth:'#ab8063',accent:'#477c7b'},
 {sky:'#222b48',haze:'#4c586e',far:'#36415e',hill:'#455777',front:'#3b667a',top:'#a2dadd',edge:'#6796b3',earth:'#3a4f67',accent:'#dcacf2'},
 {sky:'#182e3f',haze:'#3d5660',far:'#304958',hill:'#3e6271',front:'#367782',top:'#9da9a2',edge:'#dfac62',earth:'#455a60',accent:'#f3c56c'}
];
function rr(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function ellipse(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,fill:string){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function path(c:CanvasRenderingContext2D,points:number[][],color:string){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export function robot(c:CanvasRenderingContext2D,p:Player,t:number,scale=1,alpha=1,facing=p.vx<0?-1:1){
 c.save();c.translate(p.x,p.y);c.scale(scale,scale);c.globalAlpha=alpha;
 const grounded=!!p.ground,run=grounded&&Math.abs(p.vx)>10,celebrate=p.status==='finished',hit=p.hit>0;
 const phase=p.x*facing/60,bob=run?Math.cos(phase*Math.PI*4)*1.3:0;
 ellipse(c,0,2,21,4,'#173f3a33');c.scale(facing,1);
 const hip={x:-2,y:-24+bob+(p.land>0?3:0)};
 const limb=(points:Point[],color:string,width:number)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();};
 const leg=(rear:boolean)=>{
  const foot=run?runFoot(phase+(rear?.5:0)):!grounded?(rear?{x:-12,y:-10}:{x:15,y:p.vy<0?-16:-6}):{x:rear?-6:6,y:-4};
  const knee=kneeBetween(hip,foot);limb([hip,knee,foot],rear?'#b3bea7':'#f0e1bc',6);ellipse(c,knee.x,knee.y,3.6,3.6,rear?'#548078':'#77a397');
  rr(c,foot.x-5,foot.y-2,16,6,3,rear?'#174747':'#236663');rr(c,foot.x-5,foot.y+2,17,2,1,rear?'#143d3e':'#123d3e');
 };
 const arm=(rear:boolean)=>{const angle=run?Math.sin(phase*Math.PI*2)*(rear?-.8:.8):0;
  const shoulder={x:0,y:-38};const elbow={x:Math.sin(angle)*13,y:-27};const hand=celebrate?{x:12,y:-62-Math.sin(t*9)*3}:!grounded?{x:16,y:-40}:{x:elbow.x+9,y:-26-Math.max(0,Math.sin(angle))*6};
  limb([shoulder,elbow,hand],rear?'#b5bc9f':'#f0e1bc',5);ellipse(c,hand.x,hand.y,4,4,rear?'#184b4b':'#2c7370');};
 leg(true);arm(true);leg(false);
 c.save();c.translate(run?3:0,bob);if(hit)c.rotate(Math.sin(t*40)*.08);
 rr(c,-20,-41,11,22,4,'#174546');rr(c,-19,-36,5,10,2,'#e7b260');
 rr(c,-12,-44,25,24,8,hit?'#c38162':'#205f5b');rr(c,-8,-41,18,12,5,'#387e70');ellipse(c,9,-32,3,3,'#efbf69');
 path(c,[[-7,-45],[-23,-42+Math.sin(t*12)*2],[-36,-48+Math.sin(t*12)*3],[-27,-50],[-8,-50]],'#dd765e');rr(c,-12,-47,27,5,2,'#ee9673');
 rr(c,-16,-67,36,27,11,hit?'#d9936e':'#164c4d');rr(c,-12,-65,25,5,3,'#438c7e');
 const glass=c.createLinearGradient(0,-60,0,-44);glass.addColorStop(0,'#ffe4a1');glass.addColorStop(1,'#e5a14b');c.fillStyle=glass;c.beginPath();c.roundRect(4,-61,22,17,[4,9,9,4]);c.fill();
 rr(c,16,-57,4,8,2,'#174547');rr(c,7,-59,10,2,1,'#fff4cc');
 ellipse(c,-10,-53,7,8,'#e9dcbb');ellipse(c,-10,-53,4,5,'#659383');ellipse(c,-10,-53,1.5,2,'#214e49');
 limb([{x:-4,y:-67},{x:-8,y:-74}],'#285e58',3);ellipse(c,-8,-75,3,3,'#e4a75a');
 arm(false);c.restore();
 c.restore();
}
export class SceneRenderer {
 private facings=new Map<string,number>();
 ctx:CanvasRenderingContext2D;camera=0;low=false;width=1280;height=560;frames=0;fps=60;private lastMeasure=performance.now();
 constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d')!;}
 resize(){const w=this.canvas.clientWidth||1280,h=this.canvas.clientHeight||560;const dpr=this.low?1:Math.min(2,devicePixelRatio||1);if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}this.width=w/Math.max(.6,h/560);this.height=560;this.ctx.setTransform(this.canvas.width/this.width,0,0,this.canvas.height/560,0,0);}
 render(map:MapData,players:Player[],focus:string,t:number,{preview=false,chase=-500,instant=false,celebration=-1}={}){
  if(this.frames===0)this.lastMeasure=performance.now();
  this.resize();const c=this.ctx,w=this.width,pal=PALETTES[map.theme];const me=players.find(p=>p.id===focus)||players[0];
  const target=preview?80:Math.max(0,Math.min(map.length-w,(me?.x||100)-w*.3));this.camera=instant?target:this.camera+(target-this.camera)*.1;const cam=this.camera;
  const sky=c.createLinearGradient(0,0,0,560);sky.addColorStop(0,pal.sky);sky.addColorStop(1,pal.haze);c.fillStyle=sky;c.fillRect(0,0,w,560);
  ellipse(c,w*.78,98,45,45,map.theme<3?'#fff4cc':'#e3ead8');ellipse(c,w*.78,98,63,63,map.theme<3?'#fff4cc33':'#e3ead811');
  if(map.theme>=3){for(let i=0;i<35;i++){ellipse(c,((i*167.7-cam*.08)%w+w)%w,22+(i*43)%240,i%4===0?2:1,i%4===0?2:1,'#e6e8ce99');}}
  for(let layer=0;layer<(this.low?2:3);layer++){
   const factor=[.12,.26,.48][layer],step=[500,360,260][layer],y=[330,390,450][layer],height=[145,130,90][layer];
   for(let i=Math.floor(cam*factor/step)-1;i<(cam*factor+w)/step+1;i++){
    const x=i*step-cam*factor,color=[pal.far,pal.hill,pal.front][layer];
    if(map.theme===4){rr(c,x,y-height,step*.65,height+180,6,color);rr(c,x+step*.45,y-height-65,20,height+245,3,color);for(let j=0;j<4;j++)rr(c,x+18+j*30,y-height+25,9,14,2,pal.accent+'66');}
    else if(map.theme===3){path(c,[[x-20,560],[x+step*.25,y-height],[x+step*.43,y-height+40],[x+step*.65,y-30],[x+step,560]],color);}
    else {c.fillStyle=color;c.beginPath();c.moveTo(x-step*.3,560);c.lineTo(x-step*.3,y+40);c.bezierCurveTo(x,y-height,x+step*.45,y-height,x+step*.75,y+20);c.lineTo(x+step*1.3,560);c.fill();}
   }
  }
  if(!this.low&&map.theme<3){for(let i=0;i<6;i++){const x=((i*340-cam*.08+t*3)%(w+400)+w+400)%(w+400)-120;ellipse(c,x,90+(i%3)*43,47,12,'#fff9e066');ellipse(c,x-20,86+(i%3)*43,21,18,'#fff9e066');}}
  c.save();c.translate(-cam,0);
  for(const base of map.platforms){const p=platformAt(base,t);if(p.x+p.w<cam-80||p.x>cam+w+80)continue;
   if(p.move){c.strokeStyle=pal.front+'88';c.lineWidth=2;c.setLineDash([4,8]);c.beginPath();c.moveTo(base.x+base.w/2-(base.move?.axis==='x'?base.move.range:0),base.y+(base.move?.axis==='y'?-base.move.range:0));c.lineTo(base.x+base.w/2+(base.move?.axis==='x'?base.move.range:0),base.y+(base.move?.axis==='y'?base.move.range:0));c.stroke();c.setLineDash([]);}
   rr(c,p.x,p.y,p.w,p.h,9,pal.earth);rr(c,p.x,p.y,p.w,18,8,pal.edge);rr(c,p.x,p.y-2,p.w,9,5,pal.top);
   if(p.belt){rr(c,p.x+8,p.y+3,p.w-16,13,5,'#29484c');for(let a=0;a<p.w-25;a+=32){const x=p.x+12+(a+t*Math.abs(p.belt))%(p.w-24);path(c,[[x,p.y+6],[x+7,p.y+10],[x,p.y+14]],pal.accent);}}
   if(!this.low){for(let a=24;a<p.w-14;a+=51){const yy=p.y+38+(a%31);path(c,[[p.x+a,yy],[p.x+a+16,yy-4],[p.x+a+22,yy+6],[p.x+a+7,yy+10]],pal.edge+'88');}
    if(!p.move&&p.w>160){for(let a=38;a<p.w-30;a+=123){const xx=p.x+a;
     if(map.theme<2){c.strokeStyle=pal.edge;c.lineWidth=2;c.beginPath();c.moveTo(xx,p.y-3);c.quadraticCurveTo(xx-7,p.y-17,xx-14,p.y-17);c.moveTo(xx,p.y-3);c.quadraticCurveTo(xx+1,p.y-23,xx+9,p.y-23);c.stroke();ellipse(c,xx+10,p.y-24,4,4,a%2?'#f4daa0':'#eeeace');}
     else if(map.theme===3){path(c,[[xx-9,p.y],[xx-6,p.y-28],[xx,p.y-38],[xx+7,p.y-20],[xx+8,p.y]],'#9bd2db');path(c,[[xx,p.y-38],[xx+7,p.y-20],[xx+8,p.y],[xx,p.y]],'#bfa4d1');}
     else {ellipse(c,xx,p.y-3,14,7,pal.edge);}
    }}
   }
  }
  for(const cp of map.checkpoints){if(cp.x<cam-50||cp.x>cam+w)continue;c.strokeStyle=pal.front;c.lineWidth=4;c.beginPath();c.moveTo(cp.x,cp.y);c.lineTo(cp.x,cp.y-75);c.stroke();path(c,[[cp.x,cp.y-73],[cp.x+33,cp.y-66],[cp.x,cp.y-52]],'#e99170');ellipse(c,cp.x,cp.y-78,4,4,'#f0cf87');}
  for(const h of map.hazards){if(h.x+h.w<cam-80||h.x>cam+w)continue;const state=gateState(h,t),horizontal=h.w>h.h;rr(c,h.x-5,h.y-5,h.w+10,h.h+10,5,pal.front);rr(c,h.x,h.y,h.w,h.h,3,state==='active'?'#e7654e':state==='warning'?'#eebd57':'#8bbba0');c.fillStyle=state==='safe'?'#e0f5cd':'#fff4d5';c.font='bold 17px sans-serif';c.textAlign='center';if(horizontal){for(let xx=h.x+14;xx<h.x+h.w;xx+=28)c.fillText(state==='active'?'×':state==='warning'?'!':'·',xx,h.y+h.h/2+6);}else c.fillText(state==='active'?'×':state==='warning'?'!':'·',h.x+h.w/2,h.y+h.h/2+6);}
  if(map.finish>cam-160&&map.finish<cam+w+100){
   rr(c,map.finish-12,232,13,198,5,pal.front);rr(c,map.finish+115,232,13,198,5,pal.front);rr(c,map.finish-20,221,156,45,10,pal.accent);
   c.fillStyle='#244f4b';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText(chase>-500?'생존 계속 →':'FINISH',map.finish+58,250);
   for(let i=0;i<8;i++)for(let j=0;j<2;j++)rr(c,map.finish+i*14,410+j*10,14,10,0,(i+j)%2?'#285a53':'#fff0cc');
   c.strokeStyle='#fff1c988';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();c.moveTo(map.finish,267);c.lineTo(map.finish,410);c.stroke();c.setLineDash([]);
  }
  const nearby=players.filter(p=>p.id!==focus&&p.x>cam-80&&p.x<cam+w+80&&p.status!=='spectator');
  const label=(p:Player,own:boolean,index=0)=>{const name=p.name||'루미';c.font=own?'bold 12px sans-serif':'11px sans-serif';const width=Math.min(190,c.measureText(name).width+16),yy=p.y-104-(own?0:(1+index%3)*19);rr(c,p.x-width/2,yy,width,19,7,own?'#fff9e7':'#fff9e7cc');c.fillStyle='#1c5453';c.textAlign='center';c.fillText(name,p.x,yy+14,width-10);};
  for(const p of players)if(Math.abs(p.vx)>5)this.facings.set(p.id,p.vx<0?-1:1);
  for(const [i,p] of nearby.entries()){robot(c,p,t,1,p.status==='eliminated'?.2:.48,this.facings.get(p.id)||1);label(p,false,i);}
  if(me&&me.status!=='spectator'){robot(c,me,t,preview?1.65:1,me.respawn>0?.4:1,this.facings.get(me.id)||1);if(!preview)label(me,true);}
  if(chase>cam-100){const g=c.createLinearGradient(chase-160,0,chase+15,0);g.addColorStop(0,'#c5515922');g.addColorStop(1,'#df6656bb');c.fillStyle=g;c.fillRect(cam,0,chase-cam,560);c.strokeStyle='#ffab84';c.lineWidth=4;c.beginPath();c.moveTo(chase,0);c.lineTo(chase,560);c.stroke();}
  c.restore();if(!this.low){for(let i=0;i<10;i++){ellipse(c,((i*229-cam*.7+t*15)%w+w)%w,160+(i*97)%330,2,2,'#fff1be88');}}
  if(celebration>=0&&celebration<5){for(let i=0;i<(this.low?18:60);i++){const age=(celebration+i*.039)%3;const x=w*.5+Math.sin(i*1.71)*(80+age*180),y=110-age*80+age*age*75;c.save();c.translate(x,y);c.rotate(i+age*3);rr(c,-3,-5,6,10,1,['#edaa55','#ed8d77','#fff3c9','#6eac92'][i%4]);c.restore();}}
  this.frames++;if(performance.now()-this.lastMeasure>=1000){this.fps=Math.round(this.frames*1000/(performance.now()-this.lastMeasure));this.frames=0;this.lastMeasure=performance.now();}
 }
}
