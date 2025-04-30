import {
  expandDescriptionBtn,
  QUIZSELECTORS,
  SESSIONSSELECTORS,
  TASKSSELECTORS,
} from './getNodes.js';

export const handelTaskDetailsBtn = (e) => {
  if (e.target.closest('.task-down-icon')) {
    const task = e.target.closest('[class$="-task"], .show-task-details');

    if (task) {
      task.classList.toggle('show-task-details');
    }
  }
};

export const handelTaskBtns = (className, scroll) => {
  const taskListElement = document.querySelector(`.${className} .tasks-list`);
  if (scroll) {
    return taskListElement.scroll(0, 0);
  }
  for (const element of taskListElement.children) {
    element.classList.remove('show-task-details');
  }
};

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
  constructor(minutes) {
    this.initTimer(minutes);
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

  initTimer(minutes) {
    this.initDigits();
    this.endTime = Date.now() + minutes * 60 * 1000;
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
  constructor({ title, description, duration }) {
    this.title = title;
    this.description = description;
    this.duration = duration;
  }
}

export class Quiz extends Task {
  constructor({ title, description, duration, questionsCount }) {
    super({ title, description, duration });
    this.questionsCount = questionsCount;
    this.elapsedTime = document.querySelector(QUIZSELECTORS.startTime);
    this.submittedQuestionsCount = document.querySelector(
      QUIZSELECTORS.submittedCount
    );
    this.score = document.querySelector(QUIZSELECTORS.score);
  }

  displayQuizInfo(quizElapsedTime) {
    const quizTitle = document.querySelector(QUIZSELECTORS.quizTitle);
    const questionsCount = document.querySelector(QUIZSELECTORS.questions);

    quizTitle.textContent = this.title;
    questionsCount.textContent = `${this.questionsCount} Questions`;
    this.elapsedTime.textContent = quizElapsedTime;
    this.submittedQuestionsCount.textContent = `0 of ${this.questionsCount} Quetions`;
    this.score.textContent = '____';
  }

  updateElapsedTime(quizElapsedTime) {
    this.elapsedTime.textContent = quizElapsedTime;
  }

  calculateScore(submittedQuestionsCount) {
    return `${
      (submittedQuestionsCount / this.questionsCount).toFixed(0) * 100
    }%`;
  }

  setQuizResult({ submittedQuestionsCount }) {
    this.score.textContent = this.calculateScore(submittedQuestionsCount);
    this.submittedQuestionsCount.textContent = `${submittedQuestionsCount} of ${this.questionsCount} Quetions`;
  }
}

export class Session {
  constructor({ name, groupName, startDate, description, isAdmin = false }) {
    this.name = name;
    this.groupName = groupName;
    this.startDate = startDate;
    this.description = description;
    this.isAdmin = isAdmin;
  }

  displaySessionInfo() {
    const sessionName = document.querySelector(SESSIONSSELECTORS.name);
    const groupName = document.querySelector(SESSIONSSELECTORS.groupName);
    const quizTitle = document.querySelector(SESSIONSSELECTORS.quizTitle);
    const startTime = document.querySelector(SESSIONSSELECTORS.startTime);
    const endTime = document.querySelector(SESSIONSSELECTORS.endTime);
    const description = document.querySelector(SESSIONSSELECTORS.description);
    const duration = document.querySelector(SESSIONSSELECTORS.duration);
    const roleBadge = document.querySelector(SESSIONSSELECTORS.badges.role);
    const quizBadge = document.querySelector(SESSIONSSELECTORS.badges.quiz);

    sessionName.textContent = this.name;
    groupName.textContent = this.groupName;
    quizTitle.textContent = this.quiz
      ? `${this.quiz.title}`
      : 'No Quiz Added To The Session';
    startTime.textContent = this.formatHoursMinutes(this.startDate);
    description.textContent = this.description;
    duration.textContent = this.duration + 'm';
    endTime.textContent = this.formatHoursMinutes(this.endTime);
    if (this.quiz) {
      quizBadge.textContent = 'Quiz';
      quizBadge.parentElement.className = 'badge quiz-badge';
    }
    if (this.isAdmin) {
      roleBadge.textContent = 'Host';
      roleBadge.previousElementSibling.className = 'bi bi-person-fill-gear';
      roleBadge.parentElement.className = 'badge host-badge';
    }
  }

  formatHoursMinutes(TimeOrDate) {
    const date = new Date(TimeOrDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours} : ${minutes}`;
  }

  tick() {
    const now = Date.now();
    const remainingTime = this.endTime - now;
    const delay = remainingTime % (60 * 1000) || 1000 * 60;

    if (remainingTime > 0) {
      const elapsedTime = remainingTime;
      const timeLeft = this.duration * 60 * 1000 - remainingTime;
      this.displayDurations({
        elapsedTime: elapsedTime,
        timeLeft: timeLeft,
      });

      const firstTaskIsComplete =
        this.tasks.length > 0 &&
        this.tasks[0].duration ===
          Math.floor(timeLeft / 1000 / 60) -
            Array.from(
              this.completedTasksContainer.querySelectorAll('span.duration')
            ).reduce((acc, span) => {
              return (acc += parseInt(span.textContent));
            }, 0);

      if (firstTaskIsComplete) {
        this.addToCompletedTasks();
        if (this.quiz)
          this.quiz.updateElapsedTime(this.calculateQuizElapsedTime());
      }

      this._timer = setTimeout(() => this.tick(), delay);
    } else {
      this.addToCompletedTasks();
    }
  }

  initTimer() {
    this.duration = this.tasks.reduce((acc, task) => (acc += task.duration), 0);
    this.endTime = Date.now() + this.duration * 60 * 1000;
    console.log(
      this.tasks.reduce((acc, task) => {
        return (acc += task.duration);
      }, 0)
    );

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
    const timeLeftElement = document.querySelector(SESSIONSSELECTORS.timeLeft);
    const elapsedTimeElement = document.querySelector(
      SESSIONSSELECTORS.elapsedTime
    );

    timeLeftElement.textContent = this.millisecondsToHMFormat(timeLeft);
    elapsedTimeElement.textContent = this.millisecondsToHMFormat(elapsedTime);
  }

  displayOngoingTasks() {
    this.tasks.forEach((task, index) => {
      const taskContainer = document.createElement('div');
      taskContainer.className = 'ongoing-task';
      taskContainer.innerHTML = `
        <div ${
          index === 0
            ? 'data-tooltip="Active Task"'
            : task.quiz
            ? 'data-tooltip="Quiz"'
            : ''
        } class="ongoing-task-box ${task.quiz ? 'quiz-task-box' : ''} ${
        index === 0 ? 'first has-tooltip' : task.quiz ? 'has-tooltip' : ''
      }">
          <div class="counter">
            <span>${(index + 1)
              .toString()
              .padStart(this.tasks.length.toString().length, '0')}</span>
          </div>
          <span class="title">${task.title}</span>
          <span class="duration">${this.millisecondsToHMFormat(
            task.duration * 60 * 1000
          )}</span>
          <div class="icons">
            <button type="button" class="menu exclude-btn">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <button type="button" data-tooltip="Show Details" class="task-down-icon exclude-btn should-fill has-tooltip">
              <i class="bi bi-caret-down"></i>
            </button>
          </div>
        </div>
        <div class="task-details">
          ${task.description}
        </div>
      `;
      this.ongoingTasksContainer.append(taskContainer);
    });
  }

  addToCompletedTasks() {
    this.ongoingTasksContainer.firstElementChild.remove();
    const nextTask = this.ongoingTasksContainer.firstElementChild;
    if (nextTask) {
      nextTask.firstElementChild.setAttribute('data-tooltip', 'Active Task');
      nextTask.firstElementChild.classList.add('first', 'has-tooltip');
    }

    const task = this.tasks.shift();

    const taskContainer = document.createElement('div');
    taskContainer.className = 'completed-task';
    taskContainer.innerHTML = `
        <div class="completed-task-box"> 
          <span class="title">${task.title}</span>
          <span class="duration">${this.millisecondsToHMFormat(
            task.duration * 60 * 1000
          )}</span>
            <button type="button" data-tooltip="Show Details" class="task-down-icon exclude-btn should-fill has-tooltip">
              <i class="bi bi-caret-down"></i>
            </button>
        </div>
        <div class="task-details">
          ${task.description}
        </div>
      `;
    this.completedTasksContainer.append(taskContainer);
  }

  setTasks(
    tasks = [
      new Task({ title: '', description: '', duration: 0, completed: false }),
    ]
  ) {
    this.ongoingTasksContainer = document.querySelector(
      TASKSSELECTORS.ongoingTasksList
    );
    this.completedTasksContainer = document.querySelector(
      TASKSSELECTORS.completedTasksList
    );
    this.ongoingTasksContainer.innerHTML = '';
    this.completedTasksContainer.innerHTML = '';
    this.tasks = tasks;
    return this;
  }

  initQuiz() {
    this.quiz = this.tasks.find((task) => task instanceof Quiz) || null;
  }

  calculateQuizElapsedTime() {
    let quizPassed = false;
    const quizElapsedTime = this.tasks.reduce((acc, task) => {
      if (task instanceof Quiz) {
        quizPassed = true;
      }
      if (!quizPassed) {
        return (acc += task.duration);
      }
      return acc;
    }, 0);
    return this.millisecondsToHMFormat(quizElapsedTime * 60 * 1000);
  }

  sendMessage({ message, file }) {
    
  }

  startSession() {
    this.initQuiz();
    this.initTimer();
    this.displaySessionInfo();
    this.displayOngoingTasks();
    if (this.quiz) {
      this.quiz.displayQuizInfo(this.calculateQuizElapsedTime());
    }
    this.TIMER = new FlipTimer(this.duration);
  }
}

new Session({
  name: 'New Session',
  groupName: 'Group Name',
  startDate: new Date().toISOString(),
  description: 'This is a sample session description.',
  isAdmin: true,
})
  .setTasks([
    new Quiz({
      title: 'Make a shawr And Pray',
      description: 'Description for Task 1',
      duration: 0.05,
      questionsCount: 12,
    }),
  ])
  .startSession();
