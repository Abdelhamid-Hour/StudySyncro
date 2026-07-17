import { registerPageListener } from "../../global/js/utils.js";
import { showMessageBlock } from "../../../../../main_assets/js/utils.js";
import { fetchData, sendData } from "../../../../main_assets/js/utils.js";
import { openQuizResultOverlay } from "../../shared/quiz-result/js/utils.js";
import {
  hoursEl,
  minutesEl,
  nextBtn,
  secondsEl,
  timerEl,
} from "./dom-variables.js";
import lottie from "https://cdn.skypack.dev/lottie-web@5.12.0";

let quiz = {};

let quizResult = {};

let currentQuestionIndex = 0;

const drawArc = (
  canvas,
  ctx,
  percentage = 1,
  color = "red",
  step = 0.1,
  angle = 0,
) => {
  ctx.lineCap = "round"; // Make the arc ends rounded
  ctx.lineWidth = 0.01 * innerWidth; // Set line width relative to canvas size
  ctx.strokeStyle = "gray";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height / 2 - 10,
    0,
    2 * Math.PI,
  );
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height / 2 - 10,
    0,
    2 * Math.PI * percentage,
  );
  ctx.stroke();
};
// utils.js
function animateArc(canvas, ctx, percentage, color, duration = 1000) {
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const currentPercentage = percentage * progress;
    drawArc(canvas, ctx, currentPercentage, color);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

const resultTypes = {
  excellent: {
    title: "Excellent work!",
    description: "You nailed it! Keep it up.",
  },
  good: {
    title: "Well done!",
    description: "Great job! You have a good grasp of the material.",
  },
  average: {
    title: "Not bad, keep going!",
    description: "You're almost there! Keep up the good work.",
  },
  poor: {
    title: "Better luck next time!",
    description: "Try to review the material and keep practicing.",
  },
};

const getQuizResultPage = (grade, correctCount, percentage) => {
  const { title, description } = resultTypes[grade];
  // Capitalize the first letter of grade
  const capitalizedGrade = grade.charAt(0).toUpperCase() + grade.slice(1);
  return `<div class="quiz-result">
            <header class="quiz-result-header">
                <h1 class="title">${title}</h1>
                <span class="caption">
                    ${description}
                </span>
            </header>
            <img src="/app/assets/quiz-play/svgs/book.svg" class="quiz-svg-book" />
            <img src="/app/assets/quiz-play/svgs/books-3.svg" class="quiz-svg-books-3" />
            <img src="/app/assets/quiz-play/svgs/clock.svg" class="quiz-svg-clock" />
            <img src="/app/assets/quiz-play/svgs/earth.svg" class="quiz-svg-earth" />
            <div class="quiz-svg-exam-container">
                <h1 class="result-title ${grade}">${capitalizedGrade}</h1>
                <img src="/app/assets/quiz-play/svgs/exam.svg" class="quiz-svg-exam" />
            </div>
            <img src="/app/assets/quiz-play/svgs/nodes.svg" class="quiz-svg-nodes" />
            <img src="/app/assets/quiz-play/svgs/planet.svg" class="quiz-svg-planet" />
            <img src="/app/assets/quiz-play/svgs/rect.svg" class="quiz-svg-rect" />
            <img
                src="/app/assets/quiz-play/svgs/rectangle.svg"
                class="quiz-svg-rectangle"
            />
            <div class="meta-result">
                <h2>Your Score</h2>
                <div class="percentage-wrapper">
                    <canvas class="percentage-circle"></canvas>
                    <div class="percentage-value">
                        <span class="value">${percentage * 100}</span>
                        <span class="percent">%</span>
                    </div>
                    <span class="correct-questions">
                        <span class="icon-box">
                            <i class="bi bi-check2-circle"></i>
                        </span>
                        ${correctCount} Questions
                    </span>
                </div>
                <button type="button" class="blue-btn view-result-btn">
                    View Result Details
                </button>
            </div>
            <div id="lottie-animation"></div>
        </div>`;
};

export const setUpCanvas = (
  grade,
  percentage,
  correctCount,
  circleAnDuration,
) => {
  const quizResultPage = getQuizResultPage(grade, correctCount, percentage);
  const wrapper = document.querySelector(".quiz-view");
  wrapper.querySelector(".questions-view").outerHTML = quizResultPage;
  wrapper.querySelector(".view-result-btn").addEventListener("click", () =>
    openQuizResultOverlay({
      quizData: {
        quizResult,
        questions: quiz.questions,
      },
    }),
  );
  const canvas = document.querySelector("canvas.percentage-circle");
  const ctx = canvas.getContext("2d");
  const colorMap = {
    excellent: "#00ad0c",
    good: "#1e77fd",
    average: "#d45f00",
    poor: "#eb3b43ff",
  };

  const updateSize = function () {
    canvas.width = canvas.parentElement.parentElement.clientWidth;
    canvas.height = canvas.parentElement.parentElement.clientWidth;
    animateArc(canvas, ctx, percentage, colorMap[grade], circleAnDuration);
  };

  registerPageListener(window, "resize", updateSize);

  updateSize();

  lottie.loadAnimation({
    container: document.getElementById("lottie-animation"), // the HTML element
    renderer: "svg", // or 'canvas' or 'html'
    loop: true,
    autoplay: true,
    path: `/app/assets/quiz-play/characters/${grade}.json`, // path to your Lottie JSON file
  });
};

const createChoiceElement = (choice, index) => {
  const choiceElement = document.createElement("label");
  choiceElement.className = "choice";
  choiceElement.innerHTML = `
    <input type="radio" value="${index}" name="choice">
    <span class="choice-label">${String.fromCharCode(65 + index)}</span>
    <span class="choice-text"></span>
  `;
  choiceElement.querySelector(".choice-text").textContent = choice;
  return choiceElement;
};

export const getQuestionTemplate = (
  {
    questionText = "A simple question text here, simple question text here, simple question text here, simple question text here",
    choices = ["Choice A", "Choice B", "Choice C"],
  },
  animationClass,
) => {
  const questionTemplate = document.createElement("div");
  questionTemplate.className = `question-body ${animationClass}`;
  questionTemplate.innerHTML = `
  <div class="question-body">
    <h4></h4>
    <div class="question-choices">
      <span class="select-answer-label">Select the correct Answer <span style="opacity: 0.65; font-size: 0.85em; font-weight: normal;">(Or press 1-6 / A-F)</span></span>
      <div class="choices-list">
      </div>
    </div>
  </div>
  `;
  const questionHeader = questionTemplate.querySelector("h4");
  questionHeader.textContent = questionText;
  const choicesList = questionTemplate.querySelector(".choices-list");
  choices.forEach((choice, index) => {
    const choiceElement = createChoiceElement(choice, index);
    choicesList.appendChild(choiceElement);
  });

  return questionTemplate;
};

export const initVars = () => {
  quiz = {
    questions: [],
    id: window.location.pathname.split("/").pop(),
    duration: 0, // Duration in minutes
    passed: false,
    title: document.querySelector(".quiz-title")?.textContent.trim(),
  };

  quizResult = {
    quizId: quiz.id,
    correctAnswers: [],
    incorrectAnswers: [],
    skippedQuestions: [],
    groupId: "",
    submittedAt: null,
    quizTitle: quiz.title,
  };
  currentQuestionIndex = 0;
};

export const removeCurrentQuestionFromResults = (questionId) => {
  quizResult.skippedQuestions = quizResult.skippedQuestions.filter(
    (qId) => qId !== questionId,
  );
  quizResult.correctAnswers = quizResult.correctAnswers.filter(
    (qId) => qId !== questionId,
  );
  quizResult.incorrectAnswers = quizResult.incorrectAnswers.filter(
    (q) => q.id !== questionId,
  );
};

const step = (direction) => {
  currentQuestionIndex += direction;
  if (currentQuestionIndex < 0) {
    currentQuestionIndex = 0;
    return;
  } else if (currentQuestionIndex >= quiz.questions.length) {
    currentQuestionIndex = quiz.questions.length - 1;
    finishQuiz();
    return;
  }

  const nextIsLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  if (nextIsLastQuestion) nextBtn.textContent = "Finish";
  else nextBtn.textContent = "Next";

  const questionCounter = document.querySelector(".current-question-number");
  questionCounter.textContent = currentQuestionIndex + 1;
  const question = quiz.questions[currentQuestionIndex];
  const animationClass = direction === 1 ? "slide-in-right" : "slide-in-left";
  const questionEl = getQuestionTemplate(
    {
      questionText: question.text,
      choices: question.choices,
      answerIndex: question.correctAnswerIndex,
    },
    animationClass,
  );
  const questionContainer = document.querySelector(".question-body");
  questionContainer.replaceWith(questionEl);
};

export const toNextQuestion = () => {
  const checkedChoice = document.querySelector('input[type="radio"]:checked');
  if (!checkedChoice) {
    showMessageBlock(
      "Please select an answer or click the Skip button to continue.",
      "info",
    );
    return;
  }

  const question = quiz.questions[currentQuestionIndex];

  removeCurrentQuestionFromResults(question.id);

  const value = Number(checkedChoice.value);

  const isCorrectAnswer = value === question.correctAnswerIndex;

  if (isCorrectAnswer) {
    quizResult.correctAnswers.push(question.id);
  } else {
    quizResult.incorrectAnswers.push({
      id: question.id,
      answerIndex: value,
    });
  }

  step(1);
};

export const skipQuestion = () => {
  const question = quiz.questions[currentQuestionIndex];
  removeCurrentQuestionFromResults(question.id);
  quizResult.skippedQuestions.push(question.id);
  step(1);
};

export const toPreviousQuestion = () => step(-1);

export const setUpQuiz = async () => {
  try {
    let questions, duration, passed;
    if (window.__QUIZ_INITIAL_DATA__ && window.__QUIZ_INITIAL_DATA__.questions && window.__QUIZ_INITIAL_DATA__.questions.length > 0) {
      questions = window.__QUIZ_INITIAL_DATA__.questions;
      duration = window.__QUIZ_INITIAL_DATA__.duration;
      passed = window.__QUIZ_INITIAL_DATA__.passed;
    } else {
      const data = await fetchData(
        "/quiz-play-details/" + quiz.id,
      );
      questions = data.questions;
      duration = data.duration;
      passed = data.passed;
    }
    quiz.duration = duration;
    quiz.questions = questions;
    quiz.passed = passed;
    registerPageListener(document, "keydown", handleKeyDown);
    if (quiz.duration && timerEl) {
      const finishedDate = new Date(Date.now() + quiz.duration);
      const shouldShowHours = Math.floor(quiz.duration / 3600000) > 0;
      if (!shouldShowHours) {
        hoursEl.nextElementSibling?.remove();
        hoursEl.remove();
      }
      tick(finishedDate, shouldShowHours);
    } else if (timerEl) {
      timerEl.remove();
    }
  } catch (error) {
    console.error("Failed to fetch quiz questions:", error);
    showMessageBlock(
      "Failed to load quiz questions. Please try again later.",
      "error",
    );
    return;
  }
};

const tick = (finishedDate, shouldShowHours) => {
  const timeLeft = finishedDate.getTime() - Date.now();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
    .toString()
    .padStart(2, "0");
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    .toString()
    .padStart(2, "0");
  const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000)
    .toString()
    .padStart(2, "0");
  updateTimerDisplay(hoursLeft, minutesLeft, secondsLeft, shouldShowHours);
  const nextTickDelay = Date.now() % 1000 || 1000; // Ensure at least 1s
  if (timeLeft <= 0) {
    finishQuiz();
    return;
  }
  setTimeout(() => tick(finishedDate, shouldShowHours), nextTickDelay);
};

const updateTimerDisplay = (hours, minutes, seconds, shouldShowHours) => {
  if (shouldShowHours) hoursEl.textContent = hours;
  minutesEl.textContent = minutes;
  secondsEl.textContent = seconds;
};

// Renamed to markSkipped for brevity
const markSkipped = () => {
  quiz.questions.forEach((question) => {
    const isSkipped = quizResult.skippedQuestions.includes(question.id);
    const isCorrect = quizResult.correctAnswers.includes(question.id);
    const isIncorrect = quizResult.incorrectAnswers.some(
      (q) => q.id === question.id,
    );

    if (!isCorrect && !isIncorrect && !isSkipped)
      quizResult.skippedQuestions.push(question.id);
  });
};

const getQuizGrade = () => {
  const totalQuestions = quiz.questions.length;
  const correctAnswers = quizResult.correctAnswers.length;
  const percentage = (correctAnswers / totalQuestions).toFixed(2);
  const result = {
    grade: "",
    percentage: percentage,
  };
  if (percentage >= 0.8) result.grade = "excellent";
  else if (percentage >= 0.6) result.grade = "good";
  else if (percentage >= 0.4) result.grade = "average";
  else result.grade = "poor";

  return result;
};

const finishQuiz = async () => {
  document.removeEventListener("keydown", handleKeyDown);
  markSkipped();
  const { grade, percentage } = getQuizGrade();

  quizResult.submittedAt = new Date().toISOString();

  if (!quiz.passed) submitExamenResult();

  setUpCanvas(
    grade,
    percentage,
    `${quizResult.correctAnswers.length} of ${quiz.questions.length}`,
    1000,
  );
};

const submitExamenResult = async () => {
  try {
    await sendData("/api/add-quiz-result", { quizResult });
  } catch (error) {
    console.error("Failed to submit examen result:", error);
    showMessageBlock(
      "Failed to submit your quiz result. Please try again later.",
      "error",
    );
    return;
  }
};

export const handleKeyDown = (e) => {
  if (window.location.pathname.includes("/quiz-play/")) {
    if (
      ["INPUT", "TEXTAREA"].includes(e.target?.tagName) &&
      e.target.type !== "radio" &&
      e.target.type !== "checkbox"
    )
      return;

    if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault();
      toNextQuestion();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      toPreviousQuestion();
    } else if (e.key.toLowerCase() === "s") {
      e.preventDefault();
      skipQuestion();
    } else if (/^[1-6]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      const radio = document.querySelector(
        `input[type="radio"][name="choice"][value="${idx}"]`,
      );
      if (radio) radio.checked = true;
    } else if (/^[a-fA-F]$/.test(e.key)) {
      const idx = e.key.toLowerCase().charCodeAt(0) - 97;
      const radio = document.querySelector(
        `input[type="radio"][name="choice"][value="${idx}"]`,
      );
      if (radio) radio.checked = true;
    }
  }
};
