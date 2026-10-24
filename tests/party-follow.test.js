// Party mode from a follower's side: joining, a dropped link that comes back, a room closed on purpose, and bad codes.
import test from "node:test";import assert from "node:assert/strict";
import {$,click} from "./harness.js";
import {Peer} from "./stubs/peerjs.js";
const tick=async(ms=40)=>new Promise(r=>setTimeout(r,ms));
let hostPeer,joins=0,live=[],hello=[];
const startHost=()=>{
 hostPeer=new Peer("noxy-ABCD");
 hostPeer.on("connection",c=>{
  joins++;live.push(c);
  c.on("data",m=>{if(m.t==="hello"){hello.push(m.name);c.send({t:"welcome",controller:"noxy-ABCD",epoch:0});c.send({t:"roster",list:[{id:"noxy-ABCD",name:"Host",link:"",ms:0},{id:c.peer,name:m.name,link:"direct",ms:30}]})}});
 });
};
const join=async code=>{$("pcode").value=code;click("pjoin")};
test("joining a room shows its code and the laptops in it",async()=>{
 startHost();$("pname").value="Me";await join("abcd");await tick(80);
 assert.equal($("partyOn").hidden,false);assert.equal($("pcodeShow").textContent,"ABCD");assert.deepEqual(hello,["Me"]);
 assert.match($("proster").textContent,/Host/);assert.match($("proster").textContent,/Me/);
 assert.match($("dRoom").textContent,/ABCD · 2 here/);assert.ok($("dRoom").classList.contains("live"));
});
test("a dropped link comes back by itself",async()=>{
 live[0].close();await tick(20);
 assert.match($("pwait").textContent,/Reconnecting \(1\/4\)/);assert.equal($("partyOn").hidden,true);
 await tick(1900);
 assert.equal(joins,2,"the laptop must knock again");assert.equal($("partyOn").hidden,false);assert.equal($("pcodeShow").textContent,"ABCD");assert.equal($("pwait").textContent,"");
 assert.equal(hello.length,2);
});
test("leaving while reconnecting stops the retries",async()=>{
 live[1].close();await tick(20);
 click("pleave");await tick(2200);
 assert.equal(joins,2,"no new knock after leaving");assert.equal($("partyOn").hidden,true);assert.equal($("pwait").textContent,"");
});
test("a room closed on purpose is not chased",async()=>{
 await join("ABCD");await tick(80);assert.equal(joins,3);
 const c=live[2];c.send({t:"bye"});await tick(10);c.close();await tick(2200);
 assert.equal(joins,3,"it must not keep knocking at a closed room");assert.equal($("partyOn").hidden,true);
 assert.equal($("partyOff").hidden,false);
});
test("a wrong code and a short code say so",async()=>{
 await join("ZZZZ");await tick(80);assert.equal($("perr").textContent,"No room with that code");assert.equal($("partyOff").hidden,false);
 await join("AB");await tick(10);assert.equal($("perr").textContent,"Enter the 4-character room code");
});
