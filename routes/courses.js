const express = require('express');
const { getCourses } = require('../controllers/courses');

// Initialize router
const router = express.Router({ mergeParams: true });

router.route('/').get(getCourses);

module.exports = router;
