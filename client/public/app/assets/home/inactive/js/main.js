import { activeSessions, initDomVariables } from "./dom-variables.js";
import { handleSessionBtns, initSessionsLoader } from "./utils.js";

export const init = (virtual = false) => {
  initDomVariables();

  if (activeSessions) {
    activeSessions.addEventListener("click", handleSessionBtns);
  }

  initSessionsLoader();
};

init();
