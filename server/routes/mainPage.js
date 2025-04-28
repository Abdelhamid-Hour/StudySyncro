const express = require('express');
const router = express.Router();
const { renderMainPage, logOut } = require('../controllers/mainPage');
const {
  verifySessionCookieWithRedirect,
  verifySessionCookieWithoutRedirect,
} = require('../middleware/sessionVerification');

router.get('/main_page', verifySessionCookieWithRedirect, renderMainPage);
router.post('/session-logout', verifySessionCookieWithoutRedirect, logOut);

module.exports = router;