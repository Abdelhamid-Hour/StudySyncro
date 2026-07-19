const { db, admin } = require("../firebase/firebaseAdmin");
const { clearCookies } = require("../middleware/clearCookies");
const { tokens } = require("../middleware/csrfTokenVerification");
const { uploadFileToStorage } = require("../utils/firebase-utils/shared");
/**
 * Create a new user in firestore or update the user data
 * if the user is signed in with google or facebook
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const createNewUser = async (req, res) => {
  const avatar = req.file;
  const { uid, ...userData } = req.body;

  try {
    const userRef = db.collection("users").doc(uid);
    const userRecord = await admin.auth().getUser(uid);
    const providers = userRecord.providerData.map((p) => p.providerId);
    // check if the user is signed in with google or facebook
    if (
      providers.includes("google.com") ||
      providers.includes("facebook.com")
    ) {
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
          return res.status(200).json({ message: "User data already saved" });
        }

        await userRef.update(updatedData);
        return res.status(200).json({ message: "User data updated" });
      }
    } else {
      if (avatar) {
        const filePath = `avatars/${uid}`;
        const result = await uploadFileToStorage(filePath, avatar, true);
        if (!result.success)
          return res.status(500).json({
            message: result.message,
            isNative: result.isNative ?? false,
            type: result.type ?? "error",
          });
        userData.photoURL = result.URL;
      } else {
        userData.photoURL =
          "https://api.dicebear.com/7.x/identicon/svg?seed=" +
          encodeURIComponent(userData.uid);
      }
      await admin.auth().updateUser(uid, { photoURL: userData.photoURL });
    }
    await userRef.set({
      ...userData,
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ message: "User data saved" });
  } catch (error) {
    console.error("Error saving user data:", error);
    return res.status(500).json({
      message: "Error saving user data",
      error: error.message,
      isNative: false,
      type: "error",
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
    return res.status(500).json({
      message: "Error creating session",
      isNative: false,
      type: "error",
    });
  }
};

const logOut = (req, res) => {
  clearCookies(res, ["session", "SECRET", "csrfToken"]);
  return res.redirect("/login");
};

module.exports = { createNewUser, createSession, logOut };
