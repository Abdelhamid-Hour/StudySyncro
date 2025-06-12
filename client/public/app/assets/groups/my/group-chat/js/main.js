import { showMessageBlock } from '../../../../../../main_assets/js/utils.js';
import { iniChatMessageInput } from '../../../../shared/chat/js/utils.js';
import { handletTasksListners } from '../../../../shared/tasks/js/utils.js';
import {
  copyUIDMenuBtn,
  createSessionBtn,
  groupInfoMenuBtn,
  groupLeftSideBarContent,
  initDomVariables,
  leaveGroupMenuBtn,
  manageDemanesMenuBtn,
  membersListMenuBtn,
  quizzesListMenuBtn,
  removeGroupMenuBtn,
  sessionInfoMenuBtn,
  showInfoBtn,
} from './dom-variables.js';
import {
  getGroupId,
  handleApiAction,
  handleDemandesBtn,
  handleEditBtn,
  handleGroupInfo,
  handleGroupLeftSideBarContent,
  handleLeavingGroup,
  handleMembersListMenuBtn,
  handleQuizzesListMenuBtn,
  handleRemoveGroup,
  handleSaveAndCancelBtns,
  handleSessionCreateClick,
  handleSessionInfoMenuBtn,
  handleShowInfoBtnClick,
  handleViewAllMembersBtn,
  openGroupLeftSideBar,
  setUpDatePicker,
  setUpDemandes,
} from './utils.js';

export const init = () => {
  initDomVariables();

  iniChatMessageInput();

  showInfoBtn.addEventListener('click', handleShowInfoBtnClick);

  groupInfoMenuBtn.addEventListener('click', handleGroupInfo);

  quizzesListMenuBtn.addEventListener('click', handleQuizzesListMenuBtn);

  membersListMenuBtn.addEventListener('click', handleMembersListMenuBtn);

  sessionInfoMenuBtn?.addEventListener('click', handleSessionInfoMenuBtn);

  manageDemanesMenuBtn?.addEventListener('click', setUpDemandes);

  leaveGroupMenuBtn?.addEventListener('click', handleLeavingGroup);

  createSessionBtn?.addEventListener('click', handleSessionCreateClick);

  removeGroupMenuBtn?.addEventListener('click', handleRemoveGroup);

  // ! solve the duplicated event listener issue
  groupLeftSideBarContent.addEventListener(
    'click',
    handleGroupLeftSideBarContent
  );
};

init();
