import { showMessageBlock } from "../../../../../main_assets/js/utils.js";
import { fetchData } from "../../../../main_assets/js/utils.js";
import { openOverlayModal, scrollToView } from "../../global/js/utils.js";
import { hoursEl, minutesEl, nextBtn, secondsEl } from "./dom-variables.js";

// ? Question template :
/* 
  {
    id: 'q9',
    text: 'What is the official language of Morocco?',
    choices: ['French', 'Tamazight', 'Arabic', 'English'],
    correctAnswerIndex: 2, // Arabic
  }
 */

// ? Incorrect question template

/*
  {
    id: question.id,
    answerIndex: value,
  }
*/

let quiz = {
  questions: [],
  id: window.location.pathname.split("/").pop(),
  duration: 0, // Duration in minutes
};

let examenResult = {
  userId: null,
  quizId: null,
  correctAnswers: [],
  incorrectAnswers: [],
  skippedQuestions: [],
  submittedAt: null,
};
let currentQuestionIndex = 0;

const drawArc = (
  canvas,
  ctx,
  percentage = 1,
  color = "red",
  step = 0.1,
  angle = 0
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
    2 * Math.PI
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
    2 * Math.PI * percentage
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
                <button type="button" class="blue-btn get-result-btn">
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
  circleAnDuration
) => {
  const quizResultPage = getQuizResultPage(grade, correctCount, percentage);
  const wrapper = document.querySelector(".quiz-view");
  wrapper.querySelector(".questions-view").outerHTML = quizResultPage;
  wrapper.querySelector(".get-result-btn").addEventListener("click", () =>
    openOverlayModal(
      "quiz-result-overlay",
      [".close-result-overlay-btn"],
      getResultOverlay,
      (backDrop) => {
        backDrop
          .querySelector(".questions-rects")
          .addEventListener("click", (e) => {
            const questionsLink = e.target.closest("a.status-rect");
            if (questionsLink) scrollToView(e, questionsLink);
          });
      }
    )
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

  window.addEventListener("resize", updateSize);

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
  animationClass
) => {
  const questionTemplate = document.createElement("div");
  questionTemplate.className = `question-body ${animationClass}`;
  questionTemplate.innerHTML = `
  <div class="question-body">
    <h4></h4>
    <div class="question-choices">
      <span class="select-answer-label">Select the correct Answer</span>
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

export const resetVars = () => {
  examenResult = {
    userId: null,
    quizId: null,
    correctAnswers: [],
    incorrectAnswers: [],
    skippedQuestions: [],
    submittedAt: null,
  };
  currentQuestionIndex = 0;
};

export const removeCurrentQuestionFromResults = (questionId) => {
  examenResult.skippedQuestions = examenResult.skippedQuestions.filter(
    (qId) => qId !== questionId
  );
  examenResult.correctAnswers = examenResult.correctAnswers.filter(
    (qId) => qId !== questionId
  );
  examenResult.incorrectAnswers = examenResult.incorrectAnswers.filter(
    (q) => q.id !== questionId
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
    animationClass
  );
  const questionContainer = document.querySelector(".question-body");
  questionContainer.replaceWith(questionEl);
};

export const toNextQuestion = () => {
  const checkedChoice = document.querySelector('input[type="radio"]:checked');
  if (!checkedChoice) {
    showMessageBlock(
      "Please select an answer or click the Skip button to continue.",
      "info"
    );
    return;
  }

  const question = quiz.questions[currentQuestionIndex];

  removeCurrentQuestionFromResults(question.id);

  const value = Number(checkedChoice.value);

  const isCorrectAnswer = value === question.correctAnswerIndex;

  if (isCorrectAnswer) {
    examenResult.correctAnswers.push(question.id);
  } else {
    examenResult.incorrectAnswers.push({
      id: question.id,
      answerIndex: value,
    });
  }
  step(1);
};

export const skipQuestion = () => {
  const question = quiz.questions[currentQuestionIndex];
  removeCurrentQuestionFromResults(question.id);
  examenResult.skippedQuestions.push(question.id);
  step(1);
};

export const toPreviousQuestion = () => step(-1);

export const setUpQuiz = async () => {
    try {
    quiz = await fetchData('/quiz-questions/' + quiz.id);
      console.log(quiz, 'quiz data');
      
    const finishedDate = new Date(Date.now() + quiz.duration * 60 * 1000);
    const shouldShowHours = Math.floor(quiz.duration / 60) > 0;
    if (!shouldShowHours) {
      hoursEl.nextElementSibling?.remove();
      hoursEl.remove();
    }
    document.addEventListener('keydown', handleKeyDown);
    tick(finishedDate, shouldShowHours);
  } catch (error) {
    console.error('Failed to fetch quiz questions:', error);
    showMessageBlock(
      'Failed to load quiz questions. Please try again later.',
      'error'
    );
    return;
  }
  // try {
  //   const { questions, duration } = await fetchData(
  //     "/quiz-questions/" + quiz.id
  //   );
  //   quiz.duration = duration;
  //   quiz.questions = questions;
  //   if (quiz.duration) {
  //     const finishedDate = new Date(Date.now() + quiz.duration * 60 * 1000);
  //     const shouldShowHours = Math.floor(quiz.duration / 60) > 0;
  //     if (!shouldShowHours) {
  //       hoursEl.nextElementSibling?.remove();
  //       hoursEl.remove();
  //     }
  //     document.addEventListener("keydown", handleKeyDown);
  //     tick(finishedDate, shouldShowHours);
  //   }else {
  //     timerEl.remove()
  //   }
  // } catch (error) {
  //   console.error("Failed to fetch quiz questions:", error);
  //   showMessageBlock(
  //     "Failed to load quiz questions. Please try again later.",
  //     "error"
  //   );
  //   return;
  // }
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
    const isSkipped = examenResult.skippedQuestions.includes(question.id);
    const isCorrect = examenResult.correctAnswers.includes(question.id);
    const isIncorrect = examenResult.incorrectAnswers.some(
      (q) => q.id === question.id
    );

    if (!isCorrect && !isIncorrect && !isSkipped)
      examenResult.skippedQuestions.push(question.id);
  });
};

const getQuizGrade = () => {
  const totalQuestions = quiz.questions.length;
  const correctAnswers = examenResult.correctAnswers.length;
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

const finishQuiz = () => {
  document.removeEventListener("keydown", handleKeyDown);
  markSkipped();
  examenResult.submittedAt = new Date().toISOString();
  const { grade, percentage } = getQuizGrade();
  setUpCanvas(
    grade,
    percentage,
    `${examenResult.correctAnswers.length} of ${quiz.questions.length}`,
    1000
  );
};

export const handleKeyDown = (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    toNextQuestion();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    toPreviousQuestion();
  } else if (e.key === "Enter") {
    e.preventDefault();
    toNextQuestion();
  }
};

const getStatusClass = (questionId) => {
  const isCorrect = examenResult.correctAnswers.includes(questionId);
  const isSkipped = examenResult.skippedQuestions.includes(questionId);

  return isCorrect ? "correct" : isSkipped ? "skipped" : "incorrect";
};

const getPercentage = (count) =>
  Math.round((count / quiz.questions.length) * 100);

export const getResultOverlay = () => {
  const submittedAt = new Date(examenResult.submittedAt);
  const finishedDate = submittedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const finishedTime = submittedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const questionCount = quiz.questions.length;
  const answeredCount =
    examenResult.correctAnswers.length + examenResult.incorrectAnswers.length;
  const correctCount = examenResult.correctAnswers.length;
  const skippedCount = examenResult.skippedQuestions.length;
  const incorrectCount = examenResult.incorrectAnswers.length;
  const answeredPercent = getPercentage(answeredCount);
  const incorrectPercent = getPercentage(incorrectCount);
  const correctPercent = getPercentage(correctCount);
  const skippedPercent = getPercentage(skippedCount);

  const resultWrapper = document.createElement("div");
  resultWrapper.className = "overlay-model quiz-result-overlay";
  resultWrapper.innerHTML = `
  <header class="quiz-result-header">
    <span class="finished-date">Finished: ${finishedDate}</span>
    •
    <span class="finished-time">${finishedTime}</span>
    •
    <span class="questions-count">
      <span class="icon-box">
        <i class="bi bi-patch-question"></i>
      </span>
      ${questionCount} Questions
    </span>
    <button type="button" class="exclude-btn close-result-overlay-btn">
      <i class="bi bi-x-lg"></i>
    </button>
  </header>
  <h3 class="quiz-title">JavaScript Basics Quiz</h3>
  <div class="answered">
    <span class="answered-title">Answered :</span>
    <span class="answered-count">${answeredCount}/${questionCount} Questions</span>
    •
    <span class="answered-percent">${answeredPercent}%</span>
  </div>
  <div class="questions-rects">
  ${quiz.questions
    .map((question, index) => {
      return `
      <a href="#question-${index + 1}" class="status-rect ${getStatusClass(
        question.id
      )}">${index + 1}</a>`;
    })
    .join("")}
  </div>
  <div class="analytics">
    <div class="analytics-item">
      <span class="title">
        <span class="green-rect rect"></span>
        Correct :
      </span>
      <span class="questions-count">${correctCount}/${questionCount} Questions</span>
      •
      <span class="percent">${correctPercent}%</span>
    </div>
    <div class="analytics-item">
      <span class="title">
        <span class="gray-rect rect"></span>
        Skipped :
      </span>
      <span class="questions-count">${skippedCount}/${questionCount} Questions</span>
      •
      <span class="percent">${skippedPercent}%</span>
    </div>
    <div class="analytics-item">
      <span class="title">
        <span class="red-rect rect"></span>
        Incorrect :
      </span>
      <span class="questions-count">${incorrectCount}/${questionCount} Questions</span>
      •
      <span class="percent">${incorrectPercent}%</span>
    </div>
  </div>
  <div class="questions-list">
    ${getQuestionsCards()}
  </div>
  `;

  return resultWrapper.outerHTML;
};

const getQuestionsCards = () => {
  const questionsList = document.createElement("div");
  questionsList.className = "questions-list";
  quiz.questions.forEach((question, index) => {
    const rectColorClass =
      getStatusClass(question.id) === "correct"
        ? "green-rect"
        : getStatusClass(question.id) === "skipped"
        ? "gray-rect"
        : "red-rect";
    const questionCard = document.createElement("div");
    questionCard.className = "question-card";
    questionCard.id = `question-${index + 1}`;
    questionCard.innerHTML = `
      <header class="question-card-header">
        <span class="question-number">
          <i class="bi bi-patch-question"></i>
          Question ${index + 1}
        </span>
        •
        <span class="question-status">
          <span class="${rectColorClass} rect"></span>
          ${
            getStatusClass(question.id).charAt(0).toUpperCase() +
            getStatusClass(question.id).slice(1)
          }
        </span>
        <label type="button" class="exclude-btn open-btn button">
          <i class="bi bi-chevron-down"></i>
          <input type="checkbox" id="drop-down" />
        </label>
      </header>
      <p class="question-text"></p>
      <div class="choices-list">
        ${getChoicesList(question.id)}
      </div>
      <footer class="question-card-footer">
        <span class="choices-count">${question.choices.length} Choices</span>
      </footer>
    `;
    questionCard.querySelector(".question-text").textContent = question.text;
    questionsList.appendChild(questionCard);
  });

  return questionsList.innerHTML;
};

const getChoicesList = (questionId) => {
  const choicesList = document.createElement("div");
  choicesList.className = "choices-list";
  const questions = quiz.questions.find((q) => q.id === questionId);

  if (questions) {
    questions.choices.forEach((choiceText, index) => {
      const choice = document.createElement("label");
      const Incorrect = examenResult.incorrectAnswers.find(
        (q) => q.id === questionId
      );
      const incorrectAnswerIndex = Incorrect?.answerIndex || null;
      const correctAnswerIndex = quiz.questions.find(
        (q) => q.id === questionId
      ).correctAnswerIndex;
      const isCorrectChoice = correctAnswerIndex === index;
      choice.className = `choice${isCorrectChoice ? " correct-answer" : ""}${
        incorrectAnswerIndex && incorrectAnswerIndex === index
          ? " incorrect-answer"
          : ""
      }`;
      choice.innerHTML = `
      <span class="choice-label">${String.fromCharCode(65 + index)}</span>
      <span class="choice-text"></span>
      `;
      choice.querySelector(".choice-text").textContent = choiceText;
      choicesList.appendChild(choice);
    });
  }

  return choicesList.innerHTML;
};
