// Party mode connection tools: the connection test, relay links, ping labels and the goodbye message.
import test from "node:test";import assert from "node:assert/strict";
import {$,click,w,d as document} from "./harness.js";
import {Peer} from "./stubs/peerjs.js";
const tick=async(ms=30)=>new Promise(r=>setTimeout(r,ms));
const person=name=>[...document.querySelectorAll("#proster li")].find(x=>x.querySelector(".nm").textContent.startsWith(name));
const save=(o={})=>{for(const[k,v]of Object.entries({prlink:"",prurls:"",pruser:"",prpass:"",...o}))$(k).value=v;$("prforce").checked=false;$("prshared").checked=false;click("prsave")};
class FakePC{
 constructor(cfg){FakePC.cfg=cfg}createDataChannel(){}async createOffer(){return{}}
 async setLocalDescription(){setTimeout(()=>{for(const c of FakePC.cands)this.onicecandidate({candidate:{candidate:c}});this.onicecandidate({candidate:null})},0)}close(){}
}
const HOST="candidate:1 1 udp 2122260223 192.168.1.5 5000 typ host generation 0",SRFLX="candidate:2 1 udp 1686052607 1.2.3.4 5001 typ srflx raddr 192.168.1.5 rport 5000",RELAY="candidate:3 1 udp 41885439 5.6.7.8 3478 typ relay raddr 1.2.3.4 rport 5001";
const check=async()=>{click("pcheck");await tick(60);return{level:$("pcheckres").className,title:$("pct").textContent,advice:$("pca").textContent,busy:$("pcheck").disabled}};

test("the connection test says plainly what this network can do",async()=>{
 globalThis.RTCPeerConnection=FakePC;
 save();
 FakePC.cands=[HOST,SRFLX];
 let r=await check();assert.equal(r.level,"check ok");assert.match(r.title,/Direct connections can work/);assert.match(r.advice,/relay/i);assert.equal(r.busy,false);
 FakePC.cands=[HOST];
 r=await check();assert.equal(r.level,"check bad");assert.match(r.title,/blocks direct/);
 save({prurls:"turn:r.example.com:443",pruser:"bob",prpass:"pw"});
 FakePC.cands=[HOST,SRFLX];r=await check();assert.equal(r.level,"check bad");assert.match(r.title,/relay did not answer/i);
 assert.ok(FakePC.cfg.iceServers.find(s=>s.username==="bob"),"the test must use the saved relay");
 FakePC.cands=[HOST,SRFLX,RELAY];r=await check();assert.equal(r.level,"check good");assert.match(r.title,/Relay ready/);
 $("prshared").checked=true;$("prurls").value="";$("pruser").value="";$("prpass").value="";click("prsave");
 FakePC.cands=[HOST,SRFLX];r=await check();assert.equal(r.level,"check ok");assert.match(r.title,/shared relay did not answer/i);assert.match(r.advice,/own free relay/i);
 FakePC.cands=[HOST];r=await check();assert.equal(r.level,"check bad");assert.match(r.title,/shared relay did not answer/i);
 FakePC.cands=[HOST,SRFLX,RELAY];r=await check();assert.equal(r.level,"check good");assert.match(r.title,/Relay ready/);
 assert.ok(FakePC.cfg.iceServers.some(s=>s.username),"the test must try the shared relay");
 delete globalThis.RTCPeerConnection;
 r=await check();assert.equal(r.level,"check bad");assert.match(r.title,/cannot connect laptops/);
 save();
});
test("a relay link from a provider is fetched and its servers are used",async()=>{
 const asked=[];
 globalThis.fetch=async u=>{asked.push(u);return{ok:true,json:async()=>[{urls:"stun:s.example.com:3478"},{urls:["turn:t.example.com:80","turns:t.example.com:443?transport=tcp"],username:"u1",credential:"c1"},{urls:"turn:nopass.example.com:80"}]}};
 save({prlink:"https://app.example.com/creds?apiKey=k"});
 assert.match($("prstate").textContent,/Relay link is set/);
 click("pcreate");await tick();
 const cfg=Peer.last.opts.config,t=cfg.iceServers.find(s=>s.username==="u1");
 assert.deepEqual(asked,["https://app.example.com/creds?apiKey=k"]);
 assert.ok(t);assert.equal(t.urls.length,2);assert.ok(!cfg.iceServers.some(s=>s.urls.some(u=>/nopass/.test(u))),"incomplete servers are dropped");
 click("pleave");await tick();
});
test("a relay link must be https, and a provider that is down does not stop the room",async()=>{
 save();save({prlink:"http://app.example.com/creds"});
 assert.doesNotMatch($("prstate").textContent,/Relay link is set/);
 globalThis.fetch=async()=>{throw new Error("offline")};
 save({prlink:"https://down.example.com/creds"});
 click("pcreate");await tick();
 assert.equal($("partyOn").hidden,false,"the room still opens");
 assert.equal(Peer.last.opts.config.iceServers.length,1);
 globalThis.fetch=async()=>({ok:true,json:async()=>({nonsense:true})});
 click("pleave");await tick();
 save({prlink:"https://junk.example.com/creds"});click("pcreate");await tick();
 assert.equal(Peer.last.opts.config.iceServers.length,1);
});
let host,g,got=[],conn;
test("each laptop reports its delay to the hub and the list shows it",async()=>{
 host="noxy-"+$("pcodeShow").textContent;
 g=new Peer("g1");await tick();conn=g.connect(host);conn.on("data",m=>got.push(m));await tick();conn.send({t:"hello",name:"Gee"});await tick();
 conn.send({t:"q",ms:45});await tick();
 const li=person("Gee");assert.ok(li);assert.equal(li.querySelector(".ping").textContent,"45 ms");assert.ok(li.querySelector(".ping").classList.contains("good"));
 assert.equal(got.filter(m=>m.t==="roster").pop().list.find(r=>r.id==="g1").ms,45,"everyone is told");
 conn.send({t:"q",ms:150});await tick();assert.ok(person("Gee").querySelector(".ping").classList.contains("ok"));
 conn.send({t:"q",ms:900});await tick();assert.ok(person("Gee").querySelector(".ping").classList.contains("slow"));
 assert.equal(person("Host")||null,null,"the hub is not shown with a delay of its own");
});
test("nonsense delay reports are ignored",async()=>{
 for(const ms of[NaN,-5,"x",1e9,null,undefined,{}]){conn.send({t:"q",ms});await tick(10)}
 assert.equal(person("Gee").querySelector(".ping").textContent,"900 ms");
});
test("the hub says goodbye before the room closes",async()=>{
 got.length=0;click("pleave");await tick(250);
 assert.ok(got.find(m=>m.t==="bye"),"followers must know the room was closed on purpose");
 assert.equal($("partyOff").hidden,false);
});
