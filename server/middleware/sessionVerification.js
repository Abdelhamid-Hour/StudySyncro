const { admin } = require('../firebase/firebaseAdmin');
const { clearCookies } = require('./clearCookies');
const { verifyCSRFToken } = require('./csrfTokenVerification');
// get
const verifySessionCookie = async function (req) {
  const sessionCookie = req.cookies.session || '';
  const decodedClaims = await admin
    .auth()
    .verifySessionCookie(sessionCookie, true);
  req.user = decodedClaims;
};

const verifySessionCookieWithRedirect = async function (req, res, next) {
  try {    
    console.log("daz hna")
    if(req.path.includes(''))

    await verifySessionCookie(req);
    if (req.path.includes('/login')) return res.status(200).redirect('/main_page');
    return next();
  } catch (error) {
    clearCookies(res, ['session', 'SECRET', 'csrfToken']);
    if (/login|main_assets|firebase/g.test(req.path)) return next();
    console.log(error.message);
    return res.status(401).redirect('/login');
  }
};

const verifySessionCookieWithoutRedirect = async function (req, res, next) {
  try {
    await verifySessionCookie(req);
    verifyCSRFToken(req);
    return next();
  } catch (error) {
    console.log(error.message);
    clearCookies(res, ['session', 'SECRET', 'csrfToken']);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = {
  verifySessionCookieWithRedirect,
  verifySessionCookieWithoutRedirect,
};


