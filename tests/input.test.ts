import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Controls} from '../src/game/input.js';
test('두 손가락 이동+점프, 한 손가락 해제, 포커스 이탈, 리소스 제거',()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;const win=new EventTarget(),doc=new EventTarget();
 Object.assign(globalThis,{window:win,document:doc});
 class Button extends EventTarget{dataset:{control:string};classList={add:()=>{},remove:()=>{}};constructor(control:string){super();this.dataset={control};}setPointerCapture(_id:number){}getBoundingClientRect(){return {left:0,top:0,right:100,bottom:100};}}
 class Surface extends EventTarget{contains(){return false;}}
 const left=new Button('left'),right=new Button('right'),jump=new Button('jump'),surface=new Surface();
 const root={querySelectorAll:()=>[left,right,jump]};const pointer=(button:Button,type:string,id:number,x=20)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:20});button.dispatchEvent(e);};
 try{const controls=new Controls(root as unknown as ShadowRoot,surface as unknown as HTMLElement);
  pointer(right,'pointerdown',1);pointer(jump,'pointerdown',2);assert.deepEqual(controls.value(),{left:false,right:true,jump:true});controls.consumeJump();pointer(right,'pointerup',1);assert.deepEqual(controls.value(),{left:false,right:false,jump:true});
  pointer(jump,'pointercancel',2);assert.equal(controls.value().jump,false);pointer(left,'pointerdown',3);pointer(left,'pointermove',3,200);assert.equal(controls.value().left,false);
  pointer(right,'pointerdown',4);win.dispatchEvent(new Event('blur'));assert.deepEqual(controls.value(),{left:false,right:false,jump:false});
  controls.destroy();pointer(right,'pointerdown',5);assert.equal(controls.value().right,false);
 }finally{Object.assign(globalThis,{window:oldWindow,document:oldDocument});}
});
