/* NoxyMusic · recording with video filters */
import {ensureAudio} from "./audio.js";
import {$, rc} from "./core.js";
import {S} from "./state.js";
let mr,chunks=[],timer,t0r;
$("rec").onclick=async()=>{
 if(mr&&mr.state==="recording"){mr.stop();return}
 ensureAudio();const info=$("recInfo");info.textContent="";S.micG.gain.value=0;
 if($("mic").checked){try{if(!S.micStream){S.micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});S.ac.createMediaStreamSource(S.micStream).connect(S.micG)}
  S.micG.gain.value=1;info.textContent="Tip: use headphones so the mic doesn't pick up the speakers."}catch{info.textContent="Microphone not available, recording without it."}}
 const vid=$("face").checked&&S.running,rt=[...S.rec.stream.getAudioTracks()];if(vid)rt.push(rc.captureStream(30).getVideoTracks()[0]);
 const mime=[vid?"video/webm;codecs=vp9,opus":"audio/webm;codecs=opus",vid?"video/webm":"audio/webm"].find(m=>MediaRecorder.isTypeSupported(m));
 mr=new MediaRecorder(new MediaStream(rt),{mimeType:mime});chunks=[];mr.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 mr.onstop=()=>{clearInterval(timer);const b=$("rec");b.textContent="● Record";b.classList.remove("live");const url=URL.createObjectURL(new Blob(chunks,{type:mime})),tg=vid?"video":"audio";
  $("result").innerHTML=`<${tg} controls src="${url}"></${tg}><a class="btn go" download="noxymusic-${Date.now()}.webm" href="${url}">Download</a>`};
 mr.start();t0r=Date.now();$("rec").classList.add("live");$("rec").textContent="■ Stop · 0:00";
 timer=setInterval(()=>{const s=Math.floor((Date.now()-t0r)/1000);$("rec").textContent=`■ Stop · ${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`},250)};
