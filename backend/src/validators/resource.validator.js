const { body, param, query } = require('express-validator');

const RESOURCE_TYPES = ['notes', 'assignment', 'pyq', 'lecture'];
const PYQ_TYPES = ['minor1', 'minor2', 'major'];
const CURRENT_YEAR = new Date().getFullYear();

const createResourceValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('subject_id')
    .notEmpty().withMessage('Subject ID is required')
    .isUUID().withMessage('Subject ID must be a valid UUID'),

  body('resource_type')
    .notEmpty().withMessage('Resource type is required')
    .isIn(RESOURCE_TYPES).withMessage(`Resource type must be one of: ${RESOURCE_TYPES.join(', ')}`),

  body('pyq_type')
    .optional({ nullable: true })
    .isIn(PYQ_TYPES).withMessage(`PYQ type must be one of: ${PYQ_TYPES.join(', ')}`),

  body('year')
    .optional({ nullable: true })
    .isInt({ min: 2000, max: CURRENT_YEAR }).withMessage(`Year must be between 2000 and ${CURRENT_YEAR}`),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),

  body('external_link')
    .optional({ nullable: true })
    .isURL().withMessage('External link must be a valid URL'),

  body('youtube_url')
    .optional({ nullable: true })
    .isURL().withMessage('YouTube URL must be a valid URL')
    .matches(/(?:youtube\.com\/watch\?v=|youtu\.be\/)/).withMessage('Must be a valid YouTube URL'),

  body('aws_s3_key')
    .optional({ nullable: true })
    .trim()
    .notEmpty().withMessage('S3 key cannot be empty if provided'),
];

const updateResourceValidator = [
  param('id')
    .notEmpty().withMessage('ID is required'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),

  body('youtube_url')
    .optional({ nullable: true })
    .isURL().withMessage('YouTube URL must be a valid URL')
    .matches(/(?:youtube\.com\/watch\?v=|youtu\.be\/)/).withMessage('Must be a valid YouTube URL'),
];

const listResourcesValidator = [
  query('resource_type')
    .optional()
    .isIn(RESOURCE_TYPES).withMessage(`Invalid resource type`),

  query('semester')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be 1–8'),

  query('pyq_type')
    .optional()
    .isIn(PYQ_TYPES).withMessage(`Invalid PYQ type`),

  query('year')
    .optional()
    .isInt({ min: 2000, max: CURRENT_YEAR }).withMessage('Invalid year'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be non-negative'),
];

module.exports = { createResourceValidator, updateResourceValidator, listResourcesValidator };
