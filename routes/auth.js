const express = require('express');

const { register, login, getMe } = require('../controllers/auth');

const User = require('../models/User');

// Initialize router
const router = express.Router();

//
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
