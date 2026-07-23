import {
  registerPageListener,
  loadNamespaces,
  showMessageBlock,
  t,
} from "../../../global/js/utils.js";
import {
  expandAndShrinkDescription,
  initMobileTabs,
  Session,
  startSession,
} from "./utils.js";
import {
  expandDescriptionBtn,
  initDomVariables,
  sessionActionButtons,
} from "./dom-variables.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";
import { iniChat } from "../../../shared/chat/js/utils.js";
import { endSession, leaveSession } from "../../../shared/session/js/utils.js";

export const init = async () => {
  await loadNamespaces(["home", "group-chat"]);
  initMobileTabs();
  initDomVariables();

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

  expandDescriptionBtn.addEventListener("click", expandAndShrinkDescription);

  sessionActionButtons.addEventListener("click", (e) => {
    const endSessionBtn = e.target.closest(".end-session-btn");
    const leaveSessionBtn = e.target.closest(".leave-session-btn");

    if (endSessionBtn) {
      endSession(endSessionBtn, Session.id);
    } else if (leaveSessionBtn) {
      leaveSession(leaveSessionBtn, Session.id);
    }
  });

  handletTasksListners("completed-tasks", "ongoing-tasks");

  await startSession();

  iniChat(Session.groupId, Session.id);
};

registerPageListener(window, "resize", initMobileTabs);

init();
