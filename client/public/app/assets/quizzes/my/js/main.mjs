import { loadNamespace } from "../../../global/js/utils.mjs";
import { initDomVariables, quizzesListContainer } from "./dom-variables.mjs";
import {
  handleQuizCardBtns,
  handleQuizCreateClick,
  initLazyLoadingLoader,
} from "./utils.mjs";

export const init = async () => {
  initDomVariables();
  await loadNamespace("quizzes");
  initLazyLoadingLoader();
  document.querySelectorAll(".create-quiz-btn").forEach((btn) => {
    btn.addEventListener("click", handleQuizCreateClick);
  });
  quizzesListContainer?.addEventListener("click", handleQuizCardBtns);
};
