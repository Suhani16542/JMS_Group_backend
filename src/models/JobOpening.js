import mongoose from 'mongoose';

/**
 * Job Opening Mongoose Schema for dynamic monthly hiring management.
 */
const jobOpeningSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [2, 'Job title must be at least 2 characters long'],
    },
    sector: {
      type: String,
      required: [true, 'Sector / Category is required'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
      index: true,
    },
    experience: {
      type: String,
      required: [true, 'Experience requirement is required'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification requirement is required'],
      trim: true,
    },
    salary: {
      type: String,
      default: '',
      trim: true,
    },
    employmentType: {
      type: String,
      enum: {
        values: ['Full Time', 'Part Time', 'Contract', 'Internship'],
        message: 'Employment type must be Full Time, Part Time, Contract, or Internship',
      },
      default: 'Full Time',
    },
    vacancies: {
      type: Number,
      default: 1,
      min: [1, 'Vacancies must be at least 1'],
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    postedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    closingDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Closed'],
        message: 'Status must be either Active or Closed',
      },
      default: 'Active',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast public queries
jobOpeningSchema.index({ status: 1, postedDate: -1 });
jobOpeningSchema.index({ sector: 1, status: 1 });

const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);

export default JobOpening;
