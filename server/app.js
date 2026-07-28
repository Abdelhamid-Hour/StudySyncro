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
const { renderFragmentOrLayout } = require("./utils/routing");
const { pageNotFoundHandler } = require("./controllers/pages");
const i18nMiddleware = require("./middleware/i18n");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse cookies
app.use(cookieParser());
// Internationalization middleware (must be after cookieParser)
app.use(i18nMiddleware);
// parse form data
app.use(express.urlencoded({ extended: false }));
// parse JSON data
app.use(express.json());
app.use((req, rea, next) => {
  console.log("frm app: ", req.url);
  next();
});

const routes = [
  { paths: ["/quizzes", "/app/quizzes"], redirect: "/app/quizzes/my" },
  { paths: "/settings", redirect: "/app/settings" },
  { paths: ["/home", "/app"], redirect: "/app/home" },
  { paths: ["/groups", "/app/groups"], redirect: "/app/groups/my" },
];

routes.forEach(({ paths, redirect }) => {
  app.get(paths, requireAuthForPages, (req, res) => res.redirect(redirect));
});
// Routes
// authentification route
app.use("/", authRouter);

// Serve the static files
app.use(express.static(path.join(__dirname, "../client/public")));
// application route
app.use("/app", requireAuthForPages, appRouter);
// api route
app.use("/api", requireAuthForAPI, apiRouter);

// 404 Page not Found
app.all("*", pageNotFoundHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
