import test from "node:test";import assert from "node:assert/strict";
import {hz,nm,idxAt,midiAt,SCALES} from "../js/lib/music.js";
test("A4 is 440 Hz and an octave doubles it",()=>{assert.equal(hz(69),440);assert.ok(Math.abs(hz(81)-880)<1e-9)});
test("note names include the octave",()=>{assert.equal(nm(60),"C4");assert.equal(nm(69),"A4");assert.equal(nm(61),"C#4")});
test("hand height maps to the full range of notes",()=>{assert.equal(idxAt(0,15),14);assert.equal(idxAt(1,15),0);assert.equal(idxAt(.5,15),7);assert.equal(idxAt(-1,15),14);assert.equal(idxAt(2,15),0)});
test("major scale walks up the expected notes",()=>{assert.deepEqual([0,1,2,3,4,5,6,7].map(i=>midiAt(SCALES.Major,0,i)),[48,50,52,53,55,57,59,60])});
test("every generated note belongs to the chosen scale and key",()=>{
 for(const [name,s] of Object.entries(SCALES))for(const root of[0,3,7,11])for(let i=0;i<s.length*3;i++){
  const pc=(midiAt(s,root,i)-root)%12;assert.ok(s.includes(pc),`${name} root ${root} index ${i}`);
 }});
