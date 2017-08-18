const moment = require('moment')
const isDate = require('lodash/isDate')
const isString = require('lodash/isString')
const {logger} = require('../logger')


const formatString = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

module.exports.toUtc = val => {
  if (isDate(val)) {
    return moment.utc(val).format(formatString)
  }
  if (moment.isMoment(val)) {
    return val.utc().format(formatString)
  }

  return val
}

module.exports.parseUtcTimestamp = val => {
  if (!val) return val

  if (isDate(val) || isString(val)) {
    try {
      // Interpret database timestamps as UTC
      return moment.utc(val)
    } catch (ex) {
      logger.error(`Error parsing timestamp type with moment`, ex)
    }
  }

  return val
}
