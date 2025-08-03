/**
 * Express error handling middleware
 * Catches errors that occur in route handlers and middleware
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error with request details for debugging
  logger.error(`ERROR [${req.method} ${req.originalUrl}]`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Check for specific error types to give better responses
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token. Please log in again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Your session has expired. Please log in again.'
    });
  }

  // Default response for other errors
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 
    ? 'Internal Server Error' 
    : err.message || 'Something went wrong';
  
  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

module.exports = errorHandler;

module.exports = errorHandler;
