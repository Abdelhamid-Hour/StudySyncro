import { setUpFileInputListeners } from "../../shared/avatar/js/utils.js";
import {
  avatarContainer,
  initDomVariables,
  settingsWrapper,
} from "./dom-variables.js";
import {
  handleCloseAccountBtn,
  handleEmailSaveBtn,
  handlePasswordModifyClick,
  handleProfileSaveBtn,
  handleSettingsWrapperClick,
  initOldValues,
} from "./utils.js";

export const init = () => {
  initDomVariables();

  initOldValues();

  settingsWrapper?.addEventListener("click", handleSettingsWrapperClick);

  handleProfileSaveBtn();

  handlePasswordModifyClick();

  handleEmailSaveBtn();

  handleCloseAccountBtn();

  setUpFileInputListeners(avatarContainer);
};

init();
