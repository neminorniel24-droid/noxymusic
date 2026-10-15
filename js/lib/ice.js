/* NoxyMusic · connection settings for party mode. Pure functions, so they are easy to test. */
export const STUN=["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun.cloudflare.com:3478"];
const MAX_URLS=6;
/* "turn:a:80, turns:a:443?transport=tcp" -> ["turn:a:80","turns:a:443?transport=tcp"]; anything that is not a turn(s) address is dropped */
export function turnUrls(text){
 const list=String(text||"").split(/[,\s]+/).filter(u=>/^turns?:[^\s<>"']{3,200}$/i.test(u));
 return[...new Set(list)].slice(0,MAX_URLS);
}
/* Builds the RTCPeerConnection settings: free STUN always, plus a TURN relay when the address, user and password are all given. */
export function buildIce({urls="",username="",credential="",relayOnly=false}={}){
 const t=turnUrls(urls),user=String(username||"").trim().slice(0,200),pass=String(credential||"").slice(0,500);
 const servers=[{urls:[...STUN]}],relay=t.length>0&&user!==""&&pass!=="";
 if(relay)servers.push({urls:t,username:user,credential:pass});
 return{relay,config:{iceServers:servers,iceTransportPolicy:relay&&relayOnly?"relay":"all",sdpSemantics:"unified-plan"}};
}
/* Reads a WebRTC stats report and says how two laptops are linked: "relay" (through a TURN server), "direct", or "" if unknown yet. */
export function linkKind(report){
 if(!report||typeof report.forEach!=="function")return"";
 const by=new Map();report.forEach(s=>{if(s&&s.id!==undefined)by.set(s.id,s)});
 let pair=null;
 by.forEach(s=>{if(s.type==="transport"&&s.selectedCandidatePairId&&by.has(s.selectedCandidatePairId))pair=by.get(s.selectedCandidatePairId)});
 if(!pair)by.forEach(s=>{if(s.type==="candidate-pair"&&(s.selected||(s.nominated&&s.state==="succeeded")))pair=s});
 if(!pair)return"";
 const a=by.get(pair.localCandidateId),b=by.get(pair.remoteCandidateId);
 if(!a||!b)return"";
 return a.candidateType==="relay"||b.candidateType==="relay"?"relay":"direct";
}
