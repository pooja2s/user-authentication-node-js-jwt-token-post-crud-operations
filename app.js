const createError = require('http-errors');
const express = require('express');
require('dotenv/config');
const db = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');

// View
const path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

// Routers URL
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const authRouter = require('./routes/authRoutes');
const morgan = require('morgan');

const app = express();

app.use(cors());

app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use (morgan("dev"));
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));



// Router Setup
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/post', postRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
