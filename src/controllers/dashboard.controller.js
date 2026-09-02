import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { getDashboardStatsService } from '../services/dashboard.service.js';

/**
 * @desc    Get dashboard summary statistics and recent records
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const result = await getDashboardStatsService();
  return ApiResponse.success(res, 200, 'Dashboard statistics retrieved successfully', result);
});

export default {
  getDashboardStats,
};
