const express = require('express');
const router = express.Router();
const { createSession, createNewUser } = require('../controllers/login');
const {
  verifySessionCookieWithRedirect,
  verifySessionCookieWithoutRedirect
} = require('../middleware/sessionVerification');

router.get('/login', verifySessionCookieWithRedirect);
router.post('/session-login', createSession);
router.post(
  '/insert-user-data',
  verifySessionCookieWithoutRedirect,
  createNewUser
);
module.exports = router;
