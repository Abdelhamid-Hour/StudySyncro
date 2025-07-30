class Task {
  constructor({
    title,
    description,
    durationInMins,
    isQuiz,
    isBreak,
    status,
    UID,
  }) {
    this.title = title;
    this.status;
    this.durationInMins = durationInMins;
    this.isQuiz = isQuiz || false;
    this.isBreak = isBreak || false;
    this.UID = UID || null; // Unique identifier for the task
    if (!isBreak) this.description = description;
  }
}

class Quiz extends Task {
  constructor({ UID, title, description, durationInMins, questionsCount }) {
    super({ title, description, durationInMins, isQuiz: true });
    this.questionsCount = questionsCount;
    this.UID = UID;
  }
}

const pathNames = {
  home: {
    inactive: '/home/inactive',
    active: '/home/active',
  },
  groups: {
    my: '/groups/my',
    available: '/groups/available',
  },
  quizzes: {
    my: '/quizzes/my',
    groups: '/quizzes/groups',
  },
  settings: '/settings',
};

const formatHoursMinutes = (TimeOrDate) => {
  const date = new Date(TimeOrDate);
  return date.toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const millisecondsToHMFormat = (time) => {
  const hours = Math.floor(time / (1000 * 60 * 60));
  const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));

  return hours !== 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
    : hours === 0 && minutes !== 0
    ? `${minutes}m`
    : '0m';
};

module.exports = {
  formatHoursMinutes,
  millisecondsToHMFormat,
  pathNames,
  Task,
  Quiz,
};
