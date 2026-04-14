// Structured logging via pino.
// Use this logger everywhere — never console.log / console.error in production code.
// Include context fields (user_id, request_id, trace_id) on every log.
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
