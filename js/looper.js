/* NoxyMusic · looper and metronome */
const msg=t=>$("lmsg").textContent=t;
function rows(){$("tl").innerHTML=tracks.map((t,i)=>`<div class="chip2"><span>Track ${i+1} · ${t.n}</span><span><button data-m="${i}">${t.mute?"Unmute":"Mute"}</button> <button data-d="${i}">✕</button></span></div>`).join("")}
$("tl").onclick=e=>{const m=e.target.dataset.m,d=e.target.dataset.d;if(m!==undefined)tracks[m].mute=!tracks[m].mute;if(d!==undefined){tracks[d].v.stop();tracks.splice(d,1)}rows()};
$("bpm").oninput=()=>$("bv").textContent=$("bpm").value;
$("lrec").onclick=()=>{if(!running)return msg("Start the camera first (Play tab).");if(rs)return;if(tracks.length>=4)return msg("Max 4 tracks. Clear or delete one.");
 const now=performance.now();$("bpm").disabled=$("bars").disabled=true;
 if(loopT0===null){loopT0=now;rs={ev:[],st:now};msg("Recording… play now!")}else{rs={ev:[],armed:true,cyc:Math.floor((now-loopT0)/len())};msg("Armed. Recording starts on the next bar.")}};
$("lclr").onclick=()=>{tracks.forEach(t=>t.v.stop());tracks=[];rs=null;loopT0=null;$("bpm").disabled=$("bars").disabled=false;$("lpb").style.width=0;rows();msg("Cleared.")};
