/* NoxyMusic · accessibility labels and roles */
const LABELS={rev:"Reverb amount",echo:"Echo amount",mv:"Master volume",xf:"Crossfader between deck A and deck B",trLen:"Transition length in seconds",bpm:"Tempo in beats per minute",volA:"Deck A volume",volB:"Deck B volume",seekA:"Deck A position",seekB:"Deck B position",inst:"Instrument",key:"Musical key",scale:"Scale",mode:"Play style",tr:"Transition type",bars:"Loop length in bars"};
Object.entries(LABELS).forEach(([id,t])=>{const e=$(id);if(e)e.setAttribute("aria-label",t)});
$("tabs").setAttribute("role","tablist");
$("note").setAttribute("aria-live","polite");
Q("#tabs button").forEach(b=>b.setAttribute("role","tab"));
Q("#chars button").forEach(b=>b.setAttribute("aria-label",b.title||"Character"));
const syncTabs=()=>Q("#tabs button").forEach(b=>b.setAttribute("aria-selected",b.classList.contains("on")));
Q("#tabs button").forEach(b=>b.addEventListener("click",syncTabs));
syncTabs();
