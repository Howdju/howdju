/* This file must pass console to the Logger */
/* eslint "no-console": ["off"] */

const {AwsLogger} = require('howdju-service-common')

const logLevel = process.env.LOG_LEVEL || 'warn'
const isAws = !!process.env.IS_AWS
const doLogTimestamp = !isAws
const doUseCarriageReturns = isAws

console.log('initializing logger')

exports.logger = new AwsLogger(console, {logLevel, doLogTimestamp, doUseCarriageReturns})

exports.logger.debug('logLevel', logLevel)
exports.logger.debug('isAws', isAws)