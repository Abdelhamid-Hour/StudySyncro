import { expandAndShrinkDescription, Session, startSession } from "./utils.js";
import { expandDescriptionBtn, initDomVariables, sesssionActionButtons } from "./dom-variables.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";
import { iniChatMessageInput } from "../../../shared/chat/js/utils.js";

export const init = () => {
  initDomVariables();

  expandDescriptionBtn.addEventListener("click", expandAndShrinkDescription);

  sesssionActionButtons.addEventListener("click", (e) => {
    const endSessionBtn = e.target.closest(".end-session-btn");
    const leaveSessionBtn = e.target.closest(".leave-session-btn");

    if (endSessionBtn) {
      Session.endSession(endSessionBtn);
    } else if (leaveSessionBtn) {
      Session.leaveSession(leaveSessionBtn);
    }
  })

  handletTasksListners("completed-tasks", "ongoing-tasks");

  iniChatMessageInput();
  
  startSession();
};

init();
