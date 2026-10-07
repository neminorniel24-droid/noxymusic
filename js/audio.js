/* NoxyMusic · audio engine: synth voices, reverb, echo */
import {$, PRE} from "./core.js";
import {xfade} from "./dj.js";
import {sampleVoice} from "./sampler.js";
import {D, S} from "./state.js";
const EQ_BANDS=[["lowshelf",200],["peaking",1000],["highshelf",4000]];
function softClip(){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(1.5*x)/Math.tanh(1.5)}return c}
function impulse(s){const n=S.ac.sampleRate*s,b=S.ac.createBuffer(2,n,S.ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5)}return b}
export function voice(pn){if(pn==="My sample"&&S.sBuf)return sampleVoice();const p=PRE[pn],o1=S.ac.createOscillator(),o2=S.ac.createOscillator(),f=S.ac.createBiquadFilter(),g=S.ac.createGain();
 o1.type=o2.type=p.t;o2.detune.value=p.d;f.type="lowpass";f.frequency.value=p.c;g.gain.value=0;o1.connect(f);o2.connect(f);f.connect(g);g.connect(S.bus);o1.start();o2.start();
 return{set(fq,v){const t=S.ac.currentTime;o1.frequency.setTargetAtTime(fq,t,.015);o2.frequency.setTargetAtTime(fq,t,.015);g.gain.setTargetAtTime(v,t,.04)},stop(){g.gain.value=0;o1.stop();o2.stop()}}}
export function ensureAudio(){
 if(S.ac){if(S.ac.state!=="running")S.ac.resume();return}
 S.ac=new AudioContext();S.master=S.ac.createGain();S.rec=S.ac.createMediaStreamDestination();S.an=S.ac.createAnalyser();S.an.fftSize=128;S.fd=new Uint8Array(S.an.frequencyBinCount);
 const comp=S.ac.createDynamicsCompressor(),sh=S.ac.createWaveShaper();comp.threshold.value=-8;comp.knee.value=6;comp.ratio.value=20;comp.attack.value=.003;comp.release.value=.12;sh.curve=softClip();sh.oversample="2x";
 S.master.connect(S.an);S.an.connect(comp);comp.connect(sh);sh.connect(S.ac.destination);sh.connect(S.rec);S.master.gain.value=+$("mv").value;
 S.bus=S.ac.createGain();S.bus.connect(S.master);
 const cvb=S.ac.createConvolver();cvb.buffer=impulse(2.2);S.wet=S.ac.createGain();S.bus.connect(cvb);cvb.connect(S.wet);S.wet.connect(S.master);
 const dl=S.ac.createDelay(1),fb=S.ac.createGain();dl.delayTime.value=.32;fb.gain.value=.4;S.ew=S.ac.createGain();S.bus.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(S.ew);S.ew.connect(S.master);
 S.djOut=S.ac.createGain();S.djOut.connect(S.master);S.fxG=S.ac.createGain();S.fxG.gain.value=.7;S.fxG.connect(S.djOut);
 S.micG=S.ac.createGain();S.micG.gain.value=0;S.micG.connect(S.rec);
 for(const k in D){const d=D[k],sr=S.ac.createMediaElementSource(d.a);d.g=S.ac.createGain();d.g.gain.value=+$("vol"+k).value;d.f=S.ac.createBiquadFilter();d.f.type="lowpass";d.f.frequency.value=20000;d.x=S.ac.createGain();sr.connect(d.g);let p=d.g;d.eq=EQ_BANDS.map(([type,f],i)=>{const e=S.ac.createBiquadFilter();e.type=type;e.frequency.value=f;e.gain.value=+$("eq"+k+i).value;p.connect(e);p=e;return e});p.connect(d.f);d.f.connect(d.x);d.x.connect(S.djOut)}
 xfade(+$("xf").value);S.hv=voice($("inst").value);fx();
}
function fx(){S.wet.gain.value=$("rev").value*.9;S.ew.gain.value=$("echo").value*.6}
$("inst").onchange=()=>{if(S.ac){S.hv.stop();S.hv=voice($("inst").value)}};$("rev").oninput=$("echo").oninput=()=>S.ac&&fx();$("mv").oninput=()=>S.master&&(S.master.gain.value=+$("mv").value);
