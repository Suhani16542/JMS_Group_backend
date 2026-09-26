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
 * Determines the optimal Cloudinary resource_type and options based on file extension.
 * - PDF: 'image' pipeline with format 'pdf' enables inline rendering and viewing
 * - Images (JPG, PNG, WEBP, SVG): 'image' pipeline
 * - Documents (DOC, DOCX, etc.): 'raw' pipeline
 */
export const getCloudinaryUploadSettings = (originalName, explicitResourceType = null) => {
  const ext = path.extname(originalName || '').toLowerCase();
  const baseName = path.basename(originalName || 'file', ext).replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();

  if (explicitResourceType) {
    return {
      resourceType: explicitResourceType,
      publicId: explicitResourceType === 'raw' ? `${baseName}_${timestamp}${ext}` : `${baseName}_${timestamp}`,
      format: explicitResourceType === 'image' && ext === '.pdf' ? 'pdf' : undefined,
    };
  }

  if (ext === '.pdf') {
    return {
      resourceType: 'image',
      publicId: `${baseName}_${timestamp}`,
      format: 'pdf',
    };
  }

  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
  if (imageExts.includes(ext)) {
    return {
      resourceType: 'image',
      publicId: `${baseName}_${timestamp}`,
      format: ext.replace('.', ''),
    };
  }

  // DOC, DOCX, ZIP, etc.
  return {
    resourceType: 'raw',
    publicId: `${baseName}_${timestamp}${ext}`,
    format: undefined,
  };
};

/**
 * Uploads a file buffer directly to Cloudinary using streamifier.
 *
 * @param {Buffer} fileBuffer - In-memory file buffer from Multer
 * @param {string} originalName - Original filename
 * @param {string} folder - Target Cloudinary folder (default: 'jms-group/resumes')
 * @param {string|null} resourceType - Explicit resource type override or null for auto
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (
  fileBuffer,
  originalName,
  folder = 'jms-group/resumes',
  resourceType = null
) => {
  return new Promise((resolve, reject) => {
    try {
      configureCloudinary();

      const settings = getCloudinaryUploadSettings(originalName, resourceType);

      const uploadOptions = {
        folder,
        resource_type: settings.resourceType,
        public_id: settings.publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: true,
      };

      if (settings.format) {
        uploadOptions.format = settings.format;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.error(`[Cloudinary Stream Error] ${error.message}`);
            return reject(
              new ApiError(500, `Cloudinary upload failed: ${error.message}`)
            );
          }
          logger.success(`[Cloudinary Upload Success] Asset public_id: ${result.public_id} (${result.resource_type}/${result.format || 'raw'})`);
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
 * Deletes an asset from Cloudinary using its public_id.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('raw', 'image', 'auto')
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    if (!publicId) return null;
    configureCloudinary();

    if (resourceType === 'auto') {
      try {
        const imageRes = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        if (imageRes.result === 'ok') return imageRes;
      } catch (_) {}
      return await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    logger.info(`[Cloudinary Delete] Deleted public_id: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`[Cloudinary Deletion Error] ${error.message}`);
    throw new ApiError(500, `Cloudinary file deletion failed: ${error.message}`);
  }
};

/**
 * Returns the permanent Cloudinary HTTPS delivery URL for an asset.
 * Does NOT generate temporary expiring URLs.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('image' or 'raw')
 * @param {boolean} attachment - If true, adds attachment flag
 * @returns {string} Permanent HTTPS URL
 */
export const getCloudinaryDeliveryUrl = (publicId, resourceType = 'image', attachment = false) => {
  if (!publicId) return null;
  configureCloudinary();

  const options = {
    resource_type: resourceType,
    secure: true,
  };

  if (attachment) {
    options.flags = 'attachment';
  }

  return cloudinary.url(publicId, options);
};

/**
 * Fetches an asset binary directly from Cloudinary using short-lived authenticated access.
 * Allows the backend to stream files (PDFs, DOCX, images) directly to the client with
 * correct Content-Type, Content-Disposition, and zero CORS/401 issues.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('image', 'raw', or 'auto')
 * @returns {Promise<{ buffer: Buffer, contentType: string, contentLength: number }>}
 */
export const fetchCloudinaryAsset = async (publicId, resourceType = 'auto') => {
  if (!publicId) {
    throw new ApiError(400, 'Cloudinary public_id is required.');
  }
  configureCloudinary();

  let primaryType = resourceType;
  if (resourceType === 'auto' || !resourceType) {
    const hasRawExt =
      publicId.endsWith('.pdf') ||
      publicId.endsWith('.doc') ||
      publicId.endsWith('.docx') ||
      publicId.endsWith('.zip');
    primaryType = hasRawExt ? 'raw' : 'image';
  }

  const typesToTry = [primaryType, primaryType === 'image' ? 'raw' : 'image'];

  let lastError = null;
  for (const type of typesToTry) {
    try {
      const privateUrl = cloudinary.utils.private_download_url(publicId, null, {
        resource_type: type,
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min dynamic TTL
      });

      const response = await fetch(privateUrl);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentLength = buffer.length;
        return { buffer, contentType, contentLength, resourceType: type };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new ApiError(404, `Cloudinary document not found or inaccessible for public_id: ${publicId} (${lastError?.message || 'Not Found'})`);
};



/**
 * Backward compatibility alias for existing callers.
 * Returns the permanent stable URL.
 */
export const getCloudinaryDownloadUrl = (publicId, attachment = false) => {
  if (!publicId) return null;
  configureCloudinary();

  const isRaw = publicId.endsWith('.doc') || publicId.endsWith('.docx');
  return getCloudinaryDeliveryUrl(publicId, isRaw ? 'raw' : 'image', attachment);
};

export default cloudinary;

