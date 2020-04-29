const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// DESC   Get all of the Courses
// ROUTE  GET /api/v1/courses
// ROUTE  GET /api/v1/boutcamps/:bootcampId/courses
// ACCESS Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({
      bootcamp: req.params.bootcampId,
    });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// DESC   Get Single Course
// ROUTE  GET /api/v1/courses/:id
// ACCESS Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!course) {
    return next(
      new ErrorResponse(
        `No course with the id of ${req.params.id}`,
        404,
      ),
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// DESC   Add Single Course
// ROUTE  POST /api/v1/bootcamps/:bootcampId/courses
// ACCESS Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `No bootcamp with the id of ${req.params.bootcampId} Can not add course to non non existing bootcamp`,
      ),
      404,
    );
  }

  // Make sure user is bootcamp owner
  if (
    bootcamp.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a course listing to this bootcamp of id ${bootcamp._id} `,
        401,
      ),
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({ success: true, data: course });
});

// DESC   Update Single Course
// ROUTE  PUT /api/v1/courses/:id
// ACCESS Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(
        `No course with the id of ${req.params.id} Can not update.`,
      ),
      404,
    );
  }

  // Make sure user is bootcamp owner
  if (
    course.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to UPDATE the course listing  `,
        401,
      ),
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: course });
});

// DESC   Delete Single Course
// ROUTE  DELETE /api/v1/courses/:id
// ACCESS Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(
        `No course with the id of ${req.params.id}. Can not delete.`,
      ),
      404,
    );
  }

  // Make sure user is bootcamp owner
  if (
    course.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to DELETE the course listing  `,
        401,
      ),
    );
  }

  await course.remove();

  res.status(200).json({ success: true, data: {} });
});
