import CandidateApplication from '../models/CandidateApplication.js';
import Contact from '../models/Contact.js';
import JobOpening from '../models/JobOpening.js';
import Resume from '../models/Resume.js';
import { STATUS } from '../constants/status.constants.js';

/**
 * Dashboard Service Layer
 * Aggregates high-level metrics and recent activity for the Admin Dashboard.
 */

/**
 * Retrieves dashboard summary statistics and recent records across all collections.
 * Uses Promise.all to execute optimized, parallel queries.
 */
export const getDashboardStatsService = async () => {
  const [
    totalCandidates,
    candidatePendingCount,
    candidateReviewedCount,
    candidateShortlistedCount,
    candidateRejectedCount,
    totalContacts,
    totalJobOpenings,
    activeJobOpenings,
    totalResumes,
    recentCandidates,
    recentContacts,
    recentJobOpenings,
  ] = await Promise.all([
    CandidateApplication.countDocuments(),
    CandidateApplication.countDocuments({ status: STATUS.PENDING }),
    CandidateApplication.countDocuments({ status: STATUS.REVIEWED }),
    CandidateApplication.countDocuments({ status: STATUS.SHORTLISTED }),
    CandidateApplication.countDocuments({ status: STATUS.REJECTED }),
    Contact.countDocuments(),
    JobOpening.countDocuments(),
    JobOpening.countDocuments({ status: 'Active' }),
    Resume.countDocuments(),
    CandidateApplication.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email mobileNumber jobAppliedForA status applicationId createdAt resumeUrl')
      .lean(),
    Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email phone subject status createdAt')
      .lean(),
    JobOpening.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('jobTitle sector location status vacancies postedDate createdAt')
      .lean(),
  ]);

  return {
    totalCandidates,
    totalContacts,
    totalJobOpenings,
    activeJobOpenings,
    totalResumes,
    counts: {
      totalCandidates,
      totalContacts,
      totalJobOpenings,
      activeJobOpenings,
      totalResumes,
      candidatesByStatus: {
        pending: candidatePendingCount,
        reviewed: candidateReviewedCount,
        shortlisted: candidateShortlistedCount,
        rejected: candidateRejectedCount,
      },
    },
    recentCandidates,
    recentContacts,
    recentJobOpenings,
  };
};

export default {
  getDashboardStatsService,
};
