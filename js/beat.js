/* NoxyMusic · BPM detection and deck sync */
const BPMS={A:0,B:0};
function detectBpm(buf){
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
$("djMsg").insertAdjacentHTML("afterend",'<div id="beat" class="fl small"><span id="bpmA">A: - BPM</span><span id="bpmB">B: - BPM</span><button id="syncB">Sync B to A</button><button id="syncA">Sync A to B</button><button id="syncOff">Reset speed</button></div>');
["A","B"].forEach(k=>$("file"+k).addEventListener("change",async e=>{
 const f=e.target.files[0];
 if(!f)return;
 try{
  ensureAudio();
  BPMS[k]=detectBpm(await ac.decodeAudioData(await f.arrayBuffer()));
  $("bpm"+k).textContent=`${k}: ${BPMS[k]} BPM`;
  toast(`Deck ${k}: ${BPMS[k]} BPM`);
 }catch{BPMS[k]=0;$("bpm"+k).textContent=`${k}: ? BPM`}
}));
function sync(to,from){
 if(!BPMS[to]||!BPMS[from])return toast("Upload a song to both decks first");
 const a=D[to].a;
 a.preservesPitch=true;
 a.playbackRate=Math.min(2,Math.max(.5,BPMS[from]/BPMS[to]));
 toast(`Deck ${to} matched to ${BPMS[from]} BPM`);
}
$("syncB").onclick=()=>sync("B","A");
$("syncA").onclick=()=>sync("A","B");
$("syncOff").onclick=()=>["A","B"].forEach(k=>D[k].a.playbackRate=1);
