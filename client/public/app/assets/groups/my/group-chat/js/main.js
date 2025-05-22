import { showMessageBlock } from '../../../../../../main_assets/js/utils.js';
import { showConfirmationBox } from '../../../../global/js/utils.js';
import { iniChatMessageInput } from '../../../../shared/my-groups-active-session/js/utils.js';
import { handletTasksListners } from '../../../../shared/tasks/js/utils.js';
import {
  copyUIDMenuBtn,
  groupInfoMenuBtn,
  groupLeftSideBarContent,
  initDomVariables,
  leaveGroupMenuBtn,
  manageDemanesMenuBtn,
  membersListMenuBtn,
  quizzesListMenuBtn,
  removeGroupBtn,
  sessionInfoMenuBtn,
  showInfoBtn,
} from './dom-variables.js';
import {
  handleDemandesBtn,
  handleEditBtn,
  handleLeavingGroup,
  handleSaveAndCancellBtns,
  handleShowInfoBtnClick,
  handleViewAllMembersBtn,
  openGroupLeftSideBar,
  setUpDatePicker,
  setUpRemoveGroupBtn,
} from './utils.js';

export const init = () => {
  initDomVariables();

  const groupUID = groupLeftSideBarContent.getAttribute('data-group-id');

  iniChatMessageInput();

  showInfoBtn.addEventListener('click', handleShowInfoBtnClick);

  groupInfoMenuBtn.addEventListener('click', async (e) => {
    await openGroupLeftSideBar('/group-info');
    setUpRemoveGroupBtn('.remove-group-btn');
  });
  quizzesListMenuBtn.addEventListener('click', async (e) => {
    await openGroupLeftSideBar('/quizzes-list');
    setUpDatePicker();
  });
  membersListMenuBtn.addEventListener('click', (e) => {
    console.log('reppeating');

    openGroupLeftSideBar('/members-list');
  });
  sessionInfoMenuBtn?.addEventListener('click', async (e) => {
    await openGroupLeftSideBar('/session-info');
    handletTasksListners();
  });

  manageDemanesMenuBtn?.addEventListener('click', async (e) => {
    await openGroupLeftSideBar('/demandes-list');
    setUpDatePicker();
  });

  leaveGroupMenuBtn?.addEventListener('click', handleLeavingGroup);

  copyUIDMenuBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(groupUID);
      showMessageBlock('Group UID copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showMessageBlock('Failed to copy UID', true);
    }
  });

  setUpRemoveGroupBtn('.remove-group-menu-btn');

  removeGroupBtn?.addEventListener('click', async (e) => {});

  groupLeftSideBarContent.addEventListener('click', (e) => {
    handleEditBtn(e);
    handleSaveAndCancellBtns(e);
    handleViewAllMembersBtn(e);
    handleDemandesBtn(e);
  });
};

init();
