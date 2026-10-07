// Test-only loader: replaces the MediaPipe CDN import with a local stub.
export async function resolve(specifier,context,next){
 if(specifier.startsWith("https://"))return{url:new URL("./stubs/mediapipe.js",import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
