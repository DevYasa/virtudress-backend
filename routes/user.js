const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const productCount = await Product.countDocuments({ userId: req.session.userId });
    
    // You would typically aggregate try-ons and conversion rate from your database
    // For now, we'll return some dummy data for these
    const stats = {
      totalProducts: productCount,
      totalTryOns: 150,
      conversionRate: 3.5
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats', error: error.message });
  }
});

router.post('/product', isAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, size, color, fabric } = req.body;
    const images = req.files.map(file => file.path);

    const product = new Product({
      userId: req.session.userId,
      name,
      description,
      size,
      color,
      fabric,
      images
    });

    await product.save();
    res.status(201).json({ message: 'Product saved successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error saving product', error: error.message });
  }
});

router.get('/products', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.session.userId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

module.exports = router;