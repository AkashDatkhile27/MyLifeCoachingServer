const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/userAuth'); // Check valid token
const admin = require('../middleware/adminAuth'); // Check role = admin/superadmin
const reflectionController=require('../controllers/reflectionsController')

// --- PUBLIC ROUTES ---
router.post('/login', adminController.adminLogin);

// --- PROTECTED ROUTES ---

// User Management
router.get('/users', auth, admin, adminController.getAllUsers);
router.put('/update-users-role/:id/role', auth, admin, adminController.updateUserRole);
router.delete('/delete-users/:id', auth, admin, adminController.deleteUser);
router.post('/create-admin', auth, admin, adminController.createAdmin);

// Session Management
router.post('/post-new-sessions', auth, admin, adminController.createSession);
router.put('/update-sessions/:id', auth, admin, adminController.updateSession);
router.delete('/delete-sessions/:id', auth, admin, adminController.deleteSession);

// --- NEW: Manage Access (Grant/Revoke 24h Window) ---
router.put('/users/:userId/sessions/:sessionId/grant', auth, admin, adminController.grantSessionExtension);

// Reflection routes
//reply to user reflections
router.post ('/reflections/reply',auth,admin,adminController.replyToReflection);
router.get('/fetch-reflections', auth,admin, reflectionController.getAllreflection);


module.exports = router;