const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admin only.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status', error: error.message });
  }
};

// Get all users with their products
router.get('/users-with-products', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    const usersWithProducts = await Promise.all(users.map(async (user) => {
      const products = await Product.find({ userId: user._id });
      return {
        ...user.toObject(),
        products: products
      };
    }));
    res.json(usersWithProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users and products', error: error.message });
  }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get all products
router.get('/products', isAdmin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Add more admin-specific routes as needed

module.exports = router;