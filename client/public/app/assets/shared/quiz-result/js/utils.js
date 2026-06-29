import { fetchData } from "../../../../../main_assets/js/utils.js";
import { openOverlayModal, scrollToView } from "../../../global/js/utils.js";

const getStatusClass = (quizResult, questionId) => {
  const isCorrect = quizResult.correctAnswers.includes(questionId);
  const isSkipped = quizResult.skippedQuestions.includes(questionId);

  return isCorrect ? "correct" : isSkipped ? "skipped" : "incorrect";
};

const getQuestionsCards = (questions, quizResult) => {
  const questionsList = document.createElement("div");
  questionsList.className = "questions-list";
  questions.forEach((question, index) => {
    const rectColorClass =
      getStatusClass(quizResult, question.id) === "correct"
        ? "green-rect"
        : getStatusClass(quizResult, question.id) === "skipped"
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
            getStatusClass(quizResult, question.id).charAt(0).toUpperCase() +
            getStatusClass(quizResult, question.id).slice(1)
          }
        </span>
        <label type="button" class="exclude-btn open-btn button">
          <i class="bi bi-chevron-down"></i>
          <input type="checkbox" id="drop-down" />
        </label>
      </header>
      <p class="question-text"></p>
      <div class="choices-list">
        ${getChoicesList(question, quizResult)}
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

const getChoicesList = (question, quizResult) => {
  const choicesList = document.createElement("div");
  choicesList.className = "choices-list";

  if (question) {
    question.choices.forEach((choiceText, index) => {
      const choice = document.createElement("label");
      const Incorrect = quizResult.incorrectAnswers.find(
        (q) => q.id === question.id
      );
      const incorrectAnswerIndex = Incorrect?.answerIndex;
      const correctAnswerIndex = question.correctAnswerIndex;
      const isCorrectChoice = correctAnswerIndex === index;
      choice.className = `choice${isCorrectChoice ? " correct-answer" : ""}${
        incorrectAnswerIndex === index ? " incorrect-answer" : ""
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

export const getResultOverlay = (quizResult, questions) => {
  const getPercentage = (count) => Math.round((count / questions.length) * 100);

  const submittedAt = new Date(quizResult.submittedAt);

  const finishedDate = submittedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const finishedTime = submittedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const questionCount = questions.length;
  const answeredCount =
    quizResult.correctAnswers.length + quizResult.incorrectAnswers.length;
  const correctCount = quizResult.correctAnswers.length;
  const skippedCount = quizResult.skippedQuestions.length;
  const incorrectCount = quizResult.incorrectAnswers.length;
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
  <h3 class="quiz-title">${quizResult.quizTitle || 'QUIZ TITLE'}</h3>
  <span class="session-name"><i class="bi bi-clock-history"></i> ${quizResult.sessionName || ''}</span>
  <div class="answered">
    <span class="answered-title">Answered :</span>
    <span class="answered-count">${answeredCount}/${questionCount} Questions</span>
    •
    <span class="answered-percent">${answeredPercent}%</span>
  </div>
  <div class="questions-rects">
  ${questions
    .map((question, index) => {
      return `
      <a href="#question-${index + 1}" class="status-rect ${getStatusClass(
        quizResult,
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
    ${getQuestionsCards(questions, quizResult)}
  </div>
  `;

  return resultWrapper.outerHTML;
};

const getQuizResult = async (quizId, userId, groupId) => {
  try {
    const quizData = await fetchData(
      `/examen-result?quizId=${quizId}&userId=${userId}&groupId=${groupId}`
    );
    return quizData;
  } catch (error) {
    console.error("Error fetching quiz result:", error);
    return null;
  }
};

export const openQuizResultOverlay = async ({
  quizData,
  quizId,
  userId = "self",
  groupId,
}) => {
  openOverlayModal(
    "quiz-result-overlay",
    [".close-result-overlay-btn"],
    async () => {
      if (!quizData) {
        quizData = await getQuizResult(quizId, userId, groupId);
      }
      return getResultOverlay(quizData.quizResult, quizData.questions);
    },
    (backDrop) => {
      backDrop
        .querySelector(".questions-rects")
        .addEventListener("click", (e) => {
          const questionsLink = e.target.closest("a.status-rect");
          if (questionsLink) scrollToView(e, questionsLink);
        });
    }
  );
};

export const openQuizResultsOverlay = async (quizId, groupId) => {
  openOverlayModal(
    "results-list-overlay",
    [".close-results-overlay-btn"],
    async () => {
      const { overlay } = await fetchData(
        `/results-list?quizId=${quizId}&groupId=${groupId}`
      );
      return overlay;
    },
    (backDrop) => {
      backDrop.addEventListener("click", (e) => {
        const resultBtn = e.target.closest(".show-result-btn");
        if (resultBtn) {
          const userId = resultBtn.getAttribute("data-user-id");
          openQuizResultOverlay({ quizId, userId, groupId });
        }
      });
    }
  );
};
