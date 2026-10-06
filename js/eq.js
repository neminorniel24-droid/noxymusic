/* NoxyMusic · three-band EQ per deck */
(()=>{
 const BANDS=[["lowshelf",200],["peaking",1000],["highshelf",4000]],NAMES3=["Low","Mid","High"];
 ($("beat")||$("djMsg")).insertAdjacentHTML("afterend","<h3>EQ</h3>"+["A","B"].map(k=>`<div class="eqrow"><b>${k}</b>`+NAMES3.map((n,i)=>`<label>${n}<input id="eq${k}${i}" type="range" min="-12" max="12" step="1" value="0"></label>`).join("")+"</div>").join(""));
 const orig=ensureAudio;
 ensureAudio=function(){const first=!ac;orig();if(first)build()};
 function build(){
  for(const k of["A","B"]){
   const d=D[k];
   d.g.disconnect(d.f);
   let prev=d.g;
   BANDS.forEach(([type,f],i)=>{
    const b=ac.createBiquadFilter();
    b.type=type;b.frequency.value=f;b.gain.value=+$(`eq${k}${i}`).value;
    prev.connect(b);prev=b;d["eq"+i]=b;
   });
   prev.connect(d.f);
  }
 }
 ["A","B"].forEach(k=>[0,1,2].forEach(i=>{
  $(`eq${k}${i}`).oninput=e=>{const b=D[k]["eq"+i];if(b)b.gain.value=+e.target.value};
  $(`eq${k}${i}`).ondblclick=e=>{e.target.value=0;e.target.oninput(e)};
 }));
})();
