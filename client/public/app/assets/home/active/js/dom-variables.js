export let expandDescriptionBtn,
  SESSIONSSELECTORS,
  TASKSSELECTORS,
  sesssionActionButtons,
  QUIZSELECTORS;

export const initDomVariables = () => {
  expandDescriptionBtn = document.querySelector(".expande-desc-btn");

  sesssionActionButtons = document.querySelector(".session-action-btns");

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
  };
};
