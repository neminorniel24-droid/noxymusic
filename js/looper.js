/* NoxyMusic · looper and metronome */
import {$} from "./core.js";
import {len} from "./hands.js";
import {S} from "./state.js";
const msg=t=>$("lmsg").textContent=t;
export function rows(){$("tl").innerHTML=S.tracks.map((t,i)=>`<div class="chip2"><span>Track ${i+1} · ${t.n}</span><span><button data-m="${i}">${t.mute?"Unmute":"Mute"}</button> <button data-d="${i}">✕</button></span></div>`).join("")}
$("tl").onclick=e=>{const m=e.target.dataset.m,d=e.target.dataset.d;if(m!==undefined)S.tracks[m].mute=!S.tracks[m].mute;if(d!==undefined){S.tracks[d].v.stop();S.tracks.splice(d,1)}rows()};
$("bpm").oninput=()=>$("bv").textContent=$("bpm").value;
$("lrec").onclick=()=>{if(!S.running)return msg("Start the camera first (Play tab).");if(S.rs)return;if(S.tracks.length>=4)return msg("Max 4 tracks. Clear or delete one.");
 const now=performance.now();$("bpm").disabled=$("bars").disabled=true;
 if(S.loopT0===null){S.loopT0=now;S.rs={ev:[],st:now};msg("Recording… play now!")}else{S.rs={ev:[],armed:true,cyc:Math.floor((now-S.loopT0)/len())};msg("Armed. Recording starts on the next bar.")}};
$("lclr").onclick=()=>{S.tracks.forEach(t=>t.v.stop());S.tracks=[];S.rs=null;S.loopT0=null;$("bpm").disabled=$("bars").disabled=false;$("lpb").style.width=0;rows();msg("Cleared.")};
