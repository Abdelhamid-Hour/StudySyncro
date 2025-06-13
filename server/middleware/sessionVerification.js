const { admin } = require('../firebase/firebaseAdmin');
const { clearCookies } = require('./clearCookies');
const { verifyCSRFToken } = require('./csrfTokenVerification');
// get
const verifySessionCookie = async function (req) {
  const sessionCookie = req.cookies.session || '';
  const decodedClaims = await admin
    .auth()
    .verifySessionCookie(sessionCookie, true);
  const userDoc = await admin
    .firestore()
    .collection('users')
    .doc(decodedClaims.uid)
    .get();

  req.user = {
    uid: decodedClaims.uid,
    ...userDoc.data(),
  };
};

const redirectIfAuthenticated = async (req, res, next) => {
  try {
    await verifySessionCookie(req);
    return res.redirect('/app/home');
  } catch (error) {
    return next();
  }
};
//
const requireAuthForPages = async (req, res, next) => {
  
  const isFetch = req.headers['x-requested-with'] === 'fetch';
  try {
    if (isFetch) verifyCSRFToken(req);
    await verifySessionCookie(req);
    return next();
  } catch (error) {
    clearCookies(res, ['session', 'SECRET', 'csrfToken']);
    if (isFetch) return res.status(401).json({ message: 'Unauthorized' });
    return res.redirect('/logout');
  }
};

const requireAuthForAPI = async (req, res, next) => {
  try {
    verifyCSRFToken(req);
    await verifySessionCookie(req);
    return next();
  } catch (error) {
    clearCookies(res, ['session', 'SECRET', 'csrfToken']);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = {
  redirectIfAuthenticated,
  requireAuthForPages,
  requireAuthForAPI,
};

/**
 * home page : passed no veriifiication
 * login page:
 */
