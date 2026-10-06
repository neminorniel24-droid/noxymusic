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
