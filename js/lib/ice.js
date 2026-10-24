/* NoxyMusic · connection settings for party mode. Pure functions, so they are easy to test. */
export const STUN=["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun.cloudflare.com:3478"];
const MAX_URLS=6,TURN_RE=/^turns?:[^\s<>"']{3,200}$/i,ANY_RE=/^(turns?|stuns?):[^\s<>"']{3,200}$/i;
/* "turn:a:80, turns:a:443?transport=tcp" -> ["turn:a:80","turns:a:443?transport=tcp"]; anything that is not a turn(s) address is dropped */
export function turnUrls(text){
 const list=String(text||"").split(/[,\s]+/).filter(u=>TURN_RE.test(u));
 return[...new Set(list)].slice(0,MAX_URLS);
}
export const isHttpsUrl=u=>{try{return new URL(String(u)).protocol==="https:"}catch{return false}};
/* Reads the answer of a relay provider's "credentials" link (a JSON list of ICE servers) and keeps only safe, complete entries. */
export function parseIceServers(data){
 const list=Array.isArray(data)?data:data&&Array.isArray(data.iceServers)?data.iceServers:[];
 const out=[];
 for(const s of list.slice(0,10)){
  if(!s||typeof s!=="object")continue;
  const raw=Array.isArray(s.urls)?s.urls:[s.urls||s.url];
  const urls=raw.filter(u=>typeof u==="string"&&ANY_RE.test(u)).slice(0,8);
  if(!urls.length)continue;
  const e={urls};
  if(urls.some(u=>/^turns?:/i.test(u))){
   if(typeof s.username!=="string"||typeof s.credential!=="string"||!s.username||!s.credential)continue;
   e.username=s.username.slice(0,300);e.credential=s.credential.slice(0,500);
  }
  out.push(e);
 }
 return out;
}
const hasTurn=s=>s.urls.some(u=>/^turns?:/i.test(u));
/* Builds the RTCPeerConnection settings: free STUN always, plus a TURN relay when the address, user and password are all given,
   or when a provider link supplied servers (extra). */
export function buildIce({urls="",username="",credential="",relayOnly=false,extra=[]}={}){
 const t=turnUrls(urls),user=String(username||"").trim().slice(0,200),pass=String(credential||"").slice(0,500);
 const servers=[{urls:[...STUN]}];
 if(t.length>0&&user!==""&&pass!=="")servers.push({urls:t,username:user,credential:pass});
 for(const s of extra)servers.push(s);
 const relay=servers.some(hasTurn);
 return{relay,config:{iceServers:servers,iceTransportPolicy:relay&&relayOnly?"relay":"all",sdpSemantics:"unified-plan"}};
}
/* A free shared relay (Metered Open Relay) that needs no sign-up. It uses coturn "shared secret" logins: the user name is an
   expiry time and the password is its HMAC-SHA1. hmac(secret, text) -> base64 is passed in so this stays pure and testable. */
export const SHARED_HOST="staticauth.openrelay.metered.ca",SHARED_SECRET="openrelayprojectsecret",SHARED_HOURS=6;
export const sharedUrls=()=>[`turn:${SHARED_HOST}:80`,`turn:${SHARED_HOST}:80?transport=tcp`,`turn:${SHARED_HOST}:443`,`turns:${SHARED_HOST}:443?transport=tcp`];
export async function sharedServer(nowMs,hmac){
 const username=String(Math.floor(nowMs/1000)+SHARED_HOURS*3600);
 return{urls:sharedUrls(),username,credential:await hmac(SHARED_SECRET,username)};
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
/* "candidate:1 1 udp 2122 1.2.3.4 5000 typ srflx raddr ..." -> "srflx" */
export const candidateType=line=>{const m=/ typ (host|srflx|prflx|relay)\b/.exec(String(line||""));return m?m[1]:""};
/* Turns what a connection test found into plain words. found: {supported, srflx, relay}; relaySet: a relay is configured. */
export function summarizeCheck(found,relaySet,shared=false){
 if(!found||!found.supported)return{level:"bad",title:"This browser cannot connect laptops",advice:"Use the latest Chrome or Edge."};
 if(found.relay)return{level:"good",title:"Relay ready",advice:"Almost any network can connect, even strict ones."};
 if(shared&&!relaySet)return{level:found.srflx?"ok":"bad",title:"The free shared relay did not answer",advice:"It may be busy or blocked on this network. Direct connections "+(found.srflx?"can still work for many friends. ":"look blocked too. ")+"For the most reliable party, add your own free relay under Connection help, or try another network."};
 if(relaySet)return{level:"bad",title:"The relay did not answer",advice:"Check the relay address, user name and password under Connection help. Some networks also block the relay: try another network."};
 if(found.srflx)return{level:"ok",title:"Direct connections can work",advice:"Friends on strict networks, many phone hotspots and some home connections may still fail. Add a free relay under Connection help for the most reliable party."};
 return{level:"bad",title:"This network blocks direct connections",advice:"Add a relay under Connection help, or try another network or a phone hotspot."};
}
/* round trip time in milliseconds -> a short quality word */
export const quality=ms=>!Number.isFinite(ms)||ms<0?"":ms<80?"good":ms<200?"ok":"slow";
