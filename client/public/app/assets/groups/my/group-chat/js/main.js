import { loadNamespace, registerPageListener, t } from "../../../../global/js/utils.js";
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

export const init = async () => {
  initDomVariables();
  await loadNamespace("group-chat");

  iniChat(getGroupId());

  syncMobileDrawerGroupActions();

  registerPageListener(document, "click", handleShowInfoBtnClick);

  registerPageListener(document, "click", handleGroupMenuBtns);

  joinSessionBtn?.addEventListener("click", (e) =>
    joinSession(e.target.dataset.sessionId, e.target),
  );

  endSessionBtn?.addEventListener("click", (e) => {
    const btn = e.target.closest(".end-session") || e.target;
    endSession(btn, btn.dataset.sessionId, () => {
      btn.outerHTML = `
      <button type="button" class="small-btn create-session-btn">
        <i class="bi bi-plus-circle"></i>
        <span>${t("group-chat:create_session")}</span>
      </button>`;
      document.querySelector(".session-active-badge")?.remove();
      document.querySelector(".session-info-menu-btn")?.remove();
    });
  });

  groupLeftSideBarContent?.addEventListener(
    "click",
    handleGroupLeftSideBarContent,
  );
};

init();
