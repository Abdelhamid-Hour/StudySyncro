import {
  fileInput,
  FileTypes,
  imageInput,
  inputChatContainer,
  inputMessage,
  messagesContainer,
  QUIZSELECTORS,
  selectedFiles,
  SESSIONSSELECTORS,
  TASKSSELECTORS,
} from './getNodes.js';

import { formatHoursMinutes } from '../../global/js/domFunctions.js';
import { showMessageBlock } from '../../../../main_assets/js/domFunctions.js';

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
  constructor(duration) {
    this.initTimer(duration);
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

  initTimer(duration) {
    this.initDigits();
    this.endTime = Date.now() + duration;
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
    startTime.textContent = formatHoursMinutes(this.startDate);
    description.textContent = this.description;
    duration.textContent = this.duration + 'm';
    endTime.textContent = formatHoursMinutes(this.endTime);
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
    this.endTime =
      new Date(this.startDate).getTime() + this.duration * 60 * 1000;
    this.TIMER = new FlipTimer(this.endTime - Date.now());
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

  sendMessage({ message, file }) {}

  startSession() {
    this.initQuiz();
    this.initTimer();
    this.displaySessionInfo();
    this.displayOngoingTasks();
    if (this.quiz) {
      this.quiz.displayQuizInfo(this.calculateQuizElapsedTime());
    }
    this.TIMER = new FlipTimer(this.duration);
    return this;
  }

  setQuizResult(submittedCount) {
    if (this.quiz) {
      this.quiz.setQuizResult(submittedCount);
    }
  }
}

export class ChatMessage {
  constructor(
    text,
    attachments = [],
    isSender,
    avatarSrc,
    senderName,
    timestamp,
    chatContainer
  ) {
    this.text = text;
    this.attachments = attachments;
    this.isSender = isSender;
    this.avatarSrc = avatarSrc;
    this.senderName = senderName;
    this.timestamp = timestamp;
    this.chatContainer = chatContainer;
  }

  renderMessage() {
    if (this.attachments.length > 0) {
      this.renderAttachments();
    }
    if (this.text) {
      this.renderTextMessage();
    }
    this.scrollToBottom();
  }

  scrollToBottom() {
    const scrollHeight = this.chatContainer.scrollHeight;
    this.chatContainer.scrollTo(0, scrollHeight);
  }

  appendToChat(messageBubble) {
    if (this.isFirstMessage()) {
      const messageContainer = this.createMessageContainer(messageBubble);
      this.chatContainer.append(messageContainer);
    } else {
      const messageWrapper = this.createMessageWrapper(messageBubble, false);
      this.chatContainer.lastElementChild
        .querySelector('.messages')
        .append(messageWrapper);
    }
  }

  renderAttachments() {
    const renderers = {
      image: (img) => this.createImageTemplate(img.src, img.name),
      video: (vid) => this.createVideoTemplate(vid.src),
      document: (doc) =>
        this.createFilePreviewTemplate(
          doc.name,
          this.formatFileSize(doc.size),
          'bi bi-file-earmark-text'
        ),
    };
    this.attachments.forEach((attachment) => {
      const kind = FileTypes.IMAGE.includes(attachment.type)
        ? 'image'
        : FileTypes.VIDEO.includes(attachment.type)
        ? 'video'
        : 'document';
      this.appendToChat(renderers[kind](attachment));
    });
  }

  renderTextMessage() {
    const messageBubble = this.createMessageBubble(this.text);
    this.appendToChat(messageBubble);
  }

  formatFileSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    }
    const kb = sizeInBytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
  }

  isFirstMessage() {
    const lastMessage = this.chatContainer.lastElementChild;
    if (!lastMessage) return true;
    const lastUser = lastMessage.querySelector('.username')?.textContent;
    return lastUser ? lastUser !== this.senderName : !this.isSender;
  }

  createFilePreviewTemplate(fileName, fileSize, iconClass) {
    const filePreview = document.createElement('div');
    filePreview.className = 'file-preview';

    const fileThumbnail = document.createElement('div');
    fileThumbnail.className = 'file-thumbnail';
    const icon = document.createElement('i');
    icon.className = iconClass;
    fileThumbnail.appendChild(icon);

    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-details';
    const fileNameSpan = document.createElement('span');
    fileNameSpan.className = 'file-name';
    fileNameSpan.textContent = fileName;
    const fileSizeSpan = document.createElement('span');
    fileSizeSpan.className = 'file-size';
    fileSizeSpan.textContent = fileSize;
    fileDetails.append(fileNameSpan, fileSizeSpan);

    const downloadButton = document.createElement('button');
    downloadButton.type = 'button';
    downloadButton.className = 'download-btn';
    const downloadIcon = document.createElement('i');
    downloadIcon.className = 'bi bi-download';
    downloadButton.appendChild(downloadIcon);

    filePreview.append(fileThumbnail, fileDetails, downloadButton);
    return filePreview;
  }

  createImageTemplate(src, alt) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    return img;
  }

  createVideoTemplate(src) {
    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    return video;
  }

  createMessageBubble(text) {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }

  createMessageWrapper(messageBubble, isFirstMessage) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `${isFirstMessage ? 'first-' : ''}message-${
      this.isSender ? 'sent' : 'received'
    }-text`;

    if (!this.isSender && isFirstMessage) {
      const usernameSpan = document.createElement('span');
      usernameSpan.className = 'username';
      usernameSpan.textContent = this.senderName;
      messageWrapper.appendChild(usernameSpan);
    }

    messageWrapper.appendChild(messageBubble);

    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    dateSpan.textContent = formatHoursMinutes(this.timestamp);
    messageWrapper.appendChild(dateSpan);

    return messageWrapper;
  }

  createMessageContainer(messageBubble) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-${
      this.isSender ? 'sent' : 'received'
    }`;

    if (!this.isSender) {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'avatar';
      if (this.avatarSrc) {
        const avatarImg = document.createElement('img');
        avatarImg.src = this.avatarSrc;
        avatarImg.alt = 'User Avatar';
        avatarDiv.appendChild(avatarImg);
      } else {
        const avatarIcon = document.createElement('i');
        avatarIcon.className = 'bi bi-person-circle';
        avatarDiv.appendChild(avatarIcon);
      }
      messageContainer.appendChild(avatarDiv);
    }

    const messagesDiv = document.createElement('div');
    messagesDiv.className = 'messages';
    messagesDiv.appendChild(this.createMessageWrapper(messageBubble, true));
    messageContainer.appendChild(messagesDiv);

    return messageContainer;
  }
}

export const clearChatInputs = () => {
  inputMessage.value = '';
  fileInput.value = '';
  imageInput.value = '';
  selectedFiles.items.clear()
  const filesView = document.querySelector('.files-view');
  if (filesView) {
    filesView.remove()
  }
};

export const handleFiles = (files) => {
  for (const f of Array.from(files)) {
    if (selectedFiles.items.length >= 5) {
      return showMessageBlock('You can only upload a maximum of 5 files', true);
    }
    const isSupportedType = Object.values(FileTypes).find((types) =>
      types.includes(f.type)
    );
    if (!isSupportedType) {
      showMessageBlock('Invalid file type. Please select other file.', true);
      continue;
    }
    selectedFiles.items.add(f);
    displayFile(f);
  }
};

export const displayFile = async (file) => {
  let filesView = document.querySelector('.files-view');
  if (!filesView) {
    filesView = document.createElement('div');
    filesView.className = 'files-view';
    inputChatContainer.append(filesView);
    filesView.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-file-btn');
      if (e.target.closest('.remove-file-btn')) {
        const targetFileName = btn.previousElementSibling.dataset.fileName;
        const fileIndex = Array.from(selectedFiles.items).findIndex((f) => {
          return f.getAsFile().name === targetFileName;
        });

        selectedFiles.items.remove(fileIndex);
        btn.parentElement.remove();
      }
      if (!selectedFiles.items.length) {
        filesView.remove();
      }
    });
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'exclude-btn remove-file-btn';
  const closIcon = document.createElement('i');
  closIcon.className = 'bi bi-x-circle-fill';
  closeBtn.append(closIcon);

  if (FileTypes.IMAGE.includes(file.type)) {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'img-preview';
    const img = document.createElement('img');
    img.dataset.fileName = file.name;
    const r = new FileReader();
    r.readAsDataURL(file);
    const imgUrl = await new Promise((res, rej) => {
      r.onload = () => {
        return res(r.result);
      };
      r.onerror = () => {
        return rej(r.error);
      };
    });
    img.src = imgUrl;
    img.alt = file.name;
    imgContainer.append(img, closeBtn);
    filesView.append(imgContainer);
  } else {
    const filePreview = document.createElement('div');
    filePreview.className = 'file';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge badge-type';
    typeBadge.textContent = file.name.split('.')[1].toUpperCase();
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    fileName.dataset.fileName = file.name;

    filePreview.append(typeBadge, fileName, closeBtn);
    filesView.append(filePreview);
  }
};

export const handleChatInput = async () => {
  const files = [];

  // Handle image input
  if (selectedFiles.items.length) {
    const filePromises = Array.from(selectedFiles.items).map(async (f) => {
      const file = f.getAsFile();
      if (FileTypes.IMAGE.includes(file.type)) {
        try {
          const reader = new FileReader();
          const imageDataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });

          file.src = imageDataUrl;
        } catch (error) {
          console.error('Error reading image file:', error);
        }
      }
      return file;
    });

    // Wait for all file processing to complete
    const processedFiles = await Promise.all(filePromises);
    files.push(...processedFiles);
  }

  // Check if there is a message or files to send
  const inputValue = inputMessage.value.trim();
  if (inputValue || files.length > 0) {
    new ChatMessage(
      inputValue,
      files,
      true,
      '',
      '',
      new Date(),
      messagesContainer
    ).renderMessage();

    clearChatInputs();
  }
};
