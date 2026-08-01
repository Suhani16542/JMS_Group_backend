/**
 * Higher-Order Async Handler Function to catch unhandled promise rejections in route controllers.
 *
 * @param {Function} fn - Async controller/middleware function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
