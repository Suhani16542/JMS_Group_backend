import ApiError from '../utils/ApiError.js';

/**
 * Validates request payload for creating a new job opening.
 */
export const validateCreateJobOpening = (req, res, next) => {
  const {
    jobTitle,
    sector,
    location,
    experience,
    qualification,
    jobDescription,
    status,
    employmentType,
    vacancies,
  } = req.body;

  const errors = [];

  if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length < 2) {
    errors.push('Job title is required and must be at least 2 characters long.');
  }

  if (!sector || typeof sector !== 'string' || sector.trim().length === 0) {
    errors.push('Sector / Category is required (e.g. Banking, NBFC, IT, Sales).');
  }

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    errors.push('Location is required (e.g. Gurugram, Delhi NCR, Pan India).');
  }

  if (!experience || typeof experience !== 'string' || experience.trim().length === 0) {
    errors.push('Experience is required (e.g. 0-2 Years, 2-5 Years).');
  }

  if (!qualification || typeof qualification !== 'string' || qualification.trim().length === 0) {
    errors.push('Qualification is required (e.g. Graduate, MBA, B.Tech).');
  }

  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
    errors.push('Job description is required.');
  }

  if (status && !['Active', 'Closed'].includes(status)) {
    errors.push('Status must be either Active or Closed.');
  }

  if (employmentType && !['Full Time', 'Part Time', 'Contract', 'Internship'].includes(employmentType)) {
    errors.push('Employment type must be Full Time, Part Time, Contract, or Internship.');
  }

  if (vacancies !== undefined && (isNaN(Number(vacancies)) || Number(vacancies) < 1)) {
    errors.push('Vacancies must be a number of at least 1.');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  next();
};

/**
 * Validates request payload for updating an existing job opening.
 */
export const validateUpdateJobOpening = (req, res, next) => {
  const { status, employmentType, vacancies } = req.body;
  const errors = [];

  if (status && !['Active', 'Closed'].includes(status)) {
    errors.push('Status must be either Active or Closed.');
  }

  if (employmentType && !['Full Time', 'Part Time', 'Contract', 'Internship'].includes(employmentType)) {
    errors.push('Employment type must be Full Time, Part Time, Contract, or Internship.');
  }

  if (vacancies !== undefined && (isNaN(Number(vacancies)) || Number(vacancies) < 1)) {
    errors.push('Vacancies must be a number of at least 1.');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  next();
};

export default {
  validateCreateJobOpening,
  validateUpdateJobOpening,
};
