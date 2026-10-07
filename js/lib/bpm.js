/* NoxyMusic · tempo detection from audio (no DOM), covered by tests */
export function detectBpm(buf){
 const x=buf.getChannelData(0),sr=buf.sampleRate,hop=Math.round(sr/100),fps=sr/hop;
 const n=Math.min(Math.floor(x.length/hop),Math.floor(fps*90)),e=new Float32Array(n),o=new Float32Array(n);
 for(let i=0;i<n;i++){let s=0;for(let j=0;j<hop;j+=4)s+=Math.abs(x[i*hop+j]);e[i]=s}
 for(let i=1;i<n;i++)o[i]=Math.max(0,e[i]-e[i-1]);
 const lo=Math.floor(fps*60/180),hi=Math.ceil(fps*60/70);
 let best=0,bl=0;
 for(let l=lo;l<=hi;l++){let s=0;for(let i=0;i+l<n;i++)s+=o[i]*o[i+l];if(s>best){best=s;bl=l}}
 if(!bl)return 0;
 let bpm=60*fps/bl;
 while(bpm<80)bpm*=2;
 while(bpm>160)bpm/=2;
 return Math.round(bpm);
}
