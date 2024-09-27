const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const isAdmin = require('../middleware/adminMiddleware');

// Get all users with their products
router.get('/users-with-products', isAdmin, async (req, res, next) => {
  try {
    console.log('Accessing /users-with-products route');
    console.log('Request query:', req.query);
    console.log('Request user:', req.user);
    
    const users = await User.find({}, '-password').lean();
    const usersWithProducts = await Promise.all(users.map(async (user) => {
      const products = await Product.find({ userId: user._id }).lean();
      return {
        ...user,
        products: products
      };
    }));
    res.json(usersWithProducts);
  } catch (error) {
    console.error('Error in /users-with-products:', error);
    next(error);
  }
});

// Get overall stats
router.get('/stats', isAdmin, async (req, res, next) => {
  try {
    console.log('Accessing /stats route');
    console.log('Request query:', req.query);
    console.log('Request user:', req.user);
    
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalTryOns = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$tryOns" } } }
    ]);
    
    res.json({
      totalUsers,
      totalProducts,
      totalTryOns: totalTryOns[0]?.total || 0
    });
  } catch (error) {
    console.error('Error in /stats:', error);
    next(error);
  }
});

module.exports = router;