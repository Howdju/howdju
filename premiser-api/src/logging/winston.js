const assign = require('lodash/assign')
const winston = require('winston')

const rewriterContext = {}
// Sort of a sneaky way to change the log messages.  If meta appears in here, assign all of it to logging meta
exports.rewriterContext = rewriterContext

const contextRewriter = (level, msg, meta) => {
  if (rewriterContext.meta) {
    assign(meta, rewriterContext.meta)
  }
  return meta
}

const logLevel = process.env.LOG_LEVEL || process.env.DEFAULT_LOG_LEVEL || 'warn'
console.log(`Logging at level: ${logLevel}`)
const logger = new winston.Logger({
  level: logLevel,
  transports: [
    new winston.transports.Console(),
  ],
  rewriters: [contextRewriter],
})
exports.logger = logger
