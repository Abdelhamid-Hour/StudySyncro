const { db } = require('../firebase/firebaseAdmin');
const { clearCookies } = require('../middleware/clearCookies');

const renderMainPage = async (req, res) => {
  const docSnap = await db.collection('users').doc(req.user.uid).get();
  const userData = docSnap.data();
  return res.render('mainPage', { user: userData });
};

const logOut = (req, res) => {
  clearCookies(res, ['session', 'SECRET', 'csrfToken']);
  return res.status(200).redirect('/login');
};

module.exports = { renderMainPage, logOut };
