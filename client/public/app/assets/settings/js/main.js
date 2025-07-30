import {
  deleteAccountBtn,
  emailModifyBtn,
  initDomVariables,
  passwordModifyBtn,
  profileModifyBtn,
  settingsWrapper,
} from './dom-variables.js';
import {
  handleCloseAccountBtn,
  handleEmailModifyClick,
  handlePasswordModifyClick,
  handleProfileModifyClick,
  handleSettingsWrapperClick,
} from './utils.js';

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  settingsWrapper.addEventListener('click', handleSettingsWrapperClick);

  profileModifyBtn.addEventListener('click', handleProfileModifyClick);

  emailModifyBtn.addEventListener('click', handleEmailModifyClick);

  deleteAccountBtn.addEventListener('click', handleCloseAccountBtn);

  passwordModifyBtn.addEventListener('click', handlePasswordModifyClick);
};
init();
