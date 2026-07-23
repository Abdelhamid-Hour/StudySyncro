const express = require('express');
const authRouter = express.Router();
const { createSession, logOut } = require('../controllers/auth');
const {
  redirectIfAuthenticated,
} = require('../middleware/sessionVerification');

authRouter.get('/', redirectIfAuthenticated, (req, res) => {
  res.render('templates/landing');
});

authRouter.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('templates/login');
});

authRouter.get('/reset-password', redirectIfAuthenticated, (req, res) => {
  res.render('templates/reset-password');
});

authRouter.post('/login', createSession);

authRouter.post('/logout', logOut);

module.exports = authRouter;

