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
  const { name, email, password } = req.body;
  let { role } = req.body;

    // Basic presence validation (role optional -> defaults below)
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    // Normalize / default role EARLY to avoid enum DB errors later
  const allowedRoles = ['admin', 'manager']; // user-submitted roles (superadmin created internally only)
  role = (role || 'manager').toString().trim().toLowerCase();
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
  role,
  status: 'pending'
      });
    } catch (dbErr) {
      // Handle enum / validation gracefully instead of generic 500
      const msg = dbErr?.message || '';
      if (/invalid input value for enum/i.test(msg) || /enum/i.test(msg)) {
        return res.status(400).json({ success: false, message: 'Invalid role value' });
      }
      throw dbErr; // Let global handler log unexpected
    }

    // Ensure JWT secret configured
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET missing. Set it in environment to enable authentication.');
      return res.status(500).json({ success: false, message: 'Server auth configuration error (missing JWT secret)' });
    }

  // Do NOT auto-login pending users. Provide message.
  const userResponse = createUserResponse(user);
  res.status(201).json({ success: true, pending: true, message: 'Registration submitted. Await approval by an administrator.', user: userResponse });
  }),

  // Login User
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  console.log('🔐 Login attempt', { email });

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
    if (!user) {
      console.log('🔍 No user found for email', email);
    } else {
      console.log('👤 User fetched', { id: user.id, role: user.role, hasPassword: !!user.password });
    }

    // Defensive: if user exists but password somehow missing, re-query directly (edge migration issues)
    if (user && !user.password) {
      console.log('⚠️ Missing password field on fetched user, refetching by id');
      user = await User.unscoped().findOne({ where: { id: user.id } });
      console.log('🔁 Refetch result has password?', !!(user && user.password));
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
      console.log('❌ Invalid credentials', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Account pending approval. Please wait for an administrator to approve your access.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact an administrator.' });
    }

    // Generate token and response
    const token = generateToken(user);
    const userResponse = createUserResponse(user);

    console.log('✅ Login successful', { userId: user.id, role: user.role });
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
