import { topSideBarMiddle } from "../../../global/js/variables.js";
import { navigateTo, toReadableDate } from "../../../global/js/utils.js";
import { openQuizResultOverlay } from "../../../shared/quiz-result/js/utils.js";
import {
  initFiltersInputListener,
  Loader,
} from "../../../shared/loader/js/utils.js";

const getScoreClass = (score) => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "poor";
};

const createPassedQuizCard = (quiz = {}) => {
  const {
    id = "",
    title = "Untitled Quiz",
    score = 0,
    groupName = "Unknown Group",
    submittedAt = "",
    sessionName = "Unknown Session",
  } = quiz;

  const card = document.createElement("div");
  card.className = "quiz-card card-item";
  card.innerHTML = `
        <div class="quiz-title-container info-container">
            <label class="quiz-title-label">
                <span class="icon-box"><i class="bi bi-card-text"></i></span>
                Quiz Title
            </label>
            <div class="quiz-title content"></div>
        </div>
        <div class="group-name-container info-container">
            <label class="group-name-label">
                <span class="icon-box">
                    <i class="bi bi-people"></i>
                </span>
                Group Name
            </label>
            <div class="group-name content"></div>
        </div>
        <div class="session-name-container info-container">
        <label class="session-name-label">
        <span class="icon-box">
        <i class="bi bi-journal-bookmark"></i>
        </span>
        Session Name
        </label>
        <div class="session-name content"></div>
        </div>
        <div class="submitted-at-container info-container">
            <label class="submitted-at-label">
                <span class="icon-box">
                    <i class="bi bi-calendar-check"></i>
                </span>
                Submitted At
            </label>
            <div class="submitted-at content"></div>
        </div>
        <div class="score-container info-container">
            <label class="score-label">
                <span class="icon-box">
                    <i class="bi bi-trophy"></i>
                </span>
                Score
            </label>
            <div class="score ${getScoreClass(score)} content">%</div>
        </div>
        <div class="action-btns">
            <button class="view-quiz-result-btn" data-quiz-id="${id}">
                <i class="bi bi-eye"></i>
                View Result
            </button>
            <button class="retake-quiz-btn" data-quiz-id="${id}">
                <i class="bi bi-arrow-repeat"></i>
                Retake
            </button>
        </div>
    `;

  card.querySelector(".quiz-title").textContent = title;
  card.querySelector(".score").textContent = `${score}%`;
  card.querySelector(".group-name").textContent = groupName;
  card.querySelector(".submitted-at").textContent = toReadableDate(submittedAt);
  card.querySelector(".session-name").textContent = sessionName;

  return card;
};

const createPassedQuizLoadingCard = () => {
  const loadingCard = document.createElement("div");
  loadingCard.className = "quiz-card loading-animation loading-card";
  loadingCard.innerHTML = `
        <div class="quiz-title-container info-container">
            <label class="quiz-title-label">
                <span class="icon-box"><i class="bi bi-card-text"></i></span>
                Quiz Title
            </label>
            <div class="quiz-title content loading-opacity-animation"></div>
        </div>
        <div class="score-container info-container">
            <label class="score-label">
                <span class="icon-box">
                    <i class="bi bi-trophy"></i>
                </span>
                Score
            </label>
            <div class="score content loading-opacity-animation"></div>
        </div>
        <div class="group-name-container info-container">
            <label class="group-name-label">
                <span class="icon-box">
                    <i class="bi bi-people"></i>
                </span>
                Group Name
            </label>
            <div class="group-name content loading-opacity-animation"></div>
        </div>
        <div class="submitted-at-container info-container">
            <label class="submitted-at-label">
                <span class="icon-box">
                    <i class="bi bi-calendar-check"></i>
                </span>
                Submitted At
            </label>
            <div class="submitted-at content loading-opacity-animation"></div>
        </div>
        <div class="session-name-container info-container">
            <label class="session-name-label">
                <span class="icon-box">
                    <i class="bi bi-journal-bookmark"></i>
                </span>
                Session Name
            </label>
            <div class="session-name content loading-opacity-animation"></div>
        </div>
        <div class="action-btns">
            <button style="pointer-events: none; height: 2.2rem; width: 7rem;" disabled class="loading-btn loading-opacity-animation">
            </button>
            <button style="pointer-events: none; height: 2.2rem; width: 7rem;" disabled class="loading-btn loading-opacity-animation" >
            </button>
        </div>
    `;
  return loadingCard;
};

const getCriteria = () => {
  let creteria = "";
  const sortDate = topSideBarMiddle.querySelector("#sort-checkbox")?.checked;
  const search = topSideBarMiddle.querySelector("#search-input")?.value;
  const date = topSideBarMiddle.querySelector('input[type="date"]');

  const sort = sortDate ? "asc" : "desc";
  creteria += `sort=${sort}`;
  const searchTerm = search ? search.toLowerCase().trim() : "";
  creteria += `&searchTerm=${searchTerm}`;
  const selectedDate = date ? date.value : "";
  creteria += `&date=${selectedDate}`;

  return creteria;
};

export const initLazyLoadingLoader = () => {
  const loader = new Loader(
    document.querySelector(".quizzes-list"),
    createPassedQuizCard,
    "/passed-quizzes?",
    createPassedQuizLoadingCard(),
    {
      getCriteria,
      emptyState: {
        noFilter: {
          icon: "bi-award",
          title: "No Passed Quizzes",
          desc: "You haven't completed any quizzes yet. Join a study session and take a quiz to see your achievements here!",
        },
        filtered: {
          icon: "bi-award",
          title: "No Passed Quizzes Found",
          desc: "No passed quizzes match your filter criteria.",
        },
      },
    }
  );

  initFiltersInputListener(loader, topSideBarMiddle);
  return loader;
};

export const handlePassedQuizCardBtns = (e) => {
  const viewQuizResultBtn = e.target.closest(".view-quiz-result-btn");
  const retakeQuizBtn = e.target.closest(".retake-quiz-btn");
  if (viewQuizResultBtn) {
    const quizId = viewQuizResultBtn.getAttribute("data-quiz-id");
    openQuizResultOverlay({ quizId });
  }

  if (retakeQuizBtn) {
    const quizId = retakeQuizBtn.getAttribute("data-quiz-id");
    navigateTo(`/quiz-play/${quizId}`);
  }
};
