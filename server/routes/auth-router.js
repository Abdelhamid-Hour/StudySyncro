const express = require('express');
const authRouter = express.Router();
const { createSession, logOut } = require('../controllers/auth');
const {
  redirectIfAuthenticated,
} = require('../middleware/sessionVerification');

authRouter.get('/login', redirectIfAuthenticated);

authRouter.post('/login', createSession);

authRouter.post('/logout', logOut);

module.exports = authRouter;
