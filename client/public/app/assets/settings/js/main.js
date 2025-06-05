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

export const init = () => {
  initDomVariables();

  settingsWrapper.addEventListener('click', handleSettingsWrapperClick);

  profileModifyBtn.addEventListener('click', handleProfileModifyClick);

  emailModifyBtn.addEventListener('click', handleEmailModifyClick);

  deleteAccountBtn.addEventListener('click', handleCloseAccountBtn);

  passwordModifyBtn.addEventListener('click', handlePasswordModifyClick);
};
init();
