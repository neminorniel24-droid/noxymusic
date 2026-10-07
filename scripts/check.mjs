// Project check: every JS file parses, JSON is valid, index.html references exist,
// every module is reachable from js/main.js, and sw.js lists the current files.
import fs from "node:fs";import path from "node:path";import {execFileSync} from "node:child_process";
let bad=0;const fail=(...m)=>{bad++;console.error("FAIL",...m)};
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==="node_modules"||e.name.startsWith(".")?[]:e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name).split(path.sep).join("/")]);
const all=walk(".");
for(const f of all){
 if(/\.m?js$/.test(f)){try{execFileSync(process.execPath,["--check",f],{stdio:"pipe"})}catch(e){fail(f,String(e.stderr).split("\n").slice(0,3).join(" "))}}
 if(/\.(json|webmanifest)$/.test(f)){try{JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){fail(f,e.message)}}
}
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/(?:src|href)="((?:js|css|assets)\/[^"]+)"/g))if(!fs.existsSync(m[1]))fail("index.html references missing file",m[1]);
const seen=new Set();
const visit=f=>{if(seen.has(f)||!fs.existsSync(f))return;seen.add(f);for(const m of fs.readFileSync(f,"utf8").matchAll(/import\s+(?:[^"']*?from\s+)?"(\.[^"]+)"/g))visit(path.posix.normalize(path.posix.join(path.posix.dirname(f),m[1])))};
visit("js/main.js");
for(const f of all.filter(f=>f.startsWith("js/")&&f.endsWith(".js")))if(!seen.has(f))fail("module is never imported:",f);
try{execFileSync(process.execPath,["scripts/build-sw.mjs","--check"],{stdio:"pipe"})}catch(e){fail("sw.js is out of date. Run: npm run build")}
console.log(bad?`${bad} problem(s)`:"All checks passed");
process.exit(bad?1:0);
