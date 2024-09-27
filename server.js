require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const redis = require('redis');
const expressRedisCache = require('express-redis-cache');
const crypto = require('crypto');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

// Import models
const Order = require('./models/Order');
const User = require('./models/User');

const app = express();

// Redis client setup
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Redis cache setup
const cache = expressRedisCache({
  client: redisClient,
  expire: 60 * 15 // Cache for 15 minutes
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true
    }
  }));

// CDN configuration
const cdnBaseUrl = process.env.CDN_BASE_URL || '';

app.use((req, res, next) => {
  res.locals.cdnBaseUrl = cdnBaseUrl;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contact', contactRoutes);

// Example of a cached route
app.get('/api/cached-data', cache.route(), (req, res) => {
  // This route will be cached
  res.json({ message: 'This response is cached' });
});

// Create an order
app.post('/api/create-order', async (req, res) => {
  try {
    const { userId, planId, amount, ...additionalData } = req.body;
    
    console.log('Received order data:', { userId, planId, amount, additionalData });

    if (!userId || !planId) {
      console.error('Missing userId or planId:', { userId, planId });
      return res.status(400).json({ error: 'userId and planId are required' });
    }

    const order = new Order({
      userId,
      planId,
      amount,
      status: 'pending',
      additionalData
    });

    await order.save();
    res.json({ orderId: order._id });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

// PayHere notification handler
app.post('/api/payhere-notify', async (req, res) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency,
    status_code, md5sig, custom_1, custom_2 } = req.body;

  // Verify the PayHere signature
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const hash = crypto.createHash('md5')
    .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + 
            custom_1.toLowerCase() + custom_2.toLowerCase() + merchantSecret)
    .digest('hex');

  if (md5sig === hash.toUpperCase()) {
    if (status_code === '2') {  // Payment success
      try {
        const order = await Order.findById(order_id);
        if (order) {
          order.status = 'completed';
          await order.save();
          
          // Update user's subscription
          const user = await User.findById(order.userId);
          if (user) {
            const now = new Date();
            user.subscriptionPlan = order.planId;
            user.subscriptionStatus = 'active';
            user.subscriptionStartDate = now;
            user.subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
            await user.save();
          }

          console.log(`Order ${order_id} completed and user subscription updated`);
        }
      } catch (err) {
        console.error('Error updating order and user subscription:', err);
      }
    }
    res.sendStatus(200);
  } else {
    console.error('Invalid PayHere signature');
    res.sendStatus(400);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));