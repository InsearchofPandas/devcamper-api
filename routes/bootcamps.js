const express = require('express');

const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps');

// Include other resource routers
const courseRouter = require('./courses');

// Initialize router
const router = express.Router();

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter);

// routes
router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router.route('/').get(getBootcamps).post(createBootcamp);

router.route('/:id/photo').put(bootcampPhotoUpload);

router
  .route('/:id')
  .get(getBootcamp)
  .put(updateBootcamp)
  .delete(deleteBootcamp);

router.route;

module.exports = router;
