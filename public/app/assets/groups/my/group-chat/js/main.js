import {
  loadNamespace,
  registerPageListener,
} from "../../../../global/js/utils.js";
import { iniChat } from "../../../../shared/chat/js/utils.js";
import { groupLeftSideBarContent, initDomVariables } from "./dom-variables.js";
import {
  getGroupId,
  handleGroupBtns,
  handleGroupLeftSideBarContent,
  handleShowInfoBtnClick,
  syncMobileDrawerGroupActions,
} from "./utils.js";

export const init = async () => {
  initDomVariables();
  await loadNamespace("group-chat");

  iniChat(getGroupId());

  syncMobileDrawerGroupActions();

  registerPageListener(document, "click", handleShowInfoBtnClick);

  registerPageListener(document, "click", handleGroupBtns);

  groupLeftSideBarContent?.addEventListener(
    "click",
    handleGroupLeftSideBarContent,
  );
};

init();
