const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  size: { 
    type: String, 
    required: true 
  },
  color: { 
    type: String, 
    required: true 
  },
  fabric: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);