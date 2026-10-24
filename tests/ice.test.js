import test from "node:test";import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {STUN,SHARED_SECRET,sharedServer,sharedUrls,buildIce,candidateType,isHttpsUrl,linkKind,parseIceServers,quality,summarizeCheck,turnUrls} from "../js/lib/ice.js";

test("turnUrls keeps only turn and turns addresses, without duplicates",()=>{
 assert.deepEqual(turnUrls("turn:a.com:80, turns:a.com:443?transport=tcp  turn:a.com:80"),["turn:a.com:80","turns:a.com:443?transport=tcp"]);
 assert.deepEqual(turnUrls("http://evil.com, javascript:alert(1), stun:x.com:3478, turn:"),[]);
 assert.deepEqual(turnUrls(""),[]);assert.deepEqual(turnUrls(undefined),[]);
 assert.equal(turnUrls(Array.from({length:20},(_,i)=>`turn:h${i}.com:80`).join(",")).length,6);
});
test("without full relay details only STUN is used",()=>{
 for(const o of[{},{urls:"turn:a.com:80"},{urls:"turn:a.com:80",username:"u"},{username:"u",credential:"p"},{urls:"http://x.com",username:"u",credential:"p"}]){
  const r=buildIce({...o,relayOnly:true});
  assert.equal(r.relay,false);assert.equal(r.config.iceServers.length,1);assert.deepEqual(r.config.iceServers[0].urls,STUN);
  assert.equal(r.config.iceTransportPolicy,"all","forcing the relay without one would block every connection");
 }
});
test("full relay details add a TURN server, and test mode forces it",()=>{
 const r=buildIce({urls:"turn:a.com:443?transport=tcp",username:" bob ",credential:"secret"});
 assert.equal(r.relay,true);assert.equal(r.config.iceServers.length,2);
 assert.deepEqual(r.config.iceServers[1],{urls:["turn:a.com:443?transport=tcp"],username:"bob",credential:"secret"});
 assert.equal(r.config.iceTransportPolicy,"all");
 assert.equal(buildIce({urls:"turn:a.com:80",username:"u",credential:"p",relayOnly:true}).config.iceTransportPolicy,"relay");
});
const rep=(local,remote,viaTransport=true)=>new Map([
 ["l",{id:"l",type:"local-candidate",candidateType:local}],["r",{id:"r",type:"remote-candidate",candidateType:remote}],
 ["p",{id:"p",type:"candidate-pair",localCandidateId:"l",remoteCandidateId:"r",...(viaTransport?{}:{nominated:true,state:"succeeded"})}],
 ...(viaTransport?[["t",{id:"t",type:"transport",selectedCandidatePairId:"p"}]]:[])]);
test("linkKind tells direct links from relayed ones",()=>{
 assert.equal(linkKind(rep("srflx","host")),"direct");
 assert.equal(linkKind(rep("relay","srflx")),"relay");
 assert.equal(linkKind(rep("host","relay")),"relay","a relay on either side counts");
 assert.equal(linkKind(rep("srflx","srflx",false)),"direct","falls back to the nominated pair");
 assert.equal(linkKind(rep("relay","host",false)),"relay");
});
test("linkKind returns an empty answer when the link is not ready or the report is odd",()=>{
 for(const r of[null,undefined,{},"x",new Map(),new Map([["p",{id:"p",type:"candidate-pair",state:"in-progress"}]]),
  new Map([["t",{id:"t",type:"transport",selectedCandidatePairId:"missing"}]]),
  new Map([["p",{id:"p",type:"candidate-pair",nominated:true,state:"succeeded",localCandidateId:"x",remoteCandidateId:"y"}]])])assert.equal(linkKind(r),"");
});

test("parseIceServers keeps complete, safe entries from a provider link and drops the rest",()=>{
 const ok=parseIceServers([
  {urls:"stun:s.example.com:3478"},
  {urls:["turn:t.example.com:80","turns:t.example.com:443?transport=tcp","http://evil.example.com"],username:"u",credential:"c"},
  {urls:"turn:nopass.example.com:80"},{urls:"javascript:alert(1)"},null,"x",{url:"turn:t2.example.com:80",username:"u2",credential:"c2"}]);
 assert.deepEqual(ok,[{urls:["stun:s.example.com:3478"]},{urls:["turn:t.example.com:80","turns:t.example.com:443?transport=tcp"],username:"u",credential:"c"},{urls:["turn:t2.example.com:80"],username:"u2",credential:"c2"}]);
 assert.deepEqual(parseIceServers({iceServers:[{urls:"stun:a.com:1"}]}),[{urls:["stun:a.com:1"]}]);
 for(const bad of[null,undefined,{},"x",42,[]])assert.deepEqual(parseIceServers(bad),[]);
 assert.equal(parseIceServers(Array.from({length:50},()=>({urls:"stun:a.com:1"}))).length,10);
});
test("servers from a provider link count as a relay, and test mode can force them",()=>{
 const extra=parseIceServers([{urls:"turn:t.example.com:443",username:"u",credential:"c"}]);
 const r=buildIce({extra,relayOnly:true});
 assert.equal(r.relay,true);assert.equal(r.config.iceTransportPolicy,"relay");assert.equal(r.config.iceServers.length,2);
 assert.equal(buildIce({extra:parseIceServers([{urls:"stun:a.com:1"}])}).relay,false,"a STUN-only list is not a relay");
});
test("only https provider links are accepted",()=>{
 assert.equal(isHttpsUrl("https://app.metered.live/api/v1/turn/credentials?apiKey=x"),true);
 for(const u of["http://a.com","javascript:alert(1)","data:text/plain,hi","","nope",null,undefined])assert.equal(isHttpsUrl(u),false);
});
test("candidateType reads the kind from a candidate line",()=>{
 assert.equal(candidateType("candidate:1 1 udp 2122260223 192.168.1.5 5000 typ host generation 0"),"host");
 assert.equal(candidateType("candidate:2 1 udp 1686052607 1.2.3.4 5001 typ srflx raddr 192.168.1.5 rport 5000"),"srflx");
 assert.equal(candidateType("candidate:3 1 udp 41885439 5.6.7.8 3478 typ relay raddr 1.2.3.4 rport 5001"),"relay");
 assert.equal(candidateType(""),"");assert.equal(candidateType(undefined),"");assert.equal(candidateType("typ hostile"),"");
});
test("summarizeCheck gives plain advice for every case",()=>{
 assert.equal(summarizeCheck({supported:false},false).level,"bad");assert.equal(summarizeCheck(null,false).level,"bad");
 assert.equal(summarizeCheck({supported:true,relay:true,srflx:true},true).level,"good");
 assert.equal(summarizeCheck({supported:true,relay:false,srflx:true},true).level,"bad","relay set but silent");
 assert.match(summarizeCheck({supported:true,relay:false,srflx:true},true).title,/relay did not answer/i);
 const ok=summarizeCheck({supported:true,relay:false,srflx:true},false);
 assert.equal(ok.level,"ok");assert.match(ok.advice,/relay/i);
 assert.equal(summarizeCheck({supported:true,relay:false,srflx:false},false).level,"bad");
});
test("quality words follow the round trip time",()=>{
 assert.equal(quality(20),"good");assert.equal(quality(79),"good");assert.equal(quality(80),"ok");assert.equal(quality(199),"ok");assert.equal(quality(200),"slow");
 for(const v of[NaN,Infinity,-1,undefined,"x"])assert.equal(quality(v),"");
});

test("the shared relay login is an expiry time signed with the shared secret",async()=>{
 const hmac=async(k,m)=>createHmac("sha1",k).update(m).digest("base64"),now=1_700_000_000_000;
 const s=await sharedServer(now,hmac);
 assert.equal(s.username,String(1_700_000_000+6*3600));
 assert.equal(s.credential,createHmac("sha1",SHARED_SECRET).update(s.username).digest("base64"));
 assert.deepEqual(s.urls,sharedUrls());assert.ok(s.urls.every(u=>/^turns?:staticauth\.openrelay\.metered\.ca:(80|443)/.test(u)));
 const r=buildIce({extra:[s]});assert.equal(r.relay,true);assert.equal(r.config.iceServers.length,2);
});
test("a failing signer means no shared relay, and the connection test explains a silent shared relay",async()=>{
 await assert.rejects(sharedServer(Date.now(),async()=>{throw new Error("no crypto")}));
 assert.equal(summarizeCheck({supported:true,srflx:true,relay:false},false,true).level,"ok");
 assert.equal(summarizeCheck({supported:true,srflx:false,relay:false},false,true).level,"bad");
 assert.match(summarizeCheck({supported:true,srflx:true,relay:false},true,true).title,/relay did not answer/i,"your own relay keeps its own message");
 assert.equal(summarizeCheck({supported:true,srflx:true,relay:true},false,true).level,"good");
});
