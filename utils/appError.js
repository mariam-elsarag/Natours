const httpStatusText = require('./httpStatusText');

class AppError extends Error {
  constructor(message, statusCode) {
    // we add only message cause error only accept message it used be like this new Error(message)
    // we use super cause i wanna call error
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4')
      ? httpStatusText.FAIL
      : httpStatusText.ERROR;
    this.isOperational = true;
    // to show line which have proplem
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
