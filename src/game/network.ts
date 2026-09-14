import {decodeFrame} from '../../shared/wire.js';
import type {Snapshot} from '../../shared/types.js';
export type Credentials={code:string;id:string;token:string;role:'host'|'player';name:string};
export class Connection {
 socket:WebSocket|null=null;credentials:Credentials|null=null;stopped=false;retry=0;timer:ReturnType<typeof setTimeout>|null=null;state:Snapshot|null=null;
 constructor(public url:string,public onState:(s:Snapshot)=>void,public onStatus:(s:string)=>void,public onError:(s:string)=>void,public onJoined:(c:Credentials)=>void){}
 connect(message:Record<string,unknown>){
  this.stopped=false;this.onStatus('서버에 연결 중');this.socket=new WebSocket(this.url);
  this.socket.onopen=()=>{this.retry=0;this.send(message);};
  this.socket.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.type==='joined'){this.credentials={code:m.code,id:m.id,token:m.token,role:m.role,name:String(message.name||this.credentials?.name||'교사')};this.onJoined(this.credentials!);this.onStatus('실시간 연결됨');}if(m.type==='state'||m.type==='frame'){const next=decodeFrame(m,this.state);if(next){this.state=next;this.onState(next);}}if(m.type==='error'){this.onError(m.message);if(!this.state){this.stopped=true;this.socket?.close();}}}catch{this.onError('서버 응답을 읽지 못했어요.');}};
  this.socket.onclose=e=>{if(this.stopped)return;if(e.code===4001||e.code===4000){this.onError(e.reason);this.stopped=true;return;}this.onStatus('연결 끊김 · 다시 연결 중');this.timer=setTimeout(()=>{if(this.credentials)this.connect({...this.credentials,type:'join'});else this.onError('서버에 연결하지 못했어요. 실행 창을 확인해 주세요.');},Math.min(5000,500*2**this.retry++));};
  this.socket.onerror=()=>this.onStatus('서버 연결 확인 중');
 }
 send(m:unknown){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(m));}
 destroy(){this.stopped=true;if(this.timer)clearTimeout(this.timer);if(this.socket){this.socket.onmessage=null;this.socket.onclose=null;this.socket.onerror=null;this.socket.onopen=null;this.socket.close();}this.socket=null;}
}
