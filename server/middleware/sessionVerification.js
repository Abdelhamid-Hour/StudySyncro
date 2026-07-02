const { admin, db } = require("../firebase/firebaseAdmin");
const { clearCookies } = require("./clearCookies");
const { verifyCSRFToken } = require("./csrfTokenVerification");
// get
const verifySessionCookie = async function (req) {
  const sessionCookie = req.cookies.session || "";
  const decodedClaims = await admin
    .auth()
    .verifySessionCookie(sessionCookie, true);
  const userDoc = await db.collection("users").doc(decodedClaims.uid).get();

  req.user = {
    uid: decodedClaims.uid,
    ...userDoc.data(),
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
  try {
    if (isFetch) verifyCSRFToken(req);
    await verifySessionCookie(req);
    return next();
  } catch (error) {
    clearCookies(res, ["session", "SECRET", "csrfToken"]);
    if (isFetch) return res.status(401).json({ message: "Unauthorized" });
    return res.redirect("/login");
  }
};

const requireAuthForAPI = async (req, res, next) => {
  try {
    // Allow SSE GET streams to use cookie-based auth only (no CSRF header)
    if (req.method === "GET" && (req.path.endsWith("/chat-stream") || req.path.endsWith("/stream-sessions") || req.path.endsWith("/stream-single-session"))) {
      await verifySessionCookie(req); // only auth
      return next();
    }
    verifyCSRFToken(req);
    await verifySessionCookie(req);
    return next();
  } catch (error) {
    clearCookies(res, ["session", "SECRET", "csrfToken"]);
    return res.status(401).json({ message: "Unauthorized" });
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
