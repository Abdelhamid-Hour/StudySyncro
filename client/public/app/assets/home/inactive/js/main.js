import { registerPageListener } from "../../../global/js/utils.js";
import { activeSessions, messagesContainer, initDomVariables } from "./dom-variables.js";
import {
  handleSessionBtns,
  handleRecentMessageBtns,
  initSessionsLoader,
  initRecentMessagesLoader,
  initMobileTabs,
} from "./utils.js";

export const init = () => {
  initDomVariables();

  if (activeSessions) {
    activeSessions.addEventListener("click", handleSessionBtns);
  }

  if (messagesContainer) {
    messagesContainer.addEventListener("click", handleRecentMessageBtns);
  }

  initSessionsLoader();
  initRecentMessagesLoader();
  initMobileTabs();
};

registerPageListener(window, "resize", initMobileTabs);

init();
