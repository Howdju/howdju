const moment = require('moment')

const TIMESTAMPTZ_OID = 1184
const TIMESTAMP_OID = 1114

const parseUtcDate = val => {
  if (!val) return val
  const m = moment.utc(val)
  const d = m.toDate()
  return d
}

module.exports = types => {
  types.setTypeParser(TIMESTAMP_OID, parseUtcDate)
}