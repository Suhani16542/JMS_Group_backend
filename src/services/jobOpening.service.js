import JobOpening from '../models/JobOpening.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Creates a new monthly job opening.
 * @param {Object} jobData - Job opening payload
 */
export const createJobOpeningService = async (jobData) => {
  const newJob = await JobOpening.create({
    ...jobData,
    status: jobData.status || 'Active',
    postedDate: jobData.postedDate || new Date(),
  });

  logger.success(`[Job Opening Service] Created new job opening: "${newJob.jobTitle}" in ${newJob.sector} (${newJob._id})`);
  return newJob;
};

/**
 * Fetches public active job openings with optional filters and keyword search.
 * Only returns jobs with status: 'Active'.
 * @param {Object} queryParams - Query filters (sector, location, experience, search, page, limit)
 */
export const getActiveJobOpeningsService = async (queryParams = {}) => {
  const { sector, location, experience, search, page = 1, limit = 50 } = queryParams;

  const filter = { status: 'Active' };

  if (sector && typeof sector === 'string' && sector.trim()) {
    filter.sector = { $regex: new RegExp(`^${sector.trim()}$`, 'i') };
  }

  if (location && typeof location === 'string' && location.trim()) {
    filter.location = { $regex: new RegExp(location.trim(), 'i') };
  }

  if (experience && typeof experience === 'string' && experience.trim()) {
    filter.experience = { $regex: new RegExp(experience.trim(), 'i') };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { jobTitle: searchRegex },
      { sector: searchRegex },
      { department: searchRegex },
      { location: searchRegex },
      { jobDescription: searchRegex },
      { requiredSkills: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const total = await JobOpening.countDocuments(filter);
  const jobs = await JobOpening.find(filter)
    .sort({ isFeatured: -1, postedDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    jobs,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Fetches all job openings (Active + Closed) for admin management with statistics.
 * @param {Object} queryParams - Query parameters (status, sector, search, page, limit)
 */
export const getAllJobOpeningsService = async (queryParams = {}) => {
  const { status, sector, location, search, page = 1, limit = 50 } = queryParams;

  const filter = {};

  if (status && ['Active', 'Closed'].includes(status)) {
    filter.status = status;
  }

  if (sector && typeof sector === 'string' && sector.trim()) {
    filter.sector = { $regex: new RegExp(sector.trim(), 'i') };
  }

  if (location && typeof location === 'string' && location.trim()) {
    filter.location = { $regex: new RegExp(location.trim(), 'i') };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { jobTitle: searchRegex },
      { sector: searchRegex },
      { department: searchRegex },
      { location: searchRegex },
      { jobDescription: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [total, activeCount, closedCount, jobs] = await Promise.all([
    JobOpening.countDocuments(filter),
    JobOpening.countDocuments({ status: 'Active' }),
    JobOpening.countDocuments({ status: 'Closed' }),
    JobOpening.find(filter)
      .sort({ postedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    jobs,
    stats: {
      totalAll: activeCount + closedCount,
      active: activeCount,
      closed: closedCount,
    },
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Fetches a single job opening by ID.
 * @param {string} id - Job opening MongoDB ID
 */
export const getJobOpeningByIdService = async (id) => {
  const job = await JobOpening.findById(id);
  if (!job) {
    throw new ApiError(404, 'Job opening not found');
  }
  return job;
};

/**
 * Updates an existing job opening by ID.
 * @param {string} id - Job opening ID
 * @param {Object} updateData - Updated fields
 */
export const updateJobOpeningService = async (id, updateData) => {
  const updatedJob = await JobOpening.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedJob) {
    throw new ApiError(404, 'Job opening not found');
  }

  logger.info(`[Job Opening Service] Updated job opening: "${updatedJob.jobTitle}" (Status: ${updatedJob.status})`);
  return updatedJob;
};

/**
 * Deletes a job opening by ID.
 * @param {string} id - Job opening ID
 */
export const deleteJobOpeningService = async (id) => {
  const deletedJob = await JobOpening.findByIdAndDelete(id);
  if (!deletedJob) {
    throw new ApiError(404, 'Job opening not found');
  }

  logger.info(`[Job Opening Service] Deleted job opening: "${deletedJob.jobTitle}" (${id})`);
  return deletedJob;
};

export default {
  createJobOpeningService,
  getActiveJobOpeningsService,
  getAllJobOpeningsService,
  getJobOpeningByIdService,
  updateJobOpeningService,
  deleteJobOpeningService,
};
