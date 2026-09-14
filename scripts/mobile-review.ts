import {mountLumiRun} from '../src/game/module.js';
import {SceneRenderer} from '../src/game/art.js';
import {makePlayer} from '../shared/physics.js';
import {createMap} from '../shared/maps.js';
mountLumiRun(document.querySelector('#app')!,{participant:{id:'module-review-student',name:'앱에서온루미'},map:5,title:'모듈 닉네임 확인',storageKey:'module-review'});
const render=new SceneRenderer(document.querySelector('#bench')!),map=createMap(5);
const players=Array.from({length:30},(_,i)=>({...makePlayer(String(i),`테스트${i+1}`),x:180+i*20,vx:260}));
render.render(map,players,'15',0,{instant:true});
document.querySelector('#measure')!.addEventListener('click',()=>{
 const results=[];
 for(const low of [false,true]){render.low=low;const times:number[]=[];
  for(let i=0;i<140;i++){const start=performance.now();render.render(map,players,'15',i/60,{instant:true});if(i>=20)times.push(performance.now()-start);}
  times.sort((a,b)=>a-b);results.push({quality:low?'가벼움':'기본',players:30,frames:120,width:innerWidth,height:innerHeight,meanMs:Number((times.reduce((a,b)=>a+b,0)/times.length).toFixed(2)),p95Ms:Number(times[Math.floor(times.length*.95)].toFixed(2))});
 }
 document.querySelector('#result')!.textContent=JSON.stringify(results,null,2);
});
