/* NoxyMusic · "Test my connection": asks the browser which kinds of network addresses it can get, with the current relay settings. */
import {candidateType} from "./lib/ice.js";
/* resolves {supported, host, srflx, relay}; never rejects, gives up after `ms` milliseconds */
export function gather(config,ms=6000){
 const Conn=globalThis.RTCPeerConnection;
 if(!Conn)return Promise.resolve({supported:false,host:false,srflx:false,relay:false});
 return new Promise(resolve=>{
  const found={supported:true,host:false,srflx:false,relay:false};
  let pc,done=false;
  const finish=()=>{if(done)return;done=true;clearTimeout(t);try{pc.close()}catch{/* already closed */}resolve(found)};
  const t=setTimeout(finish,ms);
  try{
   pc=new Conn(config);
   pc.createDataChannel("probe");
   pc.onicecandidate=e=>{
    if(!e.candidate){finish();return}
    const k=candidateType(e.candidate.candidate);
    if(k==="host")found.host=true;
    if(k==="srflx"||k==="prflx")found.srflx=true;
    if(k==="relay"){found.relay=true;finish()}
   };
   pc.createOffer().then(o=>pc.setLocalDescription(o)).catch(finish);
  }catch{finish()}
 });
}
