import ApiError from '../utils/ApiError.js';
import { STATUS_ENUM } from '../constants/status.constants.js';

/**
 * Validates request body and uploaded files for candidate application submission.
 */
export const validateCandidateApplication = (req, res, next) => {
  const {
    fullName,
    fatherOrHusbandName,
    dob,
    qualification,
    permanentAddress,
    email,
    jobAppliedForA,
    currentLocation,
    locationPreferenceA,
    mobileNumber,
    termsAccepted,
  } = req.body;

  const errors = [];

  // Validate fullName
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Candidate full name is required and must be at least 2 characters long.');
  }

  // Validate fatherOrHusbandName
  if (!fatherOrHusbandName || typeof fatherOrHusbandName !== 'string' || fatherOrHusbandName.trim().length === 0) {
    errors.push("Father's / Husband's name is required.");
  }

  // Validate dob
  if (!dob) {
    errors.push('Date of birth is required.');
  } else {
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
      errors.push('Please provide a valid past date of birth.');
    }
  }

  // Validate qualification
  if (!qualification || typeof qualification !== 'string' || qualification.trim().length === 0) {
    errors.push('Qualification is required.');
  }

  // Validate permanentAddress
  if (!permanentAddress || typeof permanentAddress !== 'string' || permanentAddress.trim().length === 0) {
    errors.push('Permanent home address is required.');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  // Validate jobAppliedForA
  if (!jobAppliedForA || typeof jobAppliedForA !== 'string' || jobAppliedForA.trim().length === 0) {
    errors.push('Job Applied For - A is required.');
  }

  // Validate currentLocation
  if (!currentLocation || typeof currentLocation !== 'string' || currentLocation.trim().length === 0) {
    errors.push('Current location is required.');
  }

  // Validate locationPreferenceA
  if (!locationPreferenceA || typeof locationPreferenceA !== 'string' || locationPreferenceA.trim().length === 0) {
    errors.push('Location Preference - A is required.');
  }

  // Validate mobileNumber
  const phoneDigits = mobileNumber ? String(mobileNumber).replace(/\D/g, '') : '';
  if (!mobileNumber || phoneDigits.length < 10) {
    errors.push('Mobile number is required and must contain at least 10 digits.');
  }

  // Validate termsAccepted
  const isTermsAccepted = termsAccepted === true || termsAccepted === 'true';
  if (!isTermsAccepted) {
    errors.push('You must agree to the Terms & Conditions before submitting.');
  }

  // Validate photo file presence in req.files
  const photoFile = req.files?.photo?.[0];
  if (!photoFile) {
    errors.push('Candidate photo is mandatory (JPG, JPEG, PNG up to 5MB).');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  next();
};

/**
 * Validates request payload for updating application status.
 */
export const validateUpdateApplicationStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || !STATUS_ENUM.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Status must be one of: ${STATUS_ENUM.join(', ')}`
    );
  }

  next();
};

export default {
  validateCandidateApplication,
  validateUpdateApplicationStatus,
};
