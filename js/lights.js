/* NoxyMusic · DJ lights v2: dark flashes, tempo-aware auto show, full-screen mode */
(()=>{
 const cvs=document.createElement("canvas");cvs.id="lights";document.body.append(cvs);
 const g=cvs.getContext("2d"),L={mode:"off",only:false,lvl:0,ls:0,sf:0,fx:0,fy:0,fh:0,dirty:false};
 let W=0,H=0,flash=0,hue=260,avg=0,lastBeat=0,lastSynth=0,okFlash=false,spots=[],last=0,bpm=120,beatN=0,scStart=0,scene=0,blackUntil=0,tick=0;
 const times=[],SCENES=["beams","flashes","disco","laser","pulse","flashes"],FLASHY=["strobe","flashes","show"];
 const fit=()=>{W=cvs.width=innerWidth;H=cvs.height=innerHeight};
 addEventListener("resize",fit);fit();
 $("p-dj").insertAdjacentHTML("beforeend",`<h3>DJ lights</h3>
<div class="fl"><select id="lmode" aria-label="Light show style"><option value="off">Off</option><option value="show">Auto show (vibe)</option><option value="flashes">Dark + sudden flashes</option><option value="beams">Beams</option><option value="disco">Disco spots</option><option value="laser">Laser fan</option><option value="pulse">Pulse</option><option value="strobe">Strobe</option></select><button id="lonly">Lights only (L)</button></div>
<div class="row">Brightness<input id="lint" type="range" min=".2" max="1" step=".05" value=".8" aria-label="Light brightness"></div>
<div id="lstat" class="small"></div>
<p class="small">Auto show follows the tempo of your song and moves through scenes: beams, blackout, sudden flashes, disco, lasers. With no music it runs at 120 BPM. Flashing modes flash at most 3 times a second.</p>`);
 $("lmode").onchange=()=>{
  const m=$("lmode").value;
  if(FLASHY.includes(m)){
   if(matchMedia("(prefers-reduced-motion: reduce)").matches){toast("Flashing lights are off because your system asks for reduced motion");$("lmode").value=L.mode;return}
   if(!okFlash&&!confirm("Warning: these lights flash suddenly and can trigger seizures in people with photosensitive epilepsy. Turn them on?")){$("lmode").value=L.mode;return}
   okFlash=true;
  }
  L.mode=m;scene=0;scStart=beatN;
 };
 function enter(){
  if(L.mode==="off"){$("lmode").value="show";$("lmode").onchange();if(L.mode==="off")$("lmode").value="beams",$("lmode").onchange()}
  L.only=true;document.body.classList.add("lights-only");
  const b=document.createElement("button");b.id="exitLights";b.textContent="Exit lights (Esc)";b.onclick=exit;document.body.append(b);
  Promise.resolve(document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()).catch(()=>{});
 }
 function exit(){
  L.only=false;document.body.classList.remove("lights-only");
  const b=$("exitLights");if(b)b.remove();
  if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();
 }
 $("lonly").onclick=()=>L.only?exit():enter();
 addEventListener("keydown",e=>{
  if(e.key==="Escape"&&L.only)exit();
  if(e.key.toLowerCase()==="l"&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat)$("lonly").click();
 });
 document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&L.only)exit()});
 function tempo(){
  const k=+$("xf").value<.5?"A":"B",a=D[k].a;
  if(BPMS[k]&&a.src&&!a.paused)return Math.min(170,Math.max(70,BPMS[k]*a.playbackRate));
  if(times.length>4){
   const iv=[];for(let i=1;i<times.length;i++)iv.push(times[i]-times[i-1]);
   iv.sort((x,y)=>x-y);let v=60000/iv[iv.length>>1];
   while(v<70)v*=2;while(v>170)v/=2;return v;
  }
  return 120;
 }
 function beat(now){
  let b=false;const per=60000/bpm;
  if(an&&fd){
   an.getByteFrequencyData(fd);
   const bass=(fd[0]+fd[1]+fd[2])/765;
   L.lvl=fd.reduce((s,v)=>s+v,0)/fd.length/255;
   avg=avg*.94+bass*.06;
   if(L.lvl>.02){if(bass>.3&&bass>avg*1.25&&now-lastBeat>340){b=true;times.push(now);if(times.length>9)times.shift()}}
   else if(now-lastSynth>per){b=true;lastSynth=now;L.lvl=.35}
  }else if(now-lastSynth>per){b=true;lastSynth=now;L.lvl=.35}
  if(b)lastBeat=now;
  return b;
 }
 const SC={
  pulse(I){
   const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.8);
   gr.addColorStop(0,`hsla(${hue},100%,60%,${flash*I*.7})`);gr.addColorStop(1,"rgba(0,0,0,0)");
   g.fillStyle=gr;g.fillRect(0,0,W,H);
  },
  beams(I,t){
   for(let i=0;i<7;i++){
    const x=W*(i+.5)/7,a=Math.sin(t*.9+i*1.3)*.6,len=H*1.2,w=(.07+L.lvl*.12+flash*.08)*W/3;
    g.save();g.translate(x,-10);g.rotate(a);
    const gr=g.createLinearGradient(0,0,0,len);
    gr.addColorStop(0,`hsla(${(hue+i*40)%360},100%,65%,${Math.min(1,(.35+flash*.45)*I)})`);gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.beginPath();g.moveTo(-3,0);g.lineTo(3,0);g.lineTo(w,len);g.lineTo(-w,len);g.closePath();g.fill();g.restore();
   }
  },
  disco(I,t,b){
   if(b||!spots.length)spots=Array.from({length:9},()=>({x:Math.random()*W,y:Math.random()*H,h:Math.random()*360,r:(.12+Math.random()*.14)*Math.min(W,H)}));
   spots.forEach(s=>{
    const gr=g.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*(1+flash*.4));
    gr.addColorStop(0,`hsla(${s.h},100%,60%,${Math.min(1,(.35+flash*.5)*I)})`);gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.fillRect(s.x-s.r*2,s.y-s.r*2,s.r*4,s.r*4);
   });
  },
  laser(I,t){
   g.lineWidth=2;g.shadowBlur=14;
   for(let i=0;i<16;i++){
    const a=Math.PI*(1.1+.8*i/15)+Math.sin(t*1.3+i)*.18,col=`hsla(${(hue+i*12)%360},100%,60%,${Math.min(1,(.5+flash*.5)*I)})`;
    g.strokeStyle=col;g.shadowColor=col;g.beginPath();g.moveTo(W/2,H);g.lineTo(W/2+Math.cos(a)*H*1.6,H+Math.sin(a)*H*1.6);g.stroke();
   }
   g.shadowBlur=0;
  },
  strobe(I,t,b,now){if(b&&now-L.ls>340){L.ls=now;L.sf=1}},
  flashes(I,t,b,now){
   if(b&&Math.random()<.6&&now-L.ls>340){L.ls=now;L.sf=1;L.fx=Math.random()*W;L.fy=Math.random()*H*.7;L.fh=hue}
  }
 };
 function burst(I,white){
  const s=Math.min(1,L.sf);
  if(white){g.fillStyle=`rgba(255,255,255,${s*I*.85})`;g.fillRect(0,0,W,H);return}
  const gr=g.createRadialGradient(L.fx,L.fy,0,L.fx,L.fy,Math.max(W,H)*(.5+.5*s));
  gr.addColorStop(0,`rgba(255,255,255,${s*I})`);gr.addColorStop(.3,`hsla(${L.fh},100%,62%,${s*I*.8})`);gr.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.fillStyle=`hsla(${L.fh},100%,55%,${s*I*.22})`;g.fillRect(0,0,W,H);
 }
 function draw(now){
  requestAnimationFrame(draw);
  const dt=Math.min(100,now-last);last=now;
  if(L.mode==="off"&&!L.only){if(L.dirty){g.clearRect(0,0,W,H);L.dirty=false}return}
  bpm=tempo();const per=60000/bpm,b=beat(now),I=+$("lint").value,t=now/1000;
  if(b)beatN++;
  let m=L.mode;
  if(m==="show"){
   if(b){
    const pos=beatN-scStart;
    if(pos>=8){scene++;scStart=beatN;hue=(hue+70)%360;L.sf=1;L.fx=W/2;L.fy=H/2;L.fh=hue;L.ls=now}
    else if(pos===7)blackUntil=now+per*.9;
   }
   m=SCENES[scene%SCENES.length];
  }
  L.dirty=true;
  const dark=L.only||L.mode==="flashes"||L.mode==="show";
  cvs.style.mixBlendMode=dark?"normal":"screen";
  g.globalCompositeOperation="source-over";
  if(L.only){g.fillStyle="rgba(0,0,0,.25)";g.fillRect(0,0,W,H)}
  else{g.clearRect(0,0,W,H);if(dark){g.fillStyle="rgba(0,0,0,.93)";g.fillRect(0,0,W,H)}}
  if(++tick%15===0)$("lstat").textContent=`Tempo ${Math.round(bpm)} BPM`+(L.mode==="show"?` · scene: ${m}`:"");
  if(now<blackUntil){L.sf=0;return}
  g.globalCompositeOperation="lighter";
  if(b){hue=(hue+(L.mode==="show"?23:47))%360;flash=Math.max(flash,1)}
  flash*=Math.exp(-dt/(per*.22));
  L.sf*=Math.exp(-dt/75);
  const fn=SC[m]||SC.beams;fn(I,t,b,now);
  if(L.sf>.04)burst(I,m==="strobe");
 }
 requestAnimationFrame(draw);
})();
