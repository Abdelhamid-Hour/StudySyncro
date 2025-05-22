const express = require('express');
const { createNewUser } = require('../controllers/auth-controllers');
const { setSessionDetails } = require('../middleware/home');
const { sendSessionDetails } = require('../controllers/home');
const { getUserGroupsHandler, getAvailableGroupsHandler, groupFragmentHandler } = require('../controllers/groups');
const { generateTemplateContext } = require('../middleware/groups');

const apiRouter = express.Router();

apiRouter.post('/insert-user-data', createNewUser);

apiRouter.get('/session-details/:id', setSessionDetails, sendSessionDetails);

apiRouter.get('/user-groups', getUserGroupsHandler);

apiRouter.get('/available-groups', getAvailableGroupsHandler);

// ? Group Fragment Routes: Send Group Left Sidebar Content

[
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
