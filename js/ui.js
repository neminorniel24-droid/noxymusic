/* NoxyMusic · toast messages and header tools */
import {$} from "./core.js";
export function toast(text,ms=2600){
 let t=$("toast");
 if(!t){t=document.createElement("div");t.id="toast";t.setAttribute("role","status");document.body.append(t)}
 t.textContent=text;t.classList.add("show");
 clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("show"),ms);
}
export function headerTools(){
 let h=$("hdrTools");
 if(!h){h=document.createElement("div");h.id="hdrTools";document.querySelector("header").append(h)}
 return h;
}
