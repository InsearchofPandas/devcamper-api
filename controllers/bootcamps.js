const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// DESC   Get all of the bootcamps
// ROUTE  GET /api/v1/bootcamps
// ACCESS Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  const bootcamps = await Bootcamp.find();
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

// DESC   Get single bootcamp
// ROUTE  GET /api/v1/bootcamps/:id
// ACCESS Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.id}`,
        404,
      ),
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// DESC   Create new bootcamp
// ROUTE  POST /api/v1/bootcamps
// ACCESS Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ success: true, data: bootcamp });
});

// DESC   Update bootcamp
// ROUTE  PUT /api/v1/bootcamps/id
// ACCESS Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.id}`,
        404,
      ),
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// DESC   Delete bootcamp
// ROUTE  DELETE /api/v1/bootcamps/id
// ACCESS Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndRemove(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.id}`,
        404,
      ),
    );
  }

  res.status(200).json({ success: true, data: {} });
});
