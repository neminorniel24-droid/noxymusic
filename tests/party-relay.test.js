// Party mode relay settings: what the app hands to PeerJS, and how each laptop's link is shown.
import test from "node:test";import assert from "node:assert/strict";
import {$,click,d as document} from "./harness.js";
import {createHmac} from "node:crypto";
import {Peer} from "./stubs/peerjs.js";
const tick=async(ms=20)=>new Promise(r=>setTimeout(r,ms));
const person=name=>[...document.querySelectorAll("#proster li")].find(x=>x.querySelector(".nm").textContent.startsWith(name));
const tags=li=>[...li.querySelectorAll(".tg")].map(x=>x.textContent).join(",");
const fill=(urls,user,pass,force=false)=>{$("prurls").value=urls;$("pruser").value=user;$("prpass").value=pass;$("prforce").checked=force;$("prshared").checked=false;click("prsave")};

test("by default the free shared relay is added with a fresh login, so strict networks can connect",async()=>{
 assert.match($("prstate").textContent,/free shared relay/);assert.equal($("prshared").checked,true);
 click("pcreate");await tick(60);
 const cfg=Peer.last.opts.config,s=cfg.iceServers.find(x=>x.username);
 assert.equal(cfg.iceServers.length,2);assert.equal(cfg.iceTransportPolicy,"all");
 assert.ok(s,"no shared relay passed");assert.ok(s.urls.every(u=>u.includes("staticauth.openrelay.metered.ca")));
 assert.ok(s.urls.some(u=>u.startsWith("turns:")&&u.includes("transport=tcp")),"needs a TCP+TLS address for strict firewalls");
 const left=+s.username-Date.now()/1000;assert.ok(left>3600&&left<=6*3600+5,"the login must last a few hours");
 assert.equal(s.credential,createHmac("sha1","openrelayprojectsecret").update(s.username).digest("base64"));
 click("pleave");await tick();
});
test("with the shared relay switched off and no relay of your own, only STUN servers are used",async()=>{
 $("prshared").checked=false;click("prsave");
 assert.match($("prstate").textContent,/No relay set/);
 click("pcreate");await tick(60);
 const cfg=Peer.last.opts.config;
 assert.equal(cfg.iceServers.length,1);assert.equal(cfg.iceTransportPolicy,"all");
 click("pleave");await tick();
});
test("a relay of your own replaces the shared one",async()=>{
 $("prurls").value="turn:mine.example.com:443";$("pruser").value="me";$("prpass").value="pw";$("prshared").checked=true;click("prsave");
 click("pcreate");await tick(60);
 const servers=Peer.last.opts.config.iceServers;
 assert.equal(servers.length,2);assert.ok(servers.some(s=>s.username==="me"));
 assert.ok(!servers.some(s=>s.urls.some(u=>u.includes("openrelay"))),"the shared relay must not be added next to your own");
 click("pleave");await tick();
});
test("incomplete relay details are refused",async()=>{
 fill("turn:r.example.com:443","bob","");
 assert.match($("prstate").textContent,/No relay set/);
 fill("http://evil.example.com","bob","pw");
 assert.match($("prstate").textContent,/No relay set/);
});
test("saved relay details are given to PeerJS when a room is created",async()=>{
 fill("turn:r.example.com:80, turns:r.example.com:443?transport=tcp","bob","pw");
 assert.match($("prstate").textContent,/Relay is on \(2 addresses\)/);
 click("pcreate");await tick();
 const cfg=Peer.last.opts.config,t=cfg.iceServers.find(s=>s.username);
 assert.ok(t,"no TURN server was passed");assert.equal(t.credential,"pw");assert.equal(t.urls.length,2);
 assert.equal(cfg.iceTransportPolicy,"all");
});
test("each laptop's link is shown in the list once it is known: direct, then via relay for another laptop",async()=>{
 const host="noxy-"+$("pcodeShow").textContent;
 Peer.kind="direct";
 const g1=new Peer("g1");await tick();const c1=g1.connect(host);c1.on("data",()=>{});await tick();c1.send({t:"hello",name:"Near"});
 await tick(1500);
 assert.equal(tags(person("Near")),"direct");
 Peer.kind="relay";
 const g2=new Peer("g2");await tick();const got=[],c2=g2.connect(host);c2.on("data",m=>got.push(m));await tick();c2.send({t:"hello",name:"Far"});
 await tick(1500);
 assert.equal(tags(person("Far")),"via relay");assert.equal(tags(person("Near")),"direct");
 const roster=got.filter(m=>m.t==="roster").pop();
 assert.equal(roster.list.find(r=>r.name==="Far").link,"relay","the other laptops are told too");
});
test("a link that is not ready yet shows nothing, and does not break the list",async()=>{
 const host="noxy-"+$("pcodeShow").textContent;
 Peer.kind="none";
 const g=new Peer("g3");await tick();const c=g.connect(host);c.on("data",()=>{});await tick();c.send({t:"hello",name:"Slow"});
 await tick(200);
 assert.equal(tags(person("Slow")),"","no label until the link is known");
});
test("test mode forces everything through the relay, and removing the relay undoes it",async()=>{
 click("pleave");await tick();
 fill("turn:r.example.com:80","bob","pw",true);
 assert.match($("prstate").textContent,/forced/);
 click("pcreate");await tick();
 assert.equal(Peer.last.opts.config.iceTransportPolicy,"relay");
 click("pleave");await tick();
 click("prclear");assert.match($("prstate").textContent,/free shared relay/,"removing your relay goes back to the default");assert.equal($("prurls").value,"");
 click("pcreate");await tick(60);
 assert.equal(Peer.last.opts.config.iceServers.length,2);assert.equal(Peer.last.opts.config.iceTransportPolicy,"all");
 click("pleave");
});
