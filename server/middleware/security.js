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
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`,
        "https://accounts.google.com",
        "https://www.gstatic.com",
        "https://cdn.skypack.dev",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
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
      mediaSrc: [
        "'self'",
        "https://firebasestorage.googleapis.com",
      ],
      connectSrc: [
        "'self'",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://identitytoolkit.googleapis.com",
        "https://firebasestorage.googleapis.com",
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
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
