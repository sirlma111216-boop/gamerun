import type {Input} from '../../shared/types.js';
export class Controls {
 keys=new Set<string>();pointers=new Map<number,string>();abort=new AbortController();jumpLatch=false;
 constructor(public root:ShadowRoot,public surface:HTMLElement){
  const signal=this.abort.signal;
  surface.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select,textarea'))return;if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code)){e.preventDefault();this.keys.add(e.code);if(!e.repeat&&['ArrowUp','Space','KeyW'].includes(e.code))this.jumpLatch=true;}},{signal});
  surface.addEventListener('keyup',e=>this.keys.delete(e.code),{signal});
  window.addEventListener('blur',()=>this.clear(),{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();},{signal});
  surface.addEventListener('focusout',e=>{if(!surface.contains(e.relatedTarget as Node))this.clear();},{signal});
  root.querySelectorAll<HTMLElement>('[data-control]').forEach(button=>{
   button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,button.dataset.control!);if(button.dataset.control==='jump')this.jumpLatch=true;button.classList.add('pressed');},{signal});
   const release=(e:PointerEvent)=>{this.pointers.delete(e.pointerId);button.classList.remove('pressed');};
   button.addEventListener('pointerup',release,{signal});button.addEventListener('pointercancel',release,{signal});button.addEventListener('lostpointercapture',release,{signal});
   button.addEventListener('pointermove',e=>{const r=button.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)release(e);},{signal});
  });
 }
 value():Input{const p=[...this.pointers.values()];return {left:this.keys.has('ArrowLeft')||this.keys.has('KeyA')||p.includes('left'),right:this.keys.has('ArrowRight')||this.keys.has('KeyD')||p.includes('right'),jump:this.jumpLatch||this.keys.has('Space')||this.keys.has('ArrowUp')||this.keys.has('KeyW')||p.includes('jump')};}
 consumeJump(){this.jumpLatch=false;}
 clear(){this.jumpLatch=false;this.keys.clear();this.pointers.clear();this.root.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed'));}
 destroy(){this.clear();this.abort.abort();}
}
