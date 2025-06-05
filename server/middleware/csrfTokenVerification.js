const Tokens = require('csrf');
const tokens = new Tokens();

const verifyCSRFToken = function (req) {
  
  const csrfToken = req.method === "GET" ? req.headers.csrftoken : req.body.csrfToken || '';
  const secret = req.cookies.SECRET || '';
  console.log(csrfToken  + " hello")
  console.log(secret + " not hello")
  console.log(req.headers)
    if (!tokens.verify(secret, csrfToken))
      throw new Error('Invalid CSRF token');
};

module.exports = { verifyCSRFToken, tokens };
