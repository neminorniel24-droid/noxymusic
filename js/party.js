/* NoxyMusic · party mode: connect laptops with a room code. Same songs, lights and effects; whoever presses play takes over. */
import {ensureAudio} from "./audio.js";
import {BPMS} from "./beat.js";
import {$, Q} from "./core.js";
import {detectBpm} from "./lib/bpm.js";
import {linkKind,quality,summarizeCheck,turnUrls} from "./lib/ice.js";
import {Assembler,Hub,cleanCode,makeCode,reconcileDeck,skewFromPings,splitBuffer} from "./lib/party-core.js";
import {lightsLink} from "./lights.js";
import {gather} from "./netcheck.js";
import {BROKER,KEY,P,esc,forgetRelayCache,hasRelay,iceConfig,isCtl,on,q,relayCfg,saved,sharedOn} from "./party-state.js";
import {D, S} from "./state.js";
import {toast} from "./ui.js";
import {videoAttach,videoStop,videoSync} from "./video.js";

const PEER_URL="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/+esm",MAX_MB=60,CHUNK=32768,MAX_CHUNKS=Math.ceil(MAX_MB*1e6/CHUNK)+1;
const hubNow=()=>performance.now()+P.skew;
const myName=()=>($("pname").value.trim()||P.label).slice(0,20);
const loadPeer=async()=>{const m=await import(PEER_URL);return m.Peer||m.default};
const peerOpts=async()=>({...BROKER,config:(await iceConfig()).config});
const rosterList=()=>P.hub.roster().map(r=>({...r,link:P.kinds.get(r.id)||"",ms:r.id===P.me?0:P.ms.has(r.id)?P.ms.get(r.id):-1}));
const pushRoster=()=>{P.roster=rosterList();bcast({t:"roster",list:P.roster})};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const setWait=t=>{$("pwait").textContent=t};

/* ---- messaging: laptops talk to the room's hub (whoever created it), which relays ---- */
const sendTo=(id,m)=>{if(id===P.me){onMsg(m);return}const c=P.conns.get(id);if(c)c.send(m)};
const bcast=(m,except)=>{P.conns.forEach((c,id)=>{if(id!==except)c.send(m)});if(except!==P.me)onMsg(m)};
const toHub=m=>{if(P.isHub)hubHandle(P.me,m);else if(P.conn)P.conn.send(m)};
function hubHandle(from,m){
 const h=P.hub;
 switch(m.t){
  case "hello":h.join(from,m.name);sendTo(from,{t:"welcome",controller:h.controller,epoch:h.epoch});pushRoster();break;
  case "ping":sendTo(from,{t:"pong",c:m.c,h:performance.now()});break;
  case "ctl":{const r=h.takeControl(from);if(r)bcast({t:"controller",...r});break}
  case "snap":case "lb":if(h.accept(from,m.epoch))bcast(m,from);break;
  case "fx":if(from===h.controller)bcast(m,from);break;
  case "q":if(Number.isFinite(m.ms)&&m.ms>=0&&m.ms<1e5&&P.conns.has(from)){P.ms.set(from,Math.round(m.ms));pushRoster()}break;
  case "want":sendTo(h.controller,{...m,from});break;
  case "fmeta":case "chunk":sendTo(m.to,m);break;
 }
}
function onMsg(m){
 switch(m.t){
  case "welcome":P.controller=m.controller;P.epoch=m.epoch;ping();ui();break;
  case "pong":{const now=performance.now();P.samples.push({rtt:now-m.c,skew:m.h+(now-m.c)/2-now});if(P.samples.length>=3)P.skew=skewFromPings(P.samples);if(P.samples.length===5){P.rtt=Math.min(...P.samples.map(s=>s.rtt));if(!P.isHub)toHub({t:"q",ms:P.rtt})}break}
  case "roster":P.roster=Array.isArray(m.list)?m.list.slice(0,50):[];ui();videoSync();break;
  case "bye":P.closed=true;break;
  case "controller":{const was=isCtl();P.controller=m.controller;P.epoch=m.epoch;if(was&&!isCtl())stopLocal();ui();break}
  case "snap":if(!isCtl()&&m.epoch===P.epoch)follow(m);break;
  case "lb":if(!isCtl()&&m.epoch===P.epoch)lightsLink.push(m);break;
  case "fx":if(!isCtl()){const b=[...Q("[data-fx]")].find(x=>x.dataset.fx===m.name);if(b){P.fxLock=true;b.click();P.fxLock=false}}break;
  case "want":sendFile(m.from,m.id);break;
  case "fmeta":if(Number.isInteger(m.n)&&m.n>0&&m.n<=MAX_CHUNKS&&m.size<=MAX_MB*1e6){P.asm.set(m.id,{a:new Assembler(m.n),name:m.name,type:m.type});xfer(`Receiving ${m.name}...`)}break;
  case "chunk":receive(m);break;
 }
}
const ping=()=>{P.samples=[];for(let i=0;i<5;i++)setTimeout(()=>toHub({t:"ping",c:performance.now()}),i*150)};
const stopLocal=()=>["A","B"].forEach(k=>D[k].a.pause());

/* ---- the controller describes the whole room 4 times a second; followers copy it ---- */
const deckSnap=k=>{const a=D[k].a;return{id:P.ids[k],name:P.names[k],playing:!!a.src&&!a.paused,pos:a.currentTime||0,rate:a.playbackRate,vol:+$("vol"+k).value}};
const snapshot=()=>({t:"snap",epoch:P.epoch,at:hubNow(),xf:+$("xf").value,A:deckSnap("A"),B:deckSnap("B"),lights:{mode:$("lmode").value,lint:+$("lint").value}});
async function detectFor(k,id){
 try{
  const buf=await S.ac.decodeAudioData(await P.files.get(id).arrayBuffer());
  if(P.ids[k]===id){BPMS[k]=detectBpm(buf);$("bpm"+k).textContent=`${k}: ${BPMS[k]||"?"} BPM`}
 }catch{/* tempo display is optional */}
}
function loadDeck(k,id,name){
 D[k].a.src=URL.createObjectURL(P.files.get(id));
 P.ids[k]=id;P.names[k]=name;$("name"+k).textContent=name;$("play"+k).disabled=false;
 detectFor(k,id);
}
function follow(m){
 if(!m.A||!m.B||!m.lights)return;
 ensureAudio();
 for(const k of["A","B"]){
  const s=m[k],a=D[k].a;
  if(!s.id)continue;
  if(P.ids[k]!==s.id){
   if(!P.files.has(s.id)){
    const t=P.asked.get(s.id);
    if(!P.asm.has(s.id)&&(t===undefined||performance.now()-t>8000)){P.asked.set(s.id,performance.now());toHub({t:"want",id:s.id})}
    continue;
   }
   loadDeck(k,s.id,s.name);
  }
  const r=reconcileDeck({playing:!a.paused,pos:a.currentTime,rate:a.playbackRate},s,hubNow(),P.offset);
  if(r.seek!==undefined&&Number.isFinite(r.seek))a.currentTime=r.seek;
  if(r.rate&&Number.isFinite(r.rate))a.playbackRate=Math.min(4,Math.max(.25,r.rate));
  if(r.play)a.play().catch(()=>{});
  if(r.pause)a.pause();
  const v=$("vol"+k);
  if(+v.value!==s.vol){v.value=s.vol;v.dispatchEvent(new Event("input"))}
 }
 const xf=$("xf");
 if(Math.abs(+xf.value-m.xf)>.005){xf.value=m.xf;xf.dispatchEvent(new Event("input"))}
 if(m.lights.mode!==P.lights.mode){P.lights.mode=m.lights.mode;const e=$("lmode");e.value=m.lights.mode;e.dispatchEvent(new Event("change"))}
 if(m.lights.lint!==P.lights.lint){P.lights.lint=m.lights.lint;$("lint").value=m.lights.lint}
}

/* ---- songs travel once, in chunks, from whoever has them ---- */
const buffered=()=>(P.isHub?[...P.conns.values()].reduce((s,c)=>s+((c.dataChannel&&c.dataChannel.bufferedAmount)||0),0):(P.conn&&P.conn.dataChannel&&P.conn.dataChannel.bufferedAmount))||0;
const drain=async()=>{for(let i=0;i<500&&buffered()>1e6;i++)await new Promise(r=>setTimeout(r,20))};
async function sendFile(to,id){
 const f=P.files.get(id),meta=P.meta.get(id);
 if(!f)return;
 if(f.size>MAX_MB*1e6){toast(`${meta.name} is over ${MAX_MB} MB, so other laptops cannot get it`);return}
 const parts=splitBuffer(await f.arrayBuffer(),CHUNK);
 toHub({t:"fmeta",to,id,name:meta.name,type:meta.type,n:parts.length,size:f.size});
 for(let i=0;i<parts.length;i++){toHub({t:"chunk",to,id,i,b:parts[i]});if(i%8===7)await drain()}
}
function receive(m){
 const r=P.asm.get(m.id);
 if(!r)return;
 if(r.a.add(m.i,m.b)){
  P.files.set(m.id,r.a.blob(r.type));P.meta.set(m.id,{name:r.name,type:r.type});P.asm.delete(m.id);
  xfer("");toast(`Got ${r.name}`);
 }else xfer(`Receiving ${r.name}: ${Math.round(r.a.got/r.a.n*100)}%`);
}
for(const k of["A","B"])$("file"+k).addEventListener("change",e=>{
 const f=e.target.files[0];
 if(!f)return;
 const id=`${f.name}|${f.size}|${f.lastModified}`;
 P.files.set(id,f);P.meta.set(id,{name:f.name,type:f.type});P.ids[k]=id;P.names[k]=f.name;
});

/* the hub checks how each laptop is linked (direct or through the relay) and tells everyone */
async function watchLink(c){
 for(const wait of[1200,4000,10000]){
  await sleep(wait);
  if(P.conns.get(c.peer)!==c)return;
  let k="";try{k=linkKind(await c.peerConnection.getStats())}catch{/* stats are optional */}
  if(k&&P.kinds.get(c.peer)!==k){P.kinds.set(c.peer,k);pushRoster()}
  if(k)return;
 }
}

/* ---- joining, creating, leaving ---- */
const friendly=e=>{
 if(typeof e==="string")return e;
 const m={network:"Cannot reach the connection server. Check your internet.","server-error":"The free connection server is busy. Try again in a minute.","socket-error":"The free connection server is busy. Try again in a minute.","socket-closed":"The connection server hung up. Try again.","browser-incompatible":"This browser cannot connect laptops. Use Chrome or Edge."};
 return m[e.type]||"Connection problem: "+(e.type||e.message||"unknown");
};
function teardown(){
 clearInterval(P.timer);clearInterval(P.qt);videoStop();
 const peer=P.peer,wasHub=P.isHub;
 if(peer){
  if(wasHub){try{bcast({t:"bye"})}catch{/* nobody to tell */}setTimeout(()=>{try{peer.destroy()}catch{/* already closed */}},150)}
  else try{peer.destroy()}catch{/* already closed */}
 }
 P.conns.clear();P.kinds.clear();P.ms.clear();
 Object.assign(P,{peer:null,conn:null,hub:null,isHub:false,me:"",code:"",controller:"",roster:[],epoch:0,skew:0,rtt:-1,closed:false});
 setWait("");ui();
}
function leave(){P.gen++;teardown()}
function fail(e){const text=friendly(e);leave();$("perr").textContent=text;toast(text)}
function start(){
 clearInterval(P.timer);clearInterval(P.qt);
 P.timer=setInterval(()=>{if(on()&&isCtl())toHub(snapshot())},250);
 P.qt=setInterval(()=>{if(on()&&!P.isHub)ping()},8000);
 $("perr").textContent="";setWait("");ui();
}
/* the connection server sometimes drops us while laptops stay linked: ask for it back */
const keepSignaling=peer=>peer.on("disconnected",()=>{if(P.peer===peer)setTimeout(()=>{try{if(P.peer===peer&&!peer.destroyed)peer.reconnect()}catch{/* try again on the next drop */}},1000)});
async function create(retry=0){
 try{
  const gen=P.gen,[Peer,opts]=await Promise.all([loadPeer(),peerOpts()]),code=makeCode();
  if(P.gen!==gen)return;
  teardown();
  const peer=new Peer("noxy-"+code,opts);
  P.peer=peer;keepSignaling(peer);videoAttach(peer);
  setWait("Making your room...");
  peer.on("open",id=>{
   P.me=id;P.code=code;P.isHub=true;P.hub=new Hub(id);P.hub.join(id,myName());P.controller=id;P.epoch=0;P.roster=rosterList();start();
  });
  peer.on("connection",c=>{
   c.on("open",()=>{P.conns.set(c.peer,c);watchLink(c)});
   c.on("data",m=>hubHandle(c.peer,m));
   c.on("close",()=>{
    P.conns.delete(c.peer);P.kinds.delete(c.peer);P.ms.delete(c.peer);
    if(P.hub&&P.hub.leave(c.peer))bcast({t:"controller",controller:P.hub.controller,epoch:P.hub.epoch});
    if(P.hub)pushRoster();
   });
  });
  const again=P.gen;
  peer.on("error",e=>{
   if(P.peer!==peer)return;
   const busy=["network","server-error","socket-error","socket-closed"].includes(e.type);
   if((e.type==="unavailable-id"||busy)&&retry<(busy?3:5)){peer.destroy();P.peer=null;setTimeout(()=>{if(P.gen===again)create(retry+1)},busy?1500*(retry+1):0)}
   else fail(e);
  });
 }catch(e){fail(e)}
}
/* resolves true once connected. quiet: used when winning a room back, so it never shows an error */
function join(raw,quiet=false){
 const code=cleanCode(raw);
 if(code.length!==4){fail("Enter the 4-character room code");return Promise.resolve(false)}
 return new Promise(async resolve=>{
  let Peer,opts;
  try{[Peer,opts]=await Promise.all([loadPeer(),peerOpts()])}catch(e){if(quiet)resolve(false);else{fail(e);resolve(false)}return}
  teardown();
  const gen=P.gen,peer=new Peer(undefined,opts);
  P.peer=peer;keepSignaling(peer);videoAttach(peer);
  if(!quiet){$("perr").textContent="";setWait("Connecting to the room...")}
  let settled=false,timer;
  const done=ok=>{if(settled)return;settled=true;clearTimeout(timer);resolve(ok)};
  const giveUp=async(text)=>{
   if(settled)return;
   if(quiet){if(P.gen===gen)teardown();done(false);return}
   done(false);fail(text);
  };
  timer=setTimeout(async()=>{
   if(P.gen!==gen||P.conn)return;
   setWait("Checking your network...");
   let s;try{const cfg=await iceConfig();s=summarizeCheck(await gather(cfg.config,4000),hasRelay(),!!cfg.shared)}catch{s={title:"No answer from the room",advice:"Check the code and your network."}}
   if(P.gen!==gen||P.conn)return;
   giveUp(`Could not reach that room. ${s.title}. ${s.advice}`);
  },20000);
  peer.on("open",id=>{
   P.me=id;
   const c=peer.connect("noxy-"+code,{reliable:true});
   c.on("open",()=>{
    if(P.peer!==peer)return;
    P.conn=c;P.isHub=false;P.code=code;P.closed=false;c.send({t:"hello",name:myName()});start();done(true);
   });
   c.on("data",onMsg);
   c.on("close",()=>{
    if(P.conn!==c)return;
    const gone=P.closed,again=P.gen;
    teardown();
    if(gone){toast("The room was closed");return}
    rejoin(code,again);
   });
  });
  peer.on("error",e=>{
   if(P.peer!==peer||settled)return;
   giveUp(e.type==="peer-unavailable"?"No room with that code":friendly(e));
  });
 });
}
/* the link to the room dropped (not closed by its owner): try to get back in */
async function rejoin(code,gen){
 for(let i=1;i<=4;i++){
  setWait(`Connection dropped. Reconnecting (${i}/4)...`);
  await sleep(1500*i);
  if(P.gen!==gen)return;
  if(await join(code,true)){toast("Back in the room");return}
  if(P.gen!==gen)return;
 }
 if(P.gen===gen)fail("Could not get back into the room. Join again with the code.");
}
function takeControl(){
 if(!on()||isCtl())return;
 P.controller=P.me;toHub({t:"ctl"});ui();
}

/* ---- lights: the controller sends every beat, the others draw exactly that ---- */
lightsLink.emit=ev=>{if(on()&&isCtl())toHub({t:"lb",epoch:P.epoch,...ev})};

/* ---- panel ---- */
const xfer=t=>{$("pxfer").textContent=t};
const hue=id=>[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
const person=r=>{
 const name=String(r.name||"Friend"),ms=Number.isFinite(r.ms)&&r.ms>=0?Math.round(r.ms):-1,qual=quality(ms);
 const tags=[r.id===P.controller?'<span class="tg dj">DJ</span>':"",r.link==="relay"?'<span class="tg">via relay</span>':r.link==="direct"?'<span class="tg">direct</span>':""].join("");
 const dot=r.id===P.me||!qual?"":`<span class="ping ${qual}" title="${ms} ms">${ms} ms</span>`;
 return`<li><span class="av" style="--h:${hue(r.id)}">${esc([...name][0]||"?").toUpperCase()}</span><span class="nm">${esc(name)}${r.id===P.me?" <i>(you)</i>":""}</span>${tags}${dot}</li>`;
};
function ui(){
 const live=on();
 lightsLink.remote=live&&!isCtl();
 $("partyOff").hidden=live;$("partyOn").hidden=!live;
 const tab=document.querySelector('#tabs button[data-t="party"] span');
 if(tab)tab.textContent=live?`Party ${P.roster.length||1}`:"Party";
 const chip=$("dRoom");
 if(chip){chip.classList.toggle("live",live);chip.querySelector("span").textContent=live?`${P.code} · ${P.roster.length||1} here`:"Party: not connected"}
 if(!live)return;
 $("pcodeShow").textContent=P.code;
 const who=P.roster.find(r=>r.id===P.controller);
 $("pstatus").textContent=isCtl()?"You are the DJ. Every laptop follows your songs, lights and effects.":`Following ${who?who.name:"another laptop"}. Press play or upload on this laptop to take over.`;
 $("ptake").hidden=isCtl();
 $("proster").innerHTML=P.roster.map(person).join("");
}
const inviteUrl=()=>`${location.origin}${location.pathname}?room=${P.code}`;
$("pcreate").onclick=()=>{ensureAudio();$("perr").textContent="";create()};
$("pjoin").onclick=()=>{ensureAudio();join($("pcode").value)};
$("pleave").onclick=leave;
$("ptake").onclick=takeControl;
$("pcopy").onclick=async()=>{
 try{await navigator.clipboard.writeText(inviteUrl());toast("Invite link copied")}catch{toast(inviteUrl())}
};
$("pcodeShow").onclick=async()=>{try{await navigator.clipboard.writeText(P.code);toast("Room code copied")}catch{toast(P.code)}};
$("pwa").onclick=()=>{window.open("https://wa.me/?text="+encodeURIComponent("Join my NoxyMusic party: "+inviteUrl()),"_blank","noopener")};
$("poff").oninput=()=>{P.offset=+$("poff").value;$("poffv").textContent=`${P.offset} ms`};
$("dRoom").onclick=()=>document.querySelector('#tabs button[data-t="party"]').click();
/* pressing play, uploading or starting a transition on a following laptop takes over the room */
document.addEventListener("click",e=>{
 if(on()&&!isCtl()&&e.target.closest&&e.target.closest("#decks,#turn,#goT,#syncA,#syncB"))takeControl();
},true);
/* effect pads on the controller are played everywhere */
Q("[data-fx]").forEach(b=>b.addEventListener("click",()=>{if(on()&&isCtl()&&!P.fxLock)toHub({t:"fx",name:b.dataset.fx})}));

/* ---- test my connection ---- */
$("pcheck").onclick=async()=>{
 const box=$("pcheckres"),b=$("pcheck");
 b.disabled=true;box.className="check";$("pct").textContent="Testing...";$("pca").textContent="This takes a few seconds.";
 try{
  const cfg=await iceConfig(),found=await gather(cfg.config,7000),s=summarizeCheck(found,hasRelay(),!!cfg.shared);
  box.className="check "+s.level;$("pct").textContent=s.title;$("pca").textContent=s.advice;
 }catch{box.className="check bad";$("pct").textContent="The test could not run";$("pca").textContent="Try again in a moment."}
 b.disabled=false;
};

/* ---- relay settings panel ---- */
function relayUi(){
 const c=relayCfg(),s=saved();
 $("prlink").value=s.link||"";$("prurls").value=s.urls||"";$("pruser").value=s.username||"";$("prpass").value=s.credential||"";$("prforce").checked=!!s.relayOnly;$("prshared").checked=sharedOn();
 const n=turnUrls(c.urls).length,link=!!c.link;
 $("prstate").textContent=hasRelay()||link?(link?"Relay link is set":`Relay is on (${n} address${n===1?"":"es"})`)+(c.relayOnly?", forced":"")+".":sharedOn()?"No relay of your own. The free shared relay steps in when a direct link fails.":"No relay set. Most networks connect without one.";
}
$("prsave").onclick=()=>{
 const v={link:$("prlink").value.trim(),urls:$("prurls").value.trim(),username:$("pruser").value.trim(),credential:$("prpass").value,relayOnly:$("prforce").checked,shared:$("prshared").checked};
 if(v.link&&!/^https:\/\//i.test(v.link)){toast("The relay link must start with https://");return}
 try{localStorage.setItem(KEY,JSON.stringify(v))}catch{toast("This browser cannot save the relay settings")}
 forgetRelayCache();relayUi();
 toast(hasRelay()||v.link?"Relay saved":"Relay needs an address, a user name and a password");
};
$("prclear").onclick=()=>{try{localStorage.removeItem(KEY)}catch{/* nothing saved */}forgetRelayCache();relayUi();toast("Relay removed")};
relayUi();
const room=q.get("room");
if(room){$("pcode").value=cleanCode(room);document.querySelector('#tabs button[data-t="party"]').click()}
