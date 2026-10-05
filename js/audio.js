/* NoxyMusic · audio engine: synth voices, reverb, echo */
const D={};
function impulse(s){const n=ac.sampleRate*s,b=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5)}return b}
function voice(pn){if(pn==="My sample"&&sBuf)return sampleVoice();const p=PRE[pn],o1=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();
 o1.type=o2.type=p.t;o2.detune.value=p.d;f.type="lowpass";f.frequency.value=p.c;g.gain.value=0;o1.connect(f);o2.connect(f);f.connect(g);g.connect(bus);o1.start();o2.start();
 return{set(fq,v){const t=ac.currentTime;o1.frequency.setTargetAtTime(fq,t,.015);o2.frequency.setTargetAtTime(fq,t,.015);g.gain.setTargetAtTime(v,t,.04)},stop(){g.gain.value=0;o1.stop();o2.stop()}}}
