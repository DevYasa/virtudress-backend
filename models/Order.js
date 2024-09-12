const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  planId: { 
    type: String,
    required: true 
  },
  amount: { 
    type: Number,
    required: true 
  },
  status: { 
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  additionalData: {
    type: Object
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);