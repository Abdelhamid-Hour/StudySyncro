export let prevBtn,
  nextBtn,
  skipBtn,
  closeBtn,
  hoursEl,
  minutesEl,
  secondsEl,
  timerEl,
  quizView;

export const initDomVariables = () => {
  prevBtn = document.querySelector(".prev-btn");
  nextBtn = document.querySelector(".next-btn");
  skipBtn = document.querySelector(".skip-btn");
  hoursEl = document.querySelector(".hours");
  minutesEl = document.querySelector(".minutes");
  secondsEl = document.querySelector(".seconds");
  quizView = document.querySelector(".quiz-view");
  closeBtn = document.querySelector(".close-btn");
  timerEl = document.querySelector(".timer");
};
