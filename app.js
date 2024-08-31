const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const httpStatusText = require('./utils/httpStatusText');
const globalErrorHandler = require('./controller/errorController');

const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// This will make form data available in req.body
// for reading static file
app.use(express.static(`${__dirname}/public`));
const tourRouter = require('./routes/tour-routes');
const userRouter = require('./routes/users-routes');

app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter);

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
