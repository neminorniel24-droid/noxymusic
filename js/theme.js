/* NoxyMusic · accent color themes */
import {Q} from "./core.js";
import {store} from "./storage.js";
import {headerTools} from "./ui.js";
const THEMES={Violet:["#8b5cf6","#22d3ee","#f472b6"],Ocean:["#3b82f6","#2dd4bf","#38bdf8"],Sunset:["#f97316","#facc15","#f43f5e"],Mint:["#10b981","#a3e635","#22d3ee"]};
function applyTheme(name){
 const t=THEMES[name]||THEMES.Violet,r=document.documentElement.style;
 r.setProperty("--a",t[0]);r.setProperty("--b",t[1]);r.setProperty("--c",t[2]);
 store.set("theme",name);
 Q("#themes button").forEach(b=>b.classList.toggle("on",b.title===name));
}
(()=>{
 const w=document.createElement("div");w.id="themes";
 Object.entries(THEMES).forEach(([n,c])=>{
  const b=document.createElement("button");b.title=n;b.setAttribute("aria-label",n+" theme");
  b.style.background=`linear-gradient(135deg,${c[0]},${c[2]})`;b.onclick=()=>applyTheme(n);w.append(b);
 });
 headerTools().append(w);applyTheme(store.get("theme")||"Violet");
})();
