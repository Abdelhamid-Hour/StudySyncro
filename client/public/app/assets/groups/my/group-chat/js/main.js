import {
  loadNamespace,
  registerPageListener,
  t,
} from "../../../../global/js/utils.js";
import { iniChat } from "../../../../shared/chat/js/utils.js";
import {
  endSession,
  joinSession,
  leaveSession,
} from "../../../../shared/session/js/utils.js";
import {
  endSessionBtn,
  groupLeftSideBarContent,
  initDomVariables,
  joinSessionBtn,
  leaveSessionBtn,
} from "./dom-variables.js";
import {
  getGroupId,
  handleGroupLeftSideBarContent,
  handleShowInfoBtnClick,
  syncMobileDrawerGroupActions,
  handleGroupMenuBtns,
  handleLeaveSessionBtn,
  handleEndSessionBtn,
} from "./utils.js";

export const init = async () => {
  initDomVariables();
  await loadNamespace("group-chat");

  iniChat(getGroupId());

  syncMobileDrawerGroupActions();

  registerPageListener(document, "click", handleShowInfoBtnClick);

  registerPageListener(document, "click", handleGroupMenuBtns);

  groupLeftSideBarContent?.addEventListener(
    "click",
    handleGroupLeftSideBarContent,
  );
};

init();
