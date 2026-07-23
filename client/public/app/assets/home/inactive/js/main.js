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

  const urlParams = new URLSearchParams(window.location.search);
  const oobCode = urlParams.get("oobCode");
  const mode = urlParams.get("mode");
  if (mode === "verifyEmail" && oobCode) {
    const shownKey = "verified_shown_" + oobCode;
    if (!sessionStorage.getItem(shownKey)) {
      sessionStorage.setItem(shownKey, "true");
      showMessageBlock(
        t("home:alerts.email_verified_success"),
        "success",
      );
    }
    window.history.replaceState({}, document.title, window.location.pathname);
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
