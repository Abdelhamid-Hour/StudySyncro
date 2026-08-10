import {
  loadNamespaces,
  registerPageListener,
  showMessageBlock,
  t,
} from "../../../global/js/utils.mjs";
import { iniChat } from "../../../shared/chat/js/utils.mjs";
import { endSession, leaveSession } from "../../../shared/session/js/utils.mjs";
import { handletTasksListners } from "../../../shared/tasks/js/utils.mjs";
import {
  expandDescriptionBtn,
  initDomVariables,
  sessionActionButtons,
} from "./dom-variables.mjs";
import {
  expandAndShrinkDescription,
  initMobileTabs,
  Session,
  startSession,
} from "./utils.mjs";

export const init = async () => {
  registerPageListener(window, "resize", initMobileTabs);
  await loadNamespaces(["home", "group-chat"]);
  initMobileTabs();
  initDomVariables();

  if (document.cookie.includes("verified=true")) {
    document.cookie = "verified=; Max-Age=-99999999; path=/;";
    showMessageBlock(t("home:alerts.email_verified_success"), "success");
  }

  expandDescriptionBtn.addEventListener("click", expandAndShrinkDescription);

  sessionActionButtons.addEventListener("click", (e) => {
    const endSessionBtn = e.target.closest(".end-session");
    const leaveSessionBtn = e.target.closest(".leave-session");

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
