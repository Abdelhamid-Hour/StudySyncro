import {
  deleteAccountBtn,
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

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }

  initDomVariables();

  initOldValues();

  settingsWrapper.addEventListener("click", handleSettingsWrapperClick);

  handleProfileSaveBtn();

  handlePasswordModifyClick();

  handleEmailSaveBtn();

  handleCloseAccountBtn();
};

init();
