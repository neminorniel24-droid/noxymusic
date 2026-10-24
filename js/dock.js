/* NoxyMusic · the bar under the stage: what is playing, the room, camera and full screen. */
import {$} from "./core.js";
import {S} from "./state.js";

const text=(id,t)=>{const e=$(id);if(e)e.querySelector("span").textContent=t};
const label=sel=>{const o=sel.options[sel.selectedIndex];return o?o.textContent.replace(/\s*\(.*\)\s*$/,""):""};
function update(){
 text("dSound",label($("inst"))||"Theremin");
 text("dKey",`${label($("key"))||"C"} ${label($("scale")).toLowerCase()||"pentatonic"}`);
 text("dVol",`${Math.round(+$("mv").value*100)}%`);
}
for(const id of["inst","key","scale","mv"]){$(id).addEventListener("change",update);$(id).addEventListener("input",update)}
update();

/* camera: the intro can be skipped, and brought back from the bar */
const cam=()=>{$("dCam").hidden=S.running||!$("intro").hidden};
$("skip").onclick=()=>{$("intro").hidden=true};
$("dCam").onclick=()=>{$("intro").hidden=false};
new MutationObserver(cam).observe($("intro"),{attributes:true,attributeFilter:["hidden"]});
$("dFull").onclick=()=>{
 const el=$("stage");
 if(document.fullscreenElement)document.exitFullscreen();
 else if(el.requestFullscreen)el.requestFullscreen().catch(()=>{});
};
