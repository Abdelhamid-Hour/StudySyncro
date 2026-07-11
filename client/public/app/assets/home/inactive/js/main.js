import { activeSessions, messagesContainer, initDomVariables } from "./dom-variables.js";
import {
  handleSessionBtns,
  handleRecentMessageBtns,
  initSessionsLoader,
  initRecentMessagesLoader,
  initMobileInactiveTabs,
} from "./utils.js";

export const init = (virtual = false) => {
  initDomVariables();

  if (activeSessions) {
    activeSessions.addEventListener("click", handleSessionBtns);
  }

  if (messagesContainer) {
    messagesContainer.addEventListener("click", handleRecentMessageBtns);
  }

  initSessionsLoader();
  initRecentMessagesLoader();
  initMobileInactiveTabs(true);
};

window.addEventListener("resize", () => initMobileInactiveTabs(false));

init();
