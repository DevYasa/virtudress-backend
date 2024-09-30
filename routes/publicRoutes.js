const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/product/:productId', async (req, res) => {
  console.log('Received request for productId:', req.params.productId);
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    console.log('Found product:', product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

module.exports = router;