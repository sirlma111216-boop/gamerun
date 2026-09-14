import type {Player} from '../../shared/types.js';

/** Personal completion UI. Online callers pass ONLY the server-confirmed player. */
export class FinishNotice {
 readonly element=document.createElement('section');
 private abort=new AbortController();private key='';private appeared=0;private dismissed=false;
 constructor(parent:HTMLElement,actions:{retry:()=>void;next:()=>void;exit:()=>void}){
  this.element.className='finish-notice';this.element.hidden=true;this.element.setAttribute('role','status');this.element.setAttribute('aria-live','polite');
  this.element.innerHTML='<div class="eyebrow">STAGE CLEAR</div><h2>완주했어요!</h2><p class="finish-map"></p><strong class="finish-time"></strong><p class="finish-message"></p><div class="actions"><button class="primary" data-finish="next">다음 맵 도전 →</button><button data-finish="retry">다시 도전</button><button data-finish="exit">맵 고르기</button><button class="primary" data-finish="watch">안내 닫기</button></div>';
  parent.append(this.element);
  for(const [name,action] of Object.entries({...actions,watch:()=>{this.dismissed=true;this.element.hidden=true;}}))this.element.querySelector(`[data-finish="${name}"]`)!.addEventListener('click',action,{signal:this.abort.signal});
 }
 reset(){this.key='';this.appeared=0;this.dismissed=false;this.element.hidden=true;}
 update(p:Player|undefined,practice:boolean,matchId:string,mapName:string,now:number,allowNext:boolean){
  if(!p||p.status!=='finished'||p.finishTick===null){this.element.hidden=true;return;}
  const key=`${matchId}:${p.id}:${p.finishTick}`;
  if(key!==this.key){this.key=key;this.appeared=now;this.dismissed=false;
   this.element.querySelector('.finish-map')!.textContent=mapName;
   this.element.querySelector('.finish-time')!.textContent=`${(p.finishTick/60).toFixed(2)}초`;
   this.element.querySelector('.finish-message')!.textContent=practice?'결승에 도착했어요. 다음 모험도 떠나볼까요?':'완주 기록을 저장했어요. 다른 친구들의 경기는 계속돼요.';
   for(const name of ['next','retry','exit','watch']){const b=this.element.querySelector<HTMLButtonElement>(`[data-finish="${name}"]`)!;b.hidden=name==='watch'?practice:!practice||(name==='next'&&!allowNext);}
  }
  this.element.hidden=this.dismissed||(!practice&&now-this.appeared>3500);
 }
 get visible(){return !this.element.hidden;}
 age(now:number){return this.key?(now-this.appeared)/1000:-1;}
 destroy(){this.abort.abort();this.element.remove();}
}

