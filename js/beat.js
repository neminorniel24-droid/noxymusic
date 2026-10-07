/* NoxyMusic · BPM detection and deck sync */
import {ensureAudio} from "./audio.js";

import {$} from "./core.js";
import {detectBpm} from "./lib/bpm.js";
import {D, S} from "./state.js";
import {toast} from "./ui.js";
export const BPMS={A:0,B:0};
["A","B"].forEach(k=>$("file"+k).addEventListener("change",async e=>{
 const f=e.target.files[0];
 if(!f)return;
 try{
  ensureAudio();
  BPMS[k]=detectBpm(await S.ac.decodeAudioData(await f.arrayBuffer()));
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
