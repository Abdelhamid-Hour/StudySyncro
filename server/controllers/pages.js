const { getGroupChatContext } = require('../utils/groups');
const { fetchData, renderFragmentOrLayout } = require('../utils/routing');

const handleRoutes = async (req, res) => {
  const payload = await fetchData(req.path, req.user);
  const pathName = req.path === '/home' ? payload.pathName : req.path;

  if (pathName === '/home') console.log(payload);

  const template = `templates${
    pathName === '/home'
      ? payload.pathName
      : pathName === '/quizzes'
      ? '/quizzes/quizzes-list'
      : pathName
  }`;
  return renderFragmentOrLayout(
    template,
    req.path === '/home' ? payload.payload : payload,
    pathName,
    req,
    res
  );
};

const handleGroupChatRoute = (req, res) => {
  const templateContext = getGroupChatContext(req.params.groupId); // Replace with actual logic to get group chat context
  const extraData = {
    groupName: templateContext.groupName,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };

  renderFragmentOrLayout(
    'templates/groups/group-chat',
    payload,
    '/groups/my/group-chat',
    req,
    res,
    extraData
  );
}; // ! should implement with firebase

const handleQuizEditRoute = (req, res) => {
  const quizId = req.params.quizId;
  const templateContext = {
    title: 'JavaScript Basics',
    subject: 'JavaScript',
    questions: [
      {
        id: 'q1',
        text: 'What is the capital of Morocco?',
        choices: ['Casablanca', 'Marrakesh', 'Fez', 'Rabat'],
        correctAnswerIndex: 3, // Rabat
      },
      {
        id: 'q2',
        text: 'How many planets are there in the solar system?',
        choices: ['7', '8', '9', '10'],
        correctAnswerIndex: 1, // 8
      },
      {
        id: 'q3',
        text: 'What is the result of 9 × 6?',
        choices: ['54', '56', '59', '60'],
        correctAnswerIndex: 0, // 54
      },
      {
        id: 'q4',
        text: 'Who invented the electric light bulb?',
        choices: ['Einstein', 'Edison', 'Newton', 'Beethoven'],
        correctAnswerIndex: 1, // Edison
      },
      {
        id: 'q5',
        text: 'What is 100 minus 47?',
        choices: ['52', '53', '54', '55'],
        correctAnswerIndex: 1, // 53
      },
      {
        id: 'q6',
        text: 'Which of these animals cannot fly?',
        choices: ['Eagle', 'Ostrich', 'Bat', 'Pigeon'],
        correctAnswerIndex: 1, // Ostrich
      },
      {
        id: 'q7',
        text: 'How many minutes are there in one hour?',
        choices: ['60', '100', '45', '90'],
        correctAnswerIndex: 0, // 60
      },
      {
        id: 'q8',
        text: 'What is the sum of 11 and 22?',
        choices: ['31', '32', '33', '34'],
        correctAnswerIndex: 2, // 33
      },
      {
        id: 'q9',
        text: 'What is the official language of Morocco?',
        choices: ['French', 'Tamazight', 'Arabic', 'English'],
        correctAnswerIndex: 2, // Arabic
      },
      {
        id: 'q10',
        text: 'Which continent is Egypt located in?',
        choices: ['Asia', 'Europe', 'Africa', 'South America'],
        correctAnswerIndex: 2, // Africa
      },
    ], // ? here use the same func in /quiz-questions/:quizId route
    sessionsCount: 3,
    groupsCount: 2,
  };
  const extraData = {
    quizTitle: templateContext.title,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };
  renderFragmentOrLayout(
    'templates/quizzes/quiz-editor',
    payload,
    '/quizzes/quiz-editor',
    req,
    res,
    extraData
  );
}; // ! should implement with firebase

const handleQuizPlayRoute = (req, res) => {
  const templateContext = {
    firstQuestion: {
      id: 'q1',
      text: 'What is the capital of Morocco?',
      choices: ['Casablanca', 'Marrakesh', 'Fez', 'Rabat'],
      correctAnswerIndex: 3, // Rabat
    },
    totalQuestions: 10,
    quizTitle: 'Geography Quiz',
  }; // Replace with actual logic to get group chat context
  const payload = {
    templateContext,
  };
  renderFragmentOrLayout(
    'templates/quiz-play',
    payload,
    '/quiz-play',
    req,
    res
  );
};

module.exports = {
  handleRoutes,
  handleGroupChatRoute,
  handleQuizEditRoute,
  handleQuizPlayRoute,
};
