/* NoxyMusic · party mode rules with no DOM and no network, covered by tests */
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeCode=(rand=Math.random)=>Array.from({length:4},()=>CODE_CHARS[Math.floor(rand()*CODE_CHARS.length)]).join("");
export const cleanCode=s=>String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);

/* Small seeded random generator so every laptop draws the same disco spots from the same seed. */
export function rng(seed){
 let a=seed>>>0;
 return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
}

/* Clock: each ping sample is {rtt, skew}. The sample with the shortest round trip is the most trustworthy.
   When several samples are almost as fast, their middle value is steadier than any single one. */
export function skewFromPings(samples){
 let best=null;
 for(const s of samples)if(!best||s.rtt<best.rtt)best=s;
 if(!best)return 0;
 const close=samples.filter(s=>s.rtt<=best.rtt*1.5+4).map(s=>s.skew).sort((x,y)=>x-y);
 return close.length>=3?close[Math.floor(close.length/2)]:best.skew;
}

/* How tightly a following laptop tracks the controller. Positions are in seconds.
   - Within `dead` of the target: leave it alone.
   - Small drift: speed up or slow down a little (up to 5%, pitch is kept), which is smooth and cannot click.
   - Big drift (more than `seek`): jump, then wait `cooldown` ms before jumping again, so a slow seek cannot cause a loop.
   - `lead`: seconds to jump past the target, because a seek and a start take a moment. */
export const SYNC={dead:.012,seek:.22,gain:.8,maxNudge:.05,cooldown:1500,lead:.03};
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));

/* Decide what a following laptop must do so its deck matches the controller's snapshot.
   local: {playing,pos,rate,stalled}  snap: {playing,pos,rate,at,ol}  hubNow and snap.at are in ms on the shared clock.
   opts: {offsetMs: the person's Sync nudge, latencyMs: this laptop's own speaker delay}. snap.ol is the controller's speaker delay:
   a laptop whose sound comes out later plays slightly ahead, so every laptop is heard at the same moment.
   mem: a small object per deck that remembers when the last jump happened. */
export function reconcileDeck(local,snap,hubNow,opts={},mem={}){
 const o=typeof opts==="number"?{offsetMs:opts}:(opts||{});
 const out={};
 const lat=Number.isFinite(snap.ol)&&Number.isFinite(o.latencyMs)?o.latencyMs-snap.ol:0;
 const shift=((+o.offsetMs||0)+lat)/1000;
 if(!snap.playing){
  if(local.playing)out.pause=true;
  if(Math.abs(local.pos-snap.pos)>.05)out.seek=Math.max(0,snap.pos);
  if(Math.abs(local.rate-snap.rate)>.0005)out.rate=snap.rate;
  mem.seekAt=undefined;
  return out;
 }
 const target=snap.pos+(hubNow-snap.at)/1000*snap.rate+shift;
 if(!local.playing){
  out.play=true;
  if(Math.abs(local.pos-target)>.03){out.seek=Math.max(0,target+SYNC.lead);mem.seekAt=hubNow;mem.lead=SYNC.lead}
  if(Math.abs(local.rate-snap.rate)>.0005)out.rate=snap.rate;
  return out;
 }
 if(local.stalled)return out;
 const e=local.pos-target;
 out.err=e;                                   /* how far off this deck is right now, in seconds (for the sync readout) */
 let rate=snap.rate;
 if(Math.abs(e)>SYNC.seek&&(mem.seekAt===undefined||hubNow-mem.seekAt>SYNC.cooldown)){
  /* if the last jump was recent and landed off by e, this laptop's jumps take that long: aim further ahead next time */
  const lead=mem.seekAt!==undefined&&mem.lead!==undefined&&hubNow-mem.seekAt<10000?clamp(mem.lead-e,SYNC.lead,1.5):SYNC.lead;
  out.seek=Math.max(0,target+lead);mem.seekAt=hubNow;mem.lead=lead;
 }else if(Math.abs(e)>SYNC.dead){
  rate=snap.rate*(1-clamp(e*SYNC.gain,-SYNC.maxNudge,SYNC.maxNudge));
 }
 if(Math.abs(local.rate-rate)>.0005)out.rate=rate;
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
