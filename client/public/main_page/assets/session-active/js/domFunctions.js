import {
  expandDescriptionBtn,
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
  console.log(expandDescriptionBtn);

  const btn = e.currentTarget;
  console.log('cur', btn);

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

export class Session {
  constructor({
    name,
    groupName,
    quizTitle,
    startDate,
    description,
    duration,
  }) {
    this.name = name;
    this.groupName = groupName;
    this.quizTitle = quizTitle;
    this.startDate = startDate;
    this.description = description;
    this.duration = duration;
  }

  displaySessionInfo() {
    const sessionName = document.querySelector(SESSIONSSELECTORS.name);
    const groupName = document.querySelector(SESSIONSSELECTORS.groupName);
    const quizTitle = document.querySelector(SESSIONSSELECTORS.quizTitle);
    const startTime = document.querySelector(SESSIONSSELECTORS.startTime);
    const endTime = document.querySelector(SESSIONSSELECTORS.endTime);
    const description = document.querySelector(SESSIONSSELECTORS.description);
    const duration = document.querySelector(SESSIONSSELECTORS.duration);

    sessionName.textContent = this.name;
    groupName.textContent = this.groupName;
    quizTitle.textContent = this.quizTitle;
    startTime.textContent = this.formatHoursMinutes(this.startDate);
    description.textContent = this.description;
    duration.textContent = this.duration + 'm';
    endTime.textContent = this.formatHoursMinutes(this.endTime);
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
    const delay = remainingTime % (60 * 1000);

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
      }

      this._timer = setTimeout(() => this.tick(), delay);
    }
  }

  initTimer(minutes) {
    this.endTime = Date.now() + minutes * 60 * 1000;
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
          index === 0 ? 'data-tooltip="Active Task"' : ''
        } class="ongoing-task-box ${index === 0 ? 'first has-tooltip' : ''}">
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
    this.ongoingTasksContainer.firstElementChild.firstElementChild.setAttribute(
      'data-tooltip',
      'Active Task'
    );
    this.ongoingTasksContainer.firstElementChild.firstElementChild.classList.add(
      'first',
      'has-tooltip'
    );

    const task = this.tasks.shift();
    task.completed = true;

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

  initTasks(
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

  startSession() {
    this.initTimer(this.duration);
    this.displaySessionInfo();
    this.displayOngoingTasks();
    this.TIMER = new FlipTimer(this.duration);
  }
}

const session = new Session({
  name: 'New Session',
  groupName: 'Group Name',
  quizTitle: 'Quiz Title',
  startDate: new Date().toISOString(),
  description: 'This is a sample session description.',
  duration: 10,
})
  .initTasks([
    new Task({
      title: 'Task 1',
      description: 'Description for Task 1',
      duration: 1,
    }),
    new Task({
      title: 'Task 2',
      description: 'Description for Task 2',
      duration: 1,
    }),
    new Task({
      title: 'Task 3',
      description: 'Description for Task 3',
      duration: 1,
    }),
    new Task({
      title: 'Task 4',
      description: 'Description for Task 4',
      duration: 1,
    }),
    new Task({
      title: 'Task 5',
      description: 'Description for Task 5',
      duration: 1,
    }),
    new Task({
      title: 'Task 6',
      description: 'Description for Task 6',
      duration: 1,
    }),
    new Task({
      title: 'Task 7',
      description: 'Description for Task 7',
      duration: 1,
    }),
    new Task({
      title: 'Task 8',
      description: 'Description for Task 8',
      duration: 1,
    }),
    new Task({
      title: 'Task 9',
      description: 'Description for Task 9',
      duration: 1,
    }),
    new Task({
      title: 'Task 10',
      description: 'Description for Task 10',
      duration: 1,
    }),
  ])
  .startSession();
