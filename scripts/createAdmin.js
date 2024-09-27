require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const User = require(path.join(__dirname, '..', 'models', 'User'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createAdmin() {
  try {
    const adminEmail = 'virtudress@gmail.com'; // Change this to your desired admin email
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const admin = new User({
      name: 'Admin User',
      email: adminEmail,
      password: 'admin123',  // Change this to a secure password
      website: 'http://example.com',
      isAdmin: true
    });
    await admin.save();
    console.log('Admin created successfully');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();