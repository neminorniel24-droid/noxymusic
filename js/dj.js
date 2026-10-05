/* NoxyMusic · DJ decks, key detection, transitions, effects */
$("decks").innerHTML=["A","B"].map(k=>`<div class="deck"><div class="dh"><b>${k}</b><span id="name${k}" class="small">Upload a song</span></div>
<div class="fl"><label class="btn" for="file${k}">Upload</label><input id="file${k}" type="file" accept="audio/*" hidden><button id="play${k}" disabled>Play</button><button id="cue${k}">⏮</button><span id="time${k}" class="small">0:00</span></div>
<input id="seek${k}" type="range" min="0" max="1" step=".001" value="0" style="width:100%"><div class="fl small">Volume <input id="vol${k}" type="range" min="0" max="1" step=".05" value=".8"></div></div>`).join("");
const MAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],MIN=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
function pearson(a,b){const m=x=>x.reduce((s,v)=>s+v,0)/x.length,ma=m(a),mb=m(b);let n=0,da=0,db=0;for(let i=0;i<a.length;i++){n+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2}return n/Math.sqrt(da*db||1)}
function detectKey(buf){const x=buf.getChannelData(0),dec=Math.max(1,Math.round(buf.sampleRate/11025)),fs=buf.sampleRate/dec,N=4096,hop=Math.round(fs*.5);
 const total=Math.floor(x.length/dec),span=Math.min(total,Math.round(fs*60)),s0=Math.floor((total-span)/2),chroma=new Array(12).fill(0),seg=new Float32Array(N),coef=[];
 for(let m=48;m<96;m++)coef.push([m%12,2*Math.cos(2*Math.PI*hz(m)/fs)]);
 for(let st=s0;st+N<=s0+span;st+=hop){for(let i=0;i<N;i++){let a=0;const b=(st+i)*dec;for(let j=0;j<dec;j++)a+=x[b+j];seg[i]=a/dec*(.5-.5*Math.cos(2*Math.PI*i/N))}
  for(const[pc,c]of coef){let s1=0,s2=0;for(let i=0;i<N;i++){const s=seg[i]+c*s1-s2;s2=s1;s1=s}chroma[pc]+=Math.sqrt(Math.max(0,s1*s1+s2*s2-c*s1*s2))}}
 let best={r:-2};for(let k=0;k<12;k++){const rot=chroma.map((_,i)=>chroma[(i+k)%12]);for(const minor of[false,true]){const r=pearson(rot,minor?MIN:MAJ);if(r>best.r)best={r,root:k,minor}}}return best}
const mmss=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
const syncBtns=()=>{for(const k in D)$("play"+k).textContent=D[k].a.paused?"Play":"Pause"};
for(const k of["A","B"]){const a=new Audio();a.loop=true;D[k]={a};
 a.onplay=a.onpause=syncBtns;a.ontimeupdate=()=>{if(a.duration){$("seek"+k).value=a.currentTime/a.duration;$("time"+k).textContent=mmss(a.currentTime)+" / "+mmss(a.duration)}};
 $("seek"+k).oninput=()=>{if(a.duration)a.currentTime=$("seek"+k).value*a.duration};$("cue"+k).onclick=()=>a.currentTime=0;
 $("vol"+k).oninput=()=>D[k].g&&(D[k].g.gain.value=+$("vol"+k).value);
 $("play"+k).onclick=()=>{ensureAudio();a.paused?a.play():a.pause()};
 $("file"+k).onchange=async e=>{const f=e.target.files[0];if(!f)return;ensureAudio();const o=D[k==="A"?"B":"A"].a,nm_=$("name"+k);
  a.src=URL.createObjectURL(f);$("play"+k).disabled=false;nm_.textContent="Listening…";
  try{const kk=detectKey(await ac.decodeAudioData(await f.arrayBuffer()));$("key").value=kk.root;$("scale").value=kk.minor?"Minor pentatonic":"Pentatonic (easy)";nm_.textContent=f.name+" · "+NAMES[kk.root]+(kk.minor?" minor":" major")}catch{nm_.textContent=f.name}
  if(!o.src){setX(k==="A"?0:1);a.play()}$("djMsg").textContent=""}}
function xfade(v){if(!D.A.x)return;D.A.x.gain.value=Math.cos(v*Math.PI/2);D.B.x.gain.value=Math.sin(v*Math.PI/2)}
function setX(v){$("xf").value=v;xfade(v)}let trans=null;
$("xf").oninput=()=>{trans=null;xfade(+$("xf").value)};$("trLen").oninput=()=>$("trv").textContent=$("trLen").value+"s";
$("goT").onclick=()=>{ensureAudio();const m=$("djMsg");if(!D.A.a.src||!D.B.a.src){m.textContent="Upload a song to both decks first.";return}m.textContent="";
 const from=+$("xf").value<.5?"A":"B",to=from==="A"?"B":"A",fE=D[from].a,tE=D[to].a;if(tE.paused)tE.play();if(fE.paused)fE.play();
 const type=$("tr").value,dur=type==="cut"?.05:+$("trLen").value,x0=+$("xf").value,x1=from==="A"?1:0,t0=performance.now(),id=trans=Symbol();
 if(type==="brake")fE.preservesPitch=fE.mozPreservesPitch=fE.webkitPreservesPitch=false;if(type==="rise")D[to].f.frequency.value=300;
 (function step(){if(trans!==id)return;const p=Math.min(1,(performance.now()-t0)/(dur*1000)),e=p*p*(3-2*p);
  if(type==="sweep")D[from].f.frequency.value=20000*Math.pow(.01,e);if(type==="rise")D[to].f.frequency.value=300*Math.pow(66,e);if(type==="brake")fE.playbackRate=Math.max(.06,1-e*.94);
  setX(x0+(x1-x0)*(type==="sweep"||type==="rise"?p:e));
  if(p<1)requestAnimationFrame(step);else{D.A.f.frequency.value=D.B.f.frequency.value=20000;fE.playbackRate=1;fE.pause();trans=null}})()};
function tone(type,f,s,d,v,cut=8000,f2){const t=ac.currentTime+s,o=ac.createOscillator(),g=ac.createGain(),l=ac.createBiquadFilter();
 o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);l.type="lowpass";l.frequency.value=cut;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.setValueAtTime(v,t+Math.max(.02,d-.06));g.gain.linearRampToValueAtTime(0,t+d);o.connect(l);l.connect(g);g.connect(fxG);o.start(t);o.stop(t+d+.05)}
const FX={
 horn(){[[0,.16],[.2,.16],[.4,.7]].forEach(([s,d])=>[480,600,720].forEach(f=>tone("sawtooth",f,s,d,.16,2500)))},
 siren(){for(let i=0;i<6;i++)i%2?tone("sine",1300,i*.4,.4,.3,4000,600):tone("sine",600,i*.4,.4,.3,4000,1300)},
 laser(){tone("sawtooth",2400,0,.35,.3,6000,120)},scratch(){for(let i=0;i<6;i++)tone("sawtooth",i%2?300:1100,i*.07,.07,.3,3500,i%2?1100:300)},
 boing(){tone("sine",180,0,.25,.5,4000,700);tone("sine",700,.25,.45,.5,4000,140)},drop(){tone("sine",220,0,1.4,.9,800,40);tone("triangle",110,0,1.4,.5,500,30)},
 applause(){const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain(),t=ac.currentTime;s.buffer=b;bp.type="bandpass";bp.frequency.value=2200;g.gain.setValueAtTime(0,t);
  for(let i=0;i<40;i++)g.gain.linearRampToValueAtTime(.15+Math.random()*.5,t+.05+i*.045);g.gain.linearRampToValueAtTime(0,t+2);s.connect(bp);bp.connect(g);g.connect(fxG);s.start(t)}};
Q("[data-fx]").forEach(b=>b.onclick=()=>{ensureAudio();FX[b.dataset.fx]()});
[["chip",1.5],["demon",.7]].forEach(([id,r])=>{let held=false;const b=$(id),set=v=>["A","B"].forEach(k=>{const a=D[k].a;a.preservesPitch=a.mozPreservesPitch=a.webkitPreservesPitch=false;a.playbackRate=v});
 b.onpointerdown=()=>{held=true;set(r)};b.onpointerup=b.onpointerleave=()=>{if(held){held=false;set(1)}}});
addEventListener("keydown",e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.repeat)return;const k=+e.key;if(k>=1&&k<=7){ensureAudio();FX[Object.keys(FX)[k-1]]()}});
