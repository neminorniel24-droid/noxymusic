// Shared test setup: loads the real index.html in jsdom, runs every module with fake audio, camera, MediaPipe and PeerJS.
import fs from "node:fs";import {register} from "node:module";import {JSDOM} from "jsdom";
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
Object.entries({window:w,document:d,MutationObserver:w.MutationObserver,localStorage:w.localStorage,Event:w.Event,Option:w.Option,Audio:FakeAudio,AudioContext:function(){return ac},
 MediaRecorder:Object.assign(class{start(){this.state="recording"}stop(){this.state="inactive";this.onstop&&this.onstop()}},{isTypeSupported:()=>true}),MediaStream:class{constructor(t){this.t=t}},requestAnimationFrame:f=>raf.push(f),innerWidth:1280,innerHeight:720,
 addEventListener:w.addEventListener.bind(w),matchMedia:()=>({matches:false}),confirm:()=>true,location:w.location,
 navigator:{mediaDevices:{getUserMedia:async()=>({getVideoTracks:()=>[{}],getTracks:()=>[]})},clipboard:{writeText:async()=>{}}}}).forEach(([k,v])=>set(k,v));
w.HTMLCanvasElement.prototype.getContext=()=>P();
w.HTMLCanvasElement.prototype.captureStream=()=>({getVideoTracks:()=>[{}]});
w.HTMLMediaElement.prototype.play=async()=>{};
const $=id=>d.getElementById(id),click=id=>$(id).click(),change=(id,v)=>{$(id).value=v;$(id).dispatchEvent(new w.Event("change"))};
await import("../js/main.js");
export {w,d,$,click,change,pump};
