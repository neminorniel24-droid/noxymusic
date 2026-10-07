// Loads the real index.html in jsdom, runs every module, and clicks through the app with fake audio, camera and MediaPipe.
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";import {register} from "node:module";import {JSDOM} from "jsdom";
register("./loader.mjs",import.meta.url);
const root=new URL("../",import.meta.url);
const html=fs.readFileSync(new URL("index.html",root),"utf8").replace(/<script[^>]*><\/script>/g,"").replace(/<link[^>]*>/g,"");
const dom=new JSDOM(html,{url:"http://localhost/"}),w=dom.window,d=w.document;
const P=(b={})=>{const t=Object.assign(function(){},b);return new Proxy(t,{get(t,p){if(p==="then"||typeof p==="symbol")return undefined;if(p in t)return t[p];return t[p]=P()},set(t,p,v){t[p]=v;return true},apply(){return P()}})};
const ac=P({sampleRate:48000,currentTime:0,state:"running",destination:P(),createMediaStreamDestination:()=>P({stream:{getAudioTracks:()=>[{}]}}),decodeAudioData:async()=>({getChannelData:()=>new Float32Array(48000),sampleRate:48000})});
const raf=[];let now=0;
const pump=n=>{for(let i=0;i<n;i++){now+=16.7;raf.splice(0).forEach(f=>f(now))}};
const set=(k,v)=>Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
function FakeAudio(){return Object.assign(new w.EventTarget(),{src:"",paused:true,currentTime:0,duration:0,loop:false,playbackRate:1,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}})}
Object.entries({window:w,document:d,localStorage:w.localStorage,Event:w.Event,Option:w.Option,Audio:FakeAudio,AudioContext:function(){return ac},
 MediaRecorder:Object.assign(class{start(){this.state="recording"}stop(){this.state="inactive";this.onstop&&this.onstop()}},{isTypeSupported:()=>true}),MediaStream:class{constructor(t){this.t=t}},requestAnimationFrame:f=>raf.push(f),innerWidth:1280,innerHeight:720,
 addEventListener:w.addEventListener.bind(w),matchMedia:()=>({matches:false}),confirm:()=>true,location:w.location,
 navigator:{mediaDevices:{getUserMedia:async()=>({getVideoTracks:()=>[{}],getTracks:()=>[]})},clipboard:{writeText:async()=>{}}}}).forEach(([k,v])=>set(k,v));
w.HTMLCanvasElement.prototype.getContext=()=>P();
w.HTMLCanvasElement.prototype.captureStream=()=>({getVideoTracks:()=>[{}]});
w.HTMLMediaElement.prototype.play=async()=>{};
const $=id=>d.getElementById(id),click=id=>$(id).click(),change=(id,v)=>{$(id).value=v;$(id).dispatchEvent(new w.Event("change"))};
await import("../js/main.js");

test("every element id the code looks up exists in index.html",()=>{
 const dynamic=new Set(["toast","lights","exitLights","help","helpClose","hdrTools","themes","mvp"]),missing=[];
 for(const f of fs.readdirSync(new URL("js/",root),{recursive:true}).filter(f=>f.endsWith(".js")))
  for(const m of fs.readFileSync(new URL("js/"+f,root),"utf8").matchAll(/\$\("([\w-]+)"\)/g))if(!dynamic.has(m[1])&&!$(m[1]))missing.push(`${f}: #${m[1]}`);
 assert.deepEqual([...new Set(missing)],[]);
});
test("tabs switch panes",()=>{for(const t of["play","dj","studio","faces","rec"]){const b=d.querySelector(`#tabs button[data-t="${t}"]`);if(!b)continue;b.click();assert.equal($("p-"+(t==="rec"?"rec":t)).hidden,false)}});
test("DJ tab has decks, turntables, EQ, lights and effects",()=>{for(const id of["plA","plB","fileA","fileB","eqA0","eqB2","lmode","lonly","goT","syncB"])assert.ok($(id),id)});
test("master volume goes to 200%",()=>assert.equal($("mv").max,"2"));
test("sound effect pads work without errors",()=>{for(const b of d.querySelectorAll("[data-fx]"))b.click()});
test("camera starts and the app loop runs",async()=>{click("go");for(let i=0;i<20;i++)await new Promise(r=>setTimeout(r,0));assert.equal($("intro").hidden,true);pump(30)});
test("light show modes run",()=>{for(const m of["show","flashes","beams","disco","laser","pulse","strobe","off"]){change("lmode",m);pump(60)}click("lonly");pump(30);click("lonly")});
test("looper records and clears",()=>{click("lrec");pump(30);click("lclr")});
test("face characters can be selected",async()=>{d.querySelector("#chars button[data-c]").click();for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));pump(10)});
test("recording starts and stops",async()=>{click("rec");for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));pump(5);click("rec");assert.ok($("result").innerHTML.includes("Download"))});
