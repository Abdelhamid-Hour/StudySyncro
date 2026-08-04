export let expandDescriptionBtn,
  SESSIONSSELECTORS,
  TASKSSELECTORS,
  sessionActionButtons,
  tasksBadgesContainer,
  viewResultBtn,
  viewResultsBtn,
  retakeBtn,
  QUIZSELECTORS;

export const initDomVariables = () => {
  expandDescriptionBtn = document.querySelector(".expande-desc-btn");

  sessionActionButtons = document.querySelector(".session-action-btns");

  retakeBtn = document.querySelector(".quiz-footer .retake-btn");

  viewResultBtn = document.querySelector(".quiz-footer .result-btn");

  viewResultsBtn = document.querySelector(".quiz-footer .results-btn");

  tasksBadgesContainer = document.querySelector(".timer .info");

  SESSIONSSELECTORS = {
    name: ".session-name",
    groupName: ".group-name",
    quizTitle: ".session-info .quiz-title",
    timeLeft: ".time-left",
    startDate: ".start-time",
    endDate: ".end-time",
    elapsedTime: ".elapsed-time",
    joinedCount: ".joined-count",
    durationInMins: ".duration",
    description: ".session-description",
    badges: {
      quiz: ".session .badges span:first-child span",
      role: ".session .badges span:last-child span",
    },
  };

  TASKSSELECTORS = {
    completedTasksList: ".completed-tasks-list",
    ongoingTasksList: ".ongoing-tasks-list",
    ongoingTask: ".task-wrapper ",
    taskTitle: ".title",
    taskDuration: ".duration",
    taskDetails: ".task-details",
  };

  QUIZSELECTORS = {
    quizTitle: ".quiz-details .quiz-title",
    questions: ".questions",
    startTime: ".quiz-details .start-time",
    submittedCount: ".submitted-count",
    score: ".score",
    quizFooter: ".quiz-footer",
    badge: ".status-badge",
  };
};
