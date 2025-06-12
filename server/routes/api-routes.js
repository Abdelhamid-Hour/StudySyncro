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
  getQuizzInfo,
  getSessionQuizzes,
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

apiRouter.get('/quiz-details/:quizId', async(req, res) => {
  const quizId = req.params.quizId;
  const userId  = req.user.uid 
  const response = await getQuizzInfo(quizId  , userId)
 
  // const result = {
  //   success: true,
  //   quizData: {
  //     title: 'JavaScript Basics',
  //     subject: 'JavaScript',
  //     questions: [
  //       {
  //         id: 'q1',
  //         text: 'What is the capital of Morocco?',
  //         choices: ['Casablanca', 'Marrakesh', 'Fez', 'Rabat'],
  //         correctAnswerIndex: 3, // Rabat
  //       },
  //       {
  //         id: 'q2',
  //         text: 'How many planets are there in the solar system?',
  //         choices: ['7', '8', '9', '10'],
  //         correctAnswerIndex: 1, // 8
  //       },
  //       {
  //         id: 'q3',
  //         text: 'What is the result of 9 × 6?',
  //         choices: ['54', '56', '59', '60'],
  //         correctAnswerIndex: 0, // 54
  //       },
  //       {
  //         id: 'q4',
  //         text: 'Who invented the electric light bulb?',
  //         choices: ['Einstein', 'Edison', 'Newton', 'Beethoven'],
  //         correctAnswerIndex: 1, // Edison
  //       },
  //       {
  //         id: 'q5',
  //         text: 'What is 100 minus 47?',
  //         choices: ['52', '53', '54', '55'],
  //         correctAnswerIndex: 1, // 53
  //       },
  //       {
  //         id: 'q6',
  //         text: 'Which of these animals cannot fly?',
  //         choices: ['Eagle', 'Ostrich', 'Bat', 'Pigeon'],
  //         correctAnswerIndex: 1, // Ostrich
  //       },
  //       {
  //         id: 'q7',
  //         text: 'How many minutes are there in one hour?',
  //         choices: ['60', '100', '45', '90'],
  //         correctAnswerIndex: 0, // 60
  //       },
  //       {
  //         id: 'q8',
  //         text: 'What is the sum of 11 and 22?',
  //         choices: ['31', '32', '33', '34'],
  //         correctAnswerIndex: 2, // 33
  //       },
  //       {
  //         id: 'q9',
  //         text: 'What is the official language of Morocco?',
  //         choices: ['French', 'Tamazight', 'Arabic', 'English'],
  //         correctAnswerIndex: 2, // Arabic
  //       },
  //       {
  //         id: 'q10',
  //         text: 'Which continent is Egypt located in?',
  //         choices: ['Asia', 'Europe', 'Africa', 'South America'],
  //         correctAnswerIndex: 2, // Africa
  //       },
  //     ], // ? here use the same func in /quiz-questions/:quizId route
  //   },
  // };

  if (result.success) {
    return res.status(200).json({ ...response.quizData });
  } else {
    return res.status(400).json({
      message: response.message,
    });
  }
}); // ! should implement with firebase

apiRouter.get('/quizzes-list', async(req, res) => {
  const { searchTerm, count, lastVisible } = req.query;
  const result = await getSessionQuizzes(req.user.id , lastVisible , count , searchTerm)
    return res.status(200).json({
      result,
    });
  
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
