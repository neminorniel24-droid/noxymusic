/* NoxyMusic · hand tracking and main loop */
const len=()=>$("bars").value*4*60000/$("bpm").value;
function loop(){
 if(!running)return;
 const now=performance.now(),r=lm.detectForVideo(video,now);ctx.clearRect(0,0,cv.width,cv.height);
 const hs=r.landmarks.map((l,i)=>({l,R:r.handedness[i][0].categoryName==="Left"}));let ph=null,vh=null;
 if(hs.length===1)ph=hs[0].l;else{hs.forEach(h=>{h.R?ph=h.l:vh=h.l});if(!ph&&hs.length)ph=hs[0].l}
 const cur=ph?idxFromT(norm(ph[9].y)):-1;bars();ladder(cur);hs.forEach(h=>dots(h.l,h.l===ph?"#8b5cf6":"#22d3ee"));
 let on=!!ph,v=0;
 if(on&&$("mode").value==="pinch")on=Math.hypot(ph[4].x-ph[8].x,ph[4].y-ph[8].y)/Math.hypot(ph[0].x-ph[9].x,ph[0].y-ph[9].y)<.35;
 if(on){lastF=hz(midi(cur));v=(vh?1-norm(vh[9].y):.6)*.45}
 hv.set(lastF,v);const label=on?nm(midi(cur)):"";if(label!==lastNote){$("note").textContent=label;lastNote=label}
 fcx.clearRect(0,0,fc.width,fc.height);
 if(ch&&fl){const fr=fl.detectForVideo(video,now);if(fr.faceLandmarks.length){const l=fr.faceLandmarks[0];let x0=1,x1=0,y0=1,y1=0;
  for(const q of l){if(q.x<x0)x0=q.x;if(q.x>x1)x1=q.x;if(q.y<y0)y0=q.y;if(q.y>y1)y1=q.y}
  const W=fc.width,H=fc.height,a={x:(1-l[33].x)*W,y:l[33].y*H},b={x:(1-l[263].x)*W,y:l[263].y*H},ang=a.x<b.x?Math.atan2(b.y-a.y,b.x-a.x):Math.atan2(a.y-b.y,a.x-b.x),sz=Math.max((x1-x0)*W,(y1-y0)*H)*1.4;
  fcx.save();fcx.translate((1-(x0+x1)/2)*W,(y0+y1)/2*H);fcx.rotate(ang);fcx.font=`${sz}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;fcx.textAlign="center";fcx.textBaseline="middle";fcx.fillText(ch,0,sz*.06);fcx.restore()}}
 const L=len();
 if(loopT0!==null){const el=now-loopT0,p=el%L,cyc=Math.floor(el/L);$("lpb").style.width=p/L*100+"%";
  if(rs){if(rs.armed&&cyc>rs.cyc){rs.armed=false;rs.st=loopT0+cyc*L;$("lmsg").textContent="Recording… play now!"}
   if(!rs.armed){rs.ev.push({t:now-rs.st,f:lastF,v});if(now-rs.st>=L){const n=$("inst").value;tracks.push({ev:rs.ev,v:voice(n),mute:false,i:0,last:0,n});rs=null;rows();$("lmsg").textContent="Saved. Record another layer or press Clear."}}}
  tracks.forEach(t=>{if(p<t.last)t.i=0;t.last=p;while(t.i+1<t.ev.length&&t.ev[t.i+1].t<=p)t.i++;const e=t.ev[t.i];t.v.set(e.f,t.mute?0:e.v)})}
 if($("metro").checked){const bm=60000/$("bpm").value,b=Math.floor((now-(loopT0??0))/bm);if(b!==lastBeat){lastBeat=b;tone("square",b%4===0?1600:1100,0,.04,.2,6000)}}
 rcx.filter=filt;rcx.save();rcx.translate(rc.width,0);rcx.scale(-1,1);rcx.drawImage(video,0,0,rc.width,rc.height);rcx.restore();rcx.filter="none";rcx.drawImage(fc,0,0);if($("ovl").checked)rcx.drawImage(cv,0,0);
 requestAnimationFrame(loop);
}
