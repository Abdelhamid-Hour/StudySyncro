const { db, admin } = require('../firebase/firebaseAdmin');
const { tokens } = require('../middleware/csrfTokenVerification');
/**
 * Create a new user in firestore or update the user data
 * if the user is signed in with google or facebook
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const createNewUser = async (req, res) => {
  const { uid, ...userData } = req.body.userInfo;

  try {
    const userRef = db.collection('users').doc(uid);
    // check if the user is signed in with google or facebook
    const userProvider = req.user?.firebase?.sign_in_provider;
    if (userProvider !== 'password') {
      const docSnap = await userRef.get();
      // check if the user data already exists in firestore
      if (docSnap.exists) {
        const existingData = docSnap.data();
        // check if the user data changed
        const updatedData = Object.keys(userData).reduce((acc, key) => {
          if (userData[key] !== existingData[key]) {
            acc[key] = userData[key];
          }
          return acc;
        }, {});
        // check if the user data is empty
        if (Object.keys(updatedData).length === 0) {
          return res.status(200).json({ message: 'User data already saved' });
        }

        await userRef.update(updatedData);
        return res.status(200).json({ message: 'User data updated' });
      }
    }
    await userRef.set(userData);
    return res.status(200).json({ message: 'User data saved' });
  } catch (error) {
    res.status(500).json({
      message: 'Error saving user data',
      error: error.message,
    });
  }
};

const createSession = async function (req, res) {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const options = { maxAge: expiresIn, httpOnly: true, secure: true };
  try {
    const secret = await tokens.secret();
    const csrfToken = tokens.create(secret);
    console.log(csrfToken + '  login route')
    console.log(secret + " secret login")
    res.cookie('SECRET', secret, options);
    res.cookie('csrfToken', csrfToken, {
      secure: true,
      maxAge: expiresIn,
    });
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });
    res.cookie('session', sessionCookie, options);
    return res.status(200).json({ message: 'Session created' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Error creating session' });
  }
};

module.exports = { createNewUser, createSession };
