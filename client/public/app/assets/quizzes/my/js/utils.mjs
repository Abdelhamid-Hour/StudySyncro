import {
  enableMobileTabs,
  formatNumber,
  handleApiAction,
  navigateTo,
  openOverlayModal,
  resetTooltip,
  sendData,
  showErrorTooltip,
  showMessageBlock,
  t,
} from "../../../global/js/utils.mjs";
import {
  globalTooltip,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  topSideBarMiddle,
} from "../../../global/js/variables.mjs";
import {
  handleFormSubmit,
  setUpSelectMenu,
} from "../../../shared/forms/js/utils.mjs";
import {
  initFiltersInputListener,
  Loader,
} from "../../../shared/loader/js/utils.mjs";

export const handleQuizCreateClick = () => {
  openOverlayModal(
    "create-quiz-overlay",
    [".close-quiz-overlay"],
    getQuizOverlay,
    setUpQuizOverlay,
  );
};

const handleQuizDuplicateClick = (quizId) => {
  openOverlayModal(
    "duplicate-quiz-overlay",
    [".close-duplicate-quiz-overlay"],
    getDuplicateQuizOverlay,
    (backdropElement) => setUpDuplicateQuizOverlay(backdropElement, quizId),
  );
};

const setUpQuizOverlay = (backdropElement) => {
  setUpSelectMenu(backdropElement.querySelector(".subject-field"));
  initQuizForm();
};

const setUpDuplicateQuizOverlay = (backdropElement, quizId) => {
  const form = backdropElement.querySelector("form");
  const quizTitle = form.querySelector(".quiz-title-field input");
  const duplicateBtn = form.querySelector(".duplicate-btn");

  quizTitle.focus();

  handleFormSubmit(
    form,
    () => validateQuizTitleField(quizTitle),
    (quizData) =>
      handleDuplicateQuizSubmit(
        quizData,
        form,
        duplicateBtn,
        quizId,
        quizTitle,
      ),
  );
};

const handleCreateQuizSubmit = async (quizData, form, createBtn) => {
  const quizTitleInput = form.querySelector(".quiz-title-field input");

  return handleApiAction("/create-quiz", { quizData }, createBtn, {
    successMsg: t("quizzes:alerts.quiz_created"),
    getExtraData: async () => {
      const quizTitle = quizData["quiz-title"] ?? "";
      const titleIsAvailable = await checkQuizTitleAvailability(
        quizTitle,
        quizTitleInput,
      );

      if (!titleIsAvailable) return null;

      return {};
    },
    onSuccess: ({ quizId }) => {
      navigateTo(`/quizzes/my/${quizId}/edit`);
    },
  });
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
    (quizData) => handleCreateQuizSubmit(quizData, form, createBtn),
  );
};

const handleDuplicateQuizSubmit = async (
  quizData,
  form,
  duplicateBtn,
  quizId,
  quizTitleInput,
) => {
  const title = quizData.title ?? "";

  return handleApiAction("/duplicate-quiz", { quizId }, duplicateBtn, {
    successMsg: t("quizzes:alerts.quiz_duplicated"),
    getExtraData: async () => {
      const titleIsAvailable = await checkQuizTitleAvailability(
        title,
        quizTitleInput,
      );

      if (!titleIsAvailable) return null;

      return { title };
    },
    onSuccess: (res) => {
      navigateTo(`/quizzes/my/${res.newQuizId}/edit`);
    },
  });
};

const validateQuizTitleField = (quizTitleInput) => {
  const quizTitleValue = quizTitleInput?.value ?? "";

  if (!quizTitleValue.trim()) {
    showErrorTooltip(t("quizzes:validation.title_required"), quizTitleInput);
    return false;
  }

  if (
    quizTitleValue.length < NAME_TITLE_MIN_LENGTH ||
    quizTitleValue.length > NAME_TITLE_MAX_LENGTH
  ) {
    showErrorTooltip(
      t("quizzes:validation.title_length", {
        min: NAME_TITLE_MIN_LENGTH,
        max: NAME_TITLE_MAX_LENGTH,
      }),
      quizTitleInput,
    );
    return false;
  }

  resetTooltip(globalTooltip, quizTitleInput.closest(".field-container"));
  return true;
};

const checkQuizTitleAvailability = async (title, quizTitleInput) => {
  if (!validateQuizTitleField(quizTitleInput)) return false;

  try {
    const { available, message } = await sendData("/api/check-quiz-title", {
      title,
    });

    if (!available) {
      showErrorTooltip(message, quizTitleInput);
      return false;
    }

    resetTooltip(globalTooltip, quizTitleInput.closest(".field-container"));
    return true;
  } catch (error) {
    const isNative = error.isNative || error.data?.isNative;
    const notifType =
      error.type || error.data?.type || (isNative ? "info" : "error");
    if (!isNative) console.error("Error: ", error);
    showMessageBlock(error.message, notifType);
    return false;
  }
};

const chechQuizValues = (inputs) => {
  const { quizTitle, subject } = inputs;
  const subjectValue = subject?.value ?? "";

  if (!validateQuizTitleField(quizTitle)) {
    return false;
  }

  if (!subjectValue.trim()) {
    showErrorTooltip(t("common:shared_terms.subject_is_required"), subject);
    return false;
  } else {
    resetTooltip(globalTooltip, subject.closest(".field-container"));
  }

  return true;
};

const getQuizOverlay = () => `<div class="overlay-model create-quiz-overlay">
        <header>
          <h3>${t("quizzes:create_new_quiz")}</h3>
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
              placeholder="${t("common:shared_terms.title")}"
            />
          </div>
          <div class="field-container subject-field">
            <div class="field-icon-container">
              <i class="bi bi-journal-text"></i>
            </div>
            <div class="select-trigger input">
              <button type="button" class="exclude-btn open-drop-down-btn">
                <span class="subject-value">${t("common:quiz_card.subject")}</span>
                <input type="hidden" name="subject" value="" />
                <i class="bi bi-chevron-down"></i>
              </button>
              <div
                class="select-menu drop-down-menu overlay"
              ></div>
            </div>
          </div>
          <button type="submit" class="blue-btn create-btn">${t("common:shared_terms.create")}</button>
        </form>
      </div>`;

const getDuplicateQuizOverlay =
  () => `<div class="overlay-model duplicate-quiz-overlay">
        <header>
          <h3>${t("quizzes:duplicate_quiz")}</h3>
          <button
            type="button"
            class="exclude-btn close-duplicate-quiz-overlay"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </header>
        <form novalidate>
          <div class="field-container quiz-title-field">
            <div class="field-icon-container">
              <span class="icon-box">
                <i class="bi bi-files"></i>
                <i class="bi bi-info-circle"></i>
              </span>
            </div>
            <input
              type="text"
              required
              id="duplicate-quiz-title"
              name="title"
              class="input"
              placeholder="${t("quizzes:new_title_placeholder")}"
            />
          </div>
          <button type="submit" class="blue-btn create-btn duplicate-btn">${t("quizzes:duplicate")}</button>
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
  const searchTerm = search ? search.toLowerCase().trim() : "";
  creteria += `&searchTerm=${searchTerm}`;
  creteria += `&status=${status.join(",")}`;

  return creteria;
};

const getcreateQuizCardFunc = (quiz = {}) => {
  const {
    id = "",
    title = "",
    questionsCount = 0,
    sharedGroups = 0,
    sharedSessions = 0,
    subject = "",
    status = "",
  } = quiz;

  // Create a wrapper div
  const card = document.createElement("div");
  card.className = "quiz-card card-item";
  card.dataset.quizId = id;
  card.innerHTML = `
      <header class="quiz-card-header">
        ${
          status === "draft"
            ? `<span class="badge gray-badge has-tooltip" data-tooltip="${t("common:shared_terms.add_at_least_1_question_to_publish")}">
                <i class="bi bi-pencil"></i>
                ${t("common:filters.draft")}
              </span>`
            : `<span class="badge green-badge">
                <i class="bi bi-check"></i>
                ${t("common:filters.published")}
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
                ${t("common:shared_terms.edit")}
              </button>
              <button
                type="button"
                class="drop-down-item exclude-btn preview-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-eye"></i>
                ${t("quizzes:preview")}
              </button>
              <button
                type="button"
                class="drop-down-item exclude-btn duplicate-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-files"></i>
                ${t("quizzes:duplicate")}
              </button>
              <button
                type="button"
                class="drop-down-item exclude-btn red-btn remove-quiz-menu-btn"
                data-quiz-id="${id}"
              >
                <i class="bi bi-trash3"></i>
                ${t("common:modals.remove")}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div class="quiz-title-container info-container">
        <label class="quiz-title-label">
          <span class="icon-box"><i class="bi bi-card-text"></i></span>
          ${t("common:quiz_card.quiz_title")}
        </label>
        <div class="quiz-title content"></div>
      </div>
      <div class="questions-count-container info-container small-container">
        <label class="questions-count-label">
          <span class="icon-box"><i class="bi bi-question-circle"></i></span>
          ${t("common:quiz_card.questions")}
        </label>
        <span class="count content"></span>
      </div>
      <div class="shared-in-container info-container">
        <label class="shared-in-label">
          <span class="icon-box"><i class="bi bi-people"></i></span>
          ${t("common:quiz_card.shared_in")}
        </label>
        <div class="content">
          <span class="count content has-tooltip" data-tooltip="${t("quizzes:tooltips.groups_sessions")}">
            ${formatNumber(sharedGroups)}
            <sup>${t("common:quiz_card.groups_abbr")}</sup>
            | ${formatNumber(sharedSessions)}
            <sup>${t("common:quiz_card.sessions_abbr")}</sup>
          </span>
        </div>
      </div>
      <div class="subject-container info-container small-container">
        <label class="subject-label">
          <span class="icon-box"><i class="bi bi-book"></i></span>
          ${t("common:quiz_card.subject")}
        </label>
        <span class="subject content"></span>
      </div>
  `;

  // Set values safely
  card.querySelector(".quiz-title.content").textContent =
    title || t("common:shared_quizzes.quiz_title_placeholder");
  card.querySelector(".questions-count-container .count.content").textContent =
    formatNumber(questionsCount);
  card.querySelector(".subject-container .subject.content").textContent =
    subject
      ? t("common:subjects." + subject, { defaultValue: subject })
      : t("quizzes:unknown");

  return card;
};

const createUserQuizLoadingCard = () => {
  const loadingCard = document.createElement("div");
  loadingCard.className = "quiz-card loading-animation loading-card";
  loadingCard.innerHTML = `
      <header class="quiz-card-header">
        <span class="badge gray-badge loading-opacity-animation" style="width: 5rem; height: 1.5rem;"></span>
        <button type="button" class="exclude-btn quiz-card-menu-btn" disabled>
          <i class="bi bi-three-dots-vertical"></i>
        </button>
      </header>
      <div class="quiz-title-container info-container">
        <label class="quiz-title-label">
          <span class="icon-box"><i class="bi bi-card-text"></i></span>
          ${t("common:quiz_card.quiz_title")}
        </label>
        <div class="quiz-title content loading-opacity-animation"></div>
      </div>
      <div class="questions-count-container info-container small-container">
        <label class="questions-count-label">
          <span class="icon-box"><i class="bi bi-question-circle"></i></span>
          ${t("common:quiz_card.questions")}
        </label>
        <span class="count content loading-opacity-animation"></span>
      </div>
      <div class="shared-in-container info-container">
        <label class="shared-in-label">
          <span class="icon-box"><i class="bi bi-people"></i></span>
          ${t("common:quiz_card.shared_in")}
        </label>
        <div class="content">
          <span class="count content loading-opacity-animation"></span>
        </div>
      </div>
      <div class="subject-container info-container small-container">
        <label class="subject-label">
          <span class="icon-box"><i class="bi bi-book"></i></span>
          ${t("common:quiz_card.subject")}
        </label>
        <span class="subject content loading-opacity-animation"></span>
      </div>
  `;
  return loadingCard;
};

export const initLazyLoadingLoader = () => {
  enableMobileTabs();
  const loader = new Loader(
    document.querySelector(".quizzes-list"),
    getcreateQuizCardFunc,
    "/quizzes?",
    createUserQuizLoadingCard(),
    {
      getCriteria,
      emptyState: {
        noFilter: {
          icon: "bi-file-earmark-plus",
          title: t("quizzes:skeletons.no_quizzes_created_title"),
          desc: t("quizzes:skeletons.no_quizzes_created_desc"),
        },
        filtered: {
          icon: "bi-file-earmark-plus",
          title: t("common:shared_terms.no_quizzes_found"),
          desc: t("quizzes:skeletons.no_quizzes_found_desc"),
        },
      },
    },
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
      successMsg: t("quizzes:alerts.quiz_deleted"),
      onSuccess: () => quizCard?.remove(),
      method: "DELETE",
    });
  }

  const duplicateBtn = e.target.closest(".duplicate-quiz-menu-btn");
  if (duplicateBtn) {
    handleQuizDuplicateClick(duplicateBtn.dataset.quizId);
  }
};
