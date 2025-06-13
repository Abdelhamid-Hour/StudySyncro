const { getCurrentSessionInfo } = require('./firebase-utils/session');
const {
  Task,
  Quiz,
  formatHoursMinutes,
  millisecondsToHMFormat,
  pathNames,
} = require('./global');

const getCurrentSession = async (userId) => {
  // ! firestore query for if the user is join to any session
  // ! you can add a index to the quiz collection for know the task order
  const response = await getCurrentSessionInfo(userId);
  console.log(response, 'curret session');
  return response;
};

const getTimeLeft = (durationInMins, endTime) => {
  const now = new Date().getTime();
  const remainingTime = endTime - now;
  const timeLeft =
    remainingTime > 0
      ? durationInMins * 60 * 1000 - remainingTime
      : -(remainingTime - this.durationInMins * 60 * 1000);
  return timeLeft;
};

const getSessionDetails = (sessionId) => {
  const tasks = [
    new Task({
      title: 'Introduction to Ja      vaScript',
      description:
        'Learn the basics of JavaScript, including syntax and variables.',
      durationInMins: 2, // in minutes
    }),
    new Task({
      title: 'JavaScript Functions',
      description: 'Understand how to create and use functions in JavaScript.',
      durationInMins: 45, // in minutes
    }),
    new Quiz({
      UID: '123',
      title: 'JavaScript Quiz',
      description: 'Test your knowledge of JavaScript basics.',
      durationInMins: 10, // in minutes
      questionsCount: 10,
    }),
  ];

  const durationInMins = tasks.reduce(
    (acc, task) => (acc += task.durationInMins),
    0
  );
  const startDate = new Date().toISOString();
  const endTime = new Date(startDate).getTime() + durationInMins * 60 * 1000;
  const quiz = tasks.filter((task) => task.isQuiz)[0];
  return {
    name: 'Session de révision - Janvier 2025',
    description: 'Description de la session',
    startTime: formatHoursMinutes(startDate),
    endTime: formatHoursMinutes(endTime),
    duration: millisecondsToHMFormat(durationInMins * 60 * 1000),
    groupName: 'Frontend Developers',
    joinedCount: 25,
    tasks: tasks,
    quiz: {
      UID: '123',
      title: 'JavaScript Quiz',
      questionsCount: 10,
      status: 'pending',
    },
    millisecondsToHMFormat: millisecondsToHMFormat,
  };
};

const getActiveSessions = (userId) => {
  // TODO: Fetch active sessions from the database
  return [
    {
      UID: '12345',
      name: 'Session de révision - Janvier 2025',
      groupName: 'Frontend Developers',
      description: 'Description de la session',
      startTime: formatHoursMinutes('2025-01-01T14:00:00Z'),
      endTime: formatHoursMinutes('2025-01-01T16:00:00Z'),
      duration: millisecondsToHMFormat(120 * 60 * 1000),
      joinedCount: 25,
      tasksCount: 14,
    },
    {
      UID: '23456',
      name: 'Atelier React',
      groupName: 'React Enthusiasts',
      description: 'Atelier pratique sur React.js',
      startTime: formatHoursMinutes('2025-02-10T09:00:00Z'),
      endTime: formatHoursMinutes('2025-02-10T11:30:00Z'),
      duration: millisecondsToHMFormat(150 * 60 * 1000),
      joinedCount: 18,
      tasksCount: 10,
    },
    {
      UID: '34567',
      name: 'Quiz JavaScript',
      groupName: 'JS Learners',
      description: 'Session de quiz sur JavaScript',
      startTime: formatHoursMinutes('2025-03-05T13:30:00Z'),
      endTime: formatHoursMinutes('2025-03-05T15:00:00Z'),
      duration: millisecondsToHMFormat(90 * 60 * 1000),
      joinedCount: 30,
      tasksCount: 20,
    },
    {
      UID: '45678',
      name: 'Révision CSS',
      groupName: 'Web Designers',
      description: 'Révision des bases de CSS',
      startTime: formatHoursMinutes('2025-04-12T10:00:00Z'),
      endTime: formatHoursMinutes('2025-04-12T12:00:00Z'),
      duration: millisecondsToHMFormat(120 * 60 * 1000),
      joinedCount: 12,
      tasksCount: 8,
    },
    {
      UID: '56789',
      name: 'Session Node.js',
      groupName: 'Backend Masters',
      description: 'Découverte de Node.js',
      startTime: formatHoursMinutes('2025-05-20T15:00:00Z'),
      endTime: formatHoursMinutes('2025-05-20T17:30:00Z'),
      duration: millisecondsToHMFormat(150 * 60 * 1000),
      joinedCount: 22,
      tasksCount: 12,
    },
    {
      UID: '67890',
      name: 'Préparation Examen',
      groupName: 'Fullstack Group',
      description: "Préparation à l'examen final",
      startTime: formatHoursMinutes('2025-06-15T08:00:00Z'),
      endTime: formatHoursMinutes('2025-06-15T10:00:00Z'),
      durationInMins: millisecondsToHMFormat(120 * 60 * 1000),
      joinedCount: 28,
      tasksCount: 16,
    },
  ];
};

const fetchHomeData = async (userId) => {
  const session = await getCurrentSession(userId); // or null
  if (session) {
    return {
      pathName: pathNames.home.active,
      payload: { templateContext: { session, Quiz } },
    };
  }

  const availableSessions = getActiveSessions(userId);

  return {
    pathName: pathNames.home.inactive,
    payload: { templateContext: { availableSessions } },
  };
};

module.exports = {
  fetchHomeData,
  getSessionDetails,
  getTimeLeft,
};
