/* NoxyMusic · party mode: connect laptops with a room code. Same songs, lights and effects; whoever presses play takes over. */
import {ensureAudio} from "./audio.js";
import {BPMS} from "./beat.js";
import {$, Q} from "./core.js";
import {detectBpm} from "./lib/bpm.js";
import {Assembler,Hub,cleanCode,makeCode,reconcileDeck,skewFromPings,splitBuffer} from "./lib/party-core.js";
import {RELAY} from "./config.js";
import {buildIce,linkKind,turnUrls} from "./lib/ice.js";
import {lightsLink} from "./lights.js";
import {D, S} from "./state.js";
import {toast} from "./ui.js";

const PEER_URL="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/+esm",MAX_MB=60,CHUNK=32768,MAX_CHUNKS=Math.ceil(MAX_MB*1e6/CHUNK)+1;
const q=new URLSearchParams(location.search);
/* Default is the free PeerJS cloud. To use your own server: ?peerhost=example.com&peerport=443&peerpath=/ */
const BROKER=q.get("peerhost")?{host:q.get("peerhost"),port:+(q.get("peerport")||443),path:q.get("peerpath")||"/",secure:q.get("peersecure")!=="0"}:{};
const KEY="noxy.relay";
const P={peer:null,kinds:new Map(),conn:null,conns:new Map(),hub:null,isHub:false,me:"",code:"",controller:"",epoch:0,skew:0,roster:[],samples:[],
 files:new Map(),meta:new Map(),ids:{A:"",B:""},names:{A:"",B:""},asm:new Map(),asked:new Map(),offset:0,lights:{mode:"off",lint:.8},fxLock:false,timer:0,
 label:"Laptop "+(10+Math.floor(Math.random()*90))};
/* relay settings come from the page address, then this browser, then js/config.js */
const saved=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{return{}}};
const relayCfg=()=>{const s=saved();return{urls:q.get("turn")||s.urls||RELAY.urls,username:q.get("turnuser")||s.username||RELAY.username,credential:q.get("turnpass")||s.credential||RELAY.credential,relayOnly:q.get("relayonly")==="1"||!!s.relayOnly}};
const peerOpts=()=>({...BROKER,config:buildIce(relayCfg()).config});
const hasRelay=()=>buildIce(relayCfg()).relay;
const rosterList=()=>P.hub.roster().map(r=>({...r,link:P.kinds.get(r.id)||""}));
const hubNow=()=>performance.now()+P.skew,on=()=>!!P.peer&&!!P.me&&(P.isHub||!!P.conn),isCtl=()=>P.controller===P.me;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const myName=()=>($("pname").value.trim()||P.label).slice(0,20);
const loadPeer=async()=>{const m=await import(PEER_URL);return m.Peer||m.default};

/* ---- messaging: laptops talk to the room's hub (whoever created it), which relays ---- */
const sendTo=(id,m)=>{if(id===P.me){onMsg(m);return}const c=P.conns.get(id);if(c)c.send(m)};
const bcast=(m,except)=>{P.conns.forEach((c,id)=>{if(id!==except)c.send(m)});if(except!==P.me)onMsg(m)};
const toHub=m=>{if(P.isHub)hubHandle(P.me,m);else if(P.conn)P.conn.send(m)};
function hubHandle(from,m){
 const h=P.hub;
 switch(m.t){
  case "hello":h.join(from,m.name);sendTo(from,{t:"welcome",controller:h.controller,epoch:h.epoch});bcast({t:"roster",list:rosterList()});break;
  case "ping":sendTo(from,{t:"pong",c:m.c,h:performance.now()});break;
  case "ctl":{const r=h.takeControl(from);if(r)bcast({t:"controller",...r});break}
  case "snap":case "lb":if(h.accept(from,m.epoch))bcast(m,from);break;
  case "fx":if(from===h.controller)bcast(m,from);break;
  case "want":sendTo(h.controller,{...m,from});break;
  case "fmeta":case "chunk":sendTo(m.to,m);break;
 }
}
function onMsg(m){
 switch(m.t){
  case "welcome":P.controller=m.controller;P.epoch=m.epoch;ping();ui();break;
  case "pong":{const now=performance.now();P.samples.push({rtt:now-m.c,skew:m.h+(now-m.c)/2-now});if(P.samples.length>=3)P.skew=skewFromPings(P.samples);break}
  case "roster":P.roster=m.list;ui();break;
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

/* ---- joining, creating, leaving ---- */
function fail(e){
 const text=typeof e==="string"?e:"Connection problem: "+(e.type||e.message||"unknown");
 leave();$("perr").textContent=text;toast(text);
}
function start(){clearInterval(P.timer);P.timer=setInterval(()=>{if(on()&&isCtl())toHub(snapshot())},250);$("perr").textContent="";ui()}
/* the hub checks how each laptop is linked (direct or through the relay) and tells everyone */
async function watchLink(c){
 for(const wait of[1200,4000,10000]){
  await new Promise(r=>setTimeout(r,wait));
  if(P.conns.get(c.peer)!==c)return;
  let k="";try{k=linkKind(await c.peerConnection.getStats())}catch{/* stats are optional */}
  if(k&&P.kinds.get(c.peer)!==k){P.kinds.set(c.peer,k);const l=rosterList();P.roster=l;bcast({t:"roster",list:l});ui()}
  if(k)return;
 }
}
const hint=()=>hasRelay()?"":" On a strict network, add a relay under Connection help.";
function leave(){
 clearInterval(P.timer);
 try{if(P.peer)P.peer.destroy()}catch{/* already closed */}
 P.conns.clear();P.kinds.clear();
 Object.assign(P,{peer:null,conn:null,hub:null,isHub:false,me:"",code:"",controller:"",roster:[],epoch:0,skew:0});
 ui();
}
async function create(retry=0){
 try{
  const Peer=await loadPeer(),code=makeCode();
  leave();
  const peer=new Peer("noxy-"+code,peerOpts());
  P.peer=peer;
  peer.on("open",id=>{
   P.me=id;P.code=code;P.isHub=true;P.hub=new Hub(id);P.hub.join(id,myName());P.controller=id;P.epoch=0;P.roster=rosterList();start();
  });
  peer.on("connection",c=>{
   c.on("open",()=>{P.conns.set(c.peer,c);watchLink(c)});
   c.on("data",m=>hubHandle(c.peer,m));
   c.on("close",()=>{
    P.conns.delete(c.peer);P.kinds.delete(c.peer);
    if(P.hub.leave(c.peer))bcast({t:"controller",controller:P.hub.controller,epoch:P.hub.epoch});
    bcast({t:"roster",list:rosterList()});
   });
  });
  peer.on("error",e=>{if(e.type==="unavailable-id"&&retry<5){peer.destroy();create(retry+1)}else fail(e)});
 }catch(e){fail(e)}
}
async function join(raw){
 const code=cleanCode(raw);
 if(code.length!==4)return fail("Enter the 4-character room code");
 try{
  const Peer=await loadPeer();
  leave();
  const peer=new Peer(undefined,peerOpts());
  P.peer=peer;
  const timeout=setTimeout(()=>{if(P.peer===peer&&!P.conn)fail("Could not reach that room. Check the code and your network."+hint())},12000);
  peer.on("open",id=>{
   P.me=id;
   const c=peer.connect("noxy-"+code,{reliable:true});
   c.on("open",()=>{clearTimeout(timeout);P.conn=c;P.isHub=false;P.code=code;c.send({t:"hello",name:myName()});start()});
   c.on("data",onMsg);
   c.on("close",()=>{if(P.conn===c){leave();toast("The room was closed")}});
  });
  peer.on("error",e=>{clearTimeout(timeout);fail(e.type==="peer-unavailable"?"No room with that code":e)});
 }catch(e){fail(e)}
}
function takeControl(){
 if(!on()||isCtl())return;
 P.controller=P.me;toHub({t:"ctl"});ui();
}

/* ---- lights: the controller sends every beat, the others draw exactly that ---- */
lightsLink.emit=ev=>{if(on()&&isCtl())toHub({t:"lb",epoch:P.epoch,...ev})};

/* ---- panel ---- */
const xfer=t=>{$("pxfer").textContent=t};
function ui(){
 const live=on();
 lightsLink.remote=live&&!isCtl();
 $("partyOff").hidden=live;$("partyOn").hidden=!live;
 const tab=document.querySelector('#tabs button[data-t="party"]');
 tab.textContent=live?`Party ${P.roster.length||1}`:"Party";
 if(!live)return;
 $("pcodeShow").textContent=P.code;
 const who=P.roster.find(r=>r.id===P.controller);
 $("pstatus").textContent=isCtl()?"You are the DJ. Every laptop follows your songs, lights and effects.":`Following ${who?who.name:"another laptop"}. Press play or upload on this laptop to take over.`;
 $("ptake").hidden=isCtl();
 $("proster").innerHTML=P.roster.map(r=>`<li>${esc(r.name)}${r.id===P.me?" (you)":""}${r.id===P.controller?" · DJ":""}${r.link==="relay"?" · via relay":r.link==="direct"?" · direct":""}</li>`).join("");
}
$("pcreate").onclick=()=>{ensureAudio();create()};
$("pjoin").onclick=()=>{ensureAudio();join($("pcode").value)};
$("pleave").onclick=leave;
$("ptake").onclick=takeControl;
$("pcopy").onclick=async()=>{
 const url=`${location.origin}${location.pathname}?room=${P.code}`;
 try{await navigator.clipboard.writeText(url);toast("Invite link copied")}catch{toast(url)}
};
$("poff").oninput=()=>{P.offset=+$("poff").value;$("poffv").textContent=`${P.offset} ms`};
/* pressing play, uploading or starting a transition on a following laptop takes over the room */
document.addEventListener("click",e=>{
 if(on()&&!isCtl()&&e.target.closest&&e.target.closest("#decks,#turn,#goT,#syncA,#syncB"))takeControl();
},true);
/* effect pads on the controller are played everywhere */
Q("[data-fx]").forEach(b=>b.addEventListener("click",()=>{if(on()&&isCtl()&&!P.fxLock)toHub({t:"fx",name:b.dataset.fx})}));
/* relay settings panel */
function relayUi(){
 const c=relayCfg(),s=saved();
 $("prurls").value=s.urls||"";$("pruser").value=s.username||"";$("prpass").value=s.credential||"";$("prforce").checked=!!s.relayOnly;
 const n=turnUrls(c.urls).length;
 $("prstate").textContent=hasRelay()?`Relay is on (${n} address${n===1?"":"es"})${c.relayOnly?", forced":""}.`:"No relay set. Most networks connect without one.";
}
$("prsave").onclick=()=>{
 const v={urls:$("prurls").value.trim(),username:$("pruser").value.trim(),credential:$("prpass").value,relayOnly:$("prforce").checked};
 try{localStorage.setItem(KEY,JSON.stringify(v))}catch{toast("This browser cannot save the relay settings")}
 relayUi();
 toast(hasRelay()?"Relay saved":"Relay needs an address, a user name and a password");
};
$("prclear").onclick=()=>{try{localStorage.removeItem(KEY)}catch{/* nothing saved */}relayUi();toast("Relay removed")};
relayUi();
const room=q.get("room");
if(room){$("pcode").value=cleanCode(room);document.querySelector('#tabs button[data-t="party"]').click()}
