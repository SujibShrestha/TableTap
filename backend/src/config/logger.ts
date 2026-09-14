import winston from 'winston';
import { mkdirSync } from 'node:fs';

// Ensure logs directory exists in production
if (process.env.NODE_ENV === 'production') {
  try {
    mkdirSync('logs', { recursive: true });
  } catch {
    // directory may already exist
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tabletap-api' },
  transports: process.env.NODE_ENV === "production"
    ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ]
    : [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
});

export default logger;
