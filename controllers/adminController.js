const User = require('../models/User');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const seedSuperAdmin = require('../utils/seedSuperAdmin'); // Import the seeder

// --- ADMIN LOGIN ---
// Route: POST /api/admin/login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // --- LAZY SEED CHECK ---
    // If the email matches the ENV Super Admin, ensure they exist in DB before proceeding.
    // This calls the robust seed script.
    if (process.env.SUPER_ADMIN_EMAIL && normalizedEmail === process.env.SUPER_ADMIN_EMAIL.toLowerCase()) {
        await seedSuperAdmin();
    }

    // 1. Check if user exists in Database
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // 2. CRITICAL: Check if user is an Admin or Super Admin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access Denied: You are not an administrator.' });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // 4. Return JWT
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.Name, 
                email: user.email, 
                role: user.role 
            } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- MANAGE ACCESS (Updated for 5min Window + Notifications) ---
// @route   PUT /api/admin/users/:userId/sessions/:sessionId/grant
exports.grantSessionExtension = async (req, res) => {
  const { userId, sessionId } = req.params;
  const { grant } = req.body; // true = grant 24h, false = revoke

  try {
    const user = await User.findById(userId);
    const session = await Session.findById(sessionId); 
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Handle Special Access (The Permission)
    if (!user.specialAccess) user.specialAccess = [];
    const accessIndex = user.specialAccess.findIndex(sa => sa.sessionId.toString() === sessionId);

    if (grant) {
        // Grant 2 hour Access from NOW
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        if (accessIndex > -1) {
            user.specialAccess[accessIndex].expiresAt = expiresAt;
        } else {
            user.specialAccess.push({ sessionId, expiresAt });
        }
    } else {
        // Revoke Access
        if (accessIndex > -1) {
            user.specialAccess.splice(accessIndex, 1);
        }
    }

    // 2. Handle Request Status & Notifications
    if (!user.accessRequests) user.accessRequests = [];
    if (!user.notifications) user.notifications = [];

    // Find any pending requests for this session
    const requestIndex = user.accessRequests.findIndex(
      r => r.sessionId.toString() === sessionId && r.status === 'pending'
    );

    if (requestIndex > -1) {
      // Update status based on grant/revoke
      user.accessRequests[requestIndex].status = grant ? 'approved' : 'rejected';
      user.accessRequests[requestIndex].resolvedAt = new Date();
    }

    // Add Notification
    const sessionTitle = session ? session.title : 'Session';
    const notificationMessage = grant 
      ? `Your request for "${sessionTitle}" has been approved. You have access for 2 hours.` 
      : `Your access to "${sessionTitle}" has been revoked or denied.`;

    user.notifications.push({
      message: notificationMessage,
      type: grant ? 'success' : 'error',
      read: false,
      createdAt: new Date()
    });

    await user.save();
    
    // Return updated user data so frontend can refresh UI immediately
    res.json({ 
      message: grant ? '2-hour access granted' : 'Access revoked', 
      completedSessions: user.completedSessions,
      specialAccess: user.specialAccess,
      accessRequests: user.accessRequests 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- USER MANAGEMENT ---

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   POST /api/admin/create-admin
// @desc    Create a new Admin user (Super Admin only)
exports.createAdmin = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const requestor = await User.findById(req.user.id);
    // Strict Check: Only Super Admin
    if (!requestor || requestor.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access Denied: Only Super Admin can create new Admins.' });
    }

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      Name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role: 'admin', 
      hasPaid: true, 
      completedSessions: []
    });

    await user.save();

    res.status(201).json({ 
      message: 'New Admin created successfully',
      user: {
        id: user.id,
        name: user.Name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body; 
  try {
    const requestor = await User.findById(req.user.id);
    if (!requestor || requestor.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access Denied: Only Super Admin can manage roles.' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    if (process.env.SUPER_ADMIN_EMAIL && userToUpdate.email === process.env.SUPER_ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Cannot change role of Super Admin' });
    }

    userToUpdate.role = role;
    await userToUpdate.save();
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const requestor = await User.findById(req.user.id);
    if (!requestor) return res.status(401).json({ message: 'Unauthorized' });

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });

    // Hierarchy Check
    if (requestor.role !== 'superadmin') {
      if (userToDelete.role === 'superadmin' || userToDelete.role === 'admin') {
        return res.status(403).json({ message: 'Access Denied: Admins cannot delete other Administrators.' });
      }
    }

    // Protect Super Admin from deletion
    if (process.env.SUPER_ADMIN_EMAIL && userToDelete.email === process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Cannot delete Super Admin' });
    }

    await userToDelete.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- SESSION MANAGEMENT ---

exports.createSession = async (req, res) => {
  const { dayNumber, title, type, mediaUrl, contextPoints } = req.body;
  try {
    let session = await Session.findOne({ dayNumber});
    if (session) return res.status(400).json({ message: 'Day Number already exists' });
    else if(session = await Session.findOne({ title})) return res.status(400).json({ message: 'Session with same title already exists' });
    session = new Session({ dayNumber, title, type, mediaUrl, contextPoints });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateSession = async (req, res) => {
  const { title, type, mediaUrl, contextPoints, dayNumber } = req.body;
  try {
    let session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (title) session.title = title;
    if (type) session.type = type;
    if (mediaUrl) session.mediaUrl = mediaUrl;
    if (contextPoints) session.contextPoints = contextPoints;
    if (dayNumber) session.dayNumber = dayNumber;

    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    await session.deleteOne();
    res.json({ message: 'Session removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};