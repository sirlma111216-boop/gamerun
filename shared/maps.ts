import type {MapData,Platform} from './types.js';
export const MAP_INFO=[
 {id:1,name:'초원',theme:0,description:'넓은 징검다리에서 배우는 첫 모험',difficulty:'입문'},
 {id:2,name:'공중정원',theme:1,description:'공중의 이동 발판을 두 번 이어 넘어가요',difficulty:'쉬움'},
 {id:3,name:'사막',theme:2,description:'엇갈리는 승강석과 끊어진 다리',difficulty:'보통'},
 {id:4,name:'수정동굴',theme:3,description:'가로 빛장벽과 높낮이를 읽는 타이밍',difficulty:'도전'},
 {id:5,name:'별빛공장',theme:4,description:'급가속 운반로 끝의 절벽, 연속 공중 관문',difficulty:'익스트림'}
];
export const COURSE_PLANS=[
 ['bridge','steps','gate','broken','shuttle','belt'],
 ['double','gate','shuttle','steps','double','broken'],
 ['lifts','broken','double','floor','lifts','gate'],
 ['floor','double','lifts','ceiling','floor','rush'],
 ['rush','lifts','ceiling','double','rush','floor']
];
export function createMap(id=1,duration=60):MapData {
 const info=MAP_INFO.find(m=>m.id===id);if(!info)throw Error('초원부터 별빛공장까지 5개 맵 중 선택해 주세요.');
 const count=duration===30?4:duration===45?7:duration===90?14:9;
 const finish=640+count*1280;
 const m:MapData={...info,platforms:[],hazards:[],checkpoints:[{x:100,y:430}],finish,length:finish+1500};
 const add=(x:number,y:number,w:number,h=160,extra:Partial<Platform>={})=>m.platforms.push({id:`p${m.platforms.length}`,x,y,w,h,...extra});
 add(-400,430,1040);
 for(let section=0;section<count;section++){
  const x=640+section*1280,kind=COURSE_PLANS[id-1][section%6],hard=id>=4;
  m.checkpoints.push({x:x+70,y:430});
  const gate=(at:number,y=318,w=28,h=112)=>m.hazards.push({x:x+at,y,w,h,period:hard?3:3.6,phase:section*.47,active:hard?1.25:.8,warning:.65});
  if(kind==='bridge'){add(x,430,360);add(x+440,430,310);add(x+845,405,435);}
  if(kind==='steps'){add(x,430,300);add(x+300,375,200);add(x+500,330,180);add(x+760,380,190);add(x+1040,430,240);}
  if(kind==='gate'){add(x,430,800);gate(485);add(x+900,410,380);}
  if(kind==='broken'){add(x,430,340);add(x+435,412,90);add(x+625,392,100);add(x+825,420,455);}
  if(kind==='shuttle'){add(x,430,360);add(x+445,400,150,26,{move:{axis:'x',range:35,period:3.8,phase:section}});add(x+700,390,250);add(x+1040,430,240);}
  if(kind==='belt'){add(x,430,380);add(x+460,430,390,160,{belt:70});add(x+965,420,315);}
  if(kind==='double'||kind==='ceiling'){
   add(x,430,360);
   add(x+430,365,170,26,{move:{axis:'x',range:hard?36:24,period:3.8,phase:0}});
   add(x+680,300,180,26,{move:{axis:'x',range:hard?36:24,period:3.8,phase:Math.PI}});
   add(x+930,385,350);
   if(kind==='ceiling')gate(978,284,132,22);
  }
  if(kind==='lifts'){
   add(x,430,360);
   add(x+435,365,170,26,{move:{axis:'y',range:hard?32:24,period:3.8,phase:0}});
   add(x+685,310,175,26,{move:{axis:'y',range:hard?32:24,period:3.8,phase:Math.PI}});
   add(x+950,400,330);
  }
  if(kind==='floor'){add(x,430,750);gate(460,410,hard?150:100,20);add(x+850,365,180);add(x+1110,430,170);gate(1148,318);}
  if(kind==='rush'){add(x,430,220);add(x+220,430,460,160,{belt:id===5?210:140});add(x+870,395,190);add(x+1150,430,130);}
 }
 add(finish,430,1500);
 return m;
}
