import {
  fetchData,
  showMessageBlock,
} from '../../../../../../main_assets/js/utils.js';
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  globalTooltip,
  hoverTooltip,
  MAX_MEMBERS,
  MIN_MEMBERS,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  SESSION_MAX_DURATION,
  SESSION_MIN_DURATION,
  TASK_MAX_DURATION,
  TASK_MIN_DURATION,
} from '../../../../global/js/dom-variables.js';
import {
  getLoader,
  resetTooltip,
  showConfirmationBox,
  openOverlayModal,
  millisecondsToHMFormat,
  showErrorTooltip,
} from '../../../../global/js/utils.js';
import {
  levelValues,
  visibilityValues,
} from '../../../../shared/forms/js/dom-variables.js';
import {
  countCharsTextarea,
  handleFormSubmit,
  setUpSubjectSelectMenu,
  setUpSwitchBtn,
} from '../../../../shared/forms/js/utils.js';
import { initAndDiplayErrorTooltip } from '../../../../shared/chat/js/utils.js';
import {
  handletTasksListners,
  setUpDragAndDrop,
  Task,
} from '../../../../shared/tasks/js/utils.js';
import {
  groupLeftSideBar,
  showInfoBtn,
  groupInfoElementsMap,
  groupLeftSideBarContent,
  groupLeftSideBarTitle,
} from './dom-variables.js';

export const handleLeavingGroup = async () => {
  await showConfirmationBox(
    'exclamation',
    'Leave Group',
    'Are you sure you want to leave this group?',
    'Cancel',
    'Leave'
  );
};

export const handleGroupInfo = async () => {
  await openGroupLeftSideBar('/group-info');
  const removeGroupBtn = document.querySelector('.remove-group-btn');
  if (removeGroupBtn) {
    removeGroupBtn.addEventListener('click', handleRemoveGroup);
  } else {
    document
      .querySelector('.leave-group-btn')
      .addEventListener('click', handleLeavingGroup);
  }
};

export const handleShowInfoBtnClick = async () => {
  if (groupLeftSideBar.classList.contains('close')) {
    handleGroupInfo();
  } else {
    closeGroupLeftSideBar();
  }
};

export let groupInfo;

export const openGroupLeftSideBar = async (route) => {
  groupLeftSideBarContent.innerHTML = getLoader();
  groupLeftSideBar.classList.remove('close');

  showInfoBtn
    .querySelector('i')
    .classList.replace('bi-info-circle', 'bi-x-circle');
  showInfoBtn.setAttribute('data-tooltip', 'Close group info');

  try {
    const groupId = groupLeftSideBarContent?.dataset.groupId;
    const { template, title, count, info } = await fetchData(
      `${route}/${groupId}`
    );

    if (info) {
      groupInfo = info;
    }

    groupLeftSideBarContent.innerHTML = template;
    groupLeftSideBarTitle.textContent = title;
    if (count) {
      const badge = document.createElement('span');
      badge.className = 'badge simple-badge';
      badge.textContent = count;
      groupLeftSideBarTitle.appendChild(badge);
    }
  } catch (error) {
    console.log(error);
    showMessageBlock(
      'Error loading group info. Please try again later.',
      'error'
    );
  }
};

const getSessionCreationOverlay = () => {
  const sessionOverlay = `
        <div class="create-session-overlay overlay-model">
        <header>
          <h3>Create New Session</h3>
          <button type="button" class="exclude-btn close-session-creation-overlay">
          <i class="bi bi-x-lg"></i>
          </button>
          </header>
        <div class="progress">
          <div class="progress-indecator-container">
            <div class="progress-indecator"></div>
          </div>
          <div class="progress-text">
            <label class="progress-start-text">
              <input type="checkbox" id="progress-start-text" />
              Informations
            </label>
            <label class="progress-end-text">
              <input type="checkbox" id="progress-end-text" />
              Tasks
            </label>
          </div>
        </div>
        ${getSessionForm()}
      </div>
  `;

  return sessionOverlay;
};
const getSessionForm = (name, description, quiz, includeBreaks) => {
  let quizTitle = '';
  let quizId = '';
  if (quiz) {
    // If quiz is provided, destructure its properties safely
    quizTitle = quiz.quiz?.title || '';
    quizId = quiz.id || '';
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'create-session-form';
  wrapper.innerHTML = `
    <form novalidate>
      <div class="field-container session-name-field">
        <div class="field-icon-container">
          <span class="icon-box">
            <i class="bi bi-clock-history"></i>
            <i class="bi bi-info-circle"></i>
          </span>
        </div>
        <input
          type="text"
          required
          id="session-name"
          name="session-name"
          minlength="${NAME_TITLE_MIN_LENGTH}"
          maxlength="${NAME_TITLE_MAX_LENGTH}"
          class="input"
          placeholder="Name"
        />
      </div>

      <div class="field-container session-description-field">
        <div class="field-icon-container">
          <span class="icon-box">
            <i class="bi bi-clock-history"></i>
            <i class="bi bi-info-circle"></i>
          </span>
        </div>
        <textarea
          required
          id="session-description"
          name="session-description"
          class="input"
          placeholder="Description"
          maxlength="${DESCRIPTION_MAX_LENGTH}"
          minlength="${DESCRIPTION_MIN_LENGTH}"
        ></textarea>
        <span class="chars-limit">0/${DESCRIPTION_MAX_LENGTH}</span>
      </div>

      <div class="field-container session-quiz-field">
        <div class="field-icon-container">
          <i class="bi bi-clipboard-check"></i>
        </div>
        <div class="select-trigger input">
          <button type="button" class="exclude-btn open-drop-down-btn">
            <span class="quiz-value">Quiz Title (Optional)</span>
            <input type="hidden" name="session-quiz" value="" />
            <input type="hidden" name="session-quiz-id" value="" />
            <i class="bi bi-chevron-down"></i>
          </button>
          <div class="select-menu session-quiz-select-menu drop-down-menu overlay">
            <div class="select-search">
              <input id="select-search" type="search">
            </div>
            <div class="select-group drop-down-group">
              <div class="select-group-label drop-down-group-label">Fundamental Sciences</div>
              <hr class="separator">
              <div class="select-item drop-down-item" data-value="Mathematics">Mathematics</div>
            </div>
          </div>
        </div>
      </div>
      <label class="include-breaks container">
        <input type="checkbox" name="include-breaks" ${
          includeBreaks ? 'checked' : ''
        }>
          <svg viewBox="0 0 64 64" height="2em" width="2em">
          <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
        </svg>
        Include breaks if available
      </label>

      <button type="submit" class="blue-btn next-btn">Next</button>
    </form>
  `;

  // Set values using textContent
  wrapper.querySelector('#session-name').setAttribute('value', name || '');

  wrapper.querySelector('#session-description').textContent = description || '';

  wrapper.querySelector('.chars-limit').textContent = `${
    description?.length || 0
  }/${DESCRIPTION_MAX_LENGTH}`;

  const quizValueEl = wrapper.querySelector('.quiz-value');
  quizValueEl.textContent = quizTitle ? quizTitle : 'Quiz Title (Optional)';
  wrapper
    .querySelector('input[name="session-quiz"]')
    .setAttribute('value', quizId || '');

  return wrapper.outerHTML;
};

export const handleSessionCreateClick = () => {
  const sessionStore = {
    sessionData: {
      name: '',
      description: '',
      sessionQuiz: null,
      duration: 0,
      includeBreaks: false,
      tasks: [],
    },
    taskToEdit: {
      task: null,
      index: '',
      addQuiz: false,
    },
  };

  openOverlayModal(
    'create-session-overlay',
    ['.close-session-creation-overlay'],
    getSessionCreationOverlay,
    (backdropElement) => setUpSessionForm(backdropElement, sessionStore)
  );
};

const setUpSwapBtn = (btnClassName, targetClassName, wrapper, sessionStore) => {
  wrapper.querySelector(`.${btnClassName}`)?.addEventListener('click', (e) => {
    e.preventDefault();
    if (btnClassName === 'back-btn') {
      // Reset taskToEdit when going back
      sessionStore.taskToEdit = null;
    }
    swapSessionOverlayContent(targetClassName, wrapper, sessionStore);
  });
};

// task form
const getTaskButtonLabel = (task, addQuiz) => {
  if (addQuiz) {
    return 'Add Quiz';
  }
  if (task?.isQuiz) {
    return 'Update Quiz';
  }
  return task ? 'Update Task' : 'Add Task';
};

const getTaskForm = (task, addQuiz) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'create-task-form';
  wrapper.innerHTML = `
    <header class="tasks-header">
      <h3>${
        addQuiz
          ? 'Add Quiz Task Details'
          : task?.isQuiz
          ? 'Edit Quiz Task'
          : task
          ? 'Edit Task'
          : 'Create Task'
      }</h3>
      ${
        addQuiz
          ? ''
          : `<button type="button" class="gray-btn small-btn cancel-task-creation">
        Cancel
      </button>`
      }
    </header>
    <form novalidate id="form">
      <div class="field-container task-title-field">
        <div class="field-icon-container">
          <span class="icon-box">
            <i class="bi bi-ui-checks"></i>
            <i class="bi bi-info-circle"></i>
          </span>
        </div>
        <input
          type="text"
          required
          id="task-title"
          name="task-title"
          minlength="${NAME_TITLE_MIN_LENGTH}"
          maxlength="${NAME_TITLE_MAX_LENGTH}"
          class="input"
          placeholder="Task Title"
        />
      </div>

      <div class="field-container task-description-field">
        <div class="field-icon-container">
          <span class="icon-box">
            <i class="bi bi-ui-checks"></i>
            <i class="bi bi-info-circle"></i>
          </span>
        </div>
        <textarea
          required
          id="task-description"
          name="task-description"
          class="input"
          placeholder="Description"
          maxlength="${DESCRIPTION_MAX_LENGTH}"
          minlength="${DESCRIPTION_MIN_LENGTH}"
        ></textarea>
        <span class="chars-limit">0/${DESCRIPTION_MAX_LENGTH}</span>
      </div>

      <div class="dual-container">
        <div class="field-container task-duration-field">
          <div class="field-icon-container">
            <i class="bi bi-clock"></i>
          </div>
          <input
            type="number"
            required
            min="1"
            class="input"
            id="task-duration"
            name="task-duration"
            placeholder="Total Duration (minutes)"
          />
        </div>
        <button type="submit" class="blue-btn add-task-btn">
          ${
            addQuiz
              ? `<i class="bi bi-plus-lg"></i>`
              : task
              ? `<i class="bi bi-pencil"></i>`
              : `<i class="bi bi-plus-lg"></i>`
          }
          ${getTaskButtonLabel(task, addQuiz)}
        </button>
      </div>
    </form>
  `;

  wrapper.querySelector('#task-title').setAttribute('value', task?.title || '');
  wrapper.querySelector('#task-description').textContent =
    task?.description || '';
  wrapper.querySelector('.chars-limit').textContent = `${
    task?.description?.length || 0
  }/${DESCRIPTION_MAX_LENGTH}`;
  wrapper
    .querySelector('#task-duration')
    .setAttribute('value', task?.durationInMins || '');

  return wrapper.outerHTML;
};

const checkTextFieldValidity = (title, description) => {
  if (!title.value) {
    showErrorTooltip('Please enter a title', title.closest('.field-container'));
    return false;
  } else if (
    title.value.length < NAME_TITLE_MIN_LENGTH ||
    title.value.length > NAME_TITLE_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Title should be between ${NAME_TITLE_MIN_LENGTH} and ${NAME_TITLE_MAX_LENGTH} characters`,
      title.closest('.field-container')
    );
    return false;
  } else {
    resetTooltip(globalTooltip, title.closest('.field-container'));
  }

  if (!description.value) {
    showErrorTooltip(
      'Please enter a description',
      description.closest('.field-container')
    );
    return false;
  } else if (
    description.value.length < DESCRIPTION_MIN_LENGTH ||
    description.value.length > DESCRIPTION_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Description should be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters`,
      description.closest('.field-container')
    );
    return false;
  } else {
    resetTooltip(globalTooltip, description.closest('.field-container'));
  }

  return true;
};

const checkTaskFormValidity = (form) => {
  const title = form.querySelector('#task-title');
  const description = form.querySelector('#task-description');
  const duration = form.querySelector('#task-duration');

  if (!checkTextFieldValidity(title, description)) {
    return false;
  }

  if (
    !duration.value ||
    isNaN(duration.value) ||
    Number(duration.value) < TASK_MIN_DURATION ||
    Number(duration.value) > TASK_MAX_DURATION
  ) {
    showErrorTooltip(
      `Task duration should be a number between ${TASK_MIN_DURATION} and ${TASK_MAX_DURATION} minutes`,
      duration.closest('.field-container')
    );
    return false;
  } else {
    resetTooltip(globalTooltip, duration.closest('.field-container'));
  }

  return true;
};

const createTaskElement = (task, idx) => {
  const durationStr = millisecondsToHMFormat(task.durationInMins * 60 * 1000);
  const taskContainer = document.createElement('div');
  taskContainer.className = 'task';
  taskContainer.innerHTML = `
  ${idx === 0 ? '<div class="drop-target"></div>' : ''}
    <div data-task-id="${idx}" class="task-wrapper">
      <div ${task.isQuiz ? 'data-tooltip="Quiz"' : ''} class="task-box ${
    task.isQuiz ? 'quiz-task-box has-tooltip' : ''
  }">
        <div class="counter drag-handle">
          <span></span>
        </div>
        <span class="title"></span>
        <span class="duration"></span>
        <div class="icons">
          <button type="button" class="task-menu-btn open-drop-down-btn exclude-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <button
            type="button"
            data-tooltip="Show Details"
            class="task-down-icon exclude-btn should-fill has-tooltip"
          >
            <i class="bi bi-caret-down"></i>
          </button>
          <div class="task-options drop-down-menu overlay">
            <button type="button" class="exclude-btn select-item drop-down-item small-btn edit-task-btn">
              <i class="bi bi-pencil"></i>
              Edit
            </button>
            <button type="button" class="exclude-btn select-item drop-down-item small-btn red-btn remove-task-btn">
              <i class="bi bi-trash"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
      <div class="task-details">
        <h5>Title:</h5>
        <p class="task-title"></p>
        <h5>Details:</h5>
        <p class="task-desc"></p>
      </div>
    </div>
  <div class="drop-target"></div>
  `;

  // Set textContent for safety
  taskContainer.querySelector('.counter span').textContent = String(
    idx + 1
  ).padStart(2, '0');
  taskContainer.querySelector('.title').textContent = task.title || '';
  taskContainer.querySelector('.duration').textContent = durationStr;
  taskContainer.querySelector('.task-title').textContent = task.title || '';
  taskContainer.querySelector('.task-desc').textContent =
    task.description || '';

  return taskContainer;
};
// the tasks list
const getTasksList = (tasksArray = []) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'tasks-list';

  tasksArray.forEach((task, idx) => {
    wrapper.appendChild(createTaskElement(task, idx));
  });

  return wrapper;
};

// innerWrapper for tasks List
const getTasksListContainer = (
  tasksArray = []
) => `<div class="tasks-list-container">
        <header class="tasks-header">
          <h3>Tasks List</h3>
          <div class="btns">
              <button
                type="button"
                data-tooltip="Scroll To Top"
                class="exclude-btn scroll-to-top has-tooltip">
                <i class="bi bi-arrow-up-short"></i>
              </button>
              <button
                type="button"
                data-tooltip="Collapse All"
                class="exclude-btn collapse-all has-tooltip">
                <i class="bi bi-arrows-expand"></i>
              </button>
          </div>
          <span class="badge simple-badge duration-badge">Total Duration 0m</span>
          <button type="button" class="small-btn create-task-btn">
            <i class="bi bi-plus-lg"></i>
            Add Task
          </button>
        </header>
        ${getTasksList(tasksArray).outerHTML}
      </div>`;

const shouldAddOrUpdateQuiz = (data, sessionData) => {
  return (
    data['session-quiz-title'] &&
    data['session-quiz-id'] &&
    (data['session-quiz-id'] !== sessionData.sessionQuiz?.id ||
      !sessionData.sessionQuiz?.quiz.description ||
      !sessionData.sessionQuiz?.quiz.durationInMins)
  );
};

const addOrUpdateQuizTask = (data, sessionStore, wrapper) => {
  const sessionData = sessionStore.sessionData;
  sessionData.sessionQuiz = {
    quiz: new Task({
      title: data['session-quiz-title'],
      description: '',
      durationInMins: 0,
      isQuiz: true,
    }),
    id: data['session-quiz-id'],
  };

  const quizIndex = sessionData.tasks.findIndex((task) => task.isQuiz);
  if (quizIndex !== -1) {
    sessionData.tasks[quizIndex] = sessionData.sessionQuiz.quiz;
  } else {
    sessionData.tasks.push(sessionData.sessionQuiz.quiz);
  }

  sessionStore.taskToEdit = {
    task: sessionData.sessionQuiz.quiz,
    index: quizIndex !== -1 ? quizIndex : 0,
    addQuiz: true,
  };

  wrapper.querySelector('.create-session-form').outerHTML = getTasksContainer();
  wrapper
    .querySelector('.finish-btn')
    .addEventListener('click', () =>
      handleFinishBtnClick(sessionStore.sessionData)
    );
  wrapper.querySelector('#progress-end-text').checked = true;

  setUpSwapBtn('back-btn', 'create-session-form', wrapper, sessionStore);
  swapSessionOverlayContent('create-task-form', wrapper, sessionStore);
};

const setUpSessionForm = (wrapper, sessionStore) => {
  wrapper.querySelector('#progress-end-text').checked = false;
  wrapper
    .querySelector('textarea')
    .addEventListener('input', countCharsTextarea);
  const form = wrapper.querySelector('form');
  handleFormSubmit(
    form,
    () => checkSessionFormValidity(form),
    (data) => handleSessionForm(data, sessionStore, wrapper)
  );
};

const checkSessionFormValidity = (form) => {
  // get inputs
  const name = form.querySelector('#session-name');
  const description = form.querySelector('#session-description');
  const quiz = form.querySelector('input[name="session-quiz"]');
  const quizValue = form.querySelector('.quiz-value');

  // check name and description
  if (!checkTextFieldValidity(name, description)) {
    return false;
  }
  return true;
};

const handleFinishBtnClick = (sessionData) => {
  const quiz = sessionData.sessionQuiz?.quiz;
  const tasksLength = sessionData.tasks.length;
  if (tasksLength === 0)
    return showMessageBlock(
      'You must add at least one task before finishing.',
      'info'
    );

  if (quiz && (!quiz.description || !quiz.durationInMins))
    return showMessageBlock(
      'Please complete the quiz details before finishing.',
      'info'
    );

  console.log(sessionData);
};

const handleSessionForm = (data, sessionStore, wrapper) => {
  const sessionData = sessionStore.sessionData;
  sessionData.name = data['session-name'];
  sessionData.includeBreaks = data['include-breaks'] === 'on';
  sessionData.description = data['session-description'];

  // For test
  data['session-quiz-title'] = 'Quiz Title';
  data['session-quiz-id'] = '12345';

  if (shouldAddOrUpdateQuiz(data, sessionData)) {
    addOrUpdateQuizTask(data, sessionStore, wrapper);
    return;
  } else if (!data['session-quiz-title'] && !data['session-quiz-id']) {
    sessionData.sessionQuiz = null;
    sessionStore.taskToEdit = null;
  }

  swapSessionOverlayContent('create-task-container', wrapper, sessionStore);
};

const setUpTaskContainer = (wrapper, sessionStore) => {
  wrapper.querySelector('#progress-end-text').checked = true;
  setUpSwapBtn('back-btn', 'create-session-form', wrapper, sessionStore);

  wrapper
    .querySelector('.finish-btn')
    .addEventListener('click', () =>
      handleFinishBtnClick(sessionStore.sessionData)
    );
  setUpTasksList(wrapper, sessionStore);
};

const resortTasksArray = () => {
  // After drag and drop, update the task order
  sessionData.tasks = Array.from(wrapper.querySelectorAll('.task-wrapper')).map(
    (taskWrapper, index) => {
      const taskId = taskWrapper.dataset.taskId;
      const task = sessionData.tasks[taskId];
      taskWrapper.dataset.taskId = index;
      return task;
    }
  );
};

const setUpTasksList = (wrapper, sessionStore) => {
  const sessionData = sessionStore.sessionData;
  setUpSwapBtn('create-task-btn', 'create-task-form', wrapper, sessionStore);
  setUpDragAndDrop('.tasks-list', '.task', resortTasksArray);
  const durationBadge = wrapper.querySelector('.duration-badge');
  durationBadge.textContent = `Duration ${millisecondsToHMFormat(
    sessionData.duration * 60 * 1000
  )}`;
  const tasksList = wrapper.querySelector('.tasks-list');
  tasksList.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-task-btn');
    const removeBtn = e.target.closest('.remove-task-btn');
    if (editBtn) {
      const taskId = editBtn.closest('.task-wrapper ')?.dataset.taskId;
      sessionStore.taskToEdit = {
        task: sessionData.tasks[taskId],
        index: taskId,
      };
      swapSessionOverlayContent('create-task-form', wrapper, sessionStore);
    } else if (removeBtn) {
      const taskId = removeBtn.closest('.task-wrapper ')?.dataset.taskId;
      const task = sessionData.tasks[taskId];
      const isQuizTask = task.isQuiz;
      if (isQuizTask) {
        const res = await showConfirmationBox(
          'exclamation',
          'Remove Quiz',
          'Are you sure you want to remove the quiz?',
          'Cancel',
          'Remove Quiz'
        );
        if (res) {
          sessionData.sessionQuiz = null; // Remove the quiz from session data
        } else {
          return; // If user cancels, do nothing
        }
      }
      sessionData.duration -= task.durationInMins;
      durationBadge.textContent = `Duration ${millisecondsToHMFormat(
        sessionData.duration * 60 * 1000
      )}`;
      sessionData.tasks.splice(taskId, 1);
      tasksList.innerHTML = getTasksList(sessionData.tasks).innerHTML;
    }
  });
  handletTasksListners('tasks-list-container');
};
// wrapper of the tasks swap
const getTasksContainer = (
  tasksArray = []
) => `<div class="create-task-container">
        ${getTasksListContainer(tasksArray)}
        <div class="buttons">
          <button type="button" class="grey-btn back-btn gray-btn">
            Back
          </button>
          <button form="" type="submit" class="blue-btn finish-btn">
            Finish
          </button>
        </div>
      </div>`;

// Helper to handle cancel task creation
const handleCancelTaskCreation = (wrapper, sessionStore) => {
  setUpSwapBtn(
    'cancel-task-creation',
    'tasks-list-container',
    wrapper,
    sessionStore
  );
  wrapper
    .querySelector('.cancel-task-creation')
    ?.addEventListener('click', () => {
      sessionStore.taskToEdit = null; // Reset after editing
    });
};

const updateTask = (sessionStore, data) => {
  const taskIndex = sessionStore.taskToEdit.index;
  const oldTaskDuration =
    sessionStore.sessionData.tasks[taskIndex].durationInMins;
  sessionStore.sessionData.duration -= oldTaskDuration;
  sessionStore.sessionData.tasks[taskIndex] = new Task({
    title: data['task-title'],
    description: data['task-description'],
    durationInMins: parseInt(data['task-duration'], 10),
    isQuiz: sessionStore.taskToEdit.task.isQuiz,
  });
  sessionStore.sessionData.duration += parseInt(data['task-duration'], 10);
  if (sessionStore.taskToEdit.addQuiz) {
    // If the task is a quiz, update the quiz as well
    sessionStore.sessionData.sessionQuiz.quiz =
      sessionStore.sessionData.tasks[taskIndex];
  }
  sessionStore.taskToEdit = null;
};

const addTask = (sessionData, data) => {
  const task = new Task({
    title: data['task-title'],
    description: data['task-description'],
    durationInMins: parseInt(data['task-duration'], 10),
    isQuiz: false,
  });
  sessionData.tasks.push(task);
  sessionData.duration += task.durationInMins;
};

// Helper to handle form submission for task form
const handleTaskFormSubmission = (form, wrapper, sessionStore) => {
  handleFormSubmit(
    form,
    () => checkTaskFormValidity(form),
    (data) => {
      if (sessionStore.taskToEdit) {
        updateTask(sessionStore, data);
      } else {
        addTask(sessionStore.sessionData, data);
      }
      swapSessionOverlayContent('tasks-list-container', wrapper, sessionStore);
    }
  );
};

const setUpTaskForm = (wrapper, sessionStore) => {
  handleCancelTaskCreation(wrapper, sessionStore);
  wrapper
    .querySelector('textarea')
    .addEventListener('input', countCharsTextarea);
  const form = wrapper.querySelector('form');
  handleTaskFormSubmission(form, wrapper, sessionStore);
};

const configs = {
  'create-session-form': {
    getHtml: (sessionStore) =>
      getSessionForm(
        sessionStore.sessionData.name,
        sessionStore.sessionData.description,
        sessionStore.sessionData.sessionQuiz
      ),
    replaceClass: 'create-task-container',
    setup: (wrapper, sessionStore) => setUpSessionForm(wrapper, sessionStore),
  },
  'create-task-container': {
    getHtml: (sessionStore) =>
      getTasksContainer(sessionStore.sessionData.tasks),
    replaceClass: 'create-session-form',
    setup: (wrapper, sessionStore) => setUpTaskContainer(wrapper, sessionStore),
  },
  'tasks-list-container': {
    getHtml: (sessionStore) =>
      getTasksListContainer(sessionStore.sessionData.tasks),
    replaceClass: 'create-task-form',
    setup: (wrapper, sessionStore) => setUpTasksList(wrapper, sessionStore),
  },
  'create-task-form': {
    getHtml: (sessionStore) =>
      getTaskForm(
        sessionStore.taskToEdit?.task,
        sessionStore.taskToEdit?.addQuiz
      ),
    replaceClass: 'tasks-list-container',
    setup: (wrapper, sessionStore) => setUpTaskForm(wrapper, sessionStore),
  },
};
const swapSessionOverlayContent = (targetClassName, wrapper, sessionStore) => {
  const config = configs[targetClassName];
  if (!config) {
    throw new Error(
      `swapSessionOverlayContent: Unknown class name "${targetClassName}"`
    );
  }

  const oldEl = wrapper.querySelector(`.${config.replaceClass}`);
  if (!oldEl) {
    console.warn(`Element to replace ".${config.replaceClass}" not found`);
    return;
  }

  // Swap out the HTML
  oldEl.outerHTML = config.getHtml(sessionStore);
  // Run any additional setup (event hooks, button wiring, etc.)
  config.setup(wrapper, sessionStore);
};

export const closeGroupLeftSideBar = () => {
  groupLeftSideBar.classList.add('close');
  showInfoBtn
    .querySelector('i')
    .classList.replace('bi-x-circle', 'bi-info-circle');
  showInfoBtn.setAttribute('data-tooltip', 'Show group info');
};

const dashedToCamelCase = (value) => {
  return value.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
};

const swapMode = (infoBox, modeFuncName, updatedValue, showInSearchValue) => {
  const editBoxClass = infoBox.className
    .split(' ')
    .find((c) => c.includes('-info-box'));
  if (updatedValue) {
    groupInfo[dashedToCamelCase(editBoxClass.split('-info-box')[0])] =
      updatedValue;
  }
  const value =
    groupInfo[dashedToCamelCase(editBoxClass.split('-info-box')[0])];
  const showInSearchInput =
    showInSearchValue !== null ? showInSearchValue : null;
  const infoBoxClone = infoBox.cloneNode();

  infoBoxClone.innerHTML = groupInfoElementsMap[editBoxClass][modeFuncName](
    value,
    showInSearchInput
  );
  if (modeFuncName === 'getEditMode') {
    if (editBoxClass === 'subject-info-box') {
      setUpSubjectSelectMenu(infoBoxClone);
    }
    if (['visibility-info-box', 'level-info-box'].includes(editBoxClass)) {
      setUpSwitchBtn(infoBoxClone);
    }
  }
  infoBox.replaceWith(infoBoxClone);
  resetTooltip(hoverTooltip);
};

export const handleViewAllMembersBtn = (e) => {
  const viewAllMembersBtn = e.target.closest(
    '.view-all-btn, .manage-members-btn'
  );
  if (viewAllMembersBtn) {
    openGroupLeftSideBar('/members-list');
  }
};

export const setUpDatePicker = () => {
  const dateInput = groupLeftSideBarContent.querySelector('input[type="date"]');
  dateInput.onclick = (e) => {
    e.currentTarget.showPicker();
  };
};

export const handleRemoveGroup = async () => {
  const res = await showConfirmationBox(
    'exclamation',
    'Remove group',
    'Are you sure you want to remove this group?',
    'Cancel',
    'Remove'
  );
};

export const handleDemandesBtn = async (e) => {
  const demandesBtn = e.target.closest('.demandes-btn');
  if (demandesBtn) {
    await openGroupLeftSideBar('/demandes-list');
    setUpDatePicker();
  }
};

export const handleEditBtn = (e) => {
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    const infoBox = editBtn.closest('.info-box');
    swapMode(infoBox, 'getEditMode');
  }
};

// Helper: Get info box conditions
const getInfoBoxConditions = (editBoxClass, input) => ({
  isVisbilityBox: editBoxClass === 'visibility-info-box',
  isLevelBox: editBoxClass === 'level-info-box',
  isSubjectBox: editBoxClass === 'subject-info-box',
  isGroupDescriptionBox: editBoxClass === 'group-description-info-box',
  isGroupNameBox: editBoxClass === 'group-name-info-box',
  isMaxMembersBox: editBoxClass === 'max-members-info-box',
  isInputElement: ['INPUT', 'TEXTAREA'].includes(input.tagName),
});

// Helper: Check if value has changed
const isValueUnchanged = (
  input,
  oldValue,
  CONDITIONS,
  showInSearchInput,
  oldValueShowInSearchInput
) => {
  if (CONDITIONS.isInputElement) {
    return input.value === oldValue;
  } else {
    const valueUnchanged = input?.dataset.value === oldValue;
    const showInSearchUnchanged =
      CONDITIONS.isVisbilityBox && input?.dataset.value === 'Private'
        ? showInSearchInput.checked === oldValueShowInSearchInput
        : true;
    return valueUnchanged && showInSearchUnchanged;
  }
};

// Handle cancel button: revert to view mode
const handleCancelBtn = (cancelBtn) => {
  const infoBox = cancelBtn.closest('.info-box');
  swapMode(infoBox, 'getViewMode');
};

// Handle save button logic
const handleSaveBtn = (saveBtn) => {
  const infoBox = saveBtn.closest('.info-box');
  const infoWrapper = infoBox.querySelector('.info-container');
  const actionsBtns = infoBox.querySelector('.action-btns');
  const editBoxClass = infoBox.className
    .split(' ')
    .find((c) => c.includes('-info-box'));
  const oldValue =
    groupInfo[dashedToCamelCase(editBoxClass.split('-info-box')[0])];
  const oldValueShowInSearchInput = groupInfo['showInSearch'];

  const input = infoBox.querySelector('.value');
  const showInSearchInput = infoBox.querySelector('#show-in-search');

  const CONDITIONS = getInfoBoxConditions(editBoxClass, input);

  if (
    isValueUnchanged(
      input,
      oldValue,
      CONDITIONS,
      showInSearchInput,
      oldValueShowInSearchInput
    )
  ) {
    swapMode(infoBox, 'getViewMode');
    return;
  }
  const isValid = checkValidity(input, CONDITIONS);

  if (isValid) {
    infoWrapper.classList.remove('error-input');
    handleSaveAction(
      input,
      infoBox,
      CONDITIONS,
      actionsBtns,
      showInSearchInput
    );
  }
};

// Handles save and cancel button actions in the group info sidebar
export const handleSaveAndCancelBtns = (e) => {
  const saveBtn = e.target.closest('.save-btn');
  const cancelBtn = e.target.closest('.cancel-btn');

  if (cancelBtn) {
    handleCancelBtn(cancelBtn);
    return;
  }

  if (saveBtn) {
    handleSaveBtn(saveBtn);
  }
};

const handleSaveAction = async (
  input,
  infoBox,
  CONDITIONS,
  actionsBtns,
  showInSearchInput
) => {
  try {
    actionsBtns.outerHTML = getLoader();
    resetTooltip(hoverTooltip);
    await updateGroupInfo(input, infoBox, CONDITIONS);
    const updatedValue = CONDITIONS.isInputElement
      ? input.value
      : input?.dataset.value;
    const showInSearchValue =
      CONDITIONS.isVisbilityBox && input?.dataset.value === 'Private'
        ? showInSearchInput.checked
        : null;

    swapMode(infoBox, 'getViewMode', updatedValue, showInSearchValue);
    showMessageBlock('Group info updated successfully', 'success');
  } catch (error) {
    showMessageBlock(error.message, 'error');
  }
};

const validateMaxMembers = (input, value) => {
  const maxMembers = parseInt(value);
  if (
    isNaN(maxMembers) ||
    maxMembers < MIN_MEMBERS ||
    maxMembers > MAX_MEMBERS
  ) {
    initAndDiplayErrorTooltip(
      input.closest('.info-edit-wrapper'),
      `Max members should be a number between ${MIN_MEMBERS} and ${MAX_MEMBERS}`
    );
    return false;
  }
  return true;
};

const validateGroupName = (input, value) => {
  if (
    value.length < NAME_TITLE_MIN_LENGTH ||
    value.length > NAME_TITLE_MAX_LENGTH
  ) {
    initAndDiplayErrorTooltip(
      input.closest('.info-edit-wrapper'),
      `Group name should be between ${NAME_TITLE_MIN_LENGTH} and ${NAME_TITLE_MAX_LENGTH} characters`
    );
    return false;
  }
  return true;
};

const validateGroupDescription = (input, value) => {
  if (
    value.length < DESCRIPTION_MIN_LENGTH ||
    value.length > DESCRIPTION_MAX_LENGTH
  ) {
    initAndDiplayErrorTooltip(
      input.closest('.info-edit-wrapper'),
      `Group description should be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters`
    );
    return false;
  }
  return true;
};

const checkValidity = (input, CONDITIONS) => {
  if (CONDITIONS.isInputElement) {
    const value = input.value.trim();
    if (CONDITIONS.isMaxMembersBox) {
      return validateMaxMembers(input, value);
    }
    if (CONDITIONS.isGroupNameBox) {
      return validateGroupName(input, value);
    }
    if (CONDITIONS.isGroupDescriptionBox) {
      return validateGroupDescription(input, value);
    }
    return false;
  } else if (CONDITIONS.isVisbilityBox) {
    return checkRadioValidity(input, visibilityValues);
  } else if (CONDITIONS.isLevelBox) {
    return checkRadioValidity(input, levelValues);
  } else if (CONDITIONS.isSubjectBox) {
    return true;
  }
};

const checkRadioValidity = (input, valideValues) => {
  if (!valideValues.includes(input?.dataset.value)) {
    initAndDiplayErrorTooltip(
      input.closest('.info-edit-wrapper'),
      'Please select a valid option'
    );
    return false;
  }

  return true;
};

const updateGroupInfo = async (input, infoBox, CONDITIONS) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (CONDITIONS.isGroupNameBox) {
      } else if (CONDITIONS.isGroupDescriptionBox) {
      } else if (CONDITIONS.isMaxMembersBox) {
      } else if (CONDITIONS.isVisbilityBox) {
      } else if (CONDITIONS.isLevelBox) {
      } else if (CONDITIONS.isSubjectBox) {
      }
      resolve();
    }, 1000);
  });
};
