import test from "node:test";import assert from "node:assert/strict";
import {STUN,buildIce,linkKind,turnUrls} from "../js/lib/ice.js";

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
