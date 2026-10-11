// Test-only loader: replaces CDN imports with local stubs.
export async function resolve(specifier,context,next){
 if(specifier.startsWith("https://")){
  const stub=specifier.includes("peerjs")?"./stubs/peerjs.js":"./stubs/mediapipe.js";
  return{url:new URL(stub,import.meta.url).href,shortCircuit:true};
 }
 return next(specifier,context);
}
