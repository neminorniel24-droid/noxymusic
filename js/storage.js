/* NoxyMusic · remember settings between visits */
import {$} from "./core.js";
const SAVE=["inst","key","scale","mode","rev","echo","mv","bpm","bars","trLen","tr"];
export const store={
 get(k){try{return localStorage.getItem("noxy:"+k)}catch{return null}},
 set(k,v){try{localStorage.setItem("noxy:"+k,v)}catch{}}
};
SAVE.forEach(id=>{
 const e=$(id),v=store.get(id);
 if(!e)return;
 if(v!==null){e.value=v;if(e.value!==v)e.value=e.defaultValue||e.options?.[0]?.value||"";e.dispatchEvent(new Event("input"));e.dispatchEvent(new Event("change"))}
 const save=()=>store.set(id,e.value);
 e.addEventListener("input",save);e.addEventListener("change",save);
});
