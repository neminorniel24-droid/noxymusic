/* NoxyMusic · DJ decks, key detection, transitions, effects */
$("decks").innerHTML=["A","B"].map(k=>`<div class="deck"><div class="dh"><b>${k}</b><span id="name${k}" class="small">Upload a song</span></div>
<div class="fl"><label class="btn" for="file${k}">Upload</label><input id="file${k}" type="file" accept="audio/*" hidden><button id="play${k}" disabled>Play</button><button id="cue${k}">⏮</button><span id="time${k}" class="small">0:00</span></div>
<input id="seek${k}" type="range" min="0" max="1" step=".001" value="0" style="width:100%"><div class="fl small">Volume <input id="vol${k}" type="range" min="0" max="1" step=".05" value=".8"></div></div>`).join("");
