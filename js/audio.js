/* NoxyMusic · audio engine: synth voices, reverb, echo */
const D={};
function impulse(s){const n=ac.sampleRate*s,b=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5)}return b}
