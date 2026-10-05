/* NoxyMusic · sampler: any sound becomes an instrument */
function sampleVoice(){const sr=ac.createBufferSource(),g=ac.createGain();sr.buffer=sBuf;sr.loop=true;g.gain.value=0;sr.connect(g);g.connect(bus);sr.start();
 return{set(fq,v){const t=ac.currentTime;sr.playbackRate.setTargetAtTime(fq/261.63,t,.015);g.gain.setTargetAtTime(v*1.6,t,.04)},stop(){g.gain.value=0;sr.stop()}}}
