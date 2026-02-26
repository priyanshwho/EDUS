const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireProfessor } = require('../middleware/role.middleware');
const { getPresignedUploadUrl } = require('../services/s3.service');

/**
 * POST /api/upload/presign
 * Returns a presigned S3 PUT URL for direct client-to-S3 upload.
 * Body: { fileName: string, contentType: string }
 */
router.post('/presign', authenticate, requireProfessor, async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType)
      return res.status(400).json({ error: 'fileName and contentType are required' });

    const allowedTypes = ['application/pdf', 'video/mp4', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(contentType))
      return res.status(400).json({ error: `Unsupported content type. Allowed: ${allowedTypes.join(', ')}` });

    const { uploadUrl, key } = await getPresignedUploadUrl(fileName, contentType);
    return res.json({ uploadUrl, key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
