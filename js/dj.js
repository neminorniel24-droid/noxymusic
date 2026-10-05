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
