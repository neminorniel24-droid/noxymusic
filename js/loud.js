/* NoxyMusic · volume up to 200% with a limiter that protects speakers and ears */
import {$} from "./core.js";
import {toast} from "./ui.js";
(()=>{
 const mv=$("mv"),pct=document.createElement("span");
 pct.id="mvp";pct.className="small";mv.before(pct);
 const show=()=>{pct.textContent=Math.round(mv.value*100)+"%"};
 mv.max=2;show();
 mv.addEventListener("input",()=>{
  show();
  if(+mv.value>1.4&&!show.warned){show.warned=true;toast("Very loud! Above 140% can hurt your hearing. Start low.",4500)}
 });
})();
