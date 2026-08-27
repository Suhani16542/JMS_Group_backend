import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { adminLoginService } from '../services/adminAuth.service.js';

/**
 * @desc    Admin / HR Login
 * @route   POST /api/admin/login (and /api/auth/login)
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const result = await adminLoginService(req.body);
  return ApiResponse.success(res, 200, 'Login successful', result);
});

export default {
  adminLogin,
};
