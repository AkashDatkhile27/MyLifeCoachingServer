const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/userAuth');
const reflectionsController = require('../controllers/reflectionsController');
// Import validation middleware
const { validateRegistration, validateLogin, validateBooking } = require('../middleware/validations');


// --- Pre-Registration Verification ---
router.post('/send-verification-otp', userController.sendRegistrationOtp);
router.post('/verify-registration-otp', userController.verifyRegistrationOtp);

// --- Payment Order Routes (Now Verified!) ---
// NOTE: Frontend MUST send form data (Name, email, phone, etc.) to these endpoints now.
// If valid, it proceeds to userController.createPaymentOrder. If not, it errors 400.

// 1. For Course Registration (Needs Name, Email, Phone, Password)
router.post('/create-order', validateRegistration, userController.createPaymentOrder);

// 2. For Session Booking (Needs Name, Email, Phone)
router.post('/create-session-order', validateBooking, userController.createSessionPaymentOrder);

// --- Auth Routes ---
router.post('/register', validateRegistration, userController.register);
router.post('/login', validateLogin, userController.login);

router.post('/verify-otp', userController.verifyLoginOtp);
router.post('/forgot-password', userController.forgotPasswordLinkCreation);
router.post('/reset-password', auth, userController.resetPassword);
router.post('/reset-password-with-link', userController.resetPasswordWithEmailLink);

router.get('/user', auth, userController.getUser);
router.put('/update-profile', auth, userController.updateProfile);

// --- Notification & Admin Routes ---
router.get('/notifications', auth, userController.getNotifications);
router.post('/notify-admin-booking', userController.notifyAdminBooking);

// --- Reflection Routes ---
router.get('/fetch-reflections', auth, reflectionsController.getUserReflections);
router.post('/create-reflections', auth, reflectionsController.createOrUpdateReflection);

module.exports = router;