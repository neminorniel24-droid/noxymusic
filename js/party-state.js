/* NoxyMusic · party mode: the shared state and the connection settings. Used by party.js and video.js. */
import {RELAY} from "./config.js";
import {buildIce,isHttpsUrl,parseIceServers,sharedServer} from "./lib/ice.js";

export const q=new URLSearchParams(location.search),KEY="noxy.relay";
/* Default is the free PeerJS cloud. To use your own server: ?peerhost=example.com&peerport=443&peerpath=/ */
export const BROKER=q.get("peerhost")?{host:q.get("peerhost"),port:+(q.get("peerport")||443),path:q.get("peerpath")||"/",secure:q.get("peersecure")!=="0"}:{};
export const P={peer:null,conn:null,conns:new Map(),kinds:new Map(),ms:new Map(),hub:null,isHub:false,me:"",code:"",controller:"",epoch:0,skew:0,rtt:-1,roster:[],samples:[],
 files:new Map(),meta:new Map(),ids:{A:"",B:""},names:{A:"",B:""},asm:new Map(),asked:new Map(),offset:0,lights:{mode:"off",lint:.8},fxLock:false,timer:0,qt:0,gen:0,
 label:"Laptop "+(10+Math.floor(Math.random()*90))};
export const on=()=>!!P.peer&&!!P.me&&(P.isHub||!!P.conn),isCtl=()=>P.controller===P.me;
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* relay settings come from the page address, then this browser, then js/config.js */
export const saved=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{return{}}};
export const relayCfg=()=>{
 const s=saved();
 return{link:q.get("turnlink")||s.link||RELAY.link,urls:q.get("turn")||s.urls||RELAY.urls,username:q.get("turnuser")||s.username||RELAY.username,
  credential:q.get("turnpass")||s.credential||RELAY.credential,relayOnly:q.get("relayonly")==="1"||!!s.relayOnly};
};
/* a provider link returns fresh servers as JSON; keep them for ten minutes */
let cache={url:"",at:0,servers:[]};
export async function fetchRelay(link){
 if(!isHttpsUrl(link))return[];
 if(cache.url===link&&Date.now()-cache.at<6e5)return cache.servers;
 try{
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),4000);
  const r=await fetch(link,{signal:ctl.signal,cache:"no-store"});
  clearTimeout(t);
  if(!r.ok)return[];
  const servers=parseIceServers(await r.json());
  cache={url:link,at:Date.now(),servers};
  return servers;
 }catch{return[]}
}
/* the free shared relay is used only when no relay of your own is set, and can be switched off */
export const sharedOn=()=>q.get("shared")!=="0"&&saved().shared!==false;
async function hmacSha1(key,text){
 const enc=new TextEncoder(),k=await crypto.subtle.importKey("raw",enc.encode(key),{name:"HMAC",hash:"SHA-1"},false,["sign"]);
 return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(text)))));
}
export async function iceConfig(){
 const c=relayCfg(),extra=await fetchRelay(c.link),own=buildIce({...c,extra});
 if(own.relay||!sharedOn())return own;
 try{return{...buildIce({...c,extra:[...extra,await sharedServer(Date.now(),hmacSha1)]}),shared:true}}catch{return own}
}
export const forgetRelayCache=()=>{cache={url:"",at:0,servers:[]}};
export const hasRelay=()=>{const c=relayCfg();return buildIce({...c,extra:cache.url&&cache.url===c.link?cache.servers:[]}).relay};
