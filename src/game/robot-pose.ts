export type Point={x:number;y:number};
// Side-view two-link legs. The stance foot stays at ground level; the return
// stroke lifts the ankle. Knees always bend forward, never exchange hip sockets.
export function runFoot(phase:number):Point {
 const q=((phase%1)+1)%1;
 if(q<.6)return {x:18-36*q/.6,y:-4};
 const swing=(q-.6)/.4;return {x:-18+36*swing,y:-4-Math.sin(swing*Math.PI)*12};
}
export function kneeBetween(hip:Point,foot:Point):Point {
 const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.max(.01,Math.hypot(dx,dy));
 const a=(16*16-17*17+d*d)/(2*d),h=Math.sqrt(Math.max(0,16*16-a*a));
 return {x:hip.x+dx/d*a+dy/d*h,y:hip.y+dy/d*a-dx/d*h};
}
