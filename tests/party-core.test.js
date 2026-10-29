import test from "node:test";import assert from "node:assert/strict";
import {SYNC,makeCode,cleanCode,rng,skewFromPings,reconcileDeck,splitBuffer,Assembler,Hub} from "../js/lib/party-core.js";

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
test("when several pings are about equally fast, their middle value is used, so one odd reply cannot move the clock",()=>{
 const fast=[{rtt:20,skew:4},{rtt:22,skew:6},{rtt:21,skew:5},{rtt:25,skew:5.5},{rtt:19,skew:20}];
 assert.equal(skewFromPings(fast),5.5);
 assert.equal(skewFromPings([...fast,{rtt:300,skew:-400}]),5.5,"slow replies are ignored");
});

test("a follower starts a deck the controller is playing, at the right position",()=>{
 const r=reconcileDeck({playing:false,pos:0,rate:1},{playing:true,pos:10,rate:1,at:1000},1500);
 assert.equal(r.play,true);assert.ok(Math.abs(r.seek-(10.5+SYNC.lead))<1e-9,"it aims a little ahead, because starting takes a moment");
 assert.equal(reconcileDeck({playing:false,pos:10.5,rate:1},{playing:true,pos:10,rate:1,at:1000},1500).seek,undefined,"already in place: no jump");
});
test("tiny drift is left alone, small drift is nudged smoothly, big drift is a jump",()=>{
 const snap={playing:true,pos:10,rate:1,at:0};
 const tiny=reconcileDeck({playing:true,pos:10.505,rate:1},snap,500);assert.equal(tiny.seek,undefined);assert.equal(tiny.rate,undefined);
 const ahead=reconcileDeck({playing:true,pos:10.6,rate:1},snap,500);assert.equal(ahead.seek,undefined);assert.ok(ahead.rate<1&&ahead.rate>=.95,"ahead: slow down a little");
 const behind=reconcileDeck({playing:true,pos:10.4,rate:1},snap,500);assert.equal(behind.seek,undefined);assert.ok(behind.rate>1&&behind.rate<=1.05,"behind: speed up a little");
 const far=reconcileDeck({playing:true,pos:12,rate:1},snap,500,{},{});assert.ok(Math.abs(far.seek-(10.5+SYNC.lead))<1e-9);
});
test("the speed change never goes beyond 5% and comes back to normal when in place",()=>{
 const snap={playing:true,pos:10,rate:1,at:0};
 assert.ok(Math.abs(reconcileDeck({playing:true,pos:11,rate:1},snap,500,{},{seekAt:500}).rate-.95)<1e-9);
 assert.equal(reconcileDeck({playing:true,pos:10.5,rate:.97},snap,500).rate,1,"back to normal speed");
});
test("after a jump, another jump waits for the cooldown",()=>{
 const snap={playing:true,pos:10,rate:1,at:0},mem={};
 assert.ok(reconcileDeck({playing:true,pos:20,rate:1},snap,500,{},mem).seek!==undefined);
 assert.equal(reconcileDeck({playing:true,pos:20,rate:1},snap,1000,{},mem).seek,undefined,"too soon");
 assert.ok(reconcileDeck({playing:true,pos:20,rate:1},snap,500+SYNC.cooldown+10,{},mem).seek!==undefined,"after the cooldown");
});
test("a jump that landed short makes the next jump aim further ahead",()=>{
 const snap={playing:true,pos:10,rate:1,at:0},mem={};
 reconcileDeck({playing:true,pos:20,rate:1},snap,500,{},mem);
 const again=reconcileDeck({playing:true,pos:10.9,rate:1},{...snap,pos:11.6},700+SYNC.cooldown,{},mem);
 assert.ok(again.seek>11.6+.2+SYNC.lead,"it must lead by more than the first time");
});
test("a buffering deck is left alone",()=>{
 assert.deepEqual(reconcileDeck({playing:true,pos:3,rate:1,stalled:true},{playing:true,pos:10,rate:1,at:0},500),{});
});
test("a paused controller pauses the followers",()=>{
 const r=reconcileDeck({playing:true,pos:9,rate:1},{playing:false,pos:9,rate:1,at:0},999);
 assert.equal(r.pause,true);assert.equal(r.seek,undefined);
});
test("the sync nudge and a slower speaker both move the target, and the controller's playback rate is copied",()=>{
 const r=reconcileDeck({playing:true,pos:10.5,rate:1},{playing:true,pos:10,rate:1.05,at:0},500,{offsetMs:200});
 assert.ok(r.rate>1&&r.rate!==undefined);
 const far=reconcileDeck({playing:true,pos:10.5,rate:1},{playing:true,pos:10,rate:1.05,at:0},500,{offsetMs:900},{});
 assert.ok(far.seek>11.2);
 const slow=reconcileDeck({playing:true,pos:10.5,rate:1},{playing:true,pos:10,rate:1,at:0,ol:20},500,{latencyMs:220});
 assert.ok(slow.rate>1,"this laptop's sound comes out 200 ms later, so it plays ahead");
 const same=reconcileDeck({playing:true,pos:10.5,rate:1},{playing:true,pos:10,rate:1,at:0},500,{latencyMs:220});
 assert.equal(same.rate,undefined,"if the controller's delay is unknown, nothing is assumed");
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
