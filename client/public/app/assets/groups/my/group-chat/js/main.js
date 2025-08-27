import { showMessageBlock } from "../../../../../../main_assets/js/utils.js";
import { openOverlayModal } from "../../../../global/js/utils.js";
import { iniChatMessageInput } from "../../../../shared/chat/js/utils.js";
import {
  endSession,
  joinSession,
} from "../../../../shared/session/js/utils.js";
import { handletTasksListners } from "../../../../shared/tasks/js/utils.js";
import {
  addMembersMenuBtn,
  copyUIDMenuBtn,
  createSessionBtn,
  endSessionBtn,
  groupInfoMenuBtn,
  groupLeftSideBarContent,
  initDomVariables,
  joinSessionBtn,
  leaveGroupMenuBtn,
  manageDemanesMenuBtn,
  membersListMenuBtn,
  quizzesListMenuBtn,
  removeGroupMenuBtn,
  sessionInfoMenuBtn,
  showInfoBtn,
} from "./dom-variables.js";
import {
  handleAddMembersBtn,
  handleGroupInfo,
  handleGroupLeftSideBarContent,
  handleLeavingGroup,
  handleMembersListMenuBtn,
  handleQuizzesListMenuBtn,
  handleRemoveGroup,
  handleSessionCreateClick,
  handleSessionInfoMenuBtn,
  handleShowInfoBtnClick,
  setUpDemandes,
} from "./utils.js";

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  iniChatMessageInput();

  showInfoBtn.addEventListener("click", handleShowInfoBtnClick);

  groupInfoMenuBtn.addEventListener("click", handleGroupInfo);

  quizzesListMenuBtn.addEventListener("click", handleQuizzesListMenuBtn);

  membersListMenuBtn.addEventListener("click", handleMembersListMenuBtn);

  sessionInfoMenuBtn?.addEventListener("click", handleSessionInfoMenuBtn);

  manageDemanesMenuBtn?.addEventListener("click", setUpDemandes);

  addMembersMenuBtn?.addEventListener("click", handleAddMembersBtn);

  leaveGroupMenuBtn?.addEventListener("click", handleLeavingGroup);

  createSessionBtn?.addEventListener("click", handleSessionCreateClick);

  removeGroupMenuBtn?.addEventListener("click", handleRemoveGroup);

  joinSessionBtn?.addEventListener("click", (e) =>
    joinSession(e.target.dataset.sessionId, e.target)
  );

  endSessionBtn?.addEventListener("click", (e) =>
    endSession(e.target, e.target.dataset.sessionId)
  );

  groupLeftSideBarContent.addEventListener(
    "click",
    handleGroupLeftSideBarContent
  );
};

init();
