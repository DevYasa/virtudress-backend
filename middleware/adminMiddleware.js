const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  console.log('isAdmin middleware called');
  try {
    console.log('Session:', req.session);
    if (!req.session.userId) {
      console.log('No user session found');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('Fetching user with ID:', req.session.userId);
    const user = await User.findById(req.session.userId);
    console.log('User found:', user);
    
    if (user && user.isAdmin) {
      console.log('User is admin, proceeding to next middleware');
      next();
    } else {
      console.log('User is not admin, sending 403');
      res.status(403).json({ message: 'Access denied. Admin only.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ message: 'Error checking admin status', error: error.message });
  }
};

module.exports = isAdmin;