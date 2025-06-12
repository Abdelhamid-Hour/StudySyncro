import {
  sendData,
  showMessageBlock,
} from '../../../../main_assets/js/utils.js';
import {
  globalTooltip,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  topSideBarMiddle,
} from '../../global/js/dom-variables.js';
import {
  openOverlayModal,
  resetTooltip,
  showErrorTooltip,
  navigateTo,
  getLoader,
} from '../../global/js/utils.js';
import {
  handleFormSubmit,
  setUpSelectMenu,
} from '../../shared/forms/js/utils.js';
import {
  initFiltersInputListener,
  Loader,
} from '../../shared/quizzes-groups/js/utils.js';

export const initLazyLoadingLoader = () => {
  const loader = new Loader(
    document.querySelector('.quizzes-list'),
    '200px',
    getcreateQuizCardFunc,
    '/quizzes',
    createLoadingCard(),
    () => getCreteria()
  );

  initFiltersInputListener(loader);
  return loader;
};

const getCreteria = () => {
  let creteria = '';
  const sortDate = topSideBarMiddle.querySelector('#sort-checkbox')?.checked;
  const search = topSideBarMiddle.querySelector('#search-input')?.value;

  const sort = sortDate ? 'asc' : 'desc';
  creteria += `sort=${sort}`;
  const searchTerm = search ? search.trim() : '';
  creteria += `&searchTerm=${searchTerm}`;

  return creteria;
};

const getcreateQuizCardFunc = (quiz = {}) => {
  const {
    id = '',
    title = 'Untitled Quiz',
    questionsCount = 0,
    sharedGroups = 0,
    sharedSessions = 0,
    subject = 'Unknown',
  } = quiz;

  // Create a wrapper div
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="quiz-card">
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
          <span class="count content"></span>
        </div>
      </div>
      <div class="subject-container info-container small-container">
        <label class="subject-label">
          <span class="icon-box"><i class="bi bi-book"></i></span>
          Subject
        </label>
        <span class="subject content"></span>
      </div>
      <a class="button route-link edit-quiz-btn">
        <i class="bi bi-pencil-square"></i>
        Edit Quiz
      </a>
    </div>
  `;

  // Set values safely
  const card = wrapper.firstElementChild;
  card.querySelector('.quiz-title.content').textContent = title;
  card.querySelector('.questions-count-container .count.content').textContent =
    questionsCount;
  card.querySelector(
    '.shared-in-container .count.content'
  ).textContent = `${sharedGroups} Groups | ${sharedSessions} Sessions`;
  card.querySelector('.subject-container .subject.content').textContent =
    subject;
  const editBtn = card.querySelector('.edit-quiz-btn');
  editBtn.setAttribute('href', `/app/quizzes/${id}/edit`);

  return card;
};

export const createLoadingCard = () => {
  const loadingCard = document.createElement('div');
  loadingCard.className = 'quiz-card loading-animation loading-card';
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

export const handleQuizCreateClick = () => {
  openOverlayModal(
    'create-quiz-overlay',
    ['.close-quiz-overlay'],
    getQuizOverlay,
    setUpQuizOverlay
  );
};
const setUpQuizOverlay = (backdropElement) => {
  setUpSelectMenu(backdropElement.querySelector('.subject-field'));
  initQuizForm();
};

const handleCreateQuizSubmit = async (quizData, form, createBtn) => {
  if (form.isCreating) return;
  try {
    form.isCreating = true;
    createBtn.disabled = true;
    createBtn.innerHTML = getLoader();
    const { quizId } = await sendData('/api/create-quiz', { quizData });
    showMessageBlock('Quiz created successfully.', 'success');
    navigateTo(`/quizzes/${quizId}/edit`);
  } catch (error) {
    console.error('Error: ', error);
    showMessageBlock(error.message, 'error');
  } finally {
    form.isCreating = false;
    createBtn.disabled = false;
    createBtn.innerHTML = 'Create';
  }
  // ? its not necessary to reset the form here, as the overlay will be closed
};

export const initQuizForm = () => {
  const form = document.querySelector('form');
  const quizTitle = form.querySelector('.quiz-title-field input');
  const subject = form.querySelector('.subject-field input');
  const createBtn = form.querySelector('.create-btn');

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
  const quizTitleValue = quizTitle?.value ?? '';
  const subjectValue = subject?.value ?? '';

  if (!quizTitleValue.trim()) {
    showErrorTooltip('Quiz Title is required.', quizTitle);
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
    resetTooltip(globalTooltip, quizTitle.closest('.field-container'));
  }

  if (!subjectValue.trim()) {
    showErrorTooltip('Subject is required.', subject);
    return false;
  } else {
    resetTooltip(globalTooltip, subject.closest('.field-container'));
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
