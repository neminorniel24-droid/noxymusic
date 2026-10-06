/* NoxyMusic · remember settings between visits */
const SAVE=["inst","key","scale","mode","rev","echo","mv","bpm","bars","trLen","tr"];
const store={
 get(k){try{return localStorage.getItem("noxy:"+k)}catch{return null}},
 set(k,v){try{localStorage.setItem("noxy:"+k,v)}catch{}}
};
