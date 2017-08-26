const Logger = require('./Logger')

const logLevel = process.env.LOG_LEVEL || process.env.DEFAULT_LOG_LEVEL || 'warn'
console.log('logLevel', logLevel)
const isAws = !!process.env.IS_AWS
console.log('isAws', isAws)
const doLogTimestamp = !isAws
module.exports.logger = new Logger({logLevel, doLogTimestamp})
