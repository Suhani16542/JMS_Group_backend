/**
 * Standard API Response Class
 */
class ApiResponse {
  constructor(statusCode, data = {}, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  /**
   * Send a standard success response.
   */
  static success(res, statusCode = 200, message = 'Success', data = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send a standard error response.
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}

export default ApiResponse;
