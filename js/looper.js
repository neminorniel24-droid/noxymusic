/* NoxyMusic · looper and metronome */
const msg=t=>$("lmsg").textContent=t;
function rows(){$("tl").innerHTML=tracks.map((t,i)=>`<div class="chip2"><span>Track ${i+1} · ${t.n}</span><span><button data-m="${i}">${t.mute?"Unmute":"Mute"}</button> <button data-d="${i}">✕</button></span></div>`).join("")}
