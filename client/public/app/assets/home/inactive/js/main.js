import { activeSessions, initDomVariables } from "./dom-variables.js";
import { handleSessionDetailsBtn } from "./utils.js";


export const init = () => {

  initDomVariables();

  activeSessions.addEventListener('click', handleSessionDetailsBtn);

};


init()