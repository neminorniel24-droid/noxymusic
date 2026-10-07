/* NoxyMusic · pure music helpers (no DOM), covered by tests */
export const SCALES={"Major":[0,2,4,5,7,9,11],"Minor":[0,2,3,5,7,8,10],"Pentatonic (easy)":[0,2,4,7,9],"Minor pentatonic":[0,3,5,7,10],"Blues":[0,3,5,6,7,10]};
export const NAMES="C C# D D# E F F# G G# A A# B".split(" "),OCT=3,BASE=48;
export const hz=m=>440*Math.pow(2,(m-69)/12);
export const nm=m=>NAMES[m%12]+(Math.floor(m/12)-1);
export const idxAt=(t,n)=>Math.min(n-1,Math.max(0,Math.floor((1-t)*n)));
export const midiAt=(scale,key,i,base=BASE)=>base+key+Math.floor(i/scale.length)*12+scale[i%scale.length];
