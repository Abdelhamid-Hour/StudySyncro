import {
  loadNamespace,
  registerPageListener,
} from "../../../../global/js/utils.mjs";
import { iniChat } from "../../../../shared/chat/js/utils.mjs";
import { groupLeftSideBarContent, initDomVariables } from "./dom-variables.mjs";
import {
  getGroupId,
  handleGroupBtns,
  handleGroupLeftSideBarContent,
  handleShowInfoBtnClick,
  syncMobileDrawerGroupActions,
} from "./utils.mjs";

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
