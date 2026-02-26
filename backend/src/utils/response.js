const { validationResult } = require('express-validator');

/**
 * Standard success response
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Standard created response
 */
const created = (res, data, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Standard error response
 */
const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Validation error response — reads express-validator result
 */
const validationError = (res, req) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return error(res, 'Validation failed', 422, result.array().map(e => ({
      field: e.path,
      message: e.msg,
    })));
  }
  return null;
};

/**
 * Not found response
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * Unauthorized response
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

/**
 * Forbidden response
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

/**
 * Convenience: run validation check at start of controller handler.
 * Returns true if validation failed (response already sent), false if clean.
 */
const checkValidation = (req, res) => {
  const fail = validationError(res, req);
  return fail !== null;
};

module.exports = { success, created, error, validationError, notFound, unauthorized, forbidden, checkValidation };
