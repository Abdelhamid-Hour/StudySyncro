import { loadNamespace } from "../../global/js/utils.mjs";
import {
  closeBtn,
  initDomVariables,
  nextBtn,
  prevBtn,
  skipBtn,
} from "./dom-variables.mjs";
import {
  initVars,
  setUpQuiz,
  skipQuestion,
  toNextQuestion,
  toPreviousQuestion,
} from "./utils.mjs";

export const init = async () => {
  initDomVariables();
  await loadNamespace("quizzes");

  initVars();

  setUpQuiz();

  nextBtn?.addEventListener("click", toNextQuestion);

  prevBtn?.addEventListener("click", toPreviousQuestion);

  skipBtn?.addEventListener("click", skipQuestion);

  closeBtn?.addEventListener("click", () => {
    history.back();
  });
};

init();
