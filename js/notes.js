/* NoxyMusic · scales, note ladder and drawing */
import {$, ctx, cv} from "./core.js";
import {OCT, SCALES, idxAt, midiAt, nm} from "./lib/music.js";
import {S} from "./state.js";
export const sc=()=>SCALES[$("scale").value],root=()=>+$("key").value;
export const idxFromT=t=>idxAt(t,sc().length*OCT);
export const midi=i=>midiAt(sc(),root(),i);
export const norm=y=>Math.min(1,Math.max(0,(y-.12)/.76));
export function ladder(cur){const s=sc(),n=s.length*OCT,W=cv.width,H=cv.height,top=H*.12,band=H*.76/n;ctx.textAlign="right";ctx.font=`${Math.max(10,Math.min(15,band*.6))}px Outfit,sans-serif`;
 for(let i=0;i<n;i++){const y=top+(n-1-i)*band;ctx.fillStyle=i===cur?"rgba(139,92,246,.65)":i%s.length===0?"rgba(255,255,255,.13)":i%2?"rgba(255,255,255,.03)":"rgba(255,255,255,.06)";ctx.fillRect(0,y,W,band-1);ctx.fillStyle=i===cur?"#fff":"rgba(255,255,255,.55)";ctx.fillText(nm(midi(i)),W-10,y+band/2+4)}}
export function dots(l,c){ctx.shadowBlur=14;ctx.shadowColor=c;ctx.fillStyle=c;l.forEach((p,i)=>{ctx.beginPath();ctx.arc((1-p.x)*cv.width,p.y*cv.height,i===9?11:4,0,7);ctx.fill()});ctx.shadowBlur=0}
export function bars(){S.an.getByteFrequencyData(S.fd);const W=cv.width,H=cv.height,n=S.fd.length*.7,w=W/n;ctx.fillStyle="rgba(34,211,238,.55)";for(let i=0;i<n;i++){const h=S.fd[i]/255*H*.22;ctx.fillRect(i*w,H-h,w-2,h)}}
