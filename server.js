require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const redis = require('redis');
const expressRedisCache = require('express-redis-cache');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/product');
const path = require('path');
const publicRoutes = require('./routes/publicRoutes');

// Import models
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
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/product', productRoutes);

// Example of a cached route
app.get('/api/cached-data', cache.route(), (req, res) => {
  // This route will be cached
  res.json({ message: 'This response is cached' });
});

// Serve 3D models
app.use('/3d-models', express.static(path.join(__dirname, '3d-models')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));