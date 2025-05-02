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
export const selectedFiles = new DataTransfer()
export const inputMessage = document.querySelector('.input-message');
export const imageInput = document.getElementById('image-upload');
export const fileInput = document.getElementById('file-upload');
export const sendBtn = document.querySelector('.send-btn');
export const messagesContainer = document.querySelector('.chat-messages');
export const inputChatContainer = document.querySelector('.input-message-container');

export const MAXFILESIZE = 5 * 1024 * 1024; // 5MB
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
  badges: {
    quiz: '.session .badges span:first-child span',
    role: '.session .badges span:last-child span',
  },
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
  quizFooter: '.quiz-footer',
};

export const FileTypes = {
  IMAGE: 'image/jpeg, image/png, image/gif, image/webp',
  DOCUMENT:
    'application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TEXT: 'text/plain',
  ARCHIVE: 'application/zip, application/x-tar, application/x-rar-compressed',
  AUDIO: 'audio/mpeg, audio/wav, audio/ogg',
  VIDEO: 'video/mp4, video/webm, video/x-msvideo',
};
