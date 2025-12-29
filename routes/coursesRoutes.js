const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const userController = require('../controllers/userController');
const auth = require('../middleware/userAuth');

// @route   GET /api/course/sessions
// @desc    Get all sessions (Calculates locked status based on user)
// @access  Private
router.get('/sessions', auth, courseController.getSessions);

// @route   POST /api/course/pay
// @desc    Unlock the full course (Mock Payment)
// @access  Private
router.post('/pay', auth, courseController.processPayment);

// @route   POST /api/course/reflection
// @desc    Submit a reflection for a specific session
// @access  Private
router.post('/reflection', auth, courseController.submitReflection);

// @route   PUT /api/course/sessions/:id/complete
// @desc    Mark a specific session as completed
// @access  Private
router.put('/sessions/:id/complete', auth, courseController.isSessionComplete);

// @route   POST /api/course/request-access
// @desc    Request temporary access to a locked session
// @access  Private
router.post('/request-access', auth, userController.requestSessionAccess);

module.exports = router;