import { activeSessions, initDomVariables } from "./dom-variables.js";
import { handleSessionDetailsBtn } from "./utils.js";


let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }

  initDomVariables();
console.log("Active Module start: inactive.js"); 
  activeSessions.addEventListener('click', handleSessionDetailsBtn);

};


init()