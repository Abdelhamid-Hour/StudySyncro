import {
  fetchData,
  openOverlayModal,
  scrollToView,
  t,
} from "../../../global/js/utils.js";

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
          ${t("common:shared_quizzes.question_num", { num: index + 1 })}
        </span>
        •
        <span class="question-status">
          <span class="${rectColorClass} rect"></span>
          ${t("common:shared_quizzes.status." + getStatusClass(quizResult, question.id))}
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
        <span class="choices-count">${t("common:shared_quizzes.choices_count", { count: question.choices.length })}</span>
      </footer>
    `;
    questionCard.querySelector(".question-text").innerHTML =
      `<bdi>${question.text}</bdi>`;
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
        (q) => q.id === question.id,
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
      choice.querySelector(".choice-text").innerHTML =
        `<bdi>${choiceText}</bdi>`;
      choicesList.appendChild(choice);
    });
  }

  return choicesList.innerHTML;
};

export const getResultOverlay = (quizResult, questions) => {
  const getPercentage = (count) => Math.round((count / questions.length) * 100);

  const submittedAt = new Date(quizResult.submittedAt);

  const finishedDate = submittedAt.toLocaleDateString(
    t("common:locale", { defaultValue: "en-US" }),
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  );
  const finishedTime = submittedAt.toLocaleTimeString(
    t("common:locale", { defaultValue: "en-US" }),
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
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
    <span class="finished-date">${t("common:shared_quizzes.finished_date", {
      date: finishedDate,
    })}</span>
    •
    <span class="finished-time">${finishedTime}</span>
    •
    <span class="questions-count">
      <span class="icon-box">
        <i class="bi bi-patch-question"></i>
      </span>
      ${t("common:shared_quizzes.questions_count", { count: questionCount })}
    </span>
    <button type="button" class="exclude-btn close-result-overlay-btn">
      <i class="bi bi-x-lg"></i>
    </button>
  </header>
  <h3 class="quiz-title"><bdi>${
    quizResult.quizTitle || t("common:shared_quizzes.quiz_title_placeholder")
  }</bdi></h3>
  ${
    quizResult.sessionName
      ? `<span class="session-name"><i class="bi bi-clock-history"></i> <bdi>${quizResult.sessionName}</bdi></span>`
      : ""
  }
  <div class="answered">
    <span class="answered-title">${t("common:shared_quizzes.answered")} :</span>
    <span class="answered-count">${answeredCount}/${questionCount} ${t("common:quiz_card.questions",
    )}</span>
    •
    <span class="answered-percent">${answeredPercent}%</span>
  </div>
  <div class="questions-rects">
  ${questions
    .map((question, index) => {
      return `
      <a href="#question-${index + 1}" class="status-rect ${getStatusClass(
        quizResult,
        question.id,
      )}">${index + 1}</a>`;
    })
    .join("")}
  </div>
  <div class="analytics">
    <div class="analytics-item">
      <span class="title">
        <span class="green-rect rect"></span>
        ${t("common:shared_quizzes.status.correct")} :
      </span>
      <span class="questions-count">${correctCount}/${questionCount} ${t("common:quiz_card.questions",
      )}</span>
      •
      <span class="percent">${correctPercent}%</span>
    </div>
    <div class="analytics-item">
      <span class="title">
        <span class="gray-rect rect"></span>
        ${t("common:shared_quizzes.status.skipped")} :
      </span>
      <span class="questions-count">${skippedCount}/${questionCount} ${t("common:quiz_card.questions",
      )}</span>
      •
      <span class="percent">${skippedPercent}%</span>
    </div>
    <div class="analytics-item">
      <span class="title">
        <span class="red-rect rect"></span>
        ${t("common:shared_quizzes.status.incorrect")} :
      </span>
      <span class="questions-count">${incorrectCount}/${questionCount} ${t("common:quiz_card.questions",
      )}</span>
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
      `/examen-result?quizId=${quizId}&userId=${userId}&groupId=${groupId}`,
    );
    return quizData;
  } catch (error) {
    console.error("Error fetching quiz result:", error);
    return null;
  }
};

const getQuizResultSkeleton = () => {
  return `
  <div class="overlay-model quiz-result-overlay" style="pointer-events: none;">
    <header class="quiz-result-header">
      <span class="loading-opacity-animation badge gray-badge" style="width: 8rem; height: 1.5rem;"></span>
      •
      <span class="loading-opacity-animation badge gray-badge" style="width: 5rem; height: 1.5rem;"></span>
      •
      <span class="loading-opacity-animation badge gray-badge" style="width: 10rem; height: 1.5rem;"></span>
      <button type="button" class="exclude-btn close-result-overlay-btn" disabled>
        <i class="bi bi-x-lg"></i>
      </button>
    </header>
    <div class="quiz-title content loading-opacity-animation" style="width: 60%; height: 2rem;"></div>
    <div class="session-name content loading-opacity-animation" style="width: 40%; height: 1.5rem;"></div>
    <div class="answered content loading-opacity-animation" style="width: 50%; height: 1.5rem;"></div>
    <div class="questions-rects">
      ${Array(10).fill('<div class="status-rect gray-rect loading-opacity-animation" style="width: 2.2rem; height: 2.2rem;"></div>').join("")}
    </div>
    <div class="analytics">
      <div class="analytics-item content loading-opacity-animation" style="width: 50%; height: 1.5rem;"></div>
      <div class="analytics-item content loading-opacity-animation" style="width: 45%; height: 1.5rem;"></div>
      <div class="analytics-item content loading-opacity-animation" style="width: 48%; height: 1.5rem;"></div>
    </div>
    <div class="questions-list">
      ${Array(3).fill('<div class="question-card loading-animation loading-card" style="height: 12rem; width: 100%;"></div>').join("")}
    </div>
  </div>
  `;
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
    },
    getQuizResultSkeleton()
  );
};

import { Loader } from "../../loader/js/utils.js";

const getScoreClass = (score) => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "poor";
};

const createResultCard = (result) => {
  const tr = document.createElement("tr");
  tr.className = "card-item";
  
  const avatarHtml = result.user.photoURL 
    ? `<img src="${result.user.photoURL}" alt="avatar" width="32" height="32"/>`
    : `<h4>${result.user.fullName.charAt(0).toUpperCase()}</h4>`;
    
  tr.innerHTML = `
    <td>
      <div class="avatar-cover">
        ${avatarHtml}
      </div>
    </td>
    <td>${result.user.fullName}</td>
    <td>${result.resultDetails.submittedAt}</td>
    <td>${result.resultDetails.submittedCount}</td>
    <td class="${getScoreClass(result.score)}">${result.score}</td>
    <td>
      <button
        class="small-btn show-result-btn"
        data-user-id="${result.resultDetails.userId}"
      >
        <i class="bi bi-eye"></i>
        ${t("common:shared_terms.view_result")}
      </button>
    </td>
  `;
  return tr;
};

const getQuizResultsListSkeleton = () => {
  return `
  <div class="results-list-overlay overlay-model" style="pointer-events: none;">
    <header class="list-header">
      <h3 class="label">
        <i class="bi bi-people-fill"></i>
        ${t("common:results_overlay.title")}
      </h3>
      <div class="quiz-title">
        <span class="title-label">${t("common:quiz_card.quiz_title")}</span>
        <div class="loading-opacity-animation" style="width: 15rem; height: 1.8rem;"></div>
      </div>
      <button type="button" class="close-results-overlay-btn exclude-btn" disabled>
        <i class="bi bi-x-lg"></i>
      </button>
    </header>
    <div class="table-div">
      <table>
        <thead>
          <tr>
            <th>
              <div><i class="bi bi-person-circle"></i> ${t("common:results_overlay.table.profile")}</div>
            </th>
            <th>
              <div><i class="bi bi-person"></i> ${t("common:shared_terms.full_name")}</div>
            </th>
            <th>
              <div><i class="bi bi-calendar-event"></i> ${t("common:quiz_card.submitted_at")}</div>
            </th>
            <th>
              <div><i class="bi bi-list-ol"></i> ${t("common:results_overlay.table.answered_questions")}</div>
            </th>
            <th>
              <div><i class="bi bi-bar-chart-line"></i> ${t("common:quiz_card.score")}</div>
            </th>
            <th>
              <div><i class="bi bi-eye"></i> ${t("common:shared_terms.view_result")}</div>
            </th>
          </tr>
        </thead>
        <tbody class="results-list">
          ${Array(5)
            .fill(`
          <tr class="card-item loading-card">
            <td><div class="avatar-cover loading-opacity-animation" style="width: 32px; height: 32px;"></div></td>
            <td><div class="loading-opacity-animation" style="width: 70%; height: 1.2rem;"></div></td>
            <td><div class="loading-opacity-animation" style="width: 60%; height: 1.2rem;"></div></td>
            <td><div class="loading-opacity-animation" style="width: 40%; height: 1.2rem;"></div></td>
            <td><div class="loading-opacity-animation" style="width: 50%; height: 1.2rem;"></div></td>
            <td><div class="loading-opacity-animation" style="width: 80%; height: 2rem;"></div></td>
          </tr>
          `)
            .join("")}
        </tbody>
      </table>
    </div>
  </div>
  `;
};

export const openQuizResultsOverlay = async (quizId, groupId) => {
  openOverlayModal(
    "results-list-overlay",
    [".close-results-overlay-btn"],
    async () => {
      const { overlay } = await fetchData(
        `/results-list?quizId=${quizId}&groupId=${groupId}`,
      );
      return overlay;
    },
    (backDrop) => {
      const tbody = backDrop.querySelector(".results-list");
      if (tbody) {
        const loadingBox = document.createElement("tr");
        loadingBox.className = "loading-card";
        loadingBox.innerHTML = `
          <td colspan="6" style="text-align: center; padding: 1rem;">
            <div class="loader-spinner"></div>
          </td>
        `;
        
        new Loader(
          tbody,
          createResultCard,
          `/results-list?quizId=${quizId}&groupId=${groupId}&`,
          loadingBox,
          {
            emptyState: {
              noFilter: {
                icon: "bi-bar-chart-line",
                title: t("common:skeletons.no_results_title"),
                desc: t("common:results_overlay.no_results_description"),
              }
            }
          }
        );
      }

      backDrop.addEventListener("click", (e) => {
        const resultBtn = e.target.closest(".show-result-btn");
        if (resultBtn) {
          const userId = resultBtn.getAttribute("data-user-id");
          openQuizResultOverlay({ quizId, userId, groupId });
        }
      });
    },
    getQuizResultsListSkeleton()
  );
};
