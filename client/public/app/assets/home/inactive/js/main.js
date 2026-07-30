import {
  registerPageListener,
  loadNamespace,
  showMessageBlock,
  t,
} from "../../../global/js/utils.js";
import {
  activeSessions,
  messagesContainer,
  initDomVariables,
} from "./dom-variables.js";
import {
  handleSessionBtns,
  handleRecentMessageBtns,
  initSessionsLoader,
  initRecentMessagesLoader,
  initMobileTabs,
} from "./utils.js";

export const init = async () => {
  initDomVariables();
  await loadNamespace("home");

  if (document.cookie.includes("verified=true")) {
    document.cookie = "verified=; Max-Age=-99999999; path=/;";
    showMessageBlock(
      t("home:alerts.email_verified_success"),
      "success",
    );
  }

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
