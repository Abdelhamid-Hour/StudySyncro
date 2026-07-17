import { navigateTo } from "../../global/js/utils.js";
import {
  closeBtn,
  initDomVariables,
  nextBtn,
  prevBtn,
  skipBtn,
} from "./dom-variables.js";
import {
  initVars,
  setUpQuiz,
  skipQuestion,
  toNextQuestion,
  toPreviousQuestion,
} from "./utils.js";

export const init = () => {
  initDomVariables();

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
