import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import path from 'path';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Configures Cloudinary with environment variables from process.env
 */
export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

// Initial configuration call
configureCloudinary();

/**
 * Tests and verifies Cloudinary connection status on server startup.
 */
export const verifyCloudinary = async () => {
  configureCloudinary();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || !cloudName.trim() || !apiKey.trim() || !apiSecret.trim()) {
    logger.warn('[Cloudinary Warning] Cloudinary credentials pending in .env.');
    return false;
  }

  try {
    const pingResult = await cloudinary.api.ping();
    if (pingResult && pingResult.status === 'ok') {
      logger.success('✅ Cloudinary Connected Successfully');
      logger.success('✅ Upload Test Ready');
      return true;
    }
  } catch (error) {
    logger.warn(`[Cloudinary Warning] Cloudinary connection test: ${error.message}`);
    return false;
  }
};

/**
 * Uploads a file buffer directly to Cloudinary using streamifier.
 * Folder: jms-group/resumes
 *
 * @param {Buffer} fileBuffer - In-memory file buffer from Multer
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    try {
      configureCloudinary();

      const ext = path.extname(originalName).toLowerCase();
      const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const uniquePublicId = `${baseName}_${Date.now()}${ext}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jms-group/resumes',
          resource_type: 'raw',
          public_id: uniquePublicId,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            logger.error(`[Cloudinary Stream Error] ${error.message}`);
            return reject(
              new ApiError(500, `Cloudinary upload failed: ${error.message}`)
            );
          }
          logger.success(`[Cloudinary Upload Success] Asset public_id: ${result.public_id}`);
          resolve(result);
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    } catch (error) {
      logger.error(`[Cloudinary Pipeline Error] ${error.message}`);
      reject(new ApiError(500, `Cloudinary stream error: ${error.message}`));
    }
  });
};

/**
 * Deletes a raw asset from Cloudinary using its public_id.
 *
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    configureCloudinary();

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });

    logger.info(`[Cloudinary Delete] Deleted public_id: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`[Cloudinary Deletion Error] ${error.message}`);
    throw new ApiError(500, `Cloudinary file deletion failed: ${error.message}`);
  }
};

/**
 * Generates an authenticated signed download/view URL for raw Cloudinary assets.
 * Ensures PDF/DOC/DOCX files view and download cleanly across all mobile & desktop browsers
 * with HTTP 200 status and zero 401 restrictions.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {boolean} attachment - If true, forces download; if false, opens inline
 * @returns {string} Signed HTTPS URL
 */
export const getCloudinaryDownloadUrl = (publicId, attachment = false) => {
  if (!publicId) return null;
  configureCloudinary();

  const options = {
    resource_type: 'raw',
    type: 'upload',
    // 5-year expiration for long-lived access
    expires_at: Math.floor(Date.now() / 1000) + 5 * 365 * 24 * 60 * 60,
  };

  if (attachment) {
    options.attachment = true;
  }

  return cloudinary.utils.private_download_url(publicId, null, options);
};

export default cloudinary;
