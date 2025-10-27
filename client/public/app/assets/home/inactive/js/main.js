import { activeSessions, initDomVariables } from "./dom-variables.js";
import { handleSessionBtns, initSessionsLoader } from "./utils.js";

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }

  initDomVariables();

  activeSessions.addEventListener("click", handleSessionBtns);

  initSessionsLoader();
};

init();
