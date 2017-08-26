const moment = require('moment')
const assign = require('lodash/assign')
const concat = require('lodash/concat')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const toString = require('lodash/toString')

const dateFormatString = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

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

const makeContextString = (context) => {
  if (!context) return ''
  map(context, (val, key) => `${key}=${cleanArg(val)}`)
}

const makeLogMethod = (logLevel) => (...args) => {
  const logLevelNumber = logLevelNumbers[logLevel]
  const loggerLevelNumber = logLevelNumbers[this.logLevel]
  if (logLevelNumber > loggerLevelNumber) return

  const cleanArgs = map(args, arg => cleanArg(arg, this.doUseCarriageReturns))
  const loggerArgs = [
    moment.utc().format(dateFormatString),
    logLevel,
  ]
  const contextString = makeContextString(this.context)
  if (contextString) {
    loggerArgs.push(contextString)
  }
  const loggingArgs = concat(loggerArgs, cleanArgs)
  // Something about using console.log seems to work better for Lambda, allowing multi-line logs to work
  // (Apparently needs carriage-returns instead of newlines)
  console.log.apply(console, loggingArgs)
}

class Logger {
  constructor({logLevel}) {
    this.logLevel = logLevel
    this.doUseCarriageReturns = true
  }
}
const logMethods = mapValues(logLevelNumbers, (n, logLevel) => makeLogMethod(logLevel))
assign(Logger.prototype, logMethods)

module.exports = Logger