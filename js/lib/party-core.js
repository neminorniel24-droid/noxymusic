/* NoxyMusic · party mode rules with no DOM and no network, covered by tests */
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeCode=(rand=Math.random)=>Array.from({length:4},()=>CODE_CHARS[Math.floor(rand()*CODE_CHARS.length)]).join("");
export const cleanCode=s=>String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);

/* Small seeded random generator so every laptop draws the same disco spots from the same seed. */
export function rng(seed){
 let a=seed>>>0;
 return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
}

/* Clock: each ping sample is {rtt, skew}. The sample with the shortest round trip is the most trustworthy. */
export function skewFromPings(samples){
 let best=null;
 for(const s of samples)if(!best||s.rtt<best.rtt)best=s;
 return best?best.skew:0;
}

/* Decide what a following laptop must do so its deck matches the controller's snapshot.
   local: {playing,pos,rate}  snap: {playing,pos,rate,at}  hubNow and snap.at are in ms on the shared clock. */
export function reconcileDeck(local,snap,hubNow,offsetMs=0){
 const out={};
 const target=snap.playing?snap.pos+(hubNow-snap.at)/1000*snap.rate+offsetMs/1000:snap.pos;
 if(snap.playing&&!local.playing)out.play=true;
 if(!snap.playing&&local.playing)out.pause=true;
 const drift=Math.abs(local.pos-target);
 if(snap.playing?drift>.15:drift>.05)out.seek=Math.max(0,target);
 if(Math.abs(local.rate-snap.rate)>.001)out.rate=snap.rate;
 return out;
}

/* Song transfer: split an ArrayBuffer into chunks and put them back together in any order. */
export function splitBuffer(buf,size=32768){
 const out=[];
 for(let i=0;i<buf.byteLength;i+=size)out.push(buf.slice(i,i+size));
 return out;
}
export class Assembler{
 constructor(n){this.n=n;this.parts=new Array(n);this.got=0}
 add(i,buf){
  if(Number.isInteger(i)&&i>=0&&i<this.n&&!this.parts[i]){this.parts[i]=buf;this.got++}
  return this.got===this.n;
 }
 blob(type){return new Blob(this.parts,{type})}
}

/* The room's referee. Exactly one laptop is the controller. Each takeover starts a new epoch,
   and messages from an older epoch or a non-controller are rejected. */
export class Hub{
 constructor(id){this.id=id;this.controller=id;this.epoch=0;this.names=new Map()}
 join(id,name){this.names.set(id,String(name||"Laptop").slice(0,20))}
 leave(id){
  this.names.delete(id);
  if(this.controller!==id)return false;
  this.controller=this.id;this.epoch++;
  return true;
 }
 takeControl(id){
  if(!this.names.has(id))return null;
  if(this.controller!==id){this.controller=id;this.epoch++}
  return{controller:this.controller,epoch:this.epoch};
 }
 accept(id,epoch){return id===this.controller&&epoch===this.epoch}
 roster(){return[...this.names].map(([id,name])=>({id,name}))}
}
