const { promisify } = require('node:util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/users-model');
const asyncWrapper = require('../middleware/asyncWrapper');
const httpStatusText = require('../utils/httpStatusText');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: httpStatusText.SUCCESS,
    token,
    data: {
      user,
    },
  });
};
exports.signup = asyncWrapper(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
  });
  const token = generateToken(newUser._id);
  // to sign up and login
  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, token, data: { user: newUser } });
});
exports.login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  // 1)check if email and password exist
  if (!email) {
    return next(new AppError('Please provide email!', 400));
  }
  if (!password) {
    return next(new AppError('Please provide password', 400));
  }
  // 2)check if user exist and passwrod exist
  // we put + before password cause in model we set select false
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3)if everythings is ok send token

  createSendToken(user, 200, res);
});
exports.protect = asyncWrapper(async (req, res, next) => {
  //1) Get token and check if it's exist

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError(
        "You aren't logged in ! please logged in to get access",
        401,
      ),
    );
  }
  //2)validate token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3)check user still exist
  const freshUser = await User.findById(decode.id);
  if (!freshUser) {
    return next(new AppError("User doesn't exist", 401));
  }
  // 4)check if user change password after jwt was issue
  const changePassword = freshUser.changePasswordAfter(decode.iat);
  if (changePassword) {
    return next(
      new AppError('Password has change recently! please loged in again.', 401),
    );
  }
  // Gonna acess to protected
  req.user = freshUser;
  next();
});
exports.restricTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'Access denied: You do not have permission to perform this action',
          403,
        ),
      );
    }
    next();
  };
};
// forget password
exports.forgotPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(new AppError('Email not found', 404));
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    console.log(email, 'kjkjkjkjkj');
    await sendEmail({
      email: email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});
// reset password
exports.resetPassword = asyncWrapper(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  const hasToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hasToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = password;
  user.confirmPassword = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});
exports.updatePassword = asyncWrapper(async (req, res, next) => {
  const { confirmPassword, password, passwordCurrent } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  console.log(confirmPassword, 'confirmPassword');
  user.password = password;
  user.confirmPassword = confirmPassword;
  await user.save();

  createSendToken(user, 200, res);
});
