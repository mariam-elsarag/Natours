const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const usersScema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is require'],
    maxLength: [50, 'Name must be less than or equal 50'],
  },
  email: {
    type: String,
    require: [true, 'Email is require'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    require: [true, 'Password is required'],
    minLength: [8, 'Password must have at least 8 character'],
    select: false,
  },
  confirmPassword: {
    type: String,
    require: [true, 'Confirm password is required'],
    validate: {
      // this only work with CREATE AND SAVE in update we should use save not findONeAndUpdate
      validator: function (value) {
        return value === this.password;
      },
      message: 'Confirm password must equal password',
    },
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// for encrypt password
usersScema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.confirmPassword = undefined;
  next();
});

usersScema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});
usersScema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// instent method
// to check password is correct
usersScema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
usersScema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangeAt) {
    //convert passwordchange at to time stamp
    const changeTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );

    return JWTTimeStamp < changeTimeStamp;
  }
  // False mean no change
  return false;
};
usersScema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken });

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = mongoose.model('user', usersScema, 'users');

module.exports = User;
