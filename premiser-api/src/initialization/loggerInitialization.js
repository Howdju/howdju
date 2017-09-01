/* This file must pass console to the Logger */
/* eslint "no-console": ["off"] */

const Logger = require('../logger')

const logLevel = process.env.LOG_LEVEL || process.env.DEFAULT_LOG_LEVEL || 'warn'
const isAws = !!process.env.IS_AWS
const doLogTimestamp = !isAws

exports.logger = new Logger(console, {logLevel, doLogTimestamp})

exports.logger.debug('logLevel', logLevel)
exports.logger.debug('isAws', isAws)
