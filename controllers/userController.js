const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Token = require('../models/Token');
const dotenv = require('dotenv');
dotenv.config();

// Request Access to a Session ---
exports.requestSessionAccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize arrays if missing
    if (!user.accessRequests) user.accessRequests = [];

    // Check if there is already a PENDING request for this session
    const existingPending = user.accessRequests.find(
      r => r.sessionId.toString() === sessionId && r.status === 'pending'
    );

    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending request for this session.' });
    }

    // Check Usage Limit (Max 3 requests per session history)
    // We count how many times this session appears in the requests array regardless of status
    const requestCount = user.accessRequests.filter(r => r.sessionId.toString() === sessionId).length;

    if (requestCount >= 3) {
      return res.status(403).json({ message: 'Access request limit reached for this session.' });
    }

    // Add New Request
    user.accessRequests.push({
      sessionId,
      status: 'pending',
      requestedAt: new Date(),
      requestCount: requestCount + 1
    });

    await user.save();

    res.json({ 
      success: true, 
      message: 'Access request sent to Admin.',
      accessRequests: user.accessRequests
    });

  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};

// Get User Notifications ---
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    // Return most recent first
    const sorted = user.notifications ? user.notifications.sort((a,b) => b.createdAt - a.createdAt) : [];
    res.json(sorted);
  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};

// --- User Registration ---
exports.register = async (req, res) => {
  try {
    const { Name, email, phone, password } = req.body;

    if (!email || !password || !Name) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    user = new User({
      Name: Name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword, 
      hasPaid: true, 
      completedSessions: [],
      // Ensure these fields exist
      accessRequests: [],
      notifications: [] 
    });

    await user.save();

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.Name, 
            email: user.email, 
            phone: user.phone,
            hasPaid: user.hasPaid,
            profilePicture: user.profilePicture,
            completedSessions: user.completedSessions,
            accessRequests: user.accessRequests,
            notifications: user.notifications
          } 
        });
      }
    );
  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};

// --- User Login ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            role: user.role,
            id: user.id, 
            name: user.Name, 
            email: user.email, 
            phone: user.phone,
            hasPaid: user.hasPaid, 
            profilePicture: user.profilePicture,
            completedSessions: user.completedSessions,
            accessRequests: user.accessRequests || [],
            notifications: user.notifications || []
          } 
        });
      }
    );
  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};

// Update User Profile ---
exports.updateProfile = async (req, res) => {
  // Update user profile details
  try {
    const { Name, phone, profilePicture } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (Name) user.Name = Name.trim();
    if (phone) user.phone = phone.trim();
    //if profilePicture is provided (can not be empty string to remove)
    if (profilePicture === '') {
      user.profilePicture = '';
    } else if (profilePicture !== undefined) user.profilePicture = profilePicture;
    await user.save();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};

//reset password in logged in state
exports .resetPassword = async (req, res) => {
  try {
    const data = req.body;
    const newPassword=data.new;
    const cleanPassword = newPassword.trim();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });  
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(cleanPassword, salt);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  
  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};
// ---  

// Get User Details ---
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message || 'Server Error');
  }
};
// Forgot Password - Send Reset Link ---
exports.forgotPasswordLinkCreation = async (req, res) => {
  try {
    const { email } = req.body; 
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }
    let token = await Token.findOne({ userId: user._id });
    if (token) {
      await token.deleteOne();
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const newToken = new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 
    });
    await newToken.save();
    const resetLink = `${process.env.CLIENT_URL}/reset-password-with-link?token=${resetToken}&id=${user._id}`;
    const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please contact admin.`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: message,
    });
    res.json({ success: true, message: `Password reset link sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};



// Reset Password with Email Link ---
exports.resetPasswordWithEmailLink = async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;

    const passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(userId);
    const salt = await bcrypt.genSalt(10);
    const cleanPassword = newPassword.trim();
    user.password = await bcrypt.hash(cleanPassword, salt);
    await user.save();

    await Token.deleteOne({ _id: passwordResetToken._id });

    res.json({ success: true, message: 'Password reset successful' });

  } catch (err) {
    res.status(500).json(err.message || 'Server Error');
  }
};