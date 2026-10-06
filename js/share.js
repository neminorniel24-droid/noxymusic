/* NoxyMusic · share button */
(()=>{
 const b=document.createElement("button");
 b.textContent="Share";
 b.onclick=async()=>{
  const d={title:"NoxyMusic",text:"Make music with your hands in the browser",url:location.href.split("#")[0]};
  try{
   if(navigator.share)await navigator.share(d);
   else{await navigator.clipboard.writeText(d.url);toast("Link copied")}
  }catch{}
 };
 headerTools().append(b);
})();
