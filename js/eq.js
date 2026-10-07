/* NoxyMusic · EQ sliders (the filters themselves are built in audio.js) */
import {D} from "./state.js";
import {$} from "./core.js";
["A","B"].forEach(k=>[0,1,2].forEach(i=>{
 const s=$(`eq${k}${i}`);
 s.oninput=e=>{const b=D[k].eq&&D[k].eq[i];if(b)b.gain.value=+e.target.value};
 s.ondblclick=e=>{e.target.value=0;e.target.oninput(e)};
}));
