import { loadNamespace } from "../../global/js/utils.mjs";
import { setUpFileInputListeners } from "../../shared/avatar/js/utils.mjs";
import {
  avatarContainer,
  initDomVariables,
  settingsWrapper,
} from "./dom-variables.mjs";
import {
  handleCloseAccountBtn,
  handleEmailSaveBtn,
  handlePasswordModifyClick,
  handleProfileSaveBtn,
  handleSettingsWrapperClick,
  initOldValues,
} from "./utils.mjs";

export const init = async () => {
  initDomVariables();
  await loadNamespace("settings");

  initOldValues();

  settingsWrapper?.addEventListener("click", handleSettingsWrapperClick);

  handleProfileSaveBtn();

  handlePasswordModifyClick();

  handleEmailSaveBtn();

  handleCloseAccountBtn();

  setUpFileInputListeners(avatarContainer);
};
