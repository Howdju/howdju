const moment = require('moment')
const pg = require('pg')
const isDate = require('lodash/isDate')
const isString = require('lodash/isString')


const pgTypeOids = {
  TIMESTAMPTZ: 1184,
  TIMESTAMP: 1114,
}

exports.makeTimestampToUtcMomentParser = (logger) => (val) => {
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

exports.setTimestampParser = (parser) => pg.types.setTypeParser(pgTypeOids.TIMESTAMP, parser)