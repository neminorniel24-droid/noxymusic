/* NoxyMusic · setup, shared state and helpers */
const $=id=>document.getElementById(id),Q=s=>document.querySelectorAll(s);
const SCALES={"Major":[0,2,4,5,7,9,11],"Minor":[0,2,3,5,7,8,10],"Pentatonic (easy)":[0,2,4,7,9],"Minor pentatonic":[0,3,5,7,10],"Blues":[0,3,5,6,7,10]};
const PRE={"Theremin":{t:"sine",c:6000,d:0},"Warm synth":{t:"sawtooth",c:1800,d:8},"Soft pad":{t:"triangle",c:1200,d:12},"Bright lead":{t:"square",c:3500,d:6}};
const FILT={"Natural":"none","Noir":"grayscale(1) contrast(1.25)","Vintage":"sepia(.75) contrast(1.1) saturate(1.2)","Neon":"saturate(2.5) contrast(1.2) hue-rotate(290deg)","Cyber":"hue-rotate(180deg) saturate(2) contrast(1.15)","Dream":"blur(1.5px) brightness(1.15) saturate(1.5)","Warm":"sepia(.35) saturate(1.5) brightness(1.05)","Ice":"hue-rotate(160deg) saturate(.9) brightness(1.1)","Pop":"saturate(3) contrast(1.3)","Glitch":"invert(.9) hue-rotate(90deg)"};
const NAMES="C C# D D# E F F# G G# A A# B".split(" "),OCT=3,BASE=48;
const fill=(id,a)=>a.forEach(([v,t])=>$(id).add(new Option(t,v)));
fill("inst",Object.keys(PRE).map(k=>[k,k]));fill("key",NAMES.map((n,i)=>[i,n]));fill("scale",Object.keys(SCALES).map(k=>[k,k]));$("scale").value="Pentatonic (easy)";
let ac,master,an,fd,rec,bus,wet,ew,djOut,fxG,micG,micStream,hv,lm,stream,running=false,lastNote="",lastF=220,filt="none",lastBeat=-1;
let loopT0=null,rs=null,tracks=[],sBuf=null,fl=null,ch="";
const video=$("video"),fc=$("fc"),fcx=fc.getContext("2d"),cv=$("cv"),ctx=cv.getContext("2d"),rc=document.createElement("canvas"),rcx=rc.getContext("2d");
Q("#tabs button").forEach(b=>b.onclick=()=>{Q("#tabs button").forEach(x=>x.classList.toggle("on",x===b));Q(".pane").forEach(p=>p.hidden=p.id!=="p-"+b.dataset.t)});
Object.keys(FILT).forEach((k,i)=>{const b=document.createElement("button");b.textContent=k;if(!i)b.className="on";b.onclick=()=>{filt=FILT[k];video.style.filter=filt;Q("#chips button").forEach(x=>x.classList.toggle("on",x===b))};$("chips").append(b)});
