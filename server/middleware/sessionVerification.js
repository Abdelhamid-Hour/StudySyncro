const { admin, db } = require("../firebase/firebaseAdmin");
const { clearCookies } = require("./clearCookies");
const { verifyCSRFToken, tokens } = require("./csrfTokenVerification");
// get
const verifySessionCookie = async function (req) {
  const sessionCookie = req.cookies.session || "";
  const decodedClaims = await admin
    .auth()
    .verifySessionCookie(sessionCookie, true);

  if (
    decodedClaims.firebase &&
    decodedClaims.firebase.sign_in_provider === "password" &&
    !decodedClaims.email_verified
  ) {
    throw new Error("api:email_not_verified");
  }

  const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
  let userData = userDoc.data();

  // Self-heal: If user authenticated in Firebase but Firestore profile doc is missing, initialize a default doc
  if (!userDoc.exists || !userData) {
    userData = {
      uid: decodedClaims.uid,
      email: decodedClaims.email || "",
      fullName: decodedClaims.name || "User",
      photoURL:
        decodedClaims.picture ||
        "https://api.dicebear.com/7.x/identicon/svg?seed=" +
          encodeURIComponent(decodedClaims.uid),
      createdAt: new Date().toISOString(),
    };
    await db.collection("users").doc(decodedClaims.uid).set(userData);
  }

  req.user = {
    uid: decodedClaims.uid,
    email_verified: decodedClaims.email_verified,
    ...userData,
  };
};

const redirectIfAuthenticated = async (req, res, next) => {
  try {
    await verifySessionCookie(req);
    return res.redirect("/app/home");
  } catch (error) {
    return next();
  }
};
//
const requireAuthForPages = async (req, res, next) => {
  const isFetch = req.headers["x-requested-with"] === "fetch";

  // If arriving from email verification link, verify right on the backend and create session directly
  if (req.query.mode === "verifyEmail" && req.query.oobCode) {
    try {     
      const apiKey = process.env.FIREBASE_API_KEY;
      
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
        {
          method: "POST",
          body: JSON.stringify({ oobCode: req.query.oobCode }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();
      
      if (!response.ok) {
        let errCode = "failed";
        if (data.error && data.error.message) {
          if (data.error.message === "EXPIRED_OOB_CODE") errCode = "expired";
          else if (data.error.message === "INVALID_OOB_CODE") errCode = "invalid";
          else errCode = "used"; 
        }
        const error = new Error("api:email_verification_api_failed");
        error.errCode = errCode;
        throw error;
      }

      const customToken = await admin.auth().createCustomToken(data.localId);
      const signInResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
        {
          method: "POST",
          body: JSON.stringify({ token: customToken, returnSecureToken: true }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!signInResponse.ok) {
        const error = new Error("api:custom_token_sign_in_failed");
        error.errCode = "failed";
        throw error;
      }

      const signInData = await signInResponse.json();

      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const options = { maxAge: expiresIn, httpOnly: true, secure: true };

      const secret = await tokens.secret();
      const csrfToken = tokens.create(secret);
      res.cookie("SECRET", secret, options);
      res.cookie("csrfToken", csrfToken, {
        secure: true,
        maxAge: expiresIn,
      });

      const sessionCookie = await admin
        .auth()
        .createSessionCookie(signInData.idToken, { expiresIn });
      res.cookie("session", sessionCookie, options);
      
      res.cookie("verified", "true", { maxAge: 60000 });

      return res.redirect("/app/home");
    } catch (err) {
      console.error("Error verifying action code in requireAuthForPages:", err.message);
      try {
        await verifySessionCookie(req);
        return res.redirect("/app/home");
      } catch (sessionErr) {
        return res.redirect(`/login?error=${err.errCode || 'failed'}`);
      }
    }
  }

  try {
    if (isFetch) verifyCSRFToken(req);
    await verifySessionCookie(req);
    return next();
  } catch (error) {
    clearCookies(res, ["session", "SECRET", "csrfToken"]);
    if (isFetch) return res.status(401).json({ message: "api:unauthorized" });
    return res.redirect("/login");
  }
};

const requireAuthForAPI = async (req, res, next) => {
  if (req.path === "/insert-user-data") {
    return next();
  }
  try {
    // Allow SSE GET streams to use cookie-based auth only (no CSRF header)
    if (
      req.method === "GET" &&
      (req.path.endsWith("/chat-stream") ||
        req.path.endsWith("/stream-sessions") ||
        req.path.endsWith("/stream-single-session") ||
        req.path.endsWith("/recent-messages/stream") ||
        req.path.endsWith("/notifications/stream"))
    ) {
      await verifySessionCookie(req); // only auth
      return next();
    }
    verifyCSRFToken(req);
    await verifySessionCookie(req);
    return next();
  } catch (error) {
    clearCookies(res, ["session", "SECRET", "csrfToken"]);
    return res.status(401).json({ message: "api:unauthorized" });
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
