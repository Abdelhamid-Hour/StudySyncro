import { expandDescriptionBtn } from "./getNodes.js";

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
  console.log("cur", btn);
  
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
