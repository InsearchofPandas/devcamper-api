const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');

// DESC   Register user
// ROUTE  POST /api/v1/auth/register
// ACCESS Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // call function to send password cookie and response call
  sendTokenResponse(user, 200, res);
});

// DESC   Login user
// ROUTE  POST /api/v1/auth/register
// ACCESS Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email) {
    return next(new ErrorResponse('Please provide an email', 400));
  }

  if (!password) {
    return next(new ErrorResponse('Please provide an password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(
      new ErrorResponse(
        'Incorrect user or password please use valid credentials or register',
        401,
      ),
    );
  }

  // Check if password matches

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(
      new ErrorResponse(
        'Incorrect user or password please use valid credentials or register',
        401,
      ),
    );
  }

  // call function to send password cookie and response call
  sendTokenResponse(user, 200, res);
});

// DESC   Get current logged in user
// ROUTE  GET /api/v1/auth/me
// ACCESS  Private

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// DESC   Log user out / clear cookies
// ROUTE  GET /api/v1/auth/logout
// ACCESS  Private

exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 10000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// DESC   Forgot password
// ROUTE  POST /api/v1/auth/forgotpassword
// ACCESS  Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(
        'There is no user associated with that email',
        404,
      ),
    );
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// DESC   Reset password
// ROUTE  PUT /api/v1/auth/resetpassword/:resettoken
// ACCESS  Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// DESC      Update user details
// ROUTE     PUT /api/v1/auth/updatedetails
// ACCESS    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    success: true,
    data: user,
  });
});

// DESC     Update password
// ROUTE     PUT /api/v1/auth/updatepassword
// ACCESS    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// helper function
// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};
