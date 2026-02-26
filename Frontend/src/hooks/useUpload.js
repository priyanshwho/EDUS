import { useState, useCallback } from 'react';
import { resourceService } from '../services/resource.service';

/**
 * useUpload
 * Manages the two-step S3 upload flow:
 *  1. Presign         → get uploadUrl + key from backend
 *  2. Upload to S3    → PUT the file directly to Tigris
 *  3. Create resource → POST to /resources with aws_s3_key
 */
export function useUpload() {
  const [progress, setProgress] = useState(0);  // 0-100
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file, resourceMeta) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1 — Presign
      const { uploadUrl, key } = await resourceService.presign(file);
      setProgress(25);

      // Step 2 — Upload to S3
      await resourceService.uploadToS3(uploadUrl, file);
      setProgress(75);

      // Step 3 — Create resource record
      const { resource } = await resourceService.create({
        ...resourceMeta,
        aws_s3_key: key,
      });
      setProgress(100);
      return resource;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, progress, error };
}
