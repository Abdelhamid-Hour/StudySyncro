const { db, admin } = require("../firebase/firebaseAdmin");
const { clearCookies } = require("../middleware/clearCookies");
const { tokens } = require("../middleware/csrfTokenVerification");
const { uploadFileToStorage } = require("../utils/firebase-utils/shared");
const { sendEmailVerificationMail, sendPasswordResetMail } = require("../utils/email-service");

/**
 * Create a new user in firestore or update the user data
 * if the user is signed in with google or facebook
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const createNewUser = async (req, res) => {
  const avatar = req.file;
  const { uid, idToken, ...userData } = req.body;

  try {
    let verifiedUid = null;
    if (idToken) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      verifiedUid = decodedToken.uid;
    } else if (req.cookies && req.cookies.session) {
      const decodedClaims = await admin
        .auth()
        .verifySessionCookie(req.cookies.session, true);
      verifiedUid = decodedClaims.uid;
    }

    if (!verifiedUid || verifiedUid !== uid) {
      return res.status(401).json({
        message: res.locals.t("api:unauthorized_invalid_identity_token"),
        isNative: true,
        type: "error",
      });
    }

    const userRef = db.collection("users").doc(uid);
    const docSnap = await userRef.get();

    if (docSnap.exists) {
      const existingData = docSnap.data();
      const updatedData = Object.keys(userData).reduce((acc, key) => {
        if (
          userData[key] !== existingData[key] &&
          userData[key] !== undefined
        ) {
          acc[key] = userData[key];
        }
        return acc;
      }, {});

      if (avatar) {
        const filePath = `avatars/${uid}`;
        const result = await uploadFileToStorage(filePath, avatar, true);
        if (!result.success)
          return res.status(500).json({
            message: res.locals.t(result.message),
            isNative: result.isNative ?? false,
            type: result.type ?? "error",
          });
        updatedData.photoURL = result.URL;
        await admin.auth().updateUser(uid, { photoURL: updatedData.photoURL });
      }

      if (Object.keys(updatedData).length === 0) {
        return res.status(200).json({ message: res.locals.t("api:user_data_already_saved") });
      }

      await userRef.update(updatedData);
      return res.status(200).json({ message: res.locals.t("api:user_data_updated") });
    }

    const userRecord = await admin.auth().getUser(uid);
    const providers = userRecord.providerData.map((p) => p.providerId);

    if (avatar) {
      const filePath = `avatars/${uid}`;
      const result = await uploadFileToStorage(filePath, avatar, true);
      if (!result.success)
        return res.status(500).json({
          message: res.locals.t(result.message),
          isNative: result.isNative ?? false,
          type: result.type ?? "error",
        });
      userData.photoURL = result.URL;
    } else if (
      !userData.photoURL ||
      (typeof userData.photoURL === "string" &&
        !/^(https?:\/\/[^\s]+)$/.test(userData.photoURL))
    ) {
      userData.photoURL =
        "https://api.dicebear.com/7.x/identicon/svg?seed=" +
        encodeURIComponent(uid);
    }

    if (
      !providers.includes("google.com") &&
      !providers.includes("facebook.com")
    ) {
      await admin.auth().updateUser(uid, { photoURL: userData.photoURL });
    }

    await userRef.set({
      uid,
      ...userData,
      createdAt: new Date().toISOString(),
    });

    // --- NEW: Backend-Mediated Email Verification ---
    // If the user hasn't verified their email (and isn't using Google/Facebook)
    if (userRecord.email && !userRecord.emailVerified && !providers.includes("google.com") && !providers.includes("facebook.com")) {
      try {
        const firebaseLink = await admin.auth().generateEmailVerificationLink(userRecord.email);
        
        // Extract oobCode to build our custom action URL
        const urlParams = new URL(firebaseLink).searchParams;
        const oobCode = encodeURIComponent(urlParams.get("oobCode"));
        const customActionLink = `${process.env.RENDER_EXTERNAL_URL || "http://localhost:5000"}/app/home?mode=verifyEmail&oobCode=${oobCode}`;
        
        await sendEmailVerificationMail(userRecord.email, customActionLink);
      } catch (emailError) {
        console.error("Error sending backend email verification:", emailError);
      }
    }
    // ------------------------------------------------

    return res.status(200).json({ message: res.locals.t("api:user_data_saved") });
  } catch (error) {
    console.error("Error saving user data:", error);
    return res.status(500).json({
      message: res.locals.t("api:error_saving_user_data"),
      error: error.message,
      isNative: false,
      type: "error",
    });
  }
};

const createSession = async function (req, res) {
  const { idToken } = req.body;

  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const options = { maxAge: expiresIn, httpOnly: true, secure: true };
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (
      decodedToken.firebase &&
      decodedToken.firebase.sign_in_provider === "password" &&
      !decodedToken.email_verified
    ) {
      return res.status(403).json({
        message: res.locals.t("api:please_verify_your_email_address_before_signing_in"),
        isNative: true,
        type: "warning",
      });
    }

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
    return res.status(200).json({ message: res.locals.t("api:session_created") });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: res.locals.t("api:error_creating_session"),
      isNative: false,
      type: "error",
    });
  }
};

const logOut = (req, res) => {
  clearCookies(res, ["session", "SECRET", "csrfToken"]);
  return res.redirect("/login");
};

/**
 * Generate password reset link and send via Nodemailer
 * @param {Request} req
 * @param {Response} res
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Generate the default Firebase link without actionCodeSettings
    const firebaseLink = await admin.auth().generatePasswordResetLink(email);
    
    // Parse out the oobCode and encode it for safety
    const urlParams = new URL(firebaseLink).searchParams;
    const oobCode = encodeURIComponent(urlParams.get("oobCode"));

    // Build the custom URL pointing to the custom reset-password page
    const customActionLink = `${process.env.RENDER_EXTERNAL_URL || "http://localhost:5000"}/reset-password?mode=resetPassword&oobCode=${oobCode}`;

    await sendPasswordResetMail(email, customActionLink);
    return res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // Return 200 even on error to prevent email enumeration attacks
    return res.status(200).json({ message: "If the email exists, a reset link was sent." });
  }
};

/**
 * Generate email verification link and send via Nodemailer (Resend)
 * @param {Request} req
 * @param {Response} res
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    
    if (userRecord.emailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const firebaseLink = await admin.auth().generateEmailVerificationLink(email);
    const urlParams = new URL(firebaseLink).searchParams;
    const oobCode = encodeURIComponent(urlParams.get("oobCode"));

    const customActionLink = `${process.env.RENDER_EXTERNAL_URL || "http://localhost:5000"}/app/home?mode=verifyEmail&oobCode=${oobCode}`;

    await sendEmailVerificationMail(email, customActionLink);
    return res.status(200).json({ message: "Verification email resent." });
  } catch (error) {
    console.error("Error resending verification email:", error);
    // Return 200 to prevent email enumeration, or 400 if user doesn't exist
    return res.status(200).json({ message: "If the email exists and is unverified, a link was sent." });
  }
};

module.exports = { createNewUser, createSession, logOut, forgotPassword, resendVerification };
