const express = require('express');
const { createNewUser, createSession } = require('../controllers/auth');
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
  getQuizzInfo,
  getSessionQuizzes,
} = require('../utils/firebase-utils/examen');
const { Task, Quiz } = require('../utils/global');
const {
  createQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
} = require('../controllers/quizzes');
const { changeTaskState } = require('../utils/firebase-utils/tache');
const { createSessions } = require('../utils/firebase-utils/session');

const apiRouter = express.Router();

apiRouter.post('/insert-user-data', createNewUser); // * Completed

apiRouter.get('/session-details/:id', setSessionDetails, sendSessionDetails); // ! wait until I finish || this is the overlay session details

apiRouter.get('/user-groups', getUserGroupsHandler); // * Completed

apiRouter.get('/available-groups', getAvailableGroupsHandler); // * Completed

apiRouter.post('/create-group', createGroupHandler); // * Completed

apiRouter.post('/join-group', joinGroupHandler); // * Completed

apiRouter.patch('/update-group/:groupId', patchGroupHandler); // * Completed

apiRouter.post('/create-quiz', createQuizHandler); // * Completed

apiRouter.put('/update-quiz/:quizId', updateQuizHandler); // * Completed

apiRouter.patch('/update-quiz/:quizId', patchQuizHandler); // * Completed

apiRouter.get('/quizzes', getQuizzesHandler);

apiRouter.get('/quiz-questions/:quizId', getQuizQuestionsHandler); // * shoult test

apiRouter.get('/quiz-details/:quizId', async (req, res) => {
  const quizId = req.params.quizId;
  const userId = req.user.uid;
  const result = await getQuizzInfo(quizId, userId);

  if (result.success) {
    return res.status(200).json({ ...result.quizData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // * shoult test

apiRouter.get('/quizzes-list', async (req, res) => {
  const { searchTerm, count, lastVisible } = req.query;
  const result = await getSessionQuizzes(
    req.user.uid,
    lastVisible,
    count,
    searchTerm
  );

  return res.status(200).json({
    ...result,
  });
}); // * shoult test

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
  const result = await changeTaskState(status, taskId);
  console.log(result);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // * should test

apiRouter.post('/create-session', async (req, res) => {
  const sessionData = req.body.sessionData;

  const result = await createSessions(sessionData);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // * should test

// Accept a join request by userId and groupId
apiRouter.post('/accept-demande', async (req, res) => {
  const { demandeId, groupId } = req.body;
  // TODO: Implement acceptDemande logic
  const result = { success: true, message: 'Demande accepted' };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Reject a join request by userId and groupId
apiRouter.post('/reject-demande', async (req, res) => {
  const { userId, groupId } = req.body;
  // TODO: Implement rejectDemande logic
  const result = { success: true, message: 'Demande rejected' };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Join a session by sessionId
apiRouter.post('/join-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  // TODO: Implement joinSession logic
  const result = { success: true, message: 'Joined session' };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

// Remove a group by groupId
apiRouter.delete('/remove-group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  // TODO: Implement removeGroup logic
  const result = { success: true, message: 'Group removed' };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Leave a group by userId and groupId
apiRouter.post('/leave-group', async (req, res) => {
  const { groupId } = req.body;
  // TODO: Implement leaveGroup logic
  const result = {
    success: true,
    message: 'Left group',
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Add members to a group by userId(s) and groupId
apiRouter.post('/add-member', async (req, res) => {
  const { memberId, groupId } = req.body; // !! check the userId
  // TODO: Implement addMembers logic
  const result = {
    success: true,
    message: 'Member added to group',
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Kick a member from a group by groupId and userId
apiRouter.post('/kick-member', async (req, res) => {
  const { groupId, memberId } = req.body;
  // TODO: Implement kickMember logic
  const result = {
    success: true,
    message: 'Member kicked from group',
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Transfer role in a group by groupId, fromUserId, toUserId
apiRouter.post('/transfer-role', async (req, res) => {
  const { groupId, memberId } = req.body;
  // TODO: Implement transferRole logic
  const result = {
    success: true,
    message: 'Role transferred in group',
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// End a session by sessionId
apiRouter.post('/end-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  // TODO: Implement endSession logic
  const result = { success: true, message: 'Session ended' };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

// Leave a session by sessionId and userId
apiRouter.post('/leave-session', async (req, res) => {
  const { sessionId, userId } = req.body;
  // TODO: Implement leaveSession logic
  const result = {
    success: true,
    message: 'Left session',
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

// Get examen result by userId and quizId
apiRouter.get('/examen-result', async (req, res) => {
  const { userId, quizId } = req.query;
  // TODO: Implement getExamenResult logic
  const result = {
    success: true,
    message: 'Examen result',
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

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
