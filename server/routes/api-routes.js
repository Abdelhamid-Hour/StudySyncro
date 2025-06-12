const express = require('express');
const { createNewUser } = require('../controllers/auth');
const { setSessionDetails } = require('../middleware/home');
const { sendSessionDetails } = require('../controllers/home');
const {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizQuestionsHandler,
  getQuizzesHandler,
  createGroupHandler,
  joinGroupHandler,
  patchGroupHandler,
} = require('../controllers/groups');
const { generateTemplateContext } = require('../middleware/groups');
const { createGroup, modifyGroup } = require('../utils/firebase-utils/group');
const { joinGroup } = require('../utils/firebase-utils/demandes');
const {
  createExamen,
  modiferQuizQuestions,
  updateQuizTitle,
  updateQuizSubject,
} = require('../utils/firebase-utils/examen');
const { Task, Quiz } = require('../utils/global');
const {
  createQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
} = require('../controllers/quizzes');

const apiRouter = express.Router();

apiRouter.post('/insert-user-data', createNewUser); // * Completed

apiRouter.get('/session-details/:id', setSessionDetails, sendSessionDetails); // ! wait until I finish

apiRouter.get('/user-groups', getUserGroupsHandler); // * Completed

apiRouter.get('/available-groups', getAvailableGroupsHandler); // * Completed

apiRouter.post('/create-group', createGroupHandler); // * Completed

apiRouter.post('/join-group', joinGroupHandler); // * Completed

apiRouter.patch('/update-group/:groupId', patchGroupHandler); // * Completed

apiRouter.post('/create-quiz', createQuizHandler); // * Completed

apiRouter.put('/update-quiz/:quizId', updateQuizHandler); // * Completed

apiRouter.patch('/update-quiz/:quizId', patchQuizHandler); // * Completed

apiRouter.get('/quizzes', getQuizzesHandler);

apiRouter.get('/quiz-questions/:quizId', getQuizQuestionsHandler); // ! should implement with firebase

apiRouter.get('/quiz-details/:quizId', (req, res) => {
  const quizId = req.params.quizId;

  const result = {
    success: true,
    quizData: {
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
    },
  };

  if (result.success) {
    return res.status(200).json({ ...result.quizData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

apiRouter.get('/quizzes-list', (req, res) => {
  const { searchTerm, count, lastVisible } = req.query;

  const quizzes = [
    {
      id: 'quiz-1',
      title: 'JavaScript Basics',
    },
    {
      id: 'quiz-2',
      title: 'Advanced JavaScript',
    },
    {
      id: 'quiz-3',
      title: 'JavaScript Frameworks',
    },
    {
      id: 'quiz-4',
      title: 'JavaScript Best Practices',
    },
    {
      id: 'quiz-5',
      title: 'JavaScript Testing',
    },
    {
      id: 'quiz-6',
      title: 'JavaScript Performance Optimization',
    },
    {
      id: 'quiz-7',
      title: 'JavaScript Asynchronous Programming',
    },
    {
      id: 'quiz-8',
      title: 'JavaScript Design Patterns',
    },
    {
      id: 'quiz-9',
      title: 'JavaScript ES6 Features',
    },
    {
      id: 'quiz-10',
      title: 'JavaScript DOM Manipulation',
    },
    {
      id: 'quiz-11',
      title: 'JavaScript Event Handling',
    },
    {
      id: 'quiz-12',
      title: 'JavaScript AJAX and Fetch API',
    },
    {
      id: 'quiz-13',
      title: 'JavaScript Object-Oriented Programming',
    },
    {
      id: 'quiz-14',
      title: 'JavaScript Functional Programming',
    },
    {
      id: 'quiz-15',
      title: 'JavaScript Memory Management',
    },
    {
      id: 'quiz-16',
      title: 'JavaScript Security Best Practices',
    },
    {
      id: 'quiz-17',
      title: 'JavaScript Modern Tooling',
    },
    {
      id: 'quiz-18',
      title: 'JavaScript Web APIs',
    },
    {
      id: 'quiz-19',
      title: 'JavaScript Internationalization',
    },
    {
      id: 'quiz-20',
      title: 'JavaScript Accessibility',
    },
    {
      id: 'quiz-21',
      title: 'JavaScript Progressive Web Apps',
    },
    {
      id: 'quiz-22',
      title: 'JavaScript Server-Side Programming',
    },
    {
      id: 'quiz-23',
      title: 'JavaScript Mobile Development',
    },
    {
      id: 'quiz-24',
      title: 'JavaScript Game Development',
    },
    {
      id: 'quiz-25',
      title: 'JavaScript Data Visualization',
    },
    {
      id: 'quiz-26',
      title: 'JavaScript Machine Learning',
    },
    {
      id: 'quiz-27',
      title: 'JavaScript Blockchain Development',
    },
    {
      id: 'quiz-28',
      title: 'JavaScript Internet of Things (IoT)',
    },
    {
      id: 'quiz-29',
      title: 'JavaScript Cloud Computing',
    },
    {
      id: 'quiz-30',
      title: 'JavaScript DevOps Practices',
    },
    {
      id: 'quiz-31',
      title: 'JavaScript Cross-Browser Compatibility',
    },
    {
      id: 'quiz-32',
      title: 'JavaScript Code Quality Tools',
    },
    {
      id: 'quiz-33',
      title: 'JavaScript Version Control with Git',
    },
    {
      id: 'quiz-34',
      title: 'JavaScript Build Tools and Task Runners',
    },
    {
      id: 'quiz-35',
      title: 'JavaScript Web Performance Optimization',
    },
    {
      id: 'quiz-36',
      title: 'JavaScript WebAssembly',
    },
    {
      id: 'quiz-37',
      title: 'JavaScript Real-Time Applications',
    },
    {
      id: 'quiz-38',
      title: 'JavaScript Virtual Reality (VR) and Augmented Reality (AR)',
    },
    {
      id: 'quiz-39',
      title: 'JavaScript Ethical Hacking',
    },
    {
      id: 'quiz-40',
      title: 'JavaScript Quantum Computing',
    },
  ];
  const cards = quizzes
    .filter((quiz) => {
      return quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .slice(searchTerm && lastVisible ? lastVisible : 0, count ? count : 10);
  const result = {
    success: true,
    quizData: {
      cards: cards,
      lastVisible:
        cards.length == (count ? count : 10)
          ? (searchTerm && lastVisible ? parseInt(count, 10) : 0) +
            (count ? parseInt(count, 10) : 10)
          : null,
    },
  };

  if (result.success) {
    return res.status(200).json({
      ...result.quizData,
    });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

apiRouter.get('/active-session', (req, res) => {
  const result = {
    success: true,
    sessionData: {
      tasks: [
        new Task({
          UID: 'task-1',
          title: 'Introduction to JavaScript',
          description:
            'Learn the basics of JavaScript, including syntax and variables.',
          durationInMins: 30, // in minutes
          status: 'completed',
        }),
        new Task({
          UID: 'task-2',
          title: 'Break',
          durationInMins: 5, // in minutes
          isBreak: true,
          status: 'active',
        }),
        {
          UID: '123',
          title: 'JavaScript Quiz',
          description: 'Test your knowledge of JavaScript basics.',
          durationInMins: 10, // in minutes
          questionsCount: 10,
          status: 'pending',
        },
      ],
      startDate: '2025-06-10T21:23:54.096Z',
      id: '12345',
      groupId: '67890',
      durationInMins: 60, // in minutes
      quiz: null,
    },
  };

  if (result.success) {
    return res.status(200).json({ ...result.sessionData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

apiRouter.post('/update-task-status', async (req, res) => {
  const { taskId, status } = req.body;
  const userData = req.user;

  const result = {
    success: true,
    message: `Task ${taskId} status updated to ${status}`,
  };

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

apiRouter.post('/create-session', async (req, res) => {
  const sessionData = req.body.sessionData;
  const userData = req.user;
  const result = {
    success: true,
    message: 'Session created successfully',
  };

  console.log(sessionData);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

[
  // ? Group Fragment Routes: Send Group Left Sidebar Content
  { route: '/group-info', title: 'Group Informations' },
  { route: '/session-info', title: 'Session Informations' },
  { route: '/members-list', title: 'Members' },
  { route: '/demandes-list', title: 'Join Requests' },
  { route: '/quizzes-list', title: 'Quizzes' },
].forEach((config) => {
  apiRouter.get(
    `${config.route}/:id`,
    generateTemplateContext,
    groupFragmentHandler(config)
  );
});

module.exports = apiRouter;
