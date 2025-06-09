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
  handleDemandesBtn,
  handleEditBtn,
  handleGroupInfo,
  handleLeavingGroup,
  handleRemoveGroup,
  handleSaveAndCancelBtns,
  handleSessionCreateClick,
  handleShowInfoBtnClick,
  handleViewAllMembersBtn,
  openGroupLeftSideBar,
  setUpDatePicker,
} from './utils.js';

export const init = () => {
  
  initDomVariables();

  iniChatMessageInput();

  showInfoBtn.addEventListener('click', handleShowInfoBtnClick);

  groupInfoMenuBtn.addEventListener('click', handleGroupInfo);

  quizzesListMenuBtn.addEventListener('click', async () => {
    await openGroupLeftSideBar('/quizzes-list');
    setUpDatePicker();
  });
  membersListMenuBtn.addEventListener('click', () => {
    openGroupLeftSideBar('/members-list');
  });
  sessionInfoMenuBtn?.addEventListener('click', async () => {
    await openGroupLeftSideBar('/session-info');
    handletTasksListners('session-info');
  });

  manageDemanesMenuBtn?.addEventListener('click', async () => {
    await openGroupLeftSideBar('/demandes-list');
    setUpDatePicker();
  });

  leaveGroupMenuBtn?.addEventListener('click', handleLeavingGroup);

  createSessionBtn?.addEventListener('click', handleSessionCreateClick);

  removeGroupMenuBtn?.addEventListener('click', handleRemoveGroup);

  groupLeftSideBarContent.addEventListener('click', (e) => {
    handleEditBtn(e);
    handleSaveAndCancelBtns(e);
    handleViewAllMembersBtn(e);
    handleDemandesBtn(e);
  });
};

init();
