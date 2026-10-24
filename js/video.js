/* NoxyMusic · party mode video: an optional small picture of what each friend is doing.
   Everything goes through the room's hub laptop, so anyone who can join the room can also see the videos. Off by default. */
import {$, rc, video} from "./core.js";
import {P,on} from "./party-state.js";
import {S} from "./state.js";
import {toast} from "./ui.js";

const W=320,H=240,MAX_TILES=8;
const V={cv:document.createElement("canvas"),out:null,timer:0,own:false,callUp:null,up:new Map(),fwd:new Map(),tiles:new Map()};
const hubId=()=>P.isHub?P.me:"noxy-"+P.code;
const inRoster=id=>P.roster.some(r=>r.id===id);
const nameOf=id=>{const r=P.roster.find(x=>x.id===id);return r?r.name:"Friend"};
const closeCall=c=>{try{c&&c.close()}catch{/* already closed */}};

/* keep each stream small: about 250 kbit/s, so a relay plan and slow connections cope */
function tune(call){
 setTimeout(()=>{
  try{
   call.peerConnection.getSenders().forEach(s=>{
    if(!s.track||s.track.kind!=="video")return;
    const p=s.getParameters();p.encodings=p.encodings&&p.encodings.length?p.encodings:[{}];
    p.encodings[0].maxBitrate=250000;s.setParameters(p).catch(()=>{});
   });
  }catch{/* optional */}
 },1500);
}

/* ---- tiles: other laptops' videos, shown on the stage ---- */
function showTile(id,stream){
 let f=V.tiles.get(id);
 if(!f){
  if(V.tiles.size>=MAX_TILES)return;
  f=document.createElement("figure");f.className="vt";
  const v=document.createElement("video");v.muted=true;v.autoplay=true;v.setAttribute("playsinline","");
  const c=document.createElement("figcaption");f.append(v,c);
  f.onclick=()=>f.classList.toggle("big");
  $("vtiles").append(f);V.tiles.set(id,f);
 }
 const v=f.querySelector("video");v.srcObject=stream;
 f.querySelector("figcaption").textContent=nameOf(id);
 const p=v.play&&v.play();if(p&&p.catch)p.catch(()=>{});
 count();
}
function dropTile(id){const f=V.tiles.get(id);if(f){f.remove();V.tiles.delete(id)}count()}
function count(){const n=V.tiles.size,e=$("vcount");if(e)e.textContent=n?`${n} video${n===1?"":"s"}`:"";$("vtiles").hidden=!n||!$("psee").checked}

/* ---- the hub forwards every video to every other laptop ---- */
function forward(from,stream,to){
 const key=from+">"+to;
 if(to===from||to===P.me||V.fwd.has(key)||!inRoster(to))return;
 const c=P.peer.call(to,stream,{metadata:{kind:"down",from}});
 if(!c)return;
 V.fwd.set(key,c);c.on("close",()=>{if(V.fwd.get(key)===c)V.fwd.delete(key)});c.on("error",()=>{if(V.fwd.get(key)===c)V.fwd.delete(key)});tune(c);
}
export function videoSync(){
 if(!on()){return}
 const ids=P.roster.map(r=>r.id);
 for(const[id,f]of V.tiles){if(!ids.includes(id)&&id!==P.me)dropTile(id);else f.querySelector("figcaption").textContent=nameOf(id)}
 if(P.isHub){
  for(const[id,u]of[...V.up])if(!ids.includes(id)){V.up.delete(id);closeCall(u.call)}
  for(const[k,c]of[...V.fwd]){
   const i=k.indexOf(">"),from=k.slice(0,i),to=k.slice(i+1);
   if(!ids.includes(to)||(from===P.me?!V.own:!V.up.has(from))){closeCall(c);V.fwd.delete(k)}
  }
  for(const id of ids){
   if(id===P.me)continue;
   if(V.own)forward(P.me,V.out,id);
   for(const[from,u]of V.up)forward(from,u.st,id);
  }
 }else if(V.own&&!V.callUp&&P.peer){
  const c=P.peer.call(hubId(),V.out,{metadata:{kind:"up"}});
  if(c){V.callUp=c;c.on("close",()=>{if(V.callUp===c)V.callUp=null});c.on("error",()=>{if(V.callUp===c)V.callUp=null});tune(c)}
 }
}

/* ---- calls that arrive ---- */
export function videoAttach(peer){
 peer.on("call",call=>{
  const meta=call.metadata&&typeof call.metadata==="object"?call.metadata:{};
  if(!on()){closeCall(call);return}
  if(P.isHub){
   if(meta.kind!=="up"||!inRoster(call.peer)){closeCall(call);return}
   call.answer();
   call.on("stream",st=>{V.up.set(call.peer,{st,call});showTile(call.peer,st);videoSync()});
   call.on("close",()=>{if(V.up.get(call.peer)&&V.up.get(call.peer).call===call)V.up.delete(call.peer);dropTile(call.peer);videoSync()});
  }else{
   if(meta.kind!=="down"||call.peer!==hubId()||typeof meta.from!=="string"||meta.from.length>64){closeCall(call);return}
   const from=meta.from;
   call.answer();
   call.on("stream",st=>showTile(from,st));
   call.on("close",()=>dropTile(from));
  }
 });
}

/* ---- sharing my own video ---- */
const draw=()=>{
 const g=V.cv.getContext("2d");
 if($("pvmode").value==="cam"){g.save();g.translate(W,0);g.scale(-1,1);g.drawImage(video,0,0,W,H);g.restore()}
 else g.drawImage(rc,0,0,W,H);
};
function startShare(){
 if(!on()){toast("Join or create a room first");return false}
 if(!S.running){toast("Start the camera first");return false}
 V.cv.width=W;V.cv.height=H;
 draw();V.out=V.cv.captureStream(15);V.own=true;V.timer=setInterval(draw,66);
 videoSync();return true;
}
function stopShare(){
 clearInterval(V.timer);V.own=false;
 if(V.out&&V.out.getTracks)V.out.getTracks().forEach(t=>t.stop());
 V.out=null;
 closeCall(V.callUp);V.callUp=null;
 for(const[k,c]of[...V.fwd])if(k.startsWith(P.me+">")){closeCall(c);V.fwd.delete(k)}
}
/* leaving the room stops everything */
export function videoStop(){
 stopShare();
 for(const c of V.fwd.values())closeCall(c);
 for(const u of V.up.values())closeCall(u.call);
 V.fwd.clear();V.up.clear();
 for(const f of V.tiles.values())f.remove();
 V.tiles.clear();
 const sw=$("pvid");if(sw)sw.checked=false;
 syncChip();count();
}
export const sharingVideo=()=>V.own;
$("pvid").onchange=e=>{
 if(e.target.checked){if(!startShare())e.target.checked=false;else toast("Your video is shared with the room")}
 else{stopShare();toast("Video sharing stopped")}
 syncChip();
};
$("psee").onchange=count;
export const syncChip=()=>{const e=$("pshare");if(e)e.hidden=!V.own};
