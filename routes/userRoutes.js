const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/userAuth');
const reflectionsController=require('../controllers/reflectionsController')


// Auth & Profile
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPasswordLinkCreation);
router.post('/reset-password', auth,userController.resetPassword);
router.post('/reset-password-with-link', userController.resetPasswordWithEmailLink);
router.get('/user', auth, userController.getUser);
router.put('/update-profile', auth, userController.updateProfile);

// Notifications ---
router.get('/notifications', auth, userController.getNotifications);

// Reflection Routes
router.get('/fetch-reflections', auth, reflectionsController.getUserReflections);
// Create or Append to a reflection for a specific session
router.post('/create-reflections', auth, reflectionsController.createOrUpdateReflection);

module.exports = router;