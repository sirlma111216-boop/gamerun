import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Connection} from '../src/game/network.js';
test('접속 정보에 joined 메시지 타입이 섞이지 않아 새로고침/재접속 join 유지',()=>{
 const original=globalThis.WebSocket;
 class Socket {static OPEN=1;readyState=1;onopen:(()=>void)|null=null;onmessage:((e:{data:string})=>void)|null=null;onclose:((e:{code:number;reason:string})=>void)|null=null;onerror:(()=>void)|null=null;sent:unknown[]=[];send(s:string){this.sent.push(JSON.parse(s));}close(){} }
 globalThis.WebSocket=Socket as unknown as typeof WebSocket;
 try{const c=new Connection('ws://localhost',()=>{},()=>{},()=>{},()=>{});c.connect({type:'join',code:'123456',name:'루미',id:'a'});const ws=c.socket as unknown as Socket;ws.onopen!();ws.onmessage!({data:JSON.stringify({type:'joined',code:'123456',id:'a',token:'secret',role:'player'})});assert.equal('type' in c.credentials!,false);c.connect({...c.credentials,type:'join'});const next=c.socket as unknown as Socket;next.onopen!();assert.equal((next.sent[0] as any).type,'join');c.destroy();assert.equal(c.socket,null);assert.equal(c.stopped,true);}finally{globalThis.WebSocket=original;}
});
