const util = require('util')

const assign = require('lodash/assign')
const concat = require('lodash/concat')
const isString = require('lodash/isString')
const join = require('lodash/join')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const toString = require('lodash/toString')

const {processArgs} = require('./processArgs')

const {
  utcTimestamp
} = require('howdju-common')

const logLevelNumbers = {
  silly: 5,
  debug: 4,
  verbose: 3,
  info: 2,
  warn: 1,
  error: 0,
}
// Anything at or below this is error-ish
const logLevelErrorMaxNumber = 1


const makeContextString = (context) => {
  if (!context) return ''
  const contextParts = map(context, (val, key) => `${key}=${util.format(val)}`)
  const contextString = join(contextParts, '; ')
  return contextString
}

/* eslint-disable no-unused-vars */
const writeToStd = (logLevelNumber, output) => {
  if (logLevelNumber <= logLevelErrorMaxNumber) {
    process.stderr.write(output + this.eol)
  } else {
    process.stdout.write(output + this.eol)
  }
}
/* eslint-enable no-unused-vars */

// Must return a function instead of a lambda so that it will bind `this` when called
const makeTextLogArguments = function(logLevel, logLevelNumber, ...args) {
  const loggerArgs = []
  if (this.doLogTimestamp) {
    loggerArgs.push(utcTimestamp())
  }

  loggerArgs.push(logLevel)

  const contextString = makeContextString(this.context, this.doUseCarriageReturns)
  if (contextString) {
    loggerArgs.push(`[${contextString}]`)
  }

  const combinedArgs = concat(loggerArgs, args)
  return combinedArgs
}

// Must return a function instead of a lambda so that it will bind `this` when called
const makeJsonLogArguments = function(logLevel, logLevelNumber, ...args) {
  const logRecord = {}
  if (this.doLogTimestamp) {
    logRecord['timestamp'] = utcTimestamp()
  }
  if (this.context) {
    logRecord['context'] = this.context
  }
  assign(logRecord, {
    level: logLevel,
    levelNumber: logLevelNumber,
  })
  const {message, data} = processArgs(args)
  if (message) {
    logRecord['message'] = message
  }
  if (data) {
    logRecord['data'] = data
  }

  const logRecordJson = JSON.stringify(logRecord)
  return [logRecordJson]
}

// Must return a function instead of a lambda so that it will bind `this` when called
const makeLogMethod = (logLevel, logLevelNumber) => function(...args) {
  if (this.logLevel) {
    const loggerLevelNumber = logLevelNumbers[this.logLevel]
    if (logLevelNumber > loggerLevelNumber) return
  }
  const logArgs = this.makeLogArguments(logLevel, logLevelNumber, ...args)
  // AWS seems to overwrite console.log to add the timestamp and request ID.  Our logging handles those, so write directly to stdout
  let formatted = util.format.apply(util, logArgs)
  if (this.doUseCarriageReturns) {
    formatted = formatted.replace('\n', '\r')
  }
  process.stdout.write(formatted + "\n")
}

const makeLogArgumentsByLogFormat = {
  'text': makeTextLogArguments,
  'json': makeJsonLogArguments,
}

class AwsLogger {
  /**
   * @param console
   * @param logLevel
   * @param doUseCarriageReturns - CloudWatch breaks logs across newlines, so we must break using carriage returns
   *                               to get breaks in a single record
   *                               https://github.com/visionmedia/debug/issues/296#issuecomment-289595923
   * @param doLogTimestamp
   * @param logFormat
   */
  constructor(console, {logLevel, doUseCarriageReturns=true, doLogTimestamp=true, logFormat='text'}) {
    this.console = console
    this.logLevel = logLevel
    this.doUseCarriageReturns = doUseCarriageReturns
    this.doLogTimestamp = doLogTimestamp
    const makeLogArguments = makeLogArgumentsByLogFormat[logFormat]
    if (!makeLogArguments) throw new Error(`Unsupported logFormat: ${logFormat}`)
    this.makeLogArguments = makeLogArguments
    this.eol = "\n"
  }
}
const logMethods = mapValues(logLevelNumbers, (logLevelNumber, logLevel) => makeLogMethod(logLevel, logLevelNumber))
assign(AwsLogger.prototype, logMethods)

exports.AwsLogger = AwsLogger