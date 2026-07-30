const Tokens = require('csrf');
const tokens = new Tokens();

const verifyCSRFToken = function (req) {
  const csrfToken = req.headers['csrftoken'] || '';
  const secret = req.cookies.SECRET || '';
    if (!tokens.verify(secret, csrfToken))
      throw new Error("api:invalid_csrf_token");
};

module.exports = { verifyCSRFToken, tokens };