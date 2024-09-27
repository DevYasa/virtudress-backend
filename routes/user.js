const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to check if user is authenticated and has dashboard access
const isAuthenticatedWithAccess = async (req, res, next) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user && user.dashboardAccess) {
      req.user = user;
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
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

router.get('/stats', isAuthenticatedWithAccess, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ userId: req.user._id });
    
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

router.post('/product', isAuthenticatedWithAccess, upload.array('images', 5), async (req, res) => {
  try {
    console.log('Received product data:', req.body);
    console.log('Received files:', req.files);

    const { name, description, color, fabricType } = req.body;
    const images = req.files.map(file => file.path);

    if (!name || !description || !color || !fabricType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = new Product({
      userId: req.user._id,
      name,
      description,
      color,
      fabricType,
      images
    });

    console.log('Product object before save:', product);

    const savedProduct = await product.save();
    console.log('Product saved successfully:', savedProduct);

    res.status(201).json({ message: 'Product saved successfully', product: savedProduct });
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ 
      message: 'Error saving product', 
      error: error.message,
      stack: error.stack
    });
  }
});

router.get('/products', isAuthenticatedWithAccess, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Update product with 3D model URL
router.put('/product/:productId/model', isAuthenticatedWithAccess, async (req, res) => {
  try {
    const { modelFileName } = req.body;
    const product = await Product.findOne({ productId: req.params.productId, userId: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the file exists in the 3d-models directory
    const modelPath = path.join(__dirname, '..', '3d-models', modelFileName);
    if (!fs.existsSync(modelPath)) {
      return res.status(400).json({ message: '3D model file not found in the directory' });
    }

    // Update the modelUrl in the database
    product.modelUrl = modelFileName;
    await product.save();

    res.json({ message: '3D model URL updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating 3D model URL', error: error.message });
  }
});

// Get 3D model for a product
router.get('/product/:productId/model', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });

    if (!product || !product.modelUrl) {
      return res.status(404).json({ message: '3D model not found' });
    }

    const modelPath = path.join(__dirname, '..', '3d-models', product.modelUrl);
    res.sendFile(modelPath);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching 3D model', error: error.message });
  }
});

module.exports = router;