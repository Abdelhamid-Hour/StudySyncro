import {
  fetchData,
  sendData,
  showMessageBlock,
} from "../../../../../../main_assets/js/utils.js";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  globalTooltip,
  hoverTooltip,
  MAX_MEMBERS,
  MIN_MEMBERS,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  TASK_MAX_DURATION,
  TASK_MIN_DURATION,
} from "../../../../global/js/dom-variables.js";
import {
  getLoader,
  resetTooltip,
  showConfirmationBox,
  openOverlayModal,
  millisecondsToHMFormat,
  showErrorTooltip,
  dashedToCamelCase,
  navigateTo,
  handleApiAction,
  closeOverlayModal,
} from "../../../../global/js/utils.js";
import {
  levelValues,
  visibilityValues,
} from "../../../../shared/forms/js/dom-variables.js";
import {
  countCharsTextarea,
  handleFormSubmit,
  setUpSelectMenu,
  setUpSwitchBtn,
} from "../../../../shared/forms/js/utils.js";
import { initAndDiplayErrorTooltip } from "../../../../shared/chat/js/utils.js";
import {
  handletTasksListners,
  setUpDragAndDrop,
  Task,
} from "../../../../shared/tasks/js/utils.js";
import {
  groupLeftSideBar,
  showInfoBtn,
  groupInfoElementsMap,
  groupLeftSideBarContent,
  groupLeftSideBarTitle,
} from "./dom-variables.js";
import {
  initFiltersInputListener,
  Loader,
  setUpDatePicker,
} from "../../../../shared/quizzes-groups/js/utils.js";
import {
  endSession,
  joinSession,
  leaveSession,
} from "../../../../shared/session/js/utils.js";
import {
  openQuizResultOverlay,
  openQuizResultsOverlay,
} from "../../../../shared/quiz-result/js/utils.js";

export let groupInfo;
export let lastVisible = null;

export const getGroupId = () => {
  // Example path: /app/groups/my/CKrhlort4dLmUq9zRtOl/chat
  const match = window.location.pathname.match(/\/groups\/my\/([^/]+)\/chat/);
  const groupId = match ? match[1] : null;
  if (!groupId) throw new Error("Quiz ID not found");
  return groupId;
};

let groupId = getGroupId();

export const handleLeavingGroup = async (e) => {
  const res = await showConfirmationBox(
    "exclamation",
    "Leave Group",
    "Are you sure you want to leave this group?",
    "Cancel",
    "Leave"
  );
  if (res) {
    handleApiAction("/leave-group", { groupId }, e.target, {
      successMsg: "Left group successfully",
      onSuccess: () => navigateTo("/groups/my"),
    });
  }
};

export const handleGroupInfo = async () => {
  await openGroupLeftSideBar("/group-info");
  const removeGroupBtn = document.querySelector(".remove-group-btn");
  if (removeGroupBtn) {
    removeGroupBtn.addEventListener("click", handleRemoveGroup);
  } else {
    document
      .querySelector(".leave-group-btn")
      .addEventListener("click", handleLeavingGroup);
  }
};

export const handleShowInfoBtnClick = async () => {
  if (groupLeftSideBar.classList.contains("close")) {
    handleGroupInfo();
  } else {
    closeGroupLeftSideBar();
  }
};

export const openGroupLeftSideBar = async (route) => {
  groupLeftSideBarContent.innerHTML = getLoader();
  groupLeftSideBar.classList.remove("close");

  showInfoBtn
    .querySelector("i")
    .classList.replace("bi-info-circle", "bi-x-circle");
  showInfoBtn.setAttribute("data-tooltip", "Close group info");

  try {
    const { template, title, count, info } = await fetchData(
      `${route}/${groupId}`
    );

    if (info) {
      groupInfo = info;
    }

    groupLeftSideBarContent.innerHTML = template;
    groupLeftSideBarTitle.textContent = title;

    if (count !== undefined) {
      const badge = document.createElement("span");
      badge.className = "badge simple-badge";
      badge.textContent = count;
      groupLeftSideBarTitle.appendChild(badge);
    }

    const endBtn = groupLeftSideBarContent.querySelector(".end-btn");
    const leaveBtn = groupLeftSideBarContent.querySelector(".leave-btn");
    const joinBtn = groupLeftSideBarContent.querySelector(".join-btn");

    if (endBtn)
      endBtn.addEventListener("click", () =>
        endSession(endBtn, endBtn.dataset.sessionId)
      );

    if (leaveBtn)
      leaveBtn.addEventListener("click", () =>
        leaveSession(leaveBtn, leaveBtn.dataset.sessionId)
      );

    if (joinBtn)
      joinBtn.addEventListener("click", () =>
        joinSession(joinBtn.dataset.sessionId, joinBtn)
      );
  } catch (error) {
    console.error(error);
    showMessageBlock(
      error.message || "An error occurred while loading group info.",
      "error"
    );
    groupLeftSideBarContent.innerHTML = `<p class="error-message"><i class="bi bi-exclamation-circle"></i>Failed to load group info. Please try again later.</p>`;
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
const getSessionForm = (name, description, quiz) => {
  let quizTitle = "";
  let quizId = "";
  if (quiz) {
    // If quiz is provided, destructure its properties safely
    quizTitle = quiz.quiz?.title || "";
    quizId = quiz.UID || "";
  }
  const wrapper = document.createElement("div");
  wrapper.className = "create-session-form";
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
            <input type="hidden" class="session-quiz-title" name="session-quiz-title" value="" />
            <input type="hidden" class="session-quiz-id" name="session-quiz-id" value="" />
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

      <button type="submit" class="blue-btn next-btn">Next</button>
    </form>
  `;

  // Set values using textContent
  wrapper.querySelector("#session-name").setAttribute("value", name || "");

  wrapper.querySelector("#session-description").textContent = description || "";

  wrapper.querySelector(".chars-limit").textContent = `${
    description?.length || 0
  }/${DESCRIPTION_MAX_LENGTH}`;

  const quizValueEl = wrapper.querySelector(".quiz-value");
  quizValueEl.textContent = quizTitle ? quizTitle : "Quiz Title (Optional)";
  wrapper
    .querySelector('input[name="session-quiz-title"]')
    .setAttribute("value", quizTitle || "");
  wrapper
    .querySelector('input[name="session-quiz-id"]')
    .setAttribute("value", quizId || "");

  return wrapper.outerHTML;
};

export const handleSessionCreateClick = () => {
  const sessionStore = {
    sessionData: {
      name: "",
      description: "",
      sessionQuiz: null,
      duration: 0,
      tasks: [],
    },
    taskToEdit: {
      task: null,
      index: "",
      addQuiz: false,
    },
    addBreak: false,
  };

  openOverlayModal(
    "create-session-overlay",
    [".close-session-creation-overlay"],
    getSessionCreationOverlay,
    (backdropElement) => setUpSessionForm(backdropElement, sessionStore)
  );
};

const setUpSwapBtn = (btnClassName, targetClassName, wrapper, sessionStore) => {
  wrapper.querySelector(`.${btnClassName}`)?.addEventListener("click", (e) => {
    e.preventDefault();
    if (btnClassName === "back-btn") {
      // Reset taskToEdit when going back
      sessionStore.taskToEdit = null;
      sessionStore.addBreak = false;
    }
    if (btnClassName === "create-break-btn") {
      // Reset taskToEdit when going back
      sessionStore.addBreak = true;
    }
    swapSessionOverlayContent(targetClassName, wrapper, sessionStore);
  });
};

// task form
const getTaskButtonLabel = (task, addQuiz, addBreak) =>
  addQuiz
    ? "Add Quiz"
    : addBreak
    ? "Add Break"
    : task?.isQuiz
    ? "Update Quiz"
    : task?.isBreak
    ? "Update Break"
    : task
    ? "Update Task"
    : "Add Task";
const getTaskForm = (task, addQuiz, addBreak) => {
  const wrapper = document.createElement("div");
  wrapper.className = "create-task-form";
  wrapper.innerHTML = `
    <header class="tasks-header">
      <h3>${
        addQuiz
          ? "Add Quiz Task Details"
          : task?.isQuiz
          ? "Edit Quiz Task"
          : task?.isBreak
          ? "Edit Break"
          : task
          ? "Edit Task"
          : addBreak
          ? "Create Break"
          : "Create Task"
      }</h3>
      ${
        addQuiz
          ? ""
          : `<button type="button" class="gray-btn small-btn cancel-task-creation">
        Cancel
      </button>`
      }
    </header>

    <form novalidate id="form">
      <div class="field-container task-title-field">
        <div class="field-icon-container">
          <span class="icon-box">
            ${
              task?.isBreak || addBreak
                ? '<i class="bi bi-cup-hot"></i>'
                : '<i class="bi bi-ui-checks"></i>'
            }
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
          placeholder="Title"
        />
      </div>

      ${
        task?.isBreak || addBreak
          ? ""
          : `<div class="field-container task-description-field">
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
      </div>`
      }

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
          ${getTaskButtonLabel(task, addQuiz, addBreak)}
        </button>
      </div>
    </form>
  `;

  wrapper.querySelector("#task-title").setAttribute("value", task?.title || "");
  if (!addBreak && !task?.isBreak) {
    wrapper.querySelector("#task-description").textContent =
      task?.description || "";
    wrapper.querySelector(".chars-limit").textContent = `${
      task?.description?.length || 0
    }/${DESCRIPTION_MAX_LENGTH}`;
  }
  wrapper
    .querySelector("#task-duration")
    .setAttribute("value", task?.durationInMins || "");

  return wrapper.outerHTML;
};

const checkTextFieldValidity = (title, description, isBreak) => {
  if (!title.value) {
    showErrorTooltip("Please enter a title", title.closest(".field-container"));
    return false;
  } else if (
    title.value.length < NAME_TITLE_MIN_LENGTH ||
    title.value.length > NAME_TITLE_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Title should be between ${NAME_TITLE_MIN_LENGTH} and ${NAME_TITLE_MAX_LENGTH} characters`,
      title.closest(".field-container")
    );
    return false;
  } else {
    resetTooltip(globalTooltip, title.closest(".field-container"));
  }

  if (!isBreak) {
    if (!description.value) {
      showErrorTooltip(
        "Please enter a description",
        description.closest(".field-container")
      );
      return false;
    } else if (
      description.value.length < DESCRIPTION_MIN_LENGTH ||
      description.value.length > DESCRIPTION_MAX_LENGTH
    ) {
      showErrorTooltip(
        `Description should be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters`,
        description.closest(".field-container")
      );
      return false;
    } else {
      resetTooltip(globalTooltip, description.closest(".field-container"));
    }
  }

  return true;
};

const checkTaskFormValidity = (form, isBreak) => {
  const title = form.querySelector("#task-title");
  const description = form.querySelector("#task-description");
  const duration = form.querySelector("#task-duration");

  if (!checkTextFieldValidity(title, description, isBreak)) {
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
      duration.closest(".field-container")
    );
    return false;
  } else {
    resetTooltip(globalTooltip, duration.closest(".field-container"));
  }

  return true;
};

const createTaskElement = (task, idx, taskCount) => {
  const durationStr = millisecondsToHMFormat(task.durationInMins * 60 * 1000);
  const taskContainer = document.createElement("div");
  taskContainer.className = "task";
  taskContainer.innerHTML = `
  ${idx === 0 ? '<div class="drop-target"></div>' : ""}
    <div data-task-id="${idx}" class="task-wrapper">
      <div ${
        task.isQuiz
          ? 'data-tooltip="Quiz"'
          : task.isBreak
          ? 'data-tooltip="Break"'
          : ""
      } class="task-box ${
    task.isQuiz
      ? "quiz-task-box has-tooltip"
      : task.isBreak
      ? "break-box has-tooltip"
      : ""
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
          ${
            task.isBreak
              ? ""
              : `<button
            type="button"
            data-tooltip="Show Details"
            class="task-down-icon exclude-btn should-fill has-tooltip"
          >
            <i class="bi bi-caret-down"></i>
          </button>`
          }
          
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
      ${
        task.isBreak
          ? ""
          : `<div class="task-details">
        <h5>Title:</h5>
        <p class="task-title"></p>
        <h5>Details:</h5>
        <p class="task-desc"></p>
      </div>`
      }
    </div>
  <div class="drop-target"></div>
  `;

  // Set textContent for safety
  taskContainer.querySelector(".counter span").textContent = String(
    idx + 1
  ).padStart(taskCount.length, "0");
  taskContainer.querySelector(".title").textContent = task.title || "";
  taskContainer.querySelector(".duration").textContent = durationStr;
  if (!task.isBreak) {
    taskContainer.querySelector(".task-title").textContent = task.title || "";
    taskContainer.querySelector(".task-desc").textContent =
      task.description || "";
  }

  return taskContainer;
};
// the tasks list
const getTasksList = (tasksArray = []) => {
  const wrapper = document.createElement("div");
  wrapper.className = "tasks-list";

  tasksArray.forEach((task, idx) => {
    wrapper.appendChild(
      createTaskElement(task, idx, tasksArray.length.toString())
    );
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
          <button type="button" class="small-btn create-break-btn">
            <i class="bi bi-plus-lg"></i>
            Add Break
          </button>
          <button type="button" class="small-btn create-task-btn">
            <i class="bi bi-plus-lg"></i>
            Add Task
          </button>
        </header>
        ${getTasksList(tasksArray).outerHTML}
      </div>`;

const shouldAddOrUpdateQuiz = (data, sessionData) => {
  return (
    data["session-quiz-title"] &&
    data["session-quiz-id"] &&
    (data["session-quiz-id"] !== sessionData.sessionQuiz?.UID ||
      !sessionData.sessionQuiz?.quiz.description ||
      !sessionData.sessionQuiz?.quiz.durationInMins)
  );
};

const addOrUpdateQuizTask = (data, sessionStore, wrapper) => {
  const sessionData = sessionStore.sessionData;
  sessionData.sessionQuiz = {
    quiz: new Task({
      title: data["session-quiz-title"],
      description: "",
      durationInMins: 0,
      isQuiz: true,
    }),
    UID: data["session-quiz-id"],
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

  wrapper.querySelector(".create-session-form").outerHTML = getTasksContainer();
  wrapper
    .querySelector(".finish-btn")
    .addEventListener("click", (e) =>
      handleFinishBtnClick(sessionStore.sessionData, e.target)
    );
  wrapper.querySelector("#progress-end-text").checked = true;

  setUpSwapBtn("back-btn", "create-session-form", wrapper, sessionStore);
  swapSessionOverlayContent("create-task-form", wrapper, sessionStore);
};

const setUpSessionForm = (wrapper, sessionStore) => {
  wrapper.querySelector("#progress-end-text").checked = false;
  wrapper
    .querySelector("textarea")
    .addEventListener("input", countCharsTextarea);
  const form = wrapper.querySelector("form");
  const quizzesSelectTrigger = wrapper.querySelector(".select-trigger");

  setUpSelectMenu(
    quizzesSelectTrigger,
    () => `
    <div class="select-search">
      <input id="select-search" type="search" />
    </div>
    <div class="select-group quizzes-menu drop-down-group"></div>
  `,
    true,
    (selectButtonValue, selectedItem, selectedValue) => {
      selectButtonValue.textContent = selectedItem.textContent;
      quizzesSelectTrigger.querySelector(
        'input[name="session-quiz-title"]'
      ).value = selectedItem.textContent;
      quizzesSelectTrigger.querySelector(
        'input[name="session-quiz-id"]'
      ).value = selectedValue;
    }
  );

  const quizzesMenu = wrapper.querySelector(".quizzes-menu");

  handleFormSubmit(
    form,
    () => checkSessionFormValidity(form),
    (data) => handleSessionForm(data, sessionStore, wrapper)
  );

  const loader = new Loader(
    quizzesMenu,
    "10px",
    createDropDownItem,
    "/quizzes-list?",
    getQuizLoaderLoadingItem(),
    () => getQuizLoaderSearchParams(wrapper),
    1
  );
  loader.reset();
  initFiltersInputListener(loader, quizzesSelectTrigger);
};

const checkSessionFormValidity = (form) => {
  // get inputs
  const name = form.querySelector("#session-name");
  const description = form.querySelector("#session-description");

  // check name and description
  if (!checkTextFieldValidity(name, description)) {
    return false;
  }
  return true;
};

const handleFinishBtnClick = async (sessionData, btn) => {
  const quiz = sessionData.sessionQuiz?.quiz;
  const tasksLength = sessionData.tasks.length;
  if (tasksLength === 0)
    return showMessageBlock(
      "You must add at least one task before finishing.",
      "info"
    );

  if (quiz && (!quiz.description || !quiz.durationInMins))
    return showMessageBlock(
      "Please complete the quiz details before finishing.",
      "info"
    );

  if (btn.isCreating) return;
  try {
    btn.isCreating = true;
    btn.disabled = true;
    btn.innerHTML = getLoader();
    sessionData.groupId = groupId;
    await sendData("/api/create-session", { sessionData });
    showMessageBlock("Session created successfully", "success");
    navigateTo("/home");
  } catch (error) {
    console.error("Error: ", error);
    showMessageBlock(error.message, "error");
  } finally {
    btn.isCreating = false;
    btn.disabled = false;
    btn.innerHTML = "Finish";
  }
};

const handleSessionForm = (data, sessionStore, wrapper) => {
  const sessionData = sessionStore.sessionData;
  sessionData.name = data["session-name"];
  sessionData.description = data["session-description"];

  if (shouldAddOrUpdateQuiz(data, sessionData)) {
    addOrUpdateQuizTask(data, sessionStore, wrapper);
    return;
  } else if (!data["session-quiz-title"] && !data["session-quiz-id"]) {
    sessionData.sessionQuiz = null;
    sessionStore.taskToEdit = null;
  }

  swapSessionOverlayContent("create-task-container", wrapper, sessionStore);
};

const setUpTaskContainer = (wrapper, sessionStore) => {
  wrapper.querySelector("#progress-end-text").checked = true;
  setUpSwapBtn("back-btn", "create-session-form", wrapper, sessionStore);

  wrapper.querySelector(".finish-btn").addEventListener("click", (e) => {
    handleFinishBtnClick(sessionStore.sessionData, e.target);
  });
  setUpTasksList(wrapper, sessionStore);
};

const resortTasksArray = (sessionData, wrapper) => {
  // After drag and drop, update the task order
  sessionData.tasks = Array.from(wrapper.querySelectorAll(".task-wrapper")).map(
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
  setUpSwapBtn("create-task-btn", "create-task-form", wrapper, sessionStore);
  setUpSwapBtn("create-break-btn", "create-task-form", wrapper, sessionStore);
  setUpDragAndDrop(".tasks-list", ".task", () =>
    resortTasksArray(sessionData, wrapper)
  );
  const durationBadge = wrapper.querySelector(".duration-badge");
  durationBadge.textContent = `Duration ${millisecondsToHMFormat(
    sessionData.duration * 60 * 1000
  )}`;
  const tasksList = wrapper.querySelector(".tasks-list");
  tasksList.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-task-btn");
    const removeBtn = e.target.closest(".remove-task-btn");
    if (editBtn) {
      const taskId = editBtn.closest(".task-wrapper ")?.dataset.taskId;
      sessionStore.taskToEdit = {
        task: sessionData.tasks[taskId],
        index: taskId,
      };
      swapSessionOverlayContent("create-task-form", wrapper, sessionStore);
    } else if (removeBtn) {
      const taskId = removeBtn.closest(".task-wrapper ")?.dataset.taskId;
      const task = sessionData.tasks[taskId];
      const isQuizTask = task.isQuiz;
      if (isQuizTask) {
        const res = await showConfirmationBox(
          "exclamation",
          "Remove Quiz",
          "Are you sure you want to remove the quiz?",
          "Cancel",
          "Remove Quiz"
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
  handletTasksListners("tasks-list-container");
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
    "cancel-task-creation",
    "tasks-list-container",
    wrapper,
    sessionStore
  );
  wrapper
    .querySelector(".cancel-task-creation")
    ?.addEventListener("click", () => {
      sessionStore.taskToEdit = null; // Reset after editing
      sessionStore.addBreak = false; // Reset after adding a break
    });
};

const updateTask = (sessionStore, data) => {
  const taskIndex = sessionStore.taskToEdit.index;
  const oldTaskDuration =
    sessionStore.sessionData.tasks[taskIndex].durationInMins;
  sessionStore.sessionData.duration -= oldTaskDuration;
  sessionStore.sessionData.tasks[taskIndex] = new Task({
    title: data["task-title"],
    description: data["task-description"] || "",
    durationInMins: parseInt(data["task-duration"], 10),
    isQuiz: sessionStore.taskToEdit.task.isQuiz,
    isBreak: sessionStore.taskToEdit.task.isBreak,
  });
  sessionStore.sessionData.duration += parseInt(data["task-duration"], 10);
  if (sessionStore.taskToEdit.addQuiz) {
    // If the task is a quiz, update the quiz as well
    sessionStore.sessionData.sessionQuiz.quiz =
      sessionStore.sessionData.tasks[taskIndex];
  }
  sessionStore.taskToEdit = null;
};

const addTask = (sessionData, data, addBreak) => {
  const task = new Task({
    title: data["task-title"],
    description: data["task-description"] || "",
    durationInMins: parseInt(data["task-duration"], 10),
    isQuiz: false,
    isBreak: addBreak,
  });
  sessionData.tasks.push(task);
  sessionData.duration += task.durationInMins;
};

// Helper to handle form submission for task form
const handleTaskFormSubmission = (form, wrapper, sessionStore) => {
  handleFormSubmit(
    form,
    () =>
      checkTaskFormValidity(
        form,
        sessionStore.taskToEdit?.task?.isBreak || sessionStore.addBreak
      ),
    (data) => {
      if (sessionStore.taskToEdit) {
        updateTask(sessionStore, data);
      } else {
        addTask(sessionStore.sessionData, data, sessionStore.addBreak);
        sessionStore.addBreak = false;
      }
      swapSessionOverlayContent("tasks-list-container", wrapper, sessionStore);
    }
  );
};

const setUpTaskForm = (wrapper, sessionStore) => {
  handleCancelTaskCreation(wrapper, sessionStore);
  if (!sessionStore.addBreak && !sessionStore.taskToEdit?.task.isBreak) {
    wrapper
      .querySelector("textarea")
      .addEventListener("input", countCharsTextarea);
  }
  const form = wrapper.querySelector("form");
  handleTaskFormSubmission(form, wrapper, sessionStore);
};

const configs = {
  "create-session-form": {
    getHtml: (sessionStore) =>
      getSessionForm(
        sessionStore.sessionData.name,
        sessionStore.sessionData.description,
        sessionStore.sessionData.sessionQuiz
      ),
    replaceClass: "create-task-container",
    setup: (wrapper, sessionStore) => setUpSessionForm(wrapper, sessionStore),
  },
  "create-task-container": {
    getHtml: (sessionStore) =>
      getTasksContainer(sessionStore.sessionData.tasks),
    replaceClass: "create-session-form",
    setup: (wrapper, sessionStore) => setUpTaskContainer(wrapper, sessionStore),
  },
  "tasks-list-container": {
    getHtml: (sessionStore) =>
      getTasksListContainer(sessionStore.sessionData.tasks),
    replaceClass: "create-task-form",
    setup: (wrapper, sessionStore) => setUpTasksList(wrapper, sessionStore),
  },
  "create-task-form": {
    getHtml: (sessionStore) =>
      getTaskForm(
        sessionStore.taskToEdit?.task,
        sessionStore.taskToEdit?.addQuiz,
        sessionStore.addBreak
      ),
    replaceClass: "tasks-list-container",
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
  groupLeftSideBar.classList.add("close");
  showInfoBtn
    .querySelector("i")
    .classList.replace("bi-x-circle", "bi-info-circle");
  showInfoBtn.setAttribute("data-tooltip", "Show group info");
};

const swapMode = (infoBox, modeFuncName, updatedValue, showInSearchValue) => {
  const editBoxClass = infoBox.className
    .split(" ")
    .find((c) => c.includes("-info-box"));
  if (updatedValue) {
    groupInfo[dashedToCamelCase(editBoxClass.split("-info-box")[0])] =
      updatedValue;
  }
  if (showInSearchValue !== undefined) {
    groupInfo["showInSearch"] = showInSearchValue;
  }
  const value =
    groupInfo[dashedToCamelCase(editBoxClass.split("-info-box")[0])];
  const showInSearchInput =
    showInSearchValue !== null ? showInSearchValue : null;
  const infoBoxClone = infoBox.cloneNode();

  infoBoxClone.innerHTML = groupInfoElementsMap[editBoxClass][modeFuncName](
    value,
    showInSearchInput
  );
  if (modeFuncName === "getEditMode") {
    if (editBoxClass === "subject-info-box") {
      setUpSelectMenu(infoBoxClone);
    }
    if (["visibility-info-box", "level-info-box"].includes(editBoxClass)) {
      setUpSwitchBtn(infoBoxClone);
    }
  }
  infoBox.replaceWith(infoBoxClone);
  resetTooltip(hoverTooltip);
};

export const handleViewAllMembersBtn = (e) => {
  const viewAllMembersBtn = e.target.closest(
    ".view-all-btn, .manage-members-btn"
  );
  if (viewAllMembersBtn) {
    handleMembersListMenuBtn();
  }
};

// Sub-functions for group sidebar actions
const handleKickMember = async (kickBtn) => {
  const memberId = kickBtn
    .closest(".action-btns")
    .getAttribute("data-member-id");
  const res = await showConfirmationBox(
    "exclamation",
    "Kick Member",
    "Are you sure you want to kick this member?",
    "Cancel",
    "Kick"
  );
  if (!res) return;
  handleApiAction("/kick-member", { groupId, memberId }, kickBtn, {
    successMsg: "Member kicked successfully",
    onSuccess: () => {
      kickBtn.closest(".member").remove();
      const badgeCount = document.querySelector(".side-bar-title .badge");
      badgeCount.textContent = parseInt(badgeCount.textContent, 10) - 1;
    },
  });
};

const handleMoveAdminRole = async (moveAdminRoleBtn) => {
  const memberId = moveAdminRoleBtn
    .closest(".action-btns")
    .getAttribute("data-member-id");
  const res = await showConfirmationBox(
    "exclamation",
    "Move Admin Role",
    "Are you sure you want to move this member to admin?",
    "Cancel",
    "Move"
  );
  if (!res) return;
  handleApiAction("/transfer-role", { groupId, memberId }, moveAdminRoleBtn, {
    successMsg: "Role transferred successfully",
    onSuccess: () => navigateTo(`/groups/my/${groupId}/chat`), // Refresh the page to reflect changes
  });
};

const handleAcceptDemande = (acceptBtn) => {
  const demandeId = acceptBtn
    .closest(".action-btns")
    .getAttribute("data-user-id");
  handleApiAction("/accept-demande", { demandeId, groupId }, acceptBtn, {
    successMsg: "Demande accepted",
    onSuccess: () => {
      acceptBtn.closest(".demande").remove();
      const badgeCount = document.querySelector(".side-bar-title .badge");
      badgeCount.textContent = parseInt(badgeCount.textContent, 10) - 1;
    },
  });
};

const handleRejectDemande = (rejectBtn) => {
  const demandeId = rejectBtn
    .closest(".action-btns")
    .getAttribute("data-user-id");
  handleApiAction("/reject-demande", { demandeId, groupId }, rejectBtn, {
    successMsg: "Demande rejected",
    onSuccess: () => {
      rejectBtn.closest(".demande").remove();
      const badgeCount = document.querySelector(".side-bar-title .badge");
      badgeCount.textContent = parseInt(badgeCount.textContent, 10) - 1;
    },
  });
};

export const handleGroupLeftSideBarContent = (e) => {
  handleEditBtn(e);
  handleSaveAndCancelBtns(e);
  handleViewAllMembersBtn(e);
  handleDemandesBtn(e);

  // Kick member
  const kickBtn = e.target.closest(".kick-btn");
  if (kickBtn) {
    handleKickMember(kickBtn);
    return;
  }

  // Move admin role
  const moveAdminRoleBtn = e.target.closest(".move-admin-role-btn");
  if (moveAdminRoleBtn) {
    handleMoveAdminRole(moveAdminRoleBtn);
    return;
  }

  // Accept demande
  const acceptBtn = e.target.closest(".accept-btn");
  if (acceptBtn) {
    handleAcceptDemande(acceptBtn);
    return;
  }

  // Reject demande
  const rejectBtn = e.target.closest(".reject-btn");
  if (rejectBtn) {
    handleRejectDemande(rejectBtn);
    return;
  }
};

const createQuizItem = (quiz) => {
  const quizCard = document.createElement("div");
  quizCard.className = "quiz-card";
  quizCard.setAttribute("data-quiz-id", quiz.quizId || quiz.id);

  quizCard.innerHTML = `
    <div class="quiz-title-container info-container">
      <label class="quiz-title-label">
        <span class="icon-box">
          <i class="bi bi-question-circle"></i>
        </span>
        Quiz title
      </label>
      <div class="quiz-title content"></div>
    </div>
    <div class="session-name-container info-container">
      <label class="session-name-label">
        <span class="icon-box">
          <i class="bi bi-clock-history"></i>
          <i class="bi bi-info-circle"></i>
        </span>
        Session name
      </label>
      <div class="session-name content"></div>
    </div>
    <div class="questions-container info-container small-container">
      <label class="questions-label">
        <span class="icon-box">
          <i class="bi bi-question-circle"></i>
        </span>
        Questions
      </label>
      <div class="questions content">
        <span></span>
      </div>
    </div>
    <div class="quiz-date-container info-container small-container">
      <label class="quiz-date-label">
        <span class="icon-box">
          <i class="bi bi-calendar-event"></i>
        </span>
        submittedAt
        ${
          !quiz.submittedAt
            ? `<i style="margin-left: auto;" class="bi bi-info-circle has-tooltip" data-tooltip="${
                quiz.isAdmin
                  ? "Admin can't submit quizzes"
                  : "You haven't submitted the quiz"
              }"></i>`
            : ""
        }
      </label>
      <div class="quiz-date content">
        <span></span>
      </div>
    </div>
    <div class="action-btns">
      <button
        type="button"
        class="view-result${quiz.isAdmin ? "s" : ""}-btn should-fill"
      >
        <i class="bi bi-eye"></i>
        View ${quiz.isAdmin ? "Results" : "Result"}
      </button>
      ${
        !quiz.isAdmin
          ? `<button type="button" class="retake-btn">
              <i class="bi bi-arrow-repeat"></i>
              Retake
            </button>`
          : ""
      }
    </div>
  `;

  quizCard.querySelector(".quiz-title.content").textContent = quiz.title || "";
  quizCard.querySelector(".session-name.content").textContent =
    quiz.sessionName || "N/A";
  quizCard.querySelector(".questions.content span").textContent =
    quiz.questionsCount || 0;
  quizCard.querySelector(".quiz-date.content span").textContent =
    quiz.submittedAt || "N/A";

  return quizCard;
};

const createQuizItemLoader = () => {
  const quizCard = document.createElement("div");
  quizCard.className = "quiz-card loading-card loading-animation";
  quizCard.innerHTML = `
    <div class="quiz-title-container info-container">
      <label class="quiz-title-label">
        <span class="icon-box">
          <i class="bi bi-question-circle"></i>
        </span>
        Quiz title
      </label>
      <div class="quiz-title content loading-opacity-animation" style="width: 60%; height: 1.2em; border-radius: 0.5em;"></div>
    </div>
    <div class="questions-container info-container small-container">
      <label class="questions-label">
        <span class="icon-box">
          <i class="bi bi-question-circle"></i>
        </span>
        Questions
      </label>
      <div class="questions content loading-opacity-animation" style="width: 30%; height: 1.2em; border-radius: 0.5em;"></div>
    </div>
    <div class="quiz-date-container info-container small-container">
      <label class="quiz-date-label">
        <span class="icon-box">
          <i class="bi bi-calendar-event"></i>
        </span>
        submittedAt
      </label>
      <div class="quiz-date content loading-opacity-animation" style="width: 40%; height: 1.2em; border-radius: 0.5em;"></div>
    </div>
    <div class="action-btns loading-opacity-animation" style="width: 80px; height: 2em; border-radius: 1em; margin-top: 1em;"></div>
  `;
  return quizCard;
};

const getSearchCriteria = () => {
  const search = groupLeftSideBar.querySelector("#search");
  const date = groupLeftSideBar.querySelector('input[type="date"]');
  const sort = groupLeftSideBar.querySelector('input[type="checkbox"]');
  return `search=${search.value}${date ? "&date=" + date.value : ""}${
    sort ? "&sort=" + (sort.checked ? "asc" : "desc") : ""
  }`;
};

const handleQuizCardBtns = (e) => {
  const quizId = e.target.closest(".quiz-card")?.dataset.quizId;
  const viewResults = e.target.closest(".view-results-btn");
  if (viewResults) openQuizResultsOverlay(quizId, groupId);
  const viewResult = e.target.closest(".view-result-btn");
  if (viewResult) openQuizResultOverlay({ quizId });
  const retakeBtn = e.target.closest(".retake-btn");
  if (retakeBtn) navigateTo(`/quiz-play/${quizId}`);
};

export const handleQuizzesListMenuBtn = async () => {
  await openGroupLeftSideBar("/quizzes-list");
  setUpDatePicker(groupLeftSideBarContent);
  const container = groupLeftSideBar.querySelector(".quizzes-list");
  container.addEventListener("click", (e) => handleQuizCardBtns(e));
  const loader = new Loader(
    container,
    "200px",
    createQuizItem,
    "/group-quizzes?groupId=" + groupId + "&",
    createQuizItemLoader(),
    getSearchCriteria,
    1
  );
  initFiltersInputListener(loader, groupLeftSideBar);
};

const createMemberCard = (member) => {
  const memberDiv = document.createElement("div");
  memberDiv.className = "member";

  memberDiv.innerHTML = `
    <div class="avatar">
      ${
        member.photoURL
          ? `<img src="${member.photoURL}" alt="avatar" />`
          : `<h4>${
              escapeHTML(member.fullName)?.charAt(0)?.toUpperCase() || ""
            }</h4>`
      }
    </div>
    <span class="username"></span>
    ${
      member.isAdmin
        ? `<span ${
            member.userIsAdmin ? 'style="margin-right: auto;"' : ""
          } class="badge orange-badge"${
            member.userIsAdmin ? ' style="margin-right:auto"' : ""
          }>Host</span>`
        : ""
    }
    ${
      member.userIsAdmin && !member.isAdmin
        ? `<div class="action-btns" data-member-id="${member.id}">
            <button type="button" class="red-btn kick-btn small-btn">
              <i class="bi bi-person-dash"></i> Kick
            </button>
            <button type="button" class="orange-btn move-admin-role-btn small-btn">
              <i class="bi bi-person-gear"></i> Transfer Admin
            </button>
          </div>`
        : ""
    }
  `;

  memberDiv.querySelector(".username").textContent = member.fullName || "";
  return memberDiv;
};

const createMemberCardLoader = () => {
  const memberDiv = document.createElement("div");
  memberDiv.className = "member loading-card loading-animation";
  memberDiv.innerHTML = `
    <div class="avatar loading-opacity-animation">
      <div class="img loading-opacity-animation" style="width: 40px; height: 40px; border-radius: 50%; background: #eee;"></div>
    </div>
    <span class="username loading-opacity-animation" style="width: 80px; height: 1.2em; border-radius: 0.5em; display: inline-block;"></span>
  `;
  return memberDiv;
};

const handleMembersLoader = () => {
  const membersList = groupLeftSideBar.querySelector(".members-list");
  membersList.addEventListener("click", (e) => {
    const kickBtn = e.target.closest(".kick-btn");
    if (kickBtn) {
      handleKickMember(kickBtn);
      return;
    }

    // Move admin role
    const moveAdminRoleBtn = e.target.closest(".move-admin-role-btn");
    if (moveAdminRoleBtn) {
      handleMoveAdminRole(moveAdminRoleBtn);
      return;
    }
  });
};

export const handleMembersListMenuBtn = async () => {
  await openGroupLeftSideBar("/members-list");
  const inviteUserBtn = groupLeftSideBar.querySelector(".invite-user-btn");
  const search = groupLeftSideBar.querySelector(".members-search #search");
  const membersResults = groupLeftSideBar.querySelector(".members-list");
  inviteUserBtn?.addEventListener("click", handleAddMembersBtn);
  const loader = new Loader(
    membersResults,
    "200px",
    createMemberCard,
    "/group-members?groupId=" + groupId + "&",
    createMemberCardLoader(),
    () => `search=${search.value}`,
    1,
    (data) => handleMembersLoader()
  );

  initFiltersInputListener(loader, search);
};

export const handleSessionInfoMenuBtn = async () => {
  await openGroupLeftSideBar("/session-info");
  handletTasksListners("session-info");
};

export const handleRemoveGroup = async (e) => {
  const res = await showConfirmationBox(
    "exclamation",
    "Remove group",
    "Are you sure you want to remove this group?",
    "Cancel",
    "Remove"
  );
  if (res) {
    handleApiAction(`/remove-group/${groupId}`, {}, e.target, {
      successMsg: "Group removed successfully",
      onSuccess: () => navigateTo("/groups/my"),
      method: "DELETE",
    });
  }
};

export const handleDemandesBtn = async (e) => {
  const demandesBtn = e.target.closest(".demandes-btn");
  if (demandesBtn) {
    setUpDemandes();
  }
};

const createDemandeCard = (demande) => {
  const demandeDiv = document.createElement("div");
  demandeDiv.className = "demande";

  demandeDiv.innerHTML = `
    <div class="avatar">
      ${
        demande.photoURL
          ? `<img src="${demande.photoURL}" alt="avatar" />`
          : `<h4>${
              escapeHTML(demande.fullName)?.charAt(0)?.toUpperCase() || ""
            }</h4>`
      }
    </div>
    <div class="username-container">
      <span class="username"></span>
      <span class="request-date"></span>
    </div>
    <div class="action-btns" data-user-id="${demande.userId}">
      <button type="button" class="red-btn reject-btn small-btn">
        <i class="bi bi-x-circle"></i>
        Reject
      </button>
      <button type="button" class="green-btn accept-btn small-btn">
        <i class="bi bi-check-circle"></i>
        Accept
      </button>
    </div>
  `;

  demandeDiv.querySelector(".username").textContent = demande.fullName || "";
  demandeDiv.querySelector(".request-date").textContent =
    demande.demandeDate || "";
  return demandeDiv;
};

const createDemandeCardLoader = () => {
  const loadingCard = document.createElement("div");
  loadingCard.className = "demande loading-card loading-animation";
  loadingCard.style.flex = "0 0 calc(((100% - 16 * 0.8rem) / 16))";
  loadingCard.innerHTML = `
    <div class="avatar loading-opacity-animation">
      <div class="img loading-opacity-animation"></div>
    </div>
    <div style="height: 100%;display: flex;justify-content: space-around;flex: 0 0 40%" class="username-container">
      <span style="width: 100%; border-radius: 1rem; flex: 0 0 50%;" class="username loading-opacity-animation"></span>
      <span style="width: 100%; border-radius: 1rem; flex: 0 0 25%;" class="request-date loading-opacity-animation"></span>
    </div>
    <div style="height:100%; flex: 0 0 43%" class="action-btns">
      <div style="width: 50%; height: 100%; border-radius: var(--primary-radius);" class="red-btn loading-opacity-animation"></div>
      <div style="width: 50%; height: 100%; border-radius: var(--primary-radius);" class="green-btn loading-opacity-animation"></div>
    </div>
  `;
  return loadingCard;
};

const handleDemandeCardBtns = (e) => {
  // Accept demande
  const acceptBtn = e.target.closest(".accept-btn");
  if (acceptBtn) {
    handleAcceptDemande(acceptBtn);
    return;
  }

  // Reject demande
  const rejectBtn = e.target.closest(".reject-btn");
  if (rejectBtn) {
    handleRejectDemande(rejectBtn);
    return;
  }
};

export const setUpDemandes = async () => {
  await openGroupLeftSideBar("/demandes-list");
  setUpDatePicker(groupLeftSideBarContent);
  const container = groupLeftSideBar.querySelector(".demandes-list");
  container.addEventListener("click", (e) => handleDemandeCardBtns(e));
  const loader = new Loader(
    container,
    "200px",
    createDemandeCard,
    "/group-demandes?groupId=" + groupId + "&",
    createDemandeCardLoader(),
    getSearchCriteria,
    1
  );
  initFiltersInputListener(loader, groupLeftSideBar);
};

export const handleEditBtn = (e) => {
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const infoBox = editBtn.closest(".info-box");
    const showInSearch = infoBox.querySelector("#show-in-search");
    swapMode(
      infoBox,
      "getEditMode",
      "",
      showInSearch ? showInSearch.checked : null
    );
  }
};

// Helper: Get info box conditions
const getInfoBoxConditions = (editBoxClass, input) => ({
  isVisbilityBox: editBoxClass === "visibility-info-box",
  isLevelBox: editBoxClass === "level-info-box",
  isSubjectBox: editBoxClass === "subject-info-box",
  isGroupDescriptionBox: editBoxClass === "group-description-info-box",
  isGroupNameBox: editBoxClass === "group-name-info-box",
  isMaxMembersBox: editBoxClass === "max-members-info-box",
  isInputElement: ["INPUT", "TEXTAREA"].includes(input.tagName),
});

// Helper: Check if value has changed
const isValueUnchanged = (
  input,
  oldValue,
  CONDITIONS,
  showInSearchInput,
  oldValueShowInSearch
) => {
  if (CONDITIONS.isVisbilityBox) {
    return (
      (input?.dataset.value === "Private" &&
        showInSearchInput.checked === oldValueShowInSearch &&
        input?.dataset.value === oldValue) ||
      (input?.dataset.value === "Public" && input?.dataset.value === oldValue)
    );
  }
  return input.value === oldValue || input?.dataset.value === oldValue;
};

// Handle cancel button: revert to view mode
const handleCancelBtn = (cancelBtn) => {
  const infoBox = cancelBtn.closest(".info-box");
  swapMode(infoBox, "getViewMode");
};

// Handle save button logic
const handleSaveBtn = (saveBtn) => {
  const infoBox = saveBtn.closest(".info-box");
  const infoWrapper = infoBox.querySelector(".info-container");
  const editBoxClass = infoBox.className
    .split(" ")
    .find((c) => c.includes("-info-box"));
  const oldValue =
    groupInfo[dashedToCamelCase(editBoxClass.split("-info-box")[0])];
  const oldValueShowInSearchInput = groupInfo["showInSearch"];

  const input = infoBox.querySelector(".value");
  const showInSearchInput = infoBox.querySelector("#show-in-search");

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
    swapMode(infoBox, "getViewMode", "", oldValueShowInSearchInput);
    return;
  }
  const isValid = checkValidity(input, CONDITIONS);

  if (isValid) {
    infoWrapper.classList.remove("error-input");
    handleSaveAction(input, infoBox, CONDITIONS, saveBtn, showInSearchInput);
  }
};

// Handles save and cancel button actions in the group info sidebar
export const handleSaveAndCancelBtns = (e) => {
  const saveBtn = e.target.closest(".save-btn");
  const cancelBtn = e.target.closest(".cancel-btn");

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
  saveBtn,
  showInSearchInput
) => {
  try {
    saveBtn.innerHTML = getLoader();
    saveBtn.disabled = true;
    saveBtn.isUpdating = true;
    resetTooltip(hoverTooltip);

    const updatedData = {
      fieldName: input.name ? input.name : input.getAttribute("name"),
      value: "",
    };
    if (CONDITIONS.isVisbilityBox) {
      updatedData.value = {};
      if (input?.dataset.value !== groupInfo.visibility)
        updatedData.value.visibility = input?.dataset.value;
      if (
        input?.dataset.value === "Private" &&
        showInSearchInput.checked !== groupInfo.showInSearch
      )
        updatedData.value.showInSearch = showInSearchInput.checked;
    } else {
      updatedData.value = CONDITIONS.isInputElement
        ? input.value.trim()
        : input?.dataset.value;
    }
    await sendData("/api/update-group/" + groupId, { updatedData }, "PATCH");
    const updatedValue =
      typeof updatedData.value === "object"
        ? updatedData.value.visibility
        : updatedData.value;
    const showInSearchValue =
      CONDITIONS.isVisbilityBox && input?.dataset.value === "Private"
        ? showInSearchInput.checked
        : null;

    swapMode(infoBox, "getViewMode", updatedValue, showInSearchValue);
    showMessageBlock("Group info updated successfully", "success");
  } catch (error) {
    console.log("Error", error);
    showMessageBlock(error.message, "error");
  } finally {
    saveBtn.innerHTML = '<i class="bi bi-floppy"></i>';
    saveBtn.disabled = false;
    saveBtn.isUpdating = false;
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
      input.closest(".info-edit-wrapper"),
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
      input.closest(".info-edit-wrapper"),
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
      input.closest(".info-edit-wrapper"),
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
      input.closest(".info-edit-wrapper"),
      "Please select a valid option"
    );
    return false;
  }

  return true;
};

const getQuizLoaderLoadingItem = () => {
  const div = document.createElement("div");
  div.className = "select-item drop-down-item loading-card";
  div.innerHTML = `<div class="loading-opacity-animation"></div>`;
  return div;
};

const getQuizLoaderSearchParams = (wrapper) => {
  const searchInput = wrapper.querySelector("#select-search");
  return `searchTerm=${searchInput.value.toLowerCase().trim()}`;
};

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const createDropDownItem = (quiz, searchTerm) => {
  const div = document.createElement("div");
  div.className = "select-item drop-down-item";
  div.setAttribute("data-value", quiz.id);

  const title = quiz.title;
  const escapedTitle = escapeHTML(title);
  const escapedSearchTerm = escapeHTML(searchTerm);

  // Create a case-insensitive RegExp to find the search term
  const regex = new RegExp(`(${escapedSearchTerm})`, "ig");

  // Highlight matched part
  const highlightedTitle = escapedTitle.replace(regex, "<mark>$1</mark>");

  div.innerHTML = highlightedTitle;

  return div;
};

export const handleAddMembersBtn = () => {
  openOverlayModal(
    "add-members-overlay",
    [".close-overlay-btn", ".cancel-btn"],
    getAddMembersOverlay,
    setUpAddMembersOverlay
  );
};

const getAddMembersOverlay = () => {
  return `
    <div class="overlay-model add-members-overlay">
      <header class="list-header">
      <h3 class="label">
        <i class="bi bi-people-fill"></i>
        Invite Members
      </h3>
      <!-- close btn -->
      <button type="button" class="close-overlay-btn exclude-btn">
        <i class="bi bi-x-lg"></i>
      </button>
      </header>
      <section class="text-helper">
      Enter the user’s ID or name to invite them to the group
      </section>
      <section class="search-sec">
      <div class="members-search users-search">
        <div class="search-icon-container">
        <i class="bi bi-person-fill"></i>
        </div>

        <input
        type="search"
        id="search"
        placeholder="Search By Member Name or ID"
        />
      </div>
      </section>
      <section class="users-result">
      </section>
      <div class="action-btns">
      <button type="button" class="btn blue-btn confirm-btn">
        Confirm
      </button>
      <button type="button" class="btn gray-btn cancel-btn">
        Cancel
      </button>
      </div>
    </div>
    `;
};

const createUserBadge = (user) => {
  const badge = document.createElement("div");
  badge.className = "user-badge badge simple-badge";
  badge.innerHTML = `
  <div class="avatar">
    <img
      alt="Member Avatar"
    />
  </div>
  <span class="full-name"></span>
  <button class="remove-btn exclude-btn">
    <i class="bi bi-x"></i>
  </button>
  `;
  badge.querySelector("img").setAttribute("src", user.photoURL);
  badge.setAttribute("data-user-id", user.id);
  badge.querySelector(".full-name").textContent = user.fullName;
  return badge;
};

const updateSelectedUsers = (container, user, action, removeFromUsers) => {
  let selectedUsersContainer = container.querySelector(".selected-users");
  const searchSection = container.querySelector(".search-sec");
  if (!selectedUsersContainer) {
    selectedUsersContainer = createSelectedUsersDiv(
      container,
      searchSection,
      removeFromUsers
    );
  }
  const selectedUsersBadges =
    selectedUsersContainer.querySelectorAll(".user-badge");

  if (action === "add") {
    const userBadge = createUserBadge(user);
    selectedUsersContainer.appendChild(userBadge);
  } else {
    selectedUsersBadges.forEach((badge) => {
      if (badge.dataset.userId === user.id) {
        badge.remove();
      }
    });
  }

  if (selectedUsersContainer.childElementCount === 0)
    selectedUsersContainer.remove();
};

function createSelectedUsersDiv(container, searchSection, removeFromUsers) {
  const selectedUsersContainer = document.createElement("div");
  selectedUsersContainer.className = "selected-users";
  searchSection.after(selectedUsersContainer);
  selectedUsersContainer.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".remove-btn");
    if (removeBtn) {
      const userId = removeBtn.closest(".user-badge").dataset.userId;
      const userInResult = container.querySelector(
        `.user-item[data-user-id="${userId}"]`
      );
      if (userInResult) userInResult.querySelector("input").checked = false;
      removeFromUsers(userId);
      updateSelectedUsers(container, { id: userId }, "remove", removeFromUsers);
    }
  });

  return selectedUsersContainer;
}

const inviteUsersToGroup = (users, confirmBtn) => {
  handleApiAction("/invite-users", { groupId, users }, confirmBtn, {
    successMsg: "Users invited successfully!",
    onSuccess: () => closeOverlayModal("add-members-overlay"),
  });
};

const handleConfirmClick = (users, confirmBtn) => {
  if (users.length === 0) {
    showMessageBlock("Please select at least one user to add.", "info");
    return;
  } else {
    inviteUsersToGroup(users, confirmBtn);
  }
};

const handleMembersResultsInput = (e, users, container, removeFromUsers) => {
  const card = e.target.closest(".user-item");
  const user = {
    fullName: card.querySelector(".full-name").textContent,
    photoURL: card.querySelector("img").src,
    id: card.dataset.userId,
  };

  if (e.target.checked) {
    if (users.length >= 5)
      return showMessageBlock(
        "You can only invite up to 5 users at a time.",
        "info"
      );

    users.push(user.id);
    updateSelectedUsers(container, user, "add", removeFromUsers);
  } else {
    users.splice(users.indexOf(user.id), 1);
    updateSelectedUsers(container, user, "remove", removeFromUsers);
  }
};

const handleUsersLoader = (data, container, users) => {
  const usersResults = container.querySelector(".users-result");
  const search = container.querySelector(".members-search input");
  let badgeCount = container.querySelector(".results-count");
  if (!badgeCount) {
    badgeCount = document.createElement("span");
    badgeCount.className = "badge simple-badge results-count";
    usersResults.before(badgeCount);
  }
  if (search.value === "") return badgeCount.remove();
  badgeCount.textContent = `${data.cards.length} Users Found`;
  data.cards.forEach((card) => {
    if (users.includes(card.id)) {
      const userInResult = usersResults.querySelector(
        `.user-item[data-user-id="${card.id}"]`
      );
      if (userInResult) userInResult.querySelector("input").checked = true;
    }
  });
};

const createUserCard = (user) => {
  const card = document.createElement("label");
  card.className =
    "container user-item" + (user.isAlreadyMember ? " disabled" : "");
  card.innerHTML = `
  <input type="checkbox" ${user.isAlreadyMember ? "disabled" : ""} />
  <svg viewBox="0 0 64 64" height="2em" width="2em">
    <path
      d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
      pathLength="575.0541381835938"
      class="path"
    ></path>
  </svg>
  <div class="avatar">
    <img
      src="${user.photoURL}"
      alt="Member Avatar"
    />
  </div>
  <div class="wrapper">
    <span class="full-name"></span>
    ${
      user.isAlreadyMember
        ? `<span class="already-member">Already A member</span>`
        : ""
    }
  </div>
  `;

  card.querySelector(".full-name").textContent = user.fullName || "N/A";
  card.setAttribute("data-user-id", user.id);
  return card;
};

const createUserLoadingCard = () => {
  const loadingCard = document.createElement("label");
  loadingCard.className = "container user-item loading-card loading-animation";
  loadingCard.innerHTML = `
    <input type="checkbox" disabled />
    <svg viewBox="0 0 64 64" height="2em" width="2em" class="loading-opacity-animation">
      <path
        d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
        pathLength="575.0541381835938"
        class="path"
      ></path>
    </svg>
    <div class="avatar loading-opacity-animation">
      <div class="img loading-opacity-animation"></div>
    </div>
    <span style="width: 50%; border-radius: 1rem" class="full-name loading-opacity-animation"></span>
  `;
  return loadingCard;
};

const setUpAddMembersOverlay = (container) => {
  const users = [];
  const removeFromUsers = (userId) => {
    users.splice(users.indexOf(userId), 1);
  };
  const search = container.querySelector(".members-search input");
  const usersResults = container.querySelector(".users-result");
  const confirmBtn = container.querySelector(".confirm-btn");

  confirmBtn.addEventListener("click", () =>
    handleConfirmClick(users, confirmBtn)
  );

  usersResults.addEventListener("input", (e) =>
    handleMembersResultsInput(e, users, container, removeFromUsers)
  );

  const loader = new Loader(
    usersResults,
    "200px",
    createUserCard,
    "/users?groupId=" + groupId + "&",
    createUserLoadingCard(),
    () => `search=${search.value}`,
    1,
    (data) => handleUsersLoader(data, container, users)
  );

  initFiltersInputListener(loader, search);
};
