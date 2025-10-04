import { expandAndShrinkDescription, Session, startSession } from "./utils.js";
import {
  expandDescriptionBtn,
  initDomVariables,
  sessionActionButtons,
} from "./dom-variables.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";
import { iniChat } from "../../../shared/chat/js/utils.js";
import { throttling } from "../../../../../main_assets/js/utils.js";
import { endSession, leaveSession } from "../../../shared/session/js/utils.js";

export const init = throttling(2000, () => {
  initDomVariables();

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

  startSession();

  iniChat(Session.groupId, Session.id);
});

init();
