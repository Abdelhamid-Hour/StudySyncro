import {
  sendData,
  showMessageBlock,
} from "../../../../../main_assets/js/utils.js";
import {
  globalTooltip,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  topSideBarMiddle,
} from "../../../global/js/variables.js";
import {
  openOverlayModal,
  resetTooltip,
  showErrorTooltip,
  navigateTo,
  getLoader,
  handleApiAction,
} from "../../../global/js/utils.js";
import {
  handleFormSubmit,
  setUpSelectMenu,
} from "../../../shared/forms/js/utils.js";
import {
  initFiltersInputListener,
  Loader,
} from "../../../shared/loader/js/utils.js";

export const handleQuizCreateClick = () => {
  openOverlayModal(
    "create-quiz-overlay",
    [".close-quiz-overlay"],
    getQuizOverlay,
    setUpQuizOverlay
  );
};

const setUpQuizOverlay = (backdropElement) => {
  setUpSelectMenu(backdropElement.querySelector(".subject-field"));
  initQuizForm();
};

const handleCreateQuizSubmit = async (quizData, form, createBtn) => {
  if (form.isCreating) return;
  try {
    form.isCreating = true;
    createBtn.disabled = true;
    createBtn.innerHTML = getLoader();
    const { quizId } = await sendData("/api/create-quiz", { quizData });
    showMessageBlock("Quiz created successfully.", "success");
    navigateTo(`/quizzes/my/${quizId}/edit`);
  } catch (error) {
    console.error("Error: ", error);
    showMessageBlock(error.message, "error");
  } finally {
    form.isCreating = false;
    createBtn.disabled = false;
    createBtn.innerHTML = "Create";
  }
  // ? its not necessary to reset the form here, as the overlay will be closed
};

export const initQuizForm = () => {
  const form = document.querySelector("form");
  const quizTitle = form.querySelector(".quiz-title-field input");
  const subject = form.querySelector(".subject-field input");
  const createBtn = form.querySelector(".create-btn");

  handleFormSubmit(
    form,
    () =>
      chechQuizValues({
        quizTitle,
        subject,
      }),
    (quizData) => handleCreateQuizSubmit(quizData, form, createBtn)
  );
};

const chechQuizValues = (inputs) => {
  const { quizTitle, subject } = inputs;
  const quizTitleValue = quizTitle?.value ?? "";
  const subjectValue = subject?.value ?? "";

  if (!quizTitleValue.trim()) {
    showErrorTooltip("Quiz Title is required.", quizTitle);
    return false;
  } else if (
    quizTitleValue.length < NAME_TITLE_MIN_LENGTH ||
    quizTitleValue.length > NAME_TITLE_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Quiz Title must be between ${NAME_TITLE_MIN_LENGTH} and ${NAME_TITLE_MAX_LENGTH} characters.`,
      quizTitle
    );
    return false;
  } else {
    resetTooltip(globalTooltip, quizTitle.closest(".field-container"));
  }

  if (!subjectValue.trim()) {
    showErrorTooltip("Subject is required.", subject);
    return false;
  } else {
    resetTooltip(globalTooltip, subject.closest(".field-container"));
  }

  return true;
};

const getQuizOverlay = () => `<div class="overlay-model create-quiz-overlay">
        <header>
          <h3>Create New Quiz</h3>
          <button
            type="button"
            class="exclude-btn close-quiz-overlay"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </header>
        <form novalidate>
          <div class="field-container quiz-title-field">
            <div class="field-icon-container">
              <span class="icon-box">
                <i class="bi bi-clipboard-check"></i>
                <i class="bi bi-info-circle"></i>
              </span>
            </div>
            <input
              type="text"
              required
              id="quiz-title"
              name="quiz-title"
              class="input"
              placeholder="Title"
            />
          </div>
          <div class="field-container subject-field">
            <div class="field-icon-container">
              <i class="bi bi-journal-text"></i>
            </div>
            <div class="select-trigger input">
              <button type="button" class="exclude-btn open-drop-down-btn">
                <span class="subject-value">Subject</span>
                <input type="hidden" name="subject" value="" />
                <i class="bi bi-chevron-down"></i>
              </button>
              <div
                class="select-menu drop-down-menu overlay"
              ></div>
            </div>
          </div>
          <button type="submit" class="blue-btn create-btn">Create</button>
        </form>
      </div>`;

const getCriteria = () => {
  let creteria = "";
  const sortDate = topSideBarMiddle.querySelector("#sort-checkbox")?.checked;
  const search = topSideBarMiddle.querySelector("#search-input")?.value;
  const publishedStatus = topSideBarMiddle.querySelector("#published")?.checked;
  const draftStatus = topSideBarMiddle.querySelector("#draft")?.checked;

  const status = [];
  if (publishedStatus) status.push("published");
  if (draftStatus) status.push("draft");

  const sort = sortDate ? "asc" : "desc";
  creteria += `sort=${sort}`;
  const searchTerm = search ? search.trim() : "";
  creteria += `&searchTerm=${searchTerm}`;
  creteria += `&status=${status.join(",")}`;

  return creteria;
};

const getcreateQuizCardFunc = (quiz = {}) => {
  const {
    id = "",
    title = "Untitled Quiz",
    questionsCount = 0,
    sharedGroups = 0,
    sharedSessions = 0,
    subject = "Unknown",
    status = "",
  } = quiz;

  // Create a wrapper div
  const card = document.createElement("div");
  card.className = "card-item";
  card.dataset.quizId = id;
  card.innerHTML = `
      <header class="quiz-card-header">
        ${
          status === "draft"
            ? `<span class="badge gray-badge has-tooltip" data-tooltip="Add at least 1 question to publish">
                <i class="bi bi-pencil"></i>
                Draft
              </span>`
            : `<span class="badge green-badge">
                <i class="bi bi-check"></i>
                Published
              </span>`
        }
        <div>
          <button
            type="button"
            class="exclude-btn quiz-card-menu-btn open-drop-down-btn"
          >
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <div class="drop-down-menu overlay">
            <div class="drop-down-group">
              <button
                type="button"
                class="drop-down-item exclude-btn edit-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-pencil-square"></i>
                Edit
              </button>
              <button
                type="button"
                class="drop-down-item exclude-btn preview-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-eye"></i>
                Preview
              </button>
              <button
                type="button"
                class="drop-down-item exclude-btn duplicate-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-files"></i>
                Duplicate
              </button>
              <button
                type="button"
                class="drop-down-item exclude-btn red-btn remove-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-trash3"></i>
                Remove
              </button>
            </div>
          </div>
        </div>
      </header>
      <div class="quiz-title-container info-container">
        <label class="quiz-title-label">
          <span class="icon-box"><i class="bi bi-card-text"></i></span>
          Quiz title
        </label>
        <div class="quiz-title content"></div>
      </div>
      <div class="questions-count-container info-container small-container">
        <label class="questions-count-label">
          <span class="icon-box"><i class="bi bi-question-circle"></i></span>
          Questions
        </label>
        <span class="count content"></span>
      </div>
      <div class="shared-in-container info-container">
        <label class="shared-in-label">
          <span class="icon-box"><i class="bi bi-people"></i></span>
          Shared in
        </label>
        <div class="content">
          <span class="count content">
            ${formatNumber(sharedGroups)}
            <sup>Gr</sup>
            | ${formatNumber(sharedSessions)}
            <sup>Ses</sup>
          </span>
        </div>
      </div>
      <div class="subject-container info-container small-container">
        <label class="subject-label">
          <span class="icon-box"><i class="bi bi-book"></i></span>
          Subject
        </label>
        <span class="subject content">${subject}</span>
      </div>
  `;

  // Set values safely
  card.querySelector(".quiz-title.content").textContent = title;
  card.querySelector(".questions-count-container .count.content").textContent =
    formatNumber(questionsCount);
  card.querySelector(".subject-container .subject.content").textContent =
    subject;

  return card;
};

const createUserQuizLoadingCard = () => {
  const loadingCard = document.createElement("div");
  loadingCard.className = "quiz-card loading-animation loading-card";
  loadingCard.innerHTML = `
      <div class="quiz-title-container info-container">
        <label class="quiz-title-label">
          <span class="icon-box"><i class="bi bi-card-text"></i></span>
          Quiz title
        </label>
        <div class="quiz-title content loading-opacity-animation"></div>
      </div>
      <div class="questions-count-container info-container small-container">
        <label class="questions-count-label">
          <span class="icon-box"><i class="bi bi-question-circle"></i></span>
          Questions
        </label>
        <span class="count content loading-opacity-animation"></span>
      </div>
      <div class="shared-in-container info-container">
        <label class="shared-in-label">
          <span class="icon-box"><i class="bi bi-people"></i></span>
          Shared in
        </label>
        <div class="content">
          <span class="count content loading-opacity-animation"></span>
        </div>
      </div>
      <div class="subject-container info-container small-container">
        <label class="subject-label">
          <span class="icon-box"><i class="bi bi-book"></i></span>
          Subject
        </label>
        <span class="subject content loading-opacity-animation"></span>
      </div>
      <button class="button loading-btn" disabled>
        <i class="bi bi-pencil-square"></i>
        Edit Quiz
      </button>
  `;
  return loadingCard;
};

export const initLazyLoadingLoader = () => {
  const loader = new Loader(
    document.querySelector(".quizzes-list"),
    getcreateQuizCardFunc,
    "/quizzes?",
    createUserQuizLoadingCard(),
    {
      getCriteria,
    }
  );

  initFiltersInputListener(loader, topSideBarMiddle);
  return loader;
};

export const handleQuizCardBtns = (e) => {
  const quizCard = e.target.closest(".quiz-card");
  if (quizCard && !e.target.closest(".quiz-card-menu-btn, .drop-down-menu")) {
    navigateTo(`/quizzes/my/${quizCard.dataset.quizId}/edit`);
  }

  const editBtn = e.target.closest(".edit-quiz-menu-btn");
  if (editBtn) {
    navigateTo(`/quizzes/my/${editBtn.dataset.quizId}/edit`);
  }

  const previewBtn = e.target.closest(".preview-quiz-menu-btn");
  if (previewBtn) {
    navigateTo(`/quiz-play/${previewBtn.dataset.quizId}`);
  }

  const deleteBtn = e.target.closest(".remove-quiz-menu-btn");
  if (deleteBtn) {
    const quizId = deleteBtn.dataset.quizId;
    handleApiAction("/remove-quiz/" + quizId, {}, null, {
      successMsg: "Quiz deleted successfully.",
      onSuccess: () => quizCard?.remove(),
      method: "DELETE",
    });
  }

  const duplicateBtn = e.target.closest(".duplicate-quiz-menu-btn");
  if (duplicateBtn) {
    const quizId = duplicateBtn.dataset.quizId;
    handleApiAction("/duplicate-quiz/", { quizId }, null, {
      successMsg: "Quiz duplicated successfully.",
      onSuccess: (res) => {
        navigateTo(`/quizzes/my/${res.newQuizId}/edit`);
      },
      method: "POST",
    });
  }
};
