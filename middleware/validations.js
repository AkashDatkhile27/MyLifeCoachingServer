// VALIDATION HELPERS
const validateCommonFields = (req, res) => {
  const { Name, email, phone } = req.body;

  // 1. Name Validation (Letters and spaces only)
  const nameRegex = /^[a-zA-Z\s]+$/;
  if(!Name)
  {
    return "Please provide a valid name.";
  }
   else if (!nameRegex.test(Name.trim())) {
    return "Name must contain only letters and spaces.";
  }
  
  // 2. Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return "Please provide a valid email address.";
  }

  // 3. Phone Validation (10-15 digits, optional +)
  const phoneRegex = /^\+?[0-9]{10,15}$/;
 if (!phone) {
    return "Please provide a valid phone number.";
  }
  else if (!phoneRegex.test(phone.trim())) {
    return "Phone number must contain only digits (10-15), optionally starting with +.";
  }

  return null; // No error
};

// 1. REGISTRATION & COURSE PAYMENT VALIDATION
exports.validateRegistration = (req, res, next) => {
  // Check common fields
  const error = validateCommonFields(req, res);
  if (error) return res.status(400).json({ message: error });

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      message: "Password is required"
    });
  }

  // Length check
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long"
    });
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({
      message: "Password must contain at least one uppercase letter"
    });
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({
      message: "Password must contain at least one lowercase letter"
    });
  }

  // Number check
  if (!/\d/.test(password)) {
    return res.status(400).json({
      message: "Password must contain at least one number"
    });
  }

  // Special character check
  if (!/[@$!%*?&]/.test(password)) {
    return res.status(400).json({
      message: "Password must contain at least one special character (@$!%*?&)"
    });
  }

  next();
};

// 2. BOOKING / SESSION PAYMENT VALIDATION (No Password)
exports.validateBooking = (req, res, next) => {
    // Use the request body keys that match your frontend BookingModal (e.g., name vs Name)
    // Adjusting to handle both 'Name' and 'name' for compatibility
    const body = req.body;
    const standardizedBody = {
        Name: body.Name || body.name,
        email: body.email,
        phone: body.phone
    };
    
    // Temporarily replace req.body for the helper check
    const originalBody = req.body;
    req.body = standardizedBody;
    
    const error = validateCommonFields(req, res);
    
    // Restore body
    req.body = originalBody;

    if (error) return res.status(400).json({ message: error });
    
    next();
};

// 3. LOGIN VALIDATION
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (!password || password.trim() === '') {
    return res.status(400).json({ message: 'Password is required.' });
  }

  next();
};