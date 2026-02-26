const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const { s3Client, BUCKET } = require('../config/s3.config');

const UPLOAD_EXPIRES   = 300;  // 5 min presigned PUT
const DOWNLOAD_EXPIRES = 600;  // 10 min presigned GET

/**
 * Generate a presigned PUT URL so the client can upload directly to Tigris S3.
 * Returns { uploadUrl, key } — key is stored in DB.
 */
async function getPresignedUploadUrl(fileName, contentType) {
  const ext  = fileName.split('.').pop();
  const key  = `uploads/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: UPLOAD_EXPIRES });
  return { uploadUrl, key };
}

/**
 * Generate a presigned GET URL for secure, time-limited file access.
 */
async function getPresignedDownloadUrl(key) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: DOWNLOAD_EXPIRES });
}

/**
 * Delete an object from S3 by key.
 */
async function deleteObject(key) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return s3Client.send(command);
}

module.exports = { getPresignedUploadUrl, getPresignedDownloadUrl, deleteObject };
