import { showMessageBlock } from '../../../../../../main_assets/js/utils.js';
import { iniChatMessageInput } from '../../../../shared/chat/js/utils.js';
import { handletTasksListners } from '../../../../shared/tasks/js/utils.js';
import {
  chatContainer,
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
  handleDemandesBtn,
  handleEditBtn,
  handleGroupInfo,
  handleLeavingGroup,
  handleRemoveGroup,
  handleSaveAndCancellBtns,
  handleSessionCreateClick,
  handleShowInfoBtnClick,
  handleViewAllMembersBtn,
  openGroupLeftSideBar,
  setUpDatePicker,
} from './utils.js';

// export const init = () => {
//   initDomVariables();

//   const groupUID = groupLeftSideBarContent.getAttribute('data-group-id');

//   iniChatMessageInput();

//   showInfoBtn.addEventListener('click', handleShowInfoBtnClick);

//   groupInfoMenuBtn.addEventListener('click', handleGroupInfo);

//   quizzesListMenuBtn.addEventListener('click', async (e) => {
//     await openGroupLeftSideBar('/quizzes-list');
//     setUpDatePicker();
//   });
//   membersListMenuBtn.addEventListener('click', (e) => {
//     openGroupLeftSideBar('/members-list');
//   });
//   sessionInfoMenuBtn?.addEventListener('click', async (e) => {
//     await openGroupLeftSideBar('/session-info');
//     handletTasksListners('session-info');
//   });

//   manageDemanesMenuBtn?.addEventListener('click', async (e) => {
//     await openGroupLeftSideBar('/demandes-list');
//     setUpDatePicker();
//   });

//   leaveGroupMenuBtn?.addEventListener('click', handleLeavingGroup);

//   copyUIDMenuBtn.addEventListener('click', async () => {
//     try {
//       await navigator.clipboard.writeText(groupUID);
//       showMessageBlock('Group UID copied to clipboard');
//     } catch (err) {
//       console.error('Failed to copy: ', err);
//       showMessageBlock('Failed to copy UID', true);
//     }
//   });

//   createSessionBtn?.addEventListener('click', handleSessionCreateClick);

//   removeGroupMenuBtn?.addEventListener('click', handleRemoveGroup);

//   groupLeftSideBarContent.addEventListener('click', (e) => {
//     handleEditBtn(e);
//     handleSaveAndCancellBtns(e);
//     handleViewAllMembersBtn(e);
//     handleDemandesBtn(e);
//   });
// };

// init();

// // !! Drag Start
// document
//   .querySelector('.tasks-list')
//   ?.addEventListener('dragstart', function (e) {
//     if (!e.target.matches || !e.target.matches('.task-wrapper ')) {
//       e.preventDefault();
//       return;
//     }
//     const task = e.target;
//     // Add the task's id or a unique identifier to the dataTransfer object
//     e.dataTransfer.setData('text/plain', task.dataset.taskId);
//     const emptyImg = new Image();
//     emptyImg.src =
//       'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

//     e.dataTransfer.setDragImage(emptyImg, 0, 0);
//     this.classList.add('drag-start');
//     console.log('Dragging started');
//   });

// // !! Drop
// document.querySelector('.tasks-list')?.addEventListener('drop', (e) => {
//   const taskId = e.dataTransfer.getData('text/plain');
//   if (taskId) {
//     console.log('Dropped', taskId);
//   }
// });
// // !! drag End
// document
//   .querySelector('.tasks-list')
//   ?.addEventListener('dragend', function (e) {
//     if (!e.target.closest || !e.target.closest('.task-wrapper ')) {
//       return;
//     }
//     this.classList.remove('drag-start');
//     const task = e.target.closest('.task-wrapper ');
//     task.draggable = false;
//   });

// // !! Mouse Down
// document.querySelector('.tasks-list')?.addEventListener('mousedown', (e) => {
//   const task = e.target.closest('.task-wrapper ');
//   if (e.target.closest('.drag-handle')) {
//     task.draggable = true;
//   }
// });

// // !! Drag Enter
// document
//   .querySelector('.tasks-list')
//   ?.addEventListener('dragenter', function (e) {
//     if (
//       !e.target.closest ||
//       !e.target.closest('.drop-target') ||
//       !this.classList.contains('drag-start')
//     ) {
//       return;
//     }

//     const dragOverEl = e.target.closest('.drop-target');
//     dragOverEl.classList.add('drag-over');
//   });

// document
//   .querySelector('.tasks-list')
//   ?.addEventListener('dragleave', function (e) {
//     if (
//       !e.target.closest ||
//       !e.target.closest('.drop-target') ||
//       !this.classList.contains('drag-start')
//     ) {
//       return;
//     }
//     const dragOverEl = e.target.closest('.drop-target');
//     dragOverEl.classList.remove('drag-over');
//   });

let dragging = {};
const PROXIMITY = 10; // Distance in pixels to trigger a drop
const taskList = document.querySelector('.tasks-list');
taskList?.addEventListener('mousedown', (e) => {
  if (e.target.closest('.drag-handle')) {
    dragging.dragEl = e.target.closest('.task');
    const rect = dragging.dragEl.getBoundingClientRect();
    dragging.offsetX = e.clientX - rect.left;
    dragging.offsetY = e.clientY - rect.top;
    dragging.dragEl.style.position = 'absolute';
    dragging.dragEl.style.width = 'calc(100% - var(--primary-gap) * 2)';
    dragging.dragEl.style.zIndex = '1000';
  }
});

document.addEventListener('mouseup', (e) => {
  if (dragging.dragEl) {
    dragging.dragEl.style.zIndex = '';
    dragging.dragEl.style.width = '';
    dragging.dragEl.style.position = '';
    dragging.dragEl.style.top = '';
    dragging.dragEl.style.left = '';
    dragging = {};
  }
});

taskList?.addEventListener('mousemove', (e) => {
  if (dragging.dragEl) {
    const rect = taskList.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - dragging.offsetX;
    const offsetY = e.clientY - rect.top - dragging.offsetY;
    dragging.dragEl.style.top = offsetY + 'px';
    dragging.dragEl.style.left = offsetX + 'px';

    const dropTargets = taskList.querySelectorAll('.drop-target');
    dropTargets.forEach((target) => {
      const targetRect = target.getBoundingClientRect();
      const dragElRect = dragging.dragEl.getBoundingClientRect();
      const isOverTarget =
        dragElRect.left >= targetRect.left - PROXIMITY &&
        dragElRect.left <= targetRect.right + PROXIMITY &&
        dragElRect.top >= targetRect.top - PROXIMITY &&
        dragElRect.top <= targetRect.bottom + PROXIMITY;

      if (isOverTarget) {
        console.log('fire');
        target.classList.add('drag-over');
      } else {
        target.classList.remove('drag-over');
      }
    });
  }
});
