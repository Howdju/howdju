const {parseUtcTimestamp} = require('./util')

const TIMESTAMPTZ_OID = 1184
const TIMESTAMP_OID = 1114

module.exports = types => {
  types.setTypeParser(TIMESTAMP_OID, parseUtcTimestamp)
}
