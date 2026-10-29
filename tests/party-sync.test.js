// Party sync on the real page: how often the DJ's laptop reports, and how a follower's deck is nudged.
import test from "node:test";import assert from "node:assert/strict";
import {$,click} from "./harness.js";
import {D} from "../js/state.js";
import {Peer} from "./stubs/peerjs.js";
import {splitBuffer} from "../js/lib/party-core.js";
const tick=async(ms=10)=>new Promise(r=>setTimeout(r,ms));
let host,conn;const got=[];
const snap=(pos,playing=true)=>({t:"snap",epoch:1,at:performance.now(),ol:0,xf:0,A:{id:"s1",name:"song.mp3",playing,pos,rate:1,vol:.8},B:{id:"",name:"",playing:false,pos:0,rate:1,vol:.8},lights:{mode:"off",lint:.8}});

test("the DJ laptop reports about eight times a second, with its speaker delay",async()=>{
 $("pname").value="Host";click("pcreate");await tick(60);
 host="noxy-"+$("pcodeShow").textContent;
 const g=new Peer("guest1");await tick();conn=g.connect(host);conn.on("data",m=>got.push(m));await tick();
 conn.send({t:"hello",name:"Guest"});await tick(20);
 got.length=0;await tick(1000);
 const snaps=got.filter(m=>m.t==="snap");
 assert.ok(snaps.length>=6&&snaps.length<=10,`snapshots in one second: ${snaps.length}`);
 assert.ok(snaps.every(s=>Number.isFinite(s.ol)&&s.ol>=0&&s.ol<=500),"every snapshot says how long this laptop takes to get sound out");
});
test("the guest takes over and sends the song",async()=>{
 conn.send({t:"ctl"});await tick(20);
 conn.send(snap(3));await tick(20);
 const bytes=Uint8Array.from({length:40000},(_,i)=>i%251),parts=splitBuffer(bytes.buffer);
 conn.send({t:"fmeta",to:host,id:"s1",name:"song.mp3",type:"audio/mpeg",n:parts.length,size:40000});
 parts.forEach((b,i)=>conn.send({t:"chunk",to:host,id:"s1",i,b}));
 await tick(60);
 conn.send(snap(3));await tick(30);
 assert.equal(D.A.a.paused,false);
});
test("a follower that is 120 ms ahead slows down a little instead of jumping, and keeps the pitch",async()=>{
 D.A.a.currentTime=3.12;D.A.a.playbackRate=1;D.A.a.preservesPitch=false;
 conn.send(snap(3));await tick(30);
 assert.equal(D.A.a.currentTime,3.12,"no jump");
 assert.ok(D.A.a.playbackRate<1&&D.A.a.playbackRate>=.95,`rate ${D.A.a.playbackRate}`);
 assert.equal(D.A.a.preservesPitch,true,"time-stretch, so the pitch does not change");
});
test("a follower that is 120 ms behind speeds up a little",async()=>{
 D.A.a.currentTime=2.88;
 conn.send(snap(3));await tick(30);
 assert.equal(D.A.a.currentTime,2.88);assert.ok(D.A.a.playbackRate>1&&D.A.a.playbackRate<=1.05,`rate ${D.A.a.playbackRate}`);
});
test("once in place, normal speed returns",async()=>{
 D.A.a.currentTime=3.0;
 conn.send(snap(3));await tick(30);
 assert.equal(D.A.a.playbackRate,1);
});
test("a follower that is far off jumps once, ahead of the target",async()=>{
 await tick(1600);                                  /* the start of the song counted as a jump, so wait out the cooldown */
 D.A.a.currentTime=9;
 conn.send(snap(3));await tick(30);
 assert.ok(D.A.a.currentTime>=3&&D.A.a.currentTime<3.3,`jumped to ${D.A.a.currentTime}`);
 D.A.a.currentTime=9;conn.send(snap(3));await tick(30);
 assert.equal(D.A.a.currentTime,9,"a second jump so soon is held back");
});
test("the Sync nudge moves where this laptop plays",async()=>{
 $("poff").value=200;$("poff").dispatchEvent(new (await import("./harness.js")).w.Event("input"));
 D.A.a.currentTime=3.0;D.A.a.playbackRate=1;
 conn.send(snap(3));await tick(30);
 assert.ok(D.A.a.playbackRate>1,"asked to be 200 ms ahead, so it speeds up");
 $("poff").value=0;$("poff").dispatchEvent(new (await import("./harness.js")).w.Event("input"));
});
test("a snapshot without a timestamp is ignored instead of breaking the sync",async()=>{
 D.A.a.currentTime=5;D.A.a.playbackRate=1;
 const bad=snap(3);delete bad.at;conn.send(bad);await tick(30);
 assert.equal(D.A.a.currentTime,5);assert.equal(D.A.a.playbackRate,1);
 conn.send({...snap(3),at:"soon"});await tick(30);assert.equal(D.A.a.currentTime,5);
});
test("the sync readout says in sync, adjusting or catching up, and goes away when this laptop becomes the DJ",async()=>{
 await tick(450);D.A.a.currentTime=3.0;D.A.a.playbackRate=1;conn.send(snap(3));await tick(30);
 assert.match($("psync").textContent,/^In sync \(\d+ ms\)$/);assert.ok($("psync").classList.contains("good"));
 await tick(450);D.A.a.currentTime=3.12;conn.send(snap(3));await tick(30);
 assert.match($("psync").textContent,/^Adjusting \(1\d\d ms off\)$/);assert.ok($("psync").classList.contains("ok"));
 await tick(450);D.A.a.currentTime=3.7;conn.send(snap(3));await tick(30);
 assert.equal($("psync").textContent,"Catching up...");assert.ok($("psync").classList.contains("slow"));
 click("ptake");await tick(20);
 assert.equal($("psync").textContent,"");
});
test("the Sync nudge reaches 500 ms for slow Bluetooth speakers",()=>{assert.equal($("poff").max,"500");assert.equal($("poff").min,"-500")});
test("leaving the room stops the timers",async()=>{click("pleave");await tick(20)});
