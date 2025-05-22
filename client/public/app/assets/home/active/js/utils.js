import {
  QUIZSELECTORS,
  SESSIONSSELECTORS,
  TASKSSELECTORS,
} from './dom-variables.js';

export const expandAndShrinkDescription = (e) => {
  const btn = e.currentTarget;

  if (btn.classList.toggle('expanded')) {
    btn.parentElement.nextElementSibling.style.webkitLineClamp = 'unset';
  } else {
    setTimeout(() => {
      btn.parentElement.nextElementSibling.style.webkitLineClamp = '3';
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
        .padStart(2, '0');
      const minutes = (Math.floor(remainingTime / 1000 / 60) % 60)
        .toString()
        .padStart(2, '0');
      const hours = Math.floor(remainingTime / 1000 / 60 / 60)
        .toString()
        .padStart(2, '0');

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
    this.handleUnitChange('hours', hours);
    this.handleUnitChange('minutes', minutes);
    this.handleUnitChange('seconds', seconds);

    // store for next time
    this.prev = { hours, minutes, seconds };
  }

  handleUnitChange(unit, newDigits) {
    const oldDigits = this.prev[unit];
    const sides = ['left', 'right'];

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
    this.prev = { hours: '00', minutes: '00', seconds: '00' };
    this.tick();
  }

  initDigits() {
    this.digits = {
      hours: { left: null, right: null },
      minutes: { left: null, right: null },
      seconds: { left: null, right: null },
    };
    ['hours', 'minutes', 'seconds'].forEach((unit) => {
      ['left', 'right'].forEach((side) => {
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
    document.addEventListener('animationend', this.eventListner);
  }

  // event listner
  eventListner(e) {
    const flipContainer = e.target;
    if (flipContainer.matches('.flip-top-container')) {
      const bottomSpan = flipContainer
        .closest('.flip-digit')
        .querySelector('.flip-face-bottom span');
      const topFrontFontText = flipContainer
        .closest('.flip-digit')
        .querySelector('.flip-face-top-front-front span');
      const number = bottomSpan.dataset.nextDigit;
      bottomSpan.textContent = number;
      topFrontFontText.textContent = number;
      flipContainer.classList.remove('flip');
    }
  }

  flip(number, unit, side) {
    this.digits[unit][side].topFrontBackText.textContent = number;
    this.digits[unit][side].topBackText.textContent = number;
    this.digits[unit][side].topContainer.classList.add('flip');
    this.digits[unit][side].bottomSpan.dataset.nextDigit = number;
  }

  onComplete() {
    removeEventListener('animationend', this.eventListner);
  }
}

export class Task {
  constructor({ title, description, durationInMins }) {
    this.title = title;
    this.description = description;
    this.durationInMins = durationInMins;
  }
}

export class Quiz extends Task {
  constructor({ UID, title, description, durationInMins, questionsCount }) {
    super({ title, description, durationInMins });
    this.questionsCount = questionsCount;
    this.UID = UID;
    this.elapsedTime = document.querySelector(QUIZSELECTORS.startTime);
    this.submittedQuestionsCount = document.querySelector(
      QUIZSELECTORS.submittedCount
    );
    this.score = document.querySelector(QUIZSELECTORS.score);
  }
  updateElapsedTime(quizElapsedTime) {
    this.elapsedTime.textContent = quizElapsedTime;
  }

  calculateScore(submittedQuestionsCount) {
    return `${
      (submittedQuestionsCount / this.questionsCount).toFixed(0) * 100
    }%`;
  }

  setQuizResult(submittedQuestionsCount) {
    this.score.textContent = this.calculateScore(submittedQuestionsCount);
    this.submittedQuestionsCount.textContent = `${submittedQuestionsCount} of ${this.questionsCount} Quetions`;
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<i class="bi bi-question-circle"></i>
    <span>View Details</span>`;
    document.querySelector(QUIZSELECTORS.quizFooter).append(button);
  }
}

export class Session {
  constructor() {
    this.startDate = document.querySelector(
      SESSIONSSELECTORS.startDate
    ).dataset.startDate;
    // !? you can change htis method with queryselecctor for the durationInMins element
    this.durationInMins = document.querySelector(
      SESSIONSSELECTORS.durationInMins
    ).dataset.durationInMins;
    this.initVariables();
    this.initTime();
    this.timerDuration =
      this.durationInMins * 60 * 1000 <= this.timeLeft
        ? 0
        : this.durationInMins * 60 * 1000 - this.timeLeft;
    this.initTasks();
    this.initQuiz();
  }

  initVariables() {
    this.timeLeftElement = document.querySelector(SESSIONSSELECTORS.timeLeft);
    this.elapsedTimeElement = document.querySelector(
      SESSIONSSELECTORS.elapsedTime
    );
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

      const firstTaskIsComplete =
        this.ongoingTasks.length > 0 &&
        this.ongoingTasks[0].durationInMins <=
          Math.floor(this.timeLeft / 1000 / 60) -
            this.completedTasks.reduce((acc, task) => {
              return (acc += task.durationInMins);
            }, 0);

      if (firstTaskIsComplete) {
        this.addToCompletedTasks();
        if (this.quiz)
          this.quiz.updateElapsedTime(this.calculateQuizElapsedTime());
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
  }
  initTimer() {
    this.TIMER = new FlipTimer(this.timerDuration);
    this._timer = null;
    this.tick();
  }

  millisecondsToHMFormat(time) {
    const hours = Math.floor(time / (1000 * 60 * 60))
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60))
      .toString()
      .padStart(2, '0');

    return hours === '00' ? `${minutes}m` : `${hours}h ${minutes}m`;
  }

  displayDurations({ timeLeft, elapsedTime }) {
    this.timeLeftElement.textContent = this.millisecondsToHMFormat(timeLeft);
    this.elapsedTimeElement.textContent =
      this.millisecondsToHMFormat(elapsedTime);
  }

  addToCompletedTasks() {
    this.ongoingTasksContainer.firstElementChild.remove();
    const nextTask = this.ongoingTasksContainer.firstElementChild;
    if (nextTask) {
      nextTask.firstElementChild.setAttribute('data-tooltip', 'Active Task');
      nextTask.firstElementChild.classList.add('first', 'has-tooltip');
    }

    const complatedTask = this.ongoingTasks.shift();
    this.completedTasks.push(complatedTask);
    this.displayComplatedTask(complatedTask);
  }
  displayComplatedTask(task) {
    const taskContainer = document.createElement('div');
    taskContainer.className = 'completed-task';
    taskContainer.innerHTML = `
        <div class="completed-task-box"> 
          <span class="title">${task.title}</span>
          <span class="duration">${this.millisecondsToHMFormat(
            task.durationInMins * 60 * 1000
          )}</span>
            <button type="button" data-tooltip="Show Details" class="task-down-icon exclude-btn should-fill has-tooltip">
              <i class="bi bi-caret-down"></i>
            </button>
        </div>
        <div class="task-details">
          <h5>Title: </h5>
          <p>${task.title}</p>
          <h5>Details: </h5>
          ${task.description}
        </div>
      `;
    this.completedTasksContainer.append(taskContainer);
  }

  displayComplatedTasks() {
    this.completedTasks.forEach((task) => this.displayComplatedTask(task));
    for (let index = 0; index < this.completedTasks.length; index++) {
      this.ongoingTasksContainer.firstElementChild.remove();
    }
  }
  initTasks() {
    this.ongoingTasksContainer = document.querySelector(
      TASKSSELECTORS.ongoingTasksList
    );
    this.completedTasksContainer = document.querySelector(
      TASKSSELECTORS.completedTasksList
    );
    const tasksElements =
      this.ongoingTasksContainer.querySelectorAll('.ongoing-task');
    const tasks = Array.from(tasksElements).map((task) => {
      return task.firstElementChild.className.includes('quiz-task-box')
        ? new Quiz({
            title: task.querySelector(TASKSSELECTORS.taskTitle).textContent,
            description: task.querySelector(TASKSSELECTORS.taskDetails)
              .textContent,
            durationInMins: parseInt(
              task.querySelector(TASKSSELECTORS.taskDuration).dataset
                .durationInMins
            ),
            questionsCount: parseInt(
              document.querySelector(QUIZSELECTORS.questions).textContent
            ),
            UID: document.querySelector(QUIZSELECTORS.quizTitle).dataset
              .quizUid,
          })
        : new Task({
            title: task.querySelector(TASKSSELECTORS.taskTitle).textContent,
            description: task.querySelector(TASKSSELECTORS.taskDetails)
              .textContent,
            durationInMins: parseInt(
              task.querySelector(TASKSSELECTORS.taskDuration).dataset
                .durationInMins
            ),
          });
    });
    // !!! add the empty ui
    this.completedTasksContainer.innerHTML = '';
    let timeLeft = Math.floor(this.timeLeft / 1000 / 60);
    this.completedTasks = [];
    for (const task of tasks) {
      if (task.durationInMins <= timeLeft) {
        timeLeft - task.durationInMins;
        this.completedTasks.push(task);
      } else {
        break;
      }
    }
    this.ongoingTasks = tasks.filter(
      (task) => !this.completedTasks.find((t) => t === task)
    );
    return this;
  }

  initQuiz() {
    this.quiz = this.ongoingTasks.find((task) => task instanceof Quiz) || null;
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

    return this.millisecondsToHMFormat(quizElapsedTime * 60 * 1000);
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
    this.initTimer();
    return this;
  }

  setQuizResult(submittedCount) {
    if (this.quiz) {
      this.quiz.setQuizResult(submittedCount);
    }
  }
}
