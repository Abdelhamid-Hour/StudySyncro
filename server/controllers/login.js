const { admin } = require("../firebase/firebaseAdmin");
const { tokens } = require("../middleware/csrfTokenVerification");

const createSession = async function (req, res) {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const options = { maxAge: expiresIn, httpOnly: true, secure: true };
  try {
    const secret = await tokens.secret();
    const csrfToken = tokens.create(secret);
    console.log(csrfToken + "  login route");
    console.log(secret + " secret login");
    res.cookie("SECRET", secret, options);
    res.cookie("csrfToken", csrfToken, {
      secure: true,
      maxAge: expiresIn,
    });
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });
    res.cookie("session", sessionCookie, options);
    return res.status(200).json({ message: "Session created" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Error creating session" });
  }
};

module.exports = { createSession };
