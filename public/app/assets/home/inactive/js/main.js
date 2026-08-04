import {
  loadNamespace,
  registerPageListener,
  showMessageBlock,
  t,
} from "../../../global/js/utils.js";
import {
  activeSessions,
  initDomVariables,
  messagesContainer,
} from "./dom-variables.js";
import {
  handleRecentMessageBtns,
  handleSessionBtns,
  initMobileTabs,
  initRecentMessagesLoader,
  initSessionsLoader,
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
