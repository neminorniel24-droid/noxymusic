// In-memory stand-in for PeerJS: peers find each other by id, messages arrive asynchronously (and are copied, like the real thing).
const peers=new Map();
/* a WebRTC stats report for a link of the given kind: "direct" (default), "relay", or "none" (not connected yet) */
const fakeReport=kind=>new Map(kind==="none"?[]:[
 ["t",{id:"t",type:"transport",selectedCandidatePairId:"p"}],["p",{id:"p",type:"candidate-pair",localCandidateId:"l",remoteCandidateId:"r"}],
 ["l",{id:"l",type:"local-candidate",candidateType:kind==="relay"?"relay":"srflx"}],["r",{id:"r",type:"remote-candidate",candidateType:"srflx"}]]);
class Conn{
 constructor(peer){this.peer=peer;this.h={};this.dataChannel={bufferedAmount:0};this.peerConnection={getStats:async()=>fakeReport(Peer.kind)}}
 on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this}
 emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a))}
 send(m){const other=this.pair,copy=structuredClone(m);setTimeout(()=>other.emit("data",copy),0)}
 close(){this.emit("close");this.pair.emit("close")}
}
export class Peer{
 static kind="direct";static last=null;
 constructor(id,opts){this.opts=opts;Peer.last=this;this.id=id||"p"+Math.random().toString(36).slice(2,8);this.h={};peers.set(this.id,this);setTimeout(()=>this.emit("open",this.id),0)}
 on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this}
 emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a))}
 connect(id){
  const target=peers.get(id),mine=new Conn(id);
  if(!target){setTimeout(()=>this.emit("error",{type:"peer-unavailable"}),0);return mine}
  const theirs=new Conn(this.id);mine.pair=theirs;theirs.pair=mine;
  setTimeout(()=>{target.emit("connection",theirs);mine.emit("open");theirs.emit("open")},0);
  return mine;
 }
 destroy(){peers.delete(this.id)}
}
export default Peer;
