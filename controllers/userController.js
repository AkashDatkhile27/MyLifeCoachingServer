const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Token = require('../models/Token');
const dotenv = require('dotenv');
const Otp = require('../models/OtpSchema');
dotenv.config();
const sendInvoiceAndNotification = require('./sendInvoiceAndNotification');


// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- Create Razorpay Order  for payment of 30000---
// Frontend calls this first when user clicks "Pay & Register"
exports.createPaymentOrder = async (req, res) => {
  try {
    const options = {
      amount: 25000 * 100, // 30,000 INR in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).send(error.message || 'Error creating payment order');
  }
};


// --- 1. Create Payment Order for ₹199 Session ---
exports.createSessionPaymentOrder = async (req, res) => {
  try {
    const options = {
      amount: 199 * 100, // 199 INR in paise
      currency: "INR",
      receipt: "receipt_session_" + Date.now(),
      payment_capture: 1 // Auto capture
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Razorpay Session Order Error:", error);
    res.status(500).json({ message: error.message || 'Error creating session payment order' });
  }
};

// --- 2. Notify Admin of New Booking ---
exports.notifyAdminBooking = async (req, res) => {
  try {
    const { name, email, phone, paymentId, orderId, amount = 199, date } = req.body;

    // Determine description
    let description = "Introduction Session (Demo Call)";
    if (amount == 30000) description = "15-Day Transformation Course";

    // Reuse the helper function to generate PDF and send emails
    await sendInvoiceAndNotification({
        name, 
        email, 
        phone, 
        paymentId, 
        orderId, 
        amount, 
        description
    });

    res.status(200).json({ success: true, message: 'Emails sent successfully.' });
  } catch (error) {
    console.error("Booking Notification Error:", error);
    res.status(500).json({ message: 'Error processing notification' });
  }
};




// --- User Registration ---
exports.register = async (req, res) => {
   try {
    const { Name, email, phone, password, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!email || !password || !Name) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // 1. Payment Verification
    // Ensure payment details are present
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed: Missing payment details.' });
    }

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature. Registration failed.' });
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
      hasPaid: true, // Confirmed by signature verification above
      paymentInfo: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amountPaid: 30000,
        paymentDate: Date.now()
      },
      completedSessions: [],
      accessRequests: [],
      notifications: [] 
    });

    await user.save();
    // --- SEND WELCOME EMAIL WITH INVOICE ---
    try {
        await sendInvoiceAndNotification({
            name: Name,
            email: normalizedEmail,
            phone,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: 30000,
            description: "15-Day Transformation Course"
        });
    } catch (emailError) {
        console.error("Failed to send registration email:", emailError);
    }

    // Token Generation
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
    console.error("Registration Error:", err);
    res.status(500).send(err.message || 'Server Error');
  }
};

// --- User Login ---

// --- UPDATED LOGIN: STEP 1 (Credentials -> OTP) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // --- Generate OTP ---
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    
    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    // Save to separate Otp collection
    // First, clear any existing OTPs for this user to ensure only one valid OTP exists
    await Otp.deleteMany({ userId: user._id });

    // Create new OTP document (Auto-deletes after 10 mins via schema)
    await Otp.create({
      userId: user._id,
      otp: hashedOtp,
      createdAt: Date.now() 
    });

    // --- Send Email ---
    const message = `Your login OTP for MyLifeCoaching is: ${otpCode}\n\nThis code expires in 10 minutes.`;
    try {
        await sendEmail({
            email: user.email,
            subject: 'Login OTP - MyLifeCoaching',
            message: message
        });
    } catch (err) {
        console.error("OTP Email Failed:", err);
        return res.status(500).json({ message: 'Email could not be sent' });
    }

    // --- Generate Temp Token ---
    const tempToken = jwt.sign(
        { id: user.id, role: 'temp_otp_auth' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '10m' }
    );

    res.json({ 
        requiresOtp: true, 
        tempToken, 
        message: 'OTP sent to your email' 
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send(err.message || 'Server Error');
  }
};


// --- UPDATED LOGIN: STEP 2 (Verify OTP -> Final Token) ---
exports.verifyLoginOtp = async (req, res) => {
    try {
        const { token, otp } = req.body;

        if (!token || !otp) {
            return res.status(400).json({ message: 'Token and OTP are required' });
        }

        // Verify Temp Token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }

        // Find user to ensure they exist
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find OTP record in the separate collection
        const otpRecord = await Otp.findOne({ userId: user._id });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid. Please login again.' });
        }

        // Verify OTP hash
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // --- Success: Delete used OTP & Issue Real Token ---
        await Otp.deleteOne({ _id: otpRecord._id });

        const authToken = jwt.sign(
            { user: { id: user.id } },
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
        console.error("OTP Verification Error:", err);
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



//----session----- 

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
