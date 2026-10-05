/* NoxyMusic · face characters */
const CH=[["🐟","Fish"],["🐴","Horse"],["🎸","Guitar"],["🐵","Monkey"],["🐸","Frog"],["🐶","Dog"],["🐱","Cat"],["🦄","Unicorn"],["🐷","Pig"],["🐮","Cow"],["🐔","Chicken"],["🐧","Penguin"],["🦁","Lion"],["🐯","Tiger"],["🐻","Bear"],["🐼","Panda"],["🐙","Octopus"],["🦈","Shark"],["🐳","Whale"],["🦆","Duck"],["🦉","Owl"],["🦖","T-Rex"],["🐲","Dragon"],["👽","Alien"],["🤖","Robot"],["👻","Ghost"],["💀","Skull"],["🤡","Clown"],["🎃","Pumpkin"],["🥸","Disguise"],["🤠","Cowboy"],["🧛","Vampire"],["🧟","Zombie"],["🧙","Wizard"],["🧜","Mermaid"],["🥷","Ninja"],["😈","Devil"],["😇","Angel"],["🤩","Star-struck"],["😎","Cool"],["🥶","Freezing"],["🤯","Mind blown"],["💩","Poop"],["🍕","Pizza"],["🍌","Banana"],["🥑","Avocado"],["🎹","Piano"],["🥁","Drum"],["🎺","Trumpet"],["🪩","Disco ball"]];
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
$("chars").innerHTML='<button class="on" data-c="" title="No character">🚫</button>'+CH.map(([e,n])=>`<button data-c="${e}" title="${n}">${e}</button>`).join("");
$("chars").onclick=async e=>{const b=e.target.closest("button");if(!b)return;ch=b.dataset.c;Q("#chars button").forEach(x=>x.classList.toggle("on",x===b));const m=$("fmsg");
 if(ch&&!fl){m.textContent="Loading face tracker…";try{const fs=await MP.FilesetResolver.forVisionTasks(WASM);
  fl=await MP.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"},runningMode:"VIDEO",numFaces:1});m.textContent=""}
  catch(er){m.textContent="Couldn't load the face tracker: "+er.message}}
 if(ch&&!running)m.textContent="Start the camera on the Play tab to see it."};
