const mongoose = require('mongoose');
const shortid = require('shortid');

const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: shortid.generate,
    unique: true
  },
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
  color: { 
    type: String, 
    required: true 
  },
  fabricType: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  modelUrl: {
    type: String,
    default: null
  },
  productLink: {
    type: String,
    default: null
  },
  tryOns: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

ProductSchema.virtual('conversionRate').get(function() {
  return this.tryOns > 0 ? (this.conversions / this.tryOns * 100).toFixed(2) : 0;
});

module.exports = mongoose.model('Product', ProductSchema);