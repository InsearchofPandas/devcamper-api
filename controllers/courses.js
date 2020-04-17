const Course = require('../models/Course');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// DESC   Get all of the Courses
// ROUTE  GET /api/v1/courses
// ROUTE  GET /api/v1/boutcamps/:bootcampId/courses
// ACCESS Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  let query;

  if (req.params.bootcampId) {
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    query = Course.find();
  }

  const courses = await query;
  res
    .status(200)
    .json({ success: true, count: courses.length, data: courses });
});
