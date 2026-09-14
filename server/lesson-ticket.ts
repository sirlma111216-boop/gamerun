import {createHmac,timingSafeEqual} from 'node:crypto';
import {LESSON_TICKET_AUDIENCE,LESSON_TICKET_ISSUER,NAME_MAX,type LessonTicket} from '../shared/lesson.js';
/** 강의 앱과 같은 방식 — 서명 재료는 base64url(payload) 문자열 그대로 */
const b64url=(buf:Buffer|string)=>Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function signLessonTicket(payload:Omit<LessonTicket,'iss'|'aud'>,secret:string):string {
 const body=b64url(JSON.stringify({iss:LESSON_TICKET_ISSUER,aud:LESSON_TICKET_AUDIENCE,...payload}));
 return `${body}.${b64url(createHmac('sha256',secret).update(body).digest())}`;
}
/** 서명·발급자·대상·만료·필드를 확인한다. 하나라도 어긋나면 null. */
export function verifyLessonTicket(ticket:unknown,secret:string,now=Date.now()):LessonTicket|null {
 if(!secret||typeof ticket!=='string')return null;
 const dot=ticket.indexOf('.');if(dot<=0)return null;
 const body=ticket.slice(0,dot),sig=ticket.slice(dot+1);
 const expected=b64url(createHmac('sha256',secret).update(body).digest());
 const a=Buffer.from(sig),b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return null;
 let p:Partial<LessonTicket>;
 try{p=JSON.parse(Buffer.from(body.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));}catch{return null;}
 if(p.iss!==LESSON_TICKET_ISSUER||p.aud!==LESSON_TICKET_AUDIENCE)return null;
 if(typeof p.cid!=='string'||typeof p.lid!=='string'||typeof p.act!=='string'||typeof p.sub!=='string'||!p.cid||!p.lid||!p.act||!p.sub)return null;
 if(p.role!=='teacher'&&p.role!=='student')return null;
 if(typeof p.exp!=='number'||typeof p.iat!=='number'||p.exp*1000<now||p.iat*1000>now+5*60*1000)return null;
 const name=(typeof p.name==='string'?p.name:'').trim().slice(0,NAME_MAX)||(p.role==='teacher'?'교사':'학생');
 return {iss:p.iss,aud:p.aud,cid:p.cid,lid:p.lid,act:p.act,sub:p.sub,name,role:p.role,iat:p.iat,exp:p.exp};
}
/** 결과 전달 서명 — 본문 그대로에 HMAC. 헤더 x-lumi-signature: sha256=<hex> */
export function signBody(body:string,secret:string):string {return `sha256=${createHmac('sha256',secret).update(body).digest('hex')}`;}
