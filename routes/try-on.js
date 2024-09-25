const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/:tryOnLink', async (req, res) => {
  const { tryOnLink } = req.params;
  
  if (!tryOnLink) {
    return res.status(400).json({ error: 'Missing try-on link' });
  }

  try {
    const productData = await Product.findOne({ tryOnLink });
    
    if (!productData) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      name: productData.name,
      description: productData.description,
      color: productData.color,
      size: productData.size,
      fabric: productData.fabric,
      modelUrl: productData.modelUrl || '' // Ensure this field exists in your Product model
    });
  } catch (error) {
    console.error('Error processing try-on request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;