const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ 
    id: user.id, 
    role: user.role, 
    name: user.name,
    email: user.email 
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// Helper function to create user response object
const createUserResponse = (user) => {
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

const authController = {
  // Register User
  register: asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
    });

    // Generate token and response
    const token = generateToken(user);
    const userResponse = createUserResponse(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  }),

  // Login User
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Fetch user WITHOUT default scope so password is available for comparison.
    // Using defaultScope (which excludes password) + bcrypt.compare(undefined) => 500 error.
    let user = await User.unscoped().findOne({
      where: { email: email.toLowerCase().trim() }
    });

    // Defensive: if user exists but password somehow missing, re-query directly (edge migration issues)
    if (user && !user.password) {
      user = await User.unscoped().findOne({ where: { id: user.id } });
    }

    // Validate credentials safely
    let isValidUser = false;
    if (user && user.password) {
      try {
        isValidUser = await bcrypt.compare(password, user.password);
      } catch (compareErr) {
        console.warn('⚠️ Password comparison failed:', compareErr.message);
      }
    }

    if (!isValidUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token and response
    const token = generateToken(user);
    const userResponse = createUserResponse(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  }),

  // Logout (optional - for token blacklisting if implemented)
  logout: asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  })
};

module.exports = authController;
