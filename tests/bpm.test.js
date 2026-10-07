import test from "node:test";import assert from "node:assert/strict";
import {detectBpm} from "../js/lib/bpm.js";import {buffer,clicks} from "./audio-fixtures.js";
for(const bpm of[100,120,128])test(`detects ${bpm} BPM from a click track`,()=>{
 const got=detectBpm(buffer(20,22050,clicks(bpm)));assert.ok(Math.abs(got-bpm)<=2,`expected about ${bpm}, got ${got}`);
});
test("silence gives 0 instead of a made-up tempo",()=>assert.equal(detectBpm(buffer(5,22050,()=>0)),0));
