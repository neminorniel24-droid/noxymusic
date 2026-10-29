// Sync quality on a simulated bad network: messages arrive late, out of order or not at all, the audio element starts and seeks slowly,
// and the clock estimate is a little off. The follower must stay within a few hundredths of a second of the controller.
import test from "node:test";import assert from "node:assert/strict";
import {SYNC,reconcileDeck,rng} from "../js/lib/party-core.js";

/* what the code did before: jump when more than 0.15 s away, otherwise leave the position alone */
const legacy=(local,snap,hubNow)=>{
 const out={},target=snap.playing?snap.pos+(hubNow-snap.at)/1000*snap.rate:snap.pos;
 if(snap.playing&&!local.playing)out.play=true;
 if(snap.playing?Math.abs(local.pos-target)>.15:Math.abs(local.pos-target)>.05)out.seek=Math.max(0,target);
 if(Math.abs(local.rate-snap.rate)>.001)out.rate=snap.rate;
 return out;
};

function simulate(decide,{seconds=60,seed=1,delay=[30,200],spike=.02,loss=.1,clockErr=0,jitter=3,startOff=0,stallAt=-1,startLag=80,seekStall=40,seekErr=15,every=125,latency=0,snapOl,drift=.0002}={}){
 const r=rng(seed),U=(a,b)=>a+(b-a)*r();
 const ctl=t=>10+t/1000;                                     /* where the controller is at true time t (ms) */
 const el={playing:false,pos:10+startOff,rate:1,lag:0,stall:0,seeks:0,seekLog:[]},mem={};
 const inbox=[];let nextSnap=0,errs=[];
 const STEP=5;
 for(let t=0;t<seconds*1000;t+=STEP){
  while(nextSnap<=t){
   if(r()>=loss){const d=r()<spike?U(400,900):U(delay[0],delay[1]);inbox.push({arrive:nextSnap+d,snap:{playing:true,pos:ctl(nextSnap),rate:1,at:nextSnap,ol:snapOl}})}
   nextSnap+=every;
  }
  inbox.sort((a,b)=>a.arrive-b.arrive);
  while(inbox.length&&inbox[0].arrive<=t){
   const {snap}=inbox.shift(),hubNow=t+clockErr+U(-jitter,jitter);
   const a=decide({playing:el.playing,pos:el.pos+U(-.002,.002),rate:el.rate,stalled:false},snap,hubNow,{offsetMs:0,latencyMs:latency},mem);
   if(a.seek!==undefined){el.pos=a.seek+U(-seekErr,seekErr)/1000;el.stall=seekStall;el.seeks++;el.seekLog.push(t)}
   if(a.rate)el.rate=Math.min(4,Math.max(.25,Math.round(a.rate*1000)/1000));
   if(a.play&&!el.playing){el.playing=true;el.lag=startLag}
  }
  if(t===stallAt*1000)el.stall=400;
  if(el.playing){
   if(el.lag>0)el.lag-=STEP;else if(el.stall>0)el.stall-=STEP;else el.pos+=STEP/1000*el.rate*(1+drift);
  }
  errs.push({t,e:(el.pos-ctl(t))*1000,rate:el.rate});
 }
 return{errs,el};
}
const after=(errs,from)=>errs.filter(x=>x.t>=from*1000);
const max=a=>Math.max(...a.map(x=>Math.abs(x.e)));
const pct=(a,p)=>{const s=a.map(x=>Math.abs(x.e)).sort((x,y)=>x-y);return s[Math.floor(s.length*p)]};

test("steady playing on a bad network stays within 40 ms, and never jumps once settled",()=>{
 for(const seed of[1,2,3,4,5]){
  const {errs,el}=simulate(reconcileDeck,{seed});
  const s=after(errs,6);
  assert.ok(max(s)<40,`seed ${seed}: worst error ${max(s).toFixed(1)} ms`);
  assert.ok(pct(s,.95)<22,`seed ${seed}: p95 ${pct(s,.95).toFixed(1)} ms`);
  assert.equal(el.seekLog.filter(t=>t>6000).length,0,`seed ${seed}: it jumped after settling`);
  assert.ok(s.every(x=>x.rate>=.949&&x.rate<=1.051),"the speed change must stay within 5%");
 }
});
test("the new loop is much tighter than the old one",()=>{
 let newWorst=0,oldWorst=0,newP=0,oldP=0;
 for(const seed of[1,2,3,4,5]){
  const n=after(simulate(reconcileDeck,{seed}).errs,6),o=after(simulate(legacy,{seed}).errs,6);
  newWorst=Math.max(newWorst,max(n));oldWorst=Math.max(oldWorst,max(o));newP=Math.max(newP,pct(n,.95));oldP=Math.max(oldP,pct(o,.95));
 }
 console.log(`# worst error: old ${oldWorst.toFixed(0)} ms, new ${newWorst.toFixed(0)} ms. 95% of the time: old ${oldP.toFixed(0)} ms, new ${newP.toFixed(0)} ms`);
 assert.ok(newWorst*2<oldWorst,`new ${newWorst} vs old ${oldWorst}`);
});
test("a laptop that joins 2.3 seconds off catches up with one jump and then stays tight",()=>{
 const {errs,el}=simulate(reconcileDeck,{startOff:2.3,seed:7});
 assert.ok(el.seeks>=1&&el.seeks<=2,`jumps: ${el.seeks}`);
 assert.ok(max(after(errs,6))<40);
});
test("laptop audio clocks that run a little fast or slow (300 ppm both ways) are followed without jumping",()=>{
 for(const drift of[.0003,-.0003]){
  const {errs,el}=simulate(reconcileDeck,{drift,seed:6,seconds:120});
  assert.ok(max(after(errs,6))<40,`drift ${drift}: worst ${max(after(errs,6)).toFixed(1)} ms`);
  assert.equal(el.seekLog.filter(t=>t>6000).length,0);
 }
 const old=after(simulate(legacy,{drift:.0003,seed:6,seconds:120}).errs,6);
 assert.ok(max(old)>100,"the old loop lets the drift build up until it jumps");
});
test("a third of the messages lost still stays tight",()=>{
 const {errs}=simulate(reconcileDeck,{loss:.33,seed:9});
 assert.ok(max(after(errs,8))<60,`worst ${max(after(errs,8)).toFixed(1)}`);
});
test("a stalled tab (400 ms frozen) recovers with at most one jump and no ping-pong",()=>{
 const {errs,el}=simulate(reconcileDeck,{stallAt:20,seed:3});
 assert.ok(el.seekLog.filter(t=>t>20000).length<=1,`jumps after the stall: ${el.seekLog.filter(t=>t>20000).length}`);
 assert.ok(max(after(errs,30))<40);
});
test("slow seeking audio cannot cause a jump loop: the loop learns how long a jump takes",()=>{
 const {el,errs}=simulate(reconcileDeck,{startOff:3,seekStall:900,seekErr:120,seed:4,seconds:40});
 const jumps=el.seekLog.length;
 assert.ok(jumps<=4,`jumps: ${jumps}`);
 for(let i=1;i<el.seekLog.length;i++)assert.ok(el.seekLog[i]-el.seekLog[i-1]>=SYNC.cooldown-300,"jumps are spaced by the cooldown");
 assert.ok(max(after(errs,25))<80);
});
test("an uncertain clock estimate shows up as the same small error, not a bigger one",()=>{
 const {errs}=simulate(reconcileDeck,{clockErr:25,seed:2});
 const m=after(errs,6).reduce((s,x)=>s+x.e,0)/after(errs,6).length;
 assert.ok(Math.abs(Math.abs(m)-25)<8,`mean error ${m.toFixed(1)} ms for a 25 ms clock error`);
});
test("a laptop whose speakers are slower plays ahead by the difference, so the sound is heard together",()=>{
 const {errs}=simulate(reconcileDeck,{latency:120,snapOl:20,seed:5});
 const m=after(errs,6).reduce((s,x)=>s+x.e,0)/after(errs,6).length;
 assert.ok(Math.abs(m-100)<12,`mean media position error ${m.toFixed(1)} ms, expected about +100`);
});
