/* NoxyMusic · sampler: any sound becomes an instrument */
function sampleVoice(){const sr=ac.createBufferSource(),g=ac.createGain();sr.buffer=sBuf;sr.loop=true;g.gain.value=0;sr.connect(g);g.connect(bus);sr.start();
 return{set(fq,v){const t=ac.currentTime;sr.playbackRate.setTargetAtTime(fq/261.63,t,.015);g.gain.setTargetAtTime(v*1.6,t,.04)},stop(){g.gain.value=0;sr.stop()}}}
async function useSample(ab){const m=$("smsg");try{sBuf=await ac.decodeAudioData(ab);
 if(![...$("inst").options].some(o=>o.value==="My sample"))$("inst").add(new Option("🎤 My sample","My sample"));
 $("inst").value="My sample";hv.stop();hv=voice("My sample");m.textContent="Done! Move your right hand. Your sound is now the instrument (set on the Play tab)."}catch{m.textContent="Couldn't read that audio. Try another recording or file."}}
