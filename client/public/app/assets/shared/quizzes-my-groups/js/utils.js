import {
  boxRowCount,
  topSideBarMiddle,
} from '../../../global/js/dom-variables.js';
import {
  initFiltersInputListener,
  Loader,
} from '../../quizzes-groups/js/utils.js';

export const initLazyLoadingLoader = () => {
  const loader = new Loader(
    document.querySelector('.quizzes-list'),
    '200px',
    getcreateQuizCardFunc,
    '/quizzes',
    createLoadingCard(),
    () => getCreteria()
  );

  initFiltersInputListener(loader, topSideBarMiddle);
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
  editBtn.setAttribute('href', `/app/quizzes/my/${id}/edit`);

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
