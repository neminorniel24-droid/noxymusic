/* NoxyMusic · setup, shared state and helpers */
const $=id=>document.getElementById(id),Q=s=>document.querySelectorAll(s);
const SCALES={"Major":[0,2,4,5,7,9,11],"Minor":[0,2,3,5,7,8,10],"Pentatonic (easy)":[0,2,4,7,9],"Minor pentatonic":[0,3,5,7,10],"Blues":[0,3,5,6,7,10]};
const PRE={"Theremin":{t:"sine",c:6000,d:0},"Warm synth":{t:"sawtooth",c:1800,d:8},"Soft pad":{t:"triangle",c:1200,d:12},"Bright lead":{t:"square",c:3500,d:6}};
const FILT={"Natural":"none","Noir":"grayscale(1) contrast(1.25)","Vintage":"sepia(.75) contrast(1.1) saturate(1.2)","Neon":"saturate(2.5) contrast(1.2) hue-rotate(290deg)","Cyber":"hue-rotate(180deg) saturate(2) contrast(1.15)","Dream":"blur(1.5px) brightness(1.15) saturate(1.5)","Warm":"sepia(.35) saturate(1.5) brightness(1.05)","Ice":"hue-rotate(160deg) saturate(.9) brightness(1.1)","Pop":"saturate(3) contrast(1.3)","Glitch":"invert(.9) hue-rotate(90deg)"};
const NAMES="C C# D D# E F F# G G# A A# B".split(" "),OCT=3,BASE=48;
