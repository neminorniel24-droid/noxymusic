// Builds fake AudioBuffers (just enough API for the detectors) from synthetic signals.
export const buffer=(seconds,sr,fn)=>{const d=new Float32Array(Math.floor(seconds*sr));for(let i=0;i<d.length;i++)d[i]=fn(i/sr);return{sampleRate:sr,getChannelData:()=>d}};
export const chord=(freqs)=>t=>freqs.reduce((s,f)=>s+Math.sin(2*Math.PI*f*t),0)/freqs.length;
export const clicks=(bpm)=>t=>{const p=60/bpm,ph=t%p;return ph<.03?Math.sin(2*Math.PI*1000*ph)*Math.exp(-ph*120):0};
