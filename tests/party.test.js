// Party mode end to end: the real app is the room host, and a scripted "second laptop" talks to it through the fake PeerJS.
import test from "node:test";import assert from "node:assert/strict";
import {$,click,change,pump} from "./harness.js";
import {D} from "../js/state.js";
import {lightsLink} from "../js/lights.js";
import {Peer} from "./stubs/peerjs.js";
import {splitBuffer} from "../js/lib/party-core.js";
const tick=async(n=8)=>{for(let i=0;i<n;i++)await new Promise(r=>setTimeout(r,5))};
const snap=(epoch,id,playing)=>({t:"snap",epoch,at:performance.now(),xf:0,A:{id,name:"song.mp3",playing,pos:3,rate:1,vol:.8},B:{id:"",name:"",playing:false,pos:0,rate:1,vol:.8},lights:{mode:"off",lint:.8}});
let code,host,guest,conn;const got=[];

test("creating a room shows a 4-character code and makes this laptop the DJ",async()=>{
 $("pname").value="Host";click("pcreate");await tick();
 code=$("pcodeShow").textContent;host="noxy-"+code;
 assert.match(code,/^[A-HJ-NP-Z2-9]{4}$/);assert.equal($("partyOn").hidden,false);assert.match($("pstatus").textContent,/You are the DJ/);
 assert.equal(lightsLink.remote,false);
});
test("a second laptop joins and appears in the list",async()=>{
 guest=new Peer("guest1");await tick();
 conn=guest.connect(host);conn.on("data",m=>got.push(m));await tick();
 conn.send({t:"hello",name:"Guest"});await tick();
 assert.ok(got.find(m=>m.t==="welcome"&&m.controller===host));
 assert.match($("proster").textContent,/Guest/);assert.match($("proster").textContent,/Host \(you\)/);
});
test("while this laptop is the DJ, its light beats are sent to the other laptop",async()=>{
 change("lmode","disco");got.length=0;pump(90);await tick();
 const lb=got.find(m=>m.t==="lb");
 assert.ok(lb,"no light beat received");
 for(const k of["seed","hue","scene","bpm","sf","fx","fy","black"])assert.ok(k in lb,k);
 assert.equal(lb.epoch,0);change("lmode","off");
});
test("when the guest takes control, the host stops playing and follows",async()=>{
 D.A.a.src="blob:host-song";await D.A.a.play();assert.equal(D.A.a.paused,false);
 conn.send({t:"ctl"});await tick();
 assert.ok(got.find(m=>m.t==="controller"&&m.controller==="guest1"&&m.epoch===1));
 assert.equal(D.A.a.paused,true);
 assert.match($("pstatus").textContent,/Following Guest/);
 assert.equal(lightsLink.remote,true);
});
test("the host asks for a song it does not have, receives it in chunks, and plays it in sync",async()=>{
 conn.send(snap(1,"s1",true));await tick();
 assert.ok(got.find(m=>m.t==="want"&&m.id==="s1"));
 const bytes=Uint8Array.from({length:70000},(_,i)=>i%251),parts=splitBuffer(bytes.buffer);
 conn.send({t:"fmeta",to:host,id:"s1",name:"song.mp3",type:"audio/mpeg",n:parts.length,size:70000});
 parts.forEach((b,i)=>conn.send({t:"chunk",to:host,id:"s1",i,b}));
 await tick(15);
 conn.send(snap(1,"s1",true));await tick();
 assert.ok(D.A.a.src.startsWith("blob:"));assert.notEqual(D.A.a.src,"blob:host-song");
 assert.equal(D.A.a.paused,false);assert.equal($("nameA").textContent,"song.mp3");
});
test("snapshots from an old epoch are ignored",async()=>{
 const before=D.A.a.paused;conn.send(snap(0,"s1",false));await tick();assert.equal(D.A.a.paused,before);
});
test("light beats from the DJ are drawn by a follower, and old ones are dropped",async()=>{
 const lb=(epoch,scene=2)=>({t:"lb",epoch,seed:7,hue:200,scene,bpm:128,sf:1,fx:.5,fy:.3,fh:200,black:0});
 conn.send(snap(1,"s1",true));conn.send({...snap(1,"s1",true),lights:{mode:"show",lint:.8}});await tick();
 assert.equal($("lmode").value,"show");
 conn.send(lb(0));await tick();assert.equal(lightsLink.pending.length,0);
 conn.send(lb(1));await tick();assert.equal(lightsLink.pending.length,1);
 pump(5);assert.equal(lightsLink.pending.length,0);
 conn.send(lb(1,2));await tick();pump(20);
 assert.match($("lstat").textContent,/128 BPM · scene: disco/);
 conn.send(lb(1,3));await tick();pump(20);
 assert.match($("lstat").textContent,/scene: laser/);
 conn.send(lb(0,4));await tick();pump(20);
 assert.match($("lstat").textContent,/scene: laser/,"an old-epoch beat must not change the scene");
 change("lmode","off");
});
test("malformed messages from another laptop cannot crash the app or exhaust memory",async()=>{
 conn.send({t:"lb",epoch:1,seed:"x",hue:NaN,scene:1e9,bpm:-5,sf:99,fx:"a",fy:null,fh:1e9,black:1e9});
 await tick();const e=lightsLink.pending[0];
 assert.ok(e&&e.scene<=99&&e.bpm>=40&&e.sf<=1&&e.black<=5000&&Number.isFinite(e.hue)&&Number.isFinite(e.fx));
 pump(3);
 conn.send({t:"fx",name:'x"] , body ['});conn.send({t:"snap",epoch:1,at:0});
 conn.send({t:"fmeta",to:host,id:"huge",name:"big.mp3",type:"audio/mpeg",n:1e9,size:1e3});
 conn.send({t:"chunk",to:host,id:"huge",i:0,b:new ArrayBuffer(8)});
 await tick(10);
 assert.equal($("pxfer").textContent,"");
});
test("pressing play on the host takes control back and the guest is told",async()=>{
 got.length=0;click("playA");await tick();
 assert.ok(got.find(m=>m.t==="controller"&&m.controller===host));
 assert.match($("pstatus").textContent,/You are the DJ/);
 assert.equal(lightsLink.remote,false);
});
test("effect pads on the controller are played on the other laptop",async()=>{
 got.length=0;document.querySelector('[data-fx="horn"]').click();await tick();
 assert.ok(got.find(m=>m.t==="fx"&&m.name==="horn"));
});
test("leaving closes the room panel",async()=>{click("pleave");await tick();assert.equal($("partyOff").hidden,false);assert.equal($("partyOn").hidden,true)});
test("joining someone else's room by code works",async()=>{
 const boss=new Peer("noxy-ABCD");
 boss.on("connection",c=>c.on("data",m=>{if(m.t==="hello"){c.send({t:"welcome",controller:"noxy-ABCD",epoch:0});c.send({t:"roster",list:[{id:"noxy-ABCD",name:"Boss"},{id:c.peer,name:m.name}]})}}));
 await tick();$("pcode").value="abcd";click("pjoin");await tick(20);
 assert.equal($("partyOn").hidden,false);assert.equal($("pcodeShow").textContent,"ABCD");assert.match($("pstatus").textContent,/Following Boss/);
 click("pleave");await tick();
});
test("a wrong room code gives a clear message",async()=>{
 $("pcode").value="ZZZZ";click("pjoin");await tick(20);
 assert.match($("perr").textContent,/No room with that code/);
});
