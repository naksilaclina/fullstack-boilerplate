/**
 * Custom logger to reduce development noise
 */

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Filter out noisy Next.js development logs
const shouldFilterLog = (message: string): boolean => {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  // Filter out Next.js compilation and render logs
  const noisyPatterns = [
    /GET \/\w+ \d+ in \d+/,  // GET /page 200 in 123ms
    /compile: \d+/,          // compile: 123ms
    /render: \d+/,           // render: 123ms
  ];

  return noisyPatterns.some(pattern => pattern.test(message));
};

// Override console methods to filter noise
if (process.env.NODE_ENV === 'development') {
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilterLog(message)) {
      originalConsoleLog(...args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilterLog(message)) {
      originalConsoleWarn(...args);
    }
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilterLog(message)) {
      originalConsoleError(...args);
    }
  };
}

export { originalConsoleLog, originalConsoleWarn, originalConsoleError };