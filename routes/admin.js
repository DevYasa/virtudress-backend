const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const isAdmin = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for 3D model upload
const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '3d-models');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.productId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadModel = multer({ storage: modelStorage });

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

// Update product with 3D model
router.put('/product/:productId/model', isAdmin, uploadModel.single('model'), async (req, res) => {
  try {
    console.log('Uploading 3D model for product:', req.params.productId);
    const product = await Product.findOne({ productId: req.params.productId });

    if (!product) {
      console.log('Product not found:', req.params.productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Update the modelUrl in the database with the relative path
    product.modelUrl = path.join('3d-models', req.file.filename);
    await product.save();

    console.log('3D model added successfully:', product);
    res.json({ 
      message: '3D model added successfully', 
      product: {
        ...product.toObject(),
        tryOnLink: `${process.env.FRONTEND_URL}/try-on/${product.productLink}`
      }
    });
  } catch (error) {
    console.error('Error adding 3D model:', error);
    res.status(500).json({ message: 'Error adding 3D model', error: error.message });
  }
});

module.exports = router;