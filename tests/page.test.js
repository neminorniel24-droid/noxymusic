// Clicks through the whole app (tabs, effects, camera, lights, looper, faces, recording) using the shared harness.
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {d,$,click,change,pump} from "./harness.js";
const root=new URL("../",import.meta.url);
test("every element id the code looks up exists in index.html",()=>{
 const dynamic=new Set(["toast","lights","exitLights","help","helpClose","hdrTools","themes","mvp"]),missing=[];
 for(const f of fs.readdirSync(new URL("js/",root),{recursive:true}).filter(f=>f.endsWith(".js")))
  for(const m of fs.readFileSync(new URL("js/"+f,root),"utf8").matchAll(/\$\("([\w-]+)"\)/g))if(!dynamic.has(m[1])&&!$(m[1]))missing.push(`${f}: #${m[1]}`);
 assert.deepEqual([...new Set(missing)],[]);
});
test("tabs switch panes",()=>{for(const t of["play","dj","studio","faces","rec","party"]){const b=d.querySelector(`#tabs button[data-t="${t}"]`);if(!b)continue;b.click();assert.equal($("p-"+(t==="rec"?"rec":t)).hidden,false)}});
test("DJ tab has decks, turntables, EQ, lights and effects",()=>{for(const id of["plA","plB","fileA","fileB","eqA0","eqB2","lmode","lonly","goT","syncB"])assert.ok($(id),id)});
test("master volume goes to 200%",()=>assert.equal($("mv").max,"2"));
test("sound effect pads work without errors",()=>{for(const b of d.querySelectorAll("[data-fx]"))b.click()});
test("camera starts and the app loop runs",async()=>{click("go");for(let i=0;i<20;i++)await new Promise(r=>setTimeout(r,0));assert.equal($("intro").hidden,true);pump(30)});
test("light show modes run",()=>{for(const m of["show","flashes","beams","disco","laser","pulse","strobe","off"]){change("lmode",m);pump(60)}click("lonly");pump(30);click("lonly")});
test("looper records and clears",()=>{click("lrec");pump(30);click("lclr")});
test("face characters can be selected",async()=>{d.querySelector("#chars button[data-c]").click();for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));pump(10)});
test("recording starts and stops",async()=>{click("rec");for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));pump(5);click("rec");assert.ok($("result").innerHTML.includes("Download"))});
