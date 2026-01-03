import winston from 'winston';
import LokiTransport from 'winston-loki';
import dotenv from 'dotenv';
dotenv.config();

interface LogLabels {
  uniqueId?: string;
  email?: string;
  particular?: string;
  [key: string]: any;
}

interface LogMeta {
  email?: string;
  particular?: string;
  [key: string]: any;
}

// Create a custom log method that accepts uniqueId
const createLogger = () => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({ filename: 'app.log' }),
      new LokiTransport({
        host: process.env.LOKI_URL || 'http://localhost:3100',
        labels: { job: 'hostel-backend' },
        json: true,
        batching: true,
        interval: 2,
      }),
    ],
  });

  // Add custom logging methods
  const originalLoggerMethods: Record<string, any> = {
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    debug: logger.debug.bind(logger),
  };

  // Override log methods to accept dynamic labels
  Object.keys(originalLoggerMethods).forEach((level) => {
    (logger as any)[level] = function (message: any, uniqueId?: any, meta: LogMeta = {}) {
      const labels: LogLabels = {};
      
      // Handle string uniqueId
      if (typeof uniqueId === 'string') {
        labels.uniqueId = uniqueId;
        
        // Extract email and particular from meta if available
        if (meta.email) {
          labels.email = meta.email;
        }
        if (meta.particular) {
          labels.particular = meta.particular;
        }
        
        return originalLoggerMethods[level]({
          message,
          labels,
          ...meta
        });
      } 
      // Handle object with uniqueId/email/particular properties
      else if (uniqueId && typeof uniqueId === 'object') {
        if (uniqueId.uniqueId) {
          labels.uniqueId = uniqueId.uniqueId;
        }
        if (uniqueId.email) {
          labels.email = uniqueId.email;
        }
        if (uniqueId.particular) {
          labels.particular = uniqueId.particular;
        }
        
        return originalLoggerMethods[level]({
          message,
          labels,
          ...uniqueId
        });
      } 
      // Regular logging without labels
      else {
        return originalLoggerMethods[level](message);
      }
    };
  });

  return logger;
};

const logger = createLogger();

// Ensure logs are flushed before exit
const shutdownHandler = () => {
  logger.info('Application is shutting down...');
  logger.end(() => {
    process.exit(0);
  });
};

// Graceful shutdown for crashes or kills
process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  shutdownHandler();
});
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  shutdownHandler();
});

export default logger;
