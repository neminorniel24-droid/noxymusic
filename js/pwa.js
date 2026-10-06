/* NoxyMusic · register the service worker for offline use */
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){
 addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
