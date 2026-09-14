import {mountLumiRun,type LumiAPI} from './game/module.js';
import type {GameResult} from '../shared/types.js';
const b=location.pathname.includes('lesson-b');const activityId=b?'math-team-02':'eco-explore-01';
const toolbar=document.getElementById('lesson-tools')!;toolbar.style.cssText='padding:15px 40px;background:#204844;color:#fff3d7;font:14px system-ui;display:flex;gap:15px;flex-wrap:wrap;align-items:center';
toolbar.innerHTML=`<strong>${b?'02 / 협력 수학 수업':'01 / 환경 탐험 수업'}</strong><button id="remove">게임 화면 제거</button><button id="insert">다시 삽입</button><span id="next">${b?'점수표: 아직 경기 결과가 없어요.':'다음 활동 발표자: 경기 후 정해져요.'}</span>`;
let game:LumiAPI|null=null;const ledgerKey=`lumi:lesson-ledger:${activityId}`;
let ledger:{matches:string[];scores:Record<string,{name:string;score:number}>;lastNames:string[]}={matches:[],scores:{},lastNames:[]};try{ledger=JSON.parse(localStorage.getItem(ledgerKey)||'null')||ledger;}catch{}
function display(){document.getElementById('next')!.textContent=b?'점수표: '+(Object.values(ledger.scores).map(p=>`${p.name} ${p.score}점`).join(' / ')||'아직 결과 없음'):'다음 활동 발표자: '+(ledger.lastNames.join(', ')||'아직 결과 없음');}
function result(r:GameResult){if(ledger.matches.includes(r.matchId))return;ledger.matches.push(r.matchId);ledger.lastNames=r.players.filter(p=>r.selectedIds.includes(p.id)).map(p=>p.name);for(const p of r.players){if(p.bot||p.status==='spectator'||p.status==='disconnected')continue;ledger.scores[p.id]??={name:p.name,score:0};ledger.scores[p.id].score+=r.selectedIds.includes(p.id)?3:1;}localStorage.setItem(ledgerKey,JSON.stringify(ledger));display();}
function insert(){if(game)return;game=mountLumiRun(document.getElementById('app')!,{title:b?'함께 풀고, 함께 뛰는 수학 모험':'초록 지구를 탐험하는 우리',description:b?'선정된 탐험대에게 3점, 함께한 친구에게 1점!':'먼저 도착한 친구가 다음 환경 이야기의 발표자가 돼요.',activityId,map:b?2:1,rules:{mode:b?'last':'race',text:b?'협력 탐험 점수를 받았어요!':'다음 환경 이야기의 발표자'},joinBaseUrl:location.pathname,onResult:result});}
document.getElementById('remove')!.onclick=()=>{game?.destroy();game=null;};document.getElementById('insert')!.onclick=insert;display();insert();
