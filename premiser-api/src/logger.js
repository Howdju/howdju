const winston = require('winston')
winston.level = process.env.LOG_LEVEL || 'warn'
// var logger = new winston.Logger()
exports.logger = winston