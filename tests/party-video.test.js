// Party video: optional, small, and always through the hub. The real app is the hub; scripted laptops join it.
import test from "node:test";import assert from "node:assert/strict";
import {$,click,w} from "./harness.js";
import {S} from "../js/state.js";
import {Peer} from "./stubs/peerjs.js";
const tick=async(ms=30)=>new Promise(r=>setTimeout(r,ms));
const flip=(id,v)=>{$(id).checked=v;$(id).dispatchEvent(new w.Event("change"))};
let host;const guests={};
const joinGuest=async(id,name)=>{
 const peer=new Peer(id),g={peer,incoming:[]};
 peer.on("call",c=>{g.incoming.push(c);c.answer()});
 await tick();const conn=peer.connect(host);conn.on("data",()=>{});g.conn=conn;await tick();conn.send({t:"hello",name});await tick();
 guests[id]=g;return g;
};
const tiles=()=>[...document.querySelectorAll("#vtiles figure")].map(f=>f.querySelector("figcaption").textContent);
const document=w.document;

test("setup: a room with two friends",async()=>{
 click("pcreate");await tick();host="noxy-"+$("pcodeShow").textContent;
 await joinGuest("g1","Gee");await joinGuest("g2","Hari");
 assert.equal($("pvid").checked,false,"video is off by default");assert.equal($("pshare").hidden,true);
});
test("sharing needs a running camera",async()=>{
 S.running=false;flip("pvid",true);
 assert.equal($("pvid").checked,false);assert.equal($("pshare").hidden,true);
});
test("a friend's video appears on the stage and is passed on to the other friend only",async()=>{
 const stream={id:"s-g1"};
 const call=guests.g1.peer.call(host,stream,{metadata:{kind:"up"}});await tick(60);
 assert.deepEqual(tiles(),["Gee"]);assert.equal($("vtiles").hidden,false);assert.match($("vcount").textContent,/1 video$/);
 assert.equal(guests.g2.incoming.length,1);assert.deepEqual(guests.g2.incoming[0].metadata,{kind:"down",from:"g1"});
 assert.equal(guests.g1.incoming.length,0,"nobody gets their own video back");
 assert.equal(call.closed,undefined);
});
test("calls that are not from the room, or not the right kind, are refused",async()=>{
 const stranger=new Peer("stranger");await tick();
 const a=stranger.call(host,{id:"x"},{metadata:{kind:"up"}}),b=guests.g1.peer.call(host,{id:"x"},{metadata:{kind:"down",from:"g2"}}),c=guests.g1.peer.call(host,{id:"x"},{});
 const d=guests.g1.peer.call(host,{id:"x"},{metadata:"up"});
 await tick(60);
 for(const x of[a,b,c,d])assert.equal(x.closed,true);
 assert.deepEqual(tiles(),["Gee"],"no extra tiles");assert.equal(guests.g2.incoming.length,1,"nothing extra was forwarded");
});
test("sharing my own video sends it to every friend, and stopping ends it",async()=>{
 S.running=true;flip("pvid",true);await tick(60);
 assert.equal($("pvid").checked,true);assert.equal($("pshare").hidden,false);
 for(const id of["g1","g2"]){const mine=guests[id].incoming.filter(c=>c.metadata.from===host);assert.equal(mine.length,1,id);assert.equal(mine[0].metadata.kind,"down")}
 const calls=["g1","g2"].map(id=>guests[id].incoming.find(c=>c.metadata.from===host));
 flip("pvid",false);await tick(30);
 assert.equal($("pshare").hidden,true);for(const c of calls)assert.equal(c.pair.closed,true);
 assert.equal(guests.g2.incoming.find(c=>c.metadata.from==="g1").pair.closed,undefined,"friends' videos keep flowing");
});
test("a friend who joins later gets the videos that are already on",async()=>{
 const g3=await joinGuest("g3","Ira");await tick(60);
 assert.deepEqual(g3.incoming.map(c=>c.metadata.from),["g1"]);
});
test("when a friend stops or leaves, their video disappears everywhere",async()=>{
 const toG2=guests.g2.incoming.find(c=>c.metadata.from==="g1");
 guests.g1.conn.close();await tick(60);
 assert.deepEqual(tiles(),[]);assert.equal($("vtiles").hidden,true);assert.equal($("vcount").textContent,"");
 assert.equal(toG2.pair.closed,true);
});
test("hiding friends' videos hides the tiles",async()=>{
 const call=guests.g2.peer.call(host,{id:"s-g2"},{metadata:{kind:"up"}});await tick(60);
 assert.deepEqual(tiles(),["Hari"]);assert.equal($("vtiles").hidden,false);
 flip("psee",false);assert.equal($("vtiles").hidden,true);
 flip("psee",true);assert.equal($("vtiles").hidden,false);
 assert.ok(call);
});
test("tiles are labelled safely",async()=>{
 const f=document.querySelector("#vtiles figure");assert.equal(f.querySelector("figcaption").children.length,0);
 f.click();assert.ok(f.classList.contains("big"));f.click();assert.ok(!f.classList.contains("big"));
});
test("leaving the room stops sharing and clears every tile",async()=>{
 flip("pvid",true);await tick(30);assert.equal($("pvid").checked,true);
 click("pleave");await tick(30);
 assert.equal($("pvid").checked,false);assert.equal($("pshare").hidden,true);assert.deepEqual(tiles(),[]);
 assert.equal(S.running,true);
});
