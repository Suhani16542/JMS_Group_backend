/**
 * Console Logger Utility with ANSI Color Codes
 */
const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
};

export const logger = {
  info: (message) => {
    console.log(`${colors.info}[INFO] ${message}${colors.reset}`);
  },
  success: (message) => {
    console.log(`${colors.success}[SUCCESS] ${message}${colors.reset}`);
  },
  warn: (message) => {
    console.warn(`${colors.warn}[WARNING] ${message}${colors.reset}`);
  },
  error: (message) => {
    console.error(`${colors.error}[ERROR] ${message}${colors.reset}`);
  },
};

export default logger;
