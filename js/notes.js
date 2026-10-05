/* NoxyMusic · scales, note ladder and drawing */
const sc=()=>SCALES[$("scale").value],root=()=>+$("key").value;
const idxFromT=t=>{const n=sc().length*OCT;return Math.min(n-1,Math.max(0,Math.floor((1-t)*n)))};
