/* NoxyMusic · round turntable decks: spinning vinyl, progress ring, scratch by dragging */
import {D} from "./state.js";
import {ensureAudio} from "./audio.js";

import {BPMS} from "./beat.js";
import {$} from "./core.js";
(()=>{
 const ang={A:0,B:0},cvs={A:$("plA"),B:$("plB")},COL={A:["#8b5cf6","#6d28d9"],B:["#22d3ee","#0e7490"]};
 let last=performance.now();
 function draw(k,playing){
  const c=cvs[k],g=c.getContext("2d"),S=c.width,R=S/2,a=D[k].a,prog=a.duration?a.currentTime/a.duration:0,col=COL[k][0];
  g.clearRect(0,0,S,S);
  g.lineWidth=7;g.strokeStyle="rgba(255,255,255,.1)";g.beginPath();g.arc(R,R,R-8,0,Math.PI*2);g.stroke();
  g.strokeStyle=col;g.shadowColor=col;g.shadowBlur=playing?16:0;
  g.beginPath();g.arc(R,R,R-8,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);g.stroke();g.shadowBlur=0;
  g.save();g.translate(R,R);g.rotate(ang[k]);
  const vr=R-22,vg=g.createRadialGradient(0,0,vr*.2,0,0,vr);
  vg.addColorStop(0,"#1c1c28");vg.addColorStop(1,"#07070c");
  g.fillStyle=vg;g.beginPath();g.arc(0,0,vr,0,Math.PI*2);g.fill();
  g.lineWidth=1;g.strokeStyle="rgba(255,255,255,.06)";
  for(let r=vr*.38;r<vr-4;r+=4){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke()}
  if(g.createConicGradient){
   const cg=g.createConicGradient(0,0,0);
   [[0,0],[.08,.16],[.16,0],[.5,0],[.58,.12],[.66,0],[1,0]].forEach(([p,o])=>cg.addColorStop(p,`rgba(255,255,255,${o})`));
   g.fillStyle=cg;g.beginPath();g.arc(0,0,vr,0,Math.PI*2);g.fill();
  }
  const lr=vr*.34,lg=g.createLinearGradient(-lr,-lr,lr,lr);
  lg.addColorStop(0,col);lg.addColorStop(1,COL[k][1]);
  g.fillStyle=lg;g.beginPath();g.arc(0,0,lr,0,Math.PI*2);g.fill();
  g.fillStyle="rgba(255,255,255,.85)";g.fillRect(-2,-lr,4,lr*.45);
  g.restore();
  g.textAlign="center";g.fillStyle="#fff";g.font="700 34px Outfit,sans-serif";g.fillText(k,R,R+8);
  g.font="600 15px Outfit,sans-serif";g.fillStyle="rgba(255,255,255,.85)";
  g.fillText(BPMS[k]?BPMS[k]+" BPM":(a.src?(playing?"playing":"paused"):"no song"),R,R+30);
 }
 function loop(now){
  const dt=(now-last)/1000;last=now;
  for(const k of["A","B"]){
   const a=D[k].a,playing=!!a.src&&!a.paused;
   if(playing)ang[k]+=dt*Math.PI*2*(100/180)*a.playbackRate;
   draw(k,playing);
  }
  requestAnimationFrame(loop);
 }
 for(const k of["A","B"]){
  const c=cvs[k];let drag=false,la=0;
  const centre=()=>{const r=c.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width/2]};
  const pa=e=>{const[x,y]=centre();return Math.atan2(e.clientY-y,e.clientX-x)};
  c.onpointerdown=e=>{
   const[x,y,r]=centre();
   if(Math.hypot(e.clientX-x,e.clientY-y)/r<.34){ensureAudio();$("play"+k).click();return}
   drag=true;la=pa(e);c.setPointerCapture(e.pointerId);
  };
  c.onpointermove=e=>{
   if(!drag)return;
   const a=pa(e);let d=a-la;
   if(d>Math.PI)d-=2*Math.PI;
   if(d<-Math.PI)d+=2*Math.PI;
   la=a;ang[k]+=d;
   const au=D[k].a;
   if(au.duration)au.currentTime=Math.min(au.duration,Math.max(0,au.currentTime+d/(Math.PI*2)*1.8));
  };
  c.onpointerup=c.onpointercancel=()=>{drag=false};
 }
 requestAnimationFrame(loop);
})();
