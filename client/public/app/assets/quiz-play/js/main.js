import {
  closeBtn,
  initDomVariables,
  nextBtn,
  prevBtn,
  skipBtn,
} from './dom-variables.js';
import {
  resetVars,
  setUpQuiz,
  skipQuestion,
  toNextQuestion,
  toPreviousQuestion,
} from './utils.js';

export const init = () => {
  initDomVariables();

  resetVars();

  setUpQuiz();

  nextBtn.addEventListener('click', toNextQuestion);
  prevBtn.addEventListener('click', toPreviousQuestion);
  skipBtn.addEventListener('click', skipQuestion);
  closeBtn.addEventListener('click', () => history.back());
};

init();
