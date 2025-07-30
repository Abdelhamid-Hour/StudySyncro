import { setUpDragAndDrop } from '../../../../shared/tasks/js/utils.js';
import {
  editorHeader,
  editorQuestionsList,
  initDomVariables,
  panelAddQuestionBtn,
  questionsPanelList,
  saveQuizBtn,
  sidebarTitleLink,
} from './dom-variables.js';
import {
  handleAddQuestion,
  handleEditBtn,
  handleEditorListDragEnd,
  handleEditorQuestionsListClick,
  handleQuestionsPanelListClick,
  handleSaveBtn,
  handleSidebarTitleLinkClick,
  handleTextarea,
  initializeInitialData,
  saveQuiz,
} from './utils.js';

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  initializeInitialData();

  saveQuizBtn?.addEventListener('click', saveQuiz);

  setUpDragAndDrop('.questions-list', '.question', handleEditorListDragEnd);

  questionsPanelList.addEventListener('click', handleQuestionsPanelListClick);

  panelAddQuestionBtn.addEventListener('click', handleAddQuestion);

  editorQuestionsList.addEventListener('click', handleEditorQuestionsListClick);

  editorQuestionsList.addEventListener('input', handleTextarea);

  sidebarTitleLink.addEventListener('click', handleSidebarTitleLinkClick);

  editorHeader.addEventListener('click', (e) => {
    const editSubjectBtn = e.target.closest('.edit-subject-btn');
    if (editSubjectBtn) handleEditBtn('subject');

    const editTitleBtn = e.target.closest('.edit-title-btn');
    if (editTitleBtn) handleEditBtn('title');

    const saveTitleBtn = e.target.closest('.save-title-btn');
    if (saveTitleBtn) handleSaveBtn('title', saveTitleBtn);

    const saveSubjectBtn = e.target.closest('.save-subject-btn');
    if (saveSubjectBtn) handleSaveBtn('subject', saveSubjectBtn);
  });
};

init();
