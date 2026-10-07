/* NoxyMusic · DJ lights: audio-reactive light show, on top of the page or on the whole screen */
(()=>{
 const cvs=document.createElement("canvas");cvs.id="lights";document.body.append(cvs);
 const g=cvs.getContext("2d"),L={mode:"off",only:false,lvl:0,ls:0,sf:0,dirty:false};
 let W=0,H=0,flash=0,hue=260,avg=0,lastBeat=0,lastSynth=0,okStrobe=false,spots=[];
 const fit=()=>{W=cvs.width=innerWidth;H=cvs.height=innerHeight};
 addEventListener("resize",fit);fit();
 $("p-dj").insertAdjacentHTML("beforeend",`<h3>DJ lights</h3>
<div class="fl"><select id="lmode" aria-label="Light show style"><option value="off">Off</option><option value="pulse">Pulse</option><option value="beams">Beams</option><option value="disco">Disco spots</option><option value="laser">Laser fan</option><option value="strobe">Strobe (flashing)</option></select><button id="lonly">Lights only (L)</button></div>
<div class="row">Brightness<input id="lint" type="range" min=".2" max="1" step=".05" value=".8" aria-label="Light brightness"></div>
<p class="small">The lights follow the beat of your music. With no music playing they run at 120 BPM so you can preview them. Strobe flashes at most 3 times a second.</p>`);
 $("lmode").onchange=()=>{
  const m=$("lmode").value;
  if(m==="strobe"){
   if(matchMedia("(prefers-reduced-motion: reduce)").matches){toast("Strobe is off because your system asks for reduced motion");$("lmode").value=L.mode;return}
   if(!okStrobe&&!confirm("Warning: strobe lights flash and can trigger seizures in people with photosensitive epilepsy. Turn them on?")){$("lmode").value=L.mode;return}
   okStrobe=true;
  }
  L.mode=m;
 };
 function enter(){
  if(L.mode==="off"){L.mode="beams";$("lmode").value="beams"}
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
 function beat(now){
  let b=false;
  if(an&&fd){
   an.getByteFrequencyData(fd);
   const bass=(fd[0]+fd[1]+fd[2])/765;
   L.lvl=fd.reduce((s,v)=>s+v,0)/fd.length/255;
   avg=avg*.94+bass*.06;
   if(L.lvl>.02){if(bass>.3&&bass>avg*1.25&&now-lastBeat>220)b=true}
   else if(now-lastSynth>500){b=true;lastSynth=now;L.lvl=.35}
  }else if(now-lastSynth>500){b=true;lastSynth=now;L.lvl=.35}
  if(b)lastBeat=now;
  return b;
 }
 function draw(now){
  requestAnimationFrame(draw);
  const b=beat(now),m=L.mode,I=+$("lint").value,lvl=L.lvl;
  if(m==="off"&&!L.only){if(L.dirty){g.clearRect(0,0,W,H);L.dirty=false}return}
  L.dirty=true;
  if(L.only){g.globalCompositeOperation="source-over";g.fillStyle="rgba(0,0,0,.22)";g.fillRect(0,0,W,H)}
  else g.clearRect(0,0,W,H);
  g.globalCompositeOperation="lighter";
  if(b){hue=(hue+47)%360;flash=1}
  flash*=.88;
  const t=now/1000;
  if(m==="pulse"){
   const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.8);
   gr.addColorStop(0,`hsla(${hue},100%,60%,${flash*I*.7})`);gr.addColorStop(1,"rgba(0,0,0,0)");
   g.fillStyle=gr;g.fillRect(0,0,W,H);
  }else if(m==="beams"){
   for(let i=0;i<7;i++){
    const x=W*(i+.5)/7,a=Math.sin(t*.9+i*1.3)*.6,len=H*1.2,w=(.07+lvl*.12+flash*.08)*W/3;
    g.save();g.translate(x,-10);g.rotate(a);
    const gr=g.createLinearGradient(0,0,0,len);
    gr.addColorStop(0,`hsla(${(hue+i*40)%360},100%,65%,${(.35+flash*.45)*I})`);gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.beginPath();g.moveTo(-3,0);g.lineTo(3,0);g.lineTo(w,len);g.lineTo(-w,len);g.closePath();g.fill();g.restore();
   }
  }else if(m==="disco"){
   if(b||!spots.length)spots=Array.from({length:9},()=>({x:Math.random()*W,y:Math.random()*H,h:Math.random()*360,r:(.12+Math.random()*.14)*Math.min(W,H)}));
   spots.forEach(s=>{
    const gr=g.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*(1+flash*.4));
    gr.addColorStop(0,`hsla(${s.h},100%,60%,${(.35+flash*.5)*I})`);gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.fillRect(s.x-s.r*2,s.y-s.r*2,s.r*4,s.r*4);
   });
  }else if(m==="laser"){
   g.lineWidth=2;g.shadowBlur=14;
   for(let i=0;i<16;i++){
    const a=Math.PI*(1.1+.8*i/15)+Math.sin(t*1.3+i)*.18,col=`hsla(${(hue+i*12)%360},100%,60%,${(.5+flash*.5)*I})`;
    g.strokeStyle=col;g.shadowColor=col;g.beginPath();g.moveTo(W/2,H);g.lineTo(W/2+Math.cos(a)*H*1.6,H+Math.sin(a)*H*1.6);g.stroke();
   }
   g.shadowBlur=0;
  }else if(m==="strobe"){
   if(b&&now-L.ls>340){L.ls=now;L.sf=1}
   L.sf*=.6;
   if(L.sf>.05){g.fillStyle=`rgba(255,255,255,${L.sf*I*.8})`;g.fillRect(0,0,W,H)}
  }
 }
 requestAnimationFrame(draw);
})();
