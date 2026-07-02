import {
  fetchData,
  sendData,
  showMessageBlock,
} from "../../../../../main_assets/js/utils.js";
import { timers } from "../../../global/js/variables.js";
import {
  handleApiAction,
  millisecondsToHMFormat,
  navigateTo,
  updateMain,
} from "../../../global/js/utils.js";
import {
  openQuizResultOverlay,
  openQuizResultsOverlay,
} from "../../../shared/quiz-result/js/utils.js";
import { Task } from "../../../shared/tasks/js/utils.js";
import {
  QUIZSELECTORS,
  retakeBtn,
  SESSIONSSELECTORS,
  tasksBadgesContainer,
  TASKSSELECTORS,
  viewResultBtn,
  viewResultsBtn,
} from "./dom-variables.js";

export const expandAndShrinkDescription = (e) => {
  const btn = e.currentTarget;

  if (btn.classList.toggle("expanded")) {
    btn.parentElement.nextElementSibling.style.webkitLineClamp = "unset";
  } else {
    setTimeout(() => {
      btn.parentElement.nextElementSibling.style.webkitLineClamp = "3";
      btn.parentElement.nextElementSibling.scroll(0, 0);
    }, 300);
  }
};

export class FlipTimer {
  constructor(durationInMsecs) {
    this.initTimer(durationInMsecs);
    this.initEventListener();
  }
  tick() {
    const now = Date.now();
    const remainingTime = this.endTime - now;

    if (remainingTime > 0) {
      const delay = remainingTime % 1000 || 1000;
      const seconds = (Math.floor(remainingTime / 1000) % 60)
        .toString()
        .padStart(2, "0");
      const minutes = (Math.floor(remainingTime / 1000 / 60) % 60)
        .toString()
        .padStart(2, "0");
      const hours = Math.floor(remainingTime / 1000 / 60 / 60)
        .toString()
        .padStart(2, "0");

      this.onUpdate({ hours, minutes, seconds });

      this._timer = setTimeout(() => this.tick(), delay);
      timers.timer = this._timer;
    } else {
      this.onComplete();
    }
  }

  stop() {
    clearTimeout(this._timer);
  }

  onUpdate({ hours, minutes, seconds }) {
    this.handleUnitChange("hours", hours);
    this.handleUnitChange("minutes", minutes);
    this.handleUnitChange("seconds", seconds);

    // store for next time
    this.prev = { hours, minutes, seconds };
  }

  handleUnitChange(unit, newDigits) {
    const oldDigits = this.prev[unit];
    const sides = ["left", "right"];

    sides.forEach((side, idx) => {
      if (newDigits[idx] !== oldDigits[idx]) {
        this.flip(newDigits[idx], unit, side);
      }
    });
  }

  initTimer(durationInMsecs) {
    this.initDigits();
    this.endTime = Date.now() + durationInMsecs;
    this._timer = null;
    this.prev = { hours: "00", minutes: "00", seconds: "00" };
    this.tick();
  }

  initDigits() {
    this.digits = {
      hours: { left: null, right: null },
      minutes: { left: null, right: null },
      seconds: { left: null, right: null },
    };
    ["hours", "minutes", "seconds"].forEach((unit) => {
      ["left", "right"].forEach((side) => {
        this.digits[unit][side] = {
          topContainer: document.querySelector(
            `.flip-${unit}-${side}-digit .flip-top-container`
          ),
          topFrontBackText: document.querySelector(
            `.flip-${unit}-${side}-digit .flip-face-top-front-back span`
          ),
          topBackText: document.querySelector(
            `.flip-${unit}-${side}-digit .flip-face-top-back span`
          ),
          topFrontFontText: document.querySelector(
            `.flip-${unit}-${side}-digit .flip-face-top-front-front span`
          ),
          bottomSpan: document.querySelector(
            `.flip-${unit}-${side}-digit .flip-face-bottom span`
          ),
        };
      });
    });
  }

  initEventListener() {
    document.addEventListener("animationend", this.eventListner);
  }

  // event listner
  eventListner(e) {
    const flipContainer = e.target;
    if (flipContainer.matches(".flip-top-container")) {
      const bottomSpan = flipContainer
        .closest(".flip-digit")
        .querySelector(".flip-face-bottom span");
      const topFrontFontText = flipContainer
        .closest(".flip-digit")
        .querySelector(".flip-face-top-front-front span");
      const number = bottomSpan?.dataset.nextDigit;
      bottomSpan.textContent = number;
      topFrontFontText.textContent = number;
      flipContainer.classList.remove("flip");
    }
  }

  flip(number, unit, side) {
    this.digits[unit][side].topFrontBackText.textContent = number;
    this.digits[unit][side].topBackText.textContent = number;
    this.digits[unit][side].topContainer.classList.add("flip");
    this.digits[unit][side].bottomSpan.dataset.nextDigit = number;
  }

  onComplete() {
    removeEventListener("animationend", this.eventListner);
  }
}

export class Quiz extends Task {
  constructor({
    UID,
    title,
    description,
    durationInMins,
    questionsCount,
    passed,
    status,
    isAdmin,
    groupId,
  }) {
    super({ UID, title, description, durationInMins });
    this.questionsCount = questionsCount;
    this.elapsedTime = document.querySelector(QUIZSELECTORS.startTime);
    this.score = document.querySelector(QUIZSELECTORS.score);

    if (status) {
      this.status = status;
    }

    if (passed) {
      this.passed = passed;
    }

    if (groupId) {
      Session.groupId = groupId;
    }
    
    this.isAdmin = isAdmin;
  }
  updateElapsedTime({ quizElapsedTime, status }) {
    if (status === "active" && !this.passed && !this.isAdmin) {
      navigateTo(`/quiz-play/${this.UID}?groupId=${Session.groupId}`);
    }

    if (quizElapsedTime) {
      this.elapsedTime.textContent = quizElapsedTime;
    } else {
      let current = parseInt(this.elapsedTime.textContent, 10);
      if (current) {
        current--;
        this.elapsedTime.textContent =
          current.toString().padStart(2, "0") + "m";
      }
    }
  }

  calculateScore(submittedQuestionsCount) {
    return `${
      (submittedQuestionsCount / this.questionsCount).toFixed(0) * 100
    }%`;
  }

  addQuizBtns() {
    const quizFooter = document.querySelector(QUIZSELECTORS.quizFooter);
    if (!quizFooter) return;

    this.addViewResultBtn(quizFooter);
    if (!this.isAdmin) {
      this.addRetakeBtn(quizFooter);
    }
  }

  addViewResultBtn(quizFooter) {
    const existedButton1 = quizFooter.querySelector(".result-btn");
    const existedButton2 = quizFooter.querySelector(".results-btn");
    if (existedButton1) return;
    if (existedButton2) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `result${this.isAdmin ? "s" : ""}-btn should-fill`;
    button.innerHTML = `
      <i class="bi bi-eye"></i>
      View ${this.isAdmin ? "Results" : "Result"}
    `;

    if (!this.isAdmin) {
      button.addEventListener("click", () =>
        openQuizResultOverlay({
          quizId: this.UID,
        })
      );
    } else {
      button.addEventListener("click", () =>
        openQuizResultsOverlay(this.UID, Session.groupId)
      );
    }
    quizFooter.append(button);
  }

  addRetakeBtn(quizFooter) {
    const existedRetakeButton = quizFooter.querySelector(".retake-btn");
    if (existedRetakeButton) return;

    const retakeBtn = document.createElement("button");
    retakeBtn.type = "button";
    retakeBtn.className = "retake-btn";
    retakeBtn.innerHTML = `
      <i class="bi bi-arrow-clockwise"></i>
      Retake Quiz
    `;
    retakeBtn.addEventListener("click", () => {
      navigateTo(`/quiz-play/${this.UID}`);
    });
    quizFooter.append(retakeBtn);
  }

  updateBadge(status) {
    // Find the badge element
    const badge = document.querySelector(QUIZSELECTORS.badge);
    if (!badge) return;

    // Determine badge class and icon based on status
    let badgeClass = "gray-badge";
    let iconClass = "bi-hourglass";
    let text = "Pending";

    if (status === "active") {
      badgeClass = "orange-badge";
      iconClass = "bi-clock-history";
      text = "In Progress";
    } else if (status === "completed") {
      badgeClass = "green-badge";
      iconClass = "bi-check-circle";
      text = "Completed";
    }

    badge.classList.remove("gray-badge", "orange-badge", "green-badge");
    badge.classList.add(badgeClass);

    // Set icon and text using innerHTML
    badge.innerHTML = `<i class="bi ${iconClass}"></i> ${text}`;
  }
}

export const addQuizEventListnersBns = (quizId) => {
  if (viewResultBtn)
    viewResultBtn.addEventListener("click", () => {
      openQuizResultOverlay({
        quizId: quizId,
        groupId: Session.groupId,
      });
    });

  if (viewResultsBtn)
    viewResultsBtn.addEventListener("click", () =>
      openQuizResultsOverlay(quizId, Session.groupId)
    );

  if (retakeBtn)
    retakeBtn.addEventListener("click", () => {
      navigateTo(`/quiz-play/${quizId}`);
    });
};

export const startSession = async () => {
  try {
    const sessionData = await fetchData("/active-session");

    const session = new Session(sessionData);
    addQuizEventListnersBns(session.quiz?.UID);
    session.startSession();
  } catch (error) {
    console.error("Error starting session:", error);
    showMessageBlock(
      "Error starting session. Please try again later.",
      "error"
    );
  }
};

const getBadgesContainer = (nextTask) => `
          <div class="active-task-container">
            <span class="task-label active-task-label">Active Task</span>
            <span class="active-task-title task-title"></span>
          </div>
          ${
            nextTask
              ? `
          <div class="next-task-container">
            <span class="task-label next-task-label">Next Task</span>
            <span class="next-task-title task-title"></span>
          </div>
          `
              : ""
          }
`;

export class Session {
  static id = null;
  static groupId = null;
  constructor({
    tasks,
    startDate,
    durationInMins, // in minutes
    id,
    groupId,
    quiz,
    isAdmin,
  }) {
    console.log("Initializing session with data:");
    Session.id = id; // Set the static id property
    Session.groupId = groupId;
    this.startDate = startDate;
    this.durationInMins = durationInMins;
    this.tasks = tasks;
    this.quiz = quiz
      ? new Quiz({
          title: quiz.title,
          UID: quiz.UID,
          questionsCount: quiz.questionsCount,
          status: quiz.status,
          passed: quiz.passed,
          isAdmin,
          groupId,
        })
      : null;
    this.initTime();
    this.initVariables();
  }

  initVariables() {
    this.timeLeftElement = document.querySelector(SESSIONSSELECTORS.timeLeft);
    this.elapsedTimeElement = document.querySelector(
      SESSIONSSELECTORS.elapsedTime
    );
    this.ongoingTasksContainer = document.querySelector(
      TASKSSELECTORS.ongoingTasksList
    );
    this.completedTasksContainer = document.querySelector(
      TASKSSELECTORS.completedTasksList
    );
    this.completedTasks = [];
    this.ongoingTasks = [];
  }

  async tick() {
    const now = Date.now();
    const remainingTime = this.endTime - now;

    const delay = remainingTime % (60 * 1000) || 1000 * 60;

    if (remainingTime > 0) {
      const elapsedTime = remainingTime;
      this.timeLeft = this.durationInMins * 60 * 1000 - remainingTime;
      this.displayDurations({
        elapsedTime: elapsedTime,
        timeLeft: this.timeLeft,
      });

      if (this.isFirstTaskComplete()) this.addToCompletedTasks();

      if (this.quiz && this.quiz.status !== "completed") {
        this.quiz.updateElapsedTime({
          status: this.quiz.status,
        });
        if (this.quiz.status == "active" && !this.quiz.passed && !this.quiz.isAdmin)
          return;
      }

      this._timer = setTimeout(async () => {
        await this.tick();
      }, delay);
      timers.tasks = this._timer;
    } else {
      if (this.ongoingTasks.length) {
        await this.addToCompletedTasks();
      }
      this.onComplete();
    }
  }

  isFirstTaskComplete() {
    return (
      this.ongoingTasks.length > 0 &&
      this.ongoingTasks[0].durationInMins <=
        Math.floor(this.timeLeft / 1000 / 60) -
          this.completedTasks.reduce((acc, task) => {
            return (acc += task.durationInMins);
          }, 0)
    );
  }

  initTime() {
    this.endTime =
      new Date(this.startDate).getTime() + this.durationInMins * 60 * 1000;
    const remainingTime = this.endTime - Date.now();
    this.timeLeft =
      remainingTime > 0
        ? this.durationInMins * 60 * 1000 - remainingTime
        : -(remainingTime - this.durationInMins * 60 * 1000);
    this.elapsedTime =
      this.durationInMins * 60 * 1000 <= this.timeLeft
        ? 0
        : this.durationInMins * 60 * 1000 - this.timeLeft;
  }

  initTimer() {
    const notStartedTasksDuration = this.ongoingTasks.reduce(
      (acc, task, index) => {
        if (index !== 0) return (acc += task.durationInMins * 60 * 1000);
        return acc;
      },
      0
    );
    this.activeTaskRemainingTime = this.elapsedTime - notStartedTasksDuration;
    this.TIMER = new FlipTimer(this.activeTaskRemainingTime);
    this._timer = null;
    this.tick();
  }

  displayDurations({ timeLeft, elapsedTime }) {
    this.timeLeftElement.textContent = millisecondsToHMFormat(timeLeft);
    this.elapsedTimeElement.textContent = millisecondsToHMFormat(elapsedTime);
  }

  async addToCompletedTasks() {
    this.ongoingTasksContainer.firstElementChild.remove();
    const complatedTask = this.ongoingTasks.shift();
    this.completedTasks.push(complatedTask);
    this.displayComplatedTask(complatedTask);
    const nextTask = this.ongoingTasksContainer.firstElementChild;
    const nextTaskObj = this.ongoingTasks[0];
    if (complatedTask.isQuiz) {
      this.quiz.status = "completed";
      this.quiz.updateBadge("completed");
      this.quiz.addQuizBtns();
    }
    this.updateTasksBadges(
      nextTaskObj,
      this.ongoingTasks[1],
      this.ongoingTasks[1] && this.ongoingTasks[2]
    );
    if (nextTask && nextTaskObj) {
      new FlipTimer(nextTaskObj.durationInMins * 60 * 1000);
      nextTask.firstElementChild.setAttribute("data-tooltip", "Active Task");
      nextTask.firstElementChild.classList.add("first", "has-tooltip");
      if (nextTaskObj.isQuiz) {
        this.quiz.status = "active";
        this.quiz.updateBadge("active");
      }
      await this.updateTaskStatus(nextTaskObj.UID, "active");
    }
    await this.updateTaskStatus(complatedTask.UID, "completed");
  }

  updateTasksBadges(activeTask, nextTask, nextTaskIsLast) {
    if (!activeTask) {
      return;
    }
    this.timerEls.activeTaskLabel.textContent =
      "Active " +
      (activeTask.isQuiz ? "Quiz" : activeTask.isBreak ? "Break" : "Task") +
      (nextTask ? "" : " (Last Task)");
    this.timerEls.activeTaskTitle.textContent = activeTask.title;

    if (!nextTask) {
      if (this.timerEls.nextTaskContainer)
        this.timerEls.nextTaskContainer.remove();
      return;
    }

    this.timerEls.nextTaskLabel.textContent =
      "Next " +
      (nextTask.isQuiz ? "Quiz" : nextTask.isBreak ? "Break" : "Task") +
      (nextTaskIsLast ? "" : " (Last Task)");
    this.timerEls.nextTaskTitle.textContent = nextTask.title;
  }

  displayComplatedTask(task) {
    const taskContainer = document.createElement("div");
    taskContainer.className = "completed-task task-wrapper";
    taskContainer.innerHTML = `
        <div class="completed-task-box"> 
          <span class="title"></span>
          <span class="duration">${millisecondsToHMFormat(
            task.durationInMins * 60 * 1000
          )}</span>
           ${
             task.isBreak
               ? ""
               : `
            <button type="button" data-tooltip="Show Details" class="task-down-icon exclude-btn should-fill has-tooltip">
              <i class="bi bi-caret-down"></i>
            </button>
           `
           }
        </div>
        ${
          task.isBreak
            ? ""
            : `
        <div class="task-details">
          <h5>Title: </h5>
          <p class="task-title"></p>
          <h5>Details: </h5>
          <p class="task-desc"></p>
        </div>`
        }
      `;
    taskContainer.querySelector(".title").textContent = task.title;
    if (!task.isBreak) {
      taskContainer.querySelector(".task-title").textContent = task.title;
      taskContainer.querySelector(".task-desc").textContent = task.description;
    }
    this.completedTasksContainer.append(taskContainer);
  }

  displayComplatedTasks() {
    this.completedTasksContainer.innerHTML = "";
    this.completedTasks.forEach((task) => this.displayComplatedTask(task));
  }

  async initTasks() {
    let timeLeft = Math.floor(this.timeLeft / 1000 / 60);
    this.completedTasks = [];
    for (const task of this.tasks) {
      if (task.durationInMins <= timeLeft) {
        timeLeft -= task.durationInMins;
        this.completedTasks.push(task);
      } else {
        break;
      }
    }

    this.ongoingTasks = this.tasks.filter(
      (task) => !this.completedTasks.find((t) => t === task)
    );

    this.completedTasks.forEach(async (task) => {
      if (task.status !== "completed") {
        await this.updateTaskStatus(task.UID, "completed");
        task.status = "completed";
        if (task.isQuiz) {
          this.quiz.status = "completed";
          this.quiz.updateBadge("completed");
        }
      }
    });

    const firstOngoingTask = this.ongoingTasks[0];
    if (firstOngoingTask) {
      tasksBadgesContainer.innerHTML = getBadgesContainer(this.ongoingTasks[1]);
      this.timerEls = {
        nextTaskLabel: document.querySelector(".next-task-label"),
        nextTaskTitle: document.querySelector(".next-task-title"),
        activeTaskLabel: document.querySelector(".active-task-label"),
        activeTaskTitle: document.querySelector(".active-task-title"),
        nextTaskContainer: document.querySelector(".next-task-container"),
      };
      this.updateTasksBadges(
        firstOngoingTask,
        this.ongoingTasks[1],
        this.ongoingTasks[1] && this.ongoingTasks[2]
      );
    }
    if (this.ongoingTasks[0] && firstOngoingTask.status !== "active") {
      await this.updateTaskStatus(firstOngoingTask.UID, "active");
      firstOngoingTask.status = "active";
      if (firstOngoingTask.isQuiz) {
        this.quiz.status = "active";
        this.quiz.updateBadge("active");
      }
    }

    return this;
  }

  async updateTaskStatus(taskId, status) {
    try {
      await sendData("/api/update-task-status", {
        taskId,
        status,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      showMessageBlock(
        "Error updating task status. Please try again later.",
        "error"
      );
    }
  }

  calculateQuizElapsedTime() {
    let quizPassed = false;
    let quizElapsedTime = 0;
    if (this.ongoingTasks.find((task) => task.isQuiz))
      quizElapsedTime = this.ongoingTasks.reduce((acc, task, index) => {
        if (task.isQuiz) {
          quizPassed = true;
        }
        if (!quizPassed) {
          if (index === 0)
            return (acc += this.activeTaskRemainingTime / 1000 / 60);
          return (acc += task.durationInMins);
        }
        return acc;
      }, 0);
    else return 0;

    return millisecondsToHMFormat(quizElapsedTime * 60 * 1000);
  }

  displayOngoingTasks() {
    this.ongoingTasksContainer.innerHTML = "";
    this.ongoingTasks.forEach((task, index) => {
      const isQuiz = task.isQuiz;
      const isBreak = task.isBreak;
      const isFirst = index === 0;

      // Build HTML string with XSS prevention for user content
      const html = `
          <div
            ${
              isFirst
                ? 'data-tooltip="Active Task"'
                : isQuiz
                ? 'data-tooltip="Quiz"'
                : isBreak
                ? 'data-tooltip="Break"'
                : ""
            }
            class="task-box${
              isQuiz ? " quiz-task-box" : isBreak ? " break-box" : ""
            }${isFirst ? " first" : ""}${
        isFirst || isQuiz || isBreak ? " has-tooltip" : ""
      }"
          >
            <div class="counter">
              <span>${(index + 1)
                .toString()
                .padStart(this.tasks.length.toString().length, "0")}</span>
            </div>
            <span class="title"></span>
            <span class="duration" data-duration-in-mins="${
              task.durationInMins
            }">${millisecondsToHMFormat(task.durationInMins * 60 * 1000)}</span>
            ${
              !isBreak
                ? `<button type="button" data-tooltip="Show Details" class="task-down-icon exclude-btn should-fill has-tooltip">
                    <i class="bi bi-caret-down"></i>
                  </button>`
                : ""
            }
          </div>
          ${
            !isBreak
              ? `<div class="task-details">
                  <h5>Title:</h5>
                  <p class="task-title"></p>
                  <h5>Details:</h5>
                  <p class="task-desc"></p>
                </div>`
              : ""
          }
      `;

      // Create container and set HTML
      const wrapper = document.createElement("div");
      wrapper.className = "task-wrapper";
      wrapper.innerHTML = html;

      // Set textContent for user data to prevent XSS
      wrapper.querySelector(".title").textContent = task.title;
      if (!isBreak) {
        wrapper.querySelector(".task-title").textContent = task.title;
        wrapper.querySelector(".task-desc").textContent = task.description;
      }

      // Append to container
      this.ongoingTasksContainer.appendChild(wrapper);
    });
  }

  // !! implement this method
  sendMessage({ message, file }) {}
  // !! implement this
  async onComplete() {
    try {
      await sendData("/api/end-session", { sessionId: Session.id });
      navigateTo("/home");
      showMessageBlock("Session finished", "info");
    } catch (error) {
      console.error("Error ending session:", error);
      showMessageBlock(
        "Error ending session. Please try again later.",
        "error"
      );
    }
  }

  async startSession() {
    await this.initTasks();
    this.initTimer();

    if (this.quiz) {
      this.quiz.updateElapsedTime({
        quizElapsedTime: this.calculateQuizElapsedTime(),
        status: this.quiz.status,
      });
    }

    this.displayComplatedTasks();
    this.displayOngoingTasks();
    this.initSessionStream();
    return this;
  }

  initSessionStream() {
    const sessionId = Session.id;
    if (!sessionId) return;
    if (this.sessionStream) {
      this.sessionStream.close();
    }
    this.sessionStream = new EventSource(`/api/stream-single-session?sessionId=${sessionId}`);
    this.sessionStream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.joinedCount !== undefined) {
          const joinedEl = document.querySelector(SESSIONSSELECTORS.joinedCount);
          if (joinedEl) {
            joinedEl.textContent = data.joinedCount;
          }
        }
        if (data.removed || data.status === "ended" || data.status === "cancelled") {
          this.sessionStream.close();
          navigateTo("/home");
        }
      } catch (e) {
        console.error("Error parsing session stream:", e);
      }
    };
    this.sessionStream.onerror = (e) => {
      console.warn("Session stream error:", e);
    };
  }

  addQuizBtns() {
    if (this.quiz) {
      this.quiz.addQuizBtns();
    }
  }
}
