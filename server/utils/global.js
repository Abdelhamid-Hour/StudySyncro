class Task {
  constructor({ title, description, durationInMins }) {
    this.title = title;
    this.description = description;
    this.durationInMins = durationInMins;
  }
}
class Quiz extends Task {
  constructor({ UID, title, description, durationInMins, questionsCount }) {
    super({ title, description, durationInMins });
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
  quizzes: '/quizzes',
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
  const hours = Math.floor(time / (1000 * 60 * 60))
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60))
    .toString()
    .padStart(2, '0');

  return hours === '00' ? `${minutes}m` : `${hours}h ${minutes}m`;
};

module.exports = {
  formatHoursMinutes,
  millisecondsToHMFormat,
  pathNames,
  Task,
  Quiz,
};
