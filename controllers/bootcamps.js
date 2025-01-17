const path = require('path');
const dotenv = require('dotenv');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// DESC   Get all of the bootcamps
// ROUTE  GET /api/v1/bootcamps
// ACCESS Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Add Mongo operators to query string
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`,
  );

  //  finding resource and parseing code
  query = Bootcamp.find(JSON.parse(queryStr)).populate('courses');

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const bootcamps = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // Response
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination,
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
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if has already published a bootcamp

  const publishedBootcamp = await Bootcamp.findOne({
    user: req.user.id,
  });
  if (publishedBootcamp && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a bootcamp`,
        400,
      ),
    );
  }

  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ success: true, data: bootcamp });
});

// DESC   Update bootcamp
// ROUTE  PUT /api/v1/bootcamps/id
// ACCESS Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.id}`,
        404,
      ),
    );
  }

  // Make sure user is bootcamp owner
  if (
    bootcamp.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to UPDATE this bootcamp`,
        401,
      ),
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({ success: true, data: bootcamp });
});

// DESC   Delete bootcamp
// ROUTE  DELETE /api/v1/bootcamps/id
// ACCESS Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.id}`,
        404,
      ),
    );
  }

  // Make sure user is bootcamp owner
  if (
    bootcamp.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to DELETE this bootcamp`,
        401,
      ),
    );
  }

  bootcamp.remove();

  res.status(200).json({ success: true, data: {} });
});

// DESC   Get bootcamp within a radius
// ROUTE  GET /api/v1/bootcamps/radius/:zipcode/:distance
// ACCESS Private
exports.getBootcampsInRadius = asyncHandler(
  async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // Get lat/lng from geocoder
    const location = await geocoder.geocode(zipcode);
    const loc = location[0];
    const lat = loc.latitude;
    const lng = loc.longitude;

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km

    const radius = distance / 3963.2;

    const bootcamps = await Bootcamp.find({
      location: {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    });

    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps,
    });
  },
);

// DESC   Upload Image for bootcamp
// ROUTE  PUT /api/v1/bootcamps/id/photo
// ACCESS Private

exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.id}`,
        404,
      ),
    );
  }

  // Make sure user is bootcamp owner
  if (
    bootcamp.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to UPDATE this bootcamp`,
        401,
      ),
    );
  }

  if (!req.files) {
    return next(
      new ErrorResponse(`Please upload an image file`, 400),
    );
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(
      new ErrorResponse(`Please upload an image file`, 400),
    );
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than 1.25 mb`,
        400,
      ),
    );
  }

  // Create custom file name
  file.name = `${path.parse(file.name).name}_photo_${bootcamp._id}${
    path.parse(file.name).ext
  }`;

  file.mv(
    `${process.env.FILE_UPLOAD_PATH}/${file.name}`,
    async (err) => {
      if (err) {
        console.error(err);
        next(
          new ErrorResponse(
            `Trouble uploading the image ${process.env.MAX_FILE_UPLOAD}`,
            500,
          ),
        );
      }

      await Bootcamp.findByIdAndUpdate(req.params.id, {
        photo: file.name,
      });

      res.status(200).json({
        success: true,
        data: file.name,
      });
    },
  );
});
