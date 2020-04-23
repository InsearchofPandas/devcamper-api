const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

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
  sentTokenResponse(user, 200, res);
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
  sentTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sentTokenResponse = (user, statusCode, res) => {
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
