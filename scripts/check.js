// Parses every JS file and JSON file and confirms index.html references exist.
const fs=require("fs"),path=require("path"),vm=require("vm");
let bad=0;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==="node_modules"||e.name.startsWith(".")?[]:e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const f of walk(".")){
 try{
  if(f.endsWith(".js")&&!f.endsWith("mediapipe.js"))new vm.Script(fs.readFileSync(f,"utf8"),{filename:f});
  if(f.endsWith(".webmanifest")||f.endsWith(".json"))JSON.parse(fs.readFileSync(f,"utf8"));
 }catch(e){bad++;console.error("FAIL",f,e.message)}
}
const html=fs.readFileSync("index.html","utf8");
for(const m of html.matchAll(/(?:src|href)="((?:js|css|assets)\/[^"]+)"/g))if(!fs.existsSync(m[1])){bad++;console.error("MISSING",m[1])}
console.log(bad?`${bad} problem(s)`:"All checks passed");
process.exit(bad?1:0);
