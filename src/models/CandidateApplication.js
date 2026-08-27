import mongoose from 'mongoose';
import { STATUS_ENUM, STATUS } from '../constants/status.constants.js';

const fileAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

/**
 * Candidate Application Mongoose Schema
 */
const candidateApplicationSchema = new mongoose.Schema(
  {
    // 1. Personal & Contact Information
    fullName: {
      type: String,
      required: [true, 'Candidate full name is required'],
      trim: true,
      minlength: [2, 'Candidate name must be at least 2 characters long'],
    },
    fatherOrHusbandName: {
      type: String,
      required: [true, "Father's / Husband's name is required"],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    specialization: {
      type: String,
      default: '',
      trim: true,
    },
    permanentAddress: {
      type: String,
      required: [true, 'Permanent home address is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email ID is required'],
      trim: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    alternateNumber: {
      type: String,
      default: '',
      trim: true,
    },
    fatherNumber: {
      type: String,
      default: '',
      trim: true,
    },

    // 2. Job & Location Preferences
    jobAppliedForA: {
      type: String,
      required: [true, 'Job Applied For - A is required'],
      trim: true,
    },
    jobAppliedForB: {
      type: String,
      default: '',
      trim: true,
    },
    currentLocation: {
      type: String,
      required: [true, 'Current location is required'],
      trim: true,
    },
    locationPreferenceA: {
      type: String,
      required: [true, 'Location Preference - A is required'],
      trim: true,
    },
    locationPreferenceB: {
      type: String,
      default: '',
      trim: true,
    },

    // 3. Compensation & Career Background
    currentCtc: {
      type: String,
      default: '',
      trim: true,
    },
    expectedSalary: {
      type: String,
      default: '',
      trim: true,
    },
    noticePeriod: {
      type: String,
      default: '',
      trim: true,
    },
    currentBankOrNbfc: {
      type: String,
      default: '',
      trim: true,
    },
    currentCompany: {
      type: String,
      default: '',
      trim: true,
    },

    // 4. Family & Reference Information
    fatherOrHusbandOccupation: {
      type: String,
      default: '',
      trim: true,
    },
    motherOccupation: {
      type: String,
      default: '',
      trim: true,
    },
    siblings: {
      type: String,
      default: '',
      trim: true,
    },
    siblingsOccupation: {
      type: String,
      default: '',
      trim: true,
    },
    referenceNameAndNo: {
      type: String,
      default: '',
      trim: true,
    },

    // 5. Uploaded Assets & Linked Resume
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    photo: {
      type: fileAttachmentSchema,
      required: false,
      default: null,
    },
    documents: {
      type: [fileAttachmentSchema],
      default: [],
    },

    // 6. Signature & Terms Consent
    signature: {
      type: String,
      default: '',
      trim: true,
    },
    signatureUrl: {
      type: String,
      default: '',
      trim: true,
    },
    candidateSignatureName: {
      type: String,
      default: '',
      trim: true,
    },
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms & Conditions acceptance is required'],
      default: false,
    },

    // 7. Status & Tracking
    applicationId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
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

// Pre-save hook to generate unique human-readable applicationId if not present
candidateApplicationSchema.pre('save', function (next) {
  if (!this.applicationId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.applicationId = `JMS-APP-${timestamp}-${randomSuffix}`;
  }
  next();
});

const CandidateApplication = mongoose.model('CandidateApplication', candidateApplicationSchema);

export default CandidateApplication;
