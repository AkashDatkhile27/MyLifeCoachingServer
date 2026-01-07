
const Reflection = require('../models/Reflection');
/**
 * @route   GET /api/reflections
 * @desc    Get all reflections for the logged-in user
 * @access  Private
 */
exports.getUserReflections = async (req, res) => { 
  try {
    const reflections = await Reflection.find({ userId: req.user.id })
      .sort({ lastUpdated: -1 }); // Most recent first

    // Map to match frontend structure
    // Since schema 'content' and 'adminReply' are now arrays, we pass them directly.
    const formattedReflections = reflections.map(doc => ({
      sessionId: doc.sessionId,
      content: doc.content,     // Now an array of objects: [{ text, date }]
      date: doc.lastUpdated,
      status: doc.status,
      adminReply: doc.adminReply // Now an array of objects: [{ text, date }]
    }));

    res.json(formattedReflections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @route   POST /api/reflections
 * @desc    Create or Append to a reflection for a specific session
 * @access  Private
 */
exports.createOrUpdateReflection = async (req, res) => {
  const { sessionId, content } = req.body; // 'content' here is the new message string from the user

  if (!content || !sessionId) {
    return res.status(400).json({ msg: 'Session ID and Content are required' });
  }

  try {
    // Check if a reflection already exists for this user + session
    let reflection = await Reflection.findOne({ 
      userId: req.user.id, 
      sessionId: sessionId 
    });

    if (reflection) {
      // UPDATE: Append new thought to existing content array
      // We push a new message object instead of string concatenation
      reflection.content.push({
        text: content,
        date: Date.now()
      });
      
      reflection.status = 'pending'; // Reset status so admin sees it's updated
      reflection.lastUpdated = Date.now();
      
      await reflection.save();
      return res.json(reflection);
    } 

    // CREATE: New reflection entry
    // Initialize content as an array with the first message object
    reflection = new Reflection({
      userId: req.user.id,
      sessionId,
      content: [{ 
        text: content, 
        date: Date.now() 
      }],
      status: 'pending',
      lastUpdated: Date.now(),
      adminReply: [] // Initialize as empty array
    });

    await reflection.save();
    res.json(reflection);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @route   GET /api/admin/reflections
 * @desc    Get all reflections (for admin dashboard)
 * @access  Private/Admin
 */
exports.getAllreflection = async (req, res) => {
  try {
    // Find all reflections
    const reflections = await Reflection.find()
      // Populate user details
      .populate('userId', 'Name email profilePicture')
      // Populate session context
      .populate('sessionId', 'title dayNumber')
      // Sort by the most recently updated
      .sort({ lastUpdated: -1 });

    res.status(200).json(reflections);
  } catch (error) {
    console.error("Error in getAllreflection:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};