const Tokens = require('csrf');
const tokens = new Tokens();

const verifyCSRFToken = function (req) {
  const csrfToken = req.headers['csrftoken'] || '';
  const secret = req.cookies.SECRET || '';
    if (!tokens.verify(secret, csrfToken))
      throw new Error('Invalid CSRF token');
};

module.exports = { verifyCSRFToken, tokens };