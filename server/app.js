const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const loginRouter = require('./routes/login');
const mainPageRouter = require('./routes/mainPage');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client/public/views'));

// Parse cookies
app.use(cookieParser());
// parse form data
app.use(express.urlencoded({ extended: false }));
// parse JSON data
app.use(express.json());
// Routes
app.use('/', loginRouter, mainPageRouter);
// Serve the static files
app.use(express.static(path.join(__dirname, '../client/public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
