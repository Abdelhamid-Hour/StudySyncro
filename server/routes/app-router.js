const express = require('express');
const { handleRoutes, handleGroupChatRoute, handleQuizEditRoute } = require('../controllers/pages');
const appRouter = express.Router();

const routes = [
  '/home',
  '/groups/my',
  '/groups/available',
  '/quizzes',
  '/settings',
];

appRouter.get(routes, handleRoutes);

appRouter.get('/groups/my/:groupId/chat', handleGroupChatRoute);

appRouter.get('/quizzes/:quizId/edit', handleQuizEditRoute);

module.exports = appRouter;
