const Logger = require('./Logger')

const logLevel = process.env.LOG_LEVEL || process.env.DEFAULT_LOG_LEVEL || 'warn'
module.exports.logger = new Logger({logLevel})
