const {
  CircularReferenceDetector
} = require('howdju-service-common/lib/util/CircularReferenceDetector')
const {
  logger
} = require('./loggerInitialization')

exports.circularReferenceDetector = new CircularReferenceDetector(logger)