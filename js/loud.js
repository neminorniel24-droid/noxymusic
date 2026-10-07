/* NoxyMusic · volume up to 200% with a limiter that protects speakers and ears */
(()=>{
 const mv=$("mv"),pct=document.createElement("span");
 pct.id="mvp";pct.className="small";mv.before(pct);
 const show=()=>{pct.textContent=Math.round(mv.value*100)+"%"};
 mv.max=2;show();
 mv.addEventListener("input",()=>{
  show();
  if(+mv.value>1.4&&!show.warned){show.warned=true;toast("Very loud! Above 140% can hurt your hearing. Start low.",4500)}
 });
 const orig=ensureAudio;
 ensureAudio=function(){const first=!ac;orig();if(first)build()};
 function build(){
  const comp=ac.createDynamicsCompressor(),sh=ac.createWaveShaper(),n=2048,c=new Float32Array(n);
  comp.threshold.value=-8;comp.knee.value=6;comp.ratio.value=20;comp.attack.value=.003;comp.release.value=.12;
  for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(1.5*x)/Math.tanh(1.5)}
  sh.curve=c;sh.oversample="2x";
  an.disconnect();master.disconnect(rec);
  an.connect(comp);comp.connect(sh);sh.connect(ac.destination);sh.connect(rec);
  master.gain.value=+mv.value;
 }
})();
