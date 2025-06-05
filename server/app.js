const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const appRouter = require('./routes/app-router');
const authRouter = require('./routes/auth-router');
const apiRouter = require('./routes/api-routes');
const {
  requireAuthForPages,
  requireAuthForAPI,
} = require('./middleware/sessionVerification');
const app = express();

app.set('view engine', 'ejs');

// Parse cookies
app.use(cookieParser());
// parse form data
app.use(express.urlencoded({ extended: false }));
// parse JSON data
app.use(express.json());

const routes = [
  { paths: '/quizzes', redirect: '/app/quizzes' },
  { paths: '/settings', redirect: '/app/settings' },
  { paths: ['/home', '/app'], redirect: '/app/home' },
  { paths: ['/groups', '/app/groups'], redirect: '/app/groups/my' },
];

routes.forEach(({ paths, redirect }) => {
  app.get(paths, requireAuthForPages, (req, res) => res.redirect(redirect));
});
// Routes
// authentification route
app.use('/', authRouter);
// Serve the static files
app.use(express.static(path.join(__dirname, '../client/public')));
// application route
app.use('/app', requireAuthForPages, appRouter);
// api route
app.use('/api', requireAuthForAPI, apiRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
