// Regenerates the file list and cache name in sw.js. Use --check to only verify.
import fs from "node:fs";import path from "node:path";
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name).split(path.sep).join("/")]);
const files=["./","index.html","manifest.webmanifest",...["css","js","assets"].flatMap(walk).sort()];
const old=fs.readFileSync("sw.js","utf8");
const next=old.replace(/const CACHE="[^"]*";/,`const CACHE="noxymusic-v${pkg.version}";`).replace(/const FILES=\[[^\]]*\];/,`const FILES=${JSON.stringify(files)};`);
if(process.argv.includes("--check")){process.exit(next===old?0:1)}
fs.writeFileSync("sw.js",next);console.log(`sw.js updated: ${files.length} files, cache noxymusic-v${pkg.version}`);
