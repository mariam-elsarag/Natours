const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const xss = require('xss-clean');
const sanitize = require('express-mongo-sanitize');
const limitRate = require('express-rate-limit');
const helmet = require('helmet');

const httpStatusText = require('./utils/httpStatusText');
const globalErrorHandler = require('./controller/errorController');

const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// set security HTTP headers
app.use(helmet());
// senitize nosql injection
app.use(sanitize());
//xss
app.use(xss());
// limit request from same api
const limiter = limitRate({
  max: 300,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!',
});
app.use('/api', limiter);
// This will make form data available in req.body
// for reading static file
app.use(express.static(`${__dirname}/public`));
const tourRouter = require('./routes/tour-routes');
const userRouter = require('./routes/users-routes');
const reviewRouter = require('./routes/review-routes');

app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter);
app.use('/api/review', reviewRouter);

// handle error for route=>if person write route wrong
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: httpStatusText.FAIL,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
  next();
});

// error handle middleware
app.use(globalErrorHandler);
module.exports = app;
