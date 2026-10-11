import test from "node:test";import assert from "node:assert/strict";
import {makeCode,cleanCode,rng,skewFromPings,reconcileDeck,splitBuffer,Assembler,Hub} from "../js/lib/party-core.js";

test("room codes are 4 easy-to-read characters",()=>{for(let i=0;i<300;i++)assert.match(makeCode(),/^[A-HJ-NP-Z2-9]{4}$/)});
test("typed codes are cleaned up",()=>assert.equal(cleanCode(" ab-c1d9 "),"ABC1"));
test("the same seed gives every laptop the same random numbers",()=>{
 const a=rng(12345),b=rng(12345),c=rng(54321),xs=Array.from({length:20},a),ys=Array.from({length:20},b);
 assert.deepEqual(xs,ys);assert.notDeepEqual(xs,Array.from({length:20},c));
 for(const x of xs)assert.ok(x>=0&&x<1);
});
test("clock skew trusts the fastest round trip",()=>{
 assert.equal(skewFromPings([{rtt:80,skew:10},{rtt:12,skew:-5},{rtt:40,skew:3}]),-5);
 assert.equal(skewFromPings([]),0);
});

test("a follower starts a deck the controller is playing, at the right position",()=>{
 const r=reconcileDeck({playing:false,pos:0,rate:1},{playing:true,pos:10,rate:1,at:1000},1500);
 assert.equal(r.play,true);assert.ok(Math.abs(r.seek-10.5)<1e-9);
});
test("small drift is left alone and big drift is corrected",()=>{
 const snap={playing:true,pos:10,rate:1,at:0};
 assert.equal(reconcileDeck({playing:true,pos:10.55,rate:1},snap,500).seek,undefined);
 assert.ok(Math.abs(reconcileDeck({playing:true,pos:12,rate:1},snap,500).seek-10.5)<1e-9);
});
test("a paused controller pauses the followers",()=>{
 const r=reconcileDeck({playing:true,pos:9,rate:1},{playing:false,pos:9,rate:1,at:0},999);
 assert.equal(r.pause,true);assert.equal(r.seek,undefined);
});
test("the sync nudge moves the target and the playback rate is copied",()=>{
 const r=reconcileDeck({playing:true,pos:10.5,rate:1},{playing:true,pos:10,rate:1.05,at:0},500,200);
 assert.equal(r.rate,1.05);assert.ok(r.seek>10.7);
});
test("the target position never goes below zero",()=>assert.equal(reconcileDeck({playing:true,pos:5,rate:1},{playing:true,pos:0,rate:1,at:0},-3000).seek,0));

test("songs split into chunks and rebuild in any order",async()=>{
 const bytes=Uint8Array.from({length:100000},(_,i)=>i%251),parts=splitBuffer(bytes.buffer,32768);
 assert.equal(parts.length,4);
 const a=new Assembler(parts.length);
 for(const i of[2,0,3,1])a.add(i,parts[i]);
 assert.deepEqual(new Uint8Array(await a.blob("audio/mpeg").arrayBuffer()),bytes);
});
test("the assembler ignores duplicate and invalid chunks and reports when complete",()=>{
 const a=new Assembler(2);
 assert.equal(a.add(0,new ArrayBuffer(1)),false);
 assert.equal(a.add(0,new ArrayBuffer(1)),false);
 assert.equal(a.add(7,new ArrayBuffer(1)),false);
 assert.equal(a.add(-1,new ArrayBuffer(1)),false);
 assert.equal(a.add(1,new ArrayBuffer(1)),true);
});

test("the room creator starts as controller and strangers cannot take control",()=>{
 const h=new Hub("host");h.join("host","Host");
 assert.equal(h.controller,"host");assert.equal(h.takeControl("nobody"),null);
});
test("taking over starts a new epoch only once",()=>{
 const h=new Hub("host");h.join("host","Host");h.join("a","A");
 assert.deepEqual(h.takeControl("a"),{controller:"a",epoch:1});
 assert.deepEqual(h.takeControl("a"),{controller:"a",epoch:1});
 assert.deepEqual(h.takeControl("host"),{controller:"host",epoch:2});
});
test("only the controller's current-epoch messages are accepted",()=>{
 const h=new Hub("host");h.join("host","Host");h.join("a","A");h.takeControl("a");
 assert.equal(h.accept("a",1),true);
 assert.equal(h.accept("a",0),false);
 assert.equal(h.accept("host",1),false);
});
test("when the controller leaves, the room creator takes over",()=>{
 const h=new Hub("host");h.join("host","Host");h.join("a","A");h.takeControl("a");
 assert.equal(h.leave("a"),true);assert.equal(h.controller,"host");assert.equal(h.epoch,2);
 assert.equal(h.leave("host-not-here"),false);
});
test("names are trimmed and the roster lists everyone",()=>{
 const h=new Hub("host");h.join("host","H");h.join("a","x".repeat(50));
 assert.equal(h.roster().length,2);assert.equal(h.roster()[1].name.length,20);
});
