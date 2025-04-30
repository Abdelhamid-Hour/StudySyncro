export const expandDescriptionBtn = document.querySelector('.expande-desc-btn');
export const tasksContainer = document.querySelector('.tasks-container');
export const scrollToTopOn = document.querySelector(
  '.ongoing-tasks .scroll-to-top'
);
export const collapseAllOn = document.querySelector(
  '.ongoing-tasks .collapse-all'
);
export const scrollToTopCom = document.querySelector(
  '.completed-tasks .scroll-to-top'
);
export const collapseAllCom = document.querySelector(
  '.completed-tasks .collapse-all'
);

export const SESSIONSSELECTORS = {
  name: '.session-name',
  groupName: '.group-name',
  quizTitle: '.session-info .quiz-title',
  timeLeft: '.time-left',
  startTime: '.start-time',
  endTime: '.end-time',
  elapsedTime: '.elapsed-time',
  joinedCount: '.joined-count',
  duration: '.duration',
  description: '.session-description',
  badges: {quiz: '.session .badges span:first-child span', role: '.session .badges span:last-child span'},
};


export const TASKSSELECTORS = {
  completedTasksList: '.completed-tasks-list',
  ongoingTasksList: '.ongoing-tasks-list',
};

export const QUIZSELECTORS = {
  quizTitle: '.quiz-details .quiz-title',
  questions: '.questions',
  startTime: '.quiz-details .start-time',
  submittedCount: '.submitted-count',
  score: '.score',
};

export const CHATSELECTORS = {
  inputMessage: '.input-message',
  imageInput: 'image-upload',
  fileInput: 'file-upload',
};
