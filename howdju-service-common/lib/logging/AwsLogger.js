const assign = require('lodash/assign')
const concat = require('lodash/concat')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const join = require('lodash/join')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const toString = require('lodash/toString')

const {
  utcTimestamp
} = require('howdju-common')


const cleanArg = (arg, doUseCarriageReturns) => {
  let cleaned = arg
  if (cleaned instanceof Error) {
    cleaned = cleaned.stack
  }
  if (isObject(cleaned)) {
    cleaned = JSON.stringify(cleaned, null, 2)
  }
  if (!isString(cleaned)) {
    cleaned = toString(cleaned)
  }
  // Cloudwatch will break newline characters into separate log entries
  // https://github.com/visionmedia/debug/issues/296#issuecomment-289595923
  if (doUseCarriageReturns) {
    cleaned = cleaned.replace('\n', '\r')
  }
  return cleaned
}

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
  const contextParts = map(context, (val, key) => `${key}=${cleanArg(val)}`)
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
  const contextString = makeContextString(this.context)
  if (contextString) {
    loggerArgs.push(`[${contextString}]`)
  }

  const cleanArgs = map(args, arg => cleanArg(arg, this.doUseCarriageReturns))
  const combinedArgs = concat(loggerArgs, cleanArgs)
  return combinedArgs
}

// Must return a function instead of a lambda so that it will bind `this` when called
const makeJsonLogArguments = function(logLevel, logLevelNumber, ...args) {
  const logRecord = {}
  if (this.doLogTimestamp) {
    logRecord['timestamp'] = utcTimestamp()
  }
  if (this.context) {
    assign(logRecord, mapValues(this.context, (val) => cleanArg(val)))
  }
  const cleanArgs = map(args, arg => cleanArg(arg, this.doUseCarriageReturns))
  const message = cleanArgs.join(' ')
  assign(logRecord, {
    level: logLevel,
    levelNumber: logLevelNumber,
    message
  })

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
  // Something about using console.log seems to work better for Lambda, allowing multi-line logs to work
  // (Apparently needs carriage-returns instead of newlines)
  this.console.log.apply(console, logArgs)
}

const makeLogArgumentsByLogFormat = {
  'text': makeTextLogArguments,
  'json': makeJsonLogArguments,
}

class AwsLogger {
  constructor(console, {logLevel, doUseCarriageReturns=true, doLogTimestamp=true, logFormat='text'}) {
    this.console = console
    this.logLevel = logLevel
    this.doUseCarriageReturns = doUseCarriageReturns
    this.doLogTimestamp = doLogTimestamp
    const makeLogArguments = makeLogArgumentsByLogFormat[logFormat]
    if (!makeLogArguments) throw new Error(`Unsupported logFormat: ${logFormat}`)
    this.makeLogArguments = makeLogArguments
  }
}
const logMethods = mapValues(logLevelNumbers, (logLevelNumber, logLevel) => makeLogMethod(logLevel, logLevelNumber))
assign(AwsLogger.prototype, logMethods)

exports.AwsLogger = AwsLogger
