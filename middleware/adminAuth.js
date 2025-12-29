const User = require('../models/User');

module.exports = async function(req, res, next) {
  // 1. Verify User is authenticated (auth middleware runs before this)
  if (!req.user) {
    return res.status(401).json({ message: 'Authorization denied' });
  }

  try {
    // 2. Fetch full user to check role
    const user = await User.findById(req.user.id);
    
    // 3. Check if Admin or Super Admin
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};