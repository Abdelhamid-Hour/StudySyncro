if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const appRouter = require("./routes/app-router");
const authRouter = require("./routes/auth-router");
const apiRouter = require("./routes/api-routes");
const {
  requireAuthForPages,
  requireAuthForAPI,
} = require("./middleware/sessionVerification");
const { pageNotFoundHandler } = require("./controllers/pages");
const i18nMiddleware = require("./middleware/i18n");
const startSessionCleaner = require("./utils/cron/sessionCleaner");
const compression = require("compression");
const helmet = require("helmet");
const {
  setGlobalUrls,
  redirectRoute,
  generateSitemap,
  globalErrorHandler,
} = require("./controllers/funcs");

const app = express();

// SEO & Performance Middleware
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for now to avoid breaking existing scripts/images
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    hsts: process.env.NODE_ENV === "production", // Disabled because production currently lacks HTTPS
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse cookies
app.use(cookieParser());
// Internationalization middleware (must be after cookieParser)
app.use(i18nMiddleware);

// Global SEO / Dynamic URL middleware
app.use(setGlobalUrls);

// parse form data
app.use(express.urlencoded({ extended: false }));
// parse JSON data
app.use(express.json());

const routes = [
  { paths: ["/quizzes", "/app/quizzes"], redirect: "/app/quizzes/my" },
  { paths: "/settings", redirect: "/app/settings" },
  { paths: ["/home", "/app"], redirect: "/app/home" },
  { paths: ["/groups", "/app/groups"], redirect: "/app/groups/my" },
];

routes.forEach(({ paths, redirect }) => {
  app.get(paths, requireAuthForPages, redirectRoute(redirect));
});

// Dynamic Sitemap Generation
app.get("/sitemap.xml", generateSitemap);

// Routes
// authentification route
app.use("/", authRouter);

express.static.mime.define({ "application/javascript": ["mjs"] });
// Serve the static files
app.use(express.static(path.join(__dirname, "../client/public")));
// application route
app.use("/app", requireAuthForPages, appRouter);
// api route
app.use("/api", requireAuthForAPI, apiRouter);

// 404 Page not Found
app.all("*", pageNotFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

if (process.env.NODE_ENV === "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startSessionCleaner();
  });
}

module.exports = app;
