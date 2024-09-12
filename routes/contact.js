const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Helper function for input validation
const validateInput = (input) => {
  const errors = {};

  if (!input.name || input.name.trim() === '') {
    errors.name = 'Name is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email)) {
    errors.email = 'Valid email is required';
  }

  const phoneRegex = /^\d{10}$/;
  if (!input.phone || !phoneRegex.test(input.phone)) {
    errors.phone = 'Valid 10-digit phone number is required';
  }

  if (!input.message || input.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  }

  return errors;
};

router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate input
    const validationErrors = validateInput({ name, email, phone, message });
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Create new contact submission
    const newContact = new Contact({
      name,
      email,
      phone,
      message
    });

    // Save to database
    await newContact.save();

    res.status(201).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'An error occurred while submitting the form' });
  }
});

module.exports = router;