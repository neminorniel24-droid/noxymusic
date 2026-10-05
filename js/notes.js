/* NoxyMusic · scales, note ladder and drawing */
const sc=()=>SCALES[$("scale").value],root=()=>+$("key").value;
const idxFromT=t=>{const n=sc().length*OCT;return Math.min(n-1,Math.max(0,Math.floor((1-t)*n)))};
const midi=i=>{const s=sc();return BASE+root()+Math.floor(i/s.length)*12+s[i%s.length]};
const hz=m=>440*Math.pow(2,(m-69)/12),nm=m=>NAMES[m%12]+(Math.floor(m/12)-1),norm=y=>Math.min(1,Math.max(0,(y-.12)/.76));
function ladder(cur){const s=sc(),n=s.length*OCT,W=cv.width,H=cv.height,top=H*.12,band=H*.76/n;ctx.textAlign="right";ctx.font=`${Math.max(10,Math.min(15,band*.6))}px Outfit,sans-serif`;
 for(let i=0;i<n;i++){const y=top+(n-1-i)*band;ctx.fillStyle=i===cur?"rgba(139,92,246,.65)":i%s.length===0?"rgba(255,255,255,.13)":i%2?"rgba(255,255,255,.03)":"rgba(255,255,255,.06)";ctx.fillRect(0,y,W,band-1);ctx.fillStyle=i===cur?"#fff":"rgba(255,255,255,.55)";ctx.fillText(nm(midi(i)),W-10,y+band/2+4)}}
