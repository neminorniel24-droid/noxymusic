/* NoxyMusic · keyboard shortcuts */
addEventListener("keydown",e=>{
 const tg=e.target.tagName;
 if(/INPUT|SELECT|TEXTAREA/.test(tg)||(tg==="BUTTON"&&e.key===" ")||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
 const k=e.key.toLowerCase();
 if(k===" "){
  e.preventDefault();
  const d=D[+$("xf").value<.5?"A":"B"].a;
  if(d.src){ensureAudio();d.paused?d.play():d.pause()}
 }
 else if(k==="["||k==="]")setX(Math.min(1,Math.max(0,+$("xf").value+(k==="]"?.1:-.1))));
 else if(k==="t")$("goT").click();
 else if(k==="r")$("rec").click();
 else if(k==="m"){$("metro").click();toast("Metronome "+($("metro").checked?"on":"off"))}
});
