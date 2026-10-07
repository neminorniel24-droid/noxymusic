/* NoxyMusic · help dialog */
import {$} from "./core.js";
import {headerTools} from "./ui.js";
const HELP=`<div class="box" role="dialog" aria-modal="true" aria-label="How to use NoxyMusic"><h2>How to use NoxyMusic</h2>
<h3>Hands</h3><p>Right hand up and down changes the note. Left hand up and down changes the volume. With one hand visible, it plays the notes.</p>
<h3>Shortcuts</h3><p><b>1-7</b> sound effects, <b>Space</b> play or pause the louder deck, <b>[ ]</b> move the crossfader, <b>T</b> transition, <b>R</b> record, <b>M</b> metronome, <b>?</b> this help</p>
<h3>Tips</h3><p>Upload a song in the DJ tab and your notes match its key. Use headphones when recording with the microphone.</p>
<button class="go" id="helpClose">Got it</button></div>`;
function toggleHelp(){
 let h=$("help");
 if(h){h.remove();return}
 h=document.createElement("div");h.id="help";h.innerHTML=HELP;
 h.onclick=e=>{if(e.target===h||e.target.id==="helpClose")h.remove()};
 document.body.append(h);
}
(()=>{
 const b=document.createElement("button");
 b.textContent="?";b.title="Help";b.setAttribute("aria-label","Help");b.onclick=toggleHelp;
 headerTools().append(b);
})();
addEventListener("keydown",e=>{
 if(e.key==="?"&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))toggleHelp();
 if(e.key==="Escape"&&$("help"))$("help").remove();
});
