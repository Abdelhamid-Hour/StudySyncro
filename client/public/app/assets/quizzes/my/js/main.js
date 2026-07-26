import { loadNamespace } from "../../../global/js/utils.js";
import {
  initDomVariables,
  quizCreateBtn,
  quizzesListContainer,
} from "./dom-variables.js";
import {
  handleQuizCardBtns,
  handleQuizCreateClick,
  initLazyLoadingLoader,
} from "./utils.js";

export const init = async () => {
  initDomVariables();
  await loadNamespace("quizzes");

  const loader = initLazyLoadingLoader();
  document.querySelectorAll(".create-quiz-btn").forEach((btn) => {
    btn.addEventListener("click", handleQuizCreateClick);
  });
  quizzesListContainer?.addEventListener("click", handleQuizCardBtns);
};

init();
