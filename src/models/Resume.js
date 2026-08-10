import mongoose from 'mongoose';
import { STATUS_ENUM, STATUS } from '../constants/status.constants.js';

/**
 * Resume Mongoose Schema configured for Cloudinary Storage
 */
const resumeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    highestQualification: {
      type: String,
      required: [true, 'Highest qualification is required'],
      trim: true,
    },
    experience: {
      type: String,
      required: [true, 'Experience is required'],
      trim: true,
    },
    preferredJobRole: {
      type: String,
      required: [true, 'Preferred job role is required'],
      trim: true,
    },
    referenceNumber: {
      type: String,
      required: [true, 'Reference number is required'],
      trim: true,
    },
    referenceName: {
      type: String,
      required: [true, 'Reference name is required'],
      trim: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume Cloudinary URL is required'],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary Public ID is required'],
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'File MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    status: {
      type: String,
      enum: {
        values: STATUS_ENUM,
        message: 'Status must be one of: Pending, Reviewed, Shortlisted, Rejected',
      },
      default: STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
