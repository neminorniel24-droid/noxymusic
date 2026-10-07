import test from "node:test";import assert from "node:assert/strict";
import {detectKey} from "../js/lib/key.js";import {buffer,chord} from "./audio-fixtures.js";
const f=m=>440*Math.pow(2,(m-69)/12);
test("C major chord is detected as C major",()=>{const k=detectKey(buffer(12,22050,chord([f(60),f(64),f(67)])));assert.equal(k.root,0);assert.equal(k.minor,false)});
test("A minor chord is detected as A minor",()=>{const k=detectKey(buffer(12,22050,chord([f(57),f(60),f(64)])));assert.equal(k.root,9);assert.equal(k.minor,true)});
test("G major scale phrase is detected as G major",()=>{
 const notes=[55,57,59,60,62,64,66,67].map(f),k=detectKey(buffer(16,22050,t=>Math.sin(2*Math.PI*notes[Math.floor(t*2)%8]*t)));
 assert.equal(k.root,7);assert.equal(k.minor,false);
});
