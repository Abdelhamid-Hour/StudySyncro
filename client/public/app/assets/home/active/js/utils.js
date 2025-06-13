import {
  fetchData,
  sendData,
  showMessageBlock,
} from "../../../../../main_assets/js/utils.js";
import {
  millisecondsToHMFormat,
  navigateTo,
} from "../../../global/js/utils.js";
import { Task } from "../../../shared/tasks/js/utils.js";
import {
  QUIZSELECTORS,
  SESSIONSSELECTORS,
  TASKSSELECTORS,
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
  constructor({ UID, title, description, durationInMins, questionsCount }) {
    super({ UID, title, description, durationInMins });
    this.questionsCount = questionsCount;
    this.elapsedTime = document.querySelector(QUIZSELECTORS.startTime);
    this.score = document.querySelector(QUIZSELECTORS.score);
  }
  updateElapsedTime(quizElapsedTime) {
    if (quizElapsedTime) {
      this.elapsedTime.textContent = quizElapsedTime;
    } else {
      const current = this.elapsedTime.textContent;
      if (current !== "00m") {
        let minutes = parseInt(current, 10) - 1;
        this.elapsedTime.textContent =
          minutes.toString().padStart(2, "0") + "m";
      }
    }

    if (this.elapsedTime.textContent === quizElapsedTime) {
      navigateTo(`/quiz-play/${this.UID}`);
    }
  }

  calculateScore(submittedQuestionsCount) {
    return `${
      (submittedQuestionsCount / this.questionsCount).toFixed(0) * 100
    }%`;
  }

  setQuizResult(submittedQuestionsCount) {
    this.score.textContent = this.calculateScore(submittedQuestionsCount);
    this.submittedQuestionsCount.textContent = `${submittedQuestionsCount} of ${this.questionsCount} Quetions`;
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<i class="bi bi-question-circle"></i>
    <span>View Details</span>`;
    document.querySelector(QUIZSELECTORS.quizFooter).append(button);
  }
}

export const startSession = async () => {
  try {
    const sessionData = await fetchData("/active-session");
    debugger
    const session = new Session(sessionData);
    session.startSession();
  } catch (error) {
    console.error("Error starting session:", error);
    showMessageBlock(
      "Error starting session. Please try again later.",
      "error"
    );
  }
};

export class Session {
  constructor({
    tasks,
    startDate,
    durationInMins, // in minutes
    id,
    groupId,
    quiz,
  }) {
    this.id = id;
    this.groupId = groupId;
    this.startDate = startDate;
    this.durationInMins = durationInMins;
    this.tasks = tasks;
    this.quiz = quiz
      ? new Quiz({
          title: quiz.title,
          UID: quiz.UID,
          questionsCount: quiz.questionsCount,
        })
      : null;
    this.initTime();
    this.initVariables();
    this.initTasks();
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
  // !! 'No Quiz Added To The Session';
  tick() {
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
      if (this.quiz) this.quiz.updateElapsedTime();

      const firstTaskIsComplete =
        this.ongoingTasks.length > 0 &&
        this.ongoingTasks[0].durationInMins <=
          Math.floor(this.timeLeft / 1000 / 60) -
            this.completedTasks.reduce((acc, task) => {
              return (acc += task.durationInMins);
            }, 0);

      if (firstTaskIsComplete) {
        this.addToCompletedTasks();
      }

      this._timer = setTimeout(() => this.tick(), delay);
    } else {
      if (this.ongoingTasks.length) {
        this.addToCompletedTasks();
      }
      this.onComplete();
    }
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
    const activeTaskRemainingTime = this.elapsedTime - notStartedTasksDuration;
    this.TIMER = new FlipTimer(activeTaskRemainingTime);
    this._timer = null;
    this.tick();
  }

  displayDurations({ timeLeft, elapsedTime }) {
    this.timeLeftElement.textContent = millisecondsToHMFormat(timeLeft);
    this.elapsedTimeElement.textContent = millisecondsToHMFormat(elapsedTime);
  }

  addToCompletedTasks() {
    this.ongoingTasksContainer.firstElementChild.remove();
    const complatedTask = this.ongoingTasks.shift();
    this.completedTasks.push(complatedTask);
    const nextTask = this.ongoingTasksContainer.firstElementChild;
    if (nextTask && this.ongoingTasks[0]) {
      new FlipTimer(this.ongoingTasks[0].durationInMins * 60 * 1000);
      nextTask.firstElementChild.setAttribute("data-tooltip", "Active Task");
      nextTask.firstElementChild.classList.add("first", "has-tooltip");
      this.displayComplatedTask(this.ongoingTasks[0].UID, "active");
    }
    this.updateTaskStatus(complatedTask.UID, "completed");
    this.displayComplatedTask(complatedTask);
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
          <p class="task-title">${task.title}</p>
          <h5>Details: </h5>
          <p class="task-desc">${task.description}</p>
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
        timeLeft - task.durationInMins;
        this.completedTasks.push(task);
      } else {
        break;
      }
    }

    this.ongoingTasks = this.tasks.filter(
      (task) => !this.completedTasks.find((t) => t === task)
    );

    this.completedTasks.forEach(async (task) => {
      if (task.status !== "completed")
        await this.updateTaskStatus(task.UID, "completed");
    });

    if (this.ongoingTasks[0] && this.ongoingTasks[0].status !== "active")
      await this.updateTaskStatus(this.ongoingTasks[0].UID, "active");

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
    const quizElapsedTime = this.ongoingTasks.reduce((acc, task) => {
      if (task === this.quiz) {
        quizPassed = true;
      }
      if (!quizPassed) {
        return (acc += task.durationInMins);
      }
      return acc;
    }, 0);

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
  onComplete() {}

  startSession() {
    if (this.quiz) {
      this.quiz.updateElapsedTime(this.calculateQuizElapsedTime());
    }
    this.displayComplatedTasks();
    this.displayOngoingTasks();
    this.initTimer();
    return this;
  }

  setQuizResult(submittedCount) {
    if (this.quiz) {
      this.quiz.setQuizResult(submittedCount);
    }
  }
}
