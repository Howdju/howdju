const moment = require("moment");

exports.PgTypeOids = {
  TIMESTAMPTZ: 1184,
  TIMESTAMP: 1114,
};

exports.makeTimestampToUtcMomentParser = (logger) => (val) => {
  if (!val) return val;

  try {
    // Interpret database timestamps as UTC
    return moment.utc(val);
  } catch (err) {
    logger.error(`Error parsing timestamp type with moment`, { err });
  }

  return val;
};
