import { registerPageListener } from "../../../../global/js/utils.js";
import { iniChat } from "../../../../shared/chat/js/utils.js";
import {
  endSession,
  joinSession,
} from "../../../../shared/session/js/utils.js";
import {
  endSessionBtn,
  groupLeftSideBarContent,
  initDomVariables,
  joinSessionBtn,
} from "./dom-variables.js";
import {
  getGroupId,
  handleGroupLeftSideBarContent,
  handleShowInfoBtnClick,
  syncMobileDrawerGroupActions,
  handleGroupMenuBtns
} from "./utils.js";

export const init = () => {
  initDomVariables();

  iniChat(getGroupId());

  syncMobileDrawerGroupActions();

  registerPageListener(document, "click", handleShowInfoBtnClick);

  registerPageListener(document, "click", handleGroupMenuBtns);

  joinSessionBtn?.addEventListener("click", (e) =>
    joinSession(e.target.dataset.sessionId, e.target),
  );

  endSessionBtn?.addEventListener("click", (e) =>
    endSession(e.target, e.target.dataset.sessionId),
  );

  groupLeftSideBarContent?.addEventListener(
    "click",
    handleGroupLeftSideBarContent,
  );
};

init();
