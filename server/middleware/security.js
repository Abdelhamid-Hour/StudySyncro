const helmet = require("helmet");
const crypto = require("crypto");

// Generate Nonce Middleware
const generateNonce = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
};

// Configured Helmet Middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: process.env.NODE_ENV === "production",
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`,
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://www.gstatic.com",
        "https://cdn.skypack.dev",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://accounts.google.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://api.dicebear.com",
        "https://firebasestorage.googleapis.com",
      ],
      mediaSrc: ["'self'", "https://firebasestorage.googleapis.com"],
      connectSrc: [
        "'self'",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://identitytoolkit.googleapis.com",
        "https://firebasestorage.googleapis.com",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://*.firebaseapp.com",
        "https://firebaselogging.googleapis.com",
        "https://www.gstatic.com",
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://*.firebaseapp.com",
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  hsts: process.env.NODE_ENV === "production",
});

module.exports = {
  generateNonce,
  securityHeaders,
};
