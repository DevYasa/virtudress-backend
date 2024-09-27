const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/:productLink', async (req, res) => {
  try {
    const product = await Product.findOne({ productLink: req.params.productLink });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

module.exports = router;