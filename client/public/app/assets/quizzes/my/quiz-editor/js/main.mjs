import {
  loadNamespaces,
  registerPageListener,
} from "../../../../global/js/utils.mjs";
import { setUpDragAndDrop } from "../../../../shared/tasks/js/utils.mjs";
import {
  editorHeader,
  editorQuestionsList,
  initDomVariables,
  panelAddQuestionBtn,
  questionsPanelList,
  saveQuizBtn,
  sidebarTitleLink,
} from "./dom-variables.mjs";
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
  initMobileTabs,
  saveQuiz,
} from "./utils.mjs";

export const init = async () => {
  await loadNamespaces(["quizzes", "quiz-edit"]);
  initDomVariables();

  initializeInitialData();

  saveQuizBtn?.addEventListener("click", saveQuiz);

  setUpDragAndDrop(".questions-list", ".question", handleEditorListDragEnd);

  questionsPanelList?.addEventListener("click", handleQuestionsPanelListClick);

  panelAddQuestionBtn?.addEventListener("click", handleAddQuestion);

  editorQuestionsList?.addEventListener(
    "click",
    handleEditorQuestionsListClick,
  );

  editorQuestionsList?.addEventListener("input", handleTextarea);

  sidebarTitleLink?.addEventListener("click", handleSidebarTitleLinkClick);

  editorHeader?.addEventListener("click", (e) => {
    const editSubjectBtn = e.target.closest(".edit-subject-btn");
    if (editSubjectBtn) handleEditBtn("subject");

    const editTitleBtn = e.target.closest(".edit-title-btn");
    if (editTitleBtn) handleEditBtn("title");

    const saveTitleBtn = e.target.closest(".save-title-btn");
    if (saveTitleBtn) handleSaveBtn("title", saveTitleBtn);

    const saveSubjectBtn = e.target.closest(".save-subject-btn");
    if (saveSubjectBtn) handleSaveBtn("subject", saveSubjectBtn);
  });
  initMobileTabs();
};

registerPageListener(window, "resize", initMobileTabs);

init();
