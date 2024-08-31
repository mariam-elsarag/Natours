const AppError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}:${error.value}`;
  console.log(message, 'k');
  return new AppError(message, 400);
};
const sendErrorToDev = (error, res) => {
  res.status(error.statusCode || 500).json({
    status: error.status || httpStatusText.ERROR,
    data: null,
    message: error.message,
    stack: error.stack,
    error: error,
  });
};
const sendErroToProducation = (error, res) => {
  //Operational,trusted error:send message to client

  if (error.isOperational) {
    res.status(error.statusCode || 500).json({
      status: error.status || httpStatusText.ERROR,
      message: error.message,
    });
    //programming or other unkown error: don't leak error details
  } else {
    // console.log('Error', error);
    res
      .status(500)
      .json({ status: httpStatusText.ERROR, message: 'Something went wrong!' });
  }
};
// duplicate error
const handleDuplicateFieldDb = (error) => {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(message, 400);
};
//validation error
const handleValidationErrorDB = (error) => {
  // for looping over object we use Object.values(object)
  const errors = Object.values(error.errors).map((element) => element.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
// JWT error
const handleJWTError = () => new AppError('Invalid token', 401);
// expired token
const handleJWTExpireError = () => new AppError('Token expired', 401);

module.exports = (error, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendErrorToDev(error, res);
  } else if (process.env.NODE_ENV === 'production') {
    let err;

    console.log(error.name, 'name');
    if (error.name === 'CastError') {
      err = handleCastErrorDB(error);
    } else if (error.code === 11000) {
      err = handleDuplicateFieldDb(error);
    } else if (error.name === 'ValidatorError') {
      err = handleValidationErrorDB(error);
    } else if (error.name === 'JsonWebTokenError') {
      err = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      err = handleJWTExpireError();
    } else {
      err = new AppError(error.message || 'Internal Server Error', 500);
    }
    sendErroToProducation(err, res);
  }

  next();
};
