import mongoose from 'mongoose';
import { STATUS_ENUM, STATUS } from '../constants/status.constants.js';

/**
 * Contact Mongoose Schema
 */
const contactSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters long'],
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

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
