/* NoxyMusic · audio engine: synth voices, reverb, echo */
const D={};
function impulse(s){const n=ac.sampleRate*s,b=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5)}return b}
function voice(pn){if(pn==="My sample"&&sBuf)return sampleVoice();const p=PRE[pn],o1=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();
 o1.type=o2.type=p.t;o2.detune.value=p.d;f.type="lowpass";f.frequency.value=p.c;g.gain.value=0;o1.connect(f);o2.connect(f);f.connect(g);g.connect(bus);o1.start();o2.start();
 return{set(fq,v){const t=ac.currentTime;o1.frequency.setTargetAtTime(fq,t,.015);o2.frequency.setTargetAtTime(fq,t,.015);g.gain.setTargetAtTime(v,t,.04)},stop(){g.gain.value=0;o1.stop();o2.stop()}}}
function ensureAudio(){
 if(ac){if(ac.state!=="running")ac.resume();return}
 ac=new AudioContext();master=ac.createGain();rec=ac.createMediaStreamDestination();an=ac.createAnalyser();an.fftSize=128;fd=new Uint8Array(an.frequencyBinCount);
 master.connect(an);an.connect(ac.destination);master.connect(rec);master.gain.value=+$("mv").value;
 bus=ac.createGain();bus.connect(master);
 const cvb=ac.createConvolver();cvb.buffer=impulse(2.2);wet=ac.createGain();bus.connect(cvb);cvb.connect(wet);wet.connect(master);
 const dl=ac.createDelay(1),fb=ac.createGain();dl.delayTime.value=.32;fb.gain.value=.4;ew=ac.createGain();bus.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(ew);ew.connect(master);
 djOut=ac.createGain();djOut.connect(master);fxG=ac.createGain();fxG.gain.value=.7;fxG.connect(djOut);
 micG=ac.createGain();micG.gain.value=0;micG.connect(rec);
 for(const k in D){const d=D[k],sr=ac.createMediaElementSource(d.a);d.g=ac.createGain();d.g.gain.value=+$("vol"+k).value;d.f=ac.createBiquadFilter();d.f.type="lowpass";d.f.frequency.value=20000;d.x=ac.createGain();sr.connect(d.g);d.g.connect(d.f);d.f.connect(d.x);d.x.connect(djOut)}
 xfade(+$("xf").value);hv=voice($("inst").value);fx();
}
